import { readFileSync } from "node:fs";
import { GhGitHubReader, WatcherQueryError, parsePullRequest } from "./github.ts";
import {
  applyQueueSnapshot,
  assessGitHubMerge,
  classifyPr,
  createQueueState,
  evaluateQueue,
  planQueue,
  queryBackoffSeconds,
  readSnapshot,
  statusQueryVerdict,
  selectTierMajorStackDecision,
  type QueueState,
  type VerdictStamp,
  type WatchClock,
} from "./policy.ts";
import { renderPretty } from "./render.ts";
import type * as T from "./types.ts";
import { nonEmpty, parsePrNumber } from "./types.ts";

export type QueueCheckpoint = Omit<QueueState, "snapshots"> & {
  readonly snapshots: readonly T.PrSnapshot[];
};
export interface WatchSession {
  readonly sequence: number;
  readonly startedAt: number;
  readonly consecutiveQueryErrors: number;
  readonly retryNotBefore: number | null;
}
export type OnceTarget =
  | { readonly mode: "single"; readonly context: T.PrContext }
  | { readonly mode: "stack"; readonly contexts: T.NonEmpty<T.PrContext> }
  | {
      readonly mode: "queued-stack";
      readonly queue:
        | { readonly kind: "start"; readonly contexts: T.NonEmpty<T.PrContext> }
        | { readonly kind: "resume"; readonly checkpoint: QueueCheckpoint };
    };
export interface OnceRequest {
  readonly schemaVersion: 1;
  readonly statusOnly: boolean;
  readonly options: T.PollingOptions;
  readonly session: WatchSession;
  readonly target: OnceTarget;
}
export interface OnceReceipt {
  readonly schemaVersion: 1;
  readonly events: readonly T.WatcherVerdict[];
  readonly next: OnceRequest;
  readonly processExitCode: T.ExitCode;
  readonly limitations: readonly string[];
}
export interface OnceDependencies {
  readonly request: OnceRequest;
  readonly reader: T.GitHubReader;
  readonly clock: Pick<WatchClock, "now" | "observedAt">;
}

export const TRANSPORT_LIMITATIONS: readonly string[] = [
  "The five-error default applies to this evaluator's GitHub reads. T3's native watcher reportedly stops after eight consecutive read failures, but its counters and last successful read are not observable here.",
  "Native wakes do not guarantee polling cadence, backoff, sweep or timeout delivery. retryNotBefore and deadlines persist, but this evaluator never schedules or waits for a wake.",
  "The official GitHub reader exposes no rate-limit reset timestamp. Rate-limit command failures use the original queryBackoffSeconds policy; no reset time is inferred.",
];

