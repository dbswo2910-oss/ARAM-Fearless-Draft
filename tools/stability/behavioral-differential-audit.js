'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output/stability/behavioral-differential-report.json');
const GOLDEN=JSON.parse(fs.readFileSync(path.join(ROOT,'stability/contracts/behavioral-golden.v1.json'),'utf8'));
const suite=[
  {domain:'draft-contract',legacy:'tools/draft-v01546-audit.js'},
  {domain:'random-candidate-dna',legacy:'tools/random-pick-candidate-dna-v01594-audit.js',successor:'tools/stability/random-dna-canonical-differential-audit.js'},
  {domain:'random-top5',legacy:'tools/random-pick-preview-lock-v015100-audit.js',successor:'tools/stability/random-top5-canonical-differential-audit.js'},
  {domain:'item-recommendation',legacy:'tools/item-recommendation-v01581-audit.js'},
  {domain:'match-history-parser',legacy:'tools/ingame-results-parser-v01597-audit.js',successor:'tools/stability/profile-results-canonical-differential-audit.js'},
  {domain:'state-integrity',legacy:'tools/v015117-state-integrity-audit.js',successor:'tools/stability/state-canonical-differential-audit.js'},
  {domain:'autosync-concurrency',legacy:'tools/v015119-autosync-concurrency-audit.js'},
  {domain:'riot-grade-linking',legacy:'tools/v015122-riot-grade-accuracy-audit.js'}
];
function clean(s){return String(s||'').replace(/\x1b\[[0-9;]*m/g,'').replaceAll(ROOT,'<ROOT>').replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g,'<ISO>').replace(/\\/g,'/').trim()}
function hash(s){return crypto.createHash('sha256').update(s).digest('hex')}
function run(rel){const abs=path.join(ROOT,rel);if(!fs.existsSync(abs))return{missing:true,script:rel};const r=cp.spawnSync(process.execPath,[abs],{cwd:ROOT,encoding:'utf8',env:{...process.env,TZ:'UTC',LANG:'C'}}),stdout=clean(r.stdout),stderr=clean(r.stderr);return{missing:false,script:rel,exit_code:r.status,stdout:r.stdout,stderr:r.stderr,stdout_sha256:hash(r.stdout),stderr_sha256:hash(r.stderr)}}
const results=[];
for(const entry of suite){
  const {domain,legacy,successor}=entry,expected=GOLDEN.fixtures[domain],legacyRun=run(legacy);
  if(legacyRun.missing){results.push({domain,status:'MISSING',legacy:legacyRun});continue}
  const historicalGoldenMatch=!!expected&&expected.stdout_sha256===legacyRun.stdout_sha256&&expected.stderr_sha256===legacyRun.stderr_sha256&&expected.exit_code===legacyRun.exit_code;
  if(successor){
    const successorRun=run(successor);
    const successorOk=!successorRun.missing&&successorRun.exit_code===0;
    results.push({domain,status:successorOk?'PASS':'FAIL',gate_mode:'canonical-successor-semantic-differential',historical_golden_match:historicalGoldenMatch,historical_legacy_exit_code:legacyRun.exit_code,successor:successorRun.script,successor_exit_code:successorRun.exit_code,successor_stdout_sha256:successorRun.stdout_sha256,successor_stderr_sha256:successorRun.stderr_sha256,successor_stdout:(successorRun.stdout||'').slice(0,4000),successor_stderr:(successorRun.stderr||'').slice(0,4000),legacy_stdout:(legacyRun.stdout||'').slice(0,1000),legacy_stderr:(legacyRun.stderr||'').slice(0,1000)});
    continue;
  }
  const executionOk=legacyRun.exit_code===0;
  results.push({domain,status:executionOk&&historicalGoldenMatch?'PASS':'FAIL',gate_mode:'historical-normalized-golden-output',exit_code:legacyRun.exit_code,stdout_sha256:legacyRun.stdout_sha256,stderr_sha256:legacyRun.stderr_sha256,historical_golden_match:historicalGoldenMatch,stdout:(legacyRun.stdout||'').slice(0,4000),stderr:(legacyRun.stderr||'').slice(0,4000)});
}
const failed=results.filter(x=>x.status!=='PASS'),report={schema:2,status:failed.length?'FAIL':'PASS',golden_version:GOLDEN.golden_version,golden_commit:GOLDEN.golden_commit,mode:'historical-golden-for-legacy-owners+canonical-semantic-successor-gates-for-migrated-domains',note:'Unmigrated legacy domains remain hard-gated to v0.15.135 normalized golden hashes. Migrated domains are gated by their dedicated canonical semantic differential audits; historical legacy hashes are retained as diagnostics and are no longer authoritative after the active v0.16 adapter cutover.',covered_domains:results.map(x=>x.domain),results};fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,covered:results.length,failed:failed.map(x=>x.domain),successor_gated:results.filter(x=>x.gate_mode==='canonical-successor-semantic-differential').map(x=>x.domain)}));if(failed.length)process.exit(1);
