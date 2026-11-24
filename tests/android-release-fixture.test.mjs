import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {checkReleaseSamples}=require('../scripts/check-android-font-release-fixture.cjs');
const captured=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/android-observations/release-font-scale.json',import.meta.url)));

test('actual Release observations retain strict frame/widget, sweep, edit and resize acceptance',()=>{
  const report=checkReleaseSamples(captured());
  assert.equal(report.passed,true);
  assert.equal(report.primary.comparisons.length+report.primary.widgetComparisons.length+report.sweep.length,60);
  assert.equal(report.resize.length,12);
  assert.equal(report.editing.length,3);
});
test('Release gate rejects missing native evidence, replacement and stale glyph paint despite matching frames',()=>{
  for(const change of [row=>{delete row.native;},row=>{row.native.sameEditable=false;},row=>{row.native.viewIdentity+=1;},row=>{row.native.layoutHeightPx-=10;}]) {
    const samples=captured();change(samples.live2);
    assert.equal(checkReleaseSamples(samples).passed,false);
  }
});
test('Release gate rejects lost caret, changed input, absent sweep and absent cold reference',()=>{
  for(const change of [rows=>{rows['editing-return1'].native.selectionStart=0;},rows=>{rows['editing-insert'].value='lost';},rows=>{delete rows['sweep1-1.3'];},rows=>{delete rows.cold2;}]) {
    const samples=captured();change(samples);
    assert.equal(checkReleaseSamples(samples).passed,false);
  }
});
test('Android float32 scale representation passes; wrong environment or >1px frame deviation fails',()=>{
  const samples=captured();
  assert.notEqual(samples['sweep1-1.3'].dimensions.fontScale,1.3);
  assert.equal(checkReleaseSamples(samples).passed,true);
  samples['sweep1-1.3'].dimensions.fontScale=1.4;
  assert.equal(checkReleaseSamples(samples).passed,false);
  const frames=captured(); frames.live2.frames.stable.height+=1.01/frames.live2.dimensions.scale;
  assert.equal(checkReleaseSamples(frames).passed,false);
});
