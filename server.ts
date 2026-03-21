#!/usr/bin/env bun
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ChzzkClient, ChzzkChat } from "chzzk";
import { dashboardHtml } from "./dashboard.html.ts";
import { toVoteSnapshot } from "./types.ts";
import type { Idea, Vote, VoteOption, ServerMessage, ClientMessage } from "./types.ts";

// ── Load .env from server directory ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
const envFile = await Bun.file(envPath).text().catch(() => "");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

// ── stderr logging (stdout is reserved for MCP stdio) ──
function log(msg: string) {
  process.stderr.write(`[chzzk-ideas] ${msg}\n`);
}

// ── State ──
const ideas: Idea[] = [];
const wsClients = new Set<{ send(data: string): void }>();
let chzzkConnected = false;
let activeVote: Vote | null = null;

// ── 1. MCP Server (channel + tools) ──
const mcp = new Server(
  { name: "chzzk-ideas", version: "1.0.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions: [
      '치지직(Chzzk) 라이브 방송 시청자와 상호작용하는 채널입니다.',
      '시청자가 제안한 아이디어는 <channel source="chzzk-ideas" idea_id="..." nickname="..."> 태그로 도착합니다.',
      '아이디어 내용을 읽고 코딩 작업을 수행해주세요.',
      '',
      '여러 선택지 중 사용자의 결정이 필요할 때는 create_vote 도구를 호출하세요.',
      '투표가 생성되면 시청자들이 채팅에서 "!투표 번호"로 투표합니다.',
      '스트리머가 투표를 종료하면 결과가 channel 알림으로 전달됩니다.',
      '투표 결과를 받으면 가장 많은 표를 받은 선택지를 기반으로 작업을 진행하세요.',
      '',
      '응답은 한국어로 해주세요.',
    ].join(" "),
  }
);

// ── MCP Tool handlers ──
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_vote",
      description:
        "시청자 투표를 생성합니다. 사용자에게 선택지를 제시할 때 이 도구를 호출하세요. " +
        "시청자들이 채팅에서 '!투표 번호'로 투표하고, 스트리머가 투표를 종료하면 결과가 알림으로 전달됩니다.",
      inputSchema: {
        type: "object" as const,
        properties: {
          question: {
            type: "string",
            description: "투표 질문 (예: '어떤 프레임워크를 사용할까요?')",
          },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 9,
            description: "투표 선택지 배열 (2~9개). 순서대로 1번, 2번, ... 이 됩니다.",
          },
        },
        required: ["question", "options"],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "create_vote") {
    return handleCreateVote(args as { question: string; options: string[] });
  }

  return {
    content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// ── 2. Connect MCP over stdio ──
await mcp.connect(new StdioServerTransport());
log("MCP channel connected (stdio)");

// ── 3. Web dashboard (HTTP + WebSocket) ──
const PORT = 8789;

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",

  fetch(req, bunServer) {
    // WebSocket upgrade — must be handled synchronously (not async)
    if (bunServer.upgrade(req)) return undefined;

    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(dashboardHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // API: status
    if (url.pathname === "/status") {
      return Response.json({
        chzzk: chzzkConnected,
        ideas: ideas.length,
        dashboard: wsClients.size,
      });
    }

    // API: test idea injection
    if (url.pathname === "/test-idea" && req.method === "POST") {
      return req.text().then((body) => {
        const ideaText = body.trim();
        if (!ideaText) {
          return Response.json({ error: "empty body" }, { status: 400 });
        }
        const idea: Idea = {
          id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nickname: "테스트유저",
          userIdHash: "test-hash",
          message: `!아이디어 ${ideaText}`,
          ideaText,
          timestamp: Date.now(),
          selected: false,
          sentToClaude: false,
        };
        ideas.push(idea);
        broadcastToDashboard({ type: "new_idea", idea });
        log(`Test idea added: ${ideaText}`);
        return Response.json({ ok: true, id: idea.id });
      });
    }

    // API: test vote creation
    if (url.pathname === "/test-create-vote" && req.method === "POST") {
      return req.json().then((body: any) => {
        const result = handleCreateVote({
          question: body.question || "어떤 것을 선택할까요?",
          options: body.options || ["옵션 1", "옵션 2", "옵션 3"],
        });
        return Response.json({ ok: true, result });
      });
    }

    // API: test vote
    if (url.pathname === "/test-vote" && req.method === "POST") {
      return req.text().then((body) => {
        const userHash = `test-${Math.random().toString(36).slice(2, 8)}`;
        const optionNum = parseInt(body.trim(), 10);
        if (isNaN(optionNum)) {
          return Response.json({ error: "invalid option number" }, { status: 400 });
        }
        handleVoteChatMessage(userHash, "테스트유저", optionNum);
        return Response.json({ ok: true });
      });
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      wsClients.add(ws);
      // Send current state
      ws.send(JSON.stringify({ type: "ideas", ideas } satisfies ServerMessage));
      ws.send(
        JSON.stringify({
          type: "status",
          chzzk: chzzkConnected,
          dashboard: wsClients.size,
        } satisfies ServerMessage)
      );
      // Send active vote if exists
      if (activeVote?.active) {
        ws.send(
          JSON.stringify({
            type: "vote_created",
            vote: toVoteSnapshot(activeVote),
          } satisfies ServerMessage)
        );
      }
      log(`Dashboard connected (total: ${wsClients.size})`);
    },

    message(ws, raw) {
      try {
        const msg: ClientMessage = JSON.parse(String(raw));
        if (msg.type === "select_idea") {
          handleSelectIdea(msg.id);
        } else if (msg.type === "clear_ideas") {
          ideas.length = 0;
          broadcastToDashboard({ type: "clear_ideas" });
          log("All ideas cleared");
        } else if (msg.type === "end_vote") {
          handleEndVote();
        }
      } catch {
        log(`Invalid WS message: ${String(raw)}`);
      }
    },

    close(ws) {
      wsClients.delete(ws);
      log(`Dashboard disconnected (total: ${wsClients.size})`);
    },
  },
});

