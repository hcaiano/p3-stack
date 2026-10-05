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
a restricted candidate pool. Re-read the selected configuration before each
delegation wave; a running child retains its original selection.

Before a delegation wave, call `orchestrator_capabilities` and the installed
`t3-capacity` skill using that server's settings and confirmed account mappings.
Missing readings or mappings mean unknown capacity. Refresh after usage limits.

`capacity` chooses among models satisfying the invoking skill's role requirements,
then among their accounts using headroom, pace and resets. All enabled accounts
are eligible, including both Codex accounts, Claude, Grok and Cursor. Do not impose
an additional model ranking or reasoning-effort cap. Keep explicit model/account
choices and the existing `inherit-parent`/`auto` semantics; ask before replacing
an explicit choice. Use current catalog IDs and supported option keys.

Resolve each panel seat without changing the skill's count or diversity rules.
Two providers or accounts serving the same model do not add model diversity.
Unknown quota is not confirmed headroom. Skip exhausted automatic choices; if no
qualifying option remains, report the capacity blocker. A protected reading is
a pacing signal, not an additional approval requirement.

After a failed automatic choice, inspect task status and any writes before
retrying on another qualifying account. Keep a checkpoint and fresh task ID;
never duplicate an active writer. Distinguish quota errors from transport or
application failures, bound retries, and report the selected account briefly.

## T3 transport and packaging

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

User authorization and project instructions retain their normal precedence.
This adapter does not grant merge, deployment or communication permissions and
does not add another engineering workflow to the pstack task.
