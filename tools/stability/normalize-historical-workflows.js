'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const DIR=path.join(ROOT,'.github','workflows');
const marker='# HISTORICAL_MANUAL_ONLY_V0160';
function versionOf(name){const m=String(name).match(/(?:v0\.15\.|v015)(\d{1,3})/i);return m?Number(m[1]):null}
function replaceOnBlock(src){
  const lines=String(src).replace(/\r\n/g,'\n').split('\n');
  const start=lines.findIndex(l=>/^on\s*:/.test(l));
  if(start<0)throw new Error('workflow has no top-level on: block');
  let end=start+1;
  while(end<lines.length){const line=lines[end];if(line&&/^\S/.test(line)&&/^[A-Za-z0-9_-]+\s*:/.test(line))break;end++}
  const old=lines.slice(start,end).join('\n');
  const keepCall=/workflow_call\s*:/.test(old);
  const next=['on:','  workflow_dispatch:',...(keepCall?['  workflow_call:']:[])];
  lines.splice(start,end-start,...next);
  if(!lines.includes(marker))lines.splice(start,0,marker);
  return lines.join('\n');
}
const changed=[];const skipped=[];
for(const name of fs.readdirSync(DIR).filter(x=>/\.ya?ml$/i.test(x)).sort()){
  const v=versionOf(name);if(v===null||v>=135){skipped.push({name,reason:'current-or-unversioned'});continue}
  const file=path.join(DIR,name),src=fs.readFileSync(file,'utf8');
  if(src.includes(marker)&&!/\n\s*(push|pull_request|schedule)\s*:/.test('\n'+src)){skipped.push({name,reason:'already-manual-only'});continue}
  const out=replaceOnBlock(src);
  fs.writeFileSync(file,out.endsWith('\n')?out:out+'\n','utf8');changed.push({name,version:v});
}
const report={schema:1,status:'SUCCESS',changed_count:changed.length,changed,skipped_count:skipped.length,policy:'All version-pinned v0.15.<135 standalone workflows are historical/manual-only. Their audit scripts may still run from current functional suites.'};
fs.mkdirSync(path.join(ROOT,'audit-output','stability'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output','stability','historical-workflow-normalization.json'),JSON.stringify(report,null,2)+'\n');
console.log('HISTORICAL WORKFLOW NORMALIZATION:',changed.length,'converted to manual-only');
