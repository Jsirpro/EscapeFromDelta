import { fetchBattleRecordsByWallet } from "../src/queries/localnet";
import { DEFAULT_RECORD_LIMIT } from "../src/types";

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]?.replace(/^--/, "");
  const value = process.argv[index + 1];
  if (key && value) args.set(key, value);
}

const wallet = args.get("wallet");
if (!wallet) {
  console.error("missing --wallet");
  process.exit(1);
}

const limit = Number(args.get("limit") ?? DEFAULT_RECORD_LIMIT);
const format = args.get("format") ?? "table";
const cluster = args.get("cluster") ?? "localnet";
const programId = process.env.PROGRAM_ID ?? "11111111111111111111111111111111";
let records = [];
let invalidRecords: Array<{ error: string }> = [];

try {
  records = await fetchBattleRecordsByWallet(wallet, programId, limit);
} catch (error: unknown) {
  invalidRecords = [{ error: error instanceof Error ? error.message : "unknown-error" }];
}

const payload = {
  wallet,
  cluster,
  limit,
  records: records.map((entry) => entry.record),
  invalidRecords,
};

if (format === "json") {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`wallet\t${payload.wallet}`);
  console.log(`records\t${payload.records.length}`);
  for (const record of payload.records) {
    console.log(`${record.raidId}\t${record.result}\tretained=${record.retainedAssets.length}\tlost=${record.lostAssets.length}`);
  }
}
