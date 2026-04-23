# Tasks: Escape from Delta On-Chain Raid Game

**Input**: Design documents from `/specs/001-solana-raid-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the Escape from Delta constitution for on-chain state,
custody, EDcoins economics, raid/combat probability, marketplace behavior, wallet
connection, battle-record queries, admin configuration, and frontend gameplay
routes.

**Organization**: Tasks are grouped by user story so each story can be implemented
and tested independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: User story label for story phases only
- Every task includes an exact target file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Solana dApp monorepo structure, toolchain, and common
test commands.

- [X] T001 Create repository source directories from the plan in `programs/escape_from_delta/src`, `programs/escape_from_delta/tests`, `app/src`, `app/tests`, `clients/src`, `clients/scripts`, `clients/tests`, and `tests/fixtures`
- [X] T002 Initialize Anchor program manifest and workspace configuration in `Anchor.toml`, `Cargo.toml`, and `programs/escape_from_delta/Cargo.toml`
- [X] T003 Initialize TypeScript workspace scripts and package metadata in `package.json`, `tsconfig.json`, `app/package.json`, and `clients/package.json`
- [X] T004 [P] Configure Rust formatting/linting defaults in `rustfmt.toml` and `.cargo/config.toml`
- [X] T005 [P] Configure TypeScript linting, formatting, and test defaults in `eslint.config.js`, `prettier.config.js`, `vitest.config.ts`, and `playwright.config.ts`
- [X] T006 [P] Add local/devnet environment templates for program id, cluster, EDcoins mint, and treasury addresses in `.env.example` and `app/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared accounts, constants, validation, client decoding, and app shell
needed by every user story.

**CRITICAL**: No user story work starts until this phase is complete.

- [X] T007 Define shared fixed-point, probability, fee, and timeout constants in `programs/escape_from_delta/src/state/constants.rs`
- [X] T008 Define custom program errors for custody, authority, numeric bounds, raid state, marketplace, and audit failures in `programs/escape_from_delta/src/errors.rs`
- [X] T009 Define account validation helpers for signer, owner, mint, mutability, discriminator, PDA seeds, and numeric bounds in `programs/escape_from_delta/src/state/validation.rs`
- [X] T010 Define core account state structs for GameConfig, AdminProfile, PlayerProfile, WarehouseAsset, DifficultyConfiguration, RaidSession, MarketplaceListing, BattleRecord, and RandomEventAudit in `programs/escape_from_delta/src/state/mod.rs`
- [X] T011 Define PDA seed/address map, account size budget, signer/mutability matrix, token program ownership, numeric precision, and overflow rules for every account in `programs/escape_from_delta/src/state/account_map.rs` aligned with `specs/001-solana-raid-game/account-map.md`
- [X] T012 Define instruction module exports and shared context imports in `programs/escape_from_delta/src/instructions/mod.rs`
- [X] T013 Implement EDcoins checked transfer and fee rounding helpers in `programs/escape_from_delta/src/instructions/token_helpers.rs`
- [X] T014 Implement deterministic raid math helpers for encounter increments, chance caps, battle tier bounds, timeout checks, and safe-case capacity checks in `programs/escape_from_delta/src/instructions/raid_math.rs`
- [X] T015 Implement demo random audit helper types for final random values, thresholds, and outcomes in `programs/escape_from_delta/src/state/random_audit.rs`
- [X] T016 Wire program modules, declared instructions, state, and errors in `programs/escape_from_delta/src/lib.rs`
- [X] T017 [P] Define TypeScript shared account schemas, constants, and branded IDs in `clients/src/types.ts`
- [X] T018 [P] Implement TypeScript account decoders that reject wrong-owner, unknown schema version, and malformed account data in `clients/src/queries/decoders.ts`
- [X] T019 [P] Implement transaction summary and simulation result types in `clients/src/transactions/summary.ts`
- [X] T020 [P] Create frontend app shell, route layout, global styles, and wallet provider boundary in `app/src/app/layout.tsx`, `app/src/styles/global.css`, and `app/src/wallet/provider.tsx`
- [X] T021 [P] Create reusable UI state components for loading, empty, invalid account, wallet rejected, and transaction pending states in `app/src/components/StateViews.tsx`
- [X] T022 [P] Add shared test fixtures for wallets, EDcoins balances, difficulty configs, warehouse assets, raid sessions, listings, and battle records in `tests/fixtures/game-fixtures.ts`

