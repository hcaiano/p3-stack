# Model selection in T3

These settings select models and accounts, not engineering steps. Preserve the
invoking skill's roles, seat count, diversity, reasoning and verification rules.

## Role values

| Value | Selection for one seat | Newly available models |
|---|---|---|
| `capacity` | Any eligible model from enabled T3 providers, then a suitable account | Become candidates on the next live catalog refresh |
| `capacity[model-id-a \| model-id-b]` | One model from this explicit pool, across eligible accounts | Require an explicit pool edit |
| `capacity[model-id-a > model-id-b \| model-id-c]` | The first tier with usable capacity: `a`, else `b` or `c` | Require an explicit pool edit |
| `<providerInstanceId>/<model>` | This exact account and model | Remain pinned until changed |
| `inherit-parent` or `auto` | Parent provider and model | Follow the parent selection |

Pool entries are exact model IDs returned by `orchestrator_capabilities`. An
entry may instead be `<providerInstanceId>/<model>` to restrict that candidate
to an account. Use ` | ` between alternatives and ` > ` between preference
tiers; `|` binds tighter, so `A > B | C` is tier `A`, then tier `B | C`. Never
guess model equivalence from names. A catalog alias cannot prove a panel's
required model diversity.

Resolve a pool with `t3-capacity`: pass each tier as one `--candidate` flag
listing `<providerInstanceId>/<model>` for every account exposing each model,
and delegate to its `choice`. It takes the first tier with an available
account, then the first with a protected one, lowest pace within a tier.
A null `choice` means no candidate in the pool can take work.

An unqualified model ID allows all enabled accounts exposing that exact ID.
For example, both Codex accounts can serve one GPT model without requiring two
pool entries. This is account choice, not two different models for a review.

For panel roles, top-level commas separate seats; alternatives inside brackets
do not. `capacity[A | B], capacity[A | C], capacity` is three seats. Resolve the
whole panel so it satisfies the invoking skill's diversity rules. If no valid
assignment exists, report the blocker; neither pool size nor quota reduces the
required panel. Arena's cross-judge pool retains Arena's own selection semantics.

An unavailable pinned choice requires user input. For a restricted pool, skip
unavailable candidates within the pool; ask before going outside it. For open
`capacity`, use another qualifying live candidate. Inspect task status and writes
before retrying, as described in the execution adapter.

## Catalog and reasoning

Refresh `orchestrator_capabilities` and capacity before each delegation wave and
after a usage limit. A model must be exposed by the running T3 provider first;
a vendor announcement alone does not make it usable. A new catalog entry is
eligible, not automatically preferred or proof of suitability for every role.
Open `capacity` needs no setup rerun to consider it. Explicit pools and pins stay
unchanged until the user edits them, directly or through `/setup-pstack`.

No `# budget` line means retain the invoking skill's effort requirements. A
user-selected budget is an effort preference, not a spending limit. Resolve
option keys and supported values from each model's live catalog; do not copy a
Codex option name to Claude, Cursor or Grok. Workflow options such as multi-agent
modes are not interchangeable with numeric reasoning effort.

## Persistence

Configuration precedence is project `pstack-models.md`, then
`~/.agents/pstack-models.md`, then bundled defaults. The first file wins; missing
role lines use [the bundled role defaults](default-models.md), then the invoking
skill's default if no bundled role exists. They do not merge in the global file.
A project override is project-owned and does not replace personal preferences.

In this Fleet, the MBP owns global configuration. Publish global edits there;
from another host, prepare the change for the source rather than creating an
independent copy that Fleet will overwrite. The Fleet manifest must include
`.agents/pstack-models.md` before claiming automatic distribution. Verify actual
destination contents. Offline hosts receive changes only after a successful sync.

Share selection policy only: no usage snapshots, credentials, auth-home paths
or resolved current account. Each host refreshes its own catalog and quota. An
explicit provider ID absent on a host stays unavailable; do not reinterpret it.
