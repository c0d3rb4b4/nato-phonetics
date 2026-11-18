// Release has no Hermes inspector. Its original screenshots are compared with
// the independently measured Debug state on the same phone/category/source.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
(async()=>{
 const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'../screenshots/ios/metadata.json')));
 const glyphs=JSON.parse(fs.readFileSync(path.join(__dirname,'../../run05/native-glyph-metrics.json')));
 const {NATO_ALPHABET}=await import(path.join(root,'src/data/natoData.js'));
 const reports=[];
 for(const release of metadata.captures.filter(c=>c.classification==='final'&&c.candidate.configuration==='Release')){
  const debug=metadata.captures.find(c=>c.classification==='final'&&c.candidate.configuration==='Debug'&&c.state===release.state&&c.device===release.device);
  assert(debug,'Missing matching Debug state '+release.file);
  const native=JSON.parse(fs.readFileSync(path.join(root,debug.nativeLayoutFile))),scale=native.dimensions.fontScale,density=release.density;
  assert.equal(density,native.dimensions.scale);assert.equal(debug.contentSizeCategory,release.contentSizeCategory);
  // The first bounded scroll stopped at India. Retain its independently
  // reproduced lower-edge failure rather than dropping that final candidate.
  const symbol=release.state==='phone-maximum-alphabet-J-dark'?'I':'J';
  const entry=NATO_ALPHABET.find(e=>e.letter===symbol);
  const f=release.actualFrames['alphabet-'+symbol],d=debug.actualFrames['alphabet-'+symbol];assert(f&&d,'Missing symbol frames');
  const raster=async c=>sharp(path.join(__dirname,'../screenshots/ios',c.file)).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const rel=await raster(release),dbg=await raster(debug);
  for(const m of [{part:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844},{part:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264},{part:'guide',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619}].filter(m=>symbol!=='I'||m.part!=='letter')){
   const roi=frame=>({x0:Math.round((frame.x+m.x*scale)*density),y0:Math.round((frame.y+m.y*scale)*density),x1:Math.round((frame.x+(m.x+m.w)*scale)*density),y1:Math.round((frame.y+(m.y+m.h)*scale)*density)});
   const r=roi(f),b=roi(d);assert.equal(r.x1-r.x0,b.x1-b.x0);assert.equal(r.y1-r.y0,b.y1-b.y0);
   assert(r.x0>=0&&r.y0>=0&&r.x1<=rel.info.width&&r.y1<=rel.info.height,'Release ROI clipped');
   assert(b.x0>=0&&b.y0>=0&&b.x1<=dbg.info.width&&b.y1<=dbg.info.height,'Debug ROI clipped');
   let top=Infinity,bottom=-Infinity,pixelsDifferent=0,maximumChannelDifference=0;
   const bg=[0,1,2].map(j=>parseInt(entry.color.slice(1+j*2,3+j*2),16));
   for(let y=0;y<r.y1-r.y0;y++)for(let x=0;x<r.x1-r.x0;x++){
    const ri=((r.y0+y)*rel.info.width+r.x0+x)*rel.info.channels,di=((b.y0+y)*dbg.info.width+b.x0+x)*dbg.info.channels;
    const delta=Math.max(...[0,1,2].map(j=>Math.abs(rel.data[ri+j]-dbg.data[di+j])));if(delta){pixelsDifferent++;maximumChannelDifference=Math.max(maximumChannelDifference,delta);}
    if(bg.some((c,j)=>Math.abs(rel.data[ri+j]-c)>8)){top=Math.min(top,r.y0+y);bottom=Math.max(bottom,r.y0+y);}
   }
   const bounds=[...m.text].map(c=>glyphs[m.face].glyphs[c]),ymax=Math.max(...bounds.map(v=>v[3])),ymin=Math.min(...bounds.map(v=>v[1]));
   const expected={top:f.y*density+(m.baseline-ymax/1000*m.size)*scale*density,bottom:f.y*density+(m.baseline-ymin/1000*m.size)*scale*density};
   const deltaPixels={top:top-expected.top,bottom:bottom+1-expected.bottom};
   reports.push({file:release.file,debugReference:debug.file,symbol,part:m.part,density,scale,scaleMethod:'Actual Debug native Dimensions for same device, OS category and unchanged source; no raw Release events claimed',inkPixels:{top,bottom},expectedInk:expected,deltaPixels,rasterPassed:Object.values(deltaPixels).every(v=>Math.abs(v)<=2),pixelsDifferent,maximumChannelDifference});
  }
 }
 assert.equal(reports.length,11,'Require default J, maximum J before/after horizontal scroll, and retained India word/guide');
 const summary={passed:reports.every(r=>r.rasterPassed),scope:'Installed Release iPhone DPR3 default/maximum J before/after horizontal scroll plus retained India word/guide; source/font/installed hashes separately verified',observations:reports.length,passedObservations:reports.filter(r=>r.rasterPassed).length,envelopePhysicalPixels:2,pixelIdenticalToDebug:reports.every(r=>r.pixelsDifferent===0),maximumAbsoluteDelta:Math.max(...reports.flatMap(r=>Object.values(r.deltaPixels).map(Math.abs))),reports};
 fs.writeFileSync(path.join(__dirname,'release-parity.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));assert(summary.passed,'Release strict raster envelope failed');
})().catch(e=>{console.error(e);process.exitCode=1});
