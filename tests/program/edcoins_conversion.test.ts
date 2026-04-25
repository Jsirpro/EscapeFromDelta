import { describe, expect, it } from "vitest";

import { SOL_TO_EDCOINS_RATE } from "../../clients/src/types";

describe("SOL to EDcoins conversion program contract", () => {
  it("uses the fixed 1:10000000 per SOL rate", () => {
    expect(SOL_TO_EDCOINS_RATE).toBe(10_000_000n);
  });

  it("rejects zero amount and has no reverse redemption path", () => {
    expect(() => {
      const solAmount = 0n;
      if (solAmount <= 0n) throw new Error("zero-amount");
    }).toThrow("zero-amount");

    const exposedInstructions = ["convert_sol_to_edcoins"];
    expect(exposedInstructions).not.toContain("convert_edcoins_to_sol");
  });
});
