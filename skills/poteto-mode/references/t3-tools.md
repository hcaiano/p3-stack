# T3 inputs for the portable tools

Resolve `<installed-poteto-mode>` from the skill's installation. The bundled
Bun scripts retain the official store and readiness policy. Native T3 tools
supply the readiness and activity inputs and the wakes. Run commands through the
host's required foreground launcher.

## Frontier

The frontier uses official `orch` unchanged. Run it in the stacker's clone with
a branch of the stack checked out:

```sh
bun <installed-poteto-mode>/scripts/orch/orch.ts --store <store> --json frontier set --repo <repo> [--forge origin]
```

It walks the PR base chain with `gh`, or with `origin` when the program resolved
the forge to Origin. `link_pull_request` still registers every PR with the
thread, but the thread's PR list is not a frontier input.

## PR readiness

Use `watch-pr/once.ts`'s `OnceRequest` and `QueueCheckpoint` interfaces for the
input. A new session has sequence and consecutive errors zero, `startedAt` in
Unix epoch seconds, and `retryNotBefore: null`. Defaults are interval 60,
sweep interval 300, timeout zero, maximum query errors five and allowDraft false.
The target is single, stack, or queued-stack. Capture the queued contexts once.

```sh
bun <installed-poteto-mode>/scripts/watch-pr/watch-pr --input <request.json>
```

Each call performs bounded reads and exits with a JSON receipt. Persist the
complete receipt and use its `next` request on the following native wake.
`parseOnceRequest` validates continuations; do not reconstruct them from prose.
Keep the frozen queue and error counter. `--pretty` is a human report and omits
the machine continuation, so use JSON when the session must resume.

Arm `watch_pull_request` and end the turn. Watch the active PRs from the frozen
queue when upstack blockers matter. After a wake, evaluate fresh facts and handle
the source verdict. Status-only exit zero and nonterminal WAITING do not prove
readiness. ADVANCE continues to the next frontier; COMPLETE ends the queue.
No verdict grants merge authority. Unwatch before handback.

The evaluator retains the five-error budget for its own reads. T3 does not expose
its internal watch counter or last successful read, and its native watch stops
after eight failures. Native wakes do not guarantee the official polling,
sweep, backoff or deadline cadence. The receipt records this limitation. Keep
the official budgets and deadlines; never infer success from silence or add a
polling process or recurring PR timer.

## Worktree activity

Use `t3-thread-activity.ts`'s `ThreadActivityExport` interface. Page
`t3_thread_list` with `includeSubagents: true`, including settled threads, for
all relevant projects. Read every history with `t3_thread_read` in activity view
until `hasMore: false`. Recover truncated text with item IDs and UTF-16 offsets.
Search results alone do not prove complete coverage.

Normalize each recovered item's ID, actual activity timestamp and full text.
Classify message and tool activity as `kind: "activity"`; title, settlement and
other metadata changes are `kind: "metadata"`. Thread `updatedAt` and current
worktree binding alone are not evidence of work. If an item cannot be classified
or fully recovered, mark the history incomplete rather than declaring absence.
Export the complete project and thread ID inventory, repository root, capture
time and each history's coverage. Timestamps must precede the capture time.

```sh
bash <installed-poteto-mode>/scripts/worktree-audit.sh --thread-activity <activity.json> -b <pr-base-ref> <repo>
```

The original Git inventory includes detached worktrees. The adapter finds paths
at boundaries and uses the latest meaningful activity of the entire matching
thread. Incomplete coverage yields unknown evidence and the review bucket,
unless earlier source gates already require a hold. The original four-day floor,
WIP/scratch distinction, PR and remote columns, size order and cleanup gates
remain. The audit never deletes worktrees.
