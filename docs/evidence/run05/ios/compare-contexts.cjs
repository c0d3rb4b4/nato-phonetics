// Compare actual native tile rasters across routes against the alphabet capture.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),assert=require('node:assert/strict');
(async()=>{
 const {NATO_ALPHABET}=await import(path.resolve(__dirname,'../../../../src/data/natoData.js'));
 const frames={},prefixes={};for(const [log,prefix]of [['phone-test.log','phone'],['references-test.log','references']]){if(!fs.existsSync(path.join(__dirname,log)))continue;for(const l of fs.readFileSync(path.join(__dirname,log),'utf8').split('\n')){const m=l.match(/^CAPTUREFRAMES (\S+) (.+)$/);if(m){frames[m[1]]=JSON.parse(m[2]);prefixes[m[1]]=prefix;}}}
 const images={};for(const name of Object.keys(frames)){images[name]=await sharp(path.join(__dirname,'../screenshots/ios',prefixes[name]+'-'+name+'.png')).autoOrient().removeAlpha().raw().toBuffer({resolveWithObject:true});}
 const references={};
 function crop(name,f,header=false,background=null){const im=images[name];const left=Math.round(f.x*3),top=Math.round(f.y*3),width=330,height=header?180:450;
 if(left<0||top<330||left+width>im.info.width||top+height>im.info.height-50)return null;
 if(background){const probes=[[165,10],[5,40],[324,40],[5,height-40],[324,height-40],[165,height-10]];for(const[x,y]of probes){const i=((top+y)*im.info.width+left+x)*3;if(background.some((c,j)=>Math.abs(im.data[i+j]-c)>8))return null;}}
 const b=Buffer.alloc(width*height*3);for(let y=0;y<height;y++)im.data.copy(b,y*width*3,((top+y)*im.info.width+left)*3,((top+y)*im.info.width+left+width)*3);return b;}
 for(const [name,tiles]of Object.entries(frames)){if(!name.startsWith('alphabet-')||name.includes('landscape'))continue;for(const[id,f]of Object.entries(tiles)){if(!/^alphabet-[A-Z]$/.test(id)||references[id.slice(-1)])continue;const entry=NATO_ALPHABET.find(e=>e.letter===id.slice(-1));const bg=[0,1,2].map(i=>parseInt(entry.color.slice(1+i*2,3+i*2),16));const image=crop(name,f,false,bg);if(image)references[id.slice(-1)]={name,image};}}
 const results=[];
 for(const name of ['converter-light','quiz-question-light','quiz-feedback-light','alphabet-dark']){
 for(const[id,f]of Object.entries(frames[name])){
  if(name==='converter-light' && Number(id.slice(10))>3)continue;
  const image=crop(name,f,name==='quiz-question-light');if(!image)continue;
  const im=images[name];const ix=((Math.round(f.y*3)+195)*im.info.width+Math.round(f.x*3)+165)*3;const rgb=[...im.data.subarray(ix,ix+3)];
  const entry=NATO_ALPHABET.find(e=>{const hex=e.color.slice(1);return rgb.every((v,i)=>Math.abs(v-parseInt(hex.slice(i*2,i*2+2),16))<2)});if(!entry)continue;
  const bg=[0,1,2].map(i=>parseInt(entry.color.slice(1+i*2,3+i*2),16));if(!crop(name,f,name==='quiz-question-light',bg))continue;
  const ref=references[entry.letter];if(!ref)throw Error('Missing reference '+entry.letter);
  let changed=0,max=0,total=0,pixels=0;for(let i=0;i<image.length;i+=3){const x=(i/3)%330,y=Math.floor(i/3/330),height=image.length/3/330;
  if(name==='alphabet-dark'){if((x<36||x>329-36)&&(y<36||y>height-1-36)){const dx=x<(330/2)?x-36:x-(329-36),dy=y<(height/2)?y-36:y-(height-1-36);if(dx*dx+dy*dy>=34*34)continue;} }
  pixels++;let d=0;for(let c=0;c<3;c++){const n=Math.abs(image[i+c]-ref.image[i+c]);d=Math.max(d,n);max=Math.max(max,n);total+=n}if(d>8)changed++;}
  results.push({capture:name,id,symbol:entry.letter,reference:ref.name,region:name==='quiz-question-light'?'header':'full tile',changedPixels:changed,totalPixels:pixels,changedFraction:changed/pixels,maximumChannelDelta:max,meanChannelDelta:total/(pixels*3)});
 }}
 fs.writeFileSync(path.join(__dirname,'context-raster-comparison.json'),JSON.stringify(results,null,2)+'\n');const required=[...['N','U','W','J'].map(symbol=>['converter-light',symbol]),['quiz-question-light',null],['quiz-feedback-light',null],...['A','B','C','D','E','F','G','H','I'].map(symbol=>['alphabet-dark',symbol])];
 for(const[capture,symbol]of required)assert(results.some(r=>r.capture===capture&&(symbol===null||r.symbol===symbol)),`Missing native comparison ${capture}/${symbol}`);
 for(const r of results)assert.equal(r.changedPixels,0,`Native raster mismatch ${r.capture}/${r.id}: ${r.changedPixels} pixels exceed8-channel threshold`);
 console.log(JSON.stringify({passed:true,comparisons:results.length,requiredComparisons:required.length,thresholdPerRgbChannel:8}));
})().catch(error=>{console.error(error);process.exitCode=1;});
