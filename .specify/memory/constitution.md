<!--
Sync Impact Report
Version change: none -> 1.0.0
Modified principles: template placeholders -> initial Escape from Delta principles
Added sections: Product & Technical Constraints; Development Workflow & Quality Gates
Removed sections: none
Templates requiring updates:
- UPDATED .specify/templates/plan-template.md
- UPDATED .specify/templates/spec-template.md
- UPDATED .specify/templates/tasks-template.md
- REVIEWED .specify/templates/checklist-template.md (no change required)
- REVIEWED .specify/templates/agent-file-template.md (no change required)
- REVIEWED .specify/templates/commands/*.md (not present)
Follow-up TODOs: none
-->

# Escape from Delta Constitution

## Core Principles

### I. On-Chain State Is Authoritative
All player balances, owned items, equipped armor and weapon parameters, safe-case
capacity, active raid state, raid outcomes, listings, fees, and admin difficulty
configuration MUST be represented by validated Solana accounts or token balances
whenever those values affect gameplay or trading. Client UI and TypeScript scripts
MUST treat RPC responses and account data as untrusted input, verify ownership,
discriminators, signers, writable accounts, and data lengths before use. Rationale:
the game economy has transferable value, so off-chain convenience state cannot be
the source of truth for outcomes or custody.

### II. Fair Custody And Economy
EDcoins issuance, first-wallet grants, SOL-to-EDcoins conversion, marketplace
listing fees, purchases, and item transfers MUST be explicit, auditable, and
non-reversible unless a documented admin recovery path exists. The initial grant is
20,000 lamports of EDcoins plus armor 20.0 and weapon 20.0 only once per wallet;
SOL converts to EDcoins at 1:10,000, and EDcoins MUST NOT convert back to SOL in
the current product scope. Seller listing fees MUST equal 3% of the listed price
and be charged before the listing becomes active. Rationale: predictable token
rules prevent inflation bugs and make player losses understandable.

### III. Deterministic Rules, Probabilistic Outcomes
Gameplay features MUST encode the raid loop as deterministic state transitions
around explicit probability inputs: entry fee paid, equipment selected, low-risk
spawn, container open, enemy encounter roll, fight resolution, durability loss,
movement, extraction, failure, timeout, and interruption. Probability tables,
enemy combat parameter ranges, risk-area counts, encounter base rates, loot
quality weights, and entry fees MUST come from active admin difficulty
configuration. A raid MUST fail when interrupted or when more than two minutes
elapse without valid completion. Rationale: probabilistic games can still be
tested and audited when every transition and random input boundary is defined.

### IV. Admin Power Is Bounded
Admin pages and instructions MUST be separate from the default player experience
and reachable through `/admin` or explicit admin tooling only. Admin operations
MUST require an authorized signer and MUST be limited to configuring difficulty,
risk areas, encounter rates, enemy parameter ranges, entry fees, and loot
probabilities unless a specification explicitly adds more authority. Admin changes
MUST be recorded in account state or logs sufficient for TypeScript queries to
explain which configuration governed a raid. Rationale: players need assurance
that game operators cannot silently alter custody or raid results outside defined
controls.

### V. Testable Full-Stack Experience
Every feature that changes on-chain state, player custody, combat math, loot
distribution, marketplace behavior, wallet connection, or admin configuration MUST
include automated tests before implementation is considered complete. On-chain
program tests MUST cover success paths, authorization failures, invalid account
ownership, boundary numeric values, timeout/failure behavior, and economic
conservation. Frontend tests MUST cover wallet-state rendering, player/admin route
separation, inventory, marketplace, raid flow, and responsive text/animation
stability. Rationale: this project combines game feel with financial state, so
both correctness and interaction quality are release requirements.

## Product & Technical Constraints

- The project name is Escape from Delta.
- The primary product surfaces are the player home page, play flow, marketplace,
  warehouse, battle-record query, and admin page.
- The default route MUST be the player page; `/admin` MUST be the admin entry.
- The game is PVE-only until a specification explicitly adds PVP.
- The player home page MUST expose play, marketplace, warehouse, and battle-record
  query actions, and MUST render a Minecraft-like character whose equipment
  visuals change with armor and weapon parameters.
- The raid UI MUST be text-driven, with smooth transition animation for each
  action, and MUST avoid hidden gameplay operations such as movement, aiming, or
  healing unless a future specification adds them.
- Safe cases MUST support capacities of 1, 2, or 3 retained items, plus the option
  to enter without a safe case.
- Armor parameters for raid equipment MUST be in the range 1.0 to 6.0. Weapon
  parameters for raid equipment MUST be in the range 1.0 to 5.0, and weapon
  parameter less than or equal to 1.0 MUST lose enemy encounters.
- Backpacks are free and have unlimited carry capacity for the current scope.
- Risk areas MUST support low, medium, and high risk defaults with base enemy
  encounter probabilities of 10%, 30%, and 50% respectively. Admin configuration
  MAY override counts and probabilities through authorized difficulty settings.
- Each risk area MUST expose five containers per raid-area instance unless an
  approved specification changes the count.
- Solana development SHOULD default to Anchor for program iteration, TypeScript
  clients and scripts, wallet-standard connection in the UI, and local/devnet
  testing before any mainnet consideration.
- No transaction may be signed or sent by development tooling without explicit
  human approval, transaction summary, target cluster, fee payer, amount, and
  simulation result.

## Development Workflow & Quality Gates

- Specifications MUST identify independent user stories for player onboarding,
  raid play, warehouse, marketplace, admin configuration, and battle-record query
  whenever those areas are in scope.
- Plans MUST pass the Constitution Check before Phase 0 research and again after
  Phase 1 design. Any violation MUST be documented in Complexity Tracking.
- Data models MUST define account ownership, seeds or addresses, signers,
  mutability, token program variant, numeric precision, and overflow behavior for
  every on-chain entity.
- Tasks MUST include program tests, client/script tests, and frontend tests for
  any feature that touches the relevant layer.
- Randomness, probability, and timeouts MUST be represented in testable contracts.
  If true on-chain randomness is deferred, the plan MUST document the interim
  source, manipulation risk, and migration path.
- TypeScript battle-record queries MUST be reproducible from chain data and MUST
  reject malformed or wrong-owner accounts.
- Release candidates MUST run formatting, linting, program tests, TypeScript
  tests, and frontend checks documented by the feature plan.

## Governance

This constitution supersedes conflicting project guidance. Feature specifications,
plans, tasks, and implementation reviews MUST check compliance with the Core
Principles and Product & Technical Constraints.

Amendments MUST include the reason for change, affected principles or sections,
template synchronization impact, and a migration note for active specifications.
Versioning follows semantic versioning: MAJOR for incompatible governance or
principle changes, MINOR for added principles or materially expanded requirements,
and PATCH for clarifications that do not change obligations.

Compliance review is required at specification, plan, task, and pull-request
review time. A feature may proceed with a documented exception only when the
exception is scoped, time-bound, and recorded in Complexity Tracking or the
feature plan.

**Version**: 1.0.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-20
