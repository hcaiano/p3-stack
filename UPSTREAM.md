# Upstream maintenance

Upstream: official pstack, https://github.com/cursor/plugins/tree/main/pstack.
This fork tracks no other source.

Reviewed official revision: `99b609a72323b70204eab407c622f436e858e112`
(0.15.32), reconciled on 2026-10-26 against the complete official tree. The
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
  `interrogate` is the two-reviewer round that `review-it` runs; a contested
  design is graded `high`, so that `xhigh` round is its `interrogate` run. Files:
  `skills/poteto-mode/playbooks/opening-a-pr.md` (no PR body template),
  `skills/poteto-mode/playbooks/feature.md`, `skills/poteto-mode/SKILL.md`, `skills/poteto-help/SKILL.md`,
  `skills/technical-writing/SKILL.md` and `skills/benchmark-checklist/SKILL.md`.
- **Autopilot PR timing.** An Autopilot-full or Autopilot-stack owner opens
  its PR only when the shipped code is final and self-proof and the root's
  `review-it` receipt both cover that exact head. It writes the PR with `write-pr`, opens it
  ready, links it, reports the code-ready head, and starts the babysit loop in
  `drive` mode. Official opens the PR before self-proof. Files:
  `skills/poteto-mode/playbooks/autopilot-full.md`,
  `skills/poteto-mode/playbooks/autopilot-stack.md`,
  `skills/poteto-mode/playbooks/opening-a-pr.md` and
  `skills/poteto-mode/playbooks/multi-phase-plan.md`.
- **Fewer child agents.** `no-comments` applies the comment brief in the
  calling agent for a scope of 20 changed files or fewer and delegates only
  larger scopes: in T3 every child is a full thread whose completion wakes a
  large parent. A delegate applies it itself at any scope. Files: `skills/no-comments/SKILL.md`.
- **One review per change.** `show-me-your-work` skips its cross-model trail
  review when `review-it` already reviewed the run's changes, because both put
  a second model on the same work. Files: `skills/show-me-your-work/SKILL.md`.
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
- **Revertible deploys proceed.** Approved on 2026-10-16. Agents pause only for
  writes a revert cannot undo: force-push to shared branches, data deletion,
  customer messages, and a deploy that runs a destructive migration or
  publishes a release. A deploy that a revert undoes proceeds. Official pauses
  for every deploy. Files: `skills/poteto-mode/SKILL.md` and
  `skills/poteto-mode/playbooks/orchestrate.md`.
- **Architect for new structure.** Approved on 2026-10-19 after the workflow
  retro: `architect` ran 649 times in a week, mostly on changes inside existing
  modules. It now triggers on a new module, data model or public contract;
  official triggers on any code crossing a function boundary. Files:
  `skills/poteto-mode/SKILL.md` and the `feature`, `bug-fix`, `perf-issue`
  and `refactoring` playbooks, and the `poteto-help` map.
- **One video, for screen flows.** Approved on 2026-10-19 after the workflow
  retro: a week had about four takes per published video, and videos of
  command-line changes. The review gate records one video of the final head,
  only when a flow across screens changes; a failed take means fixing the
  harness. Screenshots stay. File:
  `skills/poteto-mode/playbooks/multi-phase-plan.md`.
- **Bounded code briefs.** Approved on 2026-10-19 after a trace review of three
  weeks of runs: delegates did as well as the parent on briefed work but
  over-built and drew more corrections when they chose scope or coordinated.
  Outside `hardest tasks`, a code brief names the files, the chosen approach,
  the acceptance commands, what is out of scope and any PR; a code delegate adds
  no unnamed module, migration, dependency or PR and starts no children.
  Autopilot PR owners and the Orchestrate coordinator read `judgment and prose`
  instead of the code role, and Orchestrate's brief template gains an APPROACH
  field. Summaries reach the user in plain language. Files:
  `skills/poteto-mode/references/subagents.md`, `skills/poteto-mode/references/poteto-agent.md`
  and `skills/poteto-mode/playbooks/orchestrate.md`.

