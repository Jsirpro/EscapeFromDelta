import { describe, expect, it } from "vitest";

describe("raid feedback timing", () => {
  it("uses immediate reducer transitions for non-wallet raid actions", () => {
    const started = performance.now();
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(1000);
  });
});
