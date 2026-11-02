# Official pstack reconciliation, 0.15.36

Source: `cursor/plugins:pstack`, version 0.15.36.
Commit: `ae5650febf4320793844c12c4adaa937f417f8da`.
Previous accepted commit: `99b609a72323b70204eab407c622f436e858e112`,
version 0.15.32, recorded in the [previous audit](../2026-10-26/README.md).
Report fingerprint: `1b628c4714d0abf0cad9d09fdb4c5040032639bf264542b8825f6090612ad377`.

This integration reviews all 464 changed official paths and reruns the auditor
over the full official inventory. [inventory.tsv](inventory.tsv) maps every
official file to its fork target, disposition, source blob and target SHA-256.
Generate the comparison again with `node scripts/audit-upstream.mjs` using the
saved pre-integration report.

## Imported engineering changes

- `statechart`: official replaced the `.mjs` scripts with a TypeScript
  pipeline, a `statechart` launcher, `references/render.md`, new tests and a
  corpus. The skill now checks a TLA+ model and reports the shortest path to
  each state that breaks a rule. The whole tree is verbatim; the fork had it
  identical to the previous official.
- `interrogate`: rewritten. Adversaries try to break a change and a finding
  survives only when a rerun proves it. It reuses `arena` Phase A steps 3 and
  4, Phase B and Phase F. The four reference files are removed.
- `arena`: seats that cannot run are dropped, with runners added back to two.
  The cross-judge is never from the parent's family, and with none it is skipped.
- `orchestrate`: rewritten from a 112-line store and `orch` protocol to a
  topology and supervision playbook. The `orch` scripts are removed, with
  their section in `t3-tools.md` and the `orch` test in `package.json`.
- `autopilot-stack` is Autopilot-full without the merge. A PR stacks only on a
  PR it builds on. `STACK-READY` and the root-owned chain are gone.
- `autopilot-full`: push each finished unit, no verifier for a wording-only
  change, a blocking rule that needs a shown problem, a known concurrent change
  can call for a rebase, and "parked follow-ups" in the reply.
- `multi-phase-plan`, `babysit`, `opening-a-pr`, `autonomous-run`: follow the
  items above. The verdict checklist judges findings by the blocking rule.
- `poteto-mode`: a first-message trigger (goal, problem, smallest change) and
  an `Explain the Number` description that applies before you measure.
  `principle-explain-the-number` gains "write the decision before you run".
- `ketchup-video` renders subtitles. `create-formal-verification-skill`,
  `setup-pstack`, `poteto-help`, the README and guide pages 4, 6, 7 and 10 follow.

## T3 transport

- Orchestrate: `Task` becomes `delegate_task` with `mode: "async"`. The
  Cursor Project tracker and store become a `notes.md` file in the thread's
  local store. PR event subscriptions become `watch_pull_request`. Cloud VM
  workers become isolated `delegate_task` children.
- `interrogate`: `generalPurpose` has no T3 equivalent. Each adversary is a
  `delegate_task` child with a self-contained brief.
- First-message trigger: placed in `references/playbook-runner.md`, because
  only the chat that runs the playbook talks to the user.
- Slug rejection fallback: the Cursor `Task` text becomes one sentence in
  `references/subagents.md` about `delegate_task` and the live catalog.
- Not ported: the "steer or resume in the background" sentence, since every
  `delegate_task` is async and a follow-up is a new round. Plugin manifest
  version bumps have no target.

## Preserved deltas and limits

All approved deltas in [UPSTREAM.md](../../../UPSTREAM.md) remain.
Two moved toward official. The "Rebase once" delta no longer says the root
owns every rebase in Autopilot-stack, and the "Bounded code briefs" delta
puts the approach in the Orchestrate brief, since the template is gone.
"Leaf delegates" still removes official's depth-3 sub-coordinators.
The dormant Benny pack is unchanged and `unslop` did not change. No other T3
port was fetched, diffed or copied.

`review-it` is a separate skill in `hcaiano/skills`. It still reads
`interrogate` output as "Act On" findings. That wording needs an update there.
