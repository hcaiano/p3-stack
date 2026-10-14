# Upstream maintenance

Upstream: official pstack, https://github.com/cursor/plugins/tree/main/pstack.
This fork tracks no other source.

Reviewed official revision: `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`
(0.15.24), reconciled on 2026-10-14 against the complete official tree. The
first T3 adaptation had no recorded import base; the 0.15.20 audit in
`upstream/audits/2026-10-12/` restored the official content before this
baseline. Do not claim a byte-identical import: the T3 port and the deltas below
differ by design.

## Provenance

The first T3 adaptation came from https://github.com/uzairansaruzi/p3-stack at
`09909ebb5c0125e27fad3e57d96b81e832696d69`. Its LICENSE notice stays. The user
decided on 2026-10-07 to stop tracking that repository: nothing is fetched,
diffed or trusted from it. The T3 port is ours. We adapt official changes to
T3 Code ourselves.

Port every official change. A difference from official is allowed only for
the T3 port below (a Cursor mechanism with no T3 equivalent as written) or for an
approved delta listed below. An existing fork version is not a reason to skip an
official change; when official removes the reason for a T3 adapter, drop the
adapter and take official.

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
- **Cleanup command.** The user's AGENTS.md requires `trash`, replacing the
  recursive removal command in `skills/poteto-mode/playbooks/worktree-cleanup.md`.
- **Automatic account fallback.** On 2026-10-12 the user required authorized
  fallbacks to proceed without permission when usage is missing. The T3 account
  adapter also treats configured models and singleton pools as preferences unless
  the user explicitly prohibits alternatives. Exhausted preferences fall back
  automatically through the selected configuration and all declared fallback tiers.
  Where the approved automatic fallback policy permits it, qualifying live
  alternatives follow those tiers. Preferences stay in the configuration, with
  no fixed priority list in skills. It preserves measured
  selection, distinguishes missing usage from missing
  billing mappings and bounds retries without changing engineering requirements.
  Files: `skills/poteto-mode/references/t3-execution.md`, `model-selection.md`,
  `skills/poteto-mode/scripts/resolve-capacity.mjs` and their skill callers.
- **Verification ownership and retries.** Approved on 2026-10-12 after the
  workflow retro: one verifier owns a shared desktop, releases it on human
  preemption, and retries a failed case only after a relevant input changes.
  Passed evidence remains valid while its inputs do. Files:
  `skills/poteto-mode/references/t3-execution.md` and
  `skills/create-verification-skill/SKILL.md`.
- **Complete instruction delivery.** Approved on 2026-10-12 after the workflow
  retro: required reads must reach the agent in full, with enough aggregate
  output budget or separate delivery; clipped ranges must be recovered before
  the read is complete. File: `skills/poteto-mode/references/t3-execution.md`.
- **Rebase once.** Approved on 2026-10-14. In a busy monorepo trunk moves about
  every 10 minutes and CI takes 10 to 23 minutes, so a rule that rebases during
  CI or review never ends. An Autopilot-full owner rebases onto current trunk
  once, before it opens the PR; in Autopilot-stack the root owns every rebase.
  CI, review, babysit and fix rounds stay on that base, and there is no
  merge-prep rebase. Right before the merge, official's pre-merge test, plus its
  fix-round trunk-CI clause, still decides: rebase and wait for CI only when the
  code that would land was never tested (a conflict, a file both sides changed,
  a change to which checks run for the PR, or trunk breaking the PR's CI). Official's lockfile and
  caller-or-dependency rules stay. Stack topology rules are unchanged. Files:
  `skills/poteto-mode/playbooks/autopilot-full.md`,
  `skills/poteto-mode/playbooks/autopilot-stack.md`,
  `skills/poteto-mode/playbooks/multi-phase-plan.md`,
  `skills/poteto-mode/playbooks/babysit.md` and
  `skills/poteto-mode/playbooks/opening-a-pr.md`.

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
reviewable PR. Each run compares official changes since the reviewed revision
in `upstream/sources.json`.

Merge and global installation require user approval. After approval, use a
reviewed commit URL through the Skills CLI and verify MBP and PC delivery.
Never mark a revision reviewed merely because it was fetched. A fork does not
synchronize with official by itself.
