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

// Dashboard ← Server
export type ServerMessage =
  | { type: "ideas"; ideas: Idea[] }
  | { type: "new_idea"; idea: Idea }
  | { type: "idea_selected"; id: string }
  | { type: "status"; chzzk: boolean; dashboard: number }
  | { type: "clear_ideas" };

// Dashboard → Server
export type ClientMessage =
  | { type: "select_idea"; id: string }
  | { type: "clear_ideas" };
