import type { BattleRecord } from "../types";
import { decodeJsonAccount, requireArray, requireNumber, requireString } from "./decoders";

export function decodeBattleRecord(account: { owner: string; data: unknown }, programId: string): BattleRecord {
  return decodeJsonAccount(account, programId, (value) => {
    const randomEvents = requireArray(value.randomEvents, "randomEvents");
    if (randomEvents.some((event) => typeof event !== "object" || event === null || !("finalRandomValue" in event))) {
      throw new Error("missing_random_audit_data");
    }
    return {
      schemaVersion: 1,
      recordId: requireString(value.recordId, "recordId"),
      playerProfile: requireString(value.playerProfile, "playerProfile") as BattleRecord["playerProfile"],
      raidId: requireString(value.raidId, "raidId"),
      difficultyId: requireString(value.difficultyId, "difficultyId"),
      difficultyVersion: requireNumber(value.difficultyVersion, "difficultyVersion"),
      result: requireString(value.result, "result") as BattleRecord["result"],
      retainedAssets: requireArray(value.retainedAssets, "retainedAssets") as BattleRecord["retainedAssets"],
      lostAssets: requireArray(value.lostAssets, "lostAssets") as BattleRecord["lostAssets"],
      randomEvents: randomEvents as BattleRecord["randomEvents"],
    };
  });
}
