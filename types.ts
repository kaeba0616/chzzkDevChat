export interface Idea {
  id: string;
  nickname: string;
  userIdHash: string;
  message: string;
  ideaText: string;
  timestamp: number;
  selected: boolean;
  sentToClaude: boolean;
}

// ── Vote types ──
export interface VoteOption {
  index: number;
  label: string;
}

export interface Vote {
  id: string;
  question: string;
  options: VoteOption[];
  votes: Record<number, number>;
  voters: Set<string>;
  createdAt: number;
  active: boolean;
}

export interface VoteSnapshot {
  id: string;
  question: string;
  options: VoteOption[];
  votes: Record<number, number>;
  voterCount: number;
  totalVotes: number;
  createdAt: number;
  active: boolean;
}

export function toVoteSnapshot(vote: Vote): VoteSnapshot {
  return {
    id: vote.id,
    question: vote.question,
    options: vote.options,
    votes: { ...vote.votes },
    voterCount: vote.voters.size,
    totalVotes: Object.values(vote.votes).reduce((a, b) => a + b, 0),
    createdAt: vote.createdAt,
    active: vote.active,
  };
}

// Dashboard ← Server
export type ServerMessage =
  | { type: "ideas"; ideas: Idea[] }
  | { type: "new_idea"; idea: Idea }
  | { type: "idea_selected"; id: string }
  | { type: "status"; chzzk: boolean; dashboard: number }
  | { type: "clear_ideas" }
  | { type: "vote_created"; vote: VoteSnapshot }
  | { type: "vote_updated"; vote: VoteSnapshot }
  | { type: "vote_ended"; vote: VoteSnapshot; winnerIndex: number; winnerLabel: string };

// Dashboard → Server
export type ClientMessage =
  | { type: "select_idea"; id: string }
  | { type: "clear_ideas" }
  | { type: "end_vote" };
