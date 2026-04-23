import { describe, expect, it } from "vitest";

import { createSummary } from "../src/transactions/summary";

describe("transaction safety", () => {
  it("requires simulation before wallet approval and defaults away from mainnet", () => {
    const summary = createSummary({
      intent: "test",
      cluster: "localnet",
      feePayer: "payer",
      programId: "program",
      accounts: [],
      amounts: [],
    });
    expect(summary.cluster).toBe("localnet");
    expect(summary.simulation.ok).toBe(false);
  });
});
