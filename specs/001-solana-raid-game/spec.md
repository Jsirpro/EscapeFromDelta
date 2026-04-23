# Feature Specification: Escape from Delta On-Chain Raid Game

**Feature Branch**: `001-solana-raid-game`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "Build a Solana on-chain game named Escape from Delta with extraction-shooter style PVE raids, EDcoins token economy, marketplace, warehouse, battle-record query, player page, and admin configuration."

## Clarifications

### Session 2026-04-20

- Q: How is battle win probability derived from player and enemy combat values? → A: Difference-based tiers with minimum 15% win chance and maximum 85% win chance, except equipped weapon value less than or equal to 1.0 remains an automatic defeat.
- Q: How should enemy encounter probability increase after repeated actions? → A: Opening another container in the same area adds 5 percentage points, moving to another area adds 15 percentage points, and total encounter chance is capped at 95%.
- Q: How are safe-case retained items selected when a raid fails? → A: The player selects retained items from carried loot up to the selected safe-case capacity during or before failure settlement.
- Q: When do admin difficulty updates take effect for active raids? → A: A raid locks the selected difficulty configuration version at start; admin updates affect only raids started after the update.
- Q: What randomness audit data must completed battle records retain? → A: For this demo, each enemy encounter, battle, and loot drop records the final random value used for the outcome.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start as a Wallet Player (Priority: P1)

A new player connects a wallet, receives the one-time starter grant, and lands on
the player home page with clear access to play, marketplace, warehouse, and
battle-record query.

**Why this priority**: The game has no usable entry point until a player can
connect, receive starting resources, and understand where to go next.

**Independent Test**: Connect a wallet that has never played before and verify the
starter grant, home page navigation, warehouse balance, and character equipment
display without using the raid or marketplace flows.

**Acceptance Scenarios**:

1. **Given** a wallet with no existing player profile, **When** the wallet connects for the first time, **Then** the player receives 20,000 lamports of EDcoins, armor-point balance 20.0, weapon-point balance 20.0, and a single initialized player profile.
2. **Given** a wallet that already received the starter grant, **When** the same wallet connects again, **Then** no additional starter EDcoins, armor, or weapon grant is issued.
3. **Given** a connected player, **When** the home page loads, **Then** play, marketplace, warehouse, and battle-record query actions are visible, and the central character visually reflects the player's current armor-point balance and weapon-point balance.

---

### User Story 2 - Complete a PVE Raid Loop (Priority: P1)

A player chooses a difficulty, pays the EDcoins entry fee, selects equipment, opens
containers across risk areas, fights encountered enemies, and either extracts with
loot or fails and keeps only safe-case protected items.

**Why this priority**: The raid loop is the core game experience and defines item
creation, equipment loss, combat risk, and player progression.

**Independent Test**: Start a raid from a funded player profile, run through
entry, low-risk landing, container opening, battle resolution, extraction, and
failure paths while verifying inventory and equipment outcomes.

**Acceptance Scenarios**:

1. **Given** a funded player with valid equipment, **When** the player pays the selected difficulty entry fee and starts a raid, **Then** the fee is deducted, the chosen equipment is locked for the raid, and the player enters the low-risk area after a 2-second transition.
2. **Given** the player is in a risk area with unopened containers, **When** the player opens one container, **Then** loot is generated according to that area's configured loot probabilities and an enemy encounter is resolved using that area's current encounter chance.
3. **Given** the player encounters an enemy, **When** battle is resolved, **Then** only battle is available as the response, victory allows the raid to continue with reduced combat capability, and defeat ends the raid with carried combat parameters set to 0.
4. **Given** the player chooses extraction, **When** extraction completes, **Then** no enemy encounter occurs and eligible raid loot is moved to the warehouse.
5. **Given** the raid is interrupted or exceeds two minutes without completion, **When** the system settles the raid, **Then** it is treated as a battle failure and only player-selected safe-case protected items are retained.

---

### User Story 3 - Trade Items and Equipment (Priority: P2)

A player buys and sells collectibles, armor-point balances, and weapon-point balances in
the marketplace using EDcoins, with sellers paying a 3% listing fee.

**Why this priority**: The marketplace gives EDcoins ongoing utility and lets
players recover, upgrade, and exchange raid rewards.

**Independent Test**: Use two player wallets to list an item, charge the seller
fee, purchase the listing, and verify both players' warehouse balances and item
ownership after settlement.

**Acceptance Scenarios**:

