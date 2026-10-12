---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
---

# Arena

Before resolving models or delegating, read [T3 execution](../poteto-mode/references/t3-execution.md). It defines global configuration, capacity selection, and transport constraints. Its top-level conversation requirement applies to every launch below; use supported child isolation or report the runtime limitation otherwise.

Fan out N parallel attempts at the same task. Read every candidate end to end. Pick the strongest as the base. Graft the best ideas from the others into it. Verify the synthesized result.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Cross-judge
4. Pick
5. Graft
6. Verify

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric. State what success looks like for *this* task, then turn it into 3-6 concrete gradeable criteria. The rubric is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners. Use the `arena runners` line in `pstack-models.md`, resolved against `orchestrator_capabilities`. If the file or role is missing, use the bundled default for that role. An `auto` or `inherit-parent` entry in this line or the cross-judge line means the parent model, so omit `model` for it. If a seat is unavailable or usage is unknown, resolve an authorized alternative automatically through the execution reference. Ask only to change a hard pin without an authorized fallback or expand the authorized pool. Spawn more when the arena covers multiple design directions. Same model N times when the work is generation-bound rather than judgment-sensitive.
4. Assign output paths. Each candidate writes to its own location (a git worktree where possible, otherwise `/tmp/arena-<slug>/candidate-<n>/`), per the **separate-before-serializing-shared-state** principle skill. A candidate that needs its own worktree gets one through `t3_thread_launch` with a `workspaceStrategy`. One writer per worktree.

## Phase B: Fan out

Spawn all N candidates in one turn with `delegate_task`, one per runner entry, each with `mode: "async"`. T3 child agents get only the brief, never the parent's context, so every brief stands alone: the task, the path to the shared grounding, its own output path, and instructions to produce both the artifact and a short rationale.

Each rationale names the alternatives the candidate considered and what it rejected.

Drain the candidates with `task_status`. If a candidate fails to produce output, proceed with N-1 and note the dropout in the synthesis record.

## Phase C: Cross-judge

After all Phase B candidates complete, choose one model from the `arena cross-judge pool` line in `pstack-models.md`. If the file or role is missing, use the bundled default for `arena cross-judge pool`. Prefer a different model family from the parent's. Spawn one judge with `delegate_task` on that model. The brief says read-only: inspect only, no writes. It sees the rubric and the candidates by path label, scores each criterion, and recommends a base with rationale. It runs in parallel with the parent's reading in Phase D, not with the candidates themselves. Don't spawn the judge while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the Laziness Protocol.

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **redesign-from-first-principles** principle skill, so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **prove-it-works** principle skill. If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact, with a short synthesis note alongside naming the base and why, the cross-judge's verdict, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result.
