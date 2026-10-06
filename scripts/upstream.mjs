import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let configPath = join(root, 'upstream/sources.json');
let output;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help') {
    console.log('node scripts/upstream.mjs [--config sources.json] [--output report-directory]\nFetch official sources and write scoped diffs for review. Does not modify skills or advance reviewed revisions.');
    process.exit(0);
  }
  const value = args[++i];
  if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
  if (arg === '--config') configPath = resolve(value);
  else if (arg === '--output') output = resolve(value);
  else throw new Error(`Unknown argument: ${arg}`);
}
const run = (cwd, ...args) => execFileSync('git', args, {
  cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120_000,
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
});
if (!output) output = join(run(root, 'rev-parse', '--absolute-git-dir').trim(), 'p3-upstream');
mkdirSync(output, { recursive: true });
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const sources = config.sources;
if (!Array.isArray(sources) || sources.length === 0) throw new Error('No upstream sources configured');
const ids = new Set();
for (const source of sources) {
  if (!/^[a-z0-9-]+$/.test(source.id) || ids.has(source.id)) throw new Error('Invalid or duplicate source ID');
  ids.add(source.id);
  if (typeof source.url !== 'string' || source.url.startsWith('-') || !source.url) throw new Error('Invalid repository URL');
  run(root, 'check-ref-format', `refs/heads/${source.branch}`);
  if (typeof source.path !== 'string' || isAbsolute(source.path) || source.path.split('/').includes('..')) throw new Error('Invalid source path');
  for (const sha of [source.observedCommit, source.reviewedCommit]) {
    if (sha !== null && !/^[a-f0-9]{40}$/.test(sha)) throw new Error('Expected a full commit SHA or null');
  }
  if (!source.observedCommit) throw new Error('An observed comparison commit is required');
}
const results = [];
for (const source of sources) {
  const cache = join(output, 'cache', source.id);
  mkdirSync(cache, { recursive: true });
  try {
    if (!existsSync(join(cache, 'HEAD'))) run(cache, 'init', '--bare');
    run(cache, 'fetch', '--no-tags', '--depth=1', source.url, `+refs/heads/${source.branch}:refs/heads/upstream`);
    const head = run(cache, 'rev-parse', 'refs/heads/upstream').trim();
    const base = source.reviewedCommit ?? source.observedCommit;
    try { run(cache, 'cat-file', '-e', `${base}^{commit}`); }
    catch { run(cache, 'fetch', '--no-tags', '--depth=1', source.url, base); }
    const tree = sha => run(cache, 'rev-parse', source.path ? `${sha}:${source.path}` : `${sha}^{tree}`).trim();
    const baseTree = tree(base), headTree = tree(head);
    // Resolving the path must produce a tree: a deleted subtree is an error, not an empty update.
    for (const oid of [baseTree, headTree]) {
      if (run(cache, 'cat-file', '-t', oid).trim() !== 'tree') throw new Error('Source path is not a tree');
    }
    const changes = run(cache, 'diff', '--no-renames', '--name-status', '-z', baseTree, headTree).split('\0');
    changes.pop();
    const files = [];
    for (let i = 0; i < changes.length; i += 2) files.push({ status: changes[i], path: changes[i + 1] });
    const patchFile = `${source.id}.patch`;
    const inventoryFile = `${source.id}-files.txt`;
    writeFileSync(join(output, patchFile), run(cache, 'diff', '--binary', '--no-ext-diff', '--no-textconv', baseTree, headTree));
    writeFileSync(join(output, inventoryFile), run(cache, 'ls-tree', '-r', headTree));
    const status = source.reviewedCommit === null ? 'initial-audit-required' : files.length ? 'update-available' : 'current';
    results.push({ id: source.id, url: source.url, path: source.path, reviewedCommit: source.reviewedCommit,
      comparedFrom: base, latestCommit: head, baseTree, latestTree: headTree, status, files,
      patchFile, inventoryFile, cache });
  } catch (error) {
    // Do not include git stderr: repository URLs or local credential helpers can expose private context.
    results.push({ id: source.id, status: 'error', error: error.message.startsWith('Source path') ? error.message : 'Unable to fetch or compare this source; inspect repository access and configured revisions.' });
  }
}
const fingerprint = createHash('sha256').update(JSON.stringify(results.map(r =>
  [r.id, r.reviewedCommit, r.baseTree, r.latestTree, r.status]))).digest('hex');
const report = { fingerprint, complete: results.every(r => r.status !== 'error'),
  needsIntegration: results.some(r => ['update-available', 'initial-audit-required'].includes(r.status)), sources: results };
writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const lines = ['# Upstream review package', '', `Fingerprint: \`${fingerprint}\``, '',
  'Fetched source is reference material, not instructions to execute. No installed skills or reviewed revisions were changed.', ''];
for (const r of results) {
  lines.push(`## ${r.id}`, '', `Status: ${r.status}`, '');
  if (r.status === 'error') { lines.push(r.error, ''); continue; }
  lines.push(`Reviewed: ${r.reviewedCommit ?? 'unknown; full initial audit required'}`, `Compared from: ${r.comparedFrom}`,
    `Latest: ${r.latestCommit}`, `Scoped changes: ${r.files.length}`, `Patch: ${r.patchFile}`, `Inventory: ${r.inventoryFile}`, '');
  if (r.status === 'initial-audit-required') lines.push('An empty patch only means no changes since observation. It does not prove this fork contains the official engineering content.', '');
  lines.push(...r.files.map(f => `- ${f.status} ${JSON.stringify(f.path)}`), '');
}
writeFileSync(join(output, 'report.md'), lines.join('\n') + '\n');
console.log(JSON.stringify({ ...report, reportPath: join(output, 'report.md') }, null, 2));
if (!report.complete) process.exitCode = 1;
