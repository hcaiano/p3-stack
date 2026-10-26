# Official pstack reconciliation, 0.15.32

Source: `cursor/plugins:pstack`, version 0.15.32.
Commit: `99b609a72323b70204eab407c622f436e858e112`.
Previous accepted commit: `d457567332aa6989e753ea289f30ea2bfbc80bc0`,
version 0.15.28, recorded in the [previous audit](../2026-10-19/README.md).
Report fingerprint: `fdc708dbccab8fcb5622e2326bd135646391067091acedff54fc758883fce010`.

This integration reviews all 50 changed official files and reruns the auditor
over the full official inventory. [inventory.tsv](inventory.tsv) maps every
official file to its fork target, disposition, source blob and target SHA-256.
Generate the comparison again with `node scripts/audit-upstream.mjs` using the
saved pre-integration report.

## Imported engineering changes

- Add `statechart` (SKILL.md and 24 scripts with their tests) and
  `ketchup-video` verbatim.
- `sharpen` now rewrites the prompt and does not do the task. Take official.
- `create-formal-verification-skill` points to `/statechart` for TLA+ results.
- `swarm` renumbers its steps and says "a result table".
- `reflect` never edits an installed skill in place.
- `orch` prefers the sole open PR of a branch. `watch-pr` ignores fork heads
  as stack parents and bounds its sleep by the timeout. `check-plan` matches
  multi-backtick code spans.
- Update the README table, help map, recipes and guide pages 2, 6 and 10.
  The bundled guide is regenerated from `docs/guide/`.

## T3 transport

- `reflect`: official's `plugins/cache/` and `.cursor/skills/` destinations map
  to Skills CLI installs and a `<skill>-local` copy in `.agents/skills/`.
- `worktree-audit.sh`: official's GNU `stat` and `date` fix targets the Cursor
  transcript scan, which the fork replaced with T3 thread activity. Not ported.
- No target: plugin manifest version bumps and the Claude Code auto-update note
  in the README.

## Preserved deltas and limits

All approved deltas in [UPSTREAM.md](../../../UPSTREAM.md) remain in place. No
new engineering delta is introduced. The dormant Benny pack is unchanged and
`unslop` did not change. No other T3 port was fetched, diffed or copied.
