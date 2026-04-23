# Account Map: Escape from Delta On-Chain Accounts

This document defines the Solana account ownership, PDA derivation, signer rules,
mutability, token program variant, size budget, numeric precision, and overflow
behavior required by the feature data model.

## Global Rules

- Program-owned game accounts are owned by the Escape from Delta Anchor program.
- EDcoins mint and token accounts use the configured SPL token program ID, with
  Token-2022-compatible checked transfer semantics.
- All PDA seeds include a static prefix and the minimum stable identifiers needed
  to prevent collisions.
- All instruction handlers validate owner, signer, mutability, discriminator,
  schema version, PDA seeds, expected mint, and numeric bounds before mutation.
- Fixed-point armor-point balance and weapon-point balance values use tenths.
  Example: `20.0` is stored as `200`.
- EDcoins values use base units named lamports of EDcoins.
- Checked arithmetic is required for balances, fees, fixed-point equipment values,
  probabilities, counters, and account-size dependent vector lengths.
- Overflow, underflow, invalid rounding, and out-of-range probability inputs fail
  before state changes.

## Account Matrix

| Account | PDA Seed / Address Derivation | Owner | Signer Authority | Mutability | Token Program | Size Budget | Precision | Overflow / Bounds |
|---------|--------------------------------|-------|------------------|------------|---------------|-------------|-----------|-------------------|
| GameConfig | `["game_config"]` | Escape from Delta program | deploying wallet initializes; active admin mutates supported global admin fields | Mutable for initialization/admin rotation, readonly for player flows | Stores configured EDcoins token program ID | Fixed account with global authorities, mint, treasury, rates, schema version | EDcoins base units; SOL-to-EDcoins rate integer | Duplicate init, invalid treasury, invalid rate, or mismatched token program fails |
| AdminProfile | `["admin", admin_wallet]` | Escape from Delta program | deploying wallet creates first admin; active admin authorizes later admin changes if implemented | Mutable for active flag and metadata, readonly for auth checks | N/A | Fixed account per admin wallet | Boolean active flag, timestamp | Unauthorized signer or inactive admin fails |
| PlayerProfile | `["player", player_wallet]` | Escape from Delta program | player wallet | Mutable for grant status, active raid reference, warehouse nonce | References player EDcoins token account | Fixed account per player wallet | Grant claimed boolean, timestamp, nonce | Duplicate starter grant and wrong signer fail |
| EDcoins Mint | Configured mint address in GameConfig | Configured SPL token program | mint authority controlled by configured game authority or deploy setup | Mutable only for minting/conversion authority flows | Token-2022-compatible checked mint/transfer | SPL mint account | EDcoins base units | Invalid mint, decimals, or authority fails |
| EDcoins Token Account | Associated or explicitly supplied token account for wallet/treasury | Configured SPL token program | wallet owner or program-controlled treasury authority | Mutable for entry fees, listing fees, purchases, conversion credits | Token-2022-compatible checked transfer | SPL token account | EDcoins base units | Insufficient funds, wrong owner, wrong mint, or unchecked transfer fails |
| WarehouseAsset | `["asset", owner_profile, asset_id]` | Escape from Delta program | owner player wallet for custody actions; marketplace/raid instructions lock state | Mutable for ownership, lock state, point balances, safe-case state | N/A | Variable bounded by asset metadata and enum fields | Armor/weapon tenths; safe-case capacity integer | Invalid owner, locked asset reuse, equipment cap overflow, or invalid safe-case capacity fails |
| DifficultyConfiguration | `["difficulty", difficulty_id, version]` | Escape from Delta program | active admin wallet | Immutable after creation except active/selectable flag if supported | N/A | Bounded by low/mid/high area config and loot weights | Probabilities as basis points or configured points; EDcoins base units | Negative fee, invalid probability, empty weights, or enemy min > max fails |
| RaidSession | `["raid", player_profile, raid_id]` | Escape from Delta program | player wallet for player actions; permitted timeout/interruption settlement caller for failure settlement | Mutable until settlement, readonly after completed record links | References EDcoins token account for entry fee | Bounded by risk area states, carried loot references, safe-case selection, random event references | Armor/weapon tenths; probability points; timestamps | Active raid duplication, timeout, too many container opens, invalid state transition, or carried vector bound overflow fails |
| MarketplaceListing | `["listing", seller_profile, listing_id]` | Escape from Delta program | seller wallet creates/cancels; buyer wallet purchases | Mutable until sold/canceled, readonly afterward | Uses configured EDcoins token accounts for fee and purchase settlement | Fixed listing fields plus asset reference | EDcoins base units; fee `ceil(price * 3 / 100)` | Fractional fee rounds up; invalid price, sold/canceled state, wrong owner, or insufficient funds fails |
| BattleRecord | `["battle_record", player_profile, raid_id]` | Escape from Delta program | settlement instruction creates; no admin rewrite authority | Immutable after creation | N/A | Bounded by retained/lost asset lists and random audit events | EDcoins base units; timestamps; final random values | Duplicate record, malformed audit data, missing difficulty version, or vector bound overflow fails |
| RandomEventAudit | Embedded in RaidSession during active raid and BattleRecord after settlement, or PDA `["random_event", raid_id, event_id]` if split for size | Escape from Delta program | raid action signer records event through program instruction | Mutable while active raid appends events, immutable in completed battle record | N/A | Bounded per raid action count and event schema | Final random value, threshold, outcome enum | Missing final random value, invalid threshold, or event count overflow fails |

## Instruction Account Ownership Summary

| Instruction | Creates | Mutates | Required Signer |
|-------------|---------|---------|-----------------|
| `initialize_game` | GameConfig, first AdminProfile when needed | EDcoins mint/treasury references in GameConfig | deploying wallet |
| `create_or_connect_player` | PlayerProfile, starter WarehouseAsset balances when new | PlayerProfile, player EDcoins token account | player wallet |
| `convert_sol_to_edcoins` | None | player EDcoins token account, SOL treasury accounting | player wallet |
| `create_difficulty_version` | DifficultyConfiguration | GameConfig version/index metadata if present | active admin wallet |
| `start_raid` | RaidSession | PlayerProfile, EDcoins token account, selected WarehouseAsset lock states | player wallet |
| `select_safe_case_items` | None | RaidSession safe-case selection | player wallet |
| `open_container` | WarehouseAsset loot or carried loot references | RaidSession, RandomEventAudit storage | player wallet |
| `fight_enemy` | BattleRecord on defeat if settled immediately | RaidSession, RandomEventAudit storage, equipment runtime values | player wallet |
| `move_area` | None | RaidSession area state and encounter increment | player wallet |
| `extract_raid` | BattleRecord, settled WarehouseAsset loot | RaidSession, PlayerProfile, WarehouseAsset states | player wallet |
| `settle_failed_raid` | BattleRecord | RaidSession, WarehouseAsset states, runtime combat values | player wallet or permitted settlement caller |
| `create_listing` | MarketplaceListing | seller EDcoins token account, treasury token account, WarehouseAsset lock state | seller wallet |
| `purchase_listing` | None | buyer/seller/treasury EDcoins token accounts, MarketplaceListing, WarehouseAsset ownership | buyer wallet |
| `cancel_listing` | None | MarketplaceListing, WarehouseAsset lock state | seller wallet |

## Implementation Alignment

The implementation task `T011` creates `programs/escape_from_delta/src/state/account_map.rs`.
That source file must mirror this account map and should be updated whenever this
document changes.
