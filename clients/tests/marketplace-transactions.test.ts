import { describe, expect, it } from "vitest";

import { buildMarketplaceSummary } from "../src/transactions/marketplace";

describe("marketplace transaction builders", () => {
  it("summarizes listing fee and purchase custody intent", () => {
    const summary = buildMarketplaceSummary("create_listing", "seller", 1000n);
    expect(summary.amounts).toContainEqual({ label: "listing fee", value: "30" });
  });
});
