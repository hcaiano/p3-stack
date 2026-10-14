### Perf issue

Resolve named roles and child transport through the installed `../references/t3-execution.md`. Use self-contained `delegate_task` briefs, `mode: "async"`, retained task IDs and `task_status` to drain; stop with `task_cancel`. T3 child agents get only the brief, never the parent's context. Required worker isolation uses supported child worktrees or branches. `t3_thread_launch` is only for explicitly requested separate top-level conversations. Report a factual limitation if the child runtime cannot provide required isolation.

**You own the measurement story. Plan, review, verify the numbers.** Tie every fix to a measurement, don't read source instead of measuring.

1. Capture a baseline trace via the matching surface driver (`preview_*` for browser UIs, an actual attached CDP/control adapter for Electron, a real foreground terminal/PTY driver for CLIs and TUIs, and `device_*` with the repo's simulator driver for native mobile; report a factual blocker if unavailable). Vet the baseline, and each later number, with the **benchmark-checklist** skill.
2. `how` to ground hypotheses. Don't claim a perf ceiling without running it first.
   Try the performance mantras in order, cheapest first:
   1. Don't do it. Stop work whose result nothing uses rather than cheapening it.
   2. Do it, but don't do it again.
   3. Do it less.
   4. Do it later.
   5. Do it when they're not looking.
   6. Do it concurrently.
   7. Do it cheaper.

   When an earlier mantra meets the target, stop.
3. Plan the fix from the trace. If it crosses a function boundary, `architect` first. Delegate implementation to a subagent using your configured perf-issue model (default the bundled `perf-issue` role at `xhigh` reasoning through live catalog option keys unless the user chooses a budget). Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section. Review the diff. Capture a post-fix trace.
   Apply the **sequence-verifiable-units** principle skill, verifying each attempt before trying the next.
4. Parse and compare the artifacts (JSON to sqlite, diff). "Inconclusive" or wrong-surface is not a pass. Flag it.
5. Cite the measurement in the PR.
6. Run **Opening a PR**.

For sustained improvement against a metric rather than a one-off fix, use the Hillclimb playbook (`playbooks/hillclimb.md`).

**Reply:** baseline number, post-fix number, delta, artifact path.
