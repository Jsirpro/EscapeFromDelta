import { describe, expect, it } from "vitest";

import { battleWinChance, safeCaseRetained } from "../../clients/src/queries/raid";

describe("raid settlement program contract", () => {
  it("applies battle caps, auto defeat, degradation, extraction, timeout, and safe-case retention", () => {
    expect(battleWinChance(30, 10, 20)).toBe(0);
    expect(battleWinChance(60, 50, 1)).toBe(85);
    expect(safeCaseRetained(["a", "b", "c", "d"], ["a", "b"], 2)).toEqual(["a", "b"]);
  });
});
