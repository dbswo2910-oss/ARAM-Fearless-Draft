'use strict';
const MARK='/*ARAM_INGAME_TRANSITION_V01575*/';
const RULES=[
  {
    name:'autosync in-game apply skips pick pipeline',
    old:"lolAutoSync.lastAppliedAt=Date.now();persist();renderRandomInputs();runRandomCombos();return true}",
    next:"lolAutoSync.lastAppliedAt=Date.now();if(plan.kind==='in_game'){"+MARK+"try{window.aramDesktop?.traceFreeze?.({code:'IG110',stage:'AUTOSYNC_APPLY_INGAME_START',gameId:String(s?.gameId||s?.game?.gameId||'')})}catch{};try{window.aramRandomPracticeRuntimeV01572?.cancelCombos?.()}catch{};setTimeout(()=>{try{window.aramDesktop?.traceFreeze?.({code:'IG120',stage:'INGAME_OWNER_REFRESH_START'})}catch{};try{window.aramRandomIngameRuntimeV01570?.refresh?.()}finally{try{window.aramDesktop?.traceFreeze?.({code:'IG121',stage:'INGAME_OWNER_REFRESH_END'})}catch{}}},0);setTimeout(()=>{try{persist()}catch{}},350);try{window.aramDesktop?.traceFreeze?.({code:'IG119',stage:'AUTOSYNC_APPLY_INGAME_END'})}catch{};return true}persist();renderRandomInputs();runRandomCombos();return true}"
  },
  {
    name:'live detail uses single owner',
    old:"if(liveChanged&&s?.phase==='in_game'&&s?.isAram&&document.getElementById('random')?.classList.contains('active'))renderRandomDetails()",
    next:"if(liveChanged&&s?.phase==='in_game'&&s?.isAram&&document.getElementById('random')?.classList.contains('active')){try{window.aramDesktop?.traceFreeze?.({code:'IG130',stage:'LIVE_DETAIL_OWNER_REFRESH_QUEUED'})}catch{};setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)}"
  },
  {
    name:'in-game mode button avoids legacy details',
    old:"if(randomViewMode==='ingame')renderRandomDetails();",
    next:"if(randomViewMode==='ingame'){try{window.aramRandomPracticeRuntimeV01572?.cancelCombos?.()}catch{};try{window.aramDesktop?.traceFreeze?.({code:'IG200',stage:'INGAME_MODE_CLICK_QUEUED'})}catch{};setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)}"
  },
  {
    name:'Random tab avoids pick analysis while in-game view active',
    old:"if(id==='random'){syncRandomViewModeUI();renderRandomAnalysis()}",
    next:"if(id==='random'){syncRandomViewModeUI();if(randomViewMode==='ingame'){setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)}else renderRandomAnalysis()}"
  }
];
function patchIndexText(source){
  let text=String(source||''),changed=false;
  const results=[];
  for(const rule of RULES){
    const oldCount=text.split(rule.old).length-1;
    const newCount=text.split(rule.next).length-1;
    if(oldCount===1){text=text.replace(rule.old,rule.next);changed=true;results.push({name:rule.name,status:'patched'});continue}
    if(oldCount===0&&newCount===1){results.push({name:rule.name,status:'already-patched'});continue}
    results.push({name:rule.name,status:'contract-mismatch',oldCount,newCount});
  }
  const ok=results.every(x=>x.status!=='contract-mismatch');
  return{text,changed,ok,results,marker:text.includes(MARK)};
}
module.exports={MARK,RULES,patchIndexText,score_logic_changed:false};
