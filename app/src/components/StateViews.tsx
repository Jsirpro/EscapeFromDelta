export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div role="status">{label}</div>;
}

export function EmptyState({ label }: { label: string }) {
  return <div>{label}</div>;
}

export function InvalidAccountState({ label = "Invalid account data" }: { label?: string }) {
  return <div role="alert">{label}</div>;
}

export function WalletRejectedState({ label = "Wallet rejected the transaction." }: { label?: string }) {
  return <div role="alert">{label}</div>;
}

export function TransactionPendingState({ intent }: { intent: string }) {
  return <div role="status">Waiting for wallet approval: {intent}</div>;
}
