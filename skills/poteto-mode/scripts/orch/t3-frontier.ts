import { execFileSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { GhGitHubReader } from "../watch-pr/github.ts";
import { parsePrNumber } from "../watch-pr/types.ts";
import type { FrontierPr } from "./store.ts";

export type StackSelector =
  | { readonly kind: "only-stack" }
  | { readonly kind: "anchored"; readonly pr: number };

export type FrontierSource =
  | {
      readonly kind: "parent-export";
      readonly path: string;
      readonly threadId: string;
      readonly selector: StackSelector;
    }
  | {
      readonly kind: "acp";
      readonly threadId: string;
      readonly selector: StackSelector;
    };

interface LinkedPr {
  readonly number: number;
  readonly headBranch: string | null;
  readonly baseBranch: string | null;
  readonly state: "open" | "closed" | "merged" | null;
}

interface LinkedSnapshot {
  readonly chains: readonly (readonly number[])[];
  readonly pullRequests: ReadonlyMap<number, LinkedPr>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function list(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function text(value: unknown, label: string): string {
  if (
    typeof value !== "string" || value.length === 0 ||
    value.trim() !== value || /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new Error(`${label} must be a non-empty string without control characters`);
  }
  return value;
}

function nullableText(value: unknown, label: string): string | null {
  return value === null ? null : text(value, label);
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value;
}

function json(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} contains invalid JSON`, { cause: error });
  }
}

function command(repo: string, executable: string, args: readonly string[], env = process.env): string {
  try {
    return execFileSync(executable, args, {
      cwd: repo,
      encoding: "utf8",
      env,
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(
      `${executable} ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
}

function repositoryName(value: unknown, label: string): string {
  const name = text(value, label);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name) || name.split("/").some(part => part === "." || part === "..")) {
    throw new Error(`${label} must identify owner/repository`);
  }
  return name;
}

function originRepository(repo: string): string {
  let remote = command(repo, "git", ["remote", "get-url", "origin"]).trim();
  if (remote.startsWith("git@github.com:")) {
    remote = `https://github.com/${remote.slice("git@github.com:".length)}`;
  } else if (remote.startsWith("ssh://git@github.com/")) {
    remote = `https://github.com/${remote.slice("ssh://git@github.com/".length)}`;
  }
  const url = new URL(remote);
  if (
    url.protocol !== "https:" || url.hostname !== "github.com" ||
    url.port || url.username || url.password || url.search || url.hash
  ) {
    throw new Error("origin must identify a github.com repository");
  }
  return repositoryName(url.pathname.slice(1).replace(/\.git$/, ""), "origin repository");
}

function sameRepository(actual: unknown, expected: string, label: string): void {
  if (repositoryName(actual, label).toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`${label} does not match origin repository ${expected}`);
  }
}

function prUrl(value: unknown, repository: string, number: number): void {
  const url = new URL(text(value, `PR #${number} URL`));
  if (
    url.protocol !== "https:" || url.hostname !== "github.com" ||
    url.port || url.username || url.password || url.search || url.hash ||
    url.pathname.toLowerCase() !== `/${repository}/pull/${number}`.toLowerCase()
  ) {
    throw new Error(`PR #${number} URL does not match its registered repository and number`);
  }
}

function parseSnapshot(value: unknown, repository: string): LinkedSnapshot {
  const data = record(value, "list_thread_pull_requests data");
  const pullRequests = new Map<number, LinkedPr>();
  const knownHeads = new Set<string>();
  for (const [index, value] of list(data.pullRequests, "pullRequests").entries()) {
    const row = record(value, `pullRequests[${index}]`);
    const number = positiveInteger(row.number, `pullRequests[${index}].number`);
    if (row.host !== "github.com") throw new Error(`PR #${number} has an unsupported host`);
    sameRepository(row.repository, repository, `PR #${number} repository`);
    prUrl(row.url, repository, number);
    if (pullRequests.has(number)) throw new Error(`duplicate registered PR #${number}`);
    const headBranch = nullableText(row.headBranch, `PR #${number} headBranch`);
    const baseBranch = nullableText(row.baseBranch, `PR #${number} baseBranch`);
    if (headBranch !== null) {
      if (knownHeads.has(headBranch)) throw new Error(`duplicate registered head branch ${headBranch}`);
      knownHeads.add(headBranch);
    }
    if (row.state !== null && row.state !== "open" && row.state !== "closed" && row.state !== "merged") {
      throw new Error(`PR #${number} has an invalid registered state`);
    }
    pullRequests.set(number, { number, headBranch, baseBranch, state: row.state });
  }
  const seen = new Set<number>();
  const chains = list(data.chains, "chains").map((value, index) => {
    const chain = record(value, `chains[${index}]`);
    if (chain.kind !== "native" && chain.kind !== "derived") {
      throw new Error(`chains[${index}] has an invalid kind`);
    }
    const numbers = list(chain.numbers, `chains[${index}].numbers`).map(value => {
      const number = positiveInteger(value, `chains[${index}] PR number`);
      if (seen.has(number)) throw new Error(`duplicate chain reference to PR #${number}`);
      if (!pullRequests.has(number)) throw new Error(`chain PR #${number} is not registered`);
      seen.add(number);
      return number;
    });
    if (numbers.length === 0) throw new Error(`chains[${index}] is empty; stack completeness is unproved`);
    return numbers;
  });
  if (seen.size !== pullRequests.size) {
    throw new Error("registered pull requests are missing from chains; stack completeness is unproved");
  }
  return { chains, pullRequests };
}

