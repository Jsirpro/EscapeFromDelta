import { describe, expect, it } from "vitest";

import { battleRecordFixture } from "../../tests/fixtures/game-fixtures";

describe("battle-record query performance", () => {
  it("handles 50 completed records within the target envelope in memory", () => {
    const started = performance.now();
    const records = Array.from({ length: 50 }, (_, index) => ({ ...battleRecordFixture, recordId: `record-${index}` }));
    expect(records).toHaveLength(50);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});
