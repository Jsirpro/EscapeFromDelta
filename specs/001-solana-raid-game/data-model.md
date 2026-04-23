# Data Model: Escape from Delta On-Chain Raid Game

## Numeric Conventions

- EDcoins amounts are stored in base units named lamports of EDcoins.
- Armor-point balances and weapon-point balances are stored as fixed-point tenths for deterministic
  comparisons. Example: `20.0` is stored as `200`.
- Probability values are stored in basis points or percentage points consistently
  per account; UI displays percentages.
- Fee rounding: marketplace listing fee is `ceil(price * 3 / 100)` in EDcoins
  base units.

## On-Chain Account Map

Solana account ownership, PDA seeds or addresses, signer rules, mutability,
token program variant, account size budget, numeric precision, and overflow
behavior are defined in [account-map.md](./account-map.md). The entity
definitions below describe gameplay data and validation rules; the account map
is the authoritative design reference for chain account layout and authority
constraints.

## Entity: Game Config

Global game configuration and authorities.

**Fields**:

- `admin_authority`: deploying wallet initialized as the first admin authority and allowed to manage admin profiles and global config
- `edcoins_mint`: EDcoins token mint
- `treasury_edcoins_account`: receives entry fees and listing fees
- `sol_treasury`: receives SOL paid for EDcoins conversion
- `starter_grant_edcoins`: fixed at 20,000 EDcoins base units
- `starter_armor_tenths`: fixed at 200
- `starter_weapon_tenths`: fixed at 200
- `sol_to_edcoins_rate`: fixed at 10,000 EDcoins base units per SOL unit defined
  by the conversion contract
- `version`: config schema version

**Validation Rules**:

- During deployment, the program deployer wallet is initialized as the first
  admin authority; later rotation requires an authorized admin signer.
- EDcoins mint and treasury token accounts must match the expected mint.
- SOL-to-EDcoins conversion cannot expose an EDcoins-to-SOL path.

**Relationships**:

- Referenced by player profile creation, conversion, fee collection, and admin
  difficulty configuration.

## Entity: Admin Profile

Authorized operator identity for `/admin` actions.

**Fields**:

- `wallet`: admin wallet
- `active`: whether admin actions are allowed
- `created_at`: creation timestamp

**Validation Rules**:

- Admin configuration instructions require an active admin signer.
- Admins can configure difficulty versions only; they cannot mint arbitrary loot,
  alter player balances, or rewrite completed battle records.

## Entity: Player Profile

Wallet-linked player identity and grant status.

**Fields**:

- `wallet`: player wallet
- `grant_claimed`: boolean
- `profile_created_at`: timestamp
- `warehouse_nonce`: version/nonce for optimistic UI refreshes
- `active_raid`: optional active raid reference

**Validation Rules**:

- One profile per wallet.
- Starter grant can execute only when `grant_claimed` is false and profile is new.
- Player signer must match profile wallet for custody-changing actions.

**Relationships**:

- Owns warehouse assets, safe cases, raid sessions, listings, and battle records.
- Uses EDcoins token account for spendable currency.

## Entity: EDcoins Token Account

Spendable currency balance for a player, treasury, or marketplace settlement.

**Fields**:

- `owner`: wallet or program-controlled authority
- `mint`: EDcoins mint
- `amount`: base-unit balance

**Validation Rules**:

- All EDcoins transfers must use checked transfer semantics against the expected
  mint and decimals.
- Player purchases, entry fees, and listing fees fail if balance is insufficient.

## Entity: Warehouse Asset

Player-owned tradable or equipable asset.

**Fields**:

- `asset_id`: unique asset identifier
- `owner_profile`: owning player profile
- `asset_type`: `collectible`, `armor_points`, `weapon_points`, or `safe_case`
- `quality`: optional loot quality for collectibles
- `armor_tenths`: available armor-point balance
- `weapon_tenths`: available weapon-point balance
- `safe_case_capacity`: 1, 2, or 3 for safe cases
- `tradable`: boolean
- `locked_state`: `available`, `in_raid`, `listed`, or `consumed`
- `created_from`: starter grant, purchase, raid loot, or admin-defined table

**Validation Rules**:

- Armor-point assets may hold balances above one raid's equipment cap, but armor
  equipped for a single raid must be 10 through 60 tenths.
- Weapon-point assets may hold balances above one raid's equipment cap, but weapon
  equipped for a single raid must be 10 through 50 tenths.
- Safe case capacity must be 1, 2, or 3.
- Listed or in-raid assets cannot be listed again or transferred outside their
  active flow.

**Relationships**:

- Can be selected for raids, protected by a safe case, listed in marketplace, or
  created by loot drops.

## Entity: Difficulty Configuration

Versioned admin-managed raid rules.

**Fields**:

- `difficulty_id`: stable difficulty identifier
- `version`: monotonically increasing version
- `name`: player-facing label
- `active`: whether selectable for new raids
- `entry_fee_edcoins`: required EDcoins fee
- `risk_area_counts`: counts for low, medium, high risk area instances
- `base_encounter_chances`: low/mid/high defaults or overrides
- `enemy_combat_min_tenths`: per risk area
- `enemy_combat_max_tenths`: per risk area
- `loot_quality_weights`: per risk area
- `created_by_admin`: admin profile
- `created_at`: timestamp

**Validation Rules**:

