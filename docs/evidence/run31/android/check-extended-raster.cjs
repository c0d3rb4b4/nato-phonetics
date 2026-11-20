// Observe glyph ink in actual Android screenshots. Layout comes from UIAutomator,
// expected ink extents from the bundled font's glyph outlines, not a mock render.
const fs=require('node:fs'); const path=require('node:path'); const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sharp=require(require.resolve('sharp', {paths:[process.cwd()]}));
if(process.argv.length!==5) throw new Error('Usage: node check-extended-raster.cjs NATIVE_LAYOUT_DIRECTORY SCREENSHOT_DIRECTORY NEW_REPORT.json');
const [directory,screenshots,reportFile]=process.argv.slice(2).map(value=>path.resolve(value));
if(fs.existsSync(reportFile)) throw new Error('Select a new report path');
const root=path.resolve(__dirname,'../../../..');
const glyphs=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/run30/native-glyph-metrics.json')));
const checks=JSON.parse(fs.readFileSync(path.join(directory,'checks.json')));
(async()=>{
 const {NATO_ALPHABET,NATO_NUMBERS}=await import(pathToFileURL(path.join(root,'src/data/natoData.js')).href);
 const result=[];
 for(const check of checks.filter(c=>c.tiles && c.check.startsWith('final-'))){
  const capture=path.join(screenshots,check.check+'.png');
  const {data,info}=await sharp(capture).removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(const tile of check.tiles){
   const layout=JSON.parse(fs.readFileSync(path.join(directory,check.check+'-native-layout.json')));
   const run=layout.values.find(r=>r.frame?.width>0&&r.id===(tile.testID==='quiz-card'?'quiz-letter':tile.testID+'-letter-run'));
   const symbol=run?.text||tile.testID.slice(-1);const entry=[...NATO_ALPHABET,...NATO_NUMBERS].find(e=>(e.letter??e.digit)===symbol);assert(entry,`Unknown actual measured symbol ${symbol}`);const ratio=check.density*check.scale;
   for(const metric of [
    {label:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844,color:[31,41,51]},
    {label:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264,color:[31,41,51]},
    {label:'guide',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619,color:[55,65,81]},
   ]){
    if(check.check.includes('quiz-question')&&metric.label!=='letter')continue;
    const x0=Math.round(tile.pixels.x+metric.x*ratio),y0=Math.round(tile.pixels.y+metric.y*ratio);
    const x1=Math.round(x0+metric.w*ratio),y1=Math.round(y0+metric.h*ratio);
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity,count=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
     const i=(y*info.width+x)*info.channels;
     if([0,1,2].some(j=>Math.abs(data[i+j]-parseInt(entry.color.slice(1+j*2,3+j*2),16))>8)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
    }
    const bounds=[...metric.text].map(c=>glyphs[metric.face].glyphs[c]).filter(Boolean);
    const ymax=Math.max(...bounds.map(b=>b[3])),ymin=Math.min(...bounds.map(b=>b[1]));
    const expectedTop=tile.pixels.y+(metric.baseline-ymax/1000*metric.size)*ratio;
    const expectedBottom=tile.pixels.y+(metric.baseline-ymin/1000*metric.size)*ratio;
    result.push({capture:path.basename(capture),symbol,scale:check.scale,density:check.density,part:metric.label,text:metric.text,inkSupportThreshold:'Any RGB channel differs from the uniform tile background by >8; includes faint antialias fringe',inkPixels:{left,top,right,bottom,count},expectedInk:{top:expectedTop,bottom:expectedBottom},deltaPixels:{top:top-expectedTop,bottom:bottom+1-expectedBottom}});
   }
  }
 }
 fs.writeFileSync(reportFile,JSON.stringify(result,null,2)+'\n');
 assert.equal(new Set(result.filter(r=>r.scale===1&&r.capture.startsWith('final-alphabet-light-')).map(r=>r.symbol)).size,26,'All26 final default raster coverage');
 for(const prefix of ['final-converter-light-', 'final-converter-dark-', 'final-converter-dark-scale2-']){
  const scale=prefix.includes('scale2')?2:1;
  for(const symbol of 'NUWJ359')for(const part of ['letter','word','guide'])assert(result.some(r=>r.scale===scale&&r.capture.startsWith(prefix)&&r.symbol===symbol&&r.part===part),`Missing ${prefix}/${symbol}/${part}`);
 }
 for(const capture of ['final-quiz-question-dark-scale2.png','final-quiz-feedback-dark-scale2.png'])assert(result.some(r=>r.capture===capture),`Missing context ${capture}`);
 for(const r of result)for(const [edge,delta]of Object.entries(r.deltaPixels))assert(Math.abs(delta)<=2,`Raster+AA envelope exceeded ${r.capture}/${r.symbol}/${r.part}/${edge}: ${delta}`);
 console.log(JSON.stringify({passed:true,rasterEnvelopePhysicalPixels:2,observations:result.length,maxTopDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.top))),maxBottomDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.bottom)))}));
})().catch(e=>{console.error(e);process.exit(1)});
