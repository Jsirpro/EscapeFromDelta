"use client";

import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import { Connection, PublicKey, Transaction, type SendOptions } from "@solana/web3.js";
import bs58 from "bs58";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { decodeBattleRecord } from "../../../clients/src/queries/battleRecords";
import { decodePlayerProfile } from "../../../clients/src/queries/player";
import type { BattleRecord, PlayerProfile } from "../../../clients/src/types";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const SOLANA_CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as "devnet" | "localnet" | undefined) ?? "devnet";
const SESSION_TOP_UP_LAMPORTS = 10_000_000;
const SESSION_EXPIRY_MINUTES = 10;

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
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
}

interface WalletState {
  walletAddress: string | null;
  connected: boolean;
  connecting: boolean;
  sessionPublicKey: string | null;
  sessionToken: string | null;
  walletError: string | null;
  lastTransactionDebug: Record<string, unknown> | null;
  connectDemoWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  profileAccount: AccountInfoLike | null;
  battleRecordAccounts: AccountInfoLike[];
  profile: PlayerProfile | null;
  battleRecords: BattleRecord[];
  convertDemoSol: (solAmount?: bigint) => Promise<void>;
  purchaseLoadoutPoints: (kind: "armor" | "weapon", amountTenths?: number) => Promise<void>;
  startDemoRaid: () => Promise<void>;
  openDemoContainer: (containerIndex?: number, finalRandomValue?: number) => Promise<void>;
  fightDemoEnemy: () => Promise<void>;
  moveDemoArea: (area: "low" | "medium" | "high") => Promise<void>;
  settleDemoRaid: (result: "succeeded" | "failed", raidSessionAddress?: string | null) => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

interface SessionCredentials {
  publicKey: PublicKey;
  sessionToken: string;
}

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
  const [lastTransactionDebug, setLastTransactionDebug] = useState<Record<string, unknown> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [localSessionCredentials, setLocalSessionCredentials] = useState<SessionCredentials | null>(null);
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const anchorWallet = useMemo(() => {
    if (!walletAddress || !walletProvider?.signTransaction) return undefined;
    const publicKey = new PublicKey(walletAddress);
    return {
      publicKey,
      signTransaction: walletProvider.signTransaction.bind(walletProvider),
      signAllTransactions:
        walletProvider.signAllTransactions?.bind(walletProvider) ??
        ((transactions: Transaction[]) => Promise.all(transactions.map((transaction) => walletProvider.signTransaction!(transaction)))),
    };
  }, [walletAddress, walletProvider]);
  const sessionWallet = useSessionKeyManager(anchorWallet, connection, SOLANA_CLUSTER);
  const value = useMemo<WalletState>(() => {
    const profileAccount = walletAddress ? profileAccounts[walletAddress] ?? null : null;
    const recordAccounts = walletAddress ? battleRecordAccounts[walletAddress] ?? [] : [];

    return {
      walletAddress,
      connected: walletAddress !== null,
      connecting,
      sessionPublicKey: localSessionCredentials?.publicKey.toBase58() ?? sessionWallet.publicKey?.toBase58() ?? null,
      sessionToken: localSessionCredentials?.sessionToken ?? sessionWallet.sessionToken,
      walletError,
      lastTransactionDebug,
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
            setLastTransactionDebug,
          );
          setWalletProvider(browserWallet);
          setWalletAddress(nextWallet);
          setLocalSessionCredentials(null);

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
        setLocalSessionCredentials(null);
        setWalletProvider(null);
        setWalletAddress(null);
      },
      profileAccount,
      battleRecordAccounts: recordAccounts,
      profile: profileAccount ? decodePlayerProfile(profileAccount, PROGRAM_ID) : null,
      battleRecords: recordAccounts.map((account) => decodeBattleRecord(account, PROGRAM_ID)),
      convertDemoSol: async (solAmount = 1n) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        if (solAmount <= 0n) throw new Error("invalid-sol-amount");
        await sendWalletTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          "/api/tx/convert-sol",
          walletAddress,
          walletProvider,
          { solLamports: Number(solAmount) },
        );
      },
      purchaseLoadoutPoints: async (kind, amountTenths = 10) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          "/api/tx/purchase-loadout",
          walletAddress,
          walletProvider,
          { kind, amountTenths },
        );
      },
      startDemoRaid: async () => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        const ensuredSession = await ensureSession(sessionWallet);
        setLocalSessionCredentials(ensuredSession);
        await sendWalletTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          "/api/tx/start",
          walletAddress,
          walletProvider,
        );
      },
      openDemoContainer: async (containerIndex = 0, finalRandomValue = 5) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        await sendSessionTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          {
            publicKey: localSessionCredentials?.publicKey ?? sessionWallet.publicKey,
            sessionToken: localSessionCredentials?.sessionToken ?? sessionWallet.sessionToken,
            signAndSendTransaction: sessionWallet.signAndSendTransaction,
          },
          "/api/tx/open",
          walletAddress,
          {
          containerIndex,
          finalRandomValue,
          },
        );
      },
      fightDemoEnemy: async () => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        await sendSessionTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          {
            publicKey: localSessionCredentials?.publicKey ?? sessionWallet.publicKey,
            sessionToken: localSessionCredentials?.sessionToken ?? sessionWallet.sessionToken,
            signAndSendTransaction: sessionWallet.signAndSendTransaction,
          },
          "/api/tx/fight",
          walletAddress,
        );
      },
      moveDemoArea: async (area) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        await sendSessionTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          {
            publicKey: localSessionCredentials?.publicKey ?? sessionWallet.publicKey,
            sessionToken: localSessionCredentials?.sessionToken ?? sessionWallet.sessionToken,
            signAndSendTransaction: sessionWallet.signAndSendTransaction,
          },
          "/api/tx/move",
          walletAddress,
          { area },
        );
      },
      settleDemoRaid: async (result, raidSessionAddress) => {
        if (!walletAddress) throw new Error("wallet-not-connected");
        if (!walletProvider) throw new Error("browser-wallet-missing");
        await sendWalletTransactionWithError(
          setWalletError,
          setLastTransactionDebug,
          result === "succeeded" ? "/api/tx/extract" : "/api/tx/fail",
          walletAddress,
          walletProvider,
          raidSessionAddress ? { raidSession: raidSessionAddress } : {},
        );
        await sessionWallet.revokeSession?.();
        setLocalSessionCredentials(null);
      },
    };
  }, [battleRecordAccounts, profileAccounts, walletAddress, walletProvider, walletError, lastTransactionDebug, connecting, sessionWallet, localSessionCredentials]);

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
  setLastTransactionDebug?: (value: Record<string, unknown>) => void,
) {
  const requestPayload = { player, ...extraPayload };
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestPayload),
  });
  const payload = (await response.json()) as {
    serializedTransaction?: string;
    blockhash?: string;
    lastValidBlockHeight?: number;
    error?: string;
  };
  setLastTransactionDebug?.({
    path,
    request: requestPayload,
    apiStatus: response.status,
    apiResponse: payload,
  });
  if (!response.ok || !payload.serializedTransaction) {
    throw new Error(payload.error ?? "transaction-build-failed");
  }

  const transaction = Transaction.from(decodeBase64(payload.serializedTransaction));
  const connection = new Connection(RPC_URL, "confirmed");

  if (provider.signTransaction) {
    const signedTransaction = await provider.signTransaction(transaction);
    let signature: string;
    try {
      signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: true,
      });
    } catch (error) {
      if (isFetchTransportError(error) && provider.signAndSendTransaction) {
        const walletResult = await provider.signAndSendTransaction(transaction);
        signature = walletResult.signature;
      } else
      if (isAlreadyProcessedError(error)) {
        const existingSignature = signedTransaction.signature;
        if (!existingSignature) {
          throw error;
        }
        signature = bs58.encode(existingSignature);
      } else {
        throw error;
      }
    }
    if (options.waitForConfirmation !== false) {
      await waitForSignatureStatus(connection, signature, payload.lastValidBlockHeight);
    }
    setLastTransactionDebug?.({
      path,
      request: requestPayload,
      apiStatus: response.status,
      apiResponse: payload,
      signature,
      sentBy: "signTransaction",
    });
    return { signature, lastValidBlockHeight: payload.lastValidBlockHeight };
  }

  if (provider.signAndSendTransaction) {
    const { signature } = await provider.signAndSendTransaction(transaction);
    if (options.waitForConfirmation !== false) {
      await waitForSignatureStatus(connection, signature, payload.lastValidBlockHeight);
    }
    setLastTransactionDebug?.({
      path,
      request: requestPayload,
      apiStatus: response.status,
      apiResponse: payload,
      signature,
      sentBy: "signAndSendTransaction",
    });
    return { signature, lastValidBlockHeight: payload.lastValidBlockHeight };
  }

  throw new Error("wallet-signing-not-supported");
}

