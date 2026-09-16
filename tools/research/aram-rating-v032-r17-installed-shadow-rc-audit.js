'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const engine=require(path.join(ROOT,'src/research/rating-engine.js'));
const rc=require(path.join(ROOT,'src/research/installed-shadow-rc.js'));
const store=require(path.join(ROOT,'src/research/shadow-evidence-store.js'));
let pass=0;const ok=(c,m)=>{if(!c)throw new Error('R17 INSTALLED SHADOW RC AUDIT: '+m);pass++};

function match(i,{prefix='base',timeBase=1700000000000}={}){
  const swap=i%2===1,win=i%3!==0;
  const ids=Array.from({length:10},(_,j)=>`RAW_PUUID_${j}`),a=swap?ids.slice(5):ids.slice(0,5),b=swap?ids.slice(0,5):ids.slice(5);
  return{gameId:`raw-match-${prefix}-${i}`,gameEndTimestamp:timeBase+i*60000,gameVersion:i<300?'26.17.1':'26.18.1',queueId:450,participants:[...a.map(puuid=>({puuid,teamId:100,win})),...b.map(puuid=>({puuid,teamId:200,win:!win}))]};
}
const baseline=Array.from({length:600},(_,i)=>match(i));
const checkpoint={phase:'B5.1-R14',status:'complete',sampling_version:'v0.3.2',matches:baseline};
let canonicalReads=0;
const storageApi={DB_NAME:'aram-rating-research-v03',CHECKPOINT_KEY:'checkpoint-v03',async openExistingDatabase(){canonicalReads++;return{missing:false,db:{close(){}}}},async readKey(){return checkpoint}};

function memoryRepository(){
  const meta=new Map(),matches=new Map(),snapshots=new Map();
  return{
    meta,matches,snapshots,
    async getMeta(k){return meta.get(k)??null},async putMeta(k,v){meta.set(k,v);return true},
    async listMatches(){return[...matches.values()].sort((a,b)=>a.time-b.time)},async putMatches(rows){for(const r of rows||[])matches.set(r.match_id,r);return true},async deleteMatches(ids){for(const x of ids||[])matches.delete(x);return true},
    async listSnapshots(){return[...snapshots.values()].sort((a,b)=>a.dataset.matches-b.dataset.matches)},async putSnapshot(r){snapshots.set(r.dataset.fingerprint,{...r,fingerprint:r.dataset.fingerprint});return true},async deleteSnapshots(ids){for(const x of ids||[])snapshots.delete(x);return true}
  };
}
const repo=memoryRepository();
const cryptoRef={getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=(i*17+11)&255;return a}};
let historyCalls=0;
const history1=[...baseline.slice(-5),...Array.from({length:10},(_,i)=>match(600+i,{prefix:'new',timeBase:1700000000000}))];
const provider1=async opts=>{historyCalls++;ok(Number(opts.limit)===30&&Number(opts.scan)===40,'bounded history options');return{matches:history1}};

