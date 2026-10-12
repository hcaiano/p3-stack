---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

Read the installed poteto-mode reference `../poteto-mode/references/t3-execution.md` before selecting models or delegating. It owns named-role resolution, catalog option keys, accounts and automatic authorized missing-usage fallback.

Fan out N parallel delegated workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the T3 concurrency limit.
4. Pick the worker model from the `swarm workers` line in `pstack-models.md`. If the file or that line is missing, use its bundled default at `xhigh` reasoning through live catalog option keys unless the user chooses a budget. For `auto` or `inherit-parent`, resolve the parent target. If `delegate_task` rejects an entry, follow the execution adapter's authorized fallback preserving effort and required diversity and say so. For a model race, name each arm's model up front.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers in one message with `delegate_task`, `mode: "async"`, and the step 4 model. Resolve `auto` or `inherit-parent` to the parent target. Retain each task ID and drain with `task_status`; stop with `task_cancel`. Use supported child isolation for each worker's workspace. Report a factual limitation if the required isolation is unavailable. `t3_thread_launch` creates a top-level conversation and is allowed only when the user explicitly requests separate conversations.

When a worker must start from a non-default pushed branch, carry that exact branch into supported child isolation and the self-contained brief. For an explicitly requested separate top-level conversation, pass that branch as `workspaceStrategy.baseRef` to `t3_thread_launch`. Report a factual limitation when the child runtime cannot provide the required starting branch.

Every brief stands alone. T3 child agents get only the brief, never the parent's context. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