**Checkpoint**: Foundation ready. User story phases can now begin.

---

## Phase 3: User Story 1 - Start as a Wallet Player (Priority: P1) MVP

**Goal**: A new wallet connects, receives exactly one starter grant, lands on the
player home page, sees navigation, warehouse balance, and equipment-reactive
character display.

**Independent Test**: Connect a never-seen wallet and verify grant, profile,
home navigation, warehouse balance, repeat-connect idempotency, and character
equipment display without using raid or marketplace flows.

### Tests for User Story 1

- [X] T023 [P] [US1] Add program tests for initialize_game and one-time create_or_connect_player grant in `tests/program/player_onboarding.test.ts`
- [X] T024 [P] [US1] Add client transaction tests for player profile creation, starter grant summary, and duplicate grant rejection in `clients/tests/player-onboarding.test.ts`
- [X] T025 [P] [US1] Add frontend tests for wallet connect states, home actions, starter grant display, and character equipment visual changes in `app/tests/player-home.spec.ts`
- [X] T026 [P] [US1] Add program tests for convert_sol_to_edcoins rate, SOL treasury movement, EDcoins mint/transfer, zero amount rejection, insufficient SOL rejection, and no EDcoins-to-SOL path in `tests/program/edcoins_conversion.test.ts`
- [X] T027 [P] [US1] Add client transaction tests for SOL-to-EDcoins conversion summary, amount calculation, simulation-required state, and no-redemption transaction absence in `clients/tests/edcoins-conversion.test.ts`
- [X] T028 [P] [US1] Add frontend tests for SOL-to-EDcoins conversion entry, fixed rate display, wallet rejection, success balance refresh, and no EDcoins-to-SOL action in `app/tests/edcoins-conversion.spec.ts`

### Implementation for User Story 1

- [X] T029 [US1] Implement initialize_game instruction in `programs/escape_from_delta/src/instructions/initialize_game.rs`
- [X] T030 [US1] Implement create_or_connect_player instruction with idempotent starter grant in `programs/escape_from_delta/src/instructions/create_or_connect_player.rs`
- [X] T031 [US1] Implement convert_sol_to_edcoins instruction with fixed 1:10,000 rate, SOL treasury transfer, EDcoins credit, and no reverse redemption branch in `programs/escape_from_delta/src/instructions/convert_sol_to_edcoins.rs`
- [X] T032 [US1] Register US1 instructions and account contexts in `programs/escape_from_delta/src/lib.rs`
- [X] T033 [US1] Implement player onboarding transaction builders in `clients/src/transactions/player.ts`
- [X] T034 [US1] Implement SOL-to-EDcoins conversion transaction builder in `clients/src/transactions/conversion.ts`
- [X] T035 [US1] Implement player profile and EDcoins balance queries in `clients/src/queries/player.ts`
- [X] T036 [US1] Implement wallet connection hook and profile bootstrap state in `app/src/wallet/usePlayerProfile.ts`
- [X] T037 [US1] Implement player home route with Play, Marketplace, Warehouse, and Battle Records actions in `app/src/app/page.tsx`
- [X] T038 [US1] Implement Minecraft-like character component driven by armor-point balance and weapon-point balance in `app/src/components/PlayerCharacter.tsx`
- [X] T039 [US1] Implement SOL-to-EDcoins conversion panel with fixed-rate preview and wallet approval state in `app/src/components/EdcoinsConversionPanel.tsx`
- [X] T040 [US1] Implement home route error, loading, duplicate grant, wallet rejection, and conversion failure handling in `app/src/app/page.tsx`

**Checkpoint**: US1 is independently testable and forms the MVP entry point.

---

## Phase 4: User Story 2 - Complete a PVE Raid Loop (Priority: P1)

**Goal**: A funded player pays entry, selects equipment, enters low risk, opens
containers, resolves encounters/battles, updates safe-case selection, extracts or
fails, and receives a battle record with random audit data.

