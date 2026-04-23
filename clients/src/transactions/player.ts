import { createSummary, type Cluster, type TransactionSummary } from "./summary";

interface CreateOrConnectPlayerInput {
  cluster: Cluster;
  feePayer: string;
  programId: string;
  playerWallet: string;
}

export function buildCreateOrConnectPlayerSummary(input: CreateOrConnectPlayerInput): TransactionSummary {
  return createSummary({
    intent: "create_or_connect_player",
    cluster: input.cluster,
    feePayer: input.feePayer,
    programId: input.programId,
    accounts: [input.playerWallet],
    amounts: [
      { label: "starter EDcoins", value: "20000" },
      { label: "armor-point balance", value: "20.0" },
      { label: "weapon-point balance", value: "20.0" },
    ],
  });
}