1. **Given** a player owns a tradable collectible, armor-point balance, or weapon-point balance, **When** the player lists it for sale, **Then** the player chooses an EDcoins price and pays a listing fee equal to 3% of that price before the listing becomes active.
2. **Given** an active listing and a buyer with enough EDcoins, **When** the buyer purchases the listing, **Then** EDcoins are transferred according to the sale terms and the listed asset moves to the buyer's warehouse.
3. **Given** a player lacks enough EDcoins for a listing fee or purchase, **When** the player attempts the action, **Then** the action is rejected and no asset ownership changes.

---

### User Story 4 - Manage Warehouse and Battle Records (Priority: P2)

A player reviews warehouse contents, balances, and battle history so they can plan
future raids and confirm past outcomes.

**Why this priority**: Players need transparent custody and raid history to trust
losses, gains, and marketplace decisions.

**Independent Test**: After onboarding, marketplace actions, and raid settlement,
open the warehouse and battle-record query for the same wallet and verify they
match the player's actual balances, inventory, and completed raid outcomes.

**Acceptance Scenarios**:

1. **Given** a player has EDcoins, collectibles, armor-point balances, weapon-point balances, and safe cases, **When** the warehouse opens, **Then** all balances and owned assets are shown with enough detail to choose raid equipment or marketplace listings.
2. **Given** a player has completed raids, **When** battle records are queried for that wallet, **Then** the player can see each raid's difficulty, result, extracted or lost items, and governing risk configuration.
3. **Given** malformed, missing, or wrong-owner record data is encountered, **When** records are queried, **Then** invalid records are rejected and the player sees a clear unavailable or invalid-record message.
4. **Given** a completed raid contained encounter checks, battles, or loot drops, **When** battle records are queried, **Then** each random event shows its final random value.

---

### User Story 5 - Configure Game Difficulty as Admin (Priority: P3)

An authorized admin creates and updates available difficulties, including entry
fees, risk-area counts, encounter probabilities, enemy combat ranges, and loot
quality probabilities.

**Why this priority**: Admin configuration allows the game economy and raid risk
to be balanced without changing player-facing flows.

**Independent Test**: Sign in as an authorized admin, create a difficulty, verify
players can select it, and confirm raids use that difficulty's fees, risk values,
enemy ranges, and loot probabilities.

**Acceptance Scenarios**:

1. **Given** an authorized admin at `/admin`, **When** the admin creates a difficulty, **Then** the difficulty becomes selectable by players with its configured entry fee, risk areas, encounter rates, enemy ranges, and loot probabilities.
2. **Given** an unauthorized wallet visits `/admin`, **When** it attempts to create or update a difficulty, **Then** the action is rejected and no game configuration changes.
3. **Given** an admin updates a difficulty, **When** a later raid uses that difficulty, **Then** the battle record identifies the configuration version that governed the raid.
4. **Given** a raid is already active, **When** an admin updates the selected difficulty, **Then** the active raid continues using the configuration version locked at raid start.

### Edge Cases

