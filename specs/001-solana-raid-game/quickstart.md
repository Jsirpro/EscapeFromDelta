# Quickstart: Escape from Delta On-Chain Raid Game

This quickstart describes the expected local/devnet validation flow after tasks
are implemented. Mainnet is out of scope for this feature.

## Prerequisites

- Rust toolchain
- Solana CLI configured for localnet or devnet
- Anchor CLI
- Node.js 18+
- Wallet for local/devnet testing

Never use a mainnet wallet or private key for this feature's development flow.
Do not sign or send a transaction unless the app or script shows the cluster, fee
payer, transaction intent, token amounts, and simulation result.

## 1. Install Dependencies

```sh
npm install
```

## 2. Start Local Validator

```sh
solana config set --url localhost
solana-test-validator
```

If the implementation uses a different local cluster runner, document the exact
replacement command in the final task output.

## 3. Build Program

```sh
anchor build
```

Expected result:

- Escape from Delta program builds.
- IDL is generated for client use.

## 4. Run Program Tests

```sh
anchor test
```

Required coverage:

- one-time player grant
- SOL-to-EDcoins conversion
- equipment range validation
- raid start and entry fee collection
- encounter increment and 95% cap
- battle tier min/max win chance and weapon <= 1 defeat
- safe-case retention selection
- timeout/interruption failure settlement
- versioned difficulty locking
- random audit data on battle records
- marketplace listing fee and settlement
- admin authorization rejection

## 5. Generate Or Refresh Client Bindings

```sh
npm run generate:client
```

Expected result:

- TypeScript transaction builders and decoders match the current IDL/schema.
- Wrong-owner and malformed account data are rejected by decoders.

## 6. Run Client And Query Tests

```sh
npm run test:client
```

Required coverage:

- transaction summaries include cluster, fee payer, intent, and amounts
- battle-record query validates account owner, schema version, wallet owner, and
  random audit data
- query returns readable empty, valid, and invalid-record states

## 7. Run Frontend Tests

```sh
npm run test:app
```

Required coverage:

- `/` player home renders wallet state and four main actions
- character visual changes with armor-point balance and weapon-point balance
- `/admin` rejects unauthorized wallets
- raid action transitions remain visible and layout-stable
- marketplace fee/purchase states preserve custody on failure
- warehouse and battle records reflect completed outcomes

## 8. Run The Web App Locally

```sh
npm run dev
```

Manual validation path:

1. Connect a local/devnet wallet.
2. Confirm exactly one starter grant.
3. Open warehouse and verify EDcoins, armor, and weapon balances.
4. Create or select a difficulty as admin.
5. Start a raid as player and confirm entry fee, equipment lock, and low-risk
   landing after 2 seconds.
6. Open containers, update safe-case selections, fight when required, and extract
   or fail.
7. Confirm battle record includes difficulty version and random audit data.
8. List an asset in marketplace and verify 3% rounded-up fee.
9. Purchase from another wallet and verify ownership and EDcoins settlement.

## 9. Query Battle Records By Script

```sh
npm run query:records -- --wallet <PLAYER_WALLET> --cluster localnet --format table
npm run query:records -- --wallet <PLAYER_WALLET> --cluster localnet --format json
```

Expected result:

- Valid records show result, difficulty version, retained/lost assets, and random
  audit data.
- Invalid records are rejected or listed with reasons.

## Release Gate

Before this feature is considered ready for `/speckit.tasks` implementation:

- `anchor build` succeeds.
- Program tests pass.
- Client/query tests pass.
- Frontend tests pass.
- Manual quickstart path succeeds on localnet.
- No transaction is sent without explicit wallet approval and simulation result.
