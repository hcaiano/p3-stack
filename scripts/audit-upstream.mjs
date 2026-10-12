import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Git audit failed');
  return result.stdout;
};
const checkoutGit = resolve(root, git('rev-parse', '--git-dir').trim());
const reportPath = resolve(process.argv[2] ?? join(checkoutGit, 'p3-upstream', 'report.json'));
const output = resolve(process.argv[3] ?? join(checkoutGit, 'p3-upstream', 'audit'));
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const source = report.sources.find(item => item.id === 'official');
if (!report.complete || !source || source.url !== 'https://github.com/cursor/plugins.git' ||
    source.path !== 'pstack' || !/^[a-f0-9]{40}$/.test(source.latestCommit)) {
  throw new Error('A complete official-only report is required');
}
const readSource = path => git(`--git-dir=${source.cache}`, 'show', `${source.latestCommit}:pstack/${path}`);
const inventory = git(`--git-dir=${source.cache}`, 'ls-tree', '-r', `${source.latestCommit}:pstack`);
const rows = [];
mkdirSync(output, { recursive: true });
for (const line of inventory.trim().split('\n')) {
  const [entry, path] = line.split('\t');
  const blob = entry.split(' ')[2];
  let target = path.startsWith('agents/') ? `skills/poteto-mode/references/${path.slice(7)}` : path;
  let disposition = 'compare';
  if (path.startsWith('skills/unslop/')) disposition = 'separate-skills-cli-update';
  else if (path.startsWith('automations/benny/')) disposition = 'unresolved-automation-port';
  else if (path.startsWith('assets/') || path.endsWith('plugin.json')) {
    disposition = 'vendor-packaging';
  }
  const local = join(root, target);
  const present = existsSync(local);
  if (present && path.startsWith('docs/guide/')) {
    const bundled = join(root, 'skills/poteto-help/references/guide', path.slice('docs/guide/'.length));
    const content = readFileSync(local);
    const expected = path.endsWith('.md') ? Buffer.from(content.toString('utf8')
      .replaceAll('../../skills/', '../../../')
      .replaceAll('../../automations/', 'https://github.com/hcaiano/p3-stack/blob/main/automations/')
      .replaceAll('../../README.md', 'https://github.com/hcaiano/p3-stack/blob/main/README.md')
      .replaceAll('../default-mode.md', 'https://github.com/hcaiano/p3-stack/blob/main/docs/default-mode.md')) : content;
    if (!existsSync(bundled) || !readFileSync(bundled).equals(expected)) {
      throw new Error(`Bundled guide must preserve ${path}`);
    }
  }
  const hash = present ? createHash('sha256').update(readFileSync(local)).digest('hex') : null;
  let diffPath = null;
  if (present && (path.endsWith('.md') || path.endsWith('.mjs') || path.endsWith('.ts') || path.endsWith('.sh'))) {
    const official = join(output, 'official', path);
    mkdirSync(dirname(official), { recursive: true });
    writeFileSync(official, readSource(path));
    const diff = spawnSync('git', ['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--', official, local], { encoding: 'utf8' });
    if (diff.status !== 0 && diff.status !== 1) throw new Error(diff.stderr || 'Source comparison failed');
    diffPath = join(output, 'diffs', `${path}.diff`);
    mkdirSync(dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, diff.stdout);
  }
  rows.push({ source: path, blob, target, disposition, present, sha256: hash, diffPath });
}
const audit = { officialCommit: source.latestCommit, fingerprint: report.fingerprint,
  reviewedCommit: source.reviewedCommit, files: rows };
writeFileSync(join(output, 'inventory.json'), `${JSON.stringify(audit, null, 2)}\n`);
writeFileSync(join(output, 'inventory.tsv'), 'source\ttarget\tdisposition\tpresent\tblob\tsha256\n' +
  rows.map(row => [row.source, row.target, row.disposition, row.present, row.blob, row.sha256 ?? ''].join('\t')).join('\n') + '\n');
console.log(JSON.stringify({ output, files: rows.length,
  unresolved: rows.filter(row => row.disposition === 'unresolved-automation-port').map(row => row.source) }, null, 2));
