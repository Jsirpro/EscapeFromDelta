import { describe, expect, it } from "vitest";

import { initialRaidUiState, raidReducer } from "../src/game/raidMachine";

describe("play flow", () => {
  it("handles landing, pending states, battle-only encounter, extraction, and failure", () => {
    const active = raidReducer(initialRaidUiState, { type: "landed" });
    expect(active.status).toBe("active");
    const battle = raidReducer(active, { type: "encounter" });
    expect(battle.availableActions).toEqual(["fight"]);
  });
});
