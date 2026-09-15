'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'..');
const sourcePath=path.join(__dirname,'v015117-state-integrity-audit.js');
const tempPath=path.join(__dirname,'.v015117-state-integrity-audit-v016-runtime.js');
let src=fs.readFileSync(sourcePath,'utf8');

const oldDecl="const m=active.match(/^0\\.15\\.(\\d+)$/),successor=m&&Number(m[1])>117;";
const newDecl="const m=active.match(/^0\\.15\\.(\\d+)$/),patch=m?Number(m[1]):null,successor=(patch!==null&&patch>117)||/^0\\.16\\.\\d+$/.test(active),successorRank=patch===null?Number.MAX_SAFE_INTEGER:patch;";
if(src.includes(oldDecl)) src=src.replace(oldDecl,newDecl);
else if(!src.includes('successorRank=patch===null?Number.MAX_SAFE_INTEGER:patch')) throw new Error('v0.15.117 successor declaration contract drifted');

const replacements=[
  ["Number(m[1])>=122",'successorRank>=122'],
  ["Number(m[1])>=120",'successorRank>=120']
];
for(const [from,to] of replacements){
  if(src.includes(from)) src=src.split(from).join(to);
  else if(!src.includes(to)) throw new Error(`v0.15.117 successor threshold contract drifted: ${from}`);
}

fs.writeFileSync(tempPath,src,'utf8');
try{
  const r=cp.spawnSync(process.execPath,[tempPath],{cwd:ROOT,stdio:'inherit',env:process.env});
  if(r.error)throw r.error;
  if(r.status!==0)process.exit(r.status||1);
}finally{
  fs.rmSync(tempPath,{force:true});
}
