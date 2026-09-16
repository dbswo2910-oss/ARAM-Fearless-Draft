'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p).replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}return true};
const must=(s,n,l)=>{if(!String(s).includes(n))throw new Error(`v0.15.135 successor audit missing ${l}: ${n}`)};

const manifest=json('update/manifest.json');
if(!ge(manifest.version,'0.15.136'))throw new Error(`successor audit requires version newer than v0.15.135, got ${manifest.version}`);
if(String(manifest.min_launcher)!=='2.0.2')throw new Error(`min_launcher drifted from Golden contract: ${manifest.min_launcher}`);

const p134=json('update/v0.15.134/package.json');
const p135=json('update/v0.15.135/package.json');
if(p135.name!==p134.name||p135.name!=='aram-fearless-draft')throw new Error('v0.15.135 stable Electron identity changed');
if(p135.version!=='0.15.135'||p135.main!=='main-v015135.js')throw new Error('v0.15.135 historical package metadata changed');

const main135=read('update/v0.15.135/main-v015135.js');
must(main135,"STABLE_APP_ID='aram-fearless-draft'",'stable app id');
must(main135,"app.setPath('userData',stable)",'stable userData pin');
if(main135.indexOf("app.setPath('userData',stable)")>main135.indexOf('module._compile'))throw new Error('v0.15.135 userData pin moved after compile');

const runtime=require('../update/v0.15.135/runtime-source-stability-v015135.js');
if(runtime.score_logic_changed!==false||runtime.random_scoring_changed!==false)throw new Error('v0.15.135 scoring neutrality changed');
const input=read('update/v0.15.39/input-interaction-stability-v01539.js');
const patched=runtime.patchRuntimeSource('input-interaction-stability-v01539.js',input);
for(const marker of ['PATCH_NOTES_ALWAYS_OPEN_V015132','PATCH_NOTES_REAL_WINDOWS_V015133','PATCH_NOTES_RESOLVED_TITLE_V015134','PATCH_NOTES_SEMANTIC_SHELL_V015135'])must(patched,marker,`historical runtime marker ${marker}`);
if((patched.match(/PATCH_NOTES_SEMANTIC_SHELL_V015135/g)||[]).length!==1)throw new Error('v0.15.135 semantic shell payload no longer injects exactly once');
new Function(patched);

const map=new Map((manifest.files||[]).map(x=>[String(x.path),x]));
if(map.size!==(manifest.files||[]).length)throw new Error('active successor manifest has duplicate output paths');
const preserved={
  'main-v015135.js':'update/v0.15.135/main-v015135.js',
  'successor-route-v015135.js':'update/v0.15.135/successor-route-v015135.js',
  'runtime-source-stability-v015135.js':'update/v0.15.135/runtime-source-stability-v015135.js',
  'cold-start-promotion-v015135.js':'update/v0.15.135/cold-start-promotion-v015135.js'
};
for(const [target,source] of Object.entries(preserved)){
  const e=map.get(target);
  if(!e||e.source!==source)throw new Error(`v0.15.135 Golden dependency not preserved: ${target} -> ${e?.source||'missing'}`);
  if(e.sha256&&String(e.sha256).toLowerCase()!==sha(source))throw new Error(`v0.15.135 Golden dependency SHA mismatch: ${source}`);
}
if(map.get('ui-stability-baseline-v015115.js')?.source!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single owner source changed after Golden baseline');

const activePkg=json(map.get('package.json')?.source||'update/v0.16.1/package.json');
if(activePkg.name!=='aram-fearless-draft')throw new Error('successor changed stable Electron app identity');
if(String(activePkg.version)!==String(manifest.version))throw new Error('active package/manifest version mismatch');

let secureSources=0,verifiedSha=0;
for(const e of manifest.files||[]){
  if(!String(e.source||'').startsWith('update/'))throw new Error(`successor bypasses secure updater source root: ${e.path} -> ${e.source}`);
  secureSources++;
  if(e.sha256){if(!fs.existsSync(path.join(ROOT,e.source)))throw new Error(`manifest source missing: ${e.source}`);if(String(e.sha256).toLowerCase()!==sha(e.source))throw new Error(`manifest SHA mismatch: ${e.source}`);verifiedSha++}
}

const report={status:'SUCCESS',historical_version:'0.15.135',active_version:String(manifest.version),golden_identity_preserved:true,golden_user_data_pin_preserved:true,golden_semantic_shell_runtime_preserved:true,golden_scoring_neutrality_preserved:true,preserved_manifest_dependencies:Object.keys(preserved),secure_update_sources:secureSources,sha_verified_entries:verifiedSha};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015135-production-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`v0.15.135 GOLDEN SUCCESSOR AUDIT: SUCCESS · active v${manifest.version}`);
