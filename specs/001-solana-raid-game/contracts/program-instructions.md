# Contract: On-Chain Program Instructions

All instructions must validate expected account owner, signer, mutability,
discriminator, token mint, and numeric bounds before state changes. All
transaction-building clients must display transaction summary, cluster, fee payer,
amounts, and simulated result before requesting wallet approval.

## initialize_game

**Actor**: deploying wallet

**Purpose**: Create global game config, EDcoins mint references, treasury
accounts, and set the deploying wallet as the initial admin authority.

**Inputs**:

- deploying wallet to become the initial admin authority
- EDcoins mint
- EDcoins treasury token account
- SOL treasury
- starter grant values
- SOL-to-EDcoins exchange rate

**Success**:

- Game config exists with expected authorities and token references.

**Failure**:

- Missing signer, mismatched mint, invalid treasury, or duplicate config.

## create_or_connect_player

**Actor**: player wallet

**Purpose**: Initialize a player profile and issue the one-time starter grant.

**Inputs**:

- player wallet signer
- player EDcoins token account
- player profile address

**Success**:

- New profile receives 20,000 EDcoins base units, armor balance 20.0, and weapon
  balance 20.0.
- Existing profile returns current state without issuing another grant.

**Failure**:

- Wrong wallet signer, invalid token account, or attempted duplicate grant.

## convert_sol_to_edcoins

**Actor**: player wallet

**Purpose**: Convert SOL to EDcoins at the fixed 1:10,000 rate.

**Inputs**:

- player wallet signer
- SOL amount
- player EDcoins token account
- SOL treasury

**Success**:

- SOL moves to treasury and EDcoins are minted/transferred to the player at the
  configured rate.

**Failure**:

- Zero amount, insufficient SOL, invalid treasury, invalid mint, or wrong owner.

## create_difficulty_version

**Actor**: authorized admin

**Purpose**: Create a selectable difficulty configuration version.

**Inputs**:

- difficulty identifier and version
- display name
- entry fee
- low/mid/high risk area counts
- base encounter probabilities
- enemy combat parameter ranges
- loot quality weights

**Success**:

- New active difficulty version becomes selectable for future raids.

**Failure**:

- Unauthorized signer, invalid probabilities, negative fee, empty loot weights,
  or enemy min greater than enemy max.

## start_raid

**Actor**: player wallet

**Purpose**: Pay entry fee, lock selected equipment and difficulty version, and
create an active raid session.

**Inputs**:

- difficulty id/version
- selected safe case or none
- armor amount in tenths
- weapon amount in tenths
- player EDcoins token account

**Success**:

- Entry fee is collected.
- Raid starts in low-risk area with locked difficulty version and selected
  equipment.

**Failure**:

- Insufficient EDcoins, invalid equipment ranges, unavailable difficulty,
  already-active raid, invalid asset ownership, or invalid token account.

## select_safe_case_items

**Actor**: player wallet

**Purpose**: Confirm which carried raid loot is protected on failure.

**Inputs**:

- active raid
- selected carried asset ids

**Success**:

- Safe-case selection is updated if item count is within capacity and all items
  are carried by this raid.

**Failure**:

- Item count exceeds capacity, item not carried, no safe case, wrong player, or
  raid not active.

## open_container

**Actor**: player wallet

**Purpose**: Open one container in the current risk area, resolve loot drop, and
resolve encounter check.

**Inputs**:

- active raid
- container identifier
- final random value

**Success**:

- Container is marked opened.
- Loot is added to carried loot according to locked difficulty weights.
- Encounter random event is recorded.
- If enemy is encountered, raid enters pending battle resolution or resolves
  battle in the same transaction according to implementation decision.

**Failure**:

- Container already opened, invalid area, timeout reached, missing random audit
  data, wrong player, or malformed raid state.

## fight_enemy

**Actor**: player wallet

**Purpose**: Resolve mandatory battle when an enemy is encountered.

**Inputs**:

- active raid
- enemy combat parameter from locked difficulty range
- final random value

**Success**:

- Weapon parameter <= 1.0 resolves as defeat.
- Otherwise battle uses difference-based tiers capped at 15%-85%.
- Victory degrades current combat capability and raid remains active.
- Defeat settles raid as failed.

**Failure**:

- No pending enemy, missing random audit data, timeout reached, or invalid enemy
  range.

## move_area

**Actor**: player wallet

**Purpose**: Move to another risk area and increase future encounter chance by 15
percentage points.

**Inputs**:

- target risk area

**Success**:

- Current area changes and accumulated area-change encounter increment updates.

**Failure**:

- Invalid target area, raid not active, or timeout reached.

## extract_raid

**Actor**: player wallet

**Purpose**: End raid successfully without enemy encounter.

**Success**:

- Carried loot moves to warehouse.
- Battle record is created with retained loot and random audit data.
- Raid status becomes succeeded.

**Failure**:

- Raid inactive, timeout reached, malformed carried loot, or invalid ownership.

## settle_failed_raid

**Actor**: player wallet or permitted timeout/interruption settlement caller

**Purpose**: Settle battle failure, timeout, or interruption.

**Success**:

- Current carried combat parameters become 0.
- Only last confirmed safe-case selected items are retained.
- Battle record is created.
- Raid status becomes failed or timed out.

**Failure**:

- Raid already settled, invalid safe-case selection, or wrong player where player
  signature is required.

## create_listing

**Actor**: seller wallet

**Purpose**: List a collectible, armor-point balance, or weapon-point balance for
sale after collecting the 3% fee.

**Inputs**:

- asset id or parameter amount
- price in EDcoins

**Success**:

- Fee `ceil(price * 3 / 100)` is collected.
- Asset is locked as listed.
- Listing becomes active.

**Failure**:

- Insufficient EDcoins for fee, invalid price, wrong owner, asset already listed
  or in raid, or non-tradable asset.

## purchase_listing

**Actor**: buyer wallet

**Purpose**: Buy an active marketplace listing.

**Success**:

- Buyer pays price in EDcoins.
- Listed asset transfers to buyer warehouse.
- Listing becomes sold.

**Failure**:

- Insufficient EDcoins, inactive listing, seller no longer owns asset, buyer is
  invalid, or token transfer validation fails.

## cancel_listing

**Actor**: seller wallet

**Purpose**: Cancel an active listing and unlock the asset.

**Success**:

- Listing becomes canceled and asset returns to available warehouse state.

**Failure**:

- Wrong seller, listing not active, or asset ownership mismatch.
