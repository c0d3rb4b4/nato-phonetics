import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { buildSync } from 'esbuild';

// Execute the maintained hooks with controlled state/effect scheduling. This
// covers event ownership; installed-app frame/raster checks verify rendering.
function hookRunner(file, exported) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let transitions = 0;
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => value !== b[i]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], update => {
        const next = typeof update === 'function' ? update(slots[index]) : update;
        if (next !== slots[index]) { transitions++; slots[index] = next; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) slots[index] = { value: factory(), deps };
      return slots[index].value;
    },
    useLayoutEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) {
        const old = slots[index];
        effects.push(() => {
          old?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const { outputFiles } = buildSync({ entryPoints: [fileURLToPath(new URL(file, import.meta.url))],
    bundle: true, format: 'cjs', platform: 'node', write: false, external: ['react'] });
  const module = { exports: {} };
  runInNewContext(outputFiles[0].text, { module, require(name) { assert.equal(name, 'react'); return react; } });
  return {
    render(...args) {
      cursor = 0; effects = [];
      const result = module.exports[exported](...args);
      effects.forEach(effect => effect());
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    get transitions() { return transitions; },
  };
}

const layout = y => ({ nativeEvent: { layout: { x: 0, y, width: 100, height: 50 } } });
const line = baseline => ({ nativeEvent: { lines: [{ y: 0, ascender: baseline }] } });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('native baseline includes the observed outer-box rounding from the iOS J regression', () => {
  const origins = hookRunner('../src/hooks/useTileBaseline.js', 'useTileOrigin');
  const baselines = hookRunner('../src/hooks/useTileBaseline.js', 'useTileBaseline');
  origins.render('3.571:4', 14.284).onLayout(layout(14.5));
  const origin = origins.render('3.571:4', 14.284).origin;
  const target = 145.853924 - origin;
  baselines.render('J:36:50:3.571', target).onTextLayout(line(131.56992765426634));
  const offset = baselines.render('J:36:50:3.571', target).offset;
  near(offset, -0.21600365426634);
  near(origin + offset + 131.56992765426634, 145.853924);
});

test('native baseline compensates the measured Android TREE box without altering its font', () => {
  const origins = hookRunner('../src/hooks/useTileBaseline.js', 'useTileOrigin');
  const baselines = hookRunner('../src/hooks/useTileBaseline.js', 'useTileBaseline');
  origins.render('1:111', 51).onLayout(layout(50.85714340209961));
  const origin = origins.render('1:111', 51).origin;
  const target = 122.619 - 60 - origin;
  baselines.render('TREE:11:16:1', target).onTextLayout(line(12));
  const offset = baselines.render('TREE:11:16:1', target).offset;
  near(offset, -0.23814340209961);
  near(60 + origin + offset + 12, 122.619);
});

test('new quiz text retains independent geometry and target changes reuse the native line', () => {
  const origins = hookRunner('../src/hooks/useTileBaseline.js', 'useTileOrigin');
  const baselines = hookRunner('../src/hooks/useTileBaseline.js', 'useTileBaseline');
  origins.render('3.571:4', 14.284).onLayout(layout(14.5));
  const j = baselines.render('J:36:50:3.571', 131.353924);
  j.onTextLayout(line(131.56992765426634));
  near(baselines.render('J:36:50:3.571', 131.353924).offset, -0.21600365426634);
  const w = baselines.render('W:36:50:3.571', 131.353924);
  assert.equal(w.offset, 0, 'New text waits for its own native line event');
  j.onTextLayout(line(99));
  w.onTextLayout(line(131.56992765426634));
  assert.equal(origins.render('3.571:4', 14.284).origin, 14.5, 'Text changes need no new box-layout event');
  near(baselines.render('W:36:50:3.571', 131.103924).offset, -0.46600365426634);
});

test('late events cannot revive a prior size generation after 1→2→1 or unmount', () => {
  const origins = hookRunner('../src/hooks/useTileBaseline.js', 'useTileOrigin');
  const baselines = hookRunner('../src/hooks/useTileBaseline.js', 'useTileBaseline');
  const firstOrigin = origins.render('1:4', 4);
  const firstLine = baselines.render('J:36:50:1', 36.844);
  firstOrigin.onLayout(layout(4.1)); firstLine.onTextLayout(line(37));
  origins.render('2:4', 8); baselines.render('J:72:100:2', 73.688);
  origins.render('1:4', 4); baselines.render('J:36:50:1', 36.844);
  const transitions = [origins.transitions, baselines.transitions];
  firstOrigin.onLayout(layout(999)); firstLine.onTextLayout(line(999));
  assert.deepEqual([origins.transitions, baselines.transitions], transitions);
  assert.equal(origins.render('1:4', 4).origin, 4);
  assert.equal(baselines.render('J:36:50:1', 36.844).offset, 0);
  const finalOrigin = origins.render('1:4', 4);
  const finalLine = baselines.render('J:36:50:1', 36.844);
  origins.unmount(); baselines.unmount();
  finalOrigin.onLayout(layout(999)); finalLine.onTextLayout(line(999));
  assert.deepEqual([origins.transitions, baselines.transitions], transitions);
});
