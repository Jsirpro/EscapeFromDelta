import { createSummary, type TransactionSummary } from "./summary";

export function buildAdminDifficultySummary(adminWallet: string): TransactionSummary {
  return createSummary({
    intent: "create_difficulty_version",
    cluster: "localnet",
    feePayer: adminWallet,
    programId: process.env.PROGRAM_ID ?? "11111111111111111111111111111111",
    accounts: [adminWallet],
    amounts: [],
  });
}
