# p3-stack

p3-stack is [pstack](https://github.com/cursor/plugins/tree/main/pstack) rebuilt for T3 Code. Same engineering discipline, native T3 orchestration.

pstack is poteto's answer to AI slop code. It turns an agent into an engineering team: one mode skill that routes to playbooks, principles that ground every decision, and verification strict enough that you can parallelize with confidence. p3-stack keeps that system and rewires the mechanics to T3 Code's primitives:

- **Delegation.** `delegate_task` child agents replace Cursor's Task tool, with per-role providers and models resolved from `orchestrator_capabilities`. Cross-model panels are native.
- **Worktrees.** `t3_thread_launch` binds a worker to its own worktree and branch. One writer per worktree, enforced by the app instead of by advice.
- **Watching.** `watch_pull_request` wakes the thread when checks finish, someone comments, or the branch conflicts. No polling loops.
- **Scheduling.** `schedule_task` runs audits and overnight cadences even when no turn is active. No `/loop`.
- **Memory.** `t3_thread_read` and `t3_thread_search` replace mining Cursor transcript files.
- **Proof.** `preview_*` browser tools and `device_*` simulators replace external control skills. Screenshots and recordings land in the thread.

## Personal fork

This fork preserves pstack's engineering playbooks and the T3 port. It adds
capacity-aware account selection, globally installable worker briefs, and a
collision-safe Skills CLI installer. All enabled accounts, including Cursor,
are eligible. See [UPSTREAM.md](UPSTREAM.md) for the exact port baseline and
how to review updates.

## Install

Requires Node.js/npx and the existing `t3-capacity` and `pair` skills from
`hcaiano/skills`. Installation uses the Skills CLI, not hand-edited installed
copies. Keep an existing upstream `unslop`.

```bash
git clone https://github.com/hcaiano/p3-stack.git
cd p3-stack
./install.sh --dry-run
./install.sh
```

During review, check out `feat/global-t3-accounts` and pass
`--source https://github.com/hcaiano/p3-stack/tree/<full-40-character-commit>`
using `git rev-parse HEAD` for the reviewed commit. This pins the installation;
the Skills CLI misparses branch names containing a slash. Global is the default; `--project /path/to/repo` selects a
project installation. Existing unrelated skills cause a stop before any writes.

To update this fork's installed copies, use `./install.sh --update` with the
reviewed source. Finish active sessions that may read the replaced skills first;
the Skills CLI does not replace folders atomically. Adding new skill names does
not require stopping unrelated agents.

Install on the MBP, the Fleet source of truth. Fleet already synchronizes
`.agents/skills` and the Skills CLI lock. The bundled defaults travel inside
p3-mode, so another machine resolves its own live provider IDs and account usage.
A custom `~/.agents/p3-models.md` is local unless separately synchronized.

## Get started

1. Start a new task with `/p3-mode` followed by the outcome you want.
2. Automatic account selection works from the bundled defaults. `/setup-p3`
   optionally writes global preferences or a project override.
3. In each application, use `/create-verification-skill` to establish how agents
   start, drive and verify the real app. Reuse existing working tooling.
4. Use `/p3-help` for help. The [Portuguese getting-started guide](docs/usar-pstack.md)
   has examples based on poteto's two articles.

Project model configuration overrides `~/.agents/p3-models.md`, which overrides
the bundled defaults. `capacity` selects a suitable model/account using the live
T3 catalog and usage; `auto`/`inherit-parent` retain the parent's model. The
reasoning budget is not a financial cap. Unknown usage remains unknown.

Existing project issues and acceptance criteria remain authoritative. In a p3
task, p3 owns implementation and review; personal workflows remain installed for
explicit use. The user's merge, production and other approval boundaries apply.
Global installation makes the skills available; it does not activate p3-mode in
every conversation or migrate existing threads.

## Validation

```bash
node --test tests/*.test.mjs
./install.sh --dry-run
```

## The mode

`p3-mode` routes every task. Its playbooks: investigation, bug fix, perf issue, hillclimb, runtime forensics, trace forensics, feature, refactoring, prototype, visual parity, authoring a skill, eval, babysit, shipping, autonomous run, orchestrate, autopilot-full, autopilot-stack, session pickup, pause safely, multi-phase plan, worktree cleanup, opening a PR.

## Skills

architect, arena, automate-me, benchmark-checklist, blast-radius, bro, correct, create-verification-skill, figure-it-out, how, interrogate, maintain-verification-skill, make-bot-ui, no-comments, p3-help, recall, reflect, setup-p3, show-me-your-work, swarm, tdd, teach, technical-writing, typescript-best-practices, unslop, why.

## Principles

The twenty-four principle skills are indexed inside `p3-mode` and referenced by the other skills by name.

## Credit

p3-stack adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack) by [poteto](https://x.com/poteto). The skills, principles, and language are hers; the T3 Code rewiring is this repo's. MIT, see [LICENSE](LICENSE).