class InputError extends Error {}
function invalid(path: string, detail: string): never {
  throw new InputError(`${path}: ${detail}`);
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function object(value: unknown, path: string): Record<string, unknown> {
  if (!isObject(value))
    return invalid(path, "must be an object");
  return value;
}
function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) return invalid(path, "must be an array");
  return value;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string") return invalid(path, "must be a string");
  return value;
}
function nullableText(value: unknown, path: string): string | null {
  return value === null ? null : text(value, path);
}
function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") return invalid(path, "must be a boolean");
  return value;
}
function number(value: unknown, path: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum)
    return invalid(path, `must be a finite number greater than or equal to ${minimum}`);
  return value;
}
function integer(value: unknown, path: string, minimum = 0): number {
  const parsed = number(value, path, minimum);
  if (!Number.isSafeInteger(parsed)) return invalid(path, "must be a safe integer");
  return parsed;
}
function choice<const V extends readonly string[]>(
  value: unknown,
  values: V,
  path: string
): V[number] {
  for (const candidate of values) if (candidate === value) return candidate;
  return invalid(path, `must be one of ${values.join(", ")}`);
}
function requiredRows<A>(rows: readonly A[], path: string): T.NonEmpty<A> {
  const result = nonEmpty(rows);
  if (result === null) return invalid(path, "must not be empty");
  return result;
}
function context(value: unknown, path: string): T.PrContext {
  const raw = object(value, path);
  const owner = text(raw.owner, `${path}.owner`);
  const repo = text(raw.repo, `${path}.repo`);
  if (!owner.trim() || !repo.trim()) return invalid(path, "owner and repo must not be empty");
  return { owner, repo, number: parsePrNumber(raw.number, `${path}.number`) };
}
function sameContext(a: T.PrContext, b: T.PrContext): boolean {
  return a.owner === b.owner && a.repo === b.repo && a.number === b.number;
}
function contexts(value: unknown, path: string): T.NonEmpty<T.PrContext> {
  const result = requiredRows(
    array(value, path).map((item, i) => context(item, `${path}[${i}]`)),
    path
  );
  const first = result[0];
  const seen = new Set<T.PrNumber>();
  for (const item of result) {
    if (item.owner !== first.owner || item.repo !== first.repo)
      return invalid(path, "all PRs must belong to one repository");
    if (seen.has(item.number)) return invalid(path, `duplicate PR #${item.number}`);
    seen.add(item.number);
  }
  return result;
}
function check(value: unknown, path: string): T.Check {
  const raw = object(value, path);
  const details = {
    name: text(raw.name, `${path}.name`),
    reportedState: text(raw.reportedState, `${path}.reportedState`),
    description: text(raw.description, `${path}.description`),
    link: text(raw.link, `${path}.link`),
    workflow: text(raw.workflow, `${path}.workflow`),
  };
  const kind = choice(raw.kind, ["passed", "skipped", "failed", "pending", "code-review-gate"], `${path}.kind`);
  if (kind === "code-review-gate") {
    if (details.name !== "Code Review Gate")
      return invalid(path, "code-review-gate must name Code Review Gate");
    return { ...details, kind, name: "Code Review Gate" };
  }
  return { ...details, kind };
}
function assessment(value: unknown, path: string): T.GitHubMergeAssessment {
  const raw = object(value, path);
  const mergeStateStatus = choice(raw.mergeStateStatus,
    ["BEHIND", "BLOCKED", "CLEAN", "CONFLICTING", "DIRTY", "DRAFT", "HAS_HOOKS", "UNKNOWN", "UNSTABLE"], `${path}.mergeStateStatus`);
  const headRollupState = raw.headRollupState === null ? null : choice(raw.headRollupState,
    ["ERROR", "EXPECTED", "FAILURE", "PENDING", "SUCCESS"], `${path}.headRollupState`);
  const result = assessGitHubMerge({ mergeStateStatus, headRollupState });
  if (raw.kind !== result.kind || (result.kind === "allowed" && raw.basis !== result.basis))
    return invalid(path, "does not match the official merge assessment");
  return result;
}
function ci(value: unknown, facts: T.PullRequestFacts, path: string): T.CiState {
  const raw = object(value, path);
  const all = requiredRows(array(raw.all, `${path}.all`).map((item, i) => check(item, `${path}.all[${i}]`)), `${path}.all`);
  const failed = all.filter((item): item is T.FailedCheck => item.kind === "failed");
  const pending = all.filter((item): item is T.PendingCheck => item.kind === "pending");
  for (const [key, expected] of [["failed", failed], ["pending", pending]] satisfies readonly (readonly [string, readonly T.Check[]])[]) {
    const supplied = array(raw[key], `${path}.${key}`).map((item, i) => check(item, `${path}.${key}[${i}]`));
    if (JSON.stringify(supplied) !== JSON.stringify(expected))
      return invalid(`${path}.${key}`, "must match the corresponding checks in all");
  }
  const base = {
    source: choice(raw.source, ["gh-pr-checks", "graphql-rollup"], `${path}.source`),
    all,
    hadPreviousPassingCi: boolean(raw.hadPreviousPassingCi, `${path}.hadPreviousPassingCi`),
  };
  const kind = choice(raw.kind, ["ci-pending", "ci-failing", "ci-github-rejected", "ci-clean"], `${path}.kind`);
  if (kind === "ci-pending") {
    if (failed.length !== 0) return invalid(path, "ci-pending cannot contain failed checks");
    return { ...base, kind, failed: [], pending: requiredRows(pending, `${path}.pending`) };
  }
  const github = assessment(raw.github, `${path}.github`);
  if (github.mergeStateStatus !== facts.mergeStateStatus)
    return invalid(path, "merge assessment must match the snapshot facts");
  if (kind === "ci-failing")
    return { ...base, kind, failed: requiredRows(failed, `${path}.failed`), pending, github };
  if (failed.length !== 0) return invalid(path, `${kind} cannot contain failed checks`);
  if (kind === "ci-github-rejected") {
    if (github.kind !== "refused") return invalid(path, "ci-github-rejected requires a refusal");
    return { ...base, kind, failed: [], pending, github };
  }
  if (pending.length !== 0 || github.kind !== "allowed")
    return invalid(path, "ci-clean requires no pending checks and an allowed assessment");
  return { ...base, kind, failed: [], pending: [], github };
}
function thread(value: unknown, path: string): T.ReviewThread {
  const raw = object(value, path);
  let firstComment: T.ReviewComment | null = null;
  if (raw.firstComment !== null) {
    const comment = object(raw.firstComment, `${path}.firstComment`);
    const line = comment.line;
    if (line !== null && (typeof line !== "number" || !Number.isInteger(line)))
      return invalid(`${path}.firstComment.line`, "must be an integer or null");
    firstComment = {
      authorLogin: nullableText(comment.authorLogin, `${path}.firstComment.authorLogin`),
      body: text(comment.body, `${path}.firstComment.body`),
      path: nullableText(comment.path, `${path}.firstComment.path`),
      line,
      createdAt: text(comment.createdAt, `${path}.firstComment.createdAt`),
    };
  }
  return {
    id: text(raw.id, `${path}.id`),
    firstComment,
    isBugbot: boolean(raw.isBugbot, `${path}.isBugbot`),
    bugbotReviewPasses: integer(raw.bugbotReviewPasses, `${path}.bugbotReviewPasses`),
  };
}
function snapshot(value: unknown, path: string): T.PrSnapshot {
  const raw = object(value, path);
  const parsedContext = context(raw.context, `${path}.context`);
  const rawFacts = object(raw.facts, `${path}.facts`);
  if (!sameContext(parsedContext, context(rawFacts.context, `${path}.facts.context`)))
    return invalid(path, "facts.context must match context");
  const facts = parsePullRequest(rawFacts, parsedContext);
  const kind = choice(raw.kind, ["merged", "closed", "open"], `${path}.kind`);
  const expected = facts.state === "MERGED" || facts.mergedAt !== null ? "merged" : facts.state === "CLOSED" ? "closed" : "open";
  if (kind !== expected) return invalid(path, "kind must match the snapshot facts");
  if (kind !== "open") return { kind, context: parsedContext, facts };
  return {
    kind,
    context: parsedContext,
    facts,
    threads: array(raw.threads, `${path}.threads`).map((item, i) => thread(item, `${path}.threads[${i}]`)),
    ci: ci(raw.ci, facts, `${path}.ci`),
    reviewAutomationRunning: boolean(raw.reviewAutomationRunning, `${path}.reviewAutomationRunning`),
  };
}

