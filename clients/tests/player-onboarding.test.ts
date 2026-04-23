import { describe, expect, it } from "vitest";

import { buildCreateOrConnectPlayerSummary } from "../src/transactions/player";

describe("player onboarding transaction builder", () => {
  it("summarizes player profile creation and starter grant", () => {
    const summary = buildCreateOrConnectPlayerSummary({
      cluster: "localnet",
      feePayer: "player",
      programId: "program",
      playerWallet: "player",
    });

    expect(summary.intent).toBe("create_or_connect_player");
    expect(summary.amounts.some((amount) => amount.label === "starter EDcoins")).toBe(true);
    expect(summary.simulation.ok).toBe(false);
  });
});
