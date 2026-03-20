#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ChzzkClient, ChzzkChat } from "chzzk";
import { dashboardHtml } from "./dashboard.html.ts";
import type { Idea, ServerMessage, ClientMessage } from "./types.ts";

// ── stderr logging (stdout is reserved for MCP stdio) ──
function log(msg: string) {
  process.stderr.write(`[chzzk-ideas] ${msg}\n`);
}

// ── State ──
const ideas: Idea[] = [];
const wsClients = new Set<{ send(data: string): void }>();
let chzzkConnected = false;

// ── 1. MCP Server (channel) ──
const mcp = new Server(
  { name: "chzzk-ideas", version: "1.0.0" },
  {
    capabilities: { experimental: { "claude/channel": {} } },
    instructions: [
      '치지직(Chzzk) 라이브 방송 시청자 아이디어 채널입니다.',
      '이벤트는 <channel source="chzzk-ideas" idea_id="..." nickname="..."> 태그로 도착합니다.',
      '시청자가 제안한 아이디어를 스트리머가 선택하면 전달됩니다.',
      '아이디어 내용을 읽고 코딩 작업을 수행해주세요.',
      '응답은 한국어로 해주세요.',
    ].join(" "),
  }
);

// ── 2. Connect MCP over stdio ──
await mcp.connect(new StdioServerTransport());
log("MCP channel connected (stdio)");

// ── 3. Web dashboard (HTTP + WebSocket) ──
const PORT = 8789;

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",

  fetch(req, server) {
    // WebSocket upgrade
    if (server.upgrade(req)) return undefined;

    // Serve dashboard HTML
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

  // Send to Claude Code via MCP channel notification
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
