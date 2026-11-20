// Observe glyph ink in actual Android screenshots. Layout comes from UIAutomator,
// expected ink extents from the bundled font's glyph outlines, not a mock render.
const fs=require('node:fs'); const path=require('node:path'); const sharp=require('sharp'); const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const glyphs=JSON.parse(fs.readFileSync(path.join(__dirname,'../native-glyph-metrics.json')));
const checks=JSON.parse(fs.readFileSync(path.join(__dirname,'checks.json')));
(async()=>{
 const {NATO_ALPHABET}=await import(path.join(root,'src/data/natoData.js'));
 const result=[];
 for(const check of checks.filter(c=>(/^alphabet-transition-\d+-scale[12]$/.test(c.check)))){
  const capture=path.join(__dirname,'../screenshots/android',check.check.replace('alphabet-page-','alphabet-light-')+'.png');
  const {data,info}=await sharp(capture).removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(const tile of check.tiles){
   const symbol=tile.testID.slice(-1); const entry=NATO_ALPHABET.find(e=>e.letter===symbol); const ratio=check.density*check.scale;
   for(const metric of [
    {label:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844,color:[31,41,51]},
    {label:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264,color:[31,41,51]},
    {label:'guide',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619,color:[55,65,81]},
   ]){
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
 fs.writeFileSync(path.join(__dirname,'scale-transition-raster-measurements.json'),JSON.stringify(result,null,2)+'\n');
 
 for(const symbol of ['A'])for(const part of ['letter','word','guide'])assert(result.some(r=>r.scale===2&&r.symbol===symbol&&r.part===part),`Missing2x ${symbol}/${part}`);
 for(const[index,scale]of [1,2,1,2,1].entries())for(const part of ['letter','word','guide'])assert(result.some(r=>r.capture===`alphabet-transition-${index}-scale${scale}.png`&&r.symbol==='A'&&r.part===part),`Missing transition${index}/${part}`);
 for(const r of result)for(const [edge,delta]of Object.entries(r.deltaPixels))assert(Math.abs(delta)<=2,`Raster+AA envelope exceeded ${r.capture}/${r.symbol}/${r.part}/${edge}: ${delta}`);
 console.log(JSON.stringify({passed:true,rasterEnvelopePhysicalPixels:2,observations:result.length,maxTopDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.top))),maxBottomDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.bottom)))}));
})().catch(e=>{console.error(e);process.exit(1)});
