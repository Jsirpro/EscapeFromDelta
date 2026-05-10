import * as anchor from "@coral-xyz/anchor";
import idl from "../../../target/idl/escape_from_delta.json";

const PROGRAM_ID = new anchor.web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ",
);
const RPC_URL = process.env.ANCHOR_PROVIDER_URL ?? process.env.RPC_URL ?? "https://api.devnet.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_SAFE_CASE_CAPACITY = 0;

type ProgramAccountNamespace = {
  gameConfig: {
    fetch(address: anchor.web3.PublicKey): Promise<any>;
  };
  playerProfile: {
    fetch(address: anchor.web3.PublicKey): Promise<any>;
    fetchNullable(address: anchor.web3.PublicKey): Promise<any | null>;
  };
  raidSession: {
    fetch(address: anchor.web3.PublicKey): Promise<any>;
  };
};

export async function getLocalWalletAddress(): Promise<string> {
  return getProvider().wallet.publicKey.toBase58();
}

export async function ensureLocalDemoSetup(options: { includeServerPlayer?: boolean } = {}) {
  const provider = getProvider();
  const program = getProgram(provider);
  const wallet = provider.wallet.publicKey;
  const includeServerPlayer = options.includeServerPlayer ?? true;

  const gameConfig = deriveGameConfig();
  const playerProfile = derivePlayerProfile(wallet);

  if (!(await accountExists(provider.connection, gameConfig))) {
    const transaction = await program.methods
      .initializeGame(wallet, anchor.web3.SystemProgram.programId, wallet, wallet)
      .accounts({
        gameConfig,
        deployer: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();
    await sendServerTransaction(provider, transaction);
  }

  const gameConfigAccount = await fetchWithRetry(() => accounts(program).gameConfig.fetch(gameConfig));
  const adminAuthority = new anchor.web3.PublicKey(gameConfigAccount.adminAuthority);
  const usesExternalAdminConfig = !adminAuthority.equals(wallet);
  const adminProfile = deriveAdminProfile(adminAuthority);
  let difficultyConfiguration = deriveDifficulty(adminAuthority);

  if (includeServerPlayer && !(await accountExists(provider.connection, playerProfile))) {
    const transaction = await program.methods
      .createOrConnectPlayer()
      .accounts({
        gameConfig,
        playerProfile,
        player: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();
    await sendServerTransaction(provider, transaction);
  }

  if (!usesExternalAdminConfig && !(await accountExists(provider.connection, adminProfile))) {
    const transaction = await program.methods
      .initializeAdminProfile()
      .accounts({
        gameConfig,
        adminProfile,
        deployer: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();
    await sendServerTransaction(provider, transaction);
  }

  if (!usesExternalAdminConfig && !(await accountExists(provider.connection, difficultyConfiguration))) {
    const transaction = await program.methods
      .createDifficultyVersion(new anchor.BN(1000), 10, 30, 50)
      .accounts({
        gameConfig,
        adminProfile,
        difficultyConfiguration,
        admin: adminAuthority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();
    await sendServerTransaction(provider, transaction);
  }

  if (usesExternalAdminConfig && !(await accountExists(provider.connection, difficultyConfiguration))) {
    difficultyConfiguration = anchor.web3.PublicKey.default;
  }

  const solTreasury = new anchor.web3.PublicKey(gameConfigAccount.solTreasury);
  return { provider, program, wallet, gameConfig, adminProfile, playerProfile, difficultyConfiguration, solTreasury };
}

export async function startLocalDemoRaid() {
  const { program, wallet, playerProfile, difficultyConfiguration } = await ensureLocalDemoSetup();
  const player = await accounts(program).playerProfile.fetch(playerProfile);
  const raidId = Number(player.nextRaidId.toString());
  const raidSession = deriveRaidSession(playerProfile, raidId);

  const transaction = await program.methods
    .startRaid(20, 20, new anchor.BN(1000), DEFAULT_SAFE_CASE_CAPACITY)
    .accounts({
      player: wallet,
      playerProfile,
      raidSession,
      difficultyConfiguration,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
  await sendServerTransaction(program.provider as anchor.AnchorProvider, transaction);

  return { raidSession: raidSession.toBase58(), raidId };
}

export async function buildCreateOrConnectPlayerTransaction(player: string) {
  const { provider, program, gameConfig } = await ensureLocalDemoSetup({ includeServerPlayer: false });
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const transaction = await program.methods
    .createOrConnectPlayer()
    .accounts({
      gameConfig,
      playerProfile,
      player: playerKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildStartRaidTransaction(player: string, safeCaseCapacity = DEFAULT_SAFE_CASE_CAPACITY) {
  const { provider, program, difficultyConfiguration } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const playerAccount = await accounts(program).playerProfile.fetchNullable(playerProfile);
  if (!playerAccount) {
    throw new Error("missing-player-profile");
  }
  const raidId = Number(playerAccount.nextRaidId.toString());
  const raidSession = deriveRaidSession(playerProfile, raidId);
  const transaction = await program.methods
    .startRaid(20, 20, new anchor.BN(1000), safeCaseCapacity)
    .accounts({
      player: playerKey,
      playerProfile,
      raidSession,
      difficultyConfiguration,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildPurchaseLoadoutPointsTransaction(
  player: string,
  kind: "armor" | "weapon",
  amountTenths = 10,
) {
  const { provider, program, gameConfig } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const transaction = await program.methods
    .purchaseLoadoutPoints(kind === "armor" ? { armor: {} } : { weapon: {} }, amountTenths)
    .accounts({
      gameConfig,
      playerProfile,
      player: playerKey,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildCreateListingTransaction(
  player: string,
  warehouseAssetAddress: string,
  priceEdcoins: number,
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const warehouseAsset = new anchor.web3.PublicKey(warehouseAssetAddress);
  const marketplaceListing = deriveMarketplaceListing(warehouseAsset);
  const transaction = await program.methods
    .createListing(new anchor.BN(priceEdcoins))
    .accounts({
      seller: playerKey,
      sellerProfile: playerProfile,
      warehouseAsset,
      marketplaceListing,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildPurchaseListingTransaction(player: string, listingAddress: string) {
  const { provider, program } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const buyerProfile = derivePlayerProfile(playerKey);
  const marketplaceListing = new anchor.web3.PublicKey(listingAddress);
  const listingAccount = await accounts(program).marketplaceListing.fetch(marketplaceListing);
  const sellerProfile = new anchor.web3.PublicKey(listingAccount.sellerProfile);
  const warehouseAsset = new anchor.web3.PublicKey(listingAccount.assetId);
  const transaction = await program.methods
    .purchaseListing()
    .accounts({
      buyer: playerKey,
      buyerProfile,
      sellerProfile,
      warehouseAsset,
      marketplaceListing,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildCancelListingTransaction(player: string, listingAddress: string) {
  const { provider, program } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const sellerProfile = derivePlayerProfile(playerKey);
  const marketplaceListing = new anchor.web3.PublicKey(listingAddress);
  const listingAccount = await accounts(program).marketplaceListing.fetch(marketplaceListing);
  const warehouseAsset = new anchor.web3.PublicKey(listingAccount.assetId);
  const transaction = await program.methods
    .cancelListing()
    .accounts({
      seller: playerKey,
      sellerProfile,
      warehouseAsset,
      marketplaceListing,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildConvertSolToEdcoinsTransaction(player: string, solLamports = LAMPORTS_PER_SOL) {
  const { provider, program, gameConfig, solTreasury } = await ensureLocalDemoSetup();
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const transaction = await program.methods
    .convertSolToEdcoins(new anchor.BN(solLamports))
    .accounts({
      gameConfig,
      playerProfile,
      player: playerKey,
      solTreasury,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildSettlementTransaction(
  player: string,
  result: "succeeded" | "failed",
  raidSessionOverride?: string,
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const { playerKey, playerProfile, raidSessionAddress, raidSession } = raidSessionOverride
    ? await getExplicitRaid(program, player, raidSessionOverride)
    : await getActiveRaid(program, player);
  const playerAccount = await accounts(program).playerProfile.fetch(playerProfile);
  const battleRecord = deriveBattleRecord(playerProfile, Number(raidSession.raidId.toString()));
  const retainedAssetCount =
    result === "succeeded" ? raidSession.carriedLoot.length : raidSession.safeCaseSelection.length;
  const warehouseAssetAccounts = deriveWarehouseAssetAccounts(
    playerProfile,
    BigInt(playerAccount.warehouseNonce.toString()),
    retainedAssetCount,
  );
  const builder =
    result === "succeeded"
      ? program.methods.extractRaid().accounts({
          player: playerKey,
          playerProfile,
          raidSession: raidSessionAddress,
          battleRecord,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
      : program.methods.settleFailedRaid().accounts({
          player: playerKey,
          playerProfile,
          raidSession: raidSessionAddress,
          battleRecord,
          systemProgram: anchor.web3.SystemProgram.programId,
        });
  if (warehouseAssetAccounts.length > 0) {
    builder.remainingAccounts(
      warehouseAssetAccounts.map((pubkey) => ({
        pubkey,
        isWritable: true,
        isSigner: false,
      })),
    );
  }
  const transaction = await builder.transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildOpenContainerTransaction(player: string, containerIndex = 0, finalRandomValue = 5) {
  const { provider, program } = await ensureLocalDemoSetup();
  const { playerKey, playerProfile, raidSessionAddress } = await getActiveRaid(program, player);
  const transaction = await program.methods
    .openContainer(containerIndex, 0, 0, 0, new anchor.BN(finalRandomValue))
    .accounts({
      signer: playerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: null,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildSessionOpenContainerTransaction(
  player: string,
  sessionSigner: string,
  sessionToken: string,
  containerIndex = 0,
  finalRandomValue = 5,
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const sessionSignerKey = new anchor.web3.PublicKey(sessionSigner);
  const sessionTokenKey = new anchor.web3.PublicKey(sessionToken);
  const { playerProfile, raidSessionAddress } = await getActiveRaid(program, player);
  const transaction = await program.methods
    .openContainer(containerIndex, 0, 0, 0, new anchor.BN(finalRandomValue))
    .accounts({
      signer: sessionSignerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: sessionTokenKey,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, sessionSignerKey);
}

export async function buildFightEnemyTransaction(player: string, finalRandomValue = 7) {
  const { provider, program } = await ensureLocalDemoSetup();
  const { playerKey, playerProfile, raidSessionAddress, raidSession } = await getActiveRaid(program, player);
  const enemyCombatTenths = 30;
  const transaction = await program.methods
    .fightEnemy(
      raidSession.currentArmorTenths,
      raidSession.currentWeaponTenths,
      enemyCombatTenths,
      new anchor.BN(finalRandomValue),
    )
    .accounts({
      signer: playerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: null,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildSessionFightEnemyTransaction(
  player: string,
  sessionSigner: string,
  sessionToken: string,
  finalRandomValue = 7,
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const sessionSignerKey = new anchor.web3.PublicKey(sessionSigner);
  const sessionTokenKey = new anchor.web3.PublicKey(sessionToken);
  const { playerProfile, raidSessionAddress, raidSession } = await getActiveRaid(program, player);
  const enemyCombatTenths = 30;
  const transaction = await program.methods
    .fightEnemy(
      raidSession.currentArmorTenths,
      raidSession.currentWeaponTenths,
      enemyCombatTenths,
      new anchor.BN(finalRandomValue),
    )
    .accounts({
      signer: sessionSignerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: sessionTokenKey,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, sessionSignerKey);
}

export async function buildSessionSelectSafeCaseTransaction(
  player: string,
  sessionSigner: string,
  sessionToken: string,
  selectedAssets: string[],
  capacity: number,
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const sessionSignerKey = new anchor.web3.PublicKey(sessionSigner);
  const sessionTokenKey = new anchor.web3.PublicKey(sessionToken);
  const { playerProfile, raidSessionAddress } = await getActiveRaid(program, player);
  const transaction = await program.methods
    .selectSafeCaseItems(
      selectedAssets.map((assetId) => new anchor.web3.PublicKey(assetId)),
      capacity,
    )
    .accounts({
      signer: sessionSignerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: sessionTokenKey,
    })
    .transaction();
  return finalizeTransaction(provider.connection, transaction, sessionSignerKey);
}

export async function buildMoveAreaTransaction(player: string, area: "low" | "medium" | "high") {
  const { provider, program } = await ensureLocalDemoSetup();
  const { playerKey, playerProfile, raidSessionAddress } = await getActiveRaid(program, player);
  const transaction = new anchor.web3.Transaction().add(
    createMoveAreaInstruction({
      signer: playerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      area,
    }),
  );
  return finalizeTransaction(provider.connection, transaction, playerKey);
}

export async function buildSessionMoveAreaTransaction(
  player: string,
  sessionSigner: string,
  sessionToken: string,
  area: "low" | "medium" | "high",
) {
  const { provider, program } = await ensureLocalDemoSetup();
  const sessionSignerKey = new anchor.web3.PublicKey(sessionSigner);
  const sessionTokenKey = new anchor.web3.PublicKey(sessionToken);
  const { playerProfile, raidSessionAddress } = await getActiveRaid(program, player);
  const transaction = new anchor.web3.Transaction().add(
    createMoveAreaInstruction({
      signer: sessionSignerKey,
      playerProfile,
      raidSession: raidSessionAddress,
      sessionToken: sessionTokenKey,
      area,
    }),
  );
  return finalizeTransaction(provider.connection, transaction, sessionSignerKey);
}

export async function settleLocalDemoRaid(result: "succeeded" | "failed") {
  const { program, wallet, playerProfile } = await ensureLocalDemoSetup();
  const player = await accounts(program).playerProfile.fetch(playerProfile);
  if (!player.activeRaid) {
    throw new Error("no-active-raid");
  }

  const raidSessionAddress = new anchor.web3.PublicKey(player.activeRaid);
  const raidSession = await accounts(program).raidSession.fetch(raidSessionAddress);
  const battleRecord = deriveBattleRecord(playerProfile, Number(raidSession.raidId.toString()));
  const retainedAssetCount =
    result === "succeeded" ? raidSession.carriedLoot.length : raidSession.safeCaseSelection.length;
  const warehouseAssetAccounts = deriveWarehouseAssetAccounts(
    playerProfile,
    BigInt(player.warehouseNonce.toString()),
    retainedAssetCount,
  );

  if (result === "succeeded") {
    const builder = program.methods
      .extractRaid()
      .accounts({
        player: wallet,
        playerProfile,
        raidSession: raidSessionAddress,
        battleRecord,
        systemProgram: anchor.web3.SystemProgram.programId,
      });
    if (warehouseAssetAccounts.length > 0) {
      builder.remainingAccounts(
        warehouseAssetAccounts.map((pubkey) => ({ pubkey, isWritable: true, isSigner: false })),
      );
    }
    const transaction = await builder.transaction();
    await sendServerTransaction(program.provider as anchor.AnchorProvider, transaction);
  } else {
    const builder = program.methods
      .settleFailedRaid()
      .accounts({
        player: wallet,
        playerProfile,
        raidSession: raidSessionAddress,
        battleRecord,
        systemProgram: anchor.web3.SystemProgram.programId,
      });
    if (warehouseAssetAccounts.length > 0) {
      builder.remainingAccounts(
        warehouseAssetAccounts.map((pubkey) => ({ pubkey, isWritable: true, isSigner: false })),
      );
    }
    const transaction = await builder.transaction();
    await sendServerTransaction(program.provider as anchor.AnchorProvider, transaction);
  }

  return { battleRecord: battleRecord.toBase58(), raidId: raidSession.raidId.toString(), result };
}

function getProvider() {
  process.env.ANCHOR_PROVIDER_URL = RPC_URL;
  process.env.ANCHOR_WALLET = resolveWalletPath(
    process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/dev.json`,
  );
  return anchor.AnchorProvider.local(RPC_URL, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

function getProgram(provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  return new anchor.Program(
    { ...(idl as anchor.Idl), address: PROGRAM_ID.toBase58() } as anchor.Idl,
    provider,
  );
}

function accounts(program: anchor.Program) {
  return program.account as unknown as ProgramAccountNamespace;
}

async function finalizeTransaction(
  connection: anchor.web3.Connection,
  transaction: anchor.web3.Transaction,
  feePayer: anchor.web3.PublicKey,
) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockhash;
  return {
    serializedTransaction: transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString("base64"),
    blockhash,
    lastValidBlockHeight,
  };
}

async function sendServerTransaction(provider: anchor.AnchorProvider, transaction: anchor.web3.Transaction) {
  const payer = provider.wallet.publicKey;
  const balance = await provider.connection.getBalance(payer, "confirmed");
  if (balance <= 0) {
    throw new Error(
      `server-wallet-insufficient-funds:${payer.toBase58()}. Fund this wallet on devnet or set ANCHOR_WALLET to a funded keypair.`,
    );
  }

  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = payer;
  transaction.recentBlockhash = blockhash;
  const signedTransaction = await provider.wallet.signTransaction(transaction);
  let signature: string;
  try {
    signature = await provider.connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `server-wallet-send-failed:${payer.toBase58()}: ${message}`,
    );
  }
  await waitForSignatureStatus(provider.connection, signature, lastValidBlockHeight);
  return signature;
}

async function waitForSignatureStatus(
  connection: anchor.web3.Connection,
  signature: string,
  lastValidBlockHeight: number,
) {
  while ((await connection.getBlockHeight("confirmed")) <= lastValidBlockHeight) {
    const response = await connection.getSignatureStatuses([signature]);
    const status = response.value[0];
    if (status?.err) {
      throw new Error(`transaction-failed:${JSON.stringify(status.err)}`);
    }
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }
    await sleep(400);
  }
  throw new Error("transaction-confirmation-timeout");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveWalletPath(walletPath: string) {
  if (walletPath.startsWith("~/")) {
    return `${process.env.HOME}/${walletPath.slice(2)}`;
  }
  return walletPath;
}

function deriveGameConfig() {
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("game_config")], PROGRAM_ID)[0];
}

function deriveAdminProfile(wallet: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("admin"), wallet.toBuffer()], PROGRAM_ID)[0];
}

function derivePlayerProfile(wallet: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("player"), wallet.toBuffer()], PROGRAM_ID)[0];
}

function deriveDifficulty(wallet: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("difficulty"), wallet.toBuffer(), u64(1000), u16(10), u16(30), u16(50)],
    PROGRAM_ID,
  )[0];
}

function deriveRaidSession(playerProfile: anchor.web3.PublicKey, raidId: number) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("raid"), playerProfile.toBuffer(), u64(raidId)],
    PROGRAM_ID,
  )[0];
}

function deriveBattleRecord(playerProfile: anchor.web3.PublicKey, raidId: number) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("battle_record"), playerProfile.toBuffer(), u64(raidId)],
    PROGRAM_ID,
  )[0];
}

function deriveWarehouseAsset(playerProfile: anchor.web3.PublicKey, assetId: bigint) {
  const assetIdBytes = Buffer.alloc(8);
  assetIdBytes.writeBigUInt64LE(assetId, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("asset"), playerProfile.toBuffer(), assetIdBytes],
    PROGRAM_ID,
  )[0];
}

function deriveMarketplaceListing(warehouseAsset: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), warehouseAsset.toBuffer()],
    PROGRAM_ID,
  )[0];
}

function deriveWarehouseAssetAccounts(
  playerProfile: anchor.web3.PublicKey,
  warehouseNonce: bigint,
  count: number,
) {
  return Array.from({ length: count }, (_, index) =>
    deriveWarehouseAsset(playerProfile, warehouseNonce + BigInt(index + 1)),
  );
}

async function getActiveRaid(program: anchor.Program, player: string) {
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const playerAccount = await accounts(program).playerProfile.fetchNullable(playerProfile);
    if (playerAccount?.activeRaid) {
      const raidSessionAddress = new anchor.web3.PublicKey(playerAccount.activeRaid);
      const raidSession = await accounts(program).raidSession.fetch(raidSessionAddress);
      return { playerKey, playerProfile, raidSessionAddress, raidSession };
    }

    const nextRaidId = Number(playerAccount?.nextRaidId?.toString?.() ?? "0");
    if (nextRaidId > 0) {
      const inferredRaidSessionAddress = deriveRaidSession(playerProfile, nextRaidId - 1);
      if (await accountExists(program.provider.connection, inferredRaidSessionAddress)) {
        const raidSession = await accounts(program).raidSession.fetch(inferredRaidSessionAddress);
        return { playerKey, playerProfile, raidSessionAddress: inferredRaidSessionAddress, raidSession };
      }
    }

    await sleep(500);
  }

  throw new Error("no-active-raid");
}

async function getExplicitRaid(program: anchor.Program, player: string, raidSessionAddress: string) {
  const playerKey = new anchor.web3.PublicKey(player);
  const playerProfile = derivePlayerProfile(playerKey);
  const raidSessionKey = new anchor.web3.PublicKey(raidSessionAddress);
  const raidSession = await accounts(program).raidSession.fetch(raidSessionKey);
  return { playerKey, playerProfile, raidSessionAddress: raidSessionKey, raidSession };
}

function createMoveAreaInstruction(args: {
  signer: anchor.web3.PublicKey;
  playerProfile: anchor.web3.PublicKey;
  raidSession: anchor.web3.PublicKey;
  area: "low" | "medium" | "high";
  sessionToken?: anchor.web3.PublicKey;
}) {
  return new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: args.signer, isSigner: true, isWritable: true },
      { pubkey: args.playerProfile, isSigner: false, isWritable: true },
      { pubkey: args.raidSession, isSigner: false, isWritable: true },
      ...(args.sessionToken
        ? [{ pubkey: args.sessionToken, isSigner: false, isWritable: false }]
        : []),
    ],
    data: encodeMoveAreaInstruction(args.area),
  });
}

function encodeMoveAreaInstruction(area: "low" | "medium" | "high") {
  return Buffer.concat([moveAreaDiscriminator(), Buffer.from([riskLevelIndex(area)])]);
}

function moveAreaDiscriminator() {
  const instruction = (idl as { instructions?: Array<{ name: string; discriminator?: number[] }> }).instructions?.find(
    ({ name }) => name === "move_area",
  );
  if (!instruction?.discriminator || instruction.discriminator.length !== 8) {
    throw new Error("missing-move-area-discriminator");
  }
  return Buffer.from(instruction.discriminator);
}

function riskLevelIndex(area: "low" | "medium" | "high") {
  if (area === "low") return 0;
  if (area === "medium") return 1;
  return 2;
}

async function accountExists(connection: anchor.web3.Connection, address: anchor.web3.PublicKey) {
  return (
    (await fetchWithRetry(
      () => connection.getAccountInfo(address),
      { retries: 4, delayMs: 250 },
    )) !== null
  );
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const delayMs = options.delayMs ?? 200;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientRpcReadError(error) || attempt === retries) {
        throw error;
      }
      await sleep(delayMs * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("rpc-read-failed");
}

function isTransientRpcReadError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to get info about account") ||
    message.includes("failed to fetch") ||
    message.includes("fetchfailed") ||
    message.includes("network request failed") ||
    message.includes("429") ||
    message.includes("timed out")
  );
}

function u16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function u64(value: number) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value), 0);
  return buffer;
}
