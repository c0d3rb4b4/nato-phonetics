import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { transformSync } from 'esbuild';

// Execute the actual Android adapter with only the React Native module mocked.
// Native raster tests still establish platform conversion and rendering fidelity.
function loadAdapter(typography) {
  const source = readFileSync(new URL('../src/lib/tileTextUnits.android.js', import.meta.url), 'utf8');
  const { code } = transformSync(source, { format: 'cjs', platform: 'node' });
  const module = { exports: {} };
  runInNewContext(code, {
    module,
    require: name => {
      assert.equal(name, 'react-native');
      return { NativeModules: { TileTypography: typography } };
    },
  });
  return module.exports.tileTextUnits;
}

test('Android inverse follows current renderer metrics when reported fontScale returns to an old value', () => {
  let nativeScale = 1;
  const requests = [];
  const convert = loadAdapter({ spForUniformDp(target) {
    requests.push(target);
    if (nativeScale === 1) return target;
    // Values observed in the preserved failing Android 16 transition.
    return new Map([[72, 68.38710021972656], [36, 24], [16, 8], [11, 5.5], [50, 43.54838562011719], [22, 11]]).get(target);
  } });
  assert.equal(convert(36, 1, 1), 36);
  nativeScale = 2;
  assert.equal(convert(36, 1, 2), 68.38710021972656);
  assert.equal(convert(36, 1, 1), 24, 'Reported 1× must not reuse the original inverse while renderer metrics differ');
  assert.deepEqual([16, 11, 50, 22, 16].map(base => convert(base, 1, 1)), [8, 5.5, 43.54838562011719, 11, 8]);
  nativeScale = 1;
  assert.equal(convert(36, 1, 1), 36, 'The inverse also follows later native-metric recovery');
  assert.equal(requests.length, 9);
});

test('Android adapter applies context and accessibility scale to the target once', () => {
  const requests = [];
  const convert = loadAdapter({ spForUniformDp(target) { requests.push(target); return target / 2; } });
  assert.equal(convert(16, 1.5, 2), 24);
  assert.deepEqual(requests, [48]);
});

test('Android adapter fails explicitly for missing or invalid native conversion', () => {
  assert.throws(() => loadAdapter(undefined)(16, 1, 1), /adapter is missing/);
  for (const invalid of [NaN, Infinity, 0, -1]) {
    assert.throws(() => loadAdapter({ spForUniformDp: () => invalid })(16, 1, 1), /invalid size/);
  }
});
