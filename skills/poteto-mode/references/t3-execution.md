# T3 execution adapter

This file adapts transport, account selection and installation only. The invoking
pstack skill owns the engineering method: steps, roles, review criteria, sample
counts, diversity, verification and completion gates. Preserve those requirements.
If the available runtime or accounts cannot satisfy them, report the limitation;
never substitute a reduced workflow.

## Configuration and accounts

Resolve resources relative to the installed skill, not the application checkout.
Read the project's `pstack-models.md`, otherwise `~/.agents/pstack-models.md`, otherwise
[the bundled defaults](default-models.md). The first file found wins. Defaults
travel with the skills; resolve provider IDs on the machine executing the task.

Read [model selection](model-selection.md) when configuring roles or resolving
a preferred candidate pool or an explicit strict restriction. Re-read the selected configuration before each
delegation wave; a running child retains its original selection.

Before a delegation wave, call `orchestrator_capabilities` and the installed
`t3-capacity` skill using that server's settings and confirmed account mappings.
Missing usage is unknown capacity; a missing billing mapping is an unresolved
account identity. Refresh after usage limits.

`capacity` chooses among models satisfying the invoking skill's role requirements,
then among their accounts using headroom, pace and resets. Ordered pools keep
the user's preference tiers; `t3-capacity --candidate` computes the choice.
All enabled accounts are eligible, including both Codex accounts, Claude, Grok
and Cursor. Do not impose
an additional model ranking or reasoning-effort cap. Keep explicit model/account
choices and the existing `inherit-parent`/`auto` semantics. Configured pools, singleton seats and named targets are preferences unless the
user explicitly prohibits alternatives. Use current catalog IDs
and supported option keys.

Resolve each panel seat without changing the skill's count or diversity rules.
Retain the official default `xhigh` reasoning unless an authorized user budget
overrides it; resolve the actual option key and supported value from the catalog.
If no eligible target can meet the required effort, report the limitation.
Two providers or accounts serving the same model do not add model diversity.
Unknown quota is not confirmed headroom. Follow the automatic fallback below.
A protected reading is a pacing signal, not an additional approval requirement.

## Automatic fallback

Manage ordinary capacity fallback automatically. Never ask permission because
usage is missing, quota is exhausted, a preferred account/model is unavailable,
or a preferred pool cannot staff the required panel. Try its configured tiers,
then eligible live alternatives as later tiers under the model-selection policy.
Re-read the selected configuration before every wave. Build every entry's
complete declared tier list using the model-selection reference before capacity
selection. Model preferences come from that file. Never derive a priority list
from another role or embed one in the skills. Preserve the method's
quality constraints, effort, count and diversity. A temporary fallback does not
rewrite preferences or expand a real explicit prohibition.

Missing usage permits an attempt on a confirmed billing mapping. Skip known
unavailable targets and unconfirmed mappings automatically. A named target or
singleton pool alone is not a hard restriction. Honor explicit strict restrictions
and already-authorized exceptions. If no qualifying target exists, report a
factual limitation and continue independent work rather than asking for routine
fallback approval. Carry the selected configuration path, applicable complete role value, automatic
fallback policy and explicit prohibitions in child briefs. A child starting
another wave re-reads that file and follows the same policy without asking the
operator for ordinary capacity fallback.

Run the bundled `scripts/resolve-capacity.mjs` relative to poteto-mode's installed
directory. Feed JSON on stdin: `{report: {choice, candidates}, exclude: []}`,
using the actual `t3-capacity` report. Supply only role-, catalog- and
policy-qualified candidates. An explicit strict pin is a singleton unless the user has
authorized its fallback; ordinary preference pools include qualifying fallback
tiers before running capacity selection. Exclusions are `{instance, model}` or `{pool}` for a
confirmed shared quota pool; never guess billing relationships.

The resolver preserves the measured choice exactly. Otherwise, it attempts a
mapped unknown candidate by tier, then report order, labeled `unknown-usage`.
It preserves the unknown state and metrics. `pool: null` means an unconfirmed
mapping, not missing usage. Selection exits 0; `blocked` or `refresh` exits 1;
invalid input exits 2. Inspect the JSON result. On `refresh`, rerun `t3-capacity`
with excluded candidates removed, retaining exclusions. Do not reproduce its
measured ranking. Invalid reports require correction, not another target.

After a failed automatic choice, inspect task status and any writes before
retrying automatically on another authorized target. Confirm the old run is
terminal, inspect writes and keep a checkpoint and fresh task ID; reconcile
uncertain outcomes before launching another writer. Try each authorized target
at most once per resolution and retain exclusions across report refreshes.
A confirmed quota failure excludes its proven shared pool. Transport or
application failures do not prove quota exhaustion. Report the selected account
and unknown usage briefly; no extra approval is required.

## T3 transport and packaging

Read [portable tool inputs](t3-tools.md) when using the bundled orchestration,
PR readiness or worktree audit scripts. Their source policies remain intact;
this reference defines only the T3 boundary exports and continuations.

Use `delegate_task` for child work, with a complete brief and retained task ID.
Each review/fix round uses a new delegation carrying prior findings and the current
commit. Never continue a delegated round through `t3_thread_send`.
Pass absolute paths to the installed worker briefs in this references directory.

`t3_thread_launch` and `create_threads` create top-level conversations and require
an explicit user request for those conversations, even when a playbook mentions
launching a thread for a worktree. Otherwise use supported child isolation.
If the required isolation is unavailable, report the runtime limitation rather
than silently changing a parallel workflow. Shell `cd` does not rebind T3 threads.
Browser, device, PR-watch and scheduling calls follow their live T3 tool contracts.

A child is _stalled_ when its run still reads `running` and its thread has had no
new activity for 60 minutes: a provider can send its final answer and leave the
run open, so the completion notification never arrives. When a wave of async
children starts, create one `schedule_task` interval of 3600000 ms bound to the
current thread, keep its ID, and end the turn; delete it with
`delete_scheduled_task` once no child is running. Each run re-reads this whole
thread, so keep one such wake per thread and never schedule one to wait on a
pull request: `watch_pull_request` covers that. On each run, read every running
child with `t3_thread_read` in `view: "activity"`, paging to the newest item; any
item in the last 60 minutes means it is healthy. For a stalled child, take its
final assistant message, recovered in full, as the result when it answers the
brief, then `task_cancel` it. Without one, cancel it, confirm with `task_status`
that it is terminal, inspect its writes, and restaff under the retry rules above.

User authorization and project instructions retain their normal precedence.
This adapter does not grant merge, deployment or communication permissions and
does not add another engineering workflow to the pstack task.
