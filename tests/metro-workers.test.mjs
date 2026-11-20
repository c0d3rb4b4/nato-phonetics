import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

function load(jobs) {
  const env = {...process.env};
  delete env.NATO_BUILD_JOBS;
  if (jobs !== undefined) env.NATO_BUILD_JOBS = jobs;
  return spawnSync(process.execPath, ['-e', `
    const config = require('./metro.config.js');
    const defaults = require('@react-native/metro-config').getDefaultConfig(process.cwd());
    console.log(JSON.stringify({actual: config.maxWorkers, default: defaults.maxWorkers}));
  `], {cwd: new URL('..', import.meta.url), env, encoding: 'utf8'});
}

test('Metro honors explicit shared build limits and preserves its unspecified default', () => {
  const defaults = load();
  assert.equal(defaults.status, 0, defaults.stderr);
  const value = JSON.parse(defaults.stdout);
  assert.equal(value.actual, value.default);
  for (const jobs of ['1', '4']) {
    const result = load(jobs);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).actual, Number(jobs));
  }
});

test('Metro rejects invalid worker limits before starting transform processes', () => {
  for (const jobs of ['', '0', '5', '1.5', 'invalid']) {
    const result = load(jobs);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /NATO_BUILD_JOBS must be an integer from 1 to 4/);
  }
});
