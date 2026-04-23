# Implementation Plan: Escape from Delta On-Chain Raid Game

**Branch**: `001-solana-raid-game` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-solana-raid-game/spec.md`

## Summary

Build Escape from Delta as a Solana-backed PVE extraction game with wallet
onboarding, EDcoins economy, raid state machine, marketplace, warehouse, battle
records, and admin difficulty configuration. Use an Anchor program as the
authoritative game/economy state layer, a wallet-standard web app for player and
admin routes, and TypeScript client/query tooling for battle-record inspection and
transaction construction.

## Technical Context

**Language/Version**: Rust stable for the Solana program; TypeScript 5.x for web app, generated/client helpers, battle-record scripts, and tests  
**Primary Dependencies**: Anchor for program/IDL; SPL Token via Token-2022-compatible transfer-checked flows for EDcoins; wallet-standard discovery; React/Next-style web app; @solana/kit-oriented client helpers; Playwright/Vitest-style UI/client tests; LiteSVM or Mollusk for fast program tests  
**Storage**: Solana accounts and token accounts are authoritative; no off-chain database in v1. Static app state may cache reads but cannot decide custody or raid outcomes.  
**Testing**: Program tests for instructions and invariants; TypeScript client/script tests for transaction builders and record queries; frontend component/e2e tests for routes, wallet states, raid flow, marketplace, and admin separation  
**Target Platform**: Localnet/devnet for development and validation; browser web app for desktop and mobile web; mainnet explicitly out of scope until a later release decision  
**Project Type**: Solana dApp with on-chain program, web frontend, TypeScript client/scripts, and cross-layer tests  
**Performance Goals**: 95% of non-wallet UI actions show feedback within 1 second; standard user raid path completes within 3 minutes; battle-record query renders 50 completed records within 2 seconds on a normal broadband connection  
**Constraints**: No transaction signing or sending without explicit wallet approval and visible transaction summary; raid timeout is 2 minutes; encounter chance caps at 95%; battle win chance caps at 15%-85%; EDcoins cannot convert back to SOL  
**Scale/Scope**: v1 supports single-player PVE raids, three risk-area defaults, admin-managed difficulty versions, marketplace listings, and script-accessible battle-record queries for one wallet at a time  
**Solana Context**: Localnet/devnet first; Anchor program with PDA account model; EDcoins as a Solana token mint with token accounts; wallet-standard signing; TransferChecked-style token movement; demo randomness uses the simplest deterministic pseudo-random helper available to the program/client flow while still recording the final random value per event; this demo source is not treated as production-secure randomness and will be replaced by a stronger randomness design in a later feature before any production release  
**Economy Scope**: One-time starter grant, SOL-to-EDcoins mint/exchange at 1:10,000, raid entry fee collection, marketplace listing fee rounded up at 3%, marketplace settlement, equipment custody/loss, and no EDcoins-to-SOL redemption

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **On-chain authority**: PASS. Data model defines player profiles, EDcoins token
  accounts, warehouse assets, raid sessions, marketplace listings, difficulty
  configs, and battle records as authoritative state; account-map.md defines
  PDA seeds or addresses, owner/signer/mutability validation, token program
  variant, size budgets, numeric precision, and overflow behavior.
- **Economy integrity**: PASS. Plan covers starter grant idempotency, one-way
  SOL-to-EDcoins exchange, entry fees, 3% rounded-up listing fees, marketplace
  settlement, custody movement, and no redemption path.
- **Gameplay determinism**: PASS. Raid contract covers explicit state transitions,
  encounter increments, caps, battle tier bounds, equipment degradation, safe-case
  selection, extraction, interruption, and timeout.
- **Bounded admin authority**: PASS. Admin authority is scoped to versioned
  difficulty configuration; active raids lock their config version; completed
  records are immutable.
- **Required tests**: PASS. Test plan spans program, TypeScript client/script, and
  frontend/e2e checks for every touched layer.
- **Transaction safety**: PASS. Quickstart and contracts require transaction
  summaries, simulation before send, explicit wallet approval, and local/devnet
  target by default.

**Post-Design Recheck**: PASS. Phase 1 artifacts preserve all gate decisions.

## Project Structure

### Documentation (this feature)

```text
specs/001-solana-raid-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── account-map.md       # Solana account ownership, seeds, authorities, sizes, and numeric rules
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   ├── program-instructions.md
│   ├── ui-routes.md
│   └── battle-record-query.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
programs/
└── escape_from_delta/
    ├── src/
    │   ├── instructions/
    │   ├── state/
    │   ├── errors.rs
    │   └── lib.rs
    └── tests/

app/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── admin/
│   │   ├── play/
│   │   ├── marketplace/
│   │   ├── warehouse/
│   │   └── records/
│   ├── components/
│   ├── game/
│   ├── wallet/
│   └── styles/
└── tests/

clients/
├── src/
│   ├── generated/
│   ├── transactions/
│   ├── queries/
│   └── index.ts
├── scripts/
│   └── query-battle-records.ts
└── tests/

tests/
├── program/
├── client/
├── e2e/
└── fixtures/
```

**Structure Decision**: Use a three-surface dApp layout: `programs/` for
authoritative Solana instructions/state, `app/` for player/admin web UX, and
`clients/` for reusable transaction builders plus the battle-record query script.
Shared cross-layer tests live in `tests/` while framework-local tests can remain
beside each surface.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
