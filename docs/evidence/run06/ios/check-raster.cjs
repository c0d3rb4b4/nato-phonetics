// Actual screenshot ink against outlines of the exact bundled font files.
// Uses recorded viewport rectangles to reject clipped ROIs, not a fixed inset.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
(async()=>{
 const {NATO_ALPHABET,NATO_NUMBERS}=await import(path.join(root,'src/data/natoData.js'));
 const glyphs=JSON.parse(fs.readFileSync(path.join(__dirname,'../../run05/native-glyph-metrics.json')));
 const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'../screenshots/ios/metadata.json')));
 const observations=[],excluded=[];
 for(const capture of metadata.captures){
  if(capture.classification==='diagnostic'||!/^(maximum|dark)-/.test(capture.file))continue;
  const {data,info}=await sharp(path.join(__dirname,'../screenshots/ios',capture.file)).autoOrient().removeAlpha().raw().toBuffer({resolveWithObject:true});
  const density=capture.density,viewport=capture.actualFrames['screen-scroll'];
  for(const[id,f]of Object.entries(capture.actualFrames)){
   if(!/^(alphabet-[A-Z]|converter-\d+|quiz-card)$/.test(id))continue;
   const scale=f.width/110,ratio=scale*density;
   assert(Math.abs(f.height-150*scale)*density<=1,`${capture.file}/${id} ratio drift`);
   let symbol=id.startsWith('alphabet-')?id.slice(-1):id.startsWith('converter-')?'NUWJ359'[Number(id.slice(10))]:null;
   if(!symbol){
    const sx=Math.round((f.x+f.width/2)*density),sy=Math.round((f.y+65*scale)*density),i=(sy*info.width+sx)*info.channels;
    const entry=NATO_ALPHABET.find(e=>[0,1,2].every(j=>Math.abs(data[i+j]-parseInt(e.color.slice(1+j*2,3+j*2),16))<=2));
    symbol=entry?.letter;
   }
   const entry=[...NATO_ALPHABET,...NATO_NUMBERS].find(e=>(e.letter||e.digit)===symbol);if(!entry)throw Error(`Cannot identify ${capture.file}/${id}`);
   const metrics=[{part:'letter',text:symbol,face:'ExtraBold',size:36,x:20,y:4,w:70,h:50,baseline:40.844},{part:'word',text:entry.word,face:'SemiBold',size:16,x:8,y:83,w:94,h:22,baseline:99.264},{part:'guide',text:entry.pronunciation,face:'Italic',size:11,x:8,y:111,w:94,h:16,baseline:122.619}];
   for(const metric of metrics){
    if(id==='quiz-card' && capture.file.includes('question') && metric.part!=='letter')continue;
    const x0=Math.round(f.x*density+metric.x*ratio),y0=Math.round(f.y*density+metric.y*ratio),x1=Math.round(f.x*density+(metric.x+metric.w)*ratio),y1=Math.round(f.y*density+(metric.y+metric.h)*ratio);
    if(x0<0||x1>info.width||y0<0||y1>info.height||(viewport&&(y0<viewport.y*density||y1>(viewport.y+viewport.height)*density))){excluded.push({file:capture.file,id,part:metric.part,reason:'ROI outside actual viewport'});continue;}
    const bg=[0,1,2].map(j=>parseInt(entry.color.slice(1+j*2,3+j*2),16));
    if([[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]].some(([x,y])=>bg.some((c,j)=>Math.abs(data[(y*info.width+x)*info.channels+j]-c)>8))){excluded.push({file:capture.file,id,part:metric.part,reason:'ROI background clipped or occluded'});continue;}
    let top=Infinity,bottom=-Infinity,count=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*info.width+x)*info.channels;if(bg.some((c,j)=>Math.abs(data[i+j]-c)>8)){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}
    const bounds=[...metric.text].map(c=>glyphs[metric.face].glyphs[c]).filter(Boolean),ymax=Math.max(...bounds.map(b=>b[3])),ymin=Math.min(...bounds.map(b=>b[1]));
    const expectedTop=f.y*density+(metric.baseline-ymax/1000*metric.size)*ratio,expectedBottom=f.y*density+(metric.baseline-ymin/1000*metric.size)*ratio;
    observations.push({file:capture.file,id,symbol,part:metric.part,text:metric.text,density,scale,inkPixels:{top,bottom,count},expectedInk:{top:expectedTop,bottom:expectedBottom},deltaPixels:{top:top-expectedTop,bottom:bottom+1-expectedBottom}});
   }
  }
 }
 fs.writeFileSync(path.join(__dirname,'raster-measurements.json'),JSON.stringify(observations,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'raster-exclusions.json'),JSON.stringify(excluded,null,2)+'\n');
 for(const symbol of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')for(const part of ['letter','word','guide'])assert(observations.some(o=>/^maximum.*-alphabet/.test(o.file)&&o.symbol===symbol&&o.part===part),`Missing maximum alphabet ${symbol}/${part}`);
 for(const symbol of 'NUWJ359')for(const part of ['letter','word','guide'])assert(observations.some(o=>/^maximum.*-converter/.test(o.file)&&o.symbol===symbol&&o.part===part),`Missing maximum converter ${symbol}/${part}`);
 for(const prefix of ['maximum','dark'])for(const state of ['question','feedback'])for(const part of (state==='question'?['letter']:['letter','word','guide']))assert(observations.some(o=>(o.file.startsWith(prefix+'-')&&o.file.includes('-quiz-'))&&o.file.includes(state)&&o.part===part),`Missing ${prefix} quiz ${state}/${part}`);
 for(const symbol of 'NUWJ')for(const part of ['letter','word','guide'])assert(observations.some(o=>o.file.startsWith('dark-converter')&&o.symbol===symbol&&o.part===part),`Missing default dark converter ${symbol}/${part}`);
 const failed=observations.filter(o=>Object.values(o.deltaPixels).some(d=>Math.abs(d)>2));
 const summary={scaleMethod:'Actual XCTest root width divided by110; pixel-rounded frame inference, not independently exposed raw RN fontScale',baselineMethod:'Pinned-font outline against actual screenshot ink and specified baseline targets; raw onTextLayout baseline events unexposed',passed:failed.length===0,coveragePassed:true,observations:observations.length,passedObservations:observations.length-failed.length,failedObservations:failed.length,maximumAlphabetPairs:78,maximumConverterPairs:21,defaultDarkConverterRequiredPairs:12,quizContexts:4,inkSupportThreshold:'Any RGB channel differs from uniform tile background by >8',envelopePhysicalPixels:2,maximumAbsoluteDelta:Math.max(...observations.flatMap(o=>Object.values(o.deltaPixels).map(Math.abs))),excludedRois:excluded.length,failures:failed};
 fs.writeFileSync(path.join(__dirname,'raster-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
 assert.equal(failed.length,0,'Strict raster envelope failed; retained all failures in raster-summary.json');
})().catch(e=>{console.error(e);process.exitCode=1});
