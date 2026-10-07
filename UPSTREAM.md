# Upstream maintenance

Upstream: official pstack, https://github.com/cursor/plugins/tree/main/pstack.
This fork tracks no other source.

Official HEAD observed on 2026-10-05:
`77526ffa67f8dafc698d14b5356e6d4fc78c3127`.
This is an observation, not an import base: nobody recorded which official
revision the first T3 adaptation came from. Do not claim a byte-identical import.

## Provenance

The first T3 adaptation came from https://github.com/uzairansaruzi/p3-stack at
`09909ebb5c0125e27fad3e57d96b81e832696d69`. Its LICENSE notice stays. The user
decided on 2026-10-07 to stop tracking that repository: nothing is fetched,
diffed or trusted from it. The T3 port is ours. We adapt official changes to
T3 Code ourselves.

Keep official engineering content unchanged. No local engineering improvements,
model-quality opinions, reduced review panels or reasoning caps. Our changes are
the T3 port, account resolution, installation packaging, the user guide and the
approved deltas below. The worker briefs live in poteto-mode so Skills CLI
includes them; the existing installed upstream unslop is reused. No Firstmate
runtime is included.

## Our T3 port

The T3 port is the Cursor to T3 Code map in [AGENTS.md](AGENTS.md), applied to
official text. It is not a delta to record file by file.

## Approved deltas from official

The user approved these changes to official text. Keep them when you port
official updates.

- **PR workflow.** Agents run `review-it` before they open or update a PR and
  write PR titles and bodies with `write-pr`, both from `hcaiano/skills`.
  `interrogate` stays as the `dual` panel that `review-it` calls. Files:
  `skills/poteto-mode/playbooks/opening-a-pr.md` (no PR body template),
  `skills/poteto-mode/SKILL.md`, `skills/poteto-help/SKILL.md`,
  `skills/technical-writing/SKILL.md` and `skills/benchmark-checklist/SKILL.md`.
- **Autopilot PR timing.** An Autopilot-full or Autopilot-stack owner opens
  its PR only when the shipped code is final and self-proof and `review-it`
  have both passed on that exact head. It writes the PR with `write-pr`, opens it
  ready, links it, reports the code-ready head, and starts the babysit loop in
  `drive` mode. Official opens the PR before self-proof. Files:
  `skills/poteto-mode/playbooks/autopilot-full.md`,
  `skills/poteto-mode/playbooks/autopilot-stack.md`,
  `skills/poteto-mode/playbooks/opening-a-pr.md` and
  `skills/poteto-mode/playbooks/multi-phase-plan.md`.
- **Installer dependencies.** The installer requires only `t3-capacity` from
  `hcaiano/skills`. `pair` moved to that repo's `deprecated/` folder.

## Checking for updates

```bash
node scripts/upstream.mjs
```

The checker tracks official `cursor/plugins:pstack` only. Its revisions live in
[upstream/sources.json](upstream/sources.json). Changes elsewhere in
cursor/plugins do not trigger an update. The checker fetches into its own cache,
so the checkout needs no `upstream` git remote. Reports, scoped patches and
inventories are written under `.git/p3-upstream`; `--output` chooses another
directory. The command changes neither skills nor reviewed revisions.

`initial-audit-required` means the official import base is unknown, even when
the observed source has no newer changes. `update-available` means the reviewed
source tree changed. `current` means that source tree has no changes since its
reviewed revision; it does not certify the global installation. Fetch failures
produce an incomplete report and a nonzero exit status.

## Weekly integration

The T3 recurring task follows [upstream/MAINTENANCE.md](upstream/MAINTENANCE.md):
detect official changes, port them to T3 Code, and prepare or update one
reviewable PR. The initial official audit remains pending until a full source
comparison establishes a reviewed baseline.

Merge and global installation require user approval. After approval, use a
reviewed commit URL through the Skills CLI and verify MBP and PC delivery.
Never mark a revision reviewed merely because it was fetched. A fork does not
synchronize with official by itself.
