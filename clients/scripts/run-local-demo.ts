import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import idl from "../../target/idl/escape_from_delta.json";

const PROGRAM_ID = new anchor.web3.PublicKey(process.env.PROGRAM_ID ?? "Ec3cfCCBS14yGkpHGNFTZjbvjFVfCMTfg5zsSECCS6yf");
const RPC_URL = process.env.ANCHOR_PROVIDER_URL ?? process.env.RPC_URL ?? "http://127.0.0.1:8899";

async function main() {
  process.env.ANCHOR_PROVIDER_URL = RPC_URL;
  process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;

  const provider = anchor.AnchorProvider.local(RPC_URL, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(idl as anchor.Idl, provider);
  const wallet = provider.wallet.publicKey;

  const [gameConfig] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("game_config")], PROGRAM_ID);
  const [adminProfile] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("admin"), wallet.toBuffer()],
    PROGRAM_ID,
  );
  const [playerProfile] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("player"), wallet.toBuffer()],
    PROGRAM_ID,
  );

  console.log(`rpc\t${RPC_URL}`);
  console.log(`program\t${PROGRAM_ID.toBase58()}`);
  console.log(`wallet\t${wallet.toBase58()}`);

  if (!(await accountExists(provider.connection, gameConfig))) {
    await program.methods
      .initializeGame(wallet, anchor.web3.SystemProgram.programId, wallet, wallet)
      .accounts({
        gameConfig,
        deployer: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("initialized\tgame_config");
  }

  if (!(await accountExists(provider.connection, adminProfile))) {
    await program.methods
      .initializeAdminProfile()
      .accounts({
        gameConfig,
        adminProfile,
        deployer: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("initialized\tadmin_profile");
  }

  await ensurePlayer(program, gameConfig, playerProfile, wallet);

  const difficultySeeds = [Buffer.from("difficulty"), wallet.toBuffer(), u64(1000), u16(10), u16(30), u16(50)];
  const [difficultyConfiguration] = anchor.web3.PublicKey.findProgramAddressSync(difficultySeeds, PROGRAM_ID);
  if (!(await accountExists(provider.connection, difficultyConfiguration))) {
    await program.methods
      .createDifficultyVersion(new BN(1000), 10, 30, 50)
      .accounts({
        gameConfig,
        adminProfile,
        difficultyConfiguration,
        admin: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("initialized\tdifficulty");
  }

  const player = await program.account.playerProfile.fetch(playerProfile);
  const nextRaidId = new BN(player.nextRaidId.toString());
  const [raidSession] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("raid"), playerProfile.toBuffer(), u64(Number(nextRaidId.toString()))],
    PROGRAM_ID,
  );
  const [battleRecord] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("battle_record"), playerProfile.toBuffer(), u64(Number(nextRaidId.toString()))],
    PROGRAM_ID,
  );

  await program.methods
    .startRaid(20, 20, new BN(1000))
    .accounts({
      player: wallet,
      playerProfile,
      raidSession,
      difficultyConfiguration,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("started\traid");

  await program.methods
    .settleFailedRaid()
    .accounts({
      player: wallet,
      playerProfile,
      raidSession,
      battleRecord,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("settled\traid_failed");
  console.log("battle_record\t" + battleRecord.toBase58());
}

async function ensurePlayer(
  program: anchor.Program,
  gameConfig: anchor.web3.PublicKey,
  playerProfile: anchor.web3.PublicKey,
  wallet: anchor.web3.PublicKey,
) {
  if (await accountExists(program.provider.connection, playerProfile)) {
    return;
  }
  await program.methods
    .createOrConnectPlayer()
    .accounts({
      gameConfig,
      playerProfile,
      player: wallet,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("initialized\tplayer_profile");
}

async function accountExists(connection: anchor.web3.Connection, address: anchor.web3.PublicKey) {
  return (await connection.getAccountInfo(address)) !== null;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