function selectChain(snapshot: LinkedSnapshot, selector: StackSelector): readonly LinkedPr[] {
  let selected: readonly number[];
  switch (selector.kind) {
    case "only-stack": {
      if (snapshot.chains.length === 0) return [];
      if (snapshot.chains.length !== 1) throw new Error("multiple T3 chains require an anchored PR selector");
      const [chain] = snapshot.chains;
      if (chain === undefined) throw new Error("T3 chain is missing; stack completeness is unproved");
      selected = chain;
      break;
    }
    case "anchored": {
      const anchor = positiveInteger(selector.pr, "anchor PR");
      const chain = snapshot.chains.find(numbers => numbers.includes(anchor));
      if (chain === undefined) throw new Error(`anchor PR #${anchor} does not belong to a registered chain`);
      selected = chain;
      break;
    }
    default: {
      const exhaustive: never = selector;
      throw new Error(`unsupported stack selector ${String(exhaustive)}`);
    }
  }
  return selected.map(number => {
    const row = snapshot.pullRequests.get(number);
    if (row === undefined) throw new Error(`chain PR #${number} is not registered`);
    return row;
  });
}

function unwrapMcp(value: unknown): unknown {
  const result = record(value, "ACP MCP result");
  if (result.isError !== undefined && typeof result.isError !== "boolean") {
    throw new Error("ACP MCP result has an invalid isError field");
  }
  const content = list(result.content, "ACP MCP result.content");
  if (result.isError === true) {
    const details = content.map(value => {
      const item = record(value, "ACP MCP error content");
      if (item.type !== "text") return String(item.type);
      if (typeof item.text !== "string") throw new Error("ACP MCP error text must be a string");
      return item.text;
    });
    throw new Error(`list_thread_pull_requests returned an MCP error: ${details.join("; ")}`);
  }
  if (result.structuredContent !== undefined) return result.structuredContent;
  if (content.length !== 1) throw new Error("ACP MCP result must contain exactly one JSON text block without structuredContent");
  const item = record(content[0], "ACP MCP result.content[0]");
  if (item.type !== "text") throw new Error("ACP MCP result does not contain JSON text");
  if (typeof item.text !== "string") throw new Error("ACP MCP result text must be a string");
  return json(item.text, "ACP MCP result text");
}

