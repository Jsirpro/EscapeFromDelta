import { describe, expect, it } from "vitest";

import { buildRaidActionSummary } from "../src/transactions/raid";

describe("raid transaction builders", () => {
  it("summarizes raid start and player actions", () => {
    const summary = buildRaidActionSummary("start_raid", "player");
    expect(summary.intent).toBe("start_raid");
    expect(summary.accounts).toContain("player");
  });
});