log(`Dashboard: http://127.0.0.1:${PORT}`);
log(`OBS overlay: http://127.0.0.1:${PORT}/?obs=true`);

// ── Graceful shutdown ──
function shutdown() {
  log("Shutting down...");
  server.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ── 4. Chzzk chat listener ──
const NID_AUT = process.env.NID_AUT;
const NID_SES = process.env.NID_SES;
const CHANNEL_ID = process.env.CHZZK_CHANNEL_ID;

if (!CHANNEL_ID) {
  log("WARNING: CHZZK_CHANNEL_ID not set in .env - chat listener disabled");
} else {
  const client = new ChzzkClient({
    nidAuth: NID_AUT,
    nidSession: NID_SES,
  });

  try {
    const liveDetail = await client.live.detail(CHANNEL_ID);
    if (!liveDetail?.chatChannelId) {
      log("WARNING: Could not get chat channel ID. Is the stream live?");
    } else {
      const chat = client.chat({
        chatChannelId: liveDetail.chatChannelId,
        channelId: CHANNEL_ID,
      });

      chat.on("connect", () => {
        chzzkConnected = true;
        log("Chzzk chat connected");
        broadcastStatus();
      });

      chat.on("disconnect", () => {
        chzzkConnected = false;
        log("Chzzk chat disconnected");
        broadcastStatus();
      });

      chat.on("reconnect", () => {
        chzzkConnected = true;
        log("Chzzk chat reconnected");
        broadcastStatus();
      });

      chat.on("chat", (event) => {
        if (event.hidden || event.isRecent) return;

        const message = event.message;

        // ── Vote handling ──
        const VOTE_PREFIX = "!투표";
        if (message.startsWith(VOTE_PREFIX)) {
          const arg = message.slice(VOTE_PREFIX.length).trim();
          const optionNum = parseInt(arg, 10);
          if (!isNaN(optionNum) && optionNum >= 1 && optionNum <= 9) {
            handleVoteChatMessage(
              event.profile.userIdHash,
              event.profile.nickname,
              optionNum
            );
          }
          return;
        }

        // ── Idea handling ──
        const PREFIX = "!아이디어";
        if (!message.startsWith(PREFIX)) return;

        const ideaText = message.slice(PREFIX.length).trim();
        if (!ideaText) return;

        const idea: Idea = {
          id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nickname: event.profile.nickname,
          userIdHash: event.profile.userIdHash,
          message,
          ideaText,
          timestamp: event.time || Date.now(),
          selected: false,
          sentToClaude: false,
        };

        ideas.push(idea);
        broadcastToDashboard({ type: "new_idea", idea });
        log(`New idea from ${idea.nickname}: ${idea.ideaText}`);
      });

      await chat.connect();
    }
  } catch (err) {
    log(`Chzzk connection error: ${err}`);
  }
}

// ── Core functions ──

async function handleSelectIdea(id: string) {
  const idea = ideas.find((i) => i.id === id);
  if (!idea) {
    log(`Idea not found: ${id}`);
    return;
  }

  if (idea.sentToClaude) {
    log(`Idea already sent: ${id}`);
    return;
  }

  idea.selected = true;
  idea.sentToClaude = true;

  try {
    await mcp.notification({
      method: "notifications/claude/channel",
      params: {
        content: `시청자 아이디어: ${idea.ideaText}\n\n제안자: ${idea.nickname}`,
        meta: {
          idea_id: idea.id,
          nickname: idea.nickname,
        },
      },
    });
    log(`Idea sent to Claude: [${idea.nickname}] ${idea.ideaText}`);
  } catch (err) {
    log(`Failed to send idea to Claude: ${err}`);
    idea.sentToClaude = false;
    idea.selected = false;
  }

  broadcastToDashboard({ type: "idea_selected", id });
}

// ── Vote functions ──

function handleCreateVote(args: { question: string; options: string[] }) {
  if (activeVote?.active) {
    activeVote.active = false;
  }

  const options: VoteOption[] = args.options.map((label, i) => ({
    index: i + 1,
    label,
  }));

  const votes: Record<number, number> = {};
  for (const opt of options) {
    votes[opt.index] = 0;
  }

  activeVote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: args.question,
    options,
    votes,
    voters: new Set(),
    createdAt: Date.now(),
    active: true,
  };

  broadcastToDashboard({
    type: "vote_created",
    vote: toVoteSnapshot(activeVote),
  });
  log(`Vote created: ${args.question} (${args.options.length} options)`);

  return {
    content: [
      {
        type: "text" as const,
        text:
          `투표가 생성되었습니다: "${args.question}"\n` +
          `선택지: ${options.map((o) => `${o.index}. ${o.label}`).join(", ")}\n` +
          `시청자들이 '!투표 번호'로 투표합니다. 스트리머가 종료하면 결과가 전달됩니다.`,
      },
    ],
  };
}

