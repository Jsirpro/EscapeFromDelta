"use client";

import { Connection, Transaction } from "@solana/web3.js";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { decodeBattleRecord } from "../../../clients/src/queries/battleRecords";
import { decodePlayerProfile } from "../../../clients/src/queries/player";
import type { BattleRecord, PlayerProfile } from "../../../clients/src/types";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8899";

interface AccountInfoLike {
  owner: string;
  data: Record<string, unknown>;
}

interface BrowserWalletProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
}

interface WalletState {
  walletAddress: string | null;
  connected: boolean;
  connecting: boolean;
  walletError: string | null;
  connectDemoWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  profileAccount: AccountInfoLike | null;
  battleRecordAccounts: AccountInfoLike[];
  profile: PlayerProfile | null;
  battleRecords: BattleRecord[];
  convertDemoSol: (solAmount?: bigint) => void;
  startDemoRaid: () => Promise<void>;
  openDemoContainer: (containerIndex?: number, finalRandomValue?: number) => Promise<void>;
  fightDemoEnemy: () => Promise<void>;
  moveDemoArea: (area: "low" | "medium" | "high") => Promise<void>;
  settleDemoRaid: (result: "succeeded" | "failed") => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

function createPlayerAccount(walletAddress: string): AccountInfoLike {
  return {
    owner: PROGRAM_ID,
    data: {
      schemaVersion: 1,
      wallet: walletAddress,
      grantClaimed: true,
      edcoinsBalance: 20_000,
      armorPointBalance: 200,
      weaponPointBalance: 200,
      warehouseNonce: 1,
      nextRaidId: 1,
      activeRaid: undefined,
    },
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [profileAccounts, setProfileAccounts] = useState<Record<string, AccountInfoLike>>({});
  const [battleRecordAccounts] = useState<Record<string, AccountInfoLike[]>>({});
  const [walletProvider, setWalletProvider] = useState<BrowserWalletProvider | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const value = useMemo<WalletState>(() => {
    const profileAccount = walletAddress ? profileAccounts[walletAddress] ?? null : null;
    const recordAccounts = walletAddress ? battleRecordAccounts[walletAddress] ?? [] : [];

    return {
      walletAddress,
      connected: walletAddress !== null,
      connecting,
      walletError,
      connectDemoWallet: async () => {
        if (connecting) return;
        setConnecting(true);
        setWalletError(null);
        try {
          const browserWallet = getBrowserWallet();
          if (!browserWallet) {
            setWalletError("Phantom wallet was not detected. Open this app through http://127.0.0.1:3000 or https, and enable the Phantom extension.");
            return;
          }

          const response = await browserWallet.connect({ onlyIfTrusted: false });
          const nextWallet = response.publicKey?.toBase58() ?? browserWallet.publicKey?.toBase58();
          if (!nextWallet) {
            throw new Error("wallet-connect-failed");
          }
          const connectResult = await sendWalletTransaction(
            "/api/tx/connect",
            nextWallet,
            browserWallet,
            {},
            { waitForConfirmation: false },
          );
          setWalletProvider(browserWallet);
          setWalletAddress(nextWallet);

          const connection = new Connection(RPC_URL, "confirmed");
          void waitForSignatureStatus(connection, connectResult.signature, connectResult.lastValidBlockHeight)
            .then(() => {
              setProfileAccounts((current) =>
                current[nextWallet] ? current : { ...current, [nextWallet]: createPlayerAccount(nextWallet) },
              );
            })
            .catch((error) => {
              setWalletError(error instanceof Error ? error.message : "wallet-initialization-failed");
            });
        } catch (error) {
          setWalletError(error instanceof Error ? error.message : "wallet-connect-failed");
        } finally {
          setConnecting(false);
        }
      },
      disconnect: async () => {
        setWalletError(null);
        if (walletProvider) {
          await walletProvider.disconnect();
        }
        setWalletProvider(null);
        setWalletAddress(null);
      },
      profileAccount,
      battleRecordAccounts: recordAccounts,
      profile: profileAccount ? decodePlayerProfile(profileAccount, PROGRAM_ID) : null,
      battleRecords: recordAccounts.map((account) => decodeBattleRecord(account, PROGRAM_ID)),
      convertDemoSol: (solAmount = 1n) => {
        if (!walletAddress || solAmount <= 0n) return;
        setProfileAccounts((current) => {
          const profile = current[walletAddress];
          if (!profile) return current;
          return {
            ...current,
            [walletAddress]: {
              ...profile,
              data: {
                ...profile.data,
                edcoinsBalance: Number(profile.data.edcoinsBalance) + Number(solAmount * 10_000n),
              },
            },
          };
        });
      },
      startDemoRaid: async () => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(setWalletError, "/api/tx/start", walletAddress, walletProvider);
      },
      openDemoContainer: async (containerIndex = 0, finalRandomValue = 5) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(setWalletError, "/api/tx/open", walletAddress, walletProvider, { containerIndex, finalRandomValue });
      },
      fightDemoEnemy: async () => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(setWalletError, "/api/tx/fight", walletAddress, walletProvider);
      },
      moveDemoArea: async (area) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(setWalletError, "/api/tx/move", walletAddress, walletProvider, { area });
      },
      settleDemoRaid: async (result) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(
          setWalletError,
          result === "succeeded" ? "/api/tx/extract" : "/api/tx/fail",
          walletAddress,
          walletProvider,
        );
      },
    };
  }, [battleRecordAccounts, profileAccounts, walletAddress, walletProvider, walletError, connecting]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletState(): WalletState {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("WalletProvider is missing");
  }
  return value;
}