- A wallet reconnects after receiving the one-time grant; the grant must not repeat.
- A player attempts to start a raid without enough EDcoins for the entry fee.
- A player selects armor below 1.0 or above 6.0, or weapon below 1.0 or above 5.0, for raid equipment.
- A player enters battle with equipped weapon value less than or equal to 1.0; the enemy encounter must be lost.
- A player keeps opening containers in the same area; encounter chance must increase by 5 percentage points for each subsequent same-area container action.
- A player moves to another risk area; encounter chance must increase by 15 percentage points for each area-change action.
- Accumulated encounter chance increases would exceed 95%; the effective encounter chance must remain capped at 95%.
- A player extracts immediately after landing; extraction must not trigger an enemy encounter.
- A player fails while carrying more items than safe-case capacity; only the player-selected protected items up to safe-case capacity are retained.
- A player has not explicitly selected enough safe-case protected items at failure settlement; the player must be prompted to choose from carried loot up to the remaining capacity before final settlement, unless the failure is caused by interruption or timeout.
- A player has no safe case and fails; no raid loot is retained.
- A raid is interrupted by disconnect, closed page, or timeout after two minutes; it settles as failure using the last confirmed safe-case selection.
- A seller lists an asset with a price where 3% produces fractional EDcoins; the fee must be rounded up to the smallest supported EDcoins unit.
- A buyer tries to purchase a listing that was already sold, canceled, or no longer owned by the seller.
- An admin configures invalid probabilities, negative fees, empty loot tables, or enemy ranges where minimum exceeds maximum.
- An admin updates a difficulty while raids using its previous version are active; active raids must continue using their locked version.
- A battle record is missing the final random value for a random event; the record must be treated as incomplete for audit display.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a wallet-connected player profile for Escape from Delta.
- **FR-002**: The system MUST issue the one-time starter grant of 20,000 lamports of EDcoins, armor-point balance 20.0, and weapon-point balance 20.0 only to wallets with no prior player profile; these balances are warehouse resources, and each raid may equip only values within the per-raid armor and weapon ranges.
- **FR-003**: The system MUST allow players to exchange SOL for EDcoins at a fixed 1:10,000 rate.
- **FR-004**: The system MUST NOT allow EDcoins to be exchanged back to SOL in this feature scope.
- **FR-005**: The default route MUST be the player home page, and the admin page MUST be available only through `/admin`.
- **FR-006**: The player home page MUST show play, marketplace, warehouse, and battle-record query actions.
- **FR-007**: The player home page MUST show a Minecraft-like character whose displayed armor and weapon appearance changes when the player's armor-point balance or weapon-point balance changes.
- **FR-008**: The warehouse MUST show the player's EDcoins balance, collectibles, safe cases, armor-point balance, weapon-point balance, and assets available for raid equipment or trade.
- **FR-009**: The system MUST allow players to choose a difficulty, pay its EDcoins entry fee, select a safe case, armor, and weapon, and start a raid.
- **FR-010**: Safe-case selection MUST support no safe case and purchasable capacities that retain 1, 2, or 3 player-selected carried items after raid failure.
- **FR-011**: Raid armor equipment MUST accept values from 1.0 through 6.0, and raid weapon equipment MUST accept values from 1.0 through 5.0.
- **FR-012**: The backpack MUST require no purchase and MUST allow unlimited carried raid loot for the current feature scope.
- **FR-013**: A raid MUST show a 2-second transition before the player lands in the low-risk area.
- **FR-014**: Each risk area in a raid MUST provide five containers unless the active admin difficulty config specifies a different number of risk-area instances.
- **FR-015**: Default risk areas MUST include low risk with 10% base enemy encounter chance, medium risk with 30%, and high risk with 50%.
- **FR-016**: Opening a container MUST generate loot according to the active difficulty's area-specific loot quality probabilities.
- **FR-017**: Opening a container MUST resolve enemy encounter chance using the current area's base probability plus accumulated action increases, capped at a maximum effective encounter chance of 95%.
- **FR-018**: Continuing to open containers in the same area MUST add 5 percentage points to future encounter chance, and moving to another area MUST add 15 percentage points to future encounter chance.
- **FR-019**: When an enemy is encountered, the player MUST only be able to fight.
- **FR-020**: Battle resolution MUST use difference-based probability tiers comparing the player's equipped armor value plus equipped weapon value against the enemy combat parameter, with player win chance capped at a minimum of 15% and a maximum of 85%.
- **FR-021**: An equipped weapon value less than or equal to 1.0 MUST cause enemy encounters to resolve as player defeat.
- **FR-022**: Winning a battle MUST allow the raid to continue and MUST reduce the player's current raid combat capability for later battles.
- **FR-023**: Losing a battle MUST end the raid, set carried combat parameters to 0, and retain only player-selected carried items protected by the selected safe case.
- **FR-024**: Choosing extraction MUST end the raid successfully without triggering an enemy encounter.
- **FR-025**: A raid interrupted before settlement or active for more than two minutes MUST settle as a battle failure.
- **FR-026**: The marketplace MUST allow players to trade collectibles, armor-point balances, and weapon-point balances for EDcoins.
- **FR-027**: Sellers MUST set an EDcoins listing price and pay a fee equal to 3% of that price before a listing becomes active.
- **FR-028**: Marketplace purchases MUST transfer the listed asset to the buyer and settle EDcoins according to the sale terms.
- **FR-029**: Battle-record query MUST allow a player to retrieve completed raid outcomes for a wallet, including difficulty, result, loot retained or lost, and relevant risk configuration.
- **FR-030**: The admin page MUST allow only authorized admins to create and update difficulty configurations.
- **FR-031**: Admin difficulty configuration MUST include loot quality probabilities, low/medium/high risk area counts, base encounter probabilities, entry fee, and enemy combat parameter ranges per risk area.
- **FR-032**: Admin configuration changes MUST create a new effective configuration version for future raids and MUST NOT alter raids that already locked an earlier version at start.
- **FR-033**: Battle-record query MUST show the difficulty configuration version locked when the raid started.
- **FR-034**: Battle records MUST include the final random value for each enemy encounter check, battle result, and loot drop.
- **FR-035**: Every player-visible game action during the raid MUST include smooth transition feedback and must not require movement, aiming, healing, or other real-time action controls.
- **FR-036**: Failed payments, invalid equipment, invalid listings, invalid admin settings, and unavailable records MUST leave player custody unchanged and show a clear failure message.

### On-Chain, Economy & Game Integrity *(mandatory for Escape from Delta features)*