**Independent Test**: Start a raid with valid equipment, open a container, resolve
encounter and battle paths, extract successfully, then run failure, timeout, and
safe-case retention paths while verifying warehouse and battle record outcomes.

### Tests for User Story 2

- [X] T041 [P] [US2] Add program tests for start_raid fee collection, equipment range validation, low-risk start, and locked difficulty version in `tests/program/raid_start.test.ts`
- [X] T042 [P] [US2] Add program tests for open_container loot, default five-container risk areas, over-container rejection, carried loot not failing due to backpack capacity, encounter +5/+15 increments, 95% cap, and random audit recording in `tests/program/raid_exploration.test.ts`
- [X] T043 [P] [US2] Add program tests for fight_enemy difference tiers, 15%-85% caps, weapon <= 1 defeat, degradation, extraction, failure, timeout, and safe-case retention in `tests/program/raid_settlement.test.ts`
- [X] T044 [P] [US2] Add client transaction tests for raid start, safe-case selection, open container, fight, move, extract, and failure settlement summaries in `clients/tests/raid-transactions.test.ts`
- [X] T045 [P] [US2] Add frontend tests for `/play` difficulty/equipment selection, 2-second landing transition, raid action pending states, battle-only encounter state, safe-case prompt, extraction, and failure in `app/tests/play-flow.spec.ts`

### Implementation for User Story 2

- [X] T046 [US2] Implement start_raid instruction in `programs/escape_from_delta/src/instructions/start_raid.rs`
- [X] T047 [US2] Implement select_safe_case_items instruction in `programs/escape_from_delta/src/instructions/select_safe_case_items.rs`
- [X] T048 [US2] Implement open_container instruction with loot selection, encounter check, +5 same-area increment, 95% cap, and audit data in `programs/escape_from_delta/src/instructions/open_container.rs`
- [X] T049 [US2] Implement fight_enemy instruction with difference-based tiers, 15%-85% caps, weapon <= 1 defeat, and combat degradation in `programs/escape_from_delta/src/instructions/fight_enemy.rs`
- [X] T050 [US2] Implement move_area instruction with +15 area-change increment in `programs/escape_from_delta/src/instructions/move_area.rs`
- [X] T051 [US2] Implement extract_raid instruction that settles success without encounter and writes a battle record in `programs/escape_from_delta/src/instructions/extract_raid.rs`
- [X] T052 [US2] Implement settle_failed_raid instruction for battle loss, timeout, interruption, combat parameter zeroing, and safe-case retention in `programs/escape_from_delta/src/instructions/settle_failed_raid.rs`
- [X] T053 [US2] Register raid instructions and contexts in `programs/escape_from_delta/src/lib.rs`
- [X] T054 [US2] Implement raid transaction builders in `clients/src/transactions/raid.ts`
- [X] T055 [US2] Implement raid state and difficulty query helpers in `clients/src/queries/raid.ts`
- [X] T056 [US2] Implement raid state machine reducer for UI transitions in `app/src/game/raidMachine.ts`
- [X] T057 [US2] Implement `/play` route container in `app/src/app/play/page.tsx`
- [X] T058 [US2] Implement difficulty and equipment selectors in `app/src/game/DifficultySelector.tsx` and `app/src/game/EquipmentSelector.tsx`
- [X] T059 [US2] Implement active raid action panel, transition animation states, battle prompt, area movement, and extraction controls in `app/src/game/RaidActionPanel.tsx`
- [X] T060 [US2] Implement safe-case selection and failure settlement UI in `app/src/game/SafeCaseSelection.tsx`
- [X] T061 [US2] Implement raid result summary with battle-record link in `app/src/game/RaidResult.tsx`

**Checkpoint**: US2 completes the core playable raid loop independently.

---

## Phase 5: User Story 3 - Trade Items and Equipment (Priority: P2)

**Goal**: Players list and purchase collectibles, armor-point balances, and
weapon-point balances using EDcoins with a rounded-up 3% seller fee.

**Independent Test**: Use two player wallets to list an owned asset, collect the
seller fee, buy it, and verify EDcoins balances, asset ownership, and invalid
listing/purchase failures.

### Tests for User Story 3

