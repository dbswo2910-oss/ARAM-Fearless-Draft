'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
const entry=manifest.files.find(x=>x.path==='profile-ux-v01537.js');
const result={status:'PASS',pass:[],fail:[]};
const ok=(name,cond,detail='')=>{(cond?result.pass:result.fail).push({name,detail});if(!cond)result.status='FAIL'};
if(!entry){ok('manifest profile UX v0.15.37',false,'missing');finish()}
const code=fs.readFileSync(path.join(ROOT,entry.source),'utf8');
ok('behavior-not-score metadata',/role_scout_reads_behavior_not_scores\s*:\s*true/.test(code));
ok('ESC close retained',/e\.key!==['"]Escape['"]/.test(code)&&/closeRoleMetricDetail/.test(code));
ok('v0.15.37 marker',/__ARAM_PROFILE_UX_V01537__/.test(code));

const samples={
  '탱커':{strong:[['engage','이니시',82],['cc','CC 영향력',85]],weak:['peel','보호/필',61]},
  '원딜':{strong:[['damage','딜 생산',88],['carry','지속딜',84]],weak:['survival','생존',62]},
  '메이지':{strong:[['cc','CC 영향력',79],['control','공간·제어',74]],weak:['eff','자원 효율',66]},
  '서포터':{strong:[['peel','보호/필',86],['allySustain','아군 유지력',83]],weak:['survival','생존',64]},
  '브루저':{strong:[['dive','진입',84],['frontline','전열',81]],weak:['survival','생존',63]},
  '암살자':{strong:[['burst','순간폭딜',87],['killConv','킬 전환',82]],weak:['survival','생존',58]}
};
for(const [role,s] of Object.entries(samples)){
  let scout='';
  const root={querySelector:q=>q==='.ppscout'?{get textContent(){return scout},set textContent(v){scout=v}}:null};
  const d={role,n:8,strong:s.strong.map(([k,l,v])=>({k,l,v})),weak:[{k:s.weak[0],l:s.weak[1],v:s.weak[2]}],roleTrend:1};
  const sandbox={console,setTimeout:fn=>{fn();return 1},MutationObserver:class{observe(){}},document:{addEventListener(){},documentElement:{},getElementById:id=>id==='pp19c'?root:id==='pp19ov'?{classList:{contains:()=>true}}:null},DATA:{},syncAppVersionUI(){},window:{aramRoleProfileContextV01523:{selectedRole:role},aramRoleProfileSpecializedV01530:{roleData:()=>d,roleTypes:()=>[{label:'test',desc:`${role} 역할 행동 패턴`}]},openPlayerProfile(){}}};
  Object.assign(sandbox,sandbox.window);sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.MutationObserver=sandbox.MutationObserver;sandbox.window.DATA=sandbox.DATA;sandbox.window.syncAppVersionUI=sandbox.syncAppVersionUI;
  vm.runInNewContext(code,sandbox);
  ok(`${role} scout generated`,scout.length>80,scout.slice(0,120));
  ok(`${role} scout does not read axis scores`,!s.strong.concat([s.weak]).some(x=>new RegExp(`\\b${x[2]}\\b`).test(scout)),scout);
  ok(`${role} scout has interpretation`,/플레이|교전|한타|화력|보호|전선|압박|기능|역할/.test(scout),scout);
}
finish();
function finish(){
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output','profile-ux-report.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({status:result.status,pass:result.pass.length,fail:result.fail.length}));
  if(result.fail.length){for(const x of result.fail)console.error('FAIL',x.name,x.detail||'');process.exitCode=1}
}
