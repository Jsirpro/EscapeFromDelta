# Research: Escape from Delta On-Chain Raid Game

## Decision: Anchor Program For Game Authority

Use an Anchor program for the authoritative Escape from Delta state machine,
including player profiles, raid sessions, marketplace listings, difficulty
configuration, and battle records.

**Rationale**: The constitution requires account ownership, signer, mutability,
discriminator, and numeric-bound checks. Anchor's account constraints directly
support signer, mutable account, seed, and PDA validation patterns, while still
producing an IDL suitable for TypeScript clients and tests.

**Alternatives considered**:

- Raw Solana program: More control, but slower iteration and more boilerplate for
  a feature set with many account types.
- Pinocchio: Good for compute/footprint optimization, but v1 prioritizes
  correctness, testability, and IDL/client generation.

## Decision: EDcoins As A Solana Token Mint

Represent EDcoins as a fungible Solana token mint. Use checked token transfers
for movement between player token accounts, treasury/fee accounts, marketplace
settlement, and conversion minting.

**Rationale**: Official Solana token documentation models fungible tokens through
mint accounts and token accounts, and checked transfers verify the mint and
decimals during movement. This matches the economy requirement that token custody
and balances are authoritative.

**Alternatives considered**:

- Program-internal ledger only: Simpler, but weakens composability and does not
  satisfy the "token form" currency requirement.
- Token-2022 transfer-fee extension for marketplace fees: Rejected for v1 because
  the 3% fee applies to listing creation, not every EDcoins transfer.

## Decision: Use Token-2022-Compatible Design, Start With Minimal Extensions

Design EDcoins instructions so the token program ID is explicit and checked, with
v1 defaulting to a minimal fungible mint. Avoid mandatory Token-2022 extensions
unless a later spec adds transfer-level fees, metadata-on-mint, pausing, or other
extension behavior.

**Rationale**: Token-2022 is a superset of the original token program and supports
extensions, but additional extension behavior adds account sizing, authority, and
wallet compatibility concerns. The current feature only needs standard mint,
token account, and checked transfer semantics.

**Alternatives considered**:

- Require Token-2022 metadata and transfer-fee extensions immediately: More
  feature-rich but not required for EDcoins v1 and could complicate wallet/client
  support.
- Original SPL Token only: Mature and sufficient, but explicitly accepting a token
  program ID keeps the plan compatible with a Token-2022 mint if needed.

## Decision: Wallet-Standard Web Signing Boundary

All player and admin transactions are initiated from wallet-connected UI or
approved local/devnet tooling. No private keys, seed phrases, or keypair files are
stored in app state.

**Rationale**: Solana wallet guidance treats wallets as the user's signing and
asset-custody tool. The constitution requires explicit human approval, simulation,
cluster, fee payer, and transaction summary before signing.

**Alternatives considered**:

- Server-side custody: Rejected because it conflicts with wallet ownership and
  raises custody/security risk.
- Silent background signing: Rejected by transaction safety requirements.

## Decision: Demo-Only Simple Randomness For V1

Use the simplest deterministic pseudo-random helper available to the demo
program/client flow for v1. Each encounter check, battle result, and loot drop
still stores the final random value in the completed battle record for demo
inspection.

**Rationale**: This is a demo and prioritizes implementation speed over
production-grade randomness. The random helper is intentionally scoped to demo
use and does not attempt to provide fairness guarantees. This interim source is
not production-secure and will be replaced by a stronger randomness design in a
later feature before any production release.

**Alternatives considered**:

- Commit-and-reveal: More auditable, but more implementation work than needed for
  the current demo.
- Production-grade randomness provider: Out of scope for the demo.

## Decision: Versioned Difficulty Configuration

Every admin difficulty update creates a new effective version. A raid locks the
selected difficulty version at start and battle records reference that version.

**Rationale**: This protects active raids from mid-session rule changes, supports
auditable battle records, and satisfies bounded admin authority.

**Alternatives considered**:

- Read latest difficulty at each action: Easier storage but unfair to active
  players and difficult to audit.
- Admin chooses whether updates apply to active raids: More flexible but creates
  ambiguous player expectations and more test branches.

## Decision: Store Active Raid State On Chain

Persist raid status, selected equipment, locked difficulty version, current area,
opened containers, encounter increments, carried loot references, combat
degradation, safe-case selection, start time, and random event audit references in
authoritative accounts.

**Rationale**: Interrupted and timed-out raids settle as failure. That behavior
cannot be safely enforced from frontend-only state.

**Alternatives considered**:

- Client-only active raid state: Rejected because disconnects, refreshes, and
  adversarial clients could bypass losses.
- Off-chain backend session store: Rejected for v1 because the constitution makes
  gameplay/custody outcomes chain-authoritative.

## Decision: TypeScript Battle-Record Query Contract

Provide a script-accessible battle-record query that validates account ownership,
discriminators, version fields, and malformed data before displaying a wallet's
records.

**Rationale**: The spec explicitly requires script-accessible battle-record
queries and invalid/wrong-owner record rejection.

**Alternatives considered**:

- UI-only records page: Insufficient for verification/support.
- Raw RPC dumps: Not user-safe and fails validation/error-message requirements.

## Decision: Test Pyramid

Use program-level tests for account constraints, state transitions, economy
invariants, random audit recording, and failure paths; TypeScript tests for
transaction builders and query decoding; frontend tests for wallet states, route
separation, raid flow, marketplace, warehouse, records, and responsive UI.

**Rationale**: The constitution requires tests for on-chain state, custody,
combat math, loot distribution, marketplace behavior, wallet connection, and
admin configuration. Fast local program tests catch most state bugs; client and UI
tests cover integration and user-visible behavior.

**Alternatives considered**:

- End-to-end tests only: Too slow and poor at isolating account/rule failures.
- Program tests only: Misses wallet, route, UI, and query requirements.

## Decision: No Off-Chain Database In V1

Do not introduce a backend database for core game state. The web app and scripts
read Solana accounts and may cache non-authoritative display data only.

**Rationale**: On-chain state is authoritative by constitution. Avoiding a
database reduces reconciliation complexity and prevents split-brain custody or
raid outcome state.

**Alternatives considered**:

- Indexer/database for all reads: Useful later for scale, but premature for v1
  and not necessary for single-wallet battle-record queries.
- Hybrid authoritative backend: Rejected because it conflicts with on-chain
  authority for gameplay and trading.
