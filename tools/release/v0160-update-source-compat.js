'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
const MANIFEST=path.join(ROOT,'update','manifest.json');
const PAYLOAD_ROOT=path.join(ROOT,'update','v0.16.0','canonical','src');
const SRC_ROOT=path.join(ROOT,'src');
const RECORD=path.join(ROOT,'release','v0.16.0-update-transport-hotfix.json');
const APPLY=process.argv.includes('--apply');
const ORIGINAL_PRODUCTION_COMMIT='feb7cb0e62a3f862a484f521b7f3914561410990';
const ORIGINAL_MANIFEST_SHA256='d7636e64663ea667da4b74bfd1d31649564f3656f5e8a048ca4293596b013bbe';

function walk(dir,base=dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p,base,out);else if(ent.isFile())out.push(path.relative(base,p).replace(/\\/g,'/'));
  }
  return out;
}
const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha256=p=>shaBytes(fs.readFileSync(p));
function copyTree(src,dst){
  fs.rmSync(dst,{recursive:true,force:true});
  fs.mkdirSync(dst,{recursive:true});
  for(const rel of walk(src)){
    const a=path.join(src,...rel.split('/')),b=path.join(dst,...rel.split('/'));
    fs.mkdirSync(path.dirname(b),{recursive:true});
    fs.copyFileSync(a,b);
  }
}
function semantic(m){
  return JSON.stringify({
    version:m.version,
    min_launcher:m.min_launcher,
    files:(m.files||[]).map(x=>({path:x.path,sha256:String(x.sha256||'').toLowerCase()})),
    delete:Array.isArray(m.delete)?m.delete:[]
  });
}
function gitShow(rel){return cp.execFileSync('git',['show',`${ORIGINAL_PRODUCTION_COMMIT}:${rel}`],{cwd:ROOT});}

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8').replace(/^\uFEFF/,''));
if(manifest.version!=='0.16.0')throw new Error(`expected production manifest 0.16.0, got ${manifest.version}`);
const originalBytes=gitShow('update/manifest.json');
if(shaBytes(originalBytes)!==ORIGINAL_MANIFEST_SHA256)throw new Error('original production manifest fingerprint drifted');
const original=JSON.parse(originalBytes.toString('utf8').replace(/^\uFEFF/,''));
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
if(semantic(checkManifest)!==semantic(original))throw new Error('runtime target/SHA payload drifted from original v0.16 production manifest');
const invalid=checkManifest.files.filter(x=>!String(x.source||'').startsWith('update/'));
if(invalid.length)throw new Error('blocked source remains: '+invalid.map(x=>x.source).join(', '));
const transported=checkManifest.files.filter(x=>String(x.path||'').startsWith('canonical/src/')&&String(x.source||'').startsWith('update/v0.16.0/canonical/src/'));
if(transported.length!==82)throw new Error(`expected 82 transported canonical JS/source entries, got ${transported.length}`);
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
const currentManifestSha=sha256(MANIFEST);
const semanticSha=shaBytes(Buffer.from(semantic(checkManifest),'utf8'));
const record={
  schema:1,
  stage:'V0160_UPDATE_TRANSPORT_COMPAT_HOTFIX',
  release:'0.16.0',
  reason:'v0.15.135 secure updater requires every manifest source to remain under update/',
  original_production_commit:ORIGINAL_PRODUCTION_COMMIT,
  original_production_manifest_sha256:ORIGINAL_MANIFEST_SHA256,
  current_transport_manifest_sha256:currentManifestSha,
  semantic_runtime_payload_sha256:semanticSha,
  canonical_sources_repackaged:transported.length,
  runtime_targets_or_sha_changed:false,
  updater_security_relaxed:false,
  legacy_removal:false,
  rating_logic_changed:false,
  research_checkpoint_changed:false
};
if(APPLY){
  fs.mkdirSync(path.dirname(RECORD),{recursive:true});
  fs.writeFileSync(RECORD,JSON.stringify(record,null,2)+'\n','utf8');
}else{
  if(!fs.existsSync(RECORD))throw new Error('transport hotfix evidence record missing');
  const saved=JSON.parse(fs.readFileSync(RECORD,'utf8').replace(/^\uFEFF/,''));
  if(saved.current_transport_manifest_sha256!==currentManifestSha||saved.semantic_runtime_payload_sha256!==semanticSha||saved.updater_security_relaxed!==false)throw new Error('transport hotfix evidence record drifted');
}
console.log(JSON.stringify({status:'SUCCESS',mode:APPLY?'apply':'check',version:manifest.version,total_files:files.length,rewritten_src_sources:srcBacked.length,canonical_sources_repackaged:transported.length,unexpected_non_update_sources:unexpected.length,all_sources_update_prefixed:invalid.length===0,verified_files:verified,payload_files:fs.existsSync(PAYLOAD_ROOT)?walk(PAYLOAD_ROOT).length:0,runtime_payload_semantically_identical:true,security_relaxed:false,current_manifest_sha256:currentManifestSha},null,2));
