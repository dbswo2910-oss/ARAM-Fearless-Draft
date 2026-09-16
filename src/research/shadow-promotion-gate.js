'use strict';
const POLICY=Object.freeze({
  schema:'aram-rating-shadow-promotion-gate-v1',
  min_distinct_snapshots:3,
  min_match_growth:100,
  require_candidate_winner:true,
  require_stable_leader:true,
  require_positive_frozen_gap:true,
  require_positive_walk_forward_gap:true,
  automatic_promotion:false,
  production_active:false
});

const CONTRACT=Object.freeze({
  mode:'shadow_promotion_review_only',
  storage_writes:false,
  network_requests:false,
  ui_writes:false,
  production_score_writes:false,
  production_activation:false,
  raw_identity_export:false,
  manual_release_approval_required:true
});

function normalizeSnapshots(rows){
  const xs=(Array.isArray(rows)?rows:[]).filter(x=>x&&x.schema==='aram-rating-dual-shadow-v1');
  const byFingerprint=new Map();
  for(const x of xs){
    const fp=String(x?.dataset?.fingerprint||'').trim();
    if(!fp)continue;
    byFingerprint.set(fp,x);
  }
  return [...byFingerprint.values()].sort((a,b)=>(Number(a?.dataset?.matches)||0)-(Number(b?.dataset?.matches)||0));
}

function evaluatePromotion(snapshots,policy=POLICY){
  const rows=normalizeSnapshots(snapshots);
  const latest=rows.at(-1)||null;
  const first=rows[0]||null;
  const leaders=rows.map(x=>x.observed_leader).filter(Boolean);
  const stableLeader=!!leaders.length&&leaders.every(x=>x===leaders[0]);
  const matchGrowth=latest&&first?Math.max(0,(Number(latest?.dataset?.matches)||0)-(Number(first?.dataset?.matches)||0)):0;
  const frozenGap=Number(latest?.metrics?.log_loss_gap_glicko_minus_elo?.frozen);
  const walkGap=Number(latest?.metrics?.log_loss_gap_glicko_minus_elo?.walk_forward);
  const observedLeader=latest?.observed_leader||null;
  const leaderGapFrozen=observedLeader==='elo'?frozenGap:(observedLeader==='glicko'?-frozenGap:NaN);
  const leaderGapWalk=observedLeader==='elo'?walkGap:(observedLeader==='glicko'?-walkGap:NaN);
  const conditions={
    distinct_snapshots:rows.length>=Number(policy.min_distinct_snapshots||3),
    match_growth:matchGrowth>=Number(policy.min_match_growth||100),
    candidate_winner:policy.require_candidate_winner===false||latest?.selection_status==='candidate_winner',
    stable_leader:policy.require_stable_leader===false||stableLeader,
    positive_frozen_gap:policy.require_positive_frozen_gap===false||(Number.isFinite(leaderGapFrozen)&&leaderGapFrozen>0),
    positive_walk_forward_gap:policy.require_positive_walk_forward_gap===false||(Number.isFinite(leaderGapWalk)&&leaderGapWalk>0)
  };
  const evidenceReady=Object.values(conditions).every(Boolean);
  return Object.freeze({
    schema:POLICY.schema,
    status:evidenceReady?'eligible_for_manual_promotion_review':'hold_shadow',
    production_activation_authorized:false,
    automatic_promotion:false,
    observed_leader:observedLeader,
    distinct_snapshots:rows.length,
    match_growth:matchGrowth,
    latest_selection_status:latest?.selection_status||null,
    conditions:Object.freeze(conditions),
    next_step:evidenceReady?'MANUAL_RELEASE_REVIEW_ONLY':'CONTINUE_PASSIVE_DUAL_SHADOW_OBSERVATION',
    contract:CONTRACT
  });
}

module.exports={POLICY,CONTRACT,normalizeSnapshots,evaluatePromotion,production_active:false,automatic_promotion:false,owner_status:'shadow-gate-only'};