(async()=>{
  ok(rc.production_active===false&&rc.CONTRACT.production_active===false,'production inactive');
  ok(rc.automatic_collection===false&&rc.blind_bulk_collection===false,'no automatic or blind collection');
  ok(rc.recurring_polling===false&&rc.CONTRACT.max_history_requests_per_run===1,'one-shot request contract');
  ok(store.DB_NAME!=='aram-rating-research-v03','shadow evidence DB is separate from canonical Research DB');
  ok(store.CONTRACT.canonical_checkpoint_writes===false&&store.CONTRACT.production_score_writes===false,'store cannot write canonical or production score');
  ok(store.CONTRACT.raw_identity_persisted===false&&store.CONTRACT.raw_identity_export===false,'store privacy contract');

  const first=await rc.runOnce({storageApi,indexedDBRef:{},cryptoRef,evidenceRepository:repo,historyProvider:provider1});
  ok(first.state==='available','first passive RC run available');
  ok(first.history_requests===1&&historyCalls===1,'exactly one history request');
  ok(first.baseline_matches===600,'canonical baseline read');
  ok(first.history_valid_matches===15,'history response normalized');
  ok(first.stored_delta_matches===10&&first.augmented_matches===610,'only new matches persisted as delta');
  ok(first.evidence_snapshots===1,'first aggregate snapshot persisted');
  ok(first.production_score_changed===false&&first.canonical_checkpoint_written===false&&first.ui_changed===false,'zero production/canonical/UI mutation');
  ok(first.production_activation_authorized===false&&first.promotion_status==='hold_shadow','promotion remains held');
  ok(first.privacy.raw_puuid_returned===false&&first.privacy.raw_match_id_returned===false,'public result privacy');

  const persisted1=JSON.stringify({matches:[...repo.matches.values()],snapshots:[...repo.snapshots.values()]});
  ok(!persisted1.includes('RAW_PUUID_'),'raw PUUID never persisted');
  ok(!persisted1.includes('raw-match-'),'raw match ID never persisted');
  ok([...repo.matches.values()].every(x=>(x.team_a||[]).every(p=>/^p_[0-9a-f]{16}$/.test(p))),'persisted team IDs pseudonymized');

  const second=await rc.runOnce({storageApi,indexedDBRef:{},cryptoRef,evidenceRepository:repo,historyProvider:provider1});
  ok(second.stored_delta_matches===10,'repeat history dedupes delta');
  ok(second.evidence_snapshots===1,'same dataset fingerprint dedupes snapshot');
  ok(historyCalls===2&&second.history_requests===1,'second run still bounded to one request');

  const history2=Array.from({length:20},(_,i)=>match(610+i,{prefix:'later',timeBase:1700000000000}));
  const third=await rc.runOnce({storageApi,indexedDBRef:{},cryptoRef,evidenceRepository:repo,historyProvider:async()=>{historyCalls++;return{data:{matches:history2}}}});
  ok(third.stored_delta_matches===30&&third.augmented_matches===630,'later normal-use history accumulates privacy-safe delta');
  ok(third.evidence_snapshots===2,'dataset growth creates second distinct aggregate snapshot');
  ok(third.promotion_status==='hold_shadow','insufficient shadow history cannot promote');
  ok(canonicalReads===3,'canonical checkpoint read once per explicit RC run');

  const noBridge=await rc.runOnce({storageApi,indexedDBRef:{},cryptoRef,evidenceRepository:repo,historyProvider:null});
  ok(noBridge.history_requests===0&&noBridge.state==='available','missing League/history bridge degrades to existing evidence without request');
  ok(noBridge.stored_delta_matches===30,'existing pseudonymous evidence survives no-bridge run');

  const rcSrc=fs.readFileSync(path.join(ROOT,'src/research/installed-shadow-rc.js'),'utf8'),storeSrc=fs.readFileSync(path.join(ROOT,'src/research/shadow-evidence-store.js'),'utf8');
  ok(!rcSrc.includes('setInterval')&&!rcSrc.includes('MutationObserver')&&!rcSrc.includes('setTimeout'),'RC has no recurring poller/timer');
  ok((rcSrc.match(/historyProvider\(/g)||[]).length===1,'RC source contains one history-provider invocation site');
  ok(!storeSrc.includes('deleteDatabase'),'evidence store has no destructive DB reset');
  ok(!storeSrc.includes("DB_NAME='aram-rating-research-v03'"),'evidence store cannot alias canonical Research DB');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(String(manifest.version)==='0.16.0','production manifest remains v0.16.0');
  ok(!(manifest.files||[]).some(x=>/installed-shadow-rc|shadow-evidence-store/.test(String(x.source||x.path||''))),'R17 sources are not shipped by production manifest');

  const report={status:'SUCCESS',passes:pass,phase:'R17_PASSIVE_INSTALLED_SHADOW_RC',production_active:false,production_manifest_mutated:false,max_history_requests_per_run:1,recurring_polling:false,canonical_checkpoint_writes:false,production_score_writes:false,raw_identity_persisted:false,first_run:{baseline:first.baseline_matches,delta:first.stored_delta_matches,augmented:first.augmented_matches,snapshots:first.evidence_snapshots},third_run:{delta:third.stored_delta_matches,augmented:third.augmented_matches,snapshots:third.evidence_snapshots,promotion:third.promotion_status}};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-r17-installed-shadow-rc-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`R17 PASSIVE INSTALLED SHADOW RC AUDIT: SUCCESS · ${pass} checks`);
})().catch(e=>{console.error(e?.stack||e);process.exitCode=1});
