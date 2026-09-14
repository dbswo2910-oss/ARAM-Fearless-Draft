'use strict';
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const must=(s,n,l=n)=>{if(!String(s).includes(n))throw new Error(`missing ${l}: ${n}`)};
const mustNot=(s,n,l=n)=>{if(String(s).includes(n))throw new Error(`forbidden ${l}: ${n}`)};
(async()=>{
  const p129=JSON.parse(read('update/v0.15.129/package.json'));
  const p130=JSON.parse(read('update/v0.15.130/package.json'));
  const p131=JSON.parse(read('update/v0.15.131/package.json'));
  const p132=JSON.parse(read('update/v0.15.132/package.json'));
  if(p129.name!=='aram-fearless-draft')throw new Error('v129 baseline app identity changed');
  if(p130.name!=='aram-fearless-draft-update'||p131.name!=='aram-fearless-draft-update')throw new Error('expected v130/v131 app identity regression not present');
  if(p132.name!==p129.name)throw new Error('v132 did not restore v129 Electron app identity');
  if(p132.version!=='0.15.132'||p132.main!=='main-v015132.js')throw new Error('v132 package metadata mismatch');

  const main=read('update/v0.15.132/main-v015132.js');
  must(main,"STABLE_APP_ID='aram-fearless-draft'",'stable app id');
  must(main,"app.setPath('userData',stable)",'explicit stable userData pin');
  if(main.indexOf("app.setPath('userData',stable)")>main.indexOf('module._compile'))throw new Error('userData pin occurs too late');

  const storageSrc=read('update/v0.15.132/research-storage-v015131.js');
  must(storageSrc,'listing_is_hint_only:true','listing is hint only');
  must(storageSrc,'const q=idb.open(name);','versionless existing DB open');
  must(storageSrc,"transaction(STORE,'readonly')",'read-only checkpoint access');
  mustNot(storageSrc,'if(known===false)return','v131 false-negative database listing gate');
  for(const forbidden of ['deleteDatabase(','localStorage.clear','objectStore(STORE).put(','transaction(STORE,\'readwrite\')'])mustNot(storageSrc,forbidden,'destructive boot storage op');
  const S=require('../update/v0.15.132/research-storage-v015131.js');
  let openCalled=0,listed=0;
  const fakeDb={version:1,objectStoreNames:['kv'],close(){}};
  const fakeIdb={
    async databases(){listed++;return[]},
    open(){openCalled++;const q={transaction:{abort(){}}};setTimeout(()=>{q.result=fakeDb;q.onsuccess&&q.onsuccess()},0);return q}
  };
  const opened=await S.openExistingDatabase(fakeIdb);
  if(!opened.db||opened.missing||openCalled!==1)throw new Error('direct-open recovery failed when database listing would be empty');
  if(listed!==0)throw new Error('openExistingDatabase must not consult databases() gate');

  const RT=require('../update/v0.15.132/runtime-source-stability-v015132.js');
  const rtSrc=read('update/v0.15.132/runtime-source-stability-v015132.js');
  must(rtSrc,"if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesOwner(src);",'actual injected DATA owner target');
  mustNot(rtSrc,"if(file==='ui-stability-baseline-v015115.js')src=patchPatchNotesOwner(src);",'dead standalone owner target');
  const owner=read('update/v0.15.120/ui-stability-baseline-v015115.js');
  const patched=RT.patchPatchNotesOwner(owner);
  for(const x of ["const PRESENTATION='0.15.132'",'PATCH_NOTES_ALWAYS_OPEN_V015132','.data115PatchMode .data115DetailBranch > .title','title.hidden=patchMode','!/닫기/.test(text(btn))','dh99ChampionGrid','dh99Side','data-v115-tab="patch"'])must(patched,x,'Patch Notes always-open transform');
  if(RT.patchPatchNotesOwner(patched)!==patched)throw new Error('Patch Notes transform not idempotent');

  const manifest=JSON.parse(read('update/manifest.json'));
  if(manifest.version!=='0.15.132'||String(manifest.min_launcher)!=='2.0.2')throw new Error('v132 active manifest mismatch');
  const map=new Map(manifest.files.map(x=>[x.path,x.source]));
  const expected={
    'package.json':'update/v0.15.132/package.json',
    'main-v015132.js':'update/v0.15.132/main-v015132.js',
    'successor-route-v015132.js':'update/v0.15.132/successor-route-v015132.js',
    'runtime-source-stability-v015132.js':'update/v0.15.132/runtime-source-stability-v015132.js',
    'research-storage-v015131.js':'update/v0.15.132/research-storage-v015131.js',
    'cold-start-promotion-v015132.js':'update/v0.15.132/cold-start-promotion-v015132.js'
  };
  for(const [k,v] of Object.entries(expected))if(map.get(k)!==v)throw new Error(`manifest route mismatch ${k}: ${map.get(k)}`);
  if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single owner source replaced');

  const report={status:'SUCCESS',version:'0.15.132',root_cause:{research:'v0.15.130/131 package name changed from aram-fearless-draft to aram-fearless-draft-update, moving Electron default userData/session storage root away from the v0.15.129 IndexedDB',patch_notes:'v0.15.131 patched ui-stability-baseline-v015115.js as if it were injected directly, but v0.15.115 actually appends that owner into input-interaction-stability-v01539.js'},fixtures:{stable_app_identity_restored:'PASS',stable_userData_pinned_before_boot:'PASS',indexeddb_listing_false_negative_bypassed:'PASS',checkpoint_boot_read_only:'PASS',patch_notes_actual_runtime_target:'PASS',patch_notes_header_close_removed:'PASS',patch_quick_nav_preserved:'PASS'},data_destructive_ops:false};
  fs.mkdirSync(path.join(R,'audit-output'),{recursive:true});fs.writeFileSync(path.join(R,'audit-output/v015132-production-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('v0.15.132 PRODUCTION AUDIT: SUCCESS');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
