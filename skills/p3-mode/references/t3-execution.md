# T3 execution

## Configuration and account capacity

Resolve paths relative to the installed skill, never the application checkout.
Read the project's `p3-models.md`, otherwise `~/.agents/p3-models.md`, otherwise
[the bundled global defaults](default-models.md). The first file found wins.
The defaults travel with the skills between machines; account IDs do not.

Before a delegation wave, call `orchestrator_capabilities` and load the installed
`t3-capacity` skill. Use the settings of the T3 server executing the shell and
its confirmed account mappings. Refresh readings after a usage-limit failure.
Missing mappings or readings mean unknown capacity, not an empty or full quota.

A role value of `capacity` selects a model suitable for that role and the actual
brief, then an available account. Keep explicit `providerInstanceId/model`
selections and `inherit-parent`/`auto` semantics from setup-p3. A user-named
model or account overrides automatic selection; ask before replacing it.

All enabled subscriptions participate: both Codex accounts, Claude, Grok and
Cursor. Cursor is eligible automatically and is not the exclusive provider.
Prefer strong coding models for implementation and strong reasoning models for
architecture and judgment. Explorers and scoped independent perspectives may
use Grok; spare quota alone does not qualify a model for difficult code work.
Among suitable options prefer confirmed headroom and sustainable pace. Avoid
exhausted pools. A protected pool is usable when appropriate; explain the
tradeoff rather than inventing an approval gate. Use only current catalog IDs
and supported option keys. The budget controls reasoning effort, not a spend cap.

For panel lists, resolve each `capacity` entry independently, preserving the
configured number of seats and seeking different model families. Two accounts
or providers serving the same model are not independent model families. Report
reduced diversity when only one family is available. Reuse capacity readings
within a wave and bound concurrency to the host and shared account limits.
State the chosen model/account and material quota constraint briefly.

If an automatic selection hits a usage limit, checkpoint the work and choose
another suitable account for a fresh task. Inspect the old task's status and
writes before retrying; never duplicate an active writer. Distinguish quota
errors from provider startup failures and application bugs. Bound retries;
report a blocker when no suitable option can continue. Unknown capacity can
be tried when needed, but must not be advertised as known headroom.

## T3 transport and installation

Use `delegate_task` for child work, with a complete brief and retained task ID.
Use a new delegation for every review/fix round; pass prior findings and the
current commit. Never continue a delegated round with `t3_thread_send`.
Pass absolute paths to the installed p3-mode worker briefs in `references/`.

`t3_thread_launch` and `create_threads` create top-level conversations. Use them
only when the user explicitly requests separate conversations, including where
a playbook mentions launching a thread for a worktree. Otherwise use a supported
child-workspace mechanism, or serialize writes in the current worktree; report
any unavailable isolation. The live T3 tool schema determines what is supported.
A plain shell `cd` does not change a T3 thread's workspace binding.

Native T3 browser, device, PR-watch and scheduling tools keep their live tool
contracts. Read-only investigation never authorizes new recurring work.

## Existing project workflow

The issue tracker and acceptance criteria already in the project remain the
source of truth. Preserve its issue claiming and dependency rules. In a p3 task,
the p3 playbook owns implementation and review; do not automatically nest the
personal orchestrate, pair, review-it or ship-it pipelines. Their supporting
utilities may still be used, and explicit user requests take precedence.

All autonomy, shipping and communication steps remain within the user's grant.
For this setup, merging, production changes, destructive actions, new dependencies,
public API/schema changes and scope expansion require user approval unless
already authorized. External messages require explicit authorization. Prepare
reviewable work before asking. A playbook name alone does not grant these actions.
