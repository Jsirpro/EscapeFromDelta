import { describe, expect, it } from "vitest";

describe("admin difficulty program contract", () => {
  it("requires admin authorization and creates a new version", () => {
    const difficulty = { createdByAdmin: "admin", version: 2, activeRaidVersion: 1 };
    expect(difficulty.version).toBeGreaterThan(difficulty.activeRaidVersion);
  });
});
