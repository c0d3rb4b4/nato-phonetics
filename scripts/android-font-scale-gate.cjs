// One physical pixel, matching the original Run20 acceptance. No missing data
// or retained-state failure may turn into a successful comparison.
const names = ['stable', 'feedback', 'input', 'revision'];
function inputContentHeight(sample) {
  return sample?.events?.filter(row => row.name === 'input' && row.size).at(-1)?.size.height;
}
function equivalentHeight(live, cold, density) {
  return Number.isFinite(live) && live > 0 && Number.isFinite(cold) && cold > 0 && density > 0 && Math.abs(live-cold)*density <= 1;
}
function checkSamples(samples) {
  const errors = [];
  for (const stage of ['cold1', 'live2', 'return1', 'cold2']) {
    const sample = samples[stage];
    if (!sample || sample.mounts !== 1 || sample.value !== 'NUWJ359') {
      errors.push(`${stage}: missing sample, remount or changed input`);
    }
    const expectedScale = stage.endsWith('2') ? 2 : 1;
    if (sample?.dimensions?.fontScale !== expectedScale) errors.push(`${stage}: wrong font scale`);
  }
  const density = samples.cold2?.dimensions?.scale;
  if (!(density > 0) || samples.live2?.dimensions?.scale !== density) errors.push('Missing or changed pixel density');
  const comparisons = [];
  const measuredNames = Object.values(samples).some(row => row?.frames?.nested) ? [...names, 'nested'] : names;
  for (const [liveStage, coldStage] of [['live2', 'cold2'], ['return1', 'cold1']]) {
    for (const name of measuredNames) {
      // Revision includes scale in its text, so both sides have identical text.
      const live = samples[liveStage]?.frames?.[name]?.height;
      const cold = samples[coldStage]?.frames?.[name]?.height;
      const passed = equivalentHeight(live, cold, density);
      comparisons.push({liveStage, coldStage, name, live, cold, passed});
    }
  }
  // A correct outer frame does not establish that the editable glyph paint
  // scaled. Compare the actual native widget's content-size event separately.
  const widgetComparisons = [['live2', 'cold2'], ['return1', 'cold1']].map(([liveStage, coldStage]) => {
    const live = inputContentHeight(samples[liveStage]); const cold = inputContentHeight(samples[coldStage]);
    return {liveStage, coldStage, name: 'input-widget', live, cold, passed: equivalentHeight(live, cold, density)};
  });
  return {passed: errors.length === 0 && [...comparisons, ...widgetComparisons].every(row => row.passed), tolerancePhysicalPixels: 1, errors, comparisons, widgetComparisons};
}
module.exports = {checkSamples, inputContentHeight, equivalentHeight};
