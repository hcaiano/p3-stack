import { existsSync, readFileSync, readdirSync, lstatSync, readlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let project;
let source = 'hcaiano/p3-stack';
let dryRun = false;
let update = false;
const input = process.argv.slice(2);
for (let i = 0; i < input.length; i++) {
  const arg = input[i];
  if (arg === '--dry-run') dryRun = true;
  else if (arg === '--update') update = true;
  else if (arg === '--project' || arg === '--source') {
    const value = input[++i];
    if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
    if (arg === '--project') project = resolve(value);
    else source = value;
  } else throw new Error(`Unknown argument: ${arg}`);
}

const scope = project ?? homedir();
const canonical = join(scope, '.agents', 'skills');
const lockPath = project ? join(project, 'skills-lock.json') : join(scope, '.agents', '.skill-lock.json');
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')).skills ?? {} : {};
const skills = [];
const preserved = [];
for (const name of readdirSync(join(root, 'skills')).sort()) {
  if (!existsSync(join(root, 'skills', name, 'SKILL.md'))) continue;
  const destinations = ['.agents/skills', '.claude/skills', '.grok/skills']
    .map(dir => join(scope, dir, name));
  const present = destinations.filter(destination => {
    try { lstatSync(destination); return true; } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      return false;
    }
  });
  if (present.length) {
    if (name === 'unslop' && existsSync(join(canonical, name, 'SKILL.md'))) {
      preserved.push(name);
      continue;
    }
    if (!update || lock[name]?.source !== 'hcaiano/p3-stack') {
      throw new Error(`Preserving existing ${name}. Only this fork's skills may be replaced with --update.`);
    }
    for (const destination of present) {
      if (destination === join(canonical, name)) continue;
      if (!lstatSync(destination).isSymbolicLink() ||
          resolve(dirname(destination), readlinkSync(destination)) !== join(canonical, name)) {
        throw new Error(`Preserving provider-local ${destination}; it is not a link to this fork's canonical skill.`);
      }
    }
  }
  skills.push(name);
}
for (const name of ['t3-capacity']) {
  if (![canonical, join(homedir(), '.agents', 'skills')].some(p => existsSync(join(p, name, 'SKILL.md')))) {
    throw new Error(`Install the existing hcaiano/skills dependency ${name} with the Skills CLI first.`);
  }
}
const args = ['skills@latest', 'add', source, ...(project ? [] : ['--global']),
  '--agent', 'claude-code', 'codex', 'cursor', 'grok', '--skill', ...skills, '--yes'];
console.log(JSON.stringify({ scope, source, skills, preserved, command: ['npx', ...args] }, null, 2));
if (!dryRun && skills.length) {
  const result = spawnSync('npx', args, { cwd: project ?? root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
