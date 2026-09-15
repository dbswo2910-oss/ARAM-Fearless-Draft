'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const semantic=require('./semantic-signature');
function volatileHudModel(state){
  const s=state;if(!s||s.phase!=='in_game'||!s.isAram)return null;
  const sec=Math.max(0,Math.floor(Number(s.gameTime)||0)),clock=`LIVE ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  const local=semantic.localLivePlayer(s),respawn=Math.max(0,Math.ceil(Number(local?.respawnTimer)||0));
  const goldValue=Math.max(0,Math.floor(Number(s.currentGold)||0));
  return{clock,respawn,respawnText:respawn>0?`${respawn}초`:null,goldValue,goldText:`보유 골드 ${goldValue.toLocaleString('ko-KR')}`};
}
function applyVolatileHud(model,nodes={}){
  if(!model)return false;const em=nodes.clock,rs=nodes.respawn,gold=nodes.gold;
  if(em&&/^LIVE\s+\d{2}:\d{2}/.test(em.textContent||''))em.textContent=String(em.textContent).replace(/^LIVE\s+\d{2}:\d{2}/,model.clock);
  if(rs&&model.respawn>0&&rs.textContent!==model.respawnText)rs.textContent=model.respawnText;
  if(gold&&gold.textContent!==model.goldText)gold.textContent=model.goldText;
  return true;
}
module.exports={IMPLEMENTATION_VERSION,volatileHudModel,applyVolatileHud,production_active:false,score_logic_changed:false,random_scoring_changed:false};
