### Visual parity

**You own pixel-exact equivalence. The baseline is the spec. You do not touch it.** Equivalence is verified by image diff, not by eye.

1. Establish the baseline first, before any migration: a visual regression harness that screenshots the current component across its states, plus the target when matching two implementations. No baseline, no parity claim. A blocking prerequisite, not a follow-up.
2. Anti-shortcut clauses, stated and held: no harness modifications, no baseline tampering, no component restructuring to make a diff pass. If the baseline looks wrong, stop and ask, don't edit it.
3. Migrate one component at a time. Parallelize across worktrees, one owner per component (the **separate-before-serializing-shared-state** principle skill). Shared primitives migrate first as a blocking phase.
4. Verify each component against its baseline via image diff on the matching surface via the matching surface driver (`preview_*` for browser UIs, an actual attached CDP/control adapter for Electron, a real foreground terminal/PTY driver for CLIs and TUIs, and `device_*` with the repo's simulator driver for native mobile; report a factual blocker if unavailable). A nonzero diff is a fail. Investigate the pixel delta. Use `schedule_task` for continued unattended work per component until the diff is zero; retain the schedule ID and delete it when the predicate is met.
5. Run **Opening a PR** per component or per safe batch.

**Reply:** components migrated, the diff result for each, the baseline harness location, what's left.
