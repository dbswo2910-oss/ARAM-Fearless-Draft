'use strict';
const fs=require('fs'),path=require('path'),os=require('os');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.116 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.116 audit forbidden ${label}: ${n}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.116 ${label} parse failed: ${e.message}`)}};
const throws=(fn,label)=>{let yes=false;try{fn()}catch{yes=true}if(!yes)throw new Error(`v0.15.116 expected rejection: ${label}`)};
const report={version:'0.15.116',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.116/';
const safety=read(dir+'update-safety-v01579.js');
const loader=read(dir+'runtime-loader-v01579.js');
const updater=read(dir+'updater-safety-patch-v01579.js');
const runtime=read(dir+'runtime-source-stability-v015116.js');
const main=read(dir+'main-v015116.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [name,src] of [['update safety',safety],['runtime loader',loader],['updater patch',updater],['runtime source',runtime],['main successor',main]])parse(src,name);
if(pkg.version!=='0.15.116'||pkg.main!=='main-v015116.js')throw new Error('v0.15.116 package metadata mismatch');
ok('syntax-package');

[
  ['failureForBoot','current-boot failure lookup'],
  ['PROBATION_BLOCKED','probation quarantine event'],
  ["'SAFE-HOLD1'",'probation blocked diagnostic'],
  ['healthy>=12','historical heartbeat probation'],
  ['!failureForBoot(root,cur)','final failure recheck before commit'],
  ['abnormal||hang||markedFailure','existing next-boot rollback gate'],
  ["'SAFE-RB1'",'existing rollback code'],
  ['score_logic_changed:false','scoring neutrality']
].forEach(([n,l])=>must(safety,n,l));
ok('probation-failure-gate-contract');

const safetyMod=require(path.join(ROOT,dir+'update-safety-v01579.js'));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v116-audit-'));
const root=path.join(tmp,'safety');fs.mkdirSync(root,{recursive:true});
const boot={bootStartedAt:Date.now()-1000};
if(safetyMod._test.failureForBoot(root,boot)!==null)throw new Error('fresh root unexpectedly has failure');
safetyMod.markSafetyFailure({root,code:'AUDIT-FAIL',detail:{test:true}});
const marked=safetyMod._test.failureForBoot(root,boot);
if(!marked||marked.code!=='AUDIT-FAIL')throw new Error('current boot failure gate did not observe marker');
if(safetyMod._test.failureForBoot(root,{bootStartedAt:Date.now()+10000})!==null)throw new Error('future boot incorrectly inherited old failure');
fs.rmSync(tmp,{recursive:true,force:true});
ok('probation-failure-gate-simulation');

[
  ['__ARAM_SAFETY_NET_V01579__','safety readiness marker'],
  ['__ARAM_RUNTIME_PERFORMANCE_V01568__','performance readiness marker'],
  ['__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__','live AutoSync readiness marker'],
  ['__ARAM_RANDOM_PRACTICE_FOCUS_V01549__','Random PICK readiness marker'],
  ['__ARAM_RANDOM_INGAME_RUNTIME_V01570__','Random IN GAME readiness marker'],
  ['__ARAM_INPUT_INTERACTION_STABILITY_V01539__','interaction readiness marker'],
  ['__ARAM_UI_STABILITY_BASELINE_V015115__','single UI owner readiness marker'],
  ["code:'SAFE-RT116'",'persistent critical readiness failure'],
  ['runtime-readiness-v015116.json','readiness diagnostic file'],
  ['aramSafetyNetV01579?.finalize','v0.15.79 safety finalizer preserved'],
  ['CRITICAL_SCRIPT_FILES','critical injection isolation'],
  ['score_logic_changed:false','loader scoring neutrality']
].forEach(([n,l])=>must(loader,n,l));
ok('critical-runtime-readiness-contract');

const patch=require(path.join(ROOT,dir+'updater-safety-patch-v01579.js')).patchUpdaterSource;
const base=read('update/v0.15.70/main.js');
const once=patch(base),twice=patch(once);
if(once!==twice)throw new Error('v0.15.116 updater transform is not idempotent');
for(const n of ['function validateManifestV015116(m){','중복 업데이트 대상','설치/삭제 대상 충돌','핵심 런타임 삭제 금지','잘못된 SHA-256','prepareUpdateTransaction','markUpdateApplied','abortUpdateTransaction'])must(once,n,'updater integrity transform');
const start=once.indexOf('function validateManifestV015116(m){'),end=once.indexOf('\nasync function fetchManifest()',start);
if(start<0||end<=start)throw new Error('cannot isolate manifest validator');
const fnText=once.slice(start,end);
const safeRel=p=>{p=String(p||'').replace(/\\/g,'/').replace(/^\.\//,'');if(!p||p.startsWith('/')||p.includes('\0')||p.split('/').some(x=>x==='..')||/^[A-Za-z]:/.test(p))throw new Error('unsafe');return p};
const validate=new Function('safeRel',`return (${fnText});`)(safeRel);
validate({version:'0.15.116',files:[{path:'main.js',source:'update/v0.15.116/main.js'}],delete:[]});
throws(()=>validate({version:'0.15.116',files:[{path:'a.js',source:'update/a.js'},{path:'a.js',source:'update/b.js'}]}),'duplicate install');
throws(()=>validate({version:'0.15.116',files:[{path:'a.js',source:'update/a.js'}],delete:['a.js']}),'install/delete collision');
throws(()=>validate({version:'0.15.116',files:[{path:'a.js',source:'update/a.js'}],delete:['main.js']}),'critical delete');
throws(()=>validate({version:'0.15.116',files:[{path:'a.js',source:'update/a.js',sha256:'bad'}]}),'invalid sha');
ok('manifest-integrity-gate-simulation');

must(runtime,"require('../v0.15.115/runtime-source-stability-v015115')",'v0.15.115 owner predecessor');
must(runtime,"random_pick_owner:'runtime-v015100'",'Random stable owner');
must(runtime,"data_view_owner:'ui-stability-v015115'",'Data stable owner');
must(runtime,'interaction_reparent_loops_removed:true','no delayed reparent regression');
must(runtime,'runtime_update_integrity_changed:true','runtime-only release flag');
mustNot(runtime,'setTimeout(','new UI repair timer');
mustNot(runtime,'requestAnimationFrame(','new UI repair animation');
ok('v115-ui-owner-preserved');

must(main,"path.join(__dirname,'main-v015115.js')",'v0.15.115 predecessor');
must(main,"runtime-source-stability-v015116",'v0.15.116 runtime route');
must(main,"root:'main-v01579.js'",'permanent safety root');
ok('main-successor-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);
if(String(manifest.version)==='0.15.116'){
  const expected={
    'update-safety-v01579.js':'update/v0.15.116/update-safety-v01579.js',
    'runtime-loader-v01579.js':'update/v0.15.116/runtime-loader-v01579.js',
    'updater-safety-patch-v01579.js':'update/v0.15.116/updater-safety-patch-v01579.js',
    'runtime-source-stability-v015116.js':'update/v0.15.116/runtime-source-stability-v015116.js',
    'main-v015116.js':'update/v0.15.116/main-v015116.js',
    'package.json':'update/v0.15.116/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.116 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.115/ui-stability-baseline-v015115.js')throw new Error('v0.15.115 UI owner unexpectedly replaced');
  ok('active-v116-manifest');
}else if(String(manifest.version)==='0.15.115')ok('preactivation-v115-manifest');
else throw new Error(`unexpected active manifest version during v0.15.116 rollout: ${manifest.version}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015116-runtime-update-stability-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:manifest.version},null,2)+'\n');
console.log('v0.15.116 RUNTIME / UPDATE STABILITY AUDIT: SUCCESS');
