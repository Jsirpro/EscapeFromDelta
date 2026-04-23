import { describe, expect, it } from "vitest";

import { buildAdminDifficultySummary } from "../src/transactions/admin";

describe("admin difficulty transaction builders", () => {
  it("summarizes create difficulty version", () => {
    expect(buildAdminDifficultySummary("admin").intent).toBe("create_difficulty_version");
  });
});
