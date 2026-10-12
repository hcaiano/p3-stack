import { afterEach, expect, it } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directories: string[] = [];
const script = join(import.meta.dir, "t3-thread-activity.ts");
const audit = join(import.meta.dir, "worktree-audit.sh");

afterEach(() => {
  for (const directory of directories.splice(0)) {
    expect(Bun.spawnSync(["trash", directory]).exitCode).toBe(0);
  }
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "p3-activity-"));
  directories.push(directory);
  const repo = join(directory, "repo");
  const bin = join(directory, "bin");
  await mkdir(repo);
  await mkdir(bin);
  const command = (...args: string[]) => {
    const result = Bun.spawnSync(["git", "-C", repo, ...args]);
    expect(result.exitCode).toBe(0);
    return result.stdout.toString().trim();
  };
  command("init", "-b", "main");
  command("config", "user.name", "Fixture");
  command("config", "user.email", "fixture@example.invalid");
  await writeFile(join(repo, "tracked.txt"), "initial\n");
  command("add", ".");
  command("commit", "-m", "initial");
  const worktree = join(directory, "x");
  command("worktree", "add", "--detach", worktree);
  await writeFile(join(bin, "gh"), "#!/usr/bin/env bash\nprintf '[]'\n", {mode:0o755});
  const snapshot = join(directory, "activity.json");
  const save = async (text: string, ageHours: number, complete = true, laterActivityAgeHours?: number) => {
    const latest = new Date(Date.now() - ageHours * 3600000).toISOString();
    const later = laterActivityAgeHours === undefined ? null : new Date(Date.now() - laterActivityAgeHours * 3600000).toISOString();
    await writeFile(snapshot, JSON.stringify({
      schemaVersion: 1, repoDirectory: repo, capturedAt: new Date().toISOString(),
      inventory: {kind:"complete", projectIds:["project"], threadIds:["thread"]},
      threads: [{threadId:"thread",projectId:"project",worktreePath:worktree,history:{
        kind: complete ? "complete" : "incomplete", ...(complete ? {} : {reason:"missing page"}),
        items:[{id:"one",createdAtISO:latest,text,kind:"activity"},...(later === null ? [] : [{id:"two",createdAtISO:later,text:"Verification completed elsewhere.",kind:"activity"}])],
      }}],
    }));
    return later ?? latest;
  };
  const read = () => Bun.spawnSync([process.execPath, script,"--snapshot",snapshot,"--repo",repo,"--worktree",worktree]);
  const report = () => Bun.spawnSync(["bash",audit,"--thread-activity",snapshot,"-b","main",repo], {env:{...process.env,PATH:`${bin}:${process.env.PATH}`}});
  return {repo,worktree,snapshot,save,read,report};
}

it("matches operated paths at boundaries and requires full history before declaring no activity", async () => {
  const f = await fixture();
  const latest = await f.save(`git -C "${f.worktree}/" status`,2,true,1);
  let result = f.read();
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toEqual({kind:"observed",lastActivity:latest,threadIds:["thread"]});
  await f.save(`git -C "${f.worktree}-r37/" status`,1);
  result = f.read();
  expect(JSON.parse(result.stdout.toString())).toEqual({kind:"no-history"});
  await f.save(`git -C "${f.worktree}/" status`,1,false);
  result = f.read();
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toMatchObject({kind:"unknown"});
});

it("keeps detached inventory, the original four-day floor and unknown evidence in review", async () => {
  const f = await fixture();
  await f.save(`git -C "${f.worktree}/" status`,119);
  let result = f.report();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain(`\tdetached\t-\t`);
  expect(result.stdout.toString()).toContain(`\tverify-recent-chat\t${f.worktree}`);
  await f.save(`git -C "${f.worktree}/" status`,120);
  result = f.report();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain(`\tsafe\t${f.worktree}`);
  await f.save(`git -C "${f.worktree}/" status`,1,false);
  result = f.report();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain(`\t?\treview\t${f.worktree}`);
});

it("returns failure for an invalid activity boundary instead of a successful prune report", async () => {
  const f = await fixture();
  await writeFile(f.snapshot, '{"schemaVersion":99}');
  expect(f.read().exitCode).toBe(2);
  expect(f.report().exitCode).toBe(2);
});
