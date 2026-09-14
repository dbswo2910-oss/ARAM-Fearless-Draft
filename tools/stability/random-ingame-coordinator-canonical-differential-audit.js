'use strict';
const vm=require('vm');const L=require('./lib');const semantic=require('../../src/random/ingame/semantic-signature');const next=require('../../src/random/ingame/coordinator');
function legacyHarness(){
  let src=L.read('update/v0.15.70/runtime-random-ingame-v01570.js');
  const marker='window.aramRandomIngameRuntimeV01570={\n    version:V,';L.must(src.includes(marker),'legacy RANDOM IN GAME API marker missing');src=src.replace(marker,'window.aramRandomIngameRuntimeV01570={\n    __testTick:(force=false)=>tick(force),\n    version:V,');
  const actions={coach:0,icons:0},timers=[];const state={active:false,busy:false,mode:'ingame',live:null};
  const classList=(kind)=>({contains(name){if(kind==='root'&&name==='active')return state.active;if(kind==='shell'&&name==='preview')return false;return false}});
  const root={classList:classList('root'),getAttribute(){return state.mode}},shell={classList:classList('shell')},clock={textContent:'LIVE 00:00'},respawn={textContent:'0초'},gold={textContent:'보유 골드 0'};
  const document={visibilityState:'visible',addEventListener(){},querySelector(sel){if(sel==='#random')return root;if(sel==='#riCoachShellV01550')return shell;if(sel==='.riHeroTop em')return clock;if(sel==='.riRespawnStrip strong')return respawn;if(sel==='.riRespawnStrip b')return gold;return null}};
  const window={setInterval(){return 1},MutationObserver:undefined,addEventListener(){},aramRandomIngamePreviewV01550:{render(){actions.coach++}},aramItemIconsGlobalV01557:{refresh(){actions.icons++}}};
  const setTimeout=(fn,ms)=>{if(Number(ms)!==10000)timers.push(fn);return timers.length},clearTimeout=()=>{},clearInterval=()=>{};
  const context={window,document,setTimeout,clearTimeout,clearInterval,console,performance:{now:()=>0},lolAutoSync:{lastState:null},randomViewMode:'ingame',randomState:{ourModes:{Ahri:'AP'},enemyModes:{Jinx:'원딜'}},Math,Number,String,JSON,Date};context.globalThis=context;
  vm.runInNewContext(src,context);
  function sync(){context.randomViewMode=state.mode;context.lolAutoSync.lastState=state.live;window.__ARAM_PERF_PAUSE_V01568__=state.busy}
  return{state,actions,api:window.aramRandomIngameRuntimeV01570,sync,clock,respawn,gold};
}
const fixture={phase:'in_game',isAram:true,gameTime:61,currentGold:1200,localChampion:{name:'Ahri'},inGameOurDetail:[{championName:'Ahri',isLocal:true,level:7,scores:{kills:2,deaths:1,assists:4,creepScore:9},isDead:false,respawnTimer:0,items:[{itemID:6655,count:1}]}],inGameEnemyDetail:[{championName:'Jinx',level:7,scores:{kills:1,deaths:2,assists:3,creepScore:11},isDead:false,items:[{itemID:6672,count:1}]}],recentEvents:[{eventName:'ChampionKill',killerName:'Ahri',victimName:'Jinx'}]};
const old=legacyHarness(),canonState={active:false,busy:false,mode:'ingame',live:null},actions={coach:0,post:0,volatile:0,icons:0};
const coord=next.createCoordinator({readState:()=>canonState.live,semanticSignature:s=>semantic.semanticSignature(s,{randomMode:canonState.mode,ourModes:{Ahri:'AP'},enemyModes:{Jinx:'원딜'}}),isActive:()=>canonState.active&&canonState.mode==='ingame',isBusy:()=>canonState.busy,renderSemantic:()=>{actions.coach++},schedulePost:()=>{actions.post++},updateVolatile:()=>{actions.volatile++},refreshShop:()=>false,refreshGlobalIcons:()=>{actions.icons++},now:()=>123});
function legacyTick(force=false){old.sync();old.api.__testTick(force)}function both(force=false){legacyTick(force);coord.tick(force)}
for(let i=0;i<3;i++)both(false);
old.state.active=true;canonState.active=true;old.state.busy=true;canonState.busy=true;both(false);
old.state.busy=false;canonState.busy=false;old.state.live=fixture;canonState.live=fixture;both(false);both(false);
old.state.live={...fixture,currentGold:9999,gameTime:74};canonState.live={...fixture,currentGold:9999,gameTime:74};both(false);
old.state.live={...fixture,currentGold:9999,gameTime:91};canonState.live={...fixture,currentGold:9999,gameTime:91};both(false);both(true);
const legacy=old.api.getStats().counters,modern=coord.getState().counters;
for(const key of ['ticks','inactiveSkips','busySkips','semanticRefreshes','volatileRefreshes','globalIconRefreshes'])L.must(Number(legacy[key])===Number(modern[key]),`coordinator counter drift ${key}: ${legacy[key]} != ${modern[key]}`);
L.must(old.actions.coach===actions.coach,`coach render count drift ${old.actions.coach} != ${actions.coach}`);L.must(old.actions.icons===actions.icons,`global icon refresh drift ${old.actions.icons} != ${actions.icons}`);L.must(actions.post===actions.coach,'canonical post scheduling must occur once per semantic render');
L.must(modern.semanticRefreshes===3,'fixture should prove initial, bucket-change and force semantic renders');L.must(modern.volatileRefreshes===5,'fixture should prove volatile refresh on every active nonbusy tick');L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical coordinator must remain inactive/scoring-neutral');
const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,legacy_counters:Object.fromEntries(['ticks','inactiveSkips','busySkips','semanticRefreshes','volatileRefreshes','globalIconRefreshes'].map(k=>[k,legacy[k]])),canonical_counters:modern,actions,semantic_contract:['busy short-circuit','inactive skip','every-third inactive icon refresh','semantic render only on signature change or force','volatile refresh every active tick','post scheduled with semantic render'],shop_pipeline:'not migrated by this fixture',scoring_changed:false,cutover_allowed:false};L.write('audit-output/stability/random-ingame-coordinator-canonical-differential.json',report);console.log('RANDOM IN GAME COORDINATOR DIFFERENTIAL: SUCCESS · tick/render-gate counters preserved');
