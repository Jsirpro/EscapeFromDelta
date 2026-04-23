# Escape from Delta

Escape from Delta is a Solana-backed PVE extraction raid demo with EDcoins,
warehouse assets, marketplace listings, battle records, and admin difficulty
configuration.

## Local Setup

1. Install Anchor, Rust, Node.js, and a local Solana toolchain.
2. Copy `.env.example` to `.env` and set the program, EDcoins mint, treasury, and
   wallet values.
3. Copy `app/.env.example` to `app/.env.local` for the web app.
4. Install dependencies with `npm install`.

## Commands

- `anchor build`
- `anchor test`
- `npm run generate:client`
- `npm run test:client`
- `npm run test:app`
- `npm run dev`
- `npm run demo:local`
- `npm run query:records -- --wallet <PLAYER_WALLET> --cluster localnet --format table`

## Surfpool / Localnet Smoke Run

1. Start your local validator or `surfpool` on `http://127.0.0.1:8899`.
2. Deploy the program with the checked-in deploy keypair:
   - `NO_DNA=1 anchor deploy`
3. Run the local raid flow:
   - `npm run demo:local`
4. Query the resulting battle record:
   - `npm run query:records -- --wallet $(solana address) --cluster localnet --format table`

## Transaction Safety

Clients must show intent, cluster, fee payer, account list, amounts, and
simulation result before requesting wallet approval. Localnet/devnet are the only
configured targets for this demo.
