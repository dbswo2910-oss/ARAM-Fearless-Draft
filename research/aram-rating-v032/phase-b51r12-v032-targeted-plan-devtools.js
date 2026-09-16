'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R12';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const ENGINE_COMMIT='b114d21019872326bdb2cf410772fb0c1ad8ce34';
  const ENGINE_URL=`https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/${ENGINE_COMMIT}/update/v0.15.129/rating-engine-v01.js`;
  const EXPECTED=Object.freeze({checkpoint_matches:1984,queue_selected:15,completed:4,remaining:11,last_recovery_phase:'B5.1-R10'});
  const CONTRACT=Object.freeze({
    purpose:'read-only targeted information-gain ranking after R11 no-clear-winner saturation result',
    riot_lcu_requests:0,checkpoint_access:'readonly',checkpoint_written:false,storage_mutation:false,
    production_changed:false,automatic_collection:false,raw_match_export:false,raw_identity_export:false,
    reference_engine_commit:ENGINE_COMMIT,selection_prerequisite:'no_clear_winner',top_k:5
  });

  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  function openExistingReadonly(){
    return new Promise((resolve,reject)=>{
      const q=indexedDB.open(DB);let upgrading=false;
      q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};
      q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};
      q.onerror=()=>{if(!upgrading)reject(q.error||new Error('research_db_open_failed'))};
    });
  }
  async function readCp(){
    const db=await openExistingReadonly();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);
      r.onsuccess=()=>{db.close();resolve(r.result??null)};
      r.onerror=()=>{db.close();reject(r.error||new Error('research_checkpoint_read_failed'))};
    });
  }
  async function engine(){
    if(globalThis.ARAMRatingResearchEngineV01)return globalThis.ARAMRatingResearchEngineV01;
    const src=await fetch(ENGINE_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('reference_engine_fetch_'+r.status);return r.text()});
    if(!src.includes("engine_version:'v0.1-js-port-of-research-models'"))throw new Error('reference_engine_signature_mismatch');
    (0,eval)(src);
    if(!globalThis.ARAMRatingResearchEngineV01?.buildLatestRun)throw new Error('reference_engine_unavailable');
    return globalThis.ARAMRatingResearchEngineV01;
  }
  function state(cp,E){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const normalized=E.normalizeMatches(cp.matches||[]),queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[],skipped=Array.isArray(cp.skipped_puuids_b51_v032)?cp.skipped_puuids_b51_v032:[];
    const done=new Set(completed),skip=new Set(skipped),remaining=queue.filter(x=>!done.has(x.puuid)&&!skip.has(x.puuid));
    const last=cp?.b51_v032_repair_state?.last_recovery_phase||null;
    return{ok:normalized.length===EXPECTED.checkpoint_matches&&queue.length===EXPECTED.queue_selected&&new Set(completed).size===EXPECTED.completed&&remaining.length===EXPECTED.remaining&&last===EXPECTED.last_recovery_phase,matches:normalized.length,queue,completed:new Set(completed).size,remaining,last_recovery_phase:last};
  }
  const vals=o=>Object.values(o||{}).filter(Number.isFinite);
  const minmax=(x,min,max)=>max>min?clamp((x-min)/(max-min)):0.5;
  function buildRows(run,remaining){
    const raw=[];
    for(const q of remaining){
      const pid=run.identity?.puuid_to_player_id?.[q.puuid]||null,player=pid?run.players?.[pid]:null;
      const models=player?.models||{};
      const ratings=vals({e:models.elo?.rating,g:models.glicko?.rating,t:models.trueskill_family?.rating});
      const uncertainties=vals({e:models.elo?.uncertainty,g:models.glicko?.uncertainty,t:models.trueskill_family?.uncertainty});
      const games=Number(player?.games??q.current_observation_count??0)||0;
      const spread=ratings.length?Math.max(...ratings)-Math.min(...ratings):0;
      const uncertainty=uncertainties.length?uncertainties.reduce((a,b)=>a+b,0)/uncertainties.length:0;
      const evidenceTier=Number(q.evidence_tier||0);
      const directYield=clamp(q.direct_no_cold_yield_proxy||0);
      const heldout=Math.max(0,Number(q.heldout_matches||0));
      const closed10=clamp(q.closed_10_of_10_ratio||0);
      const priority=Number(q.b51_priority??q.match_level_closed_priority??0)||0;
      raw.push({anchor_rank:Number(q.anchor_rank)||null,games,model_rating_spread:spread,mean_model_uncertainty:uncertainty,evidence_tier:evidenceTier,direct_no_cold_yield_proxy:directYield,heldout_matches:heldout,closed_10_of_10_ratio:closed10,b51_priority:priority});
    }
    const ranges={};
    for(const key of['model_rating_spread','mean_model_uncertainty','b51_priority','heldout_matches']){const a=raw.map(x=>x[key]);ranges[key]={min:Math.min(...a),max:Math.max(...a)}}
    return raw.map(x=>{
      const disagreement=minmax(x.model_rating_spread,ranges.model_rating_spread.min,ranges.model_rating_spread.max);
      const uncertainty=minmax(x.mean_model_uncertainty,ranges.mean_model_uncertainty.min,ranges.mean_model_uncertainty.max);
      const lowObservation=1-clamp(x.games/20);
      const evidence=clamp(.35*(x.evidence_tier/3)+.30*x.direct_no_cold_yield_proxy+.20*x.closed_10_of_10_ratio+.15*minmax(x.heldout_matches,ranges.heldout_matches.min,ranges.heldout_matches.max));
      const priorPriority=minmax(x.b51_priority,ranges.b51_priority.min,ranges.b51_priority.max);
      const score=.38*disagreement+.27*uncertainty+.15*lowObservation+.12*evidence+.08*priorPriority;
      return{...x,components:{model_disagreement:disagreement,uncertainty,low_observation:lowObservation,evidence,prior_b51_priority:priorPriority},targeted_information_gain_score:score};
    }).sort((a,b)=>b.targeted_information_gain_score-a.targeted_information_gain_score||b.components.model_disagreement-a.components.model_disagreement||a.anchor_rank-b.anchor_rank);
  }

  async function plan(){
    const cp=await readCp(),E=await engine(),pre=state(cp,E);
    if(!pre.ok)return{phase:PHASE,version:VERSION,mode:'READ_ONLY_TARGETED_INFORMATION_GAIN_PLAN',contract:CONTRACT,ok:false,refused:true,reason:'exact_post_r10_checkpoint_precondition_not_met',pre:{matches:pre.matches,completed:pre.completed,remaining:pre.remaining.length,last_recovery_phase:pre.last_recovery_phase},side_effects:{checkpoint_written:false,riot_lcu_requests:0,production_changed:false}};
    const run=E.buildLatestRun(cp.matches,{phase:PHASE,status:cp.status||'b51_v032_recovery_paused',sampling_version:VERSION,source:'local_checkpoint_v032_r12'});
    if(String(run.selection?.status||'')!=='no_clear_winner')return{phase:PHASE,version:VERSION,mode:'READ_ONLY_TARGETED_INFORMATION_GAIN_PLAN',contract:CONTRACT,ok:false,refused:true,reason:'r11_no_clear_winner_prerequisite_not_met',selection_status:run.selection?.status||null,side_effects:{checkpoint_written:false,riot_lcu_requests:0,production_changed:false}};
    const ranked=buildRows(run,pre.remaining),top=ranked.slice(0,5).map((x,i)=>({rank:i+1,anchor_rank:x.anchor_rank,targeted_information_gain_score:x.targeted_information_gain_score,games:x.games,model_rating_spread:x.model_rating_spread,mean_model_uncertainty:x.mean_model_uncertainty,evidence_tier:x.evidence_tier,heldout_matches:x.heldout_matches,closed_10_of_10_ratio:x.closed_10_of_10_ratio,components:x.components}));
    const summary={phase:PHASE,version:VERSION,mode:'READ_ONLY_TARGETED_INFORMATION_GAIN_PLAN',contract:CONTRACT,ok:true,refused:false,classification:'R12_TARGETED_INFORMATION_GAIN_PLAN_READY',selection_status:run.selection.status,observed_leader:run.observed_leader,observed_runner_up:run.observed_runner_up,checkpoint:{matches:pre.matches,completed:pre.completed,remaining:pre.remaining.length,last_recovery_phase:pre.last_recovery_phase},top_candidates:top,next_step:'COLLECT_TOP_RANKED_ANCHOR_ONE_AT_A_TIME_AND_REEVALUATE_AFTER_EACH_SUCCESS',privacy:{raw_puuid_returned:false,riot_id_returned:false,identity_mapping_returned:false},side_effects:{checkpoint_written:false,riot_lcu_requests:0,automatic_collection:false,production_changed:false}};
    console.table(top.map(x=>({rank:x.rank,anchor_rank:x.anchor_rank,ig_score:x.targeted_information_gain_score,games:x.games,rating_spread:x.model_rating_spread,mean_uncertainty:x.mean_model_uncertainty,evidence_tier:x.evidence_tier,heldout:x.heldout_matches,closed10:x.closed_10_of_10_ratio})));
    console.log('[ARAM Rating v0.3.2] B5.1 R12 targeted information-gain plan complete · READ ONLY',summary);
    return summary;
  }

  window.aramRatingB51R12V032=Object.freeze({version:VERSION,phase:PHASE,contract:CONTRACT,plan});
  console.log('[ARAM Rating v0.3.2] B5.1 R12 targeted information-gain planner ready. READ ONLY · ZERO Riot/LCU requests · ZERO checkpoint writes. Run await window.aramRatingB51R12V032.plan().');
})();
