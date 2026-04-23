import { describe, expect, it } from "vitest";

import { listingFeePreview } from "../src/components/ListingForm";

describe("marketplace", () => {
  it("previews rounded-up listing fees", () => {
    expect(listingFeePreview(101n)).toBe(4n);
  });
});
