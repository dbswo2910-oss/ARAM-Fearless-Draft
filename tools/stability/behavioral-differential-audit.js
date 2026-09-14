'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output/stability/behavioral-differential-report.json');
const suite=[
  ['draft-contract','tools/draft-v01546-audit.js'],
  ['random-candidate-dna','tools/random-pick-candidate-dna-v01594-audit.js'],
  ['random-top5','tools/random-pick-preview-lock-v015100-audit.js'],
  ['item-recommendation','tools/item-recommendation-v01581-audit.js'],
  ['match-history-parser','tools/ingame-results-parser-v01597-audit.js'],
  ['state-integrity','tools/v015117-state-integrity-audit.js'],
  ['autosync-concurrency','tools/v015119-autosync-concurrency-audit.js'],
  ['riot-grade-linking','tools/v015122-riot-grade-accuracy-audit.js']
];
function clean(s){return String(s||'').replace(/\x1b\[[0-9;]*m/g,'').replaceAll(ROOT,'<ROOT>').replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g,'<ISO>').replace(/\\/g,'/').trim()}
function hash(s){return crypto.createHash('sha256').update(s).digest('hex')}
const results=[];
for(const [domain,rel] of suite){const abs=path.join(ROOT,rel);if(!fs.existsSync(abs)){results.push({domain,script:rel,status:'MISSING'});continue}const r=cp.spawnSync(process.execPath,[abs],{cwd:ROOT,encoding:'utf8',env:{...process.env,TZ:'UTC',LANG:'C'}});const stdout=clean(r.stdout),stderr=clean(r.stderr);results.push({domain,script:rel,status:r.status===0?'PASS':'FAIL',exit_code:r.status,stdout_sha256:hash(stdout),stdout:stdout.slice(0,4000),stderr:stderr.slice(0,4000)})}
const failed=results.filter(x=>x.status!=='PASS');const report={schema:1,status:failed.length?'FAIL':'PASS',golden_version:'0.15.135',mode:'deterministic-existing-fixture-gate',note:'This gate executes established deterministic fixture/audit paths and fingerprints normalized outputs. Canonical shadow owners must later be run against the same fixture inputs before cutover.',covered_domains:results.map(x=>x.domain),results};fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,covered:results.length,failed:failed.map(x=>x.domain)}));if(failed.length)process.exit(1);
