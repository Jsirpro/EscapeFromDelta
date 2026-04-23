# Contract: UI Routes

The app must treat on-chain reads as untrusted until validated by the client
decoder. All wallet actions show pending state, errors, cluster, fee payer, and
transaction intent before approval.

## `/`

**Audience**: player

**Purpose**: Default player home page.

**Required content**:

- Wallet connect/disconnect state
- Minecraft-like player character
- Equipment appearance that changes with armor-point balance and weapon-point balance
- SOL-to-EDcoins conversion entry with fixed 1:10,000 rate display
- Primary actions: Play, Marketplace, Warehouse, Battle Records
- Starter grant status or first-connect pending state

**Error states**:

- Wallet unavailable
- Profile unavailable
- Invalid or wrong-owner account data
- Wallet rejection or failed SOL-to-EDcoins conversion

## `/play`

**Audience**: player

**Purpose**: Difficulty selection, equipment configuration, and active raid flow.

**Required flow**:

1. Select difficulty.
2. Review entry fee and locked config version.
3. Select safe case or none.
4. Configure armor from 1.0 to 6.0.
5. Configure weapon from 1.0 to 5.0.
6. Start raid and show 2-second transition.
7. Land in low-risk area.
8. Open containers, fight when required, move area, update safe-case selection,
   or extract.
9. Show settlement result and battle-record link.

**Required feedback**:

- Every raid action shows transition/pending feedback within 1 second of user
  input, excluding wallet approval time.
- Encounter, battle, loot, extraction, failure, timeout, and interruption states
  are user-readable.

**Error states**:

- Insufficient EDcoins
- Invalid equipment range
- Active raid already exists
- Timeout/failure settlement needed
- Wallet rejects transaction

## `/marketplace`

**Audience**: player

**Purpose**: Buy and sell collectibles, armor-point balances, and weapon-point
balances.

**Required flow**:

- Browse active listings.
- Create listing with EDcoins price.
- Show listing fee equal to rounded-up 3%.
- Confirm fee payment before activation.
- Purchase active listing.
- Cancel own active listing.

**Error states**:

- Insufficient EDcoins for fee or purchase
- Listing already sold/canceled
- Seller no longer owns asset
- Invalid price
- Wrong wallet owner

## `/warehouse`

**Audience**: player

**Purpose**: Show balances and owned assets for raid equipment and trading.

**Required content**:

- EDcoins balance
- Collectibles
- Armor-point balances
- Weapon-point balances
- Safe cases
- Asset states: available, in raid, listed, consumed

**Error states**:

- Missing profile
- Invalid asset state
- Wrong-owner account data

## `/records`

**Audience**: player/support

**Purpose**: Query battle records for a wallet.

**Required content**:

- Raid result
- Difficulty id and locked version
- Retained and lost assets
- Entry fee
- Start and settlement time
- Encounter, battle, and loot random audit data

**Error states**:

- No records
- Malformed record
- Missing random audit data
- Wrong-owner record

## `/admin`

**Audience**: authorized admin

**Purpose**: Create and update difficulty configuration versions.

**Required flow**:

1. Verify connected wallet is an active admin.
2. Display existing difficulty versions.
3. Create a new difficulty or update by creating a new version.
4. Configure entry fee, risk area counts, base encounter chances, enemy combat
   ranges, and loot quality weights.
5. Submit with transaction summary and wallet approval.

**Error states**:

- Unauthorized wallet
- Invalid probabilities
- Negative entry fee
- Empty loot table
- Enemy minimum greater than maximum
- Wallet rejects transaction

## Responsive Behavior

- Routes must support desktop and mobile web.
- Text must remain readable and contained in its parent.
- Fixed-format UI elements such as raid action controls, marketplace rows,
  counters, and equipment selectors must remain layout-stable as state changes.