function handleVoteChatMessage(
  userIdHash: string,
  nickname: string,
  optionNum: number
) {
  if (!activeVote?.active) return;
  if (activeVote.voters.has(userIdHash)) {
    log(`Duplicate vote blocked: ${nickname}`);
    return;
  }
  if (!activeVote.votes.hasOwnProperty(optionNum)) return;

  activeVote.voters.add(userIdHash);
  activeVote.votes[optionNum]++;

  broadcastToDashboard({
    type: "vote_updated",
    vote: toVoteSnapshot(activeVote),
  });
  log(
    `Vote from ${nickname}: option ${optionNum} (${activeVote.options[optionNum - 1]?.label})`
  );
}

async function handleEndVote() {
  if (!activeVote?.active) return;

  activeVote.active = false;

  const snapshot = toVoteSnapshot(activeVote);

  let winnerIndex = 1;
  let maxVotes = 0;
  for (const [idx, count] of Object.entries(activeVote.votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerIndex = Number(idx);
    }
  }
  const winnerLabel =
    activeVote.options.find((o) => o.index === winnerIndex)?.label ?? "";

  broadcastToDashboard({
    type: "vote_ended",
    vote: snapshot,
    winnerIndex,
    winnerLabel,
  });

  const resultLines = activeVote.options.map(
    (o) => `  ${o.index}. ${o.label}: ${activeVote!.votes[o.index]}표`
  );

  try {
    await mcp.notification({
      method: "notifications/claude/channel",
      params: {
        content:
          `투표 결과: "${activeVote.question}"\n` +
          resultLines.join("\n") +
          `\n\n결과: ${winnerIndex}번 "${winnerLabel}" (${maxVotes}표)` +
          `\n총 투표 수: ${snapshot.totalVotes}명`,
        meta: {
          vote_id: activeVote.id,
          winner_index: String(winnerIndex),
          winner_label: winnerLabel,
          total_votes: String(snapshot.totalVotes),
        },
      },
    });
    log(`Vote result sent to Claude: winner=${winnerIndex} "${winnerLabel}"`);
  } catch (err) {
    log(`Failed to send vote result: ${err}`);
  }
}

function broadcastToDashboard(msg: ServerMessage) {
  const data = JSON.stringify(msg);
  for (const ws of wsClients) {
    try {
      ws.send(data);
    } catch {
      wsClients.delete(ws);
    }
  }
}

function broadcastStatus() {
  broadcastToDashboard({
    type: "status",
    chzzk: chzzkConnected,
    dashboard: wsClients.size,
  });
}