export function serializeQueue(state: QueueState): QueueCheckpoint {
  return { ...state, snapshots: [...state.snapshots.values()] };
}
export function restoreQueue(checkpoint: QueueCheckpoint): QueueState {
  return { ...checkpoint, snapshots: new Map(checkpoint.snapshots.map((row) => [row.context.number, row])) };
}
function checkpoint(value: unknown, path: string): QueueCheckpoint {
  const raw = object(value, path);
  const queue = contexts(raw.queue, `${path}.queue`);
  const snapshots = array(raw.snapshots, `${path}.snapshots`).map((row, i) => snapshot(row, `${path}.snapshots[${i}]`));
  const members = new Map(queue.map((pr) => [pr.number, pr]));
  const rows = new Map<T.PrNumber, T.PrSnapshot>();
  const member = (pr: T.PrContext): void => {
    const expected = members.get(pr.number);
    if (expected === undefined || !sameContext(expected, pr))
      invalid(path, `PR #${pr.number} does not match the frozen queue`);
  };
  for (const row of snapshots) {
    member(row.context);
    if (rows.has(row.context.number)) return invalid(path, `duplicate snapshot for PR #${row.context.number}`);
    rows.set(row.context.number, row);
  }
  let work: QueueState["work"] = null;
  if (raw.work !== null) {
    const rawWork = object(raw.work, `${path}.work`);
    const kind = choice(rawWork.kind, ["whole-stack-sweep", "frontier-poll"], `${path}.work.kind`);
    if (kind === "whole-stack-sweep") {
      const remaining = contexts(rawWork.remaining, `${path}.work.remaining`);
      for (const pr of remaining) member(pr);
      const headIndex = queue.findIndex((pr) => sameContext(pr, remaining[0]));
      const expected = queue.slice(headIndex).filter((pr) => rows.get(pr.number)?.kind !== "merged");
      if (expected.length !== remaining.length || expected.some((pr, i) => !sameContext(pr, remaining[i])))
        return invalid(path, "remaining sweep must preserve the frozen queue order");
      const unread = new Set(remaining.map((pr) => pr.number));
      if (queue.some((pr) => !unread.has(pr.number) && !rows.has(pr.number)))
        return invalid(path, "partial sweep is missing an already-read snapshot");
      work = { kind, remaining };
    } else {
      const frontier = context(rawWork.frontier, `${path}.work.frontier`);
      member(frontier);
      const active = queue.find((pr) => rows.get(pr.number)?.kind !== "merged");
      if (rows.size !== queue.length || active === undefined || !sameContext(active, frontier))
        return invalid(path, "frontier poll must read the first active PR after a complete sweep");
      work = { kind, frontier };
    }
  } else if (rows.size !== queue.length) {
    return invalid(path, "a queue without read work must have every snapshot");
  }
  const frontier = raw.frontier === null ? null : context(raw.frontier, `${path}.frontier`);
  if (frontier !== null) {
    member(frontier);
    if (!rows.has(frontier.number)) return invalid(path, "frontier must have a snapshot");
  }
  return {
    queue, snapshots, work, frontier,
    nextSweepAt: number(raw.nextSweepAt, `${path}.nextSweepAt`),
    lastWaitKey: nullableText(raw.lastWaitKey, `${path}.lastWaitKey`),
    startedAt: number(raw.startedAt, `${path}.startedAt`),
  };
}

