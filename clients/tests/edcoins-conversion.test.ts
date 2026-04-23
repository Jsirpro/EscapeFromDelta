import { describe, expect, it } from "vitest";

import { buildConvertSolToEdcoinsSummary } from "../src/transactions/conversion";

describe("SOL to EDcoins transaction builder", () => {
  it("shows conversion amount and requires simulation", () => {
    const summary = buildConvertSolToEdcoinsSummary({
      cluster: "localnet",
      feePayer: "player",
      programId: "program",
      playerWallet: "player",
      solAmount: 2n,
    });

    expect(summary.amounts).toContainEqual({ label: "EDcoins credit", value: "20000" });
    expect(summary.simulation.error).toBe("simulation-required-before-wallet-approval");
  });
});
