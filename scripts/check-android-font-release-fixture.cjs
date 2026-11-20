// Apply the maintained strict gate to actual native-observed Release samples.
const fs = require('node:fs');
const path = require('node:path');
const {checkSamples, inputContentHeight, equivalentHeight} = require('./android-font-scale-gate.cjs');
const names = ['stable', 'feedback', 'input', 'revision', 'nested', 'input-widget'];
function compare(row, cold, stage) {
  return names.map(name => {
    const live = name === 'input-widget' ? inputContentHeight(row) : row?.frames?.[name]?.height;
    const reference = name === 'input-widget' ? inputContentHeight(cold) : cold?.frames?.[name]?.height;
    return {stage, name, live, reference, passed: equivalentHeight(live, reference, row?.dimensions?.scale)};
  });
}
function checkReleaseSamples(samples, {extended = true} = {}) {
  const primary = checkSamples(samples);
  const state = Object.entries(samples).map(([stage, row]) => ({stage, passed:
    row.mounts === 1 && row.native?.sameView === true && row.native?.sameEditable === true &&
    row.value === row.native?.value && ['activityIdentity','viewIdentity','editableIdentity'].every(key=>Number.isInteger(row.native?.[key])) &&
    Number.isFinite(row.native?.textSizePx) && row.native.textSizePx > 0 &&
    Number.isFinite(row.native?.layoutHeightPx) && row.native.layoutHeightPx > 0}));
  // Object identity is checked by Java reference equality within each process;
  // require the recorded native identity to agree across live transitions too.
  const groups = [['cold1','live2','return1'], ['cold2','resize-narrow2','resize-restored2'],
    Object.keys(samples).filter(key => key.startsWith('sweep')),
    ['editing-start','editing-before','editing-typed-before','editing-live2','editing-return1','editing-insert']];
  const identities = groups.filter(g => g.length && (extended || g[0] === 'cold1')).map(stages => {
    const rows = stages.map(stage => samples[stage]?.native);
    return {stages, passed: rows.every(r => r && ['activityIdentity','viewIdentity','editableIdentity'].every(key => r[key] === rows[0][key]))};
  });
  const nativeGlyphs = [['live2','cold2'],['return1','cold1']].map(([liveStage,coldStage]) => {
    const live=samples[liveStage]?.native, cold=samples[coldStage]?.native;
    return {liveStage,coldStage,passed:!!live && !!cold && Math.abs(live.textSizePx-cold.textSizePx)<=1 && Math.abs(live.layoutHeightPx-cold.layoutHeightPx)<=1};
  });
  const sweep = [], resize = [], editing = [];
  if (extended) {
    for (const [i, scale] of [.85,1.3,2,1,.85,2,1.3,1].entries()) {
      const stage=`sweep${i}-${Number.isInteger(scale)?scale.toFixed(1):scale}`;
      const row=samples[stage], cold=samples[{.85:'cold085',1:'cold1',1.3:'cold13',2:'cold2'}[scale]];
      sweep.push(...compare(row,cold,stage));
      // Android Configuration.fontScale is float32; accept its representation
      // error only. The maintained physical-pixel measurement gate is unchanged.
      state.push({stage,passed:row?.value==='NUWJ359' && Math.abs(row?.dimensions?.fontScale-scale)<0.000001});
    }
    for (const stage of ['resize-narrow2','resize-restored2']) resize.push(...compare(samples[stage],samples.cold2,stage));
    state.push({stage:'resize-widths',passed:samples['resize-narrow2']?.dimensions?.width !== samples.cold2?.dimensions?.width && samples['resize-restored2']?.dimensions?.width === samples.cold2?.dimensions?.width});
    for (const [stage,scale] of [['editing-live2',2],['editing-return1',1],['editing-insert',1]]) {
      const row=samples[stage], before=samples['editing-typed-before'], n=row?.native;
      const initial=samples['editing-before']?.native;
      const caret=initial?.selectionStart;
      const value='NUWJ359'.slice(0,caret)+'Q'+'NUWJ359'.slice(caret);
      const expected=stage==='editing-insert'?value.slice(0,caret+1)+'Z'+value.slice(caret+1):value;
      const position=caret+(stage==='editing-insert'?2:1);
      const cold=samples[scale===2?'cold2':'cold1'];
      editing.push({stage,expected,position,passed:Number.isInteger(caret) && caret>0 && caret<7 &&
        initial?.focused===true && initial.selectionEnd===caret && before?.value===value &&
        n?.focused===true && row.value===expected && n.selectionStart===position && n.selectionEnd===position &&
        row.selection?.start===position && row.selection?.end===position && row.focused===true &&
        equivalentHeight(row.frames?.input?.height,cold?.frames?.input?.height,row.dimensions?.scale) &&
        equivalentHeight(inputContentHeight(row),inputContentHeight(cold),row.dimensions?.scale)});
    }
  }
  const passed=primary.passed && [state,identities,nativeGlyphs,sweep,resize,editing].every(rows=>rows.every(r=>r.passed));
  return {passed,tolerancePhysicalPixels:1,primary,state,identities,nativeGlyphs,sweep,resize,editing,
    scope:'Actual separate Release fixture plus native view/Editable/widget observations; production flow/raster and physical/provider IME/AT acceptance separate'};
}
module.exports={checkReleaseSamples};
if(require.main===module) {
  const directory=path.resolve(process.argv[2]);
  const report=checkReleaseSamples(JSON.parse(fs.readFileSync(path.join(directory,'samples.json'))),{extended:!process.argv.includes('--primary-only')});
  fs.writeFileSync(path.join(directory,'gate.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,primary:report.primary.passed,sweep:report.sweep.length,resize:report.resize.length,editing:report.editing.length}));
  process.exitCode=report.passed?0:1;
}