async function sendWalletTransactionWithError(
  setWalletError: (message: string | null) => void,
  setLastTransactionDebug: (value: Record<string, unknown>) => void,
  path: string,
  player: string,
  provider: BrowserWalletProvider,
  extraPayload: Record<string, unknown> = {},
) {
  setWalletError(null);
  try {
    return await sendWalletTransaction(path, player, provider, extraPayload, {}, setLastTransactionDebug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "wallet-transaction-failed";
    setLastTransactionDebug({
      path,
      request: { player, ...extraPayload },
      frontendError: serializeError(error),
    });
    setWalletError(message);
    throw error;
  }
}

async function ensureSession(sessionWallet: {
  publicKey: PublicKey | null;
  sessionToken: string | null;
  getSessionToken?: () => Promise<unknown>;
  createSession?: (
    targetProgram: PublicKey,
    topUpLamports?: number,
    validUntil?: number,
  ) => Promise<unknown>;
}): Promise<SessionCredentials> {
  const existingCredentials = resolveSessionCredentials(sessionWallet.publicKey, sessionWallet.sessionToken);
  if (existingCredentials) {
    return existingCredentials;
  }
  if (!sessionWallet.createSession) {
    throw new Error("session-create-not-supported");
  }
  const createdSession = await sessionWallet.createSession(
    new PublicKey(PROGRAM_ID),
    SESSION_TOP_UP_LAMPORTS,
    SESSION_EXPIRY_MINUTES,
  );
  const nextCredentials =
    extractSessionCredentials(createdSession) ??
    (await pollSessionCredentials(sessionWallet));
  if (!nextCredentials) {
    throw new Error("session-wallet-missing");
  }
  return nextCredentials;
}

async function sendSessionTransactionWithError(
  setWalletError: (message: string | null) => void,
  setLastTransactionDebug: (value: Record<string, unknown>) => void,
  sessionWallet: {
    publicKey: PublicKey | null;
    sessionToken: string | null;
    signAndSendTransaction?: (
      transaction: Transaction | Transaction[],
      connection?: Connection,
      options?: SendOptions,
    ) => Promise<string[]>;
  },
  path: string,
  player: string,
  extraPayload: Record<string, unknown> = {},
) {
  setWalletError(null);
  try {
    if (!sessionWallet.publicKey || !sessionWallet.sessionToken || !sessionWallet.signAndSendTransaction) {
      throw new Error("session-wallet-missing");
    }
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        player,
        sessionSigner: sessionWallet.publicKey.toBase58(),
        sessionToken: sessionWallet.sessionToken,
        ...extraPayload,
      }),
    });
    const payload = (await response.json()) as {
      serializedTransaction?: string;
      error?: string;
      lastValidBlockHeight?: number;
    };
    setLastTransactionDebug({
      path,
      request: {
        player,
        sessionSigner: sessionWallet.publicKey.toBase58(),
        sessionToken: sessionWallet.sessionToken,
        ...extraPayload,
      },
      apiStatus: response.status,
      apiResponse: payload,
    });
    if (!response.ok || !payload.serializedTransaction) {
      throw new Error(payload.error ?? "session-transaction-build-failed");
    }
    const transaction = Transaction.from(decodeBase64(payload.serializedTransaction));
    const signatures = await sessionWallet.signAndSendTransaction(transaction, new Connection(RPC_URL, "confirmed"), {
      skipPreflight: true,
    });
    if (!signatures.length) {
      throw new Error("session-transaction-failed");
    }
    await waitForSignatureStatus(new Connection(RPC_URL, "confirmed"), signatures[0], payload.lastValidBlockHeight);
    setLastTransactionDebug({
      path,
      request: {
        player,
        sessionSigner: sessionWallet.publicKey.toBase58(),
        sessionToken: sessionWallet.sessionToken,
        ...extraPayload,
      },
      apiStatus: response.status,
      apiResponse: payload,
      signature: signatures[0],
      sentBy: "sessionWallet",
    });
    return signatures[0];
  } catch (error) {
    const message = error instanceof Error ? error.message : "session-transaction-failed";
    setLastTransactionDebug({
      path,
      request: { player, ...extraPayload },
      frontendError: serializeError(error),
    });
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

function resolveSessionCredentials(publicKey: PublicKey | null, sessionToken: string | null): SessionCredentials | null {
  if (!publicKey || !sessionToken) {
    return null;
  }
  return { publicKey, sessionToken };
}

function extractSessionCredentials(value: unknown): SessionCredentials | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const publicKey =
    normalizePublicKey(record.publicKey) ??
    normalizePublicKey(record.sessionPublicKey) ??
    normalizePublicKey(record.signer);
  const sessionToken =
    normalizePublicKey(record.sessionToken)?.toBase58() ??
    normalizePublicKey(record.session_token)?.toBase58() ??
    (typeof record.sessionToken === "string" ? record.sessionToken : null) ??
    (typeof record.session_token === "string" ? record.session_token : null);
  if (!publicKey || !sessionToken) {
    return null;
  }
  return { publicKey, sessionToken };
}

