import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface RecoveredActivityItem {
  readonly id: string;
  readonly createdAtISO: string;
  readonly text: string;
  readonly kind: "activity" | "metadata";
}

export type HistoryCoverage =
  | { readonly kind: "complete"; readonly items: readonly RecoveredActivityItem[] }
  | {
      readonly kind: "incomplete";
      readonly items: readonly RecoveredActivityItem[];
      readonly reason: string;
    };

export interface ThreadActivityExport {
  readonly schemaVersion: 1;
  readonly repoDirectory: string;
  readonly capturedAt: string;
  readonly inventory:
    | {
        readonly kind: "complete";
        readonly projectIds: readonly string[];
        readonly threadIds: readonly string[];
      }
    | { readonly kind: "incomplete"; readonly reason: string };
  readonly threads: readonly {
    readonly threadId: string;
    readonly projectId: string;
    readonly worktreePath: string | null;
    readonly history: HistoryCoverage;
  }[];
}

export type WorktreeActivity =
  | {
      readonly kind: "observed";
      readonly lastActivity: string;
      readonly threadIds: readonly string[];
    }
  | { readonly kind: "no-history" }
  | { readonly kind: "unknown"; readonly reason: string };

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return { ...value };
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "" || value.includes("\0")) {
    throw new Error(`${label} must be a non-empty string without NUL`);
  }
  return value;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function uniqueStrings(value: unknown, label: string): readonly string[] {
  const values = array(value, label).map((entry) => string(entry, label));
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} contains duplicate IDs`);
  }
  return values;
}

function timestamp(value: unknown, label: string, ceiling: number): string {
  const text = string(value, label);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(text);
  if (!match) throw new Error(`${label} must be an ISO timestamp with a timezone`);
  const milliseconds = Date.parse(text);
  const local = Date.parse(`${match[1]}T${match[2]}.${(match[3] ?? "").padEnd(3, "0")}Z`);
  if (
    !Number.isFinite(milliseconds) || !Number.isFinite(local) ||
    new Date(local).toISOString().slice(0, 19) !== `${match[1]}T${match[2]}`
  ) {
    throw new Error(`${label} is not a valid calendar timestamp`);
  }
  if (milliseconds < 0 || milliseconds > ceiling) {
    throw new Error(`${label} must be between the Unix epoch and its capture time`);
  }
  return new Date(milliseconds).toISOString();
}

function coverageGap(row: Record<string, unknown>, label: string): string | null {
  let reason: string | null = null;
  for (const key of ["hasMore", "truncated", "textTruncated", "textRecovered", "textComplete"]) {
    if (row[key] === undefined) continue;
    if (typeof row[key] !== "boolean") throw new Error(`${label}.${key} must be boolean`);
    const incomplete = key === "textRecovered" || key === "textComplete" ? row[key] === false : row[key] === true;
    if (incomplete) reason ??= `${label}.${key} indicates incomplete coverage`;
  }
  if (row.nextCursor !== undefined && row.nextCursor !== null) {
    string(row.nextCursor, `${label}.nextCursor`);
    reason ??= `${label} still has a pagination cursor`;
  }
  return reason;
}

function parseSnapshot(args: {
  readonly value: unknown;
  readonly repoDirectory?: string;
  readonly now: number;
}): ThreadActivityExport {
  if (!Number.isFinite(args.now) || args.now < 0) throw new Error("now must be a valid epoch millisecond timestamp");
  const row = object(args.value, "snapshot");
  if (row.schemaVersion !== 1) throw new Error("snapshot.schemaVersion must be 1");
  const repoDirectory = resolve(string(row.repoDirectory, "snapshot.repoDirectory"));
  if (args.repoDirectory !== undefined && repoDirectory !== resolve(string(args.repoDirectory, "repoDirectory"))) {
    throw new Error("snapshot belongs to a different repository");
  }
  const capturedAt = timestamp(row.capturedAt, "snapshot.capturedAt", args.now);
  const captured = Date.parse(capturedAt);
  const inventoryRow = object(row.inventory, "snapshot.inventory");
  const declaredInventoryGap = coverageGap(inventoryRow, "snapshot.inventory");
  const snapshotGap = coverageGap(row, "snapshot");
  const inventoryGap = declaredInventoryGap ?? snapshotGap;
  let inventory: ThreadActivityExport["inventory"];
  switch (inventoryRow.kind) {
    case "complete": {
      const projectIds = uniqueStrings(inventoryRow.projectIds, "inventory.projectIds");
      const threadIds = uniqueStrings(inventoryRow.threadIds, "inventory.threadIds");
      inventory = inventoryGap === null
        ? { kind: "complete", projectIds, threadIds }
        : { kind: "incomplete", reason: inventoryGap };
      break;
    }
    case "incomplete":
      inventory = { kind: "incomplete", reason: string(inventoryRow.reason, "inventory.reason") };
      break;
    default:
      throw new Error("inventory.kind must be complete or incomplete");
  }

  const threadIds = new Set<string>();
  const threads = array(row.threads, "snapshot.threads").map((value, index) => {
    const label = `threads[${index}]`;
    const thread = object(value, label);
    const threadId = string(thread.threadId, `${label}.threadId`);
    if (threadIds.has(threadId)) throw new Error(`duplicate thread ID ${threadId}`);
    threadIds.add(threadId);
    const projectId = string(thread.projectId, `${label}.projectId`);
    const worktreePath = thread.worktreePath === null
      ? null
      : resolve(string(thread.worktreePath, `${label}.worktreePath`));
    const history = object(thread.history, `${label}.history`);
    if (history.kind !== "complete" && history.kind !== "incomplete") {
      throw new Error(`${label}.history.kind must be complete or incomplete`);
    }
    let reason = history.kind === "incomplete" ? string(history.reason, `${label}.history.reason`) : null;
    const historyGap = coverageGap(history, `${label}.history`);
    const threadGap = coverageGap(thread, label);
    reason ??= historyGap ?? threadGap;
    const itemIds = new Set<string>();
    const items = array(history.items, `${label}.history.items`).map((value, itemIndex): RecoveredActivityItem => {
      const itemLabel = `${label}.history.items[${itemIndex}]`;
      const item = object(value, itemLabel);
      const id = string(item.id, `${itemLabel}.id`);
      if (itemIds.has(id)) throw new Error(`${label} has duplicate item ID ${id}`);
      itemIds.add(id);
      const createdAtISO = timestamp(item.createdAtISO, `${itemLabel}.createdAtISO`, captured);
      if (typeof item.text !== "string") throw new Error(`${itemLabel}.text must be a string`);
      if (item.kind !== "activity" && item.kind !== "metadata") {
        throw new Error(`${itemLabel}.kind must be activity or metadata`);
      }
      const itemGap = coverageGap(item, itemLabel);
      reason ??= itemGap;
      return { id, createdAtISO, text: item.text, kind: item.kind };
    });
    const coverage: HistoryCoverage = reason === null
      ? { kind: "complete", items }
      : { kind: "incomplete", items, reason };
    return { threadId, projectId, worktreePath, history: coverage };
  });

  if (inventoryRow.kind === "complete") {
    const projects = new Set(uniqueStrings(inventoryRow.projectIds, "inventory.projectIds"));
    const declaredThreads = new Set(uniqueStrings(inventoryRow.threadIds, "inventory.threadIds"));
    for (const thread of threads) {
      if (!projects.has(thread.projectId)) throw new Error(`thread ${thread.threadId} belongs to an unlisted project`);
      if (!declaredThreads.has(thread.threadId)) throw new Error(`thread ${thread.threadId} is absent from the inventory`);
    }
    const missing = [...declaredThreads].filter((id) => !threadIds.has(id));
    if (missing.length > 0) {
      inventory = { kind: "incomplete", reason: `histories are missing for threads: ${missing.join(", ")}` };
    }
  }
  return { schemaVersion: 1, repoDirectory, capturedAt, inventory, threads };
}

function mentionsPath(text: string, path: string): boolean {
  let start = 0;
  while (start < text.length) {
    const index = text.indexOf(path, start);
    if (index < 0) return false;
    const after = text.charAt(index + path.length);
    if (after === "/" || after === '"' || after === "'") return true;
    start = index + path.length;
  }
  return false;
}

export function activityForWorktree(args: {
  readonly snapshot: unknown;
  readonly worktreePath: string;
  readonly repoDirectory?: string;
  readonly now?: number;
}): WorktreeActivity {
  const path = resolve(string(args.worktreePath, "worktreePath"));
  const snapshot = parseSnapshot({ value: args.snapshot, repoDirectory: args.repoDirectory, now: args.now ?? Date.now() });
  if (snapshot.inventory.kind === "incomplete") {
    return { kind: "unknown", reason: snapshot.inventory.reason };
  }
  for (const thread of snapshot.threads) {
    if (thread.history.kind === "incomplete") return { kind: "unknown", reason: `${thread.threadId}: ${thread.history.reason}` };
  }
  const threadIds: string[] = [];
  let lastActivity: string | null = null;
  for (const thread of snapshot.threads) {
    const activities = thread.history.items.filter((item) => item.kind === "activity" && item.text.trim() !== "");
    if (!activities.some((item) => mentionsPath(item.text, path))) continue;
    threadIds.push(thread.threadId);
    for (const item of activities) {
      if (lastActivity === null || Date.parse(item.createdAtISO) > Date.parse(lastActivity)) lastActivity = item.createdAtISO;
    }
  }
  return lastActivity === null
    ? { kind: "no-history" }
    : { kind: "observed", lastActivity, threadIds: threadIds.sort() };
}

export async function main(argv: readonly string[]): Promise<number> {
  try {
    const flags = new Map<string, string>();
    for (let index = 0; index < argv.length; index += 2) {
      const flag = argv[index];
      const value = argv[index + 1];
      if (flag !== "--snapshot" && flag !== "--repo" && flag !== "--worktree") {
        throw new Error(`unknown argument ${flag ?? ""}`);
      }
      if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a path`);
      if (flags.has(flag)) throw new Error(`duplicate argument ${flag}`);
      flags.set(flag, string(value, flag));
    }
    const snapshotPath = string(flags.get("--snapshot"), "--snapshot");
    const repoDirectory = string(flags.get("--repo"), "--repo");
    const worktreePath = string(flags.get("--worktree"), "--worktree");
    const snapshot: unknown = JSON.parse(await readFile(snapshotPath, "utf8"));
    const verdict = activityForWorktree({ snapshot, repoDirectory, worktreePath });
    process.stdout.write(`${JSON.stringify(verdict)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`t3-thread-activity: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (import.meta.main) process.exitCode = await main(process.argv.slice(2));
