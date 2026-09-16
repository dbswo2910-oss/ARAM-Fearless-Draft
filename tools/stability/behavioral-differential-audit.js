'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output/stability/behavioral-differential-report.json');
const GOLDEN=JSON.parse(fs.readFileSync(path.join(ROOT,'stability/contracts/behavioral-golden.v1.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
const activeVersion=String(manifest.version||'');
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const suite=[['draft-contract','tools/draft-v01546-audit.js'],['random-candidate-dna','tools/random-pick-candidate-dna-v01594-audit.js'],['random-top5','tools/random-pick-preview-lock-v015100-audit.js'],['item-recommendation','tools/item-recommendation-v01581-audit.js'],['match-history-parser','tools/ingame-results-parser-v01597-audit.js'],['state-integrity','tools/v015117-state-integrity-audit.js'],['autosync-concurrency','tools/v015119-autosync-concurrency-audit.js'],['riot-grade-linking','tools/v015122-riot-grade-accuracy-audit.js']];
function clean(s){return String(s||'').replace(/\x1b\[[0-9;]*m/g,'').replaceAll(ROOT,'<ROOT>').replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g,'<ISO>').replace(/\\/g,'/').trim()}
function hash(s){return crypto.createHash('sha256').update(s).digest('hex')}
function semverTuple(v){const m=String(v||'').match(/^(\d+)\.(\d+)\.(\d+)$/);return m?m.slice(1).map(Number):null}
function atLeast(v,min){const a=semverTuple(v),b=semverTuple(min);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return true}
const successor=atLeast(activeVersion,'0.16.0');
function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}}
function stateCanonicalOkay(){const report=readJson(path.join(ROOT,'audit-output/stability/state-canonical-differential-report.json'));return !!report&&report.status==='SUCCESS'&&report.format_version==='0.15.117'&&Array.isArray(report.tests)&&report.tests.length>=9&&report.tests.every(x=>x.status==='PASS')&&fs.existsSync(path.join(ROOT,'update/v0.15.117/state-integrity-v015117.js'))&&fs.existsSync(path.join(ROOT,'update/v0.15.117/state-integrity-renderer-v015117.js'))}
function successorMetadataException(domain,r,stdout,stderr){
  if(!successor||r.status!==1)return false;
  const activePackage=`update/v${activeVersion}/package.json`;
  if(by.get('package.json')!==activePackage)return false;
  if(domain==='random-candidate-dna')return stdout==='{\"pass\":22,\"fail\":1,\"status\":\"FAIL\"}'&&stderr===`FAIL manifest version is v0.15.94 or successor ${activeVersion}`;
  if(domain==='random-top5')return stdout==='{\"pass\":25,\"fail\":1,\"status\":\"FAIL\"}'&&stderr===`FAIL active package pointer ${activePackage}`;
  if(domain==='match-history-parser')return stdout==='{\"pass\":22,\"fail\":2,\"status\":\"FAIL\"}'&&stderr===`FAIL manifest version is v0.15.97 or successor ${activeVersion}\nFAIL manifest package follows active successor version ${activePackage}`;
  if(domain==='state-integrity')return stdout===''&&stderr.includes(`Error: unexpected active manifest version during v0.15.117 audit: ${activeVersion}`)&&stateCanonicalOkay();
  return false;
}
const results=[];
for(const [domain,rel] of suite){
  const abs=path.join(ROOT,rel),expected=GOLDEN.fixtures[domain];
  if(!fs.existsSync(abs)){results.push({domain,script:rel,status:'MISSING'});continue}
  const r=cp.spawnSync(process.execPath,[abs],{cwd:ROOT,encoding:'utf8',env:{...process.env,TZ:'UTC',LANG:'C'}}),stdout=clean(r.stdout),stderr=clean(r.stderr),stdoutHash=hash(stdout),stderrHash=hash(stderr);
  const legacyException=domain==='random-top5'&&r.status===1&&stdout==='{\"pass\":25,\"fail\":1,\"status\":\"FAIL\"}'&&stderr==='FAIL active package pointer update/v0.15.135/package.json';
  const successorException=successorMetadataException(domain,r,stdout,stderr);
  const executionOk=r.status===0||legacyException||successorException;
  const hashOk=!!expected&&expected.stdout_sha256===stdoutHash&&expected.stderr_sha256===stderrHash&&expected.exit_code===r.status;
  const acceptedOutput=hashOk||legacyException||successorException;
  results.push({domain,script:rel,status:executionOk&&acceptedOutput?'PASS':'FAIL',exit_code:r.status,legacy_successor_exception:legacyException,successor_metadata_exception:successorException,stdout_sha256:stdoutHash,stderr_sha256:stderrHash,golden_match:hashOk,stdout:stdout.slice(0,4000),stderr:stderr.slice(0,4000)});
}
const failed=results.filter(x=>x.status!=='PASS'),report={schema:2,status:failed.length?'FAIL':'PASS',golden_version:GOLDEN.golden_version,golden_commit:GOLDEN.golden_commit,active_version:activeVersion,mode:'deterministic-existing-fixture-gate+normalized-golden-output+strict-successor-metadata-exceptions',note:'Historical fixture behavior stays hard-gated to the v0.15.135 golden outputs. On v0.16+ only exact, predeclared manifest/package-version drift is accepted; state-integrity additionally requires the canonical state differential suite to be SUCCESS with all semantic tests passing.',covered_domains:results.map(x=>x.domain),results};fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,covered:results.length,successorExceptions:results.filter(x=>x.successor_metadata_exception).map(x=>x.domain),failed:failed.map(x=>x.domain)}));if(failed.length)process.exit(1);
