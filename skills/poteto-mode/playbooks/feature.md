### Feature

Resolve named roles and child transport through the installed `../references/t3-execution.md`. Use self-contained `delegate_task` briefs, `mode: "async"`, retained task IDs; once nothing independent is left, end the turn until their completion notifications wake you, then read each result with `task_status`, and stop with `task_cancel`. T3 child agents get only the brief, never the parent's context. Required worker isolation uses supported child worktrees or branches. `t3_thread_launch` is only for explicitly requested separate top-level conversations. Report a factual limitation if the child runtime cannot provide required isolation.

**You own the design. Plan, review, verify.** Delegate implementation. Stay in the lead.

1. `how` over the affected subsystem.
2. `architect` for parallel design exploration when the feature adds a module, data model or public contract.
3. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Delegate code-writing to a subagent using your configured feature model (default the bundled `feature, refactoring` role at `xhigh` reasoning through live catalog option keys unless the user chooses a budget) with a specific scope (file paths, named data shape and its organizing structure per **principle-model-the-domain**, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the delegate writes logic, and success criteria). Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section. When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A subagent forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested agent. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
6. Rebase into small, ordered commits. Stack follow-ups.
   Use the **sequence-verifiable-units** principle skill, building, verifying, and committing each small unit before the next.
7. If the design is contested, grade the change `high` when you run `review-it` before opening the PR: its `xhigh` interrogate round is the contested-design `interrogate`.
8. Run **Opening a PR**.

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner fans out internally after the blocking phase. Parent-level fan-out is for slices that produce independent artifacts (audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries. Spawn a fresh owner rather than chaining interrupts.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives.
