# EscapeFromDelta Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-20

## Active Technologies

- Rust stable for the Solana program; TypeScript 5.x for web app, generated/client helpers, battle-record scripts, and tests + Anchor for program/IDL; SPL Token via Token-2022-compatible transfer-checked flows for EDcoins; wallet-standard discovery; React/Next-style web app; @solana/kit-oriented client helpers; Playwright/Vitest-style UI/client tests; LiteSVM or Mollusk for fast program tests (001-solana-raid-game)

## Project Structure

```text
programs/escape_from_delta/
app/
clients/
tests/
```

## Commands

- `anchor build`
- `anchor test`
- `npm run generate:client`
- `npm run test:client`
- `npm run test:app`
- `npm run dev`
- `npm run query:records -- --wallet <PLAYER_WALLET> --cluster localnet --format table`

## Code Style

- Rust program code follows Anchor and Solana account-validation conventions.
- TypeScript code validates account owners, discriminators, schema versions, and
  wallet ownership before using RPC data.
- UI code keeps player and admin routes separate and shows transaction summary,
  simulation result, cluster, fee payer, and intent before wallet approval.

## Recent Changes

- 001-solana-raid-game: Added Rust stable for the Solana program; TypeScript 5.x for web app, generated/client helpers, battle-record scripts, and tests + Anchor for program/IDL; SPL Token via Token-2022-compatible transfer-checked flows for EDcoins; wallet-standard discovery; React/Next-style web app; @solana/kit-oriented client helpers; Playwright/Vitest-style UI/client tests; LiteSVM or Mollusk for fast program tests

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