async function readSnapshot(args: {
  readonly repo: string;
  readonly repository: string;
  readonly generation: number;
  readonly source: FrontierSource;
}): Promise<LinkedSnapshot> {
  const { repo, repository, generation, source } = args;
  text(source.threadId, "threadId");
  switch (source.kind) {
    case "parent-export": {
      const exported = record(json(await readFile(source.path, "utf8"), "parent export"), "parent export");
      if (exported.schemaVersion !== 1 || exported.source !== "list_thread_pull_requests") {
        throw new Error("parent export must use schemaVersion 1 and source list_thread_pull_requests");
      }
      if (exported.threadId !== source.threadId) throw new Error("parent export threadId does not match the requested thread");
      const directory = text(exported.repoDirectory, "parent export repoDirectory");
      if (!isAbsolute(directory) || await realpath(directory) !== repo) {
        throw new Error("parent export repoDirectory does not match the requested repository directory");
      }
      if (exported.host !== "github.com") throw new Error("parent export has an unsupported host");
      sameRepository(exported.repository, repository, "parent export repository");
      if (exported.afterGeneration !== generation) throw new Error(`parent export afterGeneration must match current generation ${generation}`);
      const capturedAt = text(exported.capturedAt, "parent export capturedAt");
      const timestamp = Date.parse(capturedAt);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(capturedAt) || !Number.isFinite(timestamp)) {
        throw new Error("parent export capturedAt must be a UTC ISO timestamp");
      }
      const normalized = capturedAt.replace(/(?:\.(\d{1,3}))?Z$/, (_match, fraction: string | undefined) => `.${(fraction ?? "").padEnd(3, "0")}Z`);
      if (new Date(timestamp).toISOString() !== normalized) throw new Error("parent export capturedAt is not a valid calendar date");
      if (timestamp > Date.now()) throw new Error("parent export capturedAt is in the future");
      return parseSnapshot(exported.data, repository);
    }
    case "acp": {
      const node = process.env.T3_ACP_MCP_NODE;
      if (node === undefined || node.trim().length === 0) {
        throw new Error("T3_ACP_MCP_NODE is absent; no supported ACP bridge is available. Supply a parent export.");
      }
      const entrypoint = process.env.T3_ACP_MCP_ENTRYPOINT;
      const argv = [
        ...(entrypoint ? [entrypoint] : []),
        "acp-mcp-call", "list_thread_pull_requests", JSON.stringify({ threadId: source.threadId }),
      ];
      const raw = command(repo, node, argv, { ...process.env, ELECTRON_RUN_AS_NODE: "1" });
      return parseSnapshot(unwrapMcp(json(raw, "ACP bridge output")), repository);
    }
    default: {
      const exhaustive: never = source;
      throw new Error(`unsupported frontier source ${String(exhaustive)}`);
    }
  }
}

function branchSha(repo: string, branch: string): string {
  const ref = `refs/heads/${branch}`;
  command(repo, "git", ["check-ref-format", ref]);
  const sha = command(repo, "git", ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]).trim();
  if (!/^[0-9a-f]{40,64}$/i.test(sha)) throw new Error(`git rev-parse ${branch} returned an invalid SHA`);
  return sha;
}

export async function resolveT3Frontier(args: {
  readonly repo: string;
  readonly generation: number;
  readonly source: FrontierSource;
}): Promise<readonly FrontierPr[]> {
  if (!Number.isSafeInteger(args.generation) || args.generation < 0) {
    throw new Error("frontier generation must be a non-negative safe integer");
  }
  const repo = await realpath(resolve(text(args.repo, "repo directory")));
  const root = await realpath(command(repo, "git", ["rev-parse", "--show-toplevel"]).trim());
  if (root !== repo) throw new Error("repo directory must be the Git worktree root");
  const repository = originRepository(repo);
  const [owner = "", name = ""] = repository.split("/");
  const snapshot = await readSnapshot({ ...args, repo, repository });
  const selected = selectChain(snapshot, args.source.selector);
  const reader = new GhGitHubReader();
  const frontier: FrontierPr[] = [];
  const heads = new Set<string>();
  for (const row of selected) {
    const facts = await reader.pullRequest({ owner, repo: name, number: parsePrNumber(row.number) });
    const branch = text(facts.headRefName, `PR #${row.number} current headRefName`);
    const base = text(facts.baseRefName, `PR #${row.number} current baseRefName`);
    if (
      (row.headBranch !== null && row.headBranch !== branch) ||
      (row.baseBranch !== null && row.baseBranch !== base) ||
      (row.state !== null && row.state !== facts.state.toLowerCase())
    ) {
      throw new Error(`PR #${row.number} registered metadata contradicts current GitHub facts; capture a fresh T3 snapshot`);
    }
    if (heads.has(branch)) throw new Error(`duplicate current head branch ${branch}`);
    heads.add(branch);
    const head = text(facts.headRefOid, `PR #${row.number} current headRefOid`);
    if (!/^[0-9a-f]{40,64}$/i.test(head)) throw new Error(`PR #${row.number} current headRefOid is not a valid SHA`);
    const sha = branchSha(repo, branch);
    if (sha.toLowerCase() !== head.toLowerCase()) {
      throw new Error(`PR #${row.number} local branch ${branch} SHA ${sha} does not match current GitHub head ${head}`);
    }
    frontier.push({ pr: row.number, branches: branch, sha, state: facts.state });
  }
  return frontier;
}
