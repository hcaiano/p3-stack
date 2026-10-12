import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const installer = resolve('scripts/install.mjs');
function fixture() {
  const home = mkdtempSync(join(tmpdir(), 'p3-installer-test-'));
  const skills = join(home, '.agents/skills');
  for (const name of ['t3-capacity', 'unslop']) {
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
  assert.ok(plan.skills.includes('poteto-mode'));
  assert.ok(plan.skills.includes('create-verification-skill'));
  assert.ok(!plan.skills.includes('unslop'));
  assert.ok(plan.command.includes('--global'));
  assert.equal(readFileSync(join(f.skills, 'unslop/SKILL.md'), 'utf8'), 'existing skill');
});
test('foreign skills and dangling links block installation even with update requested', () => {
  const f = fixture(); symlinkSync(join(f.home, 'missing'), join(f.skills, 'poteto-mode'));
  const r = f.run('--update'); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Preserving existing poteto-mode/);
});
test('reinstallation requires explicit update and recorded ownership', () => {
  const f = fixture(); mkdirSync(join(f.skills, 'poteto-mode'));
  writeFileSync(join(f.home, '.agents/.skill-lock.json'), JSON.stringify({ skills: { 'poteto-mode': { source: 'hcaiano/p3-stack' } } }));
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
  const f = fixture(); const local = join(f.home, '.claude/skills/poteto-mode');
  mkdirSync(local, { recursive: true }); writeFileSync(join(local, 'SKILL.md'), 'private workflow');
  const r = f.run(); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Preserving existing poteto-mode/);
  assert.equal(readFileSync(join(local, 'SKILL.md'), 'utf8'), 'private workflow');
});

test('project update uses project ownership and rejects a foreign source', () => {
  const f = fixture(); const project = mkdtempSync(join(tmpdir(), 'p3-project-update-'));
  mkdirSync(join(project, '.agents/skills/poteto-mode'), { recursive: true });
  const lock = join(project, 'skills-lock.json');
  writeFileSync(lock, JSON.stringify({ skills: { 'poteto-mode': { source: 'someone/other' } } }));
  assert.notEqual(f.run('--project', project, '--update').status, 0);
  writeFileSync(lock, JSON.stringify({ skills: { 'poteto-mode': { source: 'hcaiano/p3-stack' } } }));
  const r = f.run('--project', project, '--update');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(JSON.parse(r.stdout).skills.includes('poteto-mode'));
});

test('owned canonical skill does not authorize replacement of a foreign provider directory', () => {
  const f = fixture(); const canonical = join(f.skills, 'poteto-mode');
  mkdirSync(canonical); writeFileSync(join(canonical, 'SKILL.md'), 'owned workflow');
  writeFileSync(join(f.home, '.agents/.skill-lock.json'), JSON.stringify({ skills: { 'poteto-mode': { source: 'hcaiano/p3-stack' } } }));
  const provider = join(f.home, '.claude/skills/poteto-mode');
  mkdirSync(provider, { recursive: true }); writeFileSync(join(provider, 'SKILL.md'), 'private workflow');
  const r = f.run('--update'); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Preserving provider-local/);
  assert.equal(readFileSync(join(provider, 'SKILL.md'), 'utf8'), 'private workflow');
});

test('updates accept provider symlinks pointing at the owned canonical skill', () => {
  const f = fixture(); const canonical = join(f.skills, 'poteto-mode');
  mkdirSync(canonical); writeFileSync(join(canonical, 'SKILL.md'), 'owned workflow');
  writeFileSync(join(f.home, '.agents/.skill-lock.json'), JSON.stringify({ skills: { 'poteto-mode': { source: 'hcaiano/p3-stack' } } }));
  const provider = join(f.home, '.claude/skills'); mkdirSync(provider, { recursive: true });
  symlinkSync('../../.agents/skills/poteto-mode', join(provider, 'poteto-mode'));
  const r = f.run('--update'); assert.equal(r.status, 0, r.stderr);
});

test('t3-capacity is the only hcaiano/skills dependency', () => {
  const f = fixture(); assert.equal(f.run().status, 0);
  rmSync(join(f.skills, 't3-capacity'), { recursive: true });
  const r = f.run(); assert.notEqual(r.status, 0);
  assert.match(r.stderr, /dependency t3-capacity/);
});


test('the installer rejects a presentation name that Skills CLI would silently skip', () => {
  const f = fixture();
  const source = join(f.home, 'source');
  mkdirSync(join(source, 'scripts'), { recursive: true });
  mkdirSync(join(source, 'skills/poteto-mode'), { recursive: true });
  writeFileSync(join(source, 'scripts/install.mjs'), readFileSync(installer));
  writeFileSync(join(source, 'skills/poteto-mode/SKILL.md'), '---\nname: Poteto Mode\ndescription: mode\n---\n');
  const result = spawnSync(process.execPath, [join(source, 'scripts/install.mjs'), '--dry-run'], {
    env: { ...process.env, HOME: f.home }, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Skill name must match its installation identifier: poteto-mode/);
});

test('installed help routes resolve inside the skill bundle or to public documentation', () => {
  const project = mkdtempSync(join(tmpdir(), 'p3-help-routes-'));
  const installed = join(project, '.agents/skills');
  cpSync(resolve('skills'), installed, { recursive: true, filter: path => !path.split(sep).includes('node_modules') });
  const help = join(installed, 'poteto-help/SKILL.md');
  for (const match of readFileSync(help, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const routed = resolve(dirname(help), target);
    assert.ok(routed.startsWith(installed + sep), `Help route escapes installed skills: ${target}`);
    assert.ok(existsSync(routed), `Installed help route is missing: ${target}`);
  }
});