- [X] T062 [P] [US3] Add program tests for create_listing fee rounding, seller ownership, asset locking, purchase settlement, cancellation, and invalid sold/canceled listing rejection in `tests/program/marketplace.test.ts`
- [X] T063 [P] [US3] Add client transaction tests for listing, purchase, cancel, fee summary, and custody-preserving failure cases in `clients/tests/marketplace-transactions.test.ts`
- [X] T064 [P] [US3] Add frontend tests for `/marketplace` listing creation, fee display, buy flow, cancel flow, insufficient funds, and sold listing states in `app/tests/marketplace.spec.ts`

### Implementation for User Story 3

- [X] T065 [US3] Implement create_listing instruction with rounded-up 3% fee and asset lock in `programs/escape_from_delta/src/instructions/create_listing.rs`
- [X] T066 [US3] Implement purchase_listing instruction with EDcoins settlement and asset ownership transfer in `programs/escape_from_delta/src/instructions/purchase_listing.rs`
- [X] T067 [US3] Implement cancel_listing instruction with seller authorization and asset unlock in `programs/escape_from_delta/src/instructions/cancel_listing.rs`
- [X] T068 [US3] Register marketplace instructions and contexts in `programs/escape_from_delta/src/lib.rs`
- [X] T069 [US3] Implement marketplace transaction builders in `clients/src/transactions/marketplace.ts`
- [X] T070 [US3] Implement marketplace listing and tradable asset queries in `clients/src/queries/marketplace.ts`
- [X] T071 [US3] Implement `/marketplace` route in `app/src/app/marketplace/page.tsx`
- [X] T072 [US3] Implement listing form with 3% rounded-up fee preview in `app/src/components/ListingForm.tsx`
- [X] T073 [US3] Implement listing table/cards with buy, cancel, sold, and invalid-owner states in `app/src/components/MarketplaceListings.tsx`

**Checkpoint**: US3 provides independently testable marketplace utility.

---

## Phase 6: User Story 4 - Manage Warehouse and Battle Records (Priority: P2)

**Goal**: Players inspect balances/assets and query battle records with difficulty
version, retained/lost loot, and random audit data.

**Independent Test**: After onboarding, raid settlement, and marketplace actions,
open warehouse and records for the wallet and verify account validation, balances,
asset states, completed raid outcomes, invalid-record handling, and script output.

### Tests for User Story 4

- [X] T074 [P] [US4] Add client query tests for warehouse asset decoding, wrong-owner rejection, asset state display, and malformed asset handling in `clients/tests/warehouse-query.test.ts`
- [X] T075 [P] [US4] Add client query tests for battle-record validation, difficulty version, retained/lost assets, random audit data, invalid records, and JSON/table output in `clients/tests/battle-record-query.test.ts`
- [X] T076 [P] [US4] Add frontend tests for `/warehouse` balances/assets/empty states and `/records` valid, empty, invalid, and incomplete-audit states in `app/tests/warehouse-records.spec.ts`

### Implementation for User Story 4

- [X] T077 [US4] Implement warehouse asset query helpers and asset state grouping in `clients/src/queries/warehouse.ts`
- [X] T078 [US4] Implement battle-record query helpers with owner/discriminator/schema/random-audit validation in `clients/src/queries/battleRecords.ts`
- [X] T079 [US4] Implement script-accessible battle-record query command in `clients/scripts/query-battle-records.ts`
- [X] T080 [US4] Add package script for battle-record query in `clients/package.json`
- [X] T081 [US4] Implement `/warehouse` route with balances, collectibles, armor-point balance, weapon-point balance, safe cases, and asset states in `app/src/app/warehouse/page.tsx`
- [X] T082 [US4] Implement `/records` route with completed raid rows, difficulty version, retained/lost assets, and random audit display in `app/src/app/records/page.tsx`
- [X] T083 [US4] Implement reusable random audit display component in `app/src/components/RandomAuditDetails.tsx`

**Checkpoint**: US4 gives transparent custody and audit inspection.

---

## Phase 7: User Story 5 - Configure Game Difficulty as Admin (Priority: P3)

**Goal**: Authorized admins create versioned difficulty configs while unauthorized
wallets are rejected and active raids keep their locked config version.

