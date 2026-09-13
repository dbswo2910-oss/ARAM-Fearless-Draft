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
    const n=next.split(oldText).length-1;
    if(n!==1)throw new Error(`${rel}: expected exactly one ${label} anchor, found ${n}`);
    next=next.replace(oldText,newText);
  }
  try{new Function(next)}catch(e){throw new Error(`${rel}: patched source parse failed: ${e.message}`)}
  if(next===src)throw new Error(`${rel}: patch produced no change`);
  if(!checkOnly)fs.writeFileSync(file,next,'utf8');
  return{file:rel,changed:true,mode:checkOnly?'check':'apply'};
}

const oldCollector='update/v0.15.117/riot-grade-collector-v01532.js';
const newCollector='update/v0.15.122/riot-grade-collector-v01532.js';
const results=[];

results.push(patchFile('tools/v015117-state-integrity-audit.js',[
  {
    label:'v117 successor grade source declaration',
    oldText:`    const preserved={\n      'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',`,
    newText:`    const gradeCollectorSource=Number(m[1])>=122?'${newCollector}':'${oldCollector}';\n    const preserved={\n      'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',`
  },
  {
    label:'v117 successor grade source value',
    oldText:`      'riot-grade-collector-v01532.js':'${oldCollector}',\n      'runtime-source-stability-v015117.js':'update/v0.15.117/runtime-source-stability-v015117.js',`,
    newText:`      'riot-grade-collector-v01532.js':gradeCollectorSource,\n      'runtime-source-stability-v015117.js':'update/v0.15.117/runtime-source-stability-v015117.js',`
  }
]));

results.push(patchFile('tools/v015118-resource-lifecycle-audit.js',[
  {
    label:'v118 successor grade source declaration',
    oldText:`else if(ge(active,'0.15.119')){\n  const uiOwnerSource=ge(active,'0.15.120')?'update/v0.15.120/ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js';\n  const preserved={`,
    newText:`else if(ge(active,'0.15.119')){\n  const uiOwnerSource=ge(active,'0.15.120')?'update/v0.15.120/ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js';\n  const gradeCollectorSource=ge(active,'0.15.122')?'${newCollector}':'${oldCollector}';\n  const preserved={`
  },
  {
    label:'v118 successor grade source value',
    oldText:`    'preload.js':'update/v0.15.117/preload.js',\n    'riot-grade-collector-v01532.js':'${oldCollector}'\n  };`,
    newText:`    'preload.js':'update/v0.15.117/preload.js',\n    'riot-grade-collector-v01532.js':gradeCollectorSource\n  };`
  }
]));

console.log(`v0.15.122 SUCCESSOR GRADE AUDIT CONTRACT: ${checkOnly?'CHECK SUCCESS':'APPLY SUCCESS'}`);
for(const r of results)console.log(JSON.stringify(r));
