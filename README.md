# Escape from Delta

Escape from Delta is a Solana-backed PVE extraction raid demo with EDcoins,
warehouse assets, marketplace listings, battle records, and admin difficulty
configuration.

## Devnet Setup

1. Install Anchor, Rust, Node.js, and the Solana CLI.
2. Copy `.env.example` to `.env` and set the program, EDcoins mint, treasury, and
   wallet values.
3. Copy `app/.env.example` to `app/.env.local` for the web app.
4. Install dependencies with `npm install`.
5. Point your Solana CLI and wallet to devnet.

## Commands

- `anchor build`
- `anchor test`
- `npm run generate:client`
- `npm run test:client`
- `npm run test:app`
- `npm run dev`
- `npm run demo:local`
- `npm run query:records -- --wallet <PLAYER_WALLET> --cluster devnet --format table`

## Devnet Smoke Run

1. Set your CLI to devnet:
   - `solana config set --url https://api.devnet.solana.com`
2. Deploy the program with the checked-in deploy keypair:
   - `NO_DNA=1 anchor deploy`
3. Airdrop SOL to the deployer and test wallets:
   - `solana airdrop 2`
4. Run the demo raid flow against devnet:
   - `ANCHOR_PROVIDER_URL=https://api.devnet.solana.com RPC_URL=https://api.devnet.solana.com npm run demo:local`
5. Query the resulting battle record:
   - `npm run query:records -- --wallet $(solana address) --cluster devnet --format table`

## Session Keys

- Program-side session auth is enabled for raid in-session actions:
  - `open_container`
  - `fight_enemy`
  - `move_area`
  - `select_safe_case_items`
- Session Keys program id:
  - `KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5`
- The app session manager is configured for `devnet` by default.

## Transaction Safety

Clients must show intent, cluster, fee payer, account list, amounts, and
simulation result before requesting wallet approval. Devnet is the default target
for this demo.
