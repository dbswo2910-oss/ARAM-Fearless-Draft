'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
function localLivePlayer(state){const ours=state?.inGameOurDetail||[],direct=ours.find(x=>x?.isLocal);if(direct)return direct;const localName=state?.localChampion?.name||state?.localChampion?.championName||'';return localName?ours.find(x=>x?.championName===localName):null}
function semanticSignature(state,{randomMode='',ourModes={},enemyModes={}}={}){
  const s=state;if(!s||s.phase!=='in_game'||!s.isAram)return JSON.stringify([s?.phase||'offline',!!s?.isAram,randomMode]);
  const rows=[...(s.inGameOurDetail||[]),...(s.inGameEnemyDetail||[])].map(p=>[p?.championName||'',Number(p?.level)||0,Number(p?.scores?.kills)||0,Number(p?.scores?.deaths)||0,Number(p?.scores?.assists)||0,Number(p?.scores?.creepScore)||0,!!p?.isDead,(p?.items||[]).map(x=>`${x?.itemID||''}:${x?.count||1}`).join(',')]);
  const ev=(s.recentEvents||[]).slice(-1)[0]||{},modes=JSON.stringify([ourModes||{},enemyModes||{}]),local=localLivePlayer(s),respawn=Math.max(0,Math.ceil(Number(local?.respawnTimer)||0)),respawnBand=!local?.isDead&&respawn<=0?'alive':respawn>7?'dead':'respawn',timeBucket=Math.floor(Math.max(0,Number(s.gameTime)||0)/30);
  return JSON.stringify([s.phase,!!s.isAram,rows,ev.eventName||'',ev.killerName||'',ev.victimName||'',modes,respawnBand,timeBucket]);
}
module.exports={IMPLEMENTATION_VERSION,localLivePlayer,semanticSignature,production_active:false,score_logic_changed:false,random_scoring_changed:false};
