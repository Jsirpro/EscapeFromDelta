import { describe, expect, it } from "vitest";

import { RandomAuditDetails } from "../src/components/RandomAuditDetails";

describe("warehouse and records", () => {
  it("exposes random audit display component", () => {
    expect(RandomAuditDetails).toBeTypeOf("function");
  });
});
