import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const installer = resolve('scripts/install.mjs');
function fixture() {
  const home = mkdtempSync(join(tmpdir(), 'p3-installer-test-'));
  const skills = join(home, '.agents/skills');
  for (const name of ['pair', 't3-capacity', 'unslop']) {
    mkdirSync(join(skills, name), { recursive: true });
    writeFileSync(join(skills, name, 'SKILL.md'), 'existing skill');
  }
  return { home, skills, run: (...args) => spawnSync(process.execPath,
    [installer, '--dry-run', ...args], { env: { ...process.env, HOME: home }, encoding: 'utf8' }) };
}
test('global plan preserves upstream unslop and installs the full remaining suite through Skills CLI', () => {
  const f = fixture(); const r = f.run(); assert.equal(r.status, 0, r.stderr);
  const plan = JSON.parse(r.stdout);
  assert.equal(plan.scope, f.home);
  assert.deepEqual(plan.preserved, ['unslop']);
  assert.ok(plan.skills.includes('p3-mode'));
  assert.ok(plan.skills.includes('create-verification-skill'));
  assert.ok(!plan.skills.includes('unslop'));
  assert.ok(plan.command.includes('--global'));
  assert.equal(readFileSync(join(f.skills, 'unslop/SKILL.md'), 'utf8'), 'existing skill');
});
test('foreign skills and dangling links block installation even with update requested', () => {
  const f = fixture(); symlinkSync(join(f.home, 'missing'), join(f.skills, 'p3-mode'));
  const r = f.run('--update'); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Preserving existing p3-mode/);
});
test('reinstallation requires explicit update and recorded ownership', () => {
  const f = fixture(); mkdirSync(join(f.skills, 'p3-mode'));
  writeFileSync(join(f.home, '.agents/.skill-lock.json'), JSON.stringify({ skills: { 'p3-mode': { source: 'hcaiano/p3-stack' } } }));
  assert.notEqual(f.run().status, 0);
  assert.equal(f.run('--update').status, 0);
});
test('project installation uses project scope and retains the source as one argument', () => {
  const f = fixture(); const project = mkdtempSync(join(tmpdir(), 'p3 project-'));
  const source = 'https://github.com/hcaiano/p3-stack/tree/feat/global-t3-accounts';
  const r = f.run('--project', project, '--source', source);
  assert.equal(r.status, 0, r.stderr);
  const plan = JSON.parse(r.stdout);
  assert.equal(plan.scope, project); assert.ok(!plan.command.includes('--global'));
  assert.equal(plan.command[3], source);
});

test('a provider-local skill is preserved even without a canonical copy', () => {
  const f = fixture(); const local = join(f.home, '.claude/skills/p3-mode');
  mkdirSync(local, { recursive: true }); writeFileSync(join(local, 'SKILL.md'), 'private workflow');
  const r = f.run(); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Preserving existing p3-mode/);
  assert.equal(readFileSync(join(local, 'SKILL.md'), 'utf8'), 'private workflow');
});

test('project update uses project ownership and rejects a foreign source', () => {
  const f = fixture(); const project = mkdtempSync(join(tmpdir(), 'p3-project-update-'));
  mkdirSync(join(project, '.agents/skills/p3-mode'), { recursive: true });
  const lock = join(project, 'skills-lock.json');
  writeFileSync(lock, JSON.stringify({ skills: { 'p3-mode': { source: 'someone/other' } } }));
  assert.notEqual(f.run('--project', project, '--update').status, 0);
  writeFileSync(lock, JSON.stringify({ skills: { 'p3-mode': { source: 'hcaiano/p3-stack' } } }));
  const r = f.run('--project', project, '--update');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(JSON.parse(r.stdout).skills.includes('p3-mode'));
});
