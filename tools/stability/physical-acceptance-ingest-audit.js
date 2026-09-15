'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const reportArg=arg('--report');
const contractTest=process.argv.includes('--contract-test');
if(!reportArg)throw new Error('usage: node tools/stability/physical-acceptance-ingest-audit.js --report <physical-acceptance-report.json> [--contract-test]');
const reportPath=path.resolve(reportArg);
if(!fs.existsSync(reportPath))throw new Error(`physical acceptance report missing: ${reportPath}`);
const raw=fs.readFileSync(reportPath,'utf8');
const r=JSON.parse(raw);
const errors=[];
const need=(cond,msg)=>{if(!cond)errors.push(msg)};
const eq=(actual,expected,label)=>need(actual===expected,`${label}: expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);

// Privacy contract: presence booleans are allowed; raw values are not.
const forbiddenKeys=new Set(['password','lcu_password','authorization','auth_header','riot_id','riotid','game_name','tag_line','summoner_name','lockfile_path','raw_lockfile','raw_match_history','puuid']);
function scan(value,trail=[]){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach((v,i)=>scan(v,trail.concat(String(i))));return;}
  for(const [k,v] of Object.entries(value)){
    if(forbiddenKeys.has(String(k).toLowerCase()))errors.push(`forbidden personal/credential field present: ${trail.concat(k).join('.')}`);
    scan(v,trail.concat(k));
  }
}
scan(r);

eq(r.status,'SUCCESS','status');
eq(r.stage,'PHYSICAL_WINDOWS_LEAGUE_ACCEPTANCE','stage');
eq(r.privacy_safe,true,'privacy_safe');
eq(r.raw_personal_data_in_report,false,'raw_personal_data_in_report');
eq(r.candidate_version,'0.15.135','candidate_version');
eq(r.canonical_shadow_payload_present,true,'canonical_shadow_payload_present');
eq(r.production_cutover,false,'production_cutover');
eq(r.legacy_removal,false,'legacy_removal');
eq(r.app_alive_after_18s,true,'app_alive_after_18s');
eq(r.storage_identity_logged,true,'storage_identity_logged');
eq(r.fatal_load_error,false,'fatal_load_error');
eq(r.stable_user_data_identity,'aram-fearless-draft','stable_user_data_identity');

need(r.league&&typeof r.league==='object','league block missing');
if(r.league){
  eq(r.league.lockfile_found,true,'league.lockfile_found');
  eq(r.league.lcu_connected,true,'league.lcu_connected');
  eq(Number(r.league.http_status),200,'league.http_status');
  eq(r.league.puuid_present,true,'league.puuid_present');
  eq(r.league.credentials_in_report,false,'league.credentials_in_report');
}
need(r.research&&typeof r.research==='object','research block missing');
if(r.research){
  eq(r.research.database,'aram-rating-research-v03','research.database');
  eq(r.research.checkpoint,'checkpoint-v03','research.checkpoint');
  eq(Number(r.research.expected_matches),159,'research.expected_matches');
  eq(Number(r.research.before_matches),159,'research.before_matches');
  eq(Number(r.research.after_matches),159,'research.after_matches');
  eq(r.research.checkpoint_stable,true,'research.checkpoint_stable');
  const a=String(r.research.checkpoint_digest_before||''),b=String(r.research.checkpoint_digest_after||'');
  need(/^[a-f0-9]{64}$/i.test(a),'research.checkpoint_digest_before must be SHA-256');
  need(/^[a-f0-9]{64}$/i.test(b),'research.checkpoint_digest_after must be SHA-256');
  need(a&&a===b,'Research checkpoint digest changed across physical acceptance');
}
need(typeof r.acceptance_scope==='string'&&/Physical Windows PC/i.test(r.acceptance_scope),'acceptance_scope must identify physical Windows PC');
need(typeof r.acceptance_scope==='string'&&/real League Client\/LCU/i.test(r.acceptance_scope),'acceptance_scope must identify real League/LCU');

const synthetic=String(r.evidence_kind||'').toLowerCase()==='synthetic-ci-fixture';
if(synthetic&&!contractTest)errors.push('synthetic CI fixture is never valid release evidence');
const digest=crypto.createHash('sha256').update(raw).digest('hex');
const accepted=errors.length===0;
const releaseEvidence=accepted&&!synthetic&&!contractTest;
const result={
  status:accepted?'SUCCESS':'FAILURE',
  stage:'PHYSICAL_ACCEPTANCE_EVIDENCE_INGEST',
  input_sha256:digest,
  contract_test:contractTest,
  synthetic_fixture:synthetic,
  accepted_schema_and_safety:accepted,
  release_evidence:releaseEvidence,
  production_cutover_authorized:false,
  legacy_removal_authorized:false,
  errors
};
const out=path.resolve('audit-output/stability/physical-acceptance-ingest-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2),'utf8');
console.log(`PHYSICAL ACCEPTANCE INGEST: ${result.status}`,JSON.stringify({releaseEvidence,synthetic,errors:errors.length,input_sha256:digest}));
if(!accepted)process.exit(1);
