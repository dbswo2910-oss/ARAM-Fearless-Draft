'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
const BASE='99e65c90d930d2bd2e0b9297518d0657b6c8e399';
const manifest=JSON.parse(cp.execFileSync('git',['show',`${BASE}:update/manifest.json`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}));
const sourceByTarget=new Map((manifest.files||[]).map(x=>[String(x.path),String(x.source||'')]));
const pkgRow=(manifest.files||[]).find(x=>x.path==='package.json');
const pkg=JSON.parse(cp.execFileSync('git',['show',`${BASE}:${pkgRow.source}`],{cwd:ROOT,encoding:'utf8'}));
const show=rel=>cp.execFileSync('git',['show',`${BASE}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});

function inspect(target){
  const source=sourceByTarget.get(target);if(!source)throw new Error(`missing target ${target}`);
  const text=show(source);
  const baseTarget=(text.match(/basePath\s*=\s*path\.join\(__dirname,\s*['"]([^'"]+)['"]\)/)||[])[1]||null;
  const bindings=new Map();
  for(const m of text.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(['"]([^'"]+)['"]\)/g))bindings.set(m[1],m[2]);
  const lines=text.split(/\r?\n/);
  const signals=[];
  const add=(kind,lineNo,line,detail={})=>signals.push({kind,line:lineNo,text:line.trim().slice(0,500),...detail});
  lines.forEach((line,i)=>{
    const n=i+1;
    if(/\b(app|ipcMain|BrowserWindow|nativeTheme)\.(on|once|handle|setPath|disableHardwareAcceleration)\s*\(/.test(line))add('electron-side-effect',n,line);
    if(/\bfs\.(writeFileSync|copyFileSync|renameSync|unlinkSync|rmSync|mkdirSync)\s*\(/.test(line))add('filesystem-side-effect',n,line);
    for(const [name,request] of bindings){
      const assign=new RegExp(`\\b${name}\\.([A-Za-z_$][\\w$]*)\\s*=(?!=)`);
      const am=line.match(assign);if(am)add('required-module-mutation',n,line,{binding:name,request,property:am[1]});
      const call=new RegExp(`\\b${name}\\.([A-Za-z_$][\\w$]*)\\s*\\(`);
      const cm=line.match(call);if(cm)add('required-module-call',n,line,{binding:name,request,method:cm[1]});
    }
    const rm=line.match(/require\(['"]([^'"]+)['"]\)\.([A-Za-z_$][\w$]*)\s*\(/);if(rm)add('inline-require-call',n,line,{request:rm[1],method:rm[2]});
  });
  return{target,source,baseTarget,bindings:Object.fromEntries(bindings),signals};
}

const rows=[];const seen=new Set();let target=String(pkg.main||'');
while(target&&sourceByTarget.has(target)&&!seen.has(target)){
  seen.add(target);const row=inspect(target);rows.push(row);target=row.baseTarget;
}
const wrappers=rows.filter(x=>x.baseTarget);
const mutations=wrappers.flatMap(x=>x.signals.filter(s=>s.kind==='required-module-mutation').map(s=>({target:x.target,...s})));
const calls=wrappers.flatMap(x=>x.signals.filter(s=>['required-module-call','inline-require-call','electron-side-effect','filesystem-side-effect'].includes(s.kind)).map(s=>({target:x.target,...s})));
const report={status:'SUCCESS',stage:'V0170_WRAPPER_SIDE_EFFECT_AUDIT',baseRelease:'0.16.3',wrapperCount:wrappers.length,requiredModuleMutations:mutations,sideEffectCalls:calls,rows:wrappers.filter(x=>x.signals.length)};
const outDir=path.join(ROOT,'audit-output','consolidation');fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'v0170-wrapper-side-effects.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,wrapperCount:report.wrapperCount,mutationCount:mutations.length,mutations,callCount:calls.length,callTargets:[...new Set(calls.map(x=>x.target))]},null,2));
