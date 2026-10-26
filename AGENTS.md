# p3-stack contributor guide

p3-stack adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack) by poteto for T3 Code. Same skills, same language, rewired to T3's native orchestration.

A skill reads as if it were written for T3 Code first. Keep pstack's sentences verbatim wherever they still apply. Replace every Cursor mechanism with the T3 Code equivalent below.

## Delegated workers

If you are a delegated worker, your brief names exactly one file. Write only that file, create parent directories as needed, and run no git commands. Report back the file path, its line count, and the changes you made to pstack's version.

## Cursor to T3 Code map

| pstack | p3-stack |
|---|---|
| `Task` tool, `subagent_type`, `run_in_background` | `delegate_task` with a self-contained brief; `mode: "async"` for background work; once nothing independent is left, end the turn until the completion notification wakes you, then read the result with `task_status`; `task_cancel` only for a child that is not terminal |
| Model slugs (`claude-opus-5-5-max`, `grok-4.7-xhigh-fast`, `gpt-5.6-sol-max`) | Named roles resolved from `orchestrator_capabilities` by `setup-pstack` (role names below). Never hardcode a slug. |
| "cloud agent", `environment: "cloud"`, `cloud_base_branch` | A delegated child task. Use `t3_thread_launch` only when the user explicitly requests separate top-level conversations. |
| "each worker gets its own worktree or branch" | `t3_thread_launch` with `workspaceStrategy`: `{"type":"worktree","baseRef":...,"branch":...}`, `{"type":"existing_worktree","worktreePath":...}`, or `{"type":"root"}`. One writer per worktree. |
| `/loop`, poll loops, `scripts/watch-pr` | `watch_pull_request`: T3 watches the PR and wakes the thread on checks finishing, new comments, or conflicts. Arm it, end the turn, triage on wake. For other cadences use `schedule_task`. |
| Hourly audit ticks, recurring runs | `schedule_task` with `{"type":"interval","everyMs":...}` or `{"type":"fixed_time","timeOfDay":...,"weekdays":[...]}`; `run_scheduled_task_now` for an immediate run. |
| A built-in PR tool tracking the PRs it made | `link_pull_request` for every PR, immediately; `list_thread_pull_requests` shows what the thread tracks. Stack order still comes from the forge's base chain through `orch`. |
| `agent-transcripts/*.jsonl` mining | `t3_thread_read`, `t3_thread_search`; `t3_queue_list`/`t3_queue_read`/`t3_queue_edit`/`t3_queue_reorder`/`t3_queue_cancel`/`t3_queue_promote_to_steer` for queued input. |
| `AskQuestion` | Ask plainly in the thread. `t3_pending_request_list`/`t3_pending_request_read`/`t3_pending_request_respond` answer questions in other threads. |
| `control-ui`, `control-cli` (from cursor-team-kit) | `preview_*` browser tools and `device_*` simulator tools; `preview_recording_start`/`preview_recording_stop` and `device_screenshot` for evidence; `browser.preview` shows a file to the user. |
| `~/.cursor/rules/pstack-models.mdc`, `/add-plugin` | `setup-pstack` writes `pstack-models.md`; install uses the Skills CLI (see README). |
| Official skill names | Keep them unchanged. Bundle `poteto-agent` at `skills/poteto-mode/references/poteto-agent.md`. |
| Cursor custom modes ("press option+enter") | The user’s global instructions enable `poteto-mode`; `/poteto-mode` is also available explicitly. |

Everything else in pstack transfers as written: the principles, the playbook shapes, the brief template, the reply style, the autonomy rules. Adopt it.

## Role names

Code work reads its line in `pstack-models.md`: `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`. Prose and judgment read `judgment and prose`; the hardest changes read `hardest tasks`.

Panels and investigators: `how explorer`, `how explainer`, `why investigators`, `why synthesizer`, `arena runners`, `arena cross-judge pool`, `swarm workers`, `architect runners`, `interrogate reviewers`, `reflect tooling`, `reflect judgment, divergent, synthesizer`.

Keep these names exactly.

## Writing rules

- Thin over complete. Keep the shortest file that still changes behavior. Cut Cursor-only edge-case protocol and forge-specific branches before cutting any rule.
- pstack's voice: terse, declarative, lowercase-friendly, no filler.
- Frontmatter: `name`, one-line `description`, `disable-model-invocation: true` where the source has it. Drop Cursor UI fields (`icon`, `color`, `mode`, `reminder`).
- Use T3 tool names exactly: `delegate_task`, `task_status`, `watch_pull_request`, `link_pull_request`, `schedule_task`, `t3_thread_launch`, `t3_thread_read`, `t3_thread_search`, `preview_*`, `device_*`.
- Delegation briefs are self-contained. T3 child agents get only the brief, never the parent's context. Say this where pstack says "every brief stands alone".
- Never bullet a Cursor tool into a skill, even as a fallback.

## Definition of done for a skill

1. Every step names a T3 mechanism or a vendor-neutral habit. Grep for `Cursor`, `Task tool`, `subagent_type`, `cloud agent`, `.cursor`, `agent-transcripts`, `AskQuestion`, `icon:`, `claude-`, `grok-`, `gpt-`, `/loop`. None may remain.
2. It is shorter than the pstack source unless the T3 rewrite genuinely needs the lines.
3. Frontmatter matches the rules above, and references to other skills resolve to files in this repo.

## Fork rules

The fork is an orchestration port, not a new engineering method: keep pstack's
engineering instructions, principles, playbooks, rubrics and verification
unchanged. A difference from official is allowed only for T3 transport (the map
above) or an approved delta in UPSTREAM.md, which also owns provenance and the
porting rules; follow `upstream/MAINTENANCE.md` for official updates. Run
`node --test tests/*.test.mjs` for installer changes.
