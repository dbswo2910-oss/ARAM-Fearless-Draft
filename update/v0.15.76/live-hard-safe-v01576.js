'use strict';
function patch(mod){
  if(!mod||mod.__ARAM_LIVE_HARD_SAFE_V01576__)return mod;
  const Core=mod.LeagueAutoSyncCore;
  if(!Core?.prototype)throw new Error('v0.15.76 LeagueAutoSyncCore prototype unavailable');
  const oldGetState=Core.prototype.getState;
  const oldBuildInGame=Core.prototype.buildInGame;
  const oldLiveGet=Core.prototype.liveGet;
  const counters={buildInGameBypasses:0,stateSanitizes:0,liveGetBlocks:0};

  Core.prototype.buildInGame=async function(phase,queueId,gameId){
    counters.buildInGameBypasses++;
    this.__aramHardSafeLiveV01576={active:true,phase:String(phase||''),queueId:Number(queueId)||0,gameId:String(gameId||''),at:Date.now()};
    return {
      clientConnected:true,
      phase:'client',
      gameflowPhase:String(phase||'InProgress'),
      queueId:Number(queueId)||0,
      gameId,
      isAram:false,
      hardSafeLive:true,
      message:'게임 진행 중 · HARD SAFE MODE · 실시간 분석 일시 중지'
    };
  };

  Core.prototype.liveGet=async function(pathname){
    counters.liveGetBlocks++;
    const e=new Error('ARAM v0.15.76 HARD SAFE MODE: Live Client endpoint blocked: '+String(pathname||''));
    e.code='ARAM_HARD_SAFE_LIVE_BLOCKED';
    throw e;
  };

  if(typeof oldGetState==='function'){
    Core.prototype.getState=function(){
      const s=oldGetState.call(this);
      if(!s)return s;
      const inProgress=/^InProgress$/i.test(String(s.gameflowPhase||''))||s.hardSafeLive===true;
      if(!inProgress)return s;
      counters.stateSanitizes++;
      return {
        ...s,
        phase:'client',
        isAram:false,
        hardSafeLive:true,
        partySize:0,
        party:[],external:[],bench:[],candidatePool:[],
        team:[],enemy:[],inGameOur:[],inGameEnemy:[],inGameOurDetail:[],inGameEnemyDetail:[],recentEvents:[],
        localPlayer:null,currentGold:0,
        message:'게임 진행 중 · HARD SAFE MODE · 실시간 분석 일시 중지'
      };
    };
  }

  mod.aramLiveHardSafeV01576={
    version:'0.15.76',
    enabled:true,
    getStats:()=>({version:'0.15.76',enabled:true,counters:{...counters}}),
    score_logic_changed:false,
    saved:{buildInGame:oldBuildInGame,liveGet:oldLiveGet}
  };
  mod.__ARAM_LIVE_HARD_SAFE_V01576__=true;
  return mod;
}
module.exports={patch};
