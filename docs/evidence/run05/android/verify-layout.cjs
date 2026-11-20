// Check the actual native Fabric measurements observed by inspect-tiles.js.
const fs=require('node:fs'),path=require('node:path');
(async()=>{const {TILE_DESIGN:D}=await import(path.resolve(__dirname,'../../../../src/lib/tileDesign.js'));
const files=fs.readdirSync(__dirname).filter(n=>n.endsWith('-native-layout.json'));
const report=[];
for(const file of files){const capture=JSON.parse(fs.readFileSync(path.join(__dirname,file)));const rows=(capture.values||[]).filter(r=>r.frame?.width>0&&r.frame?.height>0);const density=capture.dimensions.scale;
 const roots=rows.filter(r=>/^(alphabet-[A-Z]|converter-\d+|quiz-card)$/.test(r.id));
 const errors=[],baselines=[],missingBaselines=[],baselineErrors=[];
 for(const root of roots){if(!root.frame){errors.push(root.id+' no native frame');continue;}
  const scale=root.style.width/D.width;const tolerance=(1+1e-6)/density; // one physical pixel plus floating-point noise
  if(Math.abs(root.frame.width-D.width*scale)>tolerance||Math.abs(root.frame.height-D.height*scale)>tolerance)errors.push(root.id+' dimensions');
  if(root.style.borderRadius!==D.radius*scale||root.style.flexGrow!==0||root.style.flexShrink!==0)errors.push(root.id+' radius/flex');
  for(const [suffix,m]of [['letter',D.letter],['word',D.word],['pronunciation',D.pronunciation]]){
   const box=rows.find(r=>r.id===root.id+'-'+suffix);if(!box)continue;
   const relative={x:box.frame.pageX-root.frame.pageX,y:box.frame.pageY-root.frame.pageY,width:box.frame.width,height:box.frame.height};
   for(const key of ['x','y','width','height'])if(Math.abs(relative[key]-m[key]*scale)>tolerance)errors.push(root.id+'-'+suffix+' '+key);
   const text=rows.find(r=>r.id===box.id+'-run') || (root.id==='quiz-card' && suffix==='letter' ? rows.find(r=>r.id==='quiz-letter') : undefined);
   if(text&&(text.style.fontFamily!==m.family||text.style.fontWeight!==m.weight||text.allowFontScaling!==true))errors.push(root.id+'-'+suffix+' font/scale');
   // inspect-tiles records the actual native onTextLayout event retained by the
   // hook. The measured Text frame includes its baseline-normalizing transform.
   // Older captures cannot establish this; preserve their geometry-only scope.
   const measurement=text?.nativeLineMeasurement;
   if(!text || !Number.isFinite(measurement?.baseline) || !measurement.key){
    missingBaselines.push({id:box.id,reason:!text?'No measured native Text run':'No actual native onTextLayout measurement in this capture'});
    continue;
   }
   const currentKey=`${text.text}:${text.style.fontSize}:${text.style.lineHeight}:${scale}`;
   if(measurement.key!==currentKey){baselineErrors.push(box.id+' stale onTextLayout measurement');continue;}
   const observed=text.frame.pageY-root.frame.pageY+measurement.baseline;
   const expected=m.baseline*scale;
   const deltaPhysicalPixels=Math.abs(observed-expected)*density;
   // Strict one-physical-pixel acceptance; epsilon covers JSON float noise only.
   const passed=deltaPhysicalPixels<=1+1e-6;
   baselines.push({id:box.id,runID:text.id,scale,source:measurement.source,
    lineBaseline:measurement.baseline,transformedRunY:text.frame.pageY-root.frame.pageY,
    observed,expected,deltaPhysicalPixels,passed});
   if(!passed)baselineErrors.push(box.id+' measured baseline '+deltaPhysicalPixels+' physical pixels');
  }
 }
 report.push({file,verificationScope:'Native geometry and measured baseline only; glyph size and clipping require independent raster checks',density,fontScale:capture.dimensions.fontScale,tolerancePhysicalPixels:1,tiles:roots.length,
  geometryPassed:errors.length===0,passed:errors.length===0&&baselineErrors.length===0,errors,
  baselineTolerancePhysicalPixels:1,baselineStatus:baselineErrors.length?'failed':!baselines.length?'not-measured':missingBaselines.length?'partial-measured-pass':'measured-pass',
  measuredBaselines:baselines.length,missingBaselineCount:missingBaselines.length,
  maxBaselineDeltaPhysicalPixels:baselines.length?Math.max(...baselines.map(b=>b.deltaPhysicalPixels)):null,
  baselineErrors,missingBaselines,baselines});
}
fs.writeFileSync(path.join(__dirname,'native-layout-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.map(({baselines,missingBaselines,...summary})=>summary)));if(report.some(r=>!r.passed))process.exitCode=1;
})();
