'use strict';

const fs=require('fs');
const path=require('path');

function exists(p){return typeof p==='string'&&p.length>0&&fs.existsSync(p)}

function resolveRequireSource(fromAbs,spec){
  if(typeof spec!=='string'||!spec.startsWith('.'))return null;
  const base=path.resolve(path.dirname(fromAbs),spec);
  for(const candidate of [base,base+'.js',path.join(base,'index.js')]){
    if(exists(candidate)&&fs.statSync(candidate).isFile())return candidate;
  }
  return null;
}

function resolveCurrentLoaderLineage(root,manifest,startTarget='runtime-loader-v01579.js'){
  const files=Array.isArray(manifest?.files)?manifest.files:[];
  const byPath=new Map(files.map(x=>[String(x.path||''),String(x.source||'')]));
  const startSource=byPath.get(startTarget);
  if(!startSource)throw new Error(`loader target is not delivered: ${startTarget}`);
  let current=path.join(root,startSource),depth=0;
  const out=[],seen=new Set();
  while(exists(current)&&!seen.has(current)&&depth++<64){
    seen.add(current);
    const text=fs.readFileSync(current,'utf8');
    const source=path.relative(root,current).replace(/\\/g,'/');
    out.push({source,text});
    const specs=[...text.matchAll(/require\(['"]([^'"]*runtime-loader[^'"]*)['"]\)/g)].map(m=>m[1]);
    let next=null;
    for(const spec of specs){
      const resolved=resolveRequireSource(current,spec);
      if(resolved&&!seen.has(resolved)){next=resolved;break}
    }
    if(!next)break;
    current=next;
  }
  return out;
}

module.exports={resolveCurrentLoaderLineage};
