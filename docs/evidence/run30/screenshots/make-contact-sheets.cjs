// Inspection derivatives only. Actual evidence PNGs remain unchanged.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
(async()=>{
 const directory=path.join(__dirname,'android');
 const captures=JSON.parse(fs.readFileSync(path.join(directory,'metadata.json')));
 const records=[];
 for(let i=0;i<captures.length;i+=3){
  const group=captures.slice(i,i+3),layers=[];
  for(let j=0;j<group.length;j++){
   const row=group[j];const png=await sharp(path.join(directory,row.file)).resize({width:300,height:667,fit:'contain',background:'#ddd'}).png().toBuffer();
   layers.push({input:png,left:j*300,top:35});
   const label=row.file.replace('.png','');
   layers.push({input:Buffer.from(`<svg width="300" height="35"><text x="4" y="14" font-size="10">${label}</text><text x="4" y="29" font-size="10">${row.width}x${row.height} / ${row.theme} / font ${row.fontScale}</text></svg>`),left:j*300,top:0});
  }
  const name=`inspection-${Math.floor(i/3)+1}.jpg`;
  await sharp({create:{width:900,height:702,channels:3,background:'#eee'}}).composite(layers).jpeg({quality:90}).toFile(path.join(__dirname,name));
  records.push({sheet:name,actualCaptures:group.map(r=>r.file),status:'pending visual inspection'});
 }
 fs.writeFileSync(path.join(__dirname,'inspection.json'),JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify({actualCaptures:captures.length,inspectionSheets:records.length}));
})().catch(e=>{console.error(e);process.exitCode=1});
