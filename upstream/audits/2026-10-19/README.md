# Official pstack reconciliation, 0.15.28

Source: `cursor/plugins:pstack`, version 0.15.28.
Commit: `d457567332aa6989e753ea289f30ea2bfbc80bc0`.
Previous accepted commit: `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`,
version 0.15.24, recorded in the [previous audit](../2026-10-14/README.md).
Report fingerprint: `26fe2c6fc3c45419207769a2126297ce67058f2e56de53b443185d040011b9bb`.

This integration reviews all 35 changed official files and reruns the auditor
over all 172 official files. [inventory.tsv](inventory.tsv) maps every official
file to its fork target, disposition, source blob and target SHA-256. Every
`compare` target is present. Generate the comparison again with
`node scripts/audit-upstream.mjs` using the saved pre-integration report.

## Imported engineering changes

- Add `create-formal-verification-skill` and
  `maintain-formal-verification-skill` verbatim. They choose a property and
  tool, prove that checks can fail, track covered code and sync commits, and
  distinguish stale verification from product bugs.
- Extend setup, help, recipes and the guide with formal verification.
- Update `ketchup` to explain changes and enumerate every pending decision,
  including evidence and risk. Remove its fixed total word limit and mandatory
  status diagrams. Keep inline screenshots and useful diagrams.
- Import the official changes to premise testing, root-cause diagnosis,
  idempotency, API migration, behavioral tests and type-system discipline.
- Brand TypeScript primitives with a verifying type guard rather than a cast.
- Import the smaller lead-review, `sharpen` and `swarm` instructions and guide
  corrections. Official now fixes the previous overnight-guide inconsistency
  about verifier rounds after a later push.

## T3 transport and packaging

- Keep the existing named roles, account selection, child isolation, PR events
  and installation paths. `ketchup` uses `html_render` for official's
  `/visualize` calls.
- Map the new official Claude Code adapter to the existing bundled
  `skills/poteto-mode/references/t3-execution.md`. The auditor compares these
  resources. Its tool, model, path and provider fallback tables describe a
  different harness; T3 keeps its own live catalog and preserves model diversity.
- Keep Skills CLI installation instead of the new official Claude plugin
  commands, namespaced slash commands and generated harness tree. The plugin
  manifest version bumps have no T3 target. The two lowercase skill-name fixes
  already match this fork.
- Regenerate the bundled guide from `docs/guide/`, changing only packaged links.
  Preserve `watch_pull_request` for events. Read readiness with the one-shot
  evaluator on GitHub or the Origin CLI when Origin is the forge.

## Review corrections

The two-model review found two documentation omissions. The README now ports
official's persistent-mode wording through global instructions. The guide and
its bundled copy now include official's Origin readiness path alongside the
T3 PR watch. Both corrections stay within the findings' scope.

## Preserved deltas and limits

All approved deltas in [UPSTREAM.md](../../../UPSTREAM.md) remain in place,
including PR workflow, account fallback, verification ownership and retries,
rebase once, and revertible deploys. No new engineering delta is introduced.
The official guide's trunk-move explanation still predates the approved
rebase-once delta and remains unchanged.

The dormant Benny pack is unchanged. Its existing unresolved activation status
remains in the inventory; this integration does not activate it. `unslop` did
not change and keeps its existing official ownership.

No other T3 port was fetched, diffed or copied.
