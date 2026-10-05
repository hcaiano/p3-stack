---
name: setup-p3
description: Configure which models p3-stack uses per role and at what reasoning budget. Detects your available models and writes p3-models.md, which overrides the skill defaults. Use for /setup-p3, "configure p3 models", "p3 budget", or changing p3-stack's model choices.
disable-model-invocation: true
---

# Setup p3

Before resolving models or delegating, read [T3 execution](../p3-mode/references/t3-execution.md). It defines global configuration, capacity selection, and transport constraints.

Write `p3-models.md`, a file that sets p3-stack's model per role. Default to `~/.agents/p3-models.md` for this global setup; use the project root when the user requests a project override. Preserve the bundled capacity defaults until the user configures an override.

## Steps

### 1. Detect available models

Call `orchestrator_capabilities`. It lists the providers and models you can pass to `delegate_task` in this session, custom models included, with each one's provider instance ID and any reasoning options. That is the only source. If it returns nothing, stop and tell the user. Never write a provider or model it did not return. `inherit-parent` and `capacity` are valid even though they are not detected models.

### 2. Load current state

The roles are the labels shown in step 5. If `p3-models.md` already exists at the chosen location, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from the defaults in step 3(b). A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

Keep `capacity` entries as dynamic selections. Offer a fixed model only when the user wants one; panel list length still controls seat count.

**(a) Ask for a budget.** Ask plainly in the thread. Offer these four options with these exact labels, and name the current budget when the file records one.

- `unlimited — keep max`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** On a fresh run, start from the bundled `default-models.md` in p3-mode's references. Keep `capacity` values dynamic and preserve the panel seat counts. For a fixed-model request, resolve that choice from the live catalog. On a re-run, keep the user's existing choices.

When the catalog exposes reasoning options for a model, set each real entry's effort option from the budget: `unlimited` takes the highest option, and `large`, `medium`, and `small` take `xhigh`, `high`, or `medium`. The ladder is `max` > `xhigh` > `high` > `medium` > `low`. If the model does not expose the target, use the highest option at or below it, else mark the role as needing a choice. `inherit-parent` and `capacity` do not change; apply the budget when resolving a capacity seat. When the catalog exposes no reasoning options, map roles only and drop effort tokens; the budget label is still recorded.

**(c) Show the roles and confirm.** Show every role with its model, marking any fixed model not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering `capacity`, the detected models, and `inherit-parent` (the role runs on the parent thread's model, so omit the model in `delegate_task`) as the options. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one `delegate_task` runs per entry, `inherit-parent` entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose provider differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every fixed model entry written must be in the `orchestrator_capabilities` result, under the provider instance it came from. `inherit-parent` and `capacity` always pass. If a chosen entry is not available, stop and ask again.

### 5. Write the file

Write `p3-models.md` with a `# budget` line with the chosen label and its target effort, and one line per role, using the same labels p3-mode uses. Write dynamic entries as `capacity`; write fixed entries as `<providerInstanceId>/<model>`, followed by its effort option in parentheses when step 3(b) set one. Preserve `inherit-parent`. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# p3 model configuration. One line per role. Delete a line to fall back to the skill default.
# `capacity` resolves model/account per wave via the execution reference.
# `inherit-parent` as a value: the role runs on the parent thread's model (omit the delegate_task model). Entries in a panel list still count toward its fan-out.
# budget: unlimited (max)
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

Tell the user the file was written, where, and that it applies to new sessions. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.