function getBrowserWallet(): BrowserWalletProvider | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & {
    phantom?: { solana?: BrowserWalletProvider };
    solana?: BrowserWalletProvider;
  };
  const provider = browserWindow.phantom?.solana ?? browserWindow.solana;
  if (!provider?.isPhantom) return null;
  return provider;
}

async function sendWalletTransaction(
  path: string,
  player: string,
  provider: BrowserWalletProvider,
  extraPayload: Record<string, unknown> = {},
  options: { waitForConfirmation?: boolean } = {},
) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ player, ...extraPayload }),
  });
  const payload = (await response.json()) as {
    serializedTransaction?: string;
    blockhash?: string;
    lastValidBlockHeight?: number;
    error?: string;
  };
  if (!response.ok || !payload.serializedTransaction) {
    throw new Error(payload.error ?? "transaction-build-failed");
  }

  const transaction = Transaction.from(decodeBase64(payload.serializedTransaction));
  const connection = new Connection(RPC_URL, "confirmed");

  if (provider.signTransaction) {
    const signedTransaction = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
    });
    if (options.waitForConfirmation !== false) {
      await waitForSignatureStatus(connection, signature, payload.lastValidBlockHeight);
    }
    return { signature, lastValidBlockHeight: payload.lastValidBlockHeight };
  }

  if (provider.signAndSendTransaction) {
    const { signature } = await provider.signAndSendTransaction(transaction);
    if (options.waitForConfirmation !== false) {
      await waitForSignatureStatus(connection, signature, payload.lastValidBlockHeight);
    }
    return { signature, lastValidBlockHeight: payload.lastValidBlockHeight };
  }

  throw new Error("wallet-signing-not-supported");
}

async function sendWalletTransactionWithError(
  setWalletError: (message: string | null) => void,
  path: string,
  player: string,
  provider: BrowserWalletProvider,
  extraPayload: Record<string, unknown> = {},
) {
  setWalletError(null);
  try {
    return await sendWalletTransaction(path, player, provider, extraPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "wallet-transaction-failed";
    setWalletError(message);
    throw error;
  }
}

function decodeBase64(value: string): Uint8Array {
  if (typeof window === "undefined") {
    return Uint8Array.from(Buffer.from(value, "base64"));
  }
  return Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0));
}

async function waitForSignatureStatus(
  connection: Connection,
  signature: string,
  lastValidBlockHeight?: number,
) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const status = (await withTimeout(connection.getSignatureStatuses([signature]), "signature-status-timeout")).value[0];
    if (status?.err) {
      throw new Error(`transaction-failed:${JSON.stringify(status.err)}`);
    }
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }
    if (lastValidBlockHeight !== undefined) {
      const currentBlockHeight = await withTimeout(connection.getBlockHeight("confirmed"), "block-height-timeout");
      if (currentBlockHeight > lastValidBlockHeight) {
        throw new Error("transaction-blockhash-expired");
      }
    }
    await sleep(400);
  }
  throw new Error("transaction-confirmation-timeout");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, message: string, ms = 3_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}
