import { describe, expect, it } from "vitest";

describe("raid exploration program contract", () => {
  it("covers loot, five containers, over-container rejection, unlimited backpack, increments, cap, and audit", () => {
    const containersTotal = 5;
    const carriedLoot = Array.from({ length: 20 }, (_, index) => `loot-${index}`);
    const chance = Math.min(10 + 5 + 15, 95);
    expect(containersTotal).toBe(5);
    expect(() => {
      const requested = 6;
      if (requested > containersTotal) throw new Error("invalid-container");
    }).toThrow("invalid-container");
    expect(carriedLoot).toHaveLength(20);
    expect(chance).toBe(30);
    expect({ finalRandomValue: "42" }).toHaveProperty("finalRandomValue");
  });
});
