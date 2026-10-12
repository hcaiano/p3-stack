import { expect, it } from "bun:test";
import { evaluateOnce, parseOnceRequest, type OnceRequest } from "./once.ts";
import { fakeReader, passingCheck, pendingCheck } from "./fakes.test-helper.ts";
import { WatcherQueryError } from "./github.ts";
import { parsePrNumber, type GitHubReader, type PrContext } from "./types.ts";

const context = (number: number): PrContext => ({owner:"owner",repo:"repo",number:parsePrNumber(number)});
const initial = (target: OnceRequest["target"] = {mode:"single",context:context(1)}): OnceRequest => ({
  schemaVersion:1, statusOnly:false,
  options:{interval:60,sweepInterval:300,timeout:0,maxQueryErrors:5,allowDraft:false},
  session:{sequence:0,startedAt:1000,consecutiveQueryErrors:0,retryNotBefore:null}, target,
});
const clock = (now = 1000) => ({now:()=>now,observedAt:()=>new Date(now*1000).toISOString()});

it("reports READY only for actual readiness and preserves status-only as STATUS", async () => {
  const request = initial();
  const ready = await evaluateOnce({request,reader:fakeReader(),clock:clock()});
  expect(ready.events.map(event=>event.kind)).toEqual(["READY"]);
  expect(ready.processExitCode).toBe(0);
  const status = await evaluateOnce({request:{...request,statusOnly:true},reader:fakeReader({fastPath:{kind:"checks",checks:[pendingCheck()]}}),clock:clock()});
  expect(status.events.map(event=>event.kind)).toEqual(["STATUS"]);
  expect(status.processExitCode).toBe(0);
});

it("retains five consecutive query errors across real JSON continuations and resets after success", async () => {
  const good = fakeReader();
  const broken: GitHubReader = {...good,async pullRequest(){throw new WatcherQueryError({kind:"command-exit",retryable:true,detail:"offline",code:1});}};
  let request = initial();
  for (let i=1;i<=5;i++) {
    const receipt = await evaluateOnce({request,reader:broken,clock:clock(request.session.retryNotBefore ?? 1000)});
    expect(receipt.next.session.consecutiveQueryErrors).toBe(i);
    expect(receipt.processExitCode).toBe(i===5 ? 7 : 0);
    request = parseOnceRequest(JSON.parse(JSON.stringify(receipt.next)));
  }
  const reset = await evaluateOnce({request,reader:good,clock:clock(10000)});
  expect(reset.events.map(event=>event.kind)).toEqual(["READY"]);
  expect(reset.next.session.consecutiveQueryErrors).toBe(0);
});

it("refuses an empty checks fallback and a previous-head passing rollup as readiness", async () => {
  const empty = await evaluateOnce({request:initial(),reader:fakeReader({fastPath:{kind:"checks",checks:[]}}),clock:clock()});
  expect(empty.events.map(event=>event.kind)).toEqual(["RETRY"]);
  const stale = await evaluateOnce({request:initial(),reader:fakeReader({facts:{mergeStateStatus:"BLOCKED"},fastPath:{kind:"checks",checks:[passingCheck()]},commitRollups:[{oid:"old-head",state:"SUCCESS"},{oid:"head",state:"FAILURE"}]}),clock:clock()});
  expect(stale.events.at(-1)).toMatchObject({kind:"BLOCKER",blocker:{kind:"failing-checks"}});
  expect(stale.processExitCode).toBe(4);
});

it("freezes a queued stack across wakes and advances only after the current frontier merges", async () => {
  let merged = false;
  const base = fakeReader({fastPath:{kind:"checks",checks:[pendingCheck()]}});
  const reader: GitHubReader = {...base,async pullRequest(pr){
    const facts = await base.pullRequest(pr);
    return pr.number===1 && merged ? {...facts,state:"MERGED",mergedAt:"2026-10-12T12:00:00Z"} : facts;
  }};
  const first = await evaluateOnce({request:initial({mode:"queued-stack",queue:{kind:"start",contexts:[context(1),context(2)]}}),reader,clock:clock()});
  expect(first.events.at(-1)).toMatchObject({kind:"WAITING",frontier:context(1)});
  const request = parseOnceRequest(JSON.parse(JSON.stringify(first.next)));
  merged = true;
  const second = await evaluateOnce({request,reader,clock:clock(1400)});
  expect(second.events.some(event=>event.kind==="ADVANCE")).toBe(true);
  expect(second.events.at(-1)).toMatchObject({kind:"WAITING",frontier:context(2)});
  const target = second.next.target;
  expect(target.mode).toBe("queued-stack");
  if(target.mode!=="queued-stack" || target.queue.kind!=="resume") throw new Error("expected queue checkpoint");
  expect(target.queue.checkpoint.queue).toEqual([context(1),context(2)]);
});

it("the public launcher prints a bounded JSON receipt and rejects invalid stdin with source usage exit", () => {
  const request = {...initial(),session:{sequence:0,startedAt:Date.now()/1000,consecutiveQueryErrors:0,retryNotBefore:Date.now()/1000+300}};
  const result = Bun.spawnSync([process.execPath,`${import.meta.dir}/watch-pr`,"--input","-"],{stdin:Buffer.from(JSON.stringify(request))});
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toMatchObject({schemaVersion:1,events:[],processExitCode:0});
  const invalid = Bun.spawnSync([process.execPath,`${import.meta.dir}/watch-pr`,"--input","-"],{stdin:Buffer.from('{"schemaVersion":99}')});
  expect(invalid.exitCode).toBe(64);
  expect(invalid.stdout.toString()).toBe("");
});
