'use strict';
const MODEL_NAMES=Object.freeze(['elo','glicko']);
const CONTRACT=Object.freeze({
  schema:'aram-rating-dual-shadow-v1',
  mode:'shadow_only',
  models:MODEL_NAMES,
  primary_metric:'log_loss',
  storage_writes:false,
  network_requests:false,
  ui_writes:false,
  production_score_writes:false,
  production_active:false,
  raw_identity_export:false
});

function metric(m){
  return Object.freeze({
    n:Number(m?.n)||0,
    accuracy:Number.isFinite(Number(m?.accuracy))?Number(m.accuracy):null,
    log_loss:Number.isFinite(Number(m?.log_loss))?Number(m.log_loss):null,
    brier:Number.isFinite(Number(m?.brier))?Number(m.brier):null,
    ece:Number.isFinite(Number(m?.ece))?Number(m.ece):null
  });
}

function modelView(run,name){
  const m=run?.models?.[name]||{};
  return Object.freeze({
    frozen:metric(m.frozen),
    walk_forward:metric(m.walk_forward)
  });
}

function playerModelView(run,pid,name){
  if(!pid)return null;
  const m=run?.players?.[String(pid)]?.models?.[name];
  if(!m)return null;
  return Object.freeze({
    rating:Number.isFinite(Number(m.rating))?Number(m.rating):null,
    uncertainty:Number.isFinite(Number(m.uncertainty))?Number(m.uncertainty):null,
    games:Number.isFinite(Number(m.games))?Number(m.games):null,
    uncertainty_kind:m.uncertainty_kind||null
  });
}

function winnerHint(run){
  const status=String(run?.selection?.status||'unknown');
  if(status==='candidate_winner')return 'single_candidate_shadow';
  if(status==='no_clear_winner')return 'elo_glicko_dual_shadow';
  return 'hold_shadow';
}

function buildSnapshot(run,{targetPuuid=''}={}){
  if(!run||typeof run!=='object')return null;
  const pid=targetPuuid?run?.identity?.puuid_to_player_id?.[String(targetPuuid)]||null:null;
  const elo=modelView(run,'elo'),glicko=modelView(run,'glicko');
  const frozenGap=(elo.frozen.log_loss!=null&&glicko.frozen.log_loss!=null)?glicko.frozen.log_loss-elo.frozen.log_loss:null;
  const walkForwardGap=(elo.walk_forward.log_loss!=null&&glicko.walk_forward.log_loss!=null)?glicko.walk_forward.log_loss-elo.walk_forward.log_loss:null;
  return Object.freeze({
    schema:CONTRACT.schema,
    mode:CONTRACT.mode,
    observed_leader:run.observed_leader||null,
    observed_runner_up:run.observed_runner_up||null,
    selection_status:run?.selection?.status||null,
    shadow_strategy:winnerHint(run),
    dataset:Object.freeze({
      matches:Number(run?.dataset?.matches??run?.dataset?.match_count??0)||0,
      players:Number(run?.dataset?.players??run?.dataset?.player_count??run?.identity?.player_count??0)||0,
      fingerprint:run?.dataset?.fingerprint||run?.dataset_fingerprint||null
    }),
    metrics:Object.freeze({
      elo,
      glicko,
      log_loss_gap_glicko_minus_elo:Object.freeze({frozen:frozenGap,walk_forward:walkForwardGap})
    }),
    target:targetPuuid?Object.freeze({
      present:!!pid,
      player_id:pid?String(pid):null,
      elo:playerModelView(run,pid,'elo'),
      glicko:playerModelView(run,pid,'glicko')
    }):null,
    side_effects:Object.freeze({storage_writes:false,network_requests:false,ui_writes:false,production_score_writes:false}),
    privacy:Object.freeze({raw_puuid_returned:false,identity_mapping_returned:false})
  });
}

function createDualShadowOwner({onSnapshot=(()=>{})}={}){
  let latest=null,observations=0,disposed=false;
  function observeRun(run,options={}){
    if(disposed)return null;
    latest=buildSnapshot(run,options);
    if(latest){observations++;onSnapshot(latest)}
    return latest;
  }
  function clear(){latest=null;return true}
  function dispose(){disposed=true;latest=null}
  return Object.freeze({
    observeRun,clear,dispose,
    get snapshot(){return latest},
    get observations(){return observations},
    get disposed(){return disposed}
  });
}

module.exports={CONTRACT,MODEL_NAMES,buildSnapshot,createDualShadowOwner,production_active:false,automatic_collection:false,owner_status:'shadow-only',score_logic_changed:false,profile_scoring_changed:false};