export function parseOnceRequest(value: unknown): OnceRequest {
  try {
    const raw = object(value, "request");
    if (raw.schemaVersion !== 1) return invalid("schemaVersion", "must be 1");
    const rawOptions = object(raw.options, "options");
    const interval = number(rawOptions.interval === undefined ? 60 : rawOptions.interval, "options.interval");
    const sweepInterval = number(rawOptions.sweepInterval === undefined ? 300 : rawOptions.sweepInterval, "options.sweepInterval");
    if (interval === 0 || sweepInterval === 0) return invalid("options", "interval and sweepInterval must be greater than zero");
    const options: T.PollingOptions = {
      interval, sweepInterval,
      timeout: number(rawOptions.timeout === undefined ? 0 : rawOptions.timeout, "options.timeout"),
      maxQueryErrors: integer(rawOptions.maxQueryErrors === undefined ? 5 : rawOptions.maxQueryErrors, "options.maxQueryErrors", 1),
      allowDraft: boolean(rawOptions.allowDraft === undefined ? false : rawOptions.allowDraft, "options.allowDraft"),
    };
    const rawSession = object(raw.session, "session");
    const session: WatchSession = {
      sequence: integer(rawSession.sequence, "session.sequence"),
      startedAt: number(rawSession.startedAt, "session.startedAt"),
      consecutiveQueryErrors: integer(rawSession.consecutiveQueryErrors, "session.consecutiveQueryErrors"),
      retryNotBefore: rawSession.retryNotBefore === null ? null : number(rawSession.retryNotBefore, "session.retryNotBefore"),
    };
    const rawTarget = object(raw.target, "target");
    const mode = choice(rawTarget.mode, ["single", "stack", "queued-stack"], "target.mode");
    let target: OnceTarget;
    if (mode === "single") target = { mode, context: context(rawTarget.context, "target.context") };
    else if (mode === "stack") target = { mode, contexts: contexts(rawTarget.contexts, "target.contexts") };
    else {
      const queue = object(rawTarget.queue, "target.queue");
      const kind = choice(queue.kind, ["start", "resume"], "target.queue.kind");
      if (kind === "start") target = { mode, queue: { kind, contexts: contexts(queue.contexts, "target.queue.contexts") } };
      else {
        const parsed = checkpoint(queue.checkpoint, "target.queue.checkpoint");
        if (parsed.startedAt !== session.startedAt)
          return invalid("target.queue.checkpoint.startedAt", "must match session.startedAt");
        target = { mode, queue: { kind, checkpoint: parsed } };
      }
    }
    return { schemaVersion: 1, statusOnly: boolean(raw.statusOnly, "statusOnly"), options, session, target };
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError(error instanceof Error ? error.message : String(error));
  }
}

