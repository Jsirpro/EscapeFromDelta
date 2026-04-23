import { describe, expect, it } from "vitest";

import { decodeBattleRecord } from "../src/queries/battleRecords";
import { PROGRAM_ID, battleRecordFixture } from "../../tests/fixtures/game-fixtures";

describe("battle record query", () => {
  it("validates difficulty version and random audit data", () => {
    const record = decodeBattleRecord({ owner: PROGRAM_ID, data: battleRecordFixture }, PROGRAM_ID);
    expect(record.difficultyVersion).toBe(1);
    expect(record.randomEvents[0]?.finalRandomValue).toBe("42");
  });
});
