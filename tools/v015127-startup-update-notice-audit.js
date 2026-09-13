'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const ok=(c,m)=>{if(!c)throw new Error(`v0.15.127 STARTUP AUTO UPDATE AUDIT: ${m}`)};
const count=(s,n)=>String(s).split(n).length-1;
const parse=(s,n)=>{try{new Function(s)}catch(e){throw new Error(`${n} parse failed: ${e.message}`)}};
const dir='update/v0.15.127/';
for(const p of ['package.json','main-v015127.js','successor-route-v015127.js','startup-update-notice-v015127.js','runtime-source-stability-v015127.js'])ok(exists(dir+p),`missing ${p}`);
ok(!exists(dir+'preload.js'),'v0.15.127 must preserve the existing preload owner');
ok(!exists(dir+'startup-update-check-main-v015127.js'),'v0.15.127 must not add a competing updater IPC owner');
const pkg=JSON.parse(read(dir+'package.json'));
const main=read(dir+'main-v015127.js');
const routeSrc=read(dir+'successor-route-v015127.js');
const notice=read(dir+'startup-update-notice-v015127.js');
const runtime=read(dir+'runtime-source-stability-v015127.js');
for(const [n,s] of [['main',main],['route',routeSrc],['notice',notice],['runtime',runtime]])parse(s,n);
ok(pkg.version==='0.15.127'&&pkg.main==='main-v015127.js','package contract mismatch');
ok(main.includes("const VERSION='0.15.127'"),'main explicit version missing');
ok(main.includes("main-v015122.js"),'known-good recovery base missing');
ok(main.includes("root:'main-v01579.js'"),'permanent safety root missing');
ok(!main.includes('ipcMain.handle')&&!main.includes('desktop:update-check'),'main added a competing updater IPC');
ok(notice.includes('window.aramDesktop.checkAndApplyUpdate()'),'startup path does not reuse the existing updater IPC');
ok(notice.includes('if(started)return lastResult'),'one-shot startup guard missing');
ok(notice.includes("document.getElementById('aramPatchNotesNoticeV015123')")&&notice.includes('retries<20'),'bounded Patch Notes coexistence guard missing');
ok(notice.includes('setTimeout(run,1200)'),'bounded startup delay missing');
ok(notice.includes("mode:'auto-check-apply-restart'"),'automatic update mode marker missing');
ok(notice.includes("lastResult.status==='current'")&&notice.includes("lastResult.status==='applied'")&&notice.includes("lastResult.status==='launcher-required'"),'expected updater result handling missing');
ok(!notice.includes('MutationObserver'),'startup updater added MutationObserver');
ok(!notice.includes('setInterval('),'startup updater added recurring interval');
ok(notice.includes('score_logic_changed:false')&&notice.includes('random_scoring_changed:false'),'renderer scoring neutrality markers missing');
const preload=read('update/v0.15.117/preload.js');
ok(preload.includes("checkAndApplyUpdate: () => ipcRenderer.invoke('desktop:update-now')"),'existing update IPC bridge is missing');
const baseMain=read('update/v0.15.70/main.js');
ok(baseMain.includes("ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate())"),'existing main updater IPC is missing');
ok(baseMain.includes('async function checkAndApplyUpdate()'),'existing transactional updater function missing');
const safety=read('update/v0.15.116/updater-safety-patch-v01579.js');
ok(safety.includes('prepareUpdateTransaction')&&safety.includes('markUpdateApplied')&&safety.includes('abortUpdateTransaction'),'transactional update safety hooks missing');
const prior=require('../update/v0.15.126/runtime-source-stability-v015126');
const current=require('../update/v0.15.127/runtime-source-stability-v015127');
const inputBase=read('update/v0.15.39/input-interaction-stability-v01539.js');
const before=prior.patchRuntimeSource('input-interaction-stability-v01539.js',inputBase);
const after=current.patchRuntimeSource('input-interaction-stability-v01539.js',inputBase);
ok(after!==before,'startup auto-update payload was not injected');
ok(count(after,'/* ARAM_STARTUP_UPDATE_NOTICE_V015127 */')===1,'startup auto-update payload injection count != 1');
ok(after.indexOf('/* ARAM_STARTUP_UPDATE_NOTICE_V015127 */')<after.indexOf('/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */'),'startup auto-update payload must precede state-integrity suffix');
parse(after,'transformed input runtime');
for(const [file,p] of [
 ['runtime-random-practice-v01572.js','update/v0.15.72/runtime-random-practice-v01572.js'],
 ['ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js'],
 ['autosync-concurrency-v015119.js','update/v0.15.119/autosync-concurrency-v015119.js'],
 ['riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js']
]){const src=read(p);ok(prior.patchRuntimeSource(file,src)===current.patchRuntimeSource(file,src),`${file} changed outside startup update scope`)}
ok(current.score_logic_changed===false,'score logic flag changed');
ok(current.random_scoring_changed===false,'RANDOM scoring flag changed');
ok(current.startup_update_check===true,'startup update marker missing');
ok(current.startup_update_policy==='check-once-auto-apply-restart','startup auto-update policy mismatch');
const route=require('../update/v0.15.127/successor-route-v015127');
const predecessor=read('update/v0.15.122/main-v015122.js');
ok(count(predecessor,route.OLD_ROUTE_FRAGMENT)===1,'v0.15.122 route cardinality changed');
const routed=route.patchSuccessorSource(predecessor);
ok(count(routed,route.NEW_ROUTE_FRAGMENT)===1&&count(routed,route.OLD_ROUTE_FRAGMENT)===0,'v0.15.127 successor route transform failed');
parse(routed,'routed predecessor');
const manifest=JSON.parse(read('update/manifest.json'));
if(String(manifest.version)==='0.15.127'){
 const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
 const expected={
  'package.json':'update/v0.15.127/package.json',
  'preload.js':'update/v0.15.117/preload.js',
  'startup-update-notice-v015127.js':'update/v0.15.127/startup-update-notice-v015127.js',
  'successor-route-v015127.js':'update/v0.15.127/successor-route-v015127.js',
  'runtime-source-stability-v015127.js':'update/v0.15.127/runtime-source-stability-v015127.js',
  'main-v015127.js':'update/v0.15.127/main-v015127.js'
 };
 for(const [p,s] of Object.entries(expected))ok(map.get(p)===s,`active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
 ok(!map.has('startup-update-check-main-v015127.js'),'active manifest contains retired competing update-check IPC');
 for(const row of manifest.files||[])ok(String(row.source||'').startsWith('update/'),`unsafe active source ${row.path} -> ${row.source}`);
}
const activation=read('tools/v015127-activate-startup-update-notice.js');
ok(activation.includes("m.version='0.15.127'"),'activation version mutation missing');
ok(activation.includes('STARTUP AUTO UPDATE'),'activation release message is not automatic-update policy');
ok(!activation.includes("replace('preload.js'")&&!activation.includes("startup-update-check-main-v015127.js"),'activation tries to replace preload or install a competing update IPC');
const workflow=read('.github/workflows/v015127-activate-startup-update-notice.yml');
ok(workflow.includes('node tools/sync-current-state.js'),'continuity sync missing');
ok(workflow.includes('node tools/full-regression-audit.js'),'Full Regression missing');
console.log('v0.15.127 STARTUP AUTO UPDATE AUDIT: SUCCESS · one-shot launch update · existing transactional updater reused · no new IPC/preload owner');
