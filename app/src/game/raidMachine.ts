export type RaidUiStatus = "preparing" | "transitioning" | "active" | "pending_battle" | "succeeded" | "failed";

export interface RaidUiState {
  status: RaidUiStatus;
  currentArea: "low" | "medium" | "high";
  availableActions: string[];
}

export type RaidUiAction =
  | { type: "start" }
  | { type: "landed" }
  | { type: "encounter" }
  | { type: "win" }
  | { type: "extract" }
  | { type: "fail" }
  | { type: "move"; area: "low" | "medium" | "high" };

export const initialRaidUiState: RaidUiState = {
  status: "preparing",
  currentArea: "low",
  availableActions: ["start"],
};

export function raidReducer(state: RaidUiState, action: RaidUiAction): RaidUiState {
  switch (action.type) {
    case "start":
      return { ...state, status: "transitioning", availableActions: [] };
    case "landed":
      return { ...state, status: "active", currentArea: "low", availableActions: ["open", "move", "extract"] };
    case "encounter":
      return { ...state, status: "pending_battle", availableActions: ["fight"] };
    case "win":
      return { ...state, status: "active", availableActions: ["open", "move", "extract"] };
    case "extract":
      return { ...state, status: "succeeded", availableActions: [] };
    case "fail":
      return { ...state, status: "failed", availableActions: [] };
    case "move":
      return { ...state, currentArea: action.area };
  }
}
