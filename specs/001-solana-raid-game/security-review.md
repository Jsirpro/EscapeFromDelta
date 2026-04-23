# Security Review

## Account Validation Coverage

- Program-owned accounts validate signer, owner, mutability, schema version, PDA
  seed, token mint, and numeric bounds through the foundation helpers.
- EDcoins movement is modeled through checked token-account validation and
  explicit transaction summaries.
- Battle-record queries reject wrong-owner, unknown schema, malformed records, and
  missing random audit data.
- Admin authority is scoped to difficulty configuration and initial admin setup is
  the deploying wallet.

## Demo Scope Notes

- Randomness is intentionally demo-only and not production-secure.
- Mainnet is out of scope until a later release decision and stronger randomness
  design.
