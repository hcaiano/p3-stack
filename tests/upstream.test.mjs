import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const script = resolve('scripts/upstream.mjs');
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
  '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(reviewed = true) {
  const dir = mkdtempSync(join(tmpdir(), 'p3-upstream-test-'));
  const repo = join(dir, 'official'); mkdirSync(repo); git(repo, 'init', '-b', 'main');
  mkdirSync(join(repo, 'pstack/skills'), { recursive: true });
  writeFileSync(join(repo, 'pstack/skills/change.md'), 'original\n');
  writeFileSync(join(repo, 'pstack/skills/remove.md'), 'remove later\n');
  git(repo, 'add', '.'); git(repo, 'commit', '-m', 'baseline');
  const sha = git(repo, 'rev-parse', 'HEAD');
  const configPath = join(dir, 'sources.json');
  const source = { id: 'official', url: repo, branch: 'main', path: 'pstack', observedCommit: sha, reviewedCommit: reviewed ? sha : null };
  const config = { sources: [source] };
  const save = () => writeFileSync(configPath, JSON.stringify(config)); save();
  const output = join(dir, 'report');
  const run = () => {
    const process = spawnSync('node', [script, '--config', configPath, '--output', output], { encoding: 'utf8' });
    return { process, report: JSON.parse(readFileSync(join(output, 'report.json'), 'utf8')) };
  };
  return { dir, repo, sha, source, config, configPath, save, output, run };
}
test('an unknown import baseline requires audit even when the observed official tree has no updates', () => {
  const f = fixture(false); const before = readFileSync(f.configPath, 'utf8');
  const { process, report } = f.run(); assert.equal(process.status, 0, process.stderr);
  assert.equal(report.needsIntegration, true);
  assert.equal(report.sources[0].status, 'initial-audit-required');
  assert.deepEqual(report.sources[0].files, []);
  assert.equal(readFileSync(f.configPath, 'utf8'), before);
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
});
test('changes outside pstack do not trigger an update or change its fingerprint', () => {
  const f = fixture(); const before = f.run().report;
  writeFileSync(join(f.repo, 'another-plugin.md'), 'unrelated\n');
  git(f.repo, 'add', '.'); git(f.repo, 'commit', '-m', 'other plugin');
  const { process, report } = f.run(); assert.equal(process.status, 0, process.stderr);
  assert.equal(report.sources[0].status, 'current'); assert.equal(report.needsIntegration, false);
  assert.equal(report.fingerprint, before.fingerprint);
  assert.notEqual(report.sources[0].latestCommit, f.sha);
});
test('review package includes additions, edits and deletions and its patch reproduces the upstream delta', () => {
  const f = fixture(); writeFileSync(join(f.repo, 'pstack/skills/change.md'), 'updated\n');
  writeFileSync(join(f.repo, 'pstack/skills/new.md'), 'new\n'); unlinkSync(join(f.repo, 'pstack/skills/remove.md'));
  git(f.repo, 'add', '.'); git(f.repo, 'commit', '-m', 'update skills');
  const { process, report } = f.run(); assert.equal(process.status, 0, process.stderr);
  assert.deepEqual(report.sources[0].files, [
    { status: 'M', path: 'skills/change.md' }, { status: 'A', path: 'skills/new.md' }, { status: 'D', path: 'skills/remove.md' },
  ]);
  const patch = join(f.output, 'official.patch');
  // Reverse on a disposable checkout proves the generated patch really corresponds to those source files.
  git(f.repo, 'apply', '--reverse', '--directory=pstack', patch);
  assert.equal(readFileSync(join(f.repo, 'pstack/skills/change.md'), 'utf8'), 'original\n');
  assert.equal(readFileSync(join(f.repo, 'pstack/skills/remove.md'), 'utf8'), 'remove later\n');
  git(f.repo, 'add', '-A', 'pstack');
  assert.equal(git(f.repo, 'diff', '--cached', f.sha, '--', 'pstack'), '');
});
test('unavailable sources produce a partial failure, never a current result', () => {
  const f = fixture(); f.config.sources.push({ ...f.source, id: 'unavailable', url: join(f.dir, 'missing') }); f.save();
  const { process, report } = f.run(); assert.equal(process.status, 1);
  assert.equal(report.complete, false); assert.equal(report.sources[0].status, 'current');
  assert.equal(report.sources[1].status, 'error');
});
test('a removed official subtree is reported as a source error', () => {
  const f = fixture(); unlinkSync(join(f.repo, 'pstack/skills/change.md')); unlinkSync(join(f.repo, 'pstack/skills/remove.md'));
  writeFileSync(join(f.repo, 'remaining.md'), 'repo still exists\n'); git(f.repo, 'add', '.'); git(f.repo, 'commit', '-m', 'remove plugin');
  const { process, report } = f.run(); assert.equal(process.status, 1);
  assert.equal(report.sources[0].status, 'error');
});
