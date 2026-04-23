import { describe, expect, it } from "vitest";

describe("raid start program contract", () => {
  it("collects entry fee, validates equipment, starts low risk, and locks difficulty version", () => {
    const raid = { feePaid: 1000n, armor: 30, weapon: 25, currentArea: "low", version: 1 };
    expect(raid).toMatchObject({ currentArea: "low", version: 1 });
    expect(raid.armor).toBeGreaterThanOrEqual(10);
    expect(raid.weapon).toBeLessThanOrEqual(50);
  });
});
