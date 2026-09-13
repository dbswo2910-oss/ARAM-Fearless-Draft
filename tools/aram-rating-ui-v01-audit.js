'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8')}
function has(s,x,msg){assert(s.includes(x),msg||`missing ${x}`)}
function lacks(s,x,msg){assert(!s.includes(x),msg||`unexpected ${x}`)}

const manifest=read('update/manifest.json');
const dev=read('research/aram-rating-ui-v01/research-ui-devtools.js');
const core=read('research/aram-rating-ui-v01/research-ui-core.js');
const engine=read('research/aram-rating-ui-v01/rating-engine-v01.js');
const readme=read('research/aram-rating-ui-v01/README.md');

// Research UI is not part of the production updater chain.
lacks(manifest,'aram-rating-ui-v01','production manifest must not load research UI');
lacks(manifest,'rating-ui-latest-run-v01','production manifest must not own research latest-run state');

// Read path only: no League/history collection and no competing production owner wrappers.
lacks(dev,'getAramMatchHistory(','Research refresh must not fetch match history');
lacks(dev,'renderAramHistoryFeedback =','must not replace history renderer');
lacks(dev,'openPlayerProfile =','must not replace player-profile owner');
lacks(dev,'window.aramHistoryState =','must not replace production history state');
has(dev,"const CHECKPOINT_KEY='checkpoint-v03',LATEST_RUN_KEY='rating-ui-latest-run-v01'",'must consume local Phase B checkpoint and latest-run storage');
has(dev,"#pp19c .ppbody",'must mount in existing player profile body');
has(dev,".pphero",'must mount after existing profile hero');
has(dev,'ARAM_RATING_RESEARCH_UI','feature flag missing');
has(dev,'refreshLocal','local refresh action missing');

// Explicit research/identity semantics and no public competitive product features.
has(core,'RESEARCH','research badge missing');
has(core,'Riot 공식 MMR 또는 랭크가 아닙니다.','research disclaimer missing');
has(core,'분석 데이터 없음','missing-player state missing');
has(core,'표본 부족','low-observation state missing');
has(core,'Research data unavailable','fail-safe state missing');
has(core,'PRIMARY MODEL','future candidate-winner promotion missing');
has(core,'no_clear_winner','no-clear-winner path missing');
has(core,'insufficient_real_data','insufficient-real-data path missing');
has(core,'Log Loss','detail metrics missing');
has(core,'Brier','detail metrics missing');
has(core,'ECE','detail metrics missing');
has(core,'Elo','Elo card missing');
has(core,'Glicko-family','Glicko card missing');
has(core,'TrueSkill-family','TrueSkill card missing');
lacks(core,'leaderboard','leaderboard must not be implemented');
lacks(core,'percentile','percentile must not be implemented');

// Engine mirrors the existing research family/gate, and latest-run is a materialized state.
has(engine,"schema:'aram-rating-ui-latest-run-v01'",'latest rating run schema missing');
has(engine,'500','500-match candidate gate missing');
has(engine,'100','100 frozen-test candidate gate missing');
has(engine,'class TeamElo','Elo research model missing');
has(engine,'class TeamGlicko','Glicko research model missing');
has(engine,'class TrueSkillTeam','TrueSkill research model missing');
has(engine,'puuid_to_player_id','canonical PUUID -> local internal id mapping missing');

// Manual/local-only operation is documented and no raw real-data artifact is tracked here.
has(readme,'Local-only','local-only contract missing');
has(readme,'checkpoint-v03','dataset source not documented');
has(readme,'rating-ui-latest-run-v01','latest-run contract not documented');
for(const rel of fs.readdirSync(path.join(ROOT,'research/aram-rating-ui-v01'))){
  assert(!/^aram-rating-(phase-b|real-sample)/.test(rel),`real identity-bearing sample must not be tracked: ${rel}`);
}

const report={
  status:'PASS',
  research_only:true,
  production_manifest_untouched:true,
  profile_mount:'#pp19c .ppbody after .pphero',
  feature_flag:'aram_rating_research_ui_enabled_v01 / window.ARAM_RATING_RESEARCH_UI',
  local_checkpoint:'aram-rating-research-v03 / checkpoint-v03',
  latest_run:'aram-rating-research-v03 / rating-ui-latest-run-v01',
  history_network_calls_from_ui:false,
  production_owner_replacement:false,
  model_cards:['elo','glicko','trueskill_family'],
  empty_state:true,
  low_sample_state:true,
  engine_unavailable_failsafe:true,
  public_leaderboard:false,
  percentile:false,
  official_mmr:false
};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-ui-v01-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
