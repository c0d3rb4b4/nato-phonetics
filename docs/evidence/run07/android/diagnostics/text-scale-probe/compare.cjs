const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = __dirname;
const read = name => JSON.parse(fs.readFileSync(path.join(root, `${name}.json`)));
const rows = data => Object.fromEntries(data.layout.values.filter(r => r.testID).map(r => [r.testID,r]));
const latest = (data, kind, name) => data.probe.events.filter(e=>e.kind===kind&&e.name===name).at(-1);
async function ink(name, frame, density) {
  const left=Math.round(frame.pageX*density), top=Math.round(frame.pageY*density);
  const width=Math.round(frame.width*density),height=Math.round(frame.height*density);
  const {data,info}=await sharp(path.join(root,'screenshots',`${name}.png`))
    .extract({left,top,width,height}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=width,y0=height,x1=-1,y1=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=(y*width+x)*info.channels;
    if(Math.min(data[p],data[p+1],data[p+2])<160){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  }
  if(x1<0)throw new Error(`No ink ${name}`);
  const occupied=[];
  for(let y=y0;y<=y1;y++){
    let count=0;
    for(let x=x0;x<=x1;x++)if(data[(y*width+x)*info.channels]<160)count++;
    occupied.push(count);
  }
  return {width:x1-x0+1,height:y1-y0+1,occupiedRows:occupied};
}
(async()=>{
  const observations=[];
  const live=['live-0-scale1','live-1-scale2','live-2-scale1','live-3-scale0.85','live-4-scale1.3','live-5-scale2','live-6-scale1'];
  for(const name of live){
    const actual=read(name),scale=Number(actual.probe.dimensions.fontScale.toFixed(2));
    const coldName=`cold-scale${scale}`,cold=read(coldName),a=rows(actual),c=rows(cold);
    for(const example of ['body','heading','feedback','nested','input']){
      const ar=a[`candidate-${example}`],cr=c[`control-${example}`];
      if(!ar||!cr)throw new Error(`Missing ${example} ${name}`);
      const frameDelta={width:ar.frame.width-cr.frame.width,height:ar.frame.height-cr.frame.height};
      const event=latest(actual,'candidate',example),reference=latest(cold,'control',example);
      const eventEquivalent=JSON.stringify(event?.lines??event?.size)===JSON.stringify(reference?.lines??reference?.size);
      let raster=null;
      if(example!=='input'){
        const ai=await ink(name,ar.frame,actual.probe.dimensions.scale),ci=await ink(coldName,cr.frame,cold.probe.dimensions.scale);
        raster={actual:ai,reference:ci,same:JSON.stringify(ai)===JSON.stringify(ci)};
      }
      const passed=Math.abs(frameDelta.width)<.01&&Math.abs(frameDelta.height)<.01&&eventEquivalent&&(raster?.same??true);
      observations.push({name,scale,example,mounts:actual.probe.mounts,frameDelta,eventEquivalent,event,reference,raster,passed});
    }
  }
  const result={passed:observations.every(x=>x.passed&&x.mounts===1),observations};
  fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({passed:result.passed,observations:observations.length,failures:observations.filter(x=>!x.passed).map(({name,example,frameDelta,eventEquivalent,raster})=>({name,example,frameDelta,eventEquivalent,rasterSame:raster?.same}))},null,2));
  process.exitCode=result.passed?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;});
