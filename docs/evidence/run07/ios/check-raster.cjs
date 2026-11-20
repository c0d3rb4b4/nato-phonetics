// Actual original PNG ink versus pinned font outlines and observed RN scale.
// The legacy rounded-frame model remains a diagnostic alongside the strict gate.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const classification=process.argv[2]||'final';
const output=classification==='diagnostic'?path.join(__dirname,'diagnostics/pre-origin'):__dirname;
(async()=>{
 const {NATO_ALPHABET,NATO_NUMBERS}=await import(path.join(root,'src/data/natoData.js'));
 const glyphs=JSON.parse(fs.readFileSync(path.join(__dirname,'../../run05/native-glyph-metrics.json')));
 const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'../screenshots/ios/metadata.json')));
 const observations=[],excluded=[];
 for(const capture of metadata.captures){
  if((capture.classification||'final')!==classification||!capture.nativeLayoutFile)continue;
  const native=JSON.parse(fs.readFileSync(path.join(root,capture.nativeLayoutFile)));
  const {data,info}=await sharp(path.join(__dirname,'../screenshots/ios',capture.file)).autoOrient().removeAlpha().raw().toBuffer({resolveWithObject:true});
  const density=capture.density,viewport=capture.actualFrames['screen-scroll'];
  for(const[id,f]of Object.entries(capture.actualFrames)){
   if(!/^(alphabet-[A-Z]|converter-\d+|quiz-card)$/.test(id))continue;
   const nativeRoot=native.values.find(r=>r.id===id&&r.frame?.width>0);if(!nativeRoot)throw Error('No native root '+capture.file+'/'+id);
   const scale=nativeRoot.style.width/110,ratio=scale*density;
   assert(Math.abs(f.height-150*scale)*density<=1+1e-6,`${capture.file}/${id} height drift`);
   assert(Math.abs(f.width-110*scale)*density<=1+1e-6,`${capture.file}/${id} width drift`);
   let symbol=id.startsWith('alphabet-')?id.slice(-1):id.startsWith('converter-')?'NUWJ359'[Number(id.slice(10))]:null;
   if(!symbol)symbol=native.values.find(r=>r.id==='quiz-letter'&&r.frame?.width>0)?.text;
   const entry=[...NATO_ALPHABET,...NATO_NUMBERS].find(e=>(e.letter||e.digit)===symbol);if(!entry)throw Error(`Cannot identify ${capture.file}/${id}`);
   const metrics=[{part:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844},{part:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264},{part:'guide',suffix:'pronunciation',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619}];
   for(const metric of metrics){
    if(id==='quiz-card'&&capture.file.includes('question')&&metric.part!=='letter')continue;
    const x0=Math.round(f.x*density+metric.x*ratio),y0=Math.round(f.y*density+metric.y*ratio),x1=Math.round(f.x*density+(metric.x+metric.w)*ratio),y1=Math.round(f.y*density+(metric.y+metric.h)*ratio);
    if(x0<0||x1>info.width||y0<0||y1>info.height||(viewport&&(y0<viewport.y*density||y1>(viewport.y+viewport.height)*density))){excluded.push({file:capture.file,id,part:metric.part,reason:'ROI outside actual viewport'});continue;}
    const bg=[0,1,2].map(j=>parseInt(entry.color.slice(1+j*2,3+j*2),16));
    if([[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]].some(([x,y])=>bg.some((c,j)=>Math.abs(data[(y*info.width+x)*info.channels+j]-c)>8))){excluded.push({file:capture.file,id,part:metric.part,reason:'ROI background clipped or occluded'});continue;}
    let top=Infinity,bottom=-Infinity,count=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*info.width+x)*info.channels;if(bg.some((c,j)=>Math.abs(data[i+j]-c)>8)){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}
    const bounds=[...metric.text].map(c=>glyphs[metric.face].glyphs[c]).filter(Boolean),ymax=Math.max(...bounds.map(b=>b[3])),ymin=Math.min(...bounds.map(b=>b[1]));
    const edges=(s,b)=>({top:f.y*density+b*density-ymax/1000*metric.size*s*density,bottom:f.y*density+b*density-ymin/1000*metric.size*s*density});
    const expected=edges(scale,metric.baseline*scale),legacy=edges(f.width/110,metric.baseline*f.width/110);
    const run=native.values.find(r=>r.id===(id==='quiz-card'&&metric.part==='letter'?'quiz-letter':`${id}-${metric.suffix||metric.part}-run`)&&r.frame?.width>0);
    const observedBaseline=run.frame.pageY-nativeRoot.frame.pageY+run.nativeLineMeasurement.baseline;
    const measured=edges(scale,observedBaseline);
    observations.push({file:capture.file,id,symbol,part:metric.part,text:metric.text,density,scale,inkPixels:{top,bottom,count},expectedInk:expected,deltaPixels:{top:top-expected.top,bottom:bottom+1-expected.bottom},legacyFrameScale:{scale:f.width/110,expectedInk:legacy,deltaPixels:{top:top-legacy.top,bottom:bottom+1-legacy.bottom}},nativeMeasuredBaseline:{logical:observedBaseline,nominal:metric.baseline*scale,deltaPhysicalPixels:(observedBaseline-metric.baseline*scale)*density,expectedInk:measured,deltaPixels:{top:top-measured.top,bottom:bottom+1-measured.bottom}}});
   }
  }
 }
 const failed=observations.filter(o=>Object.values(o.deltaPixels).some(d=>Math.abs(d)>2));
 const legacyFailed=observations.filter(o=>Object.values(o.legacyFrameScale.deltaPixels).some(d=>Math.abs(d)>2));
 const coverageErrors=[];
 if(!observations.some(o=>o.scale>3.5&&o.symbol==='J'&&o.part==='letter'))coverageErrors.push('Missing maximum J');
 if(classification==='final'){
  for(const symbol of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')for(const part of ['letter','word','guide'])if(!observations.some(o=>o.file.includes('default-alphabet')&&o.symbol===symbol&&o.part===part))coverageErrors.push(`Missing final default alphabet ${symbol}/${part}`);
  for(const symbol of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')for(const part of ['letter','word','guide'])if(!observations.some(o=>o.file.includes('maximum-alphabet')&&o.symbol===symbol&&o.part===part))coverageErrors.push(`Missing final maximum alphabet ${symbol}/${part}`);
  for(const symbol of 'NUWJ359')for(const part of ['letter','word','guide'])if(!observations.some(o=>o.file.includes('maximum-converter')&&o.symbol===symbol&&o.part===part))coverageErrors.push(`Missing final maximum converter ${symbol}/${part}`);
  for(const symbol of 'NUWJ')for(const part of ['letter','word','guide'])if(!observations.some(o=>o.file.includes('default-converter')&&o.symbol===symbol&&o.part===part))coverageErrors.push(`Missing default dark converter ${symbol}/${part}`);
  for(const scale of ['default','maximum'])for(const state of ['question','feedback'])for(const part of state==='question'?['letter']:['letter','word','guide'])if(!observations.some(o=>o.file.includes(`${scale}-quiz-${state}`)&&o.part===part))coverageErrors.push(`Missing ${scale} quiz ${state}/${part}`);
  if(!observations.some(o=>o.file.includes('maximum-quiz-next-question')&&o.part==='letter'))coverageErrors.push('Missing changed-question baseline');
  const previous=observations.find(o=>o.file.includes('maximum-quiz-feedback')&&o.part==='letter');
  const next=observations.find(o=>o.file.includes('maximum-quiz-next-question')&&o.part==='letter');
  if(!previous||!next||previous.symbol===next.symbol)coverageErrors.push('Native Next must replace the actual quiz symbol');
  for(const density of [2,3])for(const enlarged of [false,true])if(!observations.some(o=>o.density===density&&(o.scale>3.5)===enlarged&&o.symbol==='J'&&o.part==='letter'))coverageErrors.push(`Missing DPR${density} ${enlarged?'maximum':'default'} J`);
 }
 const summary={classification,scope:classification==='final'?'Maximum all26 alphabet and7 converter symbols; default/max contexts and changed quiz question; iPad DPR2 and focused iPhone DPR3':'Focused initial default/max alphabet and J, converter, quiz; full Run06 screenshot coverage remains historical',scaleMethod:'Actual RN Dimensions.fontScale and native root style.width/110, independently observed through Hermes',baselineMethod:'Nominal whole-tile target for strict gate; separate diagnostic uses retained native event baseline plus transformed Fabric frame',passed:failed.length===0&&coverageErrors.length===0,coveragePassed:coverageErrors.length===0,coverageErrors,observations:observations.length,passedObservations:observations.length-failed.length,failedObservations:failed.length,legacyFrameScaleFailedObservations:legacyFailed.length,inkSupportThreshold:'Any RGB channel differs from uniform tile background by >8',envelopePhysicalPixels:2,maximumAbsoluteDelta:Math.max(...observations.flatMap(o=>Object.values(o.deltaPixels).map(Math.abs))),excludedRois:excluded.length,failures:failed};
 fs.writeFileSync(path.join(output,'raster-measurements.json'),JSON.stringify(observations,null,2)+'\n');fs.writeFileSync(path.join(output,'raster-exclusions.json'),JSON.stringify(excluded,null,2)+'\n');fs.writeFileSync(path.join(output,'raster-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
 assert.equal(coverageErrors.length,0,'Required raster coverage missing');
 assert.equal(failed.length,0,'Strict nominal raster envelope failed; all failures retained');
})().catch(e=>{console.error(e);process.exitCode=1});
