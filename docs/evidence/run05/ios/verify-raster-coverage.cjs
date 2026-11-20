// Require all 26 symbols and all three typographic parts after clipped ROI exclusions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sources=['phone','references'].map(prefix=>({file:prefix+'-raster-measurements.json',rows:JSON.parse(fs.readFileSync(path.join(__dirname,prefix+'-raster-measurements.json')))}));
const rows=sources.flatMap(source=>source.rows);const required=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].flatMap(symbol=>['letter','word','guide'].map(part=>({symbol,part})));
const missing=required.filter(pair=>!rows.some(row=>row.symbol===pair.symbol&&row.part===pair.part));
const report={sources:sources.map(({file,rows})=>({file,observations:rows.length})),requiredPairs:required.length,coveredPairs:required.length-missing.length,missing,rasterEnvelopePhysicalPixels:2,maxTopDelta:Math.max(...rows.map(r=>Math.abs(r.deltaPixels.top))),maxBottomDelta:Math.max(...rows.map(r=>Math.abs(r.deltaPixels.bottom)))};
fs.writeFileSync(path.join(__dirname,'raster-coverage.json'),JSON.stringify(report,null,2)+'\n');
assert.equal(missing.length,0,'Missing all-letter/part raster observations: '+JSON.stringify(missing));
assert(report.maxTopDelta<=2&&report.maxBottomDelta<=2,'Native raster envelope exceeded');console.log(JSON.stringify({passed:true,...report}));
