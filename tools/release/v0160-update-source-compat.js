'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const ROOT=path.resolve(__dirname,'../..');
const MANIFEST=path.join(ROOT,'update','manifest.json');
const PAYLOAD_ROOT=path.join(ROOT,'update','v0.16.0','canonical','src');
const SRC_ROOT=path.join(ROOT,'src');
const APPLY=process.argv.includes('--apply');

function walk(dir,base=dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p,base,out);else if(ent.isFile())out.push(path.relative(base,p).replace(/\\/g,'/'));
  }
  return out;
}
function sha256(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function copyTree(src,dst){
  fs.rmSync(dst,{recursive:true,force:true});
  fs.mkdirSync(dst,{recursive:true});
  for(const rel of walk(src)){
    const a=path.join(src,...rel.split('/')),b=path.join(dst,...rel.split('/'));
    fs.mkdirSync(path.dirname(b),{recursive:true});
    fs.copyFileSync(a,b);
  }
}

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8').replace(/^\uFEFF/,''));
if(manifest.version!=='0.16.0')throw new Error(`expected production manifest 0.16.0, got ${manifest.version}`);
const files=Array.isArray(manifest.files)?manifest.files:[];
const beforeNonUpdate=files.filter(x=>!String(x.source||'').startsWith('update/'));
const srcBacked=beforeNonUpdate.filter(x=>String(x.source||'').startsWith('src/'));
const unexpected=beforeNonUpdate.filter(x=>!String(x.source||'').startsWith('src/'));
if(unexpected.length)throw new Error('unexpected non-update source(s): '+unexpected.map(x=>x.source).join(', '));

for(const f of srcBacked){
  const source=String(f.source);
  const expectedPath='canonical/'+source;
  if(String(f.path)!==expectedPath)throw new Error(`canonical destination mismatch: ${f.path} <- ${source}`);
  f.source='update/v0.16.0/canonical/'+source;
}

if(APPLY){
  copyTree(SRC_ROOT,PAYLOAD_ROOT);
  fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n','utf8');
}

const checkManifest=APPLY?JSON.parse(fs.readFileSync(MANIFEST,'utf8')):manifest;
const invalid=checkManifest.files.filter(x=>!String(x.source||'').startsWith('update/'));
if(invalid.length)throw new Error('blocked source remains: '+invalid.map(x=>x.source).join(', '));
let verified=0;
for(const f of checkManifest.files){
  const source=String(f.source||'');
  const local=path.join(ROOT,...source.split('/'));
  if(!fs.existsSync(local))throw new Error(`manifest source missing: ${source}`);
  if(f.sha256){
    const got=sha256(local),want=String(f.sha256).toLowerCase();
    if(got!==want)throw new Error(`sha256 mismatch: ${source}`);
  }
  verified++;
}
console.log(JSON.stringify({status:'SUCCESS',mode:APPLY?'apply':'check',version:manifest.version,total_files:files.length,rewritten_src_sources:srcBacked.length,unexpected_non_update_sources:unexpected.length,all_sources_update_prefixed:invalid.length===0,verified_files:verified,payload_files:APPLY?walk(PAYLOAD_ROOT).length:null,security_relaxed:false},null,2));
