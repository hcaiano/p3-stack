# Model selection in T3

These settings select models and accounts, not engineering steps. Preserve the
invoking skill's roles, seat count, diversity, reasoning and verification rules.

## Role values

| Value | Selection for one seat | Newly available models |
|---|---|---|
| `capacity` | Any eligible model from enabled T3 providers, then a suitable account | Become candidates on the next live catalog refresh |
| `capacity[model-id-a \| model-id-b]` | Prefer this pool across eligible accounts, then use automatic fallback | Become eligible fallbacks without editing the preference pool |
| `capacity[model-id-a > model-id-b \| model-id-c]` | Prefer `a`, then `b` or `c`, then automatic fallback | Become eligible fallbacks without editing the preference pool |
| `<providerInstanceId>/<model>` | Prefer this account and model; enforce a pin only under an explicit strict instruction | Eligible fallbacks are considered automatically |
| `inherit-parent` or `auto` | Parent provider and model | Follow the parent selection |

Pool entries are exact model IDs returned by `orchestrator_capabilities`. An
entry may instead be `<providerInstanceId>/<model>` to restrict that candidate
to an account. Use ` | ` between alternatives and ` > ` between preference
tiers; `|` binds tighter, so `A > B | C` is tier `A`, then tier `B | C`. Never
guess model equivalence from names. A catalog alias cannot prove a panel's
required model diversity.

Before capacity selection, read the selected file's complete role value,
including every top-level entry and every bracketed tier. Expand each declared
tier against the live catalog. Include every eligible account exposing an
unqualified model ID and retain account-qualified candidates as written. Pass
one `--candidate` flag per nonempty tier in declared order. An absent or exhausted
first model must not hide later tiers. Apply the execution adapter's authorized
fallback after those tiers, without adding a fixed model priority. Retain
`t3-capacity`'s measured `choice`, including its one-tier pacing handoff. Pass the
report to the execution adapter's resolver. Missing usage permits an attempt on
a confirmed mapping and remains unknown usage.

An unqualified model ID allows all enabled accounts exposing that exact ID.
For example, both Codex accounts can serve one GPT model without requiring two
pool entries. This is account choice, not two different models for a review.

For panel roles, top-level commas separate seats; alternatives inside brackets
do not. `capacity[A | B], capacity[A | C], capacity` is three seats. Resolve the
whole panel so it satisfies the invoking skill's diversity rules. If no valid
assignment exists, report the blocker; neither pool size nor quota reduces the
required panel. Arena's cross-judge pool retains Arena's own selection semantics.

## Automatic fallback is the default

Role entries and bracketed pools express preferences, not permission gates.
When usage is missing or a preferred target cannot take work, manage the fallback
without asking the operator. First try the configured alternatives and accounts.
If they cannot staff the required role or panel, use suitable alternatives from
the enabled live catalog as later preference tiers. A model-specific service
failure does not prove that its billing account or every model is exhausted.

Read the selected configuration before each wave. Follow every configured tier
and fallback in its declared order, across all eligible accounts. Never stop at
the first unavailable entry or treat its failure as a failure of the whole role.
Keep the user's quality constraints, effort, panel count and diversity. Resolve
actual IDs and supported options from the catalog; do not hardcode model
priorities or slugs in the skills. The configuration owns model preferences. Do not
lower the method to make a fallback fit. Preserve the original preference file;
a temporary fallback is not an instruction to rewrite it.

Only an explicit prohibition on other models/accounts
makes the configured choice a hard restriction. A bare model name or a singleton
pool alone does not mean "ask me when quota runs out". Strict restrictions still
allow authorized alternatives already stated by the user. If no target can satisfy
a real restriction or the method, report the factual limitation and continue
independent work; do not open a routine fallback approval question.

Resolve the entire panel before launching it. Exhausted singleton seats may use
different eligible models so the panel retains its required count and diversity.
Two accounts serving one model do not fill distinct-model seats. Carry the chosen
policy and any user prohibitions into each self-contained child brief. Inspect
status and writes before a fresh retry, as the execution adapter requires.

## Catalog and reasoning

Read `orchestrator_capabilities` once per thread and again after a rejected
target or a provider change. Refresh capacity once per delegation wave (every
child started in one turn) and after a usage limit. A model must be exposed by the running T3 provider first;
a vendor announcement alone does not make it usable. A new catalog entry is
eligible, not automatically preferred or proof of suitability for every role.
Open `capacity` needs no setup rerun to consider it. Preference pools stay unchanged during automatic fallback. Only explicit strict
restrictions exclude other qualifying catalog entries. Setup edits the stored
preferences when the user requests a configuration change.

No `# budget` line means retain the invoking skill's effort requirements. The
official default starting level is `xhigh`; poteto-mode's Subagents section then
adjusts it per job, and verification keeps the `swarm workers` effort.
Translating model slugs to catalog IDs must retain the resulting effort through
the model's actual reasoning option. Per-job adjustments from poteto-mode's
Subagents section are part of the skill's requirement. For an adjusted level,
use the model's nearest supported value and keep the model. A
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