type VerdictPayload<V = T.WatcherVerdict> = V extends unknown
  ? Omit<V, "schemaVersion" | "sequence" | "observedAt" | "mode">
  : never;
type Envelope<M extends T.WatchMode> = {
  readonly schemaVersion: 1;
  readonly sequence: number;
  readonly observedAt: string;
  readonly mode: M;
};
function blockerVerdict(stamp: VerdictStamp, blocker: T.MergeBlocker): T.BlockerVerdict {
  switch (blocker.kind) {
    case "merge-conflicts": return stamp({ kind: "BLOCKER", terminal: true, exitCode: 2, blocker });
    case "review-threads": return stamp({ kind: "BLOCKER", terminal: true, exitCode: 3, blocker });
    case "failing-checks": return stamp({ kind: "BLOCKER", terminal: true, exitCode: 4, blocker });
    case "merge-gate": return stamp({ kind: "BLOCKER", terminal: true, exitCode: 6, blocker });
    default: { const exhaustive: never = blocker; return exhaustive; }
  }
}

export async function evaluateOnce({ request, reader, clock }: OnceDependencies): Promise<OnceReceipt> {
  let sequence = request.session.sequence;
  let failures = request.session.consecutiveQueryErrors;
  let retryNotBefore = request.session.retryNotBefore;
  const events: T.WatcherVerdict[] = [];
  const mode = request.target.mode;
  let state: QueueState | null = request.target.mode === "queued-stack" && !request.statusOnly
    ? request.target.queue.kind === "start"
      ? createQueueState(request.target.queue.contexts, request.session.startedAt)
      : restoreQueue(request.target.queue.checkpoint)
    : null;
  function stamp<const P extends VerdictPayload>(payload: P): Envelope<typeof mode> & P;
  function stamp<const P extends VerdictPayload, M extends T.WatchMode>(payload: P, override: M): Envelope<M> & P;
  function stamp<const P extends VerdictPayload>(payload: P, override?: T.WatchMode): Envelope<T.WatchMode> & P {
    return { schemaVersion: 1, sequence: ++sequence, observedAt: clock.observedAt(), mode: override ?? mode, ...payload };
  }
  const finish = (): OnceReceipt => {
    const terminal = events.findLast((event) => event.terminal);
    const target: OnceTarget = state === null ? request.target : {
      mode: "queued-stack", queue: { kind: "resume", checkpoint: serializeQueue(state) },
    };
    return {
      schemaVersion: 1, events,
      next: { ...request, target, session: { ...request.session, sequence, consecutiveQueryErrors: failures, retryNotBefore } },
      processExitCode: terminal?.terminal ? terminal.exitCode : 0,
      limitations: TRANSPORT_LIMITATIONS,
    };
  };
  const succeeded = (): void => { failures = 0; retryNotBefore = null; };
  const failed = (error: unknown): OnceReceipt => {
    if (!(error instanceof WatcherQueryError)) throw error;
    failures += 1;
    if (!error.failure.retryable || failures >= request.options.maxQueryErrors) {
      retryNotBefore = null;
      events.push(statusQueryVerdict(stamp, failures, error.failure));
    } else {
      const seconds = queryBackoffSeconds(request.options.interval, failures);
      retryNotBefore = clock.now() + seconds;
      events.push(stamp({ kind: "RETRY", terminal: false, failure: error.failure, consecutiveFailures: failures, retryInSeconds: seconds }));
      if (request.options.timeout > 0 && clock.now() - request.session.startedAt >= request.options.timeout)
        events.push(stamp({ kind: "TIMEOUT", terminal: true, exitCode: 5, reason: { kind: "status-unavailable", failure: error.failure } }));
    }
    return finish();
  };
  if (request.target.mode === "queued-stack" && request.target.queue.kind === "start" && state !== null)
    events.push(stamp({ kind: "QUEUE", terminal: false, queue: state.queue }, "queued-stack"));
  if (retryNotBefore !== null && clock.now() < retryNotBefore) return finish();

  if (state === null) {
    const target = request.target;
    const toRead: T.NonEmpty<T.PrContext> = target.mode === "single" ? [target.context]
      : target.mode === "stack" ? target.contexts
      : target.queue.kind === "start" ? target.queue.contexts : target.queue.checkpoint.queue;
    const rows: T.PrSnapshot[] = [];
    try {
      for (const pr of toRead)
        rows.push(await readSnapshot({ reader, context: pr, pendingHistory: "include", allowDraft: request.options.allowDraft }));
    } catch (error) { return failed(error); }
    succeeded();
    const complete = requiredRows(rows, "snapshot rows");
    if (request.statusOnly) {
      events.push(stamp({ kind: "STATUS", terminal: true, exitCode: 0, reason: "status-only", rows: complete }));
      return finish();
    }
    if (mode === "queued-stack") throw new Error("queued-stack requires a queue state");
    if (mode === "stack") events.push(stamp({ kind: "STATUS", terminal: false, reason: "poll", rows: complete }, mode));
    const decision = mode === "single" ? classifyPr(complete[0], request.options.allowDraft)
      : selectTierMajorStackDecision(complete, request.options.allowDraft);
    switch (decision.kind) {
      case "blocker": events.push(blockerVerdict(stamp, decision.blocker)); break;
      case "ready":
      case "merged": events.push(stamp({ kind: "READY", terminal: true, exitCode: 0, scope: { kind: "single", pr: decision.pr } }, mode)); break;
      case "clear": events.push(stamp({ kind: "READY", terminal: true, exitCode: 0, scope: { kind: "stack", prs: decision.prs } }, mode)); break;
      case "waiting":
        events.push(stamp({ kind: "WAITING", terminal: false, frontier: decision.frontier, reason: { kind: "pending-checks", pending: decision.pending } }));
        if (request.options.timeout > 0 && clock.now() - request.session.startedAt >= request.options.timeout)
          events.push(stamp({ kind: "TIMEOUT", terminal: true, exitCode: 5, reason: { kind: "pending-checks", pending: decision.pending } }));
        break;
      default: { const exhaustive: never = decision; return exhaustive; }
    }
    return finish();
  }

  // A sweep plus immediate frontier advances is finite; external changes wait for a native wake.
  const stepBudget = state.queue.length * 2;
  for (let step = 0; step < stepBudget; step += 1) {
    state = planQueue(state, clock.now());
    if (state.work !== null) {
      const pr = state.work.kind === "whole-stack-sweep" ? state.work.remaining[0] : state.work.frontier;
      let row: T.PrSnapshot;
      try {
        row = await readSnapshot({ reader, context: pr, pendingHistory: "omit", allowDraft: request.options.allowDraft });
      } catch (error) { return failed(error); }
      succeeded();
      const applied = applyQueueSnapshot(state, row, clock.now(), request.options);
      state = applied.state;
      if (applied.completedSweepRows !== null)
        events.push(stamp({ kind: "STATUS", terminal: false, reason: "whole-stack-sweep", rows: applied.completedSweepRows }, "queued-stack"));
      if (state.work !== null) continue;
    }
    const evaluation = evaluateQueue(state, clock.now(), request.options);
    state = evaluation.state;
    switch (evaluation.kind) {
      case "complete":
        events.push(stamp({ kind: "COMPLETE", terminal: true, exitCode: 0, queue: state.queue, merged: evaluation.merged }, "queued-stack"));
        return finish();
      case "blocker": events.push(blockerVerdict(stamp, evaluation.blocker)); return finish();
      case "advance":
        events.push(stamp({ kind: "ADVANCE", terminal: false, merged: evaluation.merged, frontier: evaluation.frontier, remaining: evaluation.remaining }, "queued-stack"));
        continue;
      case "timeout":
        events.push(stamp({ kind: "TIMEOUT", terminal: true, exitCode: 5, reason: { kind: "queued-stack", frontier: evaluation.frontier, unmergedCount: evaluation.unmergedCount } }));
        return finish();
      case "waiting":
        if (evaluation.emit) events.push(stamp({ kind: "WAITING", terminal: false, frontier: evaluation.frontier, reason: evaluation.reason }));
        return finish();
      default: { const exhaustive: never = evaluation; return exhaustive; }
    }
  }
  return finish();
}

