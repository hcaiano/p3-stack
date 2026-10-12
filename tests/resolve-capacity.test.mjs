import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = new URL('../skills/poteto-mode/scripts/resolve-capacity.mjs', import.meta.url);
const row = (model, tier = 0, state = 'unknown', pool = 'account') => ({
  tier, instance: 'provider', model, pool, state, pace: null, used_percent: null,
});
function run(candidates, choice = null, exclude = []) {
  const result = spawnSync(process.execPath, [script.pathname], {
    input: JSON.stringify({ report: { candidates, choice }, exclude }), encoding: 'utf8',
  });
  return { code: result.status, value: result.stdout ? JSON.parse(result.stdout) : null };
}

test('preserves the measured protected choice and next-tier pacing choice exactly', () => {
  const first = { ...row('preferred', 0, 'protected'), pace: 2, used_percent: 80 };
  const next = { ...row('fallback', 1, 'available', 'other'), pace: 0.2, used_percent: 10 };
  for (const choice of [first, next]) assert.deepEqual(run([first, next], choice), {
    code: 0, value: { status: 'selected', choice, basis: 'capacity' },
  });
  assert.deepEqual(run([row('unknown'), next], next), {
    code: 0, value: { status: 'selected', choice: next, basis: 'capacity' },
  });
});

test('missing usage selects authorized candidates by tier then input order without approval', () => {
  const preferred = row('preferred');
  assert.deepEqual(run([row('third', 2), row('second', 1), preferred, row('peer')]), {
    code: 0, value: { status: 'selected', choice: preferred, basis: 'unknown-usage' },
  });
  const fallback = row('fallback', 1);
  assert.deepEqual(run([row('preferred', 0, 'unavailable'), fallback]), {
    code: 0, value: { status: 'selected', choice: fallback, basis: 'unknown-usage' },
  });
});

test('confirmed failed targets and quota pools advance to the next authorized unknown', () => {
  const first = row('first');
  const samePool = row('same-pool', 1);
  const next = row('next', 2, 'unknown', 'other');
  assert.deepEqual(run([first, samePool, next], null, [{ instance: 'provider', model: 'first' }]), {
    code: 0, value: { status: 'selected', choice: samePool, basis: 'unknown-usage' },
  });
  assert.deepEqual(run([first, samePool, next], null, [{ pool: 'account' }]), {
    code: 0, value: { status: 'selected', choice: next, basis: 'unknown-usage' },
  });
});

test('excluded measured choice refreshes measured alternatives but can select unknown directly', () => {
  const first = row('first', 0, 'available');
  const exclude = [{ instance: 'provider', model: 'first' }];
  assert.deepEqual(run([first, row('next', 1, 'protected')], first, exclude), {
    code: 1, value: { status: 'refresh', reason: 'excluded-choice' },
  });
  const unknown = row('unknown', 1);
  assert.deepEqual(run([first, unknown], first, exclude), {
    code: 0, value: { status: 'selected', choice: unknown, basis: 'unknown-usage' },
  });
});

test('missing billing mappings are skipped and never interpreted as missing usage', () => {
  const mapped = row('mapped', 1);
  assert.deepEqual(run([row('unmapped', 0, 'unknown', null), mapped]), {
    code: 0, value: { status: 'selected', choice: mapped, basis: 'unknown-usage' },
  });
  assert.deepEqual(run([row('unmapped', 0, 'unknown', null)]), {
    code: 1, value: { status: 'blocked', reason: 'missing-mapping' },
  });
});

test('a pinned singleton attempts unknown usage and blocks known unavailability without substitution', () => {
  const pinned = row('pinned');
  assert.deepEqual(run([pinned]), {
    code: 0, value: { status: 'selected', choice: pinned, basis: 'unknown-usage' },
  });
  assert.deepEqual(run([row('pinned', 0, 'unavailable')]), {
    code: 1, value: { status: 'blocked', reason: 'known-unavailable' },
  });
  assert.deepEqual(run([pinned], null, [{ pool: 'account' }]), {
    code: 1, value: { status: 'blocked', reason: 'attempts-exhausted' },
  });
  assert.deepEqual(run([]), { code: 1, value: { status: 'blocked', reason: 'no-candidates' } });
});

test('contradictory reports, unproven measured mappings and malformed exclusions are rejected', () => {
  const available = row('available', 0, 'available');
  assert.deepEqual(run([available]), { code: 2, value: null });
  assert.deepEqual(run([available], { ...available, pace: 1 }), { code: 2, value: null });
  assert.deepEqual(run([row('invalid', 0, 'available', null)]), { code: 2, value: null });
  assert.deepEqual(run([row('unknown')], null, [{ pool: 'account', model: 'extra' }]), { code: 2, value: null });
});
