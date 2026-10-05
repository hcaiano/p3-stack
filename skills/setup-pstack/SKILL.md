---
name: setup-pstack
description: Configure pstack model and account selection in T3, with automatic choices, candidate pools or fixed selections per role. Use for /setup-pstack or changing global or project model preferences.
disable-model-invocation: true
---

# Setup pstack for T3

Before resolving models or delegating, read [T3 execution](../poteto-mode/references/t3-execution.md). It defines global configuration, capacity selection, and transport constraints.

Write `pstack-models.md`, a file that sets pstack's model selection per role.
Default to `~/.agents/pstack-models.md`; use the project root only for a requested
project override. Read [model selection](../poteto-mode/references/model-selection.md)
for candidate-pool syntax, update behavior and Fleet persistence. Preserve existing
choices. For this user's automatic setup, use open `capacity` and retain the
skill's reasoning requirements; do not make them choose a fixed roster to start.
This initial default does not replace existing pins or pools unless requested.

## Steps

### 1. Detect available models

Call `orchestrator_capabilities`. It lists the providers and models you can pass to `delegate_task` in this session, custom models included, with each one's provider instance ID and any reasoning options. That is the only source. Use enabled providers that can run child tasks. If none qualify, report the limitation. Never add a fixed model or pool entry absent from that catalog. `inherit-parent` and `capacity` are policies, not model IDs. Read `t3-capacity` for current account availability, but persist no usage snapshots.

### 2. Load current state

The roles are the labels shown in step 5. Read the existing file and its optional
`# budget` line. Otherwise start from the bundled defaults. Identify obsolete
roles for review rather than dropping unrecognized user settings silently.

### 3. Budget, map, and confirm

Offer open automatic selection (`capacity`), a restricted pool
(`capacity[model-id-a | model-id-b]`), or a pinned account/model. A pool selects
one alternative for each seat; a panel's top-level list still controls its seat
count. Preserve the invoking skill's required count and diversity. Existing
user choices are authorization to keep them; ask only for unresolved preferences.

**(a) Reasoning preference.** Keep the skill's requirements by omitting `# budget`
unless the user chooses an override. When they ask to change reasoning, explain
that this controls effort, not subscription spending. Show the current setting
and the existing options:

- `unlimited — keep max`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** On a fresh run, start from the bundled `default-models.md` in poteto-mode's references. Keep `capacity` values dynamic and preserve the panel seat counts. For a fixed-model request, resolve that choice from the live catalog. On a re-run, keep the user's existing choices.

When the user chose an override and the catalog exposes reasoning options, set
the model's actual effort option: `unlimited` takes the highest reasoning value;
`large`, `medium`, and `small` target `xhigh`, `high`, or `medium`. The ladder is
`max` > `xhigh` > `high` > `medium` > `low`; if the target is unsupported, use the
highest supported value at or below it, otherwise report the mismatch. Preserve
catalog-specific option keys and distinguish effort from workflow modes. Apply
the preference when resolving each capacity seat; keep policy entries dynamic.

**(c) Show the resulting selection.** Show roles grouped by identical policy,
explicit pools and pins, reasoning overrides and unresolved choices. One
`delegate_task` runs per panel seat, not per pool candidate. `arena cross-judge
pool` retains Arena's own selection rules. `swarm workers` is the default for
each worker unless its workflow assigns another choice. Ask before replacing
an unavailable explicit choice; do not ask again to apply preferences already
given by the user.

### 4. Validate

Validate every new pin and pool candidate against the live catalog. Unqualified
pool IDs may resolve through several accounts. Preserve existing unavailable
pins as unresolved until the user decides. Validate panel seat count and whether
its candidates can meet the invoking skill's diversity rules. Report quota or
host limitations without silently broadening a restricted pool.
If a candidate cannot meet a requested effort, try another eligible candidate
within the same policy; report a blocker when none qualifies. Never silently
lower the invoking skill's required effort.

### 5. Write the file

For a Fleet global change, the chosen file is on the MBP source, even when the
setup runs on PC. Use an available authorized connection to read and update that
source, preserving its current contents. If unavailable, return a proposed edit
and report persistence pending; do not write a competing local global file.

Write the chosen file with one line per role. Include `# budget` only for an
explicit effort override. Use role values from the model-selection reference;
record fixed-model effort as the catalog's option key and value when needed.
Keep unrelated user settings intact. The role map is:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `capacity` resolves model/account per wave via the execution reference.
# `inherit-parent` as a value: the role runs on the parent thread's model (omit the delegate_task model). Entries in a panel list still count toward its fan-out.
feature, refactoring: <providerInstanceId>/<model> (<effort>)
bug-fix: <providerInstanceId>/<model> (<effort>)
perf-issue: <providerInstanceId>/<model> (<effort>)
hillclimb: <providerInstanceId>/<model> (<effort>)
judgment and prose: <providerInstanceId>/<model> (<effort>)
hardest tasks: <providerInstanceId>/<model> (<effort>)
how explorer: <providerInstanceId>/<model> (<effort>)
how explainer: <providerInstanceId>/<model> (<effort>)
why investigators: <providerInstanceId>/<model> (<effort>)
why synthesizer: <providerInstanceId>/<model> (<effort>)
reflect tooling: <providerInstanceId>/<model> (<effort>)
reflect judgment, divergent, synthesizer: <providerInstanceId>/<model> (<effort>)
arena runners: <entry>, <entry>, <entry>
arena cross-judge pool: <entry>, <entry>, <entry>
swarm workers: <providerInstanceId>/<model> (<effort>)
architect runners: <entry>, <entry>, <entry>
interrogate reviewers: <entry>, <entry>, <entry>
```

### 6. Confirm

Report the path, scope and actual host delivery. The adapter reads it before
each delegation wave; running children keep their existing selection. Open
`capacity` considers newly exposed T3 models without a setup rerun. Explicit
pools and pins change only when requested. For Fleet globals, update the MBP
source and verify destination contents; a configured sync is not delivery proof.

### 7. Offer a verification skill (optional)

When setup is for an application project, check whether it has a way to drive
the real app for proof (a `verify-*` skill or existing harness). If missing, offer
`/create-verification-skill` once. Skip this step for global configuration without
an application project.
