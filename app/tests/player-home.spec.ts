import { describe, expect, it } from "vitest";

import { getCharacterTier } from "../src/components/PlayerCharacter";

describe("player home", () => {
  it("maps armor-point balance and weapon-point balance to visual tiers", () => {
    expect(getCharacterTier(20, 20)).toBe("heavy");
    expect(getCharacterTier(2, 2)).toBe("light");
  });

  it("defines the expected home actions", () => {
    expect(["Play", "Marketplace", "Warehouse", "Battle Records"]).toHaveLength(4);
  });
});
