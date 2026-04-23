export type Cluster = "localnet" | "devnet";

export interface SimulationResult {
  ok: boolean;
  logs: string[];
  error?: string;
}

export interface TransactionSummary {
  intent: string;
  cluster: Cluster;
  feePayer: string;
  programId: string;
  accounts: string[];
  amounts: Array<{ label: string; value: string }>;
  simulation: SimulationResult;
}

export function requireSuccessfulSimulation(summary: TransactionSummary): TransactionSummary {
  if (!summary.simulation.ok) {
    throw new Error(`simulation-failed: ${summary.simulation.error ?? "unknown"}`);
  }
  return summary;
}

export function createSummary(input: Omit<TransactionSummary, "simulation">): TransactionSummary {
  return {
    ...input,
    simulation: {
      ok: false,
      logs: [],
      error: "simulation-required-before-wallet-approval",
    },
  };
}
