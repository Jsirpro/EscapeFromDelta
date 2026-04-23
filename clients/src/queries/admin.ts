export function isAuthorizedAdmin(wallet: string, adminWallet: string): boolean {
  return wallet === adminWallet;
}
