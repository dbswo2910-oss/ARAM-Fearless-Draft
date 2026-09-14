'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(process.cwd(),'src');
const OUT=path.resolve(process.argv[2]||'audit-output/rc/v0160-rc1/canonical-browser-bundle.js');
const ENTRIES=Object.freeze({
  data:'data/owner.js',
  diagnostics:'diagnostics/owner.js',
  research:'research/owner.js',
  profile:'profile/owner.js',
  randomPickRender:'random/pick/render-core.js'
});
const modules=new Map();
function norm(p){return p.split(path.sep).join('/')}
function resolve(fromId,request){
  const base=path.resolve(ROOT,path.dirname(fromId),request);
  const candidates=[base,`${base}.js`,path.join(base,'index.js')];
  const found=candidates.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());
  if(!found)throw new Error(`cannot resolve ${request} from ${fromId}`);
  if(!found.startsWith(ROOT+path.sep))throw new Error(`module escaped src root: ${request}`);
  return norm(path.relative(ROOT,found));
}
function visit(id){
  if(modules.has(id))return;
  const abs=path.join(ROOT,id);let source=fs.readFileSync(abs,'utf8');
  const external=[...source.matchAll(/require\(\s*(['"])([^'"]+)\1\s*\)/g)].map(x=>x[2]).filter(x=>!x.startsWith('.'));
  if(external.length)throw new Error(`browser RC entry ${id} depends on external modules: ${[...new Set(external)].join(', ')}`);
  const deps=[];
  source=source.replace(/require\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g,(_m,_q,req)=>{
    const child=resolve(id,req);deps.push(child);return `__require(${JSON.stringify(child)})`;
  });
  modules.set(id,source);for(const child of deps)visit(child);
}
for(const id of Object.values(ENTRIES))visit(id);
const moduleTable=[...modules.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,source])=>`${JSON.stringify(id)}:function(module,exports,__require){\n${source}\n}`).join(',\n');
const entryTable=Object.entries(ENTRIES).map(([name,id])=>`${JSON.stringify(name)}:__require(${JSON.stringify(id)})`).join(',\n');
const bundle=`(function(global){\n'use strict';\nconst __modules={\n${moduleTable}\n};\nconst __cache=Object.create(null);\nfunction __require(id){if(__cache[id])return __cache[id].exports;const fn=__modules[id];if(!fn)throw new Error('canonical RC module missing: '+id);const module={exports:{}};__cache[id]=module;fn(module,module.exports,__require);return module.exports;}\nconst api={\n${entryTable}\n};\nObject.defineProperty(api,'__rc',{value:Object.freeze({version:'0.16.0-rc.1',moduleCount:Object.keys(__modules).length,production:false}),enumerable:true});\nglobal.__ARAM_V0160_CANONICAL__=Object.freeze(api);\n})(globalThis);\n`;
fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,bundle,'utf8');
const report={status:'SUCCESS',rc:'0.16.0-rc.1',output:OUT,module_count:modules.size,entries:ENTRIES,external_dependencies:0};
const reportPath=path.resolve('audit-output/rc/v0160-rc1/browser-bundle-report.json');fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8');
console.log('V0.16 RC1 CANONICAL BROWSER BUNDLE: SUCCESS',JSON.stringify(report));
