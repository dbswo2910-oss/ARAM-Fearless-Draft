'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const VERSION='0.17.1';
const OUT=path.join(ROOT,'update','v0.17.1');
const MANIFEST=path.join(ROOT,'update','manifest.json');
const REPORT=path.join(ROOT,'release','v0.17.1-rating-auto-sync.json');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ensure=p=>fs.mkdirSync(p,{recursive:true});
const copy=(src,dst)=>{ensure(path.dirname(dst));fs.copyFileSync(src,dst)};
const write=(p,s)=>{ensure(path.dirname(p));fs.writeFileSync(p,s,'utf8')};
function manifestEntry(target,source){const p=path.join(ROOT,...source.split('/'));if(!fs.existsSync(p))throw new Error('missing source '+source);return{path:target,source,sha256:sha(p)}}
function replaceEntry(m,target,source){const e=manifestEntry(target,source);const i=(m.files||[]).findIndex(x=>String(x.path)===target);if(i>=0)m.files[i]=e;else m.files.push(e)}
function main(){
  const base=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
  if(String(base.version)!=='0.17.0')throw new Error('v0.17.1 release must build from manifest 0.17.0, got '+base.version);
  fs.rmSync(OUT,{recursive:true,force:true});ensure(OUT);

  const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'update','v0.17.0','package.json'),'utf8'));
  pkg.version=VERSION;pkg.description='v0.17.1 Rating Auto Sync';
  write(path.join(OUT,'package.json'),JSON.stringify(pkg,null,2)+'\n');

  let mainSrc=fs.readFileSync(path.join(ROOT,'update','v0.17.0','main.js'),'utf8');
  mainSrc=mainSrc.replace("const VERSION='0.17.0';","const VERSION='0.17.1';").replace('[v0.17.0 storage-root]','[v0.17.1 storage-root]');
  if(!mainSrc.includes("const VERSION='0.17.1';"))throw new Error('main version patch failed');
  write(path.join(OUT,'main.js'),mainSrc);

  const hook=require(path.join(ROOT,'src','preload','universal-rating-history-hook.js'));
  const preloadBase=fs.readFileSync(path.join(ROOT,'update','v0.17.0','preload.js'),'utf8');
  const patched=hook.patchPreloadSource(preloadBase);
  for(const marker of ['__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__','__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__','getUniversalRatingAutoSyncState','onUniversalRatingAutoSync'])if(!patched.source.includes(marker))throw new Error('preload marker missing '+marker);
  write(path.join(OUT,'preload.js'),patched.source);

  const overlay=[
    'src/preload/ipc-contract.js',
    'src/preload/universal-rating-auto-sync.js',
    'src/preload/universal-rating-history-hook.js',
    'src/rating/universal/runtime.js',
    'src/rating/universal/service.js'
  ];
  for(const rel of overlay)copy(path.join(ROOT,rel),path.join(OUT,rel));

  const m=JSON.parse(JSON.stringify(base));
  m.version=VERSION;
  m.message='v0.17.1 · RATING AUTO SYNC';
  m.universal_rating_auto_sync=true;
  m.rating_auto_sync_game_end=true;
  m.rating_auto_sync_search_refresh=true;
  m.production_rating_active=false;
  m.automatic_rating_promotion=false;
  const changes=[
    ['package.json','update/v0.17.1/package.json'],
    ['main.js','update/v0.17.1/main.js'],
    ['preload.js','update/v0.17.1/preload.js'],
    ['src/preload/ipc-contract.js','update/v0.17.1/src/preload/ipc-contract.js'],
    ['src/preload/universal-rating-auto-sync.js','update/v0.17.1/src/preload/universal-rating-auto-sync.js'],
    ['src/preload/universal-rating-history-hook.js','update/v0.17.1/src/preload/universal-rating-history-hook.js'],
    ['src/rating/universal/runtime.js','update/v0.17.1/src/rating/universal/runtime.js'],
    ['src/rating/universal/service.js','update/v0.17.1/src/rating/universal/service.js']
  ];
  for(const [t,s] of changes)replaceEntry(m,t,s);
  for(const row of m.files||[])if(!String(row.source||'').startsWith('update/'))throw new Error('unsafe updater source '+row.path);
  write(MANIFEST,JSON.stringify(m,null,2)+'\n');

  const report={version:VERSION,status:'READY_FOR_PRODUCTION_AUDIT',feature:'Universal Rating Auto Sync',gameEndAutoSync:true,searchedPlayerRefresh:true,dedupeByMatchId:true,productionRatingActive:false,automaticRatingPromotion:false,researchCheckpointReset:false,sourceOverlay:overlay,manifestEntries:changes.map(x=>x[0])};
  write(REPORT,JSON.stringify(report,null,2)+'\n');
  console.log('V0.17.1 RATING AUTO SYNC RELEASE MATERIALIZED',JSON.stringify(report));
}
if(require.main===module)main();
module.exports={main,VERSION};