export interface OnceRuntime {
  readonly reader: T.GitHubReader;
  readonly clock: Pick<WatchClock, "now" | "observedAt">;
  readonly readInput: (path: string) => Promise<string>;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}
function realRuntime(): OnceRuntime {
  return {
    reader: new GhGitHubReader(),
    clock: { now: () => Date.now() / 1_000, observedAt: () => new Date().toISOString() },
    readInput: async (path) => readFileSync(path === "-" ? 0 : path, "utf8"),
    stdout: (value) => { process.stdout.write(value); },
    stderr: (value) => { process.stderr.write(value); },
  };
}
export async function main(argv: readonly string[], runtime: OnceRuntime = realRuntime()): Promise<number> {
  let path: string | null = null;
  let pretty = false;
  let request: OnceRequest;
  try {
    for (let index = 0; index < argv.length; index += 1) {
      const arg = argv[index];
      if (arg === "--help" || arg === "-h") {
        runtime.stdout("Usage: watch-pr --input <file|-> [--pretty]\nEvaluate one bounded step and persist the JSON receipt's next request for the following native wake.\n");
        return 0;
      }
      if (arg === "--pretty") { pretty = true; continue; }
      if (arg === "--input" || arg.startsWith("--input=")) {
        if (path !== null) throw new InputError("--input may be supplied only once");
        const supplied = arg === "--input" ? argv[++index] : arg.slice("--input=".length);
        if (supplied === undefined || !supplied || (supplied !== "-" && supplied.startsWith("--")))
          throw new InputError("--input requires a file path or '-' for stdin");
        path = supplied;
        continue;
      }
      throw new InputError(`unknown argument: ${arg}`);
    }
    if (path === null) throw new InputError("--input is required");
    const input = await runtime.readInput(path);
    let decoded: unknown;
    try { decoded = JSON.parse(input); }
    catch (error) { throw new InputError(`invalid input JSON: ${error instanceof Error ? error.message : String(error)}`); }
    request = parseOnceRequest(decoded);
  } catch (error) {
    runtime.stderr(`watch-pr: ${error instanceof Error ? error.message : String(error)}\n`);
    return 64;
  }
  const receipt = await evaluateOnce({ request, reader: runtime.reader, clock: runtime.clock });
  if (pretty) {
    for (const event of receipt.events) runtime.stdout(renderPretty(event));
    if (receipt.events.length === 0) runtime.stdout("No new watcher verdict.\n");
    runtime.stderr(`${TRANSPORT_LIMITATIONS.join("\n")}\n`);
  } else runtime.stdout(`${JSON.stringify(receipt)}\n`);
  return receipt.processExitCode;
}

if (import.meta.main) process.exitCode = await main(process.argv.slice(2));
