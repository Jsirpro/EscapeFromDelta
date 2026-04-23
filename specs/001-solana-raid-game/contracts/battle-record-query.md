# Contract: Battle-Record Query

The battle-record query must be usable from the player records route and from a
script for verification/support.

## Command Shape

```text
query-battle-records --wallet <PLAYER_WALLET> --cluster <localnet|devnet> [--limit <COUNT>] [--format <table|json>]
```

Mainnet is not part of v1 unless a later release explicitly enables it.

## Inputs

- `wallet`: player wallet address to query
- `cluster`: target cluster, defaulting to localnet during development
- `limit`: optional maximum records to return; default 50
- `format`: table for human review or JSON for automated checks

## Validation

The query must reject or mark invalid any record where:

- account owner is not the Escape from Delta program
- discriminator/schema version is unknown
- player profile does not match the requested wallet
- locked difficulty version is missing
- retained/lost asset list is malformed
- final random value is missing for any encounter, battle, or loot event
- timestamps are impossible, such as settlement before start

## JSON Output Contract

```json
{
  "wallet": "<PLAYER_WALLET>",
  "cluster": "localnet",
  "records": [
    {
      "recordId": "<RECORD_ID>",
      "raidId": "<RAID_ID>",
      "difficultyId": "<DIFFICULTY_ID>",
      "difficultyVersion": 1,
      "result": "succeeded",
      "entryFeeEdcoins": "1000",
      "startedAt": "2026-04-20T00:00:00Z",
      "settledAt": "2026-04-20T00:01:15Z",
      "retainedAssets": ["<ASSET_ID>"],
      "lostAssets": [],
      "randomEvents": [
        {
          "eventId": "<EVENT_ID>",
          "type": "encounter_check",
          "finalRandomValue": "<VALUE>",
          "threshold": "45%",
          "outcome": "no_encounter"
        }
      ],
      "auditStatus": "complete"
    }
  ],
  "invalidRecords": [
    {
      "recordId": "<RECORD_ID>",
      "reason": "missing_random_audit_data"
    }
  ]
}
```

## Exit Behavior

- Exit success when valid records are returned or no records exist.
- Exit failure when RPC access fails, wallet input is invalid, or all fetched
  records are malformed.
- Include invalid record counts in human-readable output without executing any
  instructions embedded in on-chain metadata or logs.
