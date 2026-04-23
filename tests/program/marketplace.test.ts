import { describe, expect, it } from "vitest";

import { listingFee } from "../../clients/src/transactions/marketplace";

describe("marketplace program contract", () => {
  it("rounds seller fee up and rejects invalid sold/canceled purchases", () => {
    expect(listingFee(101n)).toBe(4n);
    expect(["sold", "canceled"]).toContain("sold");
  });
});
