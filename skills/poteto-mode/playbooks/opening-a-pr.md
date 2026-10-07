### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main. Delegated workers inherit it. Parallel workers on the same branch each get their own worktree with `t3_thread_launch` and a `workspaceStrategy`, one writer per worktree, or `git fetch && git reset --hard origin/<branch>` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Commits.** Commit liberally. Rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit. New commit when separable.

**PRs.** Run the **unslop** skill over the diff before commit. Run the **no-comments** skill before review. Before you open or update a PR, run the **review-it** skill and fix its findings. Write every PR title and PR description with the **write-pr** skill, then apply the **unslop** skill. Write every commit body with the **technical-writing** skill. Apply every technical-writing layer except Diátaxis. Use one word for each action, keep articles, and avoid `-ing` when a plain verb works. A commit body does not restate its subject.

**Titles.** Use Conventional Commits in the form `type(scope): subject`. Use `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf` as the type. Use the changed area, such as `p3-stack` or `poteto-mode`, as the scope. Keep the subject short and imperative. Name a real symbol when one carries the change. For example, `fix(poteto-mode): retarget opening-a-pr babysit trigger`. Do not add a trailing period.

**Descriptions.** The **write-pr** skill owns the PR body: its sections, length, screenshots, checks, and the **review-it** receipt. The squash commit body is the PR body.

**Forge.** GitHub CLI (`gh`) is the forge. Use it for create, edit, view, watch, and merge. Never require Graphite (`gt`).

**Built-in PR tool.** T3's built-in PR tool is `link_pull_request`, and it registers a PR rather than creating one. Call it with the full URL the moment a PR opens, and link every layer of a stack; a PR created through `gh` is untracked until it is linked. `list_thread_pull_requests` returns the stack bottom to top. Create, edit, retarget, and mark ready through `gh`.

**Size and stacks.** Prefer five narrow PRs to one large PR. A stack is a base-branch chain. The root PR targets trunk. Each child branch rebases onto its parent's exact tip and its PR targets the parent branch. Create a child with `gh pr create --base <parent-branch>`, and retarget an existing child with `gh pr edit <pr> --base <parent-branch>`. Branch from trunk only for independent work. Rebase on trunk before substantial stack work.

**Readiness.** Open every PR ready, never as a draft. With `gh`, omit `--draft`. If a PR still opens as a draft, run `gh pr ready <number>`. Run `gh pr view <number>` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists. That pass arms `watch_pull_request` and ends the turn; T3 wakes the thread when checks finish, a comment lands, or the branch conflicts. A babysit for each new PR stalls the build and spends checks on commits that later waves restart. Push back when feedback drifts from intent.

A delegated worker that opens a PR runs the **review-it** skill, the **unslop** skill, and the **no-comments** skill, writes the title and body with the **write-pr** skill, links the PR with `link_pull_request`, and posts the URL. Then it returns to the parent without babysitting, unless it is an Autopilot-full or Autopilot-stack owner. That owner's brief assigns the babysit loop and is the ask `playbooks/babysit.md` waits for. The owner starts the loop after its code-ready report and reports merge-ready or STACK-READY as its playbook says. The rules here and in `playbooks/babysit.md` that hold babysitting until a whole stack is built do not apply to that owner.
