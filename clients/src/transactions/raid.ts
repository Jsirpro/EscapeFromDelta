import { createSummary, type TransactionSummary } from "./summary";

export type RaidInstruction =
  | "start_raid"
  | "select_safe_case_items"
  | "open_container"
  | "fight_enemy"
  | "move_area"
  | "extract_raid"
  | "settle_failed_raid";

export function buildRaidActionSummary(intent: RaidInstruction, playerWallet: string): TransactionSummary {
  return createSummary({
    intent,
    cluster: "localnet",
    feePayer: playerWallet,
    programId: process.env.PROGRAM_ID ?? "11111111111111111111111111111111",
    accounts: [playerWallet],
    amounts: [],
  });
}
