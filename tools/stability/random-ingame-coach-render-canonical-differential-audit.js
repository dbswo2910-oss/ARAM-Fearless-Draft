'use strict';
const vm=require('vm');const L=require('./lib');const next=require('../../src/random/ingame/coach-render');
function legacy(){
  const src=L.read('update/v0.15.50/random-ingame-coach-v01550.js');
  const start=src.indexOf('  function stateMeta('),end=src.indexOf('  function render(force=false)');
  L.must(start>=0&&end>start,'could not isolate legacy coach render helpers');
  const context={console};
  vm.runInNewContext(`const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const norm=s=>String(s??'').replace(/\\s+/g,' ').trim();const short=(s,n=92)=>{s=norm(s);return s.length>n?s.slice(0,n-1)+'…':s};const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;${src.slice(start,end)}\nglobalThis.api={stateMeta,autoTabFor,renderLive,renderBuild,detailThreats,renderDetail};`,context);
  return{api:context.api,source:src};
}
const old=legacy();
const base={source:'live',life:'alive',gameTime:742,gold:1480,respawn:0,alive:{our:5,enemy:4},threat:{name:'징크스',score:91,damageType:'물리'},item:{name:'란두인의 예언',reason:'치명타 위협'},alts:['정령의 형상','워모그의 갑옷'],stat:{tree:'가시 갑옷 → 워모그의 갑옷',source:'26.17 ARAM',verified:'A'},buildSame:false,job:'딜러 보호',matchup:'우세',power:{our:66,enemy:62,ourLevelAvg:13.2,enemyLevelAvg:13.5,ourItemAvg:10100,enemyItemAvg:10450},plan:{tone:'good',headline:'앞라인 유지',detail:'상대 진입을 한 번 받아낸 뒤 역진입',steps:['첫 CC 확인','딜러 보호']},warning:{tone:'warn',text:'징크스 위치 우선 확인'},threats:[{name:'징크스',score:91,damageType:'물리'},{name:'말파이트',score:76,damageType:'마법'}]};
const fixtures=[base,{...base,life:'dead',respawn:14,alive:{our:3,enemy:5}},{...base,life:'respawn',respawn:5},{source:'offline',life:'waiting',alive:{our:0,enemy:0},plan:{}}];
for(const m of fixtures){
  for(const fn of ['stateMeta','renderLive','renderBuild','detailThreats','renderDetail'])L.must(JSON.stringify(old.api[fn](m))===JSON.stringify(next[fn](m)),`${fn} drift for ${m.life}`);
  L.must(old.api.autoTabFor(m.life)===next.autoTabFor(m.life),`autoTabFor drift ${m.life}`);
}
let ui={tab:'live',auto:true,lastLife:'',lastRenderSig:''};
let step=next.nextUiState(ui,{...base,life:'dead',respawn:11},{preview:{active:false,state:'alive',scenario:'even',role:'tank'}});L.must(step.ui.tab==='build'&&step.shouldRender===true,'dead auto-tab transition drift');
ui=step.ui;step=next.nextUiState(ui,{...base,life:'dead',respawn:11},{preview:{active:false,state:'alive',scenario:'even',role:'tank'}});L.must(step.shouldRender===false,'stable coach signature should suppress duplicate render');
step=next.nextUiState(ui,{...base,life:'alive'},{preview:{active:false,state:'alive',scenario:'even',role:'tank'}});L.must(step.ui.tab==='live'&&step.shouldRender===true,'alive auto-tab transition drift');
for(const marker of ["if(ui.auto&&m.life!==ui.lastLife){ui.tab=autoTabFor(m.life)","const sig=JSON.stringify([preview.active,preview.state,preview.scenario,preview.role,ui.tab,ui.auto", "if(!force&&sig===ui.lastRenderSig)return"])L.must(old.source.includes(marker),`legacy coach contract marker missing: ${marker}`);
L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical coach render must remain scoring-neutral/inactive');
const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,legacy_source:'update/v0.15.50/random-ingame-coach-v01550.js',fixtures:fixtures.length,semantic_contract:['life state meta','AUTO dead→build / alive→live','live/build/detail body HTML parity','render signature duplicate suppression'],scoring_changed:false,cutover_allowed:false};L.write('audit-output/stability/random-ingame-coach-render-canonical-differential.json',report);console.log('RANDOM IN GAME COACH RENDER CANONICAL DIFFERENTIAL: SUCCESS');