- Entry fee cannot be negative.
- Risk area counts must include selectable low, medium, and high categories.
- Encounter chances must be 0 through 100 before runtime caps.
- Enemy min must be less than or equal to enemy max.
- Loot quality weights must be non-empty and sum to a deterministic configured
  total.
- Updating a difficulty creates a new version and does not mutate active raid
  behavior.

**Relationships**:

- Raid sessions lock one difficulty version at start.
- Battle records reference the locked version.

## Entity: Risk Area Runtime State

Per-raid area progress.

**Fields**:

- `risk_level`: `low`, `medium`, or `high`
- `containers_total`: default 5 per area instance
- `containers_opened`: count
- `same_area_increment_points`: accumulated +5 point increments
- `area_change_increment_points`: accumulated +15 point increments
- `effective_encounter_chance`: base plus increments, capped at 95%

**Validation Rules**:

- Cannot open more containers than available.
- Same-area container continuation adds 5 percentage points to future encounter
  chance.
- Area change adds 15 percentage points to future encounter chance.
- Effective encounter chance must never exceed 95%.

## Entity: Raid Session

Active or completed PVE raid state.

**Fields**:

- `raid_id`: unique raid identifier
- `player_profile`: owning player
- `status`: `preparing`, `active`, `extracting`, `succeeded`, `failed`, `timed_out`
- `locked_difficulty_id`: selected difficulty
- `locked_difficulty_version`: selected version at start
- `entry_fee_paid`: EDcoins amount
- `selected_safe_case`: optional safe case asset
- `safe_case_capacity`: 0, 1, 2, or 3
- `safe_case_selection`: selected carried asset IDs protected on failure
- `armor_asset`: selected armor asset
- `weapon_asset`: selected weapon asset
- `current_armor_tenths`: degraded runtime armor
- `current_weapon_tenths`: degraded runtime weapon
- `current_area`: risk area
- `area_states`: runtime state for each risk area
- `carried_loot`: asset IDs found during raid
- `random_events`: references or embedded audit events
- `started_at`: timestamp
- `settled_at`: optional timestamp

**Validation Rules**:

- Starts only after entry fee payment and valid equipment selection.
- Starts in low-risk area after UI transition.
- Weapon parameter less than or equal to 10 tenths causes enemy encounter defeat.
- Battle win probability is based on difference tiers, capped at 15% minimum and
  85% maximum.
- Raid older than two minutes without valid completion settles as failure.
- Extraction cannot trigger enemy encounter.
- Failure sets carried combat parameters to 0 and retains only selected safe-case
  protected items.
- Interruption/timeout uses the last confirmed safe-case selection.

**State Transitions**:

```text
preparing -> active -> extracting -> succeeded
preparing -> active -> failed
preparing -> active -> timed_out -> failed
active -> active (open container, win battle, move area)
active -> failed (lose battle, invalid timeout settlement)
```

## Entity: Random Event Audit

Demo audit data for probabilistic raid outcomes.

**Fields**:

- `event_id`: unique within raid
- `event_type`: `encounter_check`, `battle_result`, or `loot_drop`
- `final_random_value`: revealed random value used for settlement
- `threshold`: probability threshold used
- `outcome`: event result
- `created_at`: timestamp or action index

**Validation Rules**:

- Every encounter check, battle result, and loot drop must produce an audit event
  with the final random value used for the demo outcome.
- Battle records missing audit data are incomplete for audit display.

## Entity: Marketplace Listing

Seller offer for tradable assets.

**Fields**:

- `listing_id`: unique listing identifier
- `seller_profile`: owner
- `asset_id`: listed warehouse asset
- `price_edcoins`: sale price
- `fee_paid_edcoins`: rounded-up 3% listing fee
- `status`: `active`, `sold`, `canceled`, or `expired`
- `buyer_profile`: set when sold
- `created_at`: timestamp
- `settled_at`: optional timestamp

**Validation Rules**:

- Seller must own the asset and the asset must be available.
- Fee must be paid before listing becomes active.
- Purchase requires buyer balance >= price and active listing status.
- Sold/canceled/non-owned listings cannot be purchased.

## Entity: Battle Record

Immutable completed raid summary for player history and support.

**Fields**:

- `record_id`: unique record identifier
- `player_profile`: owner
- `raid_id`: source raid
- `difficulty_id`: locked difficulty
- `difficulty_version`: locked version
- `result`: `succeeded`, `failed`, or `timed_out`
- `retained_assets`: assets kept after settlement
- `lost_assets`: assets lost after settlement
- `entry_fee_paid`: EDcoins
- `started_at`: timestamp
- `settled_at`: timestamp
- `random_event_audits`: encounter, battle, and loot random audit data

**Validation Rules**:

- Created once at raid settlement.
- Cannot be rewritten by admin after completion.
- Query rejects wrong-owner, malformed, missing-discriminator, or incomplete audit
  records.

## Lifecycle Summary

1. Wallet initializes player profile and one-time grant.
2. Player optionally converts SOL to EDcoins.
3. Admin creates versioned difficulty configuration.
4. Player selects difficulty and equipment, pays entry fee, and starts raid.
5. Raid locks difficulty version and active equipment.
6. Player opens containers, moves areas, fights, extracts, or fails.
7. Settlement updates warehouse assets, equipment loss/degradation, and battle
   record.
8. Marketplace lists available assets after seller pays 3% fee.
9. Purchase transfers EDcoins and asset ownership.
10. Battle-record query validates and displays immutable completed records.