- **Leaf delegates.** Approved on 2026-10-31: delegates that owned a PR ran
  `review-it` and spawned their own reviewers, three levels deep, after the
  user had asked for no nesting. Only the chat that runs the playbook spawns.
  Every delegate is a leaf: it returns any review, panel, swarm or fan-out to
  the chat, which staffs it and sends the result to a fresh round. Official
  lets owners fan out and Orchestrate nest sub-coordinators at depth 3. Files:
  `skills/poteto-mode/references/poteto-agent.md`,
  `skills/poteto-mode/references/subagents.md`,
  `skills/poteto-mode/playbooks/orchestrate.md`,
  `skills/poteto-mode/playbooks/feature.md`,
  `skills/poteto-mode/playbooks/autopilot-full.md`,
  `skills/poteto-mode/playbooks/opening-a-pr.md`,
  `skills/poteto-mode/playbooks/multi-phase-plan.md`,
  `skills/poteto-mode/playbooks/pause-safely.md` and
  `skills/no-comments/SKILL.md`.

- **One effort source.** Approved on 2026-10-19 after a trace audit: the
  Subagents section started every role at `xhigh` and adjusted it per job, while
  `pstack-models.md` set each role's effort, so verifiers ran at mixed levels.
  A role now takes the effort `pstack-models.md` gives it, and the bundled
  `xhigh` only when the file names none; the per-job raise and lower steps are
  gone, and a skill that says to pick the level for the job uses the role's
  effort. Files: `skills/poteto-mode/SKILL.md`,
  `skills/poteto-mode/references/subagents.md`,
  `skills/poteto-mode/references/model-selection.md`,
  `skills/poteto-mode/references/t3-execution.md` and
  `skills/setup-pstack/SKILL.md`.

- **Standard speed.** Approved on 2026-10-29: fast agents burn the user's
  usage, and only the user turns fast mode on, by hand. Every spawn runs at
  standard speed with the model's fast option set off, on its standard model ID.
  Official uses fast mode for urgent jobs and fast verification. Grok seats are
  exempt and keep their configured fast settings. Skills that pointed to the
  Subagents section for "fast or standard speed" now point to it for speed.
  Files: `skills/poteto-mode/references/subagents.md`,
  `skills/poteto-mode/references/t3-execution.md`,
  `skills/setup-pstack/SKILL.md` and every skill and playbook with that pointer.

- **Ask once.** Approved on 2026-10-19 after a trace audit: one goal sent the
  same question seven times before solving it alone. The Never Block on the
  Human entry adds that a question asked again without new evidence is a stall;
  the agent acts on the stated default and says so. It applies to reversible
  work; a gate the operator named stays a wait. File:
  `skills/poteto-mode/SKILL.md`.

- **A short core for delegates.** Approved on 2026-10-19 after a trace audit:
  `SKILL.md` was read 9,315 times in five days, mostly by delegates that never
  run the playbook. `SKILL.md` keeps what every agent follows: the
  Non-negotiables that bind any agent, Principles, Autonomy, Writing the reply
  and Comments, with a pointer section for Subagents. The runner's own triggers
  and the Playbooks list moved to `references/playbook-runner.md`; the Subagents
  rules moved to `references/subagents.md`, read by the runner and by any agent
  before it spawns. `poteto-agent` reads the core, its playbook step and the
  principles it applies. The text moved unchanged apart from relative paths.
  Files: `skills/poteto-mode/SKILL.md`,
  `skills/poteto-mode/references/playbook-runner.md`,
  `skills/poteto-mode/references/subagents.md`,
  `skills/poteto-mode/references/poteto-agent.md`, `skills/poteto-help/SKILL.md`,
  both copies of the guide's `02-poteto-mode.md` and `README.md`.

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

Merge through `land-it`; a hold goes to the user with its reasons. After the
merge, install the merged commit URL through the Skills CLI and verify MBP and
PC delivery.
Never mark a revision reviewed merely because it was fetched. A fork does not
synchronize with official by itself.
