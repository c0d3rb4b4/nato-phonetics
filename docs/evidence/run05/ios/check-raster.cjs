// Glyph-ink observations from retained native XCTest captures and their actual
// measured tile frames. Expected extents come from the bundled font outlines.
const fs=require('node:fs');const path=require('node:path');const sharp=require('sharp');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const solid=process.env.NATO_INK_SOLID==='1';
const glyphs=JSON.parse(fs.readFileSync(path.join(__dirname,'../native-glyph-metrics.json')));
(async()=>{
 const {NATO_ALPHABET}=await import(path.join(root,'src/data/natoData.js'));
 const frames={};const log=fs.readFileSync(path.join(__dirname,process.argv[2]||'phone-test.log'),'utf8');
 for(const line of log.split('\n')){const match=line.match(/^CAPTUREFRAMES (\S+) (.+)$/);if(match)frames[match[1]]=JSON.parse(match[2]);}
 const prefix=process.argv[3]||'phone';const density=Number(process.argv[4]||3);const result=[];const skipped=[];
 for(const [name,tiles] of Object.entries(frames)){
  if(!name.startsWith('alphabet-'))continue;
  const capture=path.join(__dirname,'../screenshots/ios',prefix+'-'+name+'.png');if(!fs.existsSync(capture))continue;
  const {data,info}=await sharp(capture).autoOrient().removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(const [id,frame] of Object.entries(tiles)){
   if(!/^alphabet-[A-Z]$/.test(id))continue;
   const symbol=id.slice(-1),entry=NATO_ALPHABET.find(e=>e.letter===symbol),scale=Number(process.argv[5])||frame.width/110,ratio=density*scale;
   for(const metric of [
    {part:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844,color:[31,41,51]},
    {part:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264,color:[31,41,51]},
    {part:'guide',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619,color:[55,65,81]},
   ]){
    const x0=Math.round(frame.x*density+metric.x*ratio),y0=Math.round(frame.y*density+metric.y*ratio);
    const x1=Math.round(x0+metric.w*ratio),y1=Math.round(y0+metric.h*ratio);
    if(y0<(scale>2?240:120)*density || y1>info.height-50 || x0<0 || x1>info.width)continue;
    const background=[0,1,2].map(j=>parseInt(entry.color.slice(1+j*2,3+j*2),16));
    // A partially clipped scroll viewport can replace the tile background with
    // app chrome. Reject that ROI; never count the chrome as glyph ink.
    const corners=[[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]];
    if(corners.some(([x,y])=>background.some((c,j)=>Math.abs(data[(y*info.width+x)*info.channels+j]-c)>8))){skipped.push({capture:path.basename(capture),symbol,part:metric.part,reason:'ROI corner is clipped or occluded; uniform tile background absent'});continue;}
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity,count=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
     const i=(y*info.width+x)*info.channels;
     if(solid ? metric.color.every((c,j)=>Math.abs(data[i+j]-c)<38) : [0,1,2].some(j=>Math.abs(data[i+j]-parseInt(entry.color.slice(1+j*2,3+j*2),16))>8)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
    }
    const bounds=[...metric.text].map(c=>glyphs[metric.face].glyphs[c]).filter(Boolean);
    const ymax=Math.max(...bounds.map(b=>b[3])),ymin=Math.min(...bounds.map(b=>b[1]));
    const expectedTop=frame.y*density+(metric.baseline-ymax/1000*metric.size)*ratio;
    const expectedBottom=frame.y*density+(metric.baseline-ymin/1000*metric.size)*ratio;
    result.push({capture:path.basename(capture),symbol,part:metric.part,scale,density,text:metric.text,inkSupportThreshold:solid?'All channels within38 of foreground; omits faint antialias fringe':'Any RGB channel differs from the uniform tile background by >8; includes faint antialias fringe',inkPixels:{left,top,right,bottom,count},expectedInk:{top:expectedTop,bottom:expectedBottom},deltaPixels:{top:top-expectedTop,bottom:bottom+1-expectedBottom}});
   }
  }
 }
 fs.writeFileSync(path.join(__dirname,prefix+(solid?'-solid':'')+'-raster-measurements.json'),JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(path.join(__dirname,prefix+'-raster-exclusions.json'),JSON.stringify(skipped,null,2)+'\n');
 assert(result.length>0,'No native glyph observations');
 for(const r of result)for(const[edge,delta]of Object.entries(r.deltaPixels))assert(Math.abs(delta)<=2,`Raster+AA envelope exceeded ${r.capture}/${r.symbol}/${r.part}/${edge}: ${delta}`);
 console.log(JSON.stringify({passed:true,rasterEnvelopePhysicalPixels:2,excludedClippedRois:skipped.length,observations:result.length,symbols:[...new Set(result.map(r=>r.symbol))].sort().join(''),maxTopDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.top))),maxBottomDelta:Math.max(...result.map(r=>Math.abs(r.deltaPixels.bottom)))}));
})().catch(e=>{console.error(e);process.exit(1)});
