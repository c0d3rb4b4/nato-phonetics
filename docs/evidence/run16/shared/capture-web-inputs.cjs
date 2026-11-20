// Run the unchanged production build options, retaining its actual esbuild graph.
const fs = require('node:fs'), path = require('node:path'), {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../../../..'), script=path.join(root,'scripts/build-web.cjs');
const original=createRequire(script), esbuild=original('esbuild');
const capture=async options=>{const result=await esbuild.build(options);fs.writeFileSync(path.join(__dirname,'web-metafile.json'),JSON.stringify(result.metafile,null,2)+'\n');return result;};
const wrappedRequire=name=>name==='esbuild'?{...esbuild,build:capture}:original(name);
new Function('require','__dirname',fs.readFileSync(script,'utf8'))(wrappedRequire,path.dirname(script));
