'use strict';
let base;
try{base=require('../v0.15.121/runtime-source-stability-v015121')}catch{base=require('./runtime-source-stability-v015121')}

function count(src,needle){return String(src).split(needle).length-1}
function exact(src,from,to,label){
  if(src.includes(to))return src;
  const n=count(src,from);
  if(n!==1)throw new Error(`v0.15.122 source contract mismatch ${label} count=${n}`);
  return src.replace(from,to);
}
function patchGradeUi(src){
  const old=`  function findRecord(s,m){const gid=canon(m?.gameId),puuid=targetPuuid();return (s?.records||[]).find(r=>canon(r.gameId)===gid&&(!puuid||!r.puuid||String(r.puuid)===puuid))||null}`;
  const next=`  function trustedRiotRecord(r){return !!(r&&r.gradeProvenance==='riot-primary-update'&&String(r.grade||'').trim()&&canon(r.gameId)&&Number.isFinite(Number(r.championId)))}\n  function findRecord(s,m){const gid=canon(m?.gameId),puuid=targetPuuid(),championId=Number(m?.me?.championId);if(!gid||!Number.isFinite(championId))return null;return (s?.records||[]).filter(r=>trustedRiotRecord(r)&&canon(r.gameId)===gid&&Number(r.championId)===championId&&(!puuid||!r.puuid||String(r.puuid)===puuid)).sort((a,b)=>num(b.capturedAt)-num(a.capturedAt))[0]||null}`;
  src=exact(src,old,next,'Riot Grade detail matcher');
  src=exact(src,
    "<small>${rec.gameIdSource==='mastery-update'?'직접 gameId':'EOG gameId 연결'}</small>",
    "<small>${rec.gameIdSource==='mastery-update'?'Riot primary · 직접 gameId':'Riot primary · EOG gameId 연결'}</small>",
    'Riot Grade provenance label');
  src=exact(src,
    "const msg=other?'Riot Grade는 현재 로그인된 내 계정의 종료 경기만 자동 수집합니다.':`이 경기 Riot Grade 기록 없음 · ${esc(s?.lastResult||'다음 게임 종료 후 자동 수집')}`;",
    "const legacy=(s?.records||[]).some(r=>canon(r?.gameId)===canon(m?.gameId)&&String(r?.gradeProvenance||'').startsWith('legacy-'));const msg=other?'Riot Grade는 현재 로그인된 내 계정의 종료 경기만 자동 수집합니다.':legacy?'이 경기에는 구버전 Grade 기록이 있지만 정확성 검증 대상에서 제외했습니다.':`이 경기 Riot Grade 기록 없음 · ${esc(s?.lastResult||'다음 게임 종료 후 자동 수집')}`;",
    'legacy record warning');
  src=exact(src,
    "window.aramRiotGradeV01528={state,findRecord,annotate,ownGrade,verdict};",
    "window.aramRiotGradeV01528={state,findRecord,trustedRiotRecord,annotate,ownGrade,verdict,accuracyVersion:'0.15.122'};",
    'Riot Grade UI diagnostics');
  src=exact(src,
    "DATA.riot_grade_v01528={version:'v0.15.28 · Riot Grade Collector',source:'LCU /lol-end-of-game/v1/champion-mastery-updates',scoring_use:false,local_only:true,retroactive:false}",
    "DATA.riot_grade_v01528={version:'v0.15.122 · Riot Grade Accuracy',source:'LCU primary ChampionMasteryUpdate only',scoring_use:false,local_only:true,retroactive:false,member_grades_ignored:true,exact_champion_match:true}",
    'Riot Grade UI metadata');
  return src;
}
function patchCalibrationHistory(src){
  const oldMatch=`  function matchGrade(records,s,puuid){return records.find(r=>canon(r?.gameId)===s.gameId&&(!puuid||!r?.puuid||String(r.puuid)===puuid)&&(s.championId==null||r?.championId==null||Number(r.championId)===Number(s.championId)))||null}`;
  const nextMatch=`  function trustedRiotRecord(r){return !!(r&&r.gradeProvenance==='riot-primary-update'&&coarse(r.grade)&&canon(r.gameId)&&Number.isFinite(Number(r.championId)))}\n  function matchGrade(records,s,puuid){if(s.championId==null)return null;return records.find(r=>trustedRiotRecord(r)&&canon(r?.gameId)===s.gameId&&(!puuid||!r?.puuid||String(r.puuid)===puuid)&&Number(r.championId)===Number(s.championId))||null}`;
  src=exact(src,oldMatch,nextMatch,'calibration snapshot matcher');
  src=exact(src,
    "  function rowFromRecord(r,queueId,puuid){\n    const s=r?.roleSnapshot;if(!s||s.schema!==1||s.engineKey!==ENGINE_KEY||Number(s.queueId)!==Number(queueId))return null;",
    "  function rowFromRecord(r,queueId,puuid){\n    if(!trustedRiotRecord(r))return null;\n    const s=r?.roleSnapshot;if(!s||s.schema!==1||s.engineKey!==ENGINE_KEY||Number(s.queueId)!==Number(queueId))return null;",
    'calibration authoritative row filter');
  src=exact(src,
    "const all=Array.isArray(state?.records)?state.records:[],eligible=all.filter(r=>!puuid||!r?.puuid||String(r.puuid)===puuid),map=new Map();",
    "const all=Array.isArray(state?.records)?state.records:[],eligible=all.filter(r=>trustedRiotRecord(r)&&(!puuid||!r?.puuid||String(r.puuid)===puuid)),map=new Map();",
    'calibration authoritative record count');
  src=exact(src,
    "window.aramRiotGradeCalibrationHistoryV01532={analyze,render,syncSnapshots,summary,coarse,ownGrade,engineKey:ENGINE_KEY};",
    "window.aramRiotGradeCalibrationHistoryV01532={analyze,render,syncSnapshots,summary,coarse,ownGrade,trustedRiotRecord,engineKey:ENGINE_KEY,accuracyVersion:'0.15.122'};",
    'calibration diagnostics');
  src=exact(src,
    "※ Riot Grade는 외부 검증 라벨일 뿐 ROLE 점수에 합산하지 않습니다. 저장 스냅샷은 Queue와 ROLE 엔진 기준을 함께 기록하며, 다른 엔진 기준의 오래된 스냅샷은 현재 집계에서 제외합니다.",
    "※ Riot Grade는 LCU의 본인 primary ChampionMasteryUpdate만 사용합니다. memberGrades/구버전 미검증 기록은 집계에서 제외하며 ROLE 점수에는 합산하지 않습니다.",
    'calibration explanatory note');
  return src;
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='riot-grade-ui-v01528.js')src=patchGradeUi(src);
  if(file==='riot-grade-calibration-history-v01532.js')src=patchCalibrationHistory(src);
  return src;
}
module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  riot_grade_accuracy_changed:true,
  riot_grade_primary_only:true,
  riot_grade_exact_champion_match:true,
  riot_grade_legacy_untrusted:true,
  random_pick_owner:'runtime-v015100',
  random_practice_runtime_owner:'runtime-random-practice-v01572+v015121',
  data_view_owner:'ui-stability-v015115',
  state_integrity_owner:'state-integrity-v015117',
  resource_lifecycle_owner:'resource-lifecycle-v015118',
  autosync_main_owner:'autosync-concurrency-v015119',
  autosync_renderer_owner:'runtime-live-autosync-v01571+v015119',
  activation_targets:[...new Set([...(base.activation_targets||[]),'riot-grade-ui-v01528.js','riot-grade-calibration-history-v01532.js'])],
  policy_version:'0.15.122'
};
