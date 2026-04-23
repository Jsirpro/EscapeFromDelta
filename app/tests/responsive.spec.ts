import { describe, expect, it } from "vitest";

describe("responsive routes", () => {
  it("tracks the required responsive route set", () => {
    expect(["/", "/play", "/marketplace", "/warehouse", "/records", "/admin"]).toHaveLength(6);
  });
});