- **OC-001**: Player profiles, EDcoins balances, warehouse assets, equipped raid assets, active raid state, marketplace listings, admin difficulty configurations, and completed battle records MUST be authoritative chain-backed state whenever they affect custody, gameplay, or trading.
- **OC-002**: Every custody-changing or configuration-changing action MUST verify the acting wallet's authority, expected account ownership, mutable state, and valid numeric ranges before state changes.
- **EC-001**: The feature changes EDcoins issuance, SOL-to-EDcoins conversion, marketplace fee collection, marketplace settlement, raid entry fee collection, asset custody, and equipment loss rules.
- **GR-001**: Raid state transitions MUST cover entry paid, equipment selected, low-risk landing, container opened, encounter checked, battle settled, durability reduced, area changed, extraction, failure, interruption, and timeout.
- **GR-002**: Each enemy encounter check, battle result, and loot drop MUST store the final random value used for the outcome in the completed battle record.
- **AD-001**: Admin authority is required only for difficulty configuration; admins cannot grant arbitrary player loot, alter player balances, or rewrite completed battle records in this feature scope.
- **UX-001**: Affected routes are the player home route, `/admin`, play flow, marketplace, warehouse, and battle-record query; all must display wallet state, pending actions, errors, and raid transitions in user-readable form.

### Key Entities *(include if feature involves data)*

- **Player Profile**: A wallet-linked player record containing grant status, balances, warehouse summary, owned assets, and game eligibility.
- **EDcoins Balance**: The player's spendable game currency used for entry fees, marketplace fees, marketplace purchases, and SOL conversion.
- **Warehouse Asset**: A collectible, armor-point balance, weapon-point balance, or safe case owned by a player and available for equipment or trading.
- **Safe Case**: A purchasable retention container with capacity 1, 2, or 3 items, or no selected case.
- **Difficulty Configuration**: Admin-managed versioned rules for entry fee, risk areas, encounter rates, enemy combat ranges, and loot probabilities.
- **Risk Area**: A low, medium, or high risk exploration area with containers, base encounter probability, loot table, and enemy range.
- **Raid Session**: A player's active or completed raid with selected equipment, locked difficulty configuration version, current area, opened containers, carried loot, combat degradation, start time, status, and result.
- **Marketplace Listing**: A seller-owned offer for a tradable asset with price, fee paid status, listing state, seller, buyer if sold, and settlement result.
- **Battle Record**: An immutable completed raid summary used for player history and auditability, including final random values for encounter checks, battle results, and loot drops.
- **Admin Profile**: An authorized operator identity allowed to manage difficulty configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time wallet connections receive exactly one starter grant, and repeat connections receive no additional starter grant.
- **SC-002**: A funded player can start a raid, open at least one container, and either extract or fail within 3 minutes in a standard user test.
- **SC-003**: 95% of raid actions provide visible transition or pending feedback within 1 second of user input, excluding wallet approval time.
- **SC-004**: 100% of completed raids produce a battle record showing result, selected difficulty, retained or lost loot, and relevant risk configuration.
- **SC-005**: 100% of marketplace listings charge the seller fee before activation and prevent purchase when buyer funds or seller ownership are invalid.
- **SC-006**: 100% of unauthorized admin configuration attempts are rejected without changing available difficulties.
- **SC-007**: In demo validation, the home page clearly exposes play, marketplace, warehouse, and battle-record actions without requiring instructions or hidden navigation.
- **SC-008**: Warehouse balances and item ownership match the player's completed raid and marketplace outcomes in 100% of custody verification cases.
- **SC-009**: 100% of completed battle records expose random audit data for every encounter check, battle result, and loot drop in that raid.
- **SC-010**: Battle-record query displays 50 completed records for one wallet within 2 seconds in a standard user test.

## Assumptions

- The first implementation is PVE-only; PVP, teaming, insurance, healing, and real-time movement are out of scope.
- Default low, medium, and high risk base encounter probabilities are 10%, 30%, and 50% until an admin difficulty overrides them.
- Numeric armor-point balance and weapon-point balance values are displayed with one decimal place to players; internal precision must preserve the specified ranges and loss rules.
- Starter armor-point balance and weapon-point balance values of 20.0 are warehouse resources, not
  values that can be directly equipped in one raid.
- If a 3% listing fee produces a fractional smallest unit, the fee is rounded up so the seller never pays less than 3%.
- The first version supports desktop and mobile web layouts, but the primary interaction model remains text-based buttons and wallet confirmations.
- The battle-record query is a player-facing query tool and must also be
  script-accessible for verification and support.
- Smooth transition animation means visible feedback for each raid action; wallet approval time is outside the animation duration target.
- The initial admin is set during deployment to the wallet that deploys the program; later admin rotation, if implemented, requires an authorized admin action.
