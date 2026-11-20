import assert from 'node:assert/strict';
import test from 'node:test';
import { selectNativeModes } from '../scripts/select-native-modes.cjs';

test('branch pushes select only the requested native products', () => {
  assert.deepEqual(selectNativeModes('push', 'refs/heads/develop'), ['android-develop']);
  assert.deepEqual(selectNativeModes('push', 'refs/heads/main'), ['android-release', 'ios-simulator']);
});

test('both trusted branches support all four modes and individual reruns', () => {
  const all = ['android-debug', 'android-develop', 'android-release', 'ios-simulator'];
  for (const ref of ['refs/heads/develop', 'refs/heads/main']) {
    assert.deepEqual(selectNativeModes('workflow_dispatch', ref, 'all'), all);
    for (const selection of all) assert.deepEqual(selectNativeModes('workflow_dispatch', ref, selection), [selection]);
    assert.throws(() => selectNativeModes('workflow_dispatch', ref, 'ios-export'), /Unsupported/);
    assert.throws(() => selectNativeModes('pull_request', ref, 'all'), /Unsupported/);
  }
});

test('other refs cannot select private work even with valid dispatch input', () => {
  for (const ref of ['refs/pull/1/merge', 'refs/heads/agent/test', 'refs/tags/main']) {
    for (const event of ['push', 'workflow_dispatch']) assert.throws(() => selectNativeModes(event, ref, 'all'), /main or develop/);
  }
});
