'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`${label} parse failed: ${e.message}`)}};
const count=(src,n)=>String(src).split(n).length-1;
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`missing ${label}: ${n}`)};
const report={version:'0.15.124',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.124/';
const main=read(dir+'main-v015124.js');
const route=read(dir+'successor-route-hotfix-v015124.js');
const rt=read(dir+'runtime-source-stability-v015124.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [n,s] of [['main',main],['route helper',route],['runtime',rt]])parse(s,n);
if(pkg.version!=='0.15.124'||pkg.main!=='main-v015124.js')throw new Error('v0.15.124 package mismatch');
ok('syntax-package');

for(const [n,l] of [
  ["require('./successor-route-hotfix-v015124')",'tested route helper'],
  ["path.join(__dirname,'main-v015122.js')",'known-good recovery base'],
  ["via:'main-v015123.js'",'successor lineage'],
  ["recoveryBase:'main-v015122.js'",'recovery lineage'],
  ["root:'main-v01579.js'",'permanent safety root']
])must(main,n,l);
for(const [n,l] of [
  ["'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')",'old route fragment'],
  ["'0.15.124').replaceAll(stabilityAnchor,'runtime-source-stability-v015124')",'new route fragment'],
  ['routeHits!==1','unique route guard']
])must(route,n,l);
ok('main-route-contract');

const helper=require(path.join(ROOT,dir+'successor-route-hotfix-v015124.js'));
const predecessor=read('update/v0.15.122/main-v015122.js');
if(count(predecessor,helper.OLD_ROUTE_FRAGMENT)!==1)throw new Error('actual v0.15.122 predecessor does not contain exactly one recoverable route fragment');
const patched=helper.patchSuccessorSource(predecessor);
if(count(patched,helper.OLD_ROUTE_FRAGMENT)!==0||count(patched,helper.NEW_ROUTE_FRAGMENT)!==1)throw new Error('route helper did not produce exact v0.15.124 successor route');
parse(patched,'patched v0.15.122 predecessor');
ok('actual-predecessor-route-smoke');

const main123=read('update/v0.15.123/main-v015123.js');
must(main123,"OLD_ROUTE_FRAGMENT=\"'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')\"",'v0.15.123 repaired route matcher');
must(main123,'routeHits!==1','v0.15.123 route cardinality guard');
const patched123=predecessor.replace("'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')","'0.15.123').replaceAll(stabilityAnchor,'runtime-source-stability-v015123')");
parse(patched123,'repaired v0.15.123 predecessor transform');
ok('historical-v123-source-repaired');

for(const [n,l] of [
  ["require('../v0.15.123/runtime-source-stability-v015123')",'v123 runtime predecessor'],
  ["startup_successor_route_hotfix:true",'hotfix marker'],
  ["policy_version:'0.15.124'",'policy version'],
  ['score_logic_changed:false','scoring neutrality'],
  ['random_scoring_changed:false','Random neutrality']
])must(rt,n,l);
const base123=require(path.join(ROOT,'update/v0.15.123/runtime-source-stability-v015123.js'));
const next124=require(path.join(ROOT,dir+'runtime-source-stability-v015124.js'));
for(const target of ['input-interaction-stability-v01539.js','runtime-random-practice-v01572.js','runtime-live-autosync-v01571.js','riot-grade-ui-v01528.js']){
  const manifest=JSON.parse(read('update/manifest.json'));
  const row=(manifest.files||[]).find(x=>x.path===target);
  if(!row||!exists(row.source))throw new Error(`active source missing for ${target}`);
  const source=read(row.source);
  if(base123.patchRuntimeSource(target,source)!==next124.patchRuntimeSource(target,source))throw new Error(`v0.15.124 unexpectedly changes runtime target ${target}`);
}
ok('runtime-byte-preserved');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(String(manifest.version)==='0.15.124'){
  const expected={
    'successor-route-hotfix-v015124.js':'update/v0.15.124/successor-route-hotfix-v015124.js',
    'runtime-source-stability-v015124.js':'update/v0.15.124/runtime-source-stability-v015124.js',
    'main-v015124.js':'update/v0.15.124/main-v015124.js',
    'package.json':'update/v0.15.124/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`active v124 manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-v124-manifest');
}else if(['0.15.125','0.15.126','0.15.127','0.15.128'].includes(String(manifest.version))){
  const preserved={
    'successor-route-hotfix-v015124.js':'update/v0.15.124/successor-route-hotfix-v015124.js',
    'runtime-source-stability-v015124.js':'update/v0.15.124/runtime-source-stability-v015124.js',
    'main-v015124.js':'update/v0.15.124/main-v015124.js'
  };
  for(const [p,s] of Object.entries(preserved))if(map.get(p)!==s)throw new Error(`successor dropped v124 safety artifact ${p}: ${map.get(p)||'missing'}`);
  const v=String(manifest.version),compact=v.replaceAll('.','');
  const pkgExpected=`update/v${v}/package.json`;
  const mainTarget=`main-v${compact}.js`,mainExpected=`update/v${v}/${mainTarget}`;
  if(map.get('package.json')!==pkgExpected)throw new Error(`${v} successor package mismatch: ${map.get('package.json')||'missing'}`);
  if(map.get(mainTarget)!==mainExpected)throw new Error(`${v} successor main missing: ${map.get(mainTarget)||'missing'}`);
  ok(`verified-${v}-successor-manifest`);
}else if(String(manifest.version)==='0.15.123')ok('preactivation-v123-manifest');
else throw new Error(`unexpected manifest version for v0.15.124 rollout: ${manifest.version}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015124-startup-successor-route-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:manifest.version},null,2)+'\n');
console.log('v0.15.124 STARTUP SUCCESSOR ROUTE AUDIT: SUCCESS');