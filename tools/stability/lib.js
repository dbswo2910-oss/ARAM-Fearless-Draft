'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const child=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
const p=(...x)=>path.join(ROOT,...x);
const exists=x=>fs.existsSync(p(x));
const read=x=>fs.readFileSync(p(x),'utf8');
const json=x=>JSON.parse(read(x));
const shaFile=x=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');
const mkdir=x=>fs.mkdirSync(p(x),{recursive:true});
const write=(x,v)=>{fs.mkdirSync(path.dirname(p(x)),{recursive:true});fs.writeFileSync(p(x),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8')};
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const uniq=a=>[...new Set(a)];
function walk(rel=''){
  const abs=p(rel);
  if(!fs.existsSync(abs))return[];
  const out=[];
  for(const e of fs.readdirSync(abs,{withFileTypes:true})){
    const r=path.posix.join(rel.replaceAll('\\','/'),e.name);
    if(r==='.git'||r.startsWith('.git/')||r==='audit-output'||r.startsWith('audit-output/')||r==='node_modules'||r.startsWith('node_modules/'))continue;
    if(e.isDirectory())out.push(...walk(r));else out.push(r);
  }
  return out.sort();
}
function git(args,opts={}){
  try{return child.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts}).trim()}catch(e){return''}
}
function resolveRelative(from,spec){
  if(!spec.startsWith('.'))return null;
  const base=path.resolve(path.dirname(p(from)),spec);
  const candidates=[base,base+'.js',base+'.json',path.join(base,'index.js')];
  const found=candidates.find(fs.existsSync);
  return found?path.relative(ROOT,found).replaceAll('\\','/'):null;
}
function staticDeps(rel){
  if(!/\.(?:js|cjs|mjs)$/.test(rel)||!exists(rel))return[];
  const src=read(rel),deps=[];
  for(const m of src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)){
    const r=resolveRelative(rel,m[1]);if(r)deps.push(r);
  }
  for(const m of src.matchAll(/path\.join\(\s*__dirname\s*,([^\)]*)\)/g)){
    const bits=[...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);
    if(!bits.length)continue;
    const abs=path.resolve(path.dirname(p(rel)),...bits),cand=[abs,abs+'.js',abs+'.json'];
    const found=cand.find(fs.existsSync);if(found)deps.push(path.relative(ROOT,found).replaceAll('\\','/'));
  }
  return uniq(deps);
}
function dependencyClosure(seeds){
  const seen=new Set(),edges=[];const q=[...seeds];
  while(q.length){const f=q.shift();if(!f||seen.has(f)||!exists(f))continue;seen.add(f);for(const d of staticDeps(f)){edges.push([f,d]);if(!seen.has(d))q.push(d)}}
  return{files:[...seen].sort(),edges};
}
module.exports={ROOT,p,exists,read,json,shaFile,mkdir,write,must,uniq,walk,git,resolveRelative,staticDeps,dependencyClosure};
