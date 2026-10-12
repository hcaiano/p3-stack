import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length > 0;
const metric = value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
const measured = candidate => ['available', 'protected'].includes(candidate.state);

function parse(input) {
  if (!object(input) || !object(input.report) || !Array.isArray(input.report.candidates)
    || !Array.isArray(input.exclude)) throw new Error('Expected {report: {choice, candidates}, exclude: []}');
  const { choice, candidates } = input.report;
  for (const row of candidates) {
    if (!object(row) || !Number.isInteger(row.tier) || row.tier < 0
      || !text(row.instance) || !text(row.model) || !(row.pool === null || text(row.pool))
      || !['available', 'protected', 'unavailable', 'unknown'].includes(row.state)
      || !metric(row.pace) || !metric(row.used_percent)
      || (row.pool === null && row.state !== 'unknown')) throw new Error('Invalid candidate');
  }
  if (choice === null ? candidates.some(measured)
    : !candidates.some(row => measured(row) && isDeepStrictEqual(row, choice))) {
    throw new Error('Choice must match a measured candidate, or be null without measured candidates');
  }
  for (const entry of input.exclude) {
    if (!object(entry) || !(Object.keys(entry).length === 1 && text(entry.pool)
      || Object.keys(entry).length === 2 && text(entry.instance) && text(entry.model))) {
      throw new Error('Invalid exclusion');
    }
  }
  return input;
}

function resolve({ report: { choice, candidates }, exclude }) {
  const remaining = candidates.filter(row => !exclude.some(entry => entry.pool
    ? entry.pool === row.pool : entry.instance === row.instance && entry.model === row.model));
  const mapped = remaining.filter(row => row.pool !== null);
  if (choice !== null && mapped.some(row => isDeepStrictEqual(row, choice))) {
    return { status: 'selected', choice, basis: 'capacity' };
  }
  if (mapped.some(measured)) return { status: 'refresh', reason: 'excluded-choice' };
  const unknown = mapped.filter(row => row.state === 'unknown').sort((a, b) => a.tier - b.tier)[0];
  if (unknown) return { status: 'selected', choice: unknown, basis: 'unknown-usage' };
  const reason = !candidates.length ? 'no-candidates' : !remaining.length ? 'attempts-exhausted'
    : !mapped.length ? 'missing-mapping' : 'known-unavailable';
  return { status: 'blocked', reason };
}

try {
  const result = resolve(parse(JSON.parse(readFileSync(0, 'utf8'))));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'selected' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}
