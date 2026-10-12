# Official pstack skill update

Source: `cursor/plugins:pstack`, version 0.15.20.
Commit: `1b6d44ff26d4e242f4e8f68c391e6d2f7ca16def`.
Tree: `1dbec20ada6e40cb12774b8893960a558319fd6b`.
Report fingerprint: `5b5dcb9aa5347735e0d405a507ff9111df91aecdf31d173ac456a48d9ec3a5a3`.

The previous accepted import revision is unknown. The merged configuration
records observed commit `77526ffa67f8dafc698d14b5356e6d4fc78c3127` and
`reviewedCommit: null`. Both remain unchanged. This PR imports the official skill
updates; it does not claim the initial whole-source reconciliation is complete.

## Imported changes

- Add `ketchup`, the read-only catch-up skill, and the prompting and recipe
  references that the help skill uses.
- Keep the playbook, todo list and delegation in the chat receiving poteto-mode.
  Worker briefs describe delegates rather than a replacement playbook runner.
- Port official edits to principles, design, review, investigation, reflection,
  writing and trace-forensics instructions. Preserve the existing PR-workflow
  and Autopilot timing deltas listed in UPSTREAM.md.
- Match the official two-seat defaults for arena, architect and interrogate.
  Existing explicit user configurations retain their chosen seats and models.
- Package the official plan checker and its five fence-parsing test cases.
  Translate the recurring-run marker to `schedule_task` and run the tests through
  the fork's Node test setup.
- Carry the watcher pagination fix into the native Babysit workflow. Read every
  review-thread page before declaring merge-ready.
- Carry PR-target-aware worktree auditing into the native worktree workflow.
  The user's cleanup command is `trash`.
- Apply the user's automatic account-fallback requirement in the shared T3
  adapter. The bundled JSON resolver preserves measured choices and attempts
  authorized, mapped targets with unknown usage without asking permission.
  Three Sol designs and a Sol cross-judge selected this small resolver over
  prose-only policy or a gateway duplicating quota ranking and delegation.

## File mapping and permitted transport differences

[inventory.tsv](inventory.tsv) covers every one of the 167 official files. It
records the official Git blob, fork target, disposition and target SHA-256.
The checksum records the comparison artifact; it is not a semantic verdict.

| Disposition | Files | Treatment |
| --- | ---: | --- |
| compare | 115 | Compare source and fork content. Skill paths stay the same. Agent briefs move into poteto-mode references. The checker test moves into the existing tests directory. |
| native-t3-transport | 19 | Cursor's local watcher, orchestration and worktree scripts are replaced by app-owned PR watches, tasks, schedules, thread and worktree tools. The generic plan checker remains bundled. |
| vendor-packaging | 20 | Plugin manifests, artwork and Cursor setup guides are not T3 skill resources. The fork's installer, README and default-mode guide own T3 setup. |
| separate-skills-cli-update | 1 | Official unslop remains owned by cursor/plugins. Its updated source needs a separate Skills CLI update, not a copy into installed files. |
| unresolved-automation-port | 12 | Benny's optional automation pack has no completed T3 port. See the unresolved gap below. |

The permitted content differences are frontmatter UI removal, Skills CLI paths,
bundled worker briefs, named live model roles and account resolution, explicit
read-only child briefs, T3 thread history, native browser and device tools,
native task/schedule/PR/worktree transport and the approved UPSTREAM.md deltas.
No source was fetched, diffed or copied from another T3 port.

## Reproduce the comparison

Run `node scripts/upstream.mjs`, then
`node scripts/audit-upstream.mjs <report.json> [output-directory]`.
The audit writes an inventory and source-to-fork diffs into the checkout's Git
directory. It never fetches a second source, changes skills or advances revisions.
Use the pinned source commit above when reviewing this candidate. A newer
checker report describes another source revision and needs its own comparison.

## Validation

- `node --test tests/*.test.mjs` passes all 29 tests through `agent-run heavy`.
  Sol review found and reproduced two regressions: the published plan template
  failed its own checker, and the auditor read a stale main-checkout report in a
  worktree. Their failing tests precede the fixes in the commit history.
  Seven resolver tests cover unknown usage, measured pacing choices, exact
  target and shared-pool exclusions, refreshed rankings, missing mappings,
  pins and invalid reports through the real CLI.
- `git diff --check` passes. Skill frontmatter and local references were checked.
- A disposable project installation through `npx skills@latest` and the existing
  installer succeeds. The installed ketchup, help references and plan checker
  match the source bytes. A second installation verifies the fallback resolver
  and updated execution references. Global installations were not changed.
- Live `orchestrator_capabilities` exposes child tasks, native PR watches,
  schedules and thread tools. `t3-capacity` resolved representative live roles.
  Delegated work used that live selection. This is transport evidence, not a
  behavioral evaluation of every changed skill.

## Unresolved initial-audit gap

Benny uses Cursor's reviewed Automations editor handoff and per-automation
permission configuration. Replacing those instructions with a scheduler call
would not prove its required Slack-thread and child-write restrictions. This
run does not activate, replace or rewrite the user's existing issue workflow.
The optional pack was unchanged between the two observed official revisions.
Its initial T3 reconciliation remains open, so `reviewedCommit` stays null.

Official unslop also changed. Update it separately through the Skills CLI from
the pinned official commit after the user's installation approval. This PR
changes neither its fork copy nor any third-party installed skill.