**Independent Test**: Connect as admin, create/update a difficulty, verify players
can select the new version, verify active raids keep the old version, and verify
unauthorized wallets cannot change config.

### Tests for User Story 5

- [X] T084 [P] [US5] Add program tests for admin authorization, invalid difficulty rejection, new version creation, active raid version locking, and battle-record version reference in `tests/program/admin_difficulty.test.ts`
- [X] T085 [P] [US5] Add client transaction tests for create_difficulty_version summaries, invalid config inputs, and unauthorized signer failures in `clients/tests/admin-difficulty-transactions.test.ts`
- [X] T086 [P] [US5] Add frontend tests for `/admin` authorization, difficulty form validation, version list, create/update flow, and unauthorized wallet rejection in `app/tests/admin.spec.ts`

### Implementation for User Story 5

- [X] T087 [US5] Implement deployment-time AdminProfile initialization that sets the program deployer wallet as initial admin in `programs/escape_from_delta/src/instructions/admin_profile.rs`
- [X] T088 [US5] Implement create_difficulty_version instruction with entry fee, risk counts, encounter probabilities, enemy ranges, loot weights, and versioning in `programs/escape_from_delta/src/instructions/create_difficulty_version.rs`
- [X] T089 [US5] Register admin instructions and contexts in `programs/escape_from_delta/src/lib.rs`
- [X] T090 [US5] Implement admin transaction builders and validation helpers in `clients/src/transactions/admin.ts`
- [X] T091 [US5] Implement admin profile and difficulty version queries in `clients/src/queries/admin.ts`
- [X] T092 [US5] Implement `/admin` route authorization gate and difficulty version list in `app/src/app/admin/page.tsx`
- [X] T093 [US5] Implement difficulty configuration form with validation for probabilities, fees, ranges, and loot weights in `app/src/components/DifficultyForm.tsx`

**Checkpoint**: US5 enables bounded, auditable admin configuration.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Harden security, performance, docs, and end-to-end validation across
all stories.

