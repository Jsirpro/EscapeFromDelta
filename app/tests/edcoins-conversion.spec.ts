import { describe, expect, it } from "vitest";

import { previewEdcoinsCredit } from "../src/components/EdcoinsConversionPanel";

describe("EDcoins conversion panel", () => {
  it("previews the fixed 1:10000 conversion rate and no redemption action", () => {
    expect(previewEdcoinsCredit(3n)).toBe(30_000n);
    expect(["convert_sol_to_edcoins"]).not.toContain("convert_edcoins_to_sol");
  });
});
