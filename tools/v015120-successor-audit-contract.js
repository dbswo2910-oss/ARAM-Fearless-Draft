'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const checkOnly=process.argv.includes('--check');

function patchFile(rel,patches){
  const file=path.join(ROOT,rel);
  let src=fs.readFileSync(file,'utf8');
  let next=src;
  for(const {oldText,newText,label} of patches){
    const count=next.split(oldText).length-1;
    if(count!==1)throw new Error(`${rel}: expected exactly one ${label} anchor, found ${count}`);
    next=next.replace(oldText,newText);
  }
  try{new Function(next)}catch(e){throw new Error(`${rel}: patched source parse failed: ${e.message}`)}
  if(next===src)throw new Error(`${rel}: patch produced no change`);
  if(!checkOnly)fs.writeFileSync(file,next,'utf8');
  return{file:rel,changed:true,mode:checkOnly?'check':'apply'};
}

const ui115='update/v0.15.115/ui-stability-baseline-v015115.js';
const ui120='update/v0.15.120/ui-stability-baseline-v015115.js';

const results=[];
results.push(patchFile('tools/v015118-resource-lifecycle-audit.js',[{
  label:'v0.15.118 successor UI-owner source contract',
  oldText:`else if(ge(active,'0.15.119')){\n  const preserved={\n    'resource-lifecycle-v015118.js':'update/v0.15.118/resource-lifecycle-v015118.js',\n    'ui-stability-baseline-v015115.js':'${ui115}',`,
  newText:`else if(ge(active,'0.15.119')){\n  const uiOwnerSource=ge(active,'0.15.120')?'${ui120}':'${ui115}';\n  const preserved={\n    'resource-lifecycle-v015118.js':'update/v0.15.118/resource-lifecycle-v015118.js',\n    'ui-stability-baseline-v015115.js':uiOwnerSource,`
}]));

results.push(patchFile('tools/v015117-state-integrity-audit.js',[{
  label:'v0.15.117 successor UI-owner source contract',
  oldText:`    if(map.get('ui-stability-baseline-v015115.js')!=='${ui115}')throw new Error('v0.15.115 UI owner unexpectedly replaced by successor');`,
  newText:`    const uiOwnerSource=Number(m[1])>=120?'${ui120}':'${ui115}';\n    if(map.get('ui-stability-baseline-v015115.js')!==uiOwnerSource)throw new Error('v0.15.115 DATA owner source was replaced by an unapproved successor path');`
}]));

console.log(`v0.15.120 SUCCESSOR AUDIT CONTRACT: ${checkOnly?'CHECK SUCCESS':'APPLY SUCCESS'}`);
for(const r of results)console.log(JSON.stringify(r));