- [X] T094 [P] Add end-to-end happy path covering onboarding, admin difficulty, raid success, marketplace sale, warehouse, and records in `tests/e2e/full-game-flow.spec.ts`
- [X] T095 [P] Add end-to-end failure path covering invalid equipment, insufficient EDcoins, raid timeout, safe-case retention, invalid listing, and unauthorized admin in `tests/e2e/failure-flow.spec.ts`
- [X] T096 [P] Add transaction safety tests for summary, simulation-required state, wallet rejection, and no-mainnet default in `clients/tests/transaction-safety.test.ts`
- [X] T097 [P] Add responsive layout and text containment tests for player home, play, marketplace, warehouse, records, and admin routes in `app/tests/responsive.spec.ts`
- [X] T098 [P] Add UI feedback timing tests asserting raid actions show visible feedback within 1 second in `app/tests/raid-feedback-timing.spec.ts`
- [X] T099 [P] Add battle-record query performance tests asserting 50 completed records render within 2 seconds in `clients/tests/battle-record-performance.test.ts`
- [X] T100 Run quickstart validation steps and record command results in `specs/001-solana-raid-game/quickstart-results.md`
- [X] T101 Update developer documentation for localnet/devnet setup, transaction safety, and battle-record query usage in `README.md`
- [X] T102 Audit account validation coverage against `specs/001-solana-raid-game/contracts/program-instructions.md` and document gaps in `specs/001-solana-raid-game/security-review.md`
- [X] T103 Run formatting, linting, program tests, client tests, and frontend tests, then fix failures in touched files across `programs/`, `clients/`, `app/`, and `tests/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1 Start as a Wallet Player (Phase 3)**: Depends on Foundation; MVP entry point.
- **US2 Complete a PVE Raid Loop (Phase 4)**: Depends on Foundation and uses US1 player profile/balance.
- **US3 Trade Items and Equipment (Phase 5)**: Depends on Foundation and uses US1 player assets/balances.
- **US4 Manage Warehouse and Battle Records (Phase 6)**: Depends on Foundation; richer validation is best after US1-US3 produce data but query work can start with fixtures.
- **US5 Configure Game Difficulty as Admin (Phase 7)**: Depends on Foundation; US2 relies on seeded/default difficulty until US5 is complete.
- **Polish (Phase 8)**: Depends on selected stories being complete.

### User Story Dependencies

- **US1**: Independent MVP after Foundation.
- **US2**: Requires US1 player profile and EDcoins balance; default fixture difficulty can unblock early raid work.
- **US3**: Requires US1 player profile and warehouse assets; can proceed in parallel with US2 after Foundation.
- **US4**: Can build query/UI from fixtures after Foundation; full validation follows US2/US3 settlement data.
- **US5**: Can proceed after Foundation; integrate with US2 difficulty locking before final validation.

### Within Each User Story

- Tests are written before implementation.
- Program tests precede instruction implementation.
- Client tests precede transaction/query builders.
- Frontend tests precede route/component implementation.
- State/account structs and helpers precede instructions.
- Transaction builders precede UI action wiring.
- Story checkpoint must pass before treating the story as complete.

### Parallel Opportunities

- Setup tasks T004-T006 can run in parallel after T001-T003 are understood.
- Foundational tasks T017-T022 can run in parallel with program state/helper work after constants and target types are agreed.
- Test tasks inside each user story are parallel because they target program, client, and app test files.
- US3, US4, and US5 can proceed in parallel after Foundation if fixtures are used and shared files are coordinated.
- Polish tasks T094-T099 can run in parallel after the relevant stories are complete.

---

## Parallel Examples

### User Story 1

```text
Task: T023 [US1] Add program tests in tests/program/player_onboarding.test.ts
Task: T024 [US1] Add client tests in clients/tests/player-onboarding.test.ts
Task: T025 [US1] Add frontend tests in app/tests/player-home.spec.ts
```

### User Story 2

```text
Task: T041 [US2] Add raid start program tests in tests/program/raid_start.test.ts
Task: T044 [US2] Add raid transaction tests in clients/tests/raid-transactions.test.ts
Task: T045 [US2] Add play-flow frontend tests in app/tests/play-flow.spec.ts
```

### User Story 3

```text
Task: T062 [US3] Add marketplace program tests in tests/program/marketplace.test.ts
Task: T063 [US3] Add marketplace client tests in clients/tests/marketplace-transactions.test.ts
Task: T064 [US3] Add marketplace frontend tests in app/tests/marketplace.spec.ts
```

### User Story 4

```text
Task: T074 [US4] Add warehouse query tests in clients/tests/warehouse-query.test.ts
Task: T075 [US4] Add battle-record query tests in clients/tests/battle-record-query.test.ts
Task: T076 [US4] Add warehouse/records frontend tests in app/tests/warehouse-records.spec.ts
```

### User Story 5

```text
Task: T084 [US5] Add admin difficulty program tests in tests/program/admin_difficulty.test.ts
Task: T085 [US5] Add admin client tests in clients/tests/admin-difficulty-transactions.test.ts
Task: T086 [US5] Add admin frontend tests in app/tests/admin.spec.ts
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundation.
3. Complete Phase 3 US1.
4. Validate player wallet onboarding, one-time grant, home page actions, and
   character equipment rendering.

### Core Game Increment

1. Complete US2 after US1.
2. Validate start raid, low-risk landing, container open, encounter/battle,
   extraction, failure, timeout, and battle-record creation.

### Economy And Transparency Increment

1. Complete US3 marketplace.
2. Complete US4 warehouse and records.
3. Validate custody, EDcoins movement, listing fee, asset ownership, and random
   audit display.

### Admin Increment

1. Complete US5 admin configuration.
2. Validate difficulty version creation, unauthorized rejection, and active raid
   version locking.

### Final Validation

1. Complete Phase 8.
2. Run quickstart.
3. Run all format, lint, program, client, and frontend tests.

---

## Notes

- [P] tasks are parallelizable only when their file paths remain disjoint.
- Do not start user story implementation before Phase 2 foundation is complete.
- Do not send or sign transactions without transaction summary, simulation result,
  cluster, fee payer, and explicit wallet approval.
- Treat all account and RPC data as untrusted until decoded and validated.
- Keep active raid state, marketplace custody, EDcoins balances, admin difficulty
  versions, and battle records chain-authoritative.
