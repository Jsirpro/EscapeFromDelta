import { describe, expect, it } from "vitest";

import { validateDifficultyForm } from "../src/components/DifficultyForm";

describe("admin route", () => {
  it("rejects invalid difficulty form values", () => {
    expect(validateDifficultyForm({ entryFee: -1, low: 10, medium: 30, high: 50 })).toBe(false);
  });
});
