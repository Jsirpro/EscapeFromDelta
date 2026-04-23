import { SOL_TO_EDCOINS_RATE } from "../types";
import { createSummary, type Cluster, type TransactionSummary } from "./summary";

interface ConvertSolToEdcoinsInput {
  cluster: Cluster;
  feePayer: string;
  programId: string;
  playerWallet: string;
  solAmount: bigint;
}

export function calculateEdcoinsCredit(solAmount: bigint): bigint {
  if (solAmount <= 0n) {
    throw new Error("zero-sol-amount");
  }
  return solAmount * SOL_TO_EDCOINS_RATE;
}

export function buildConvertSolToEdcoinsSummary(input: ConvertSolToEdcoinsInput): TransactionSummary {
  const credit = calculateEdcoinsCredit(input.solAmount);
  return createSummary({
    intent: "convert_sol_to_edcoins",
    cluster: input.cluster,
    feePayer: input.feePayer,
    programId: input.programId,
    accounts: [input.playerWallet],
    amounts: [
      { label: "SOL debit", value: input.solAmount.toString() },
      { label: "EDcoins credit", value: credit.toString() },
    ],
  });
}