function normalizePublicKey(value: unknown): PublicKey | null {
  if (!value) {
    return null;
  }
  if (value instanceof PublicKey) {
    return value;
  }
  if (typeof value === "string") {
    try {
      return new PublicKey(value);
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && "toBase58" in value && typeof value.toBase58 === "function") {
    try {
      return new PublicKey(value.toBase58());
    } catch {
      return null;
    }
  }
  return null;
}

async function pollSessionCredentials(sessionWallet: {
  publicKey: PublicKey | null;
  sessionToken: string | null;
  getSessionToken?: () => Promise<unknown>;
}) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const directCredentials = resolveSessionCredentials(sessionWallet.publicKey, sessionWallet.sessionToken);
    if (directCredentials) {
      return directCredentials;
    }
    if (sessionWallet.getSessionToken) {
      try {
        const tokenValue = await sessionWallet.getSessionToken();
        const queriedCredentials =
          extractSessionCredentials(tokenValue) ??
          resolveSessionCredentials(sessionWallet.publicKey, normalizeSessionTokenValue(tokenValue));
        if (queriedCredentials) {
          return queriedCredentials;
        }
      } catch {
        // Ignore transient provider lag and keep polling.
      }
    }
    await sleep(300);
  }
  return null;
}

function normalizeSessionTokenValue(value: unknown): string | null {
  const publicKey = normalizePublicKey(value);
  if (publicKey) {
    return publicKey.toBase58();
  }
  return typeof value === "string" ? value : null;
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

function isAlreadyProcessedError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("already been processed");
}

function isFetchTransportError(error: unknown) {
  return error instanceof TypeError && error.message.includes("Failed to fetch");
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  return { value: String(error) };
}
