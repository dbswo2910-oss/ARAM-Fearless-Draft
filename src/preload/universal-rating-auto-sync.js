'use strict';

const ACTIVE_PHASES=new Set(['INPROGRESS','INGAME','GAMESTART','PLAYING','RECONNECT']);
const TERMINAL_PHASES=new Set(['ENDOFGAME','PREENDOFGAME','POSTGAME','WAITINGFORSTATS']);
const STANDARD_ARAM_QUEUE=450;
const DEFAULT_DELAY_MS=5000;
const RETRY_DELAYS_MS=Object.freeze([0,8000,16000]);

function pick(obj,paths){
  for(const path of paths){
    let cur=obj;
    for(const key of path){if(cur==null){cur=undefined;break}cur=cur[key]}
    if(cur!==undefined&&cur!==null&&cur!=='')return cur;
  }
  return null;
}
function normPhase(v){return String(v||'').replace(/[^a-z]/gi,'').toUpperCase()}
function classifyAutoSyncState(state){
  const phase=normPhase(pick(state,[['gameflowPhase'],['phase'],['gamePhase'],['lifecycle','phase'],['gameflow','phase'],['game','phase'],['session','phase'],['status']]));
  const connectedRaw=pick(state,[['connected'],['leagueConnected'],['clientConnected'],['connection','connected']]);
  const connected=connectedRaw===false?false:true;
  const explicitInGame=pick(state,[['inGame'],['gameActive'],['gameInProgress'],['liveGame'],['game','active'],['session','inGame']]);
  const queueRaw=pick(state,[['queueId'],['game','queueId'],['session','queueId'],['gameData','queueId'],['queue','id']]);
  const queueId=Number.isFinite(Number(queueRaw))?Number(queueRaw):null;
  let inGame=explicitInGame===true;
  if(!inGame&&ACTIVE_PHASES.has(phase))inGame=true;
  const terminal=TERMINAL_PHASES.has(phase);
  return{phase,connected,inGame,terminal,queueId};
}

function createTransitionDetector({onGameEnd}={}){
  let seenGame=false,idleSamples=0,lastQueueId=null,lastPhase='';
  return{
    observe(raw){
      const s=classifyAutoSyncState(raw);lastPhase=s.phase||lastPhase;
      if(s.queueId!==null)lastQueueId=s.queueId;
      if(s.connected===false){idleSamples=0;return{event:null,...s,seenGame,lastQueueId}}
      if(s.inGame){seenGame=true;idleSamples=0;return{event:null,...s,seenGame,lastQueueId}}
      if(!seenGame)return{event:null,...s,seenGame,lastQueueId};
      idleSamples=s.terminal?2:idleSamples+1;
      if(idleSamples<2)return{event:null,...s,seenGame,lastQueueId};
      seenGame=false;idleSamples=0;
      const event={type:'GAME_END',phase:s.phase||lastPhase,queueId:lastQueueId,at:Date.now()};
      if(typeof onGameEnd==='function')onGameEnd(event);
      return{event,...s,seenGame,lastQueueId};
    },
    snapshot(){return{seenGame,idleSamples,lastQueueId,lastPhase}}
  };
}

function buildPreloadAutoSyncSource({historyChannel='match-history:load',ratingChannel='rating:universal-rate-resolved-history'}={}){
  return `\nconst __ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__=true;\n`+
`const __URAS_ACTIVE_PHASES=new Set(['INPROGRESS','INGAME','GAMESTART','PLAYING','RECONNECT']);\n`+
`const __URAS_TERMINAL_PHASES=new Set(['ENDOFGAME','PREENDOFGAME','POSTGAME','WAITINGFORSTATS']);\n`+
`let __urasSeenGame=false,__urasIdleSamples=0,__urasLastQueue=null,__urasLastPhase='',__urasSyncTask=null,__urasSyncTimer=null,__urasSubSeq=0;\n`+
`const __urasSubscribers=new Map();\n`+
`const __urasState={status:'IDLE',lastTriggerAt:null,lastSuccessAt:null,lastAttemptAt:null,lastNewMatches:0,lastError:'',lastPhase:'',lastQueueId:null,retries:0};\n`+
`function __urasPick(obj,paths){for(const path of paths){let cur=obj;for(const key of path){if(cur==null){cur=undefined;break}cur=cur[key]}if(cur!==undefined&&cur!==null&&cur!=='')return cur}return null}\n`+
`function __urasPhase(v){return String(v||'').replace(/[^a-z]/gi,'').toUpperCase()}\n`+
`function __urasClassify(raw){const phase=__urasPhase(__urasPick(raw,[['gameflowPhase'],['phase'],['gamePhase'],['lifecycle','phase'],['gameflow','phase'],['game','phase'],['session','phase'],['status']]));const connectedRaw=__urasPick(raw,[['connected'],['leagueConnected'],['clientConnected'],['connection','connected']]);const explicit=__urasPick(raw,[['inGame'],['gameActive'],['gameInProgress'],['liveGame'],['game','active'],['session','inGame']]);const q=__urasPick(raw,[['queueId'],['game','queueId'],['session','queueId'],['gameData','queueId'],['queue','id']]);const queueId=Number.isFinite(Number(q))?Number(q):null;return{phase,connected:connectedRaw===false?false:true,inGame:explicit===true||__URAS_ACTIVE_PHASES.has(phase),terminal:__URAS_TERMINAL_PHASES.has(phase),queueId}}\n`+
`function __urasPublicState(){return{...__urasState}}\n`+
`function __urasEmit(){const snap=__urasPublicState();for(const cb of __urasSubscribers.values())try{cb(snap)}catch{}}\n`+
`function __urasSubscribe(cb){if(typeof cb!=='function')return 0;const id=++__urasSubSeq;__urasSubscribers.set(id,cb);try{cb(__urasPublicState())}catch{}return id}\n`+
`function __urasUnsubscribe(id){return __urasSubscribers.delete(Number(id))}\n`+
`function __urasNewestTime(result){let best=0;for(const g of Array.isArray(result&&result.matches)?result.matches:[]){for(const row of [g,g&&g.game,g&&g.match,g&&g.data,g&&g.raw,g&&g.info]){if(!row)continue;for(const v of [row.gameEndTimestamp,row.gameEnd,row.timestamp,row.ts,row.createdAt,row.gameCreation,row.gameStartTimestamp]){const n=Number(v);if(Number.isFinite(n)&&n>best)best=n}}}return best}\n`+
`async function __urasRunSync(triggerAt,attempt){if(__urasSyncTask)return __urasSyncTask;__urasState.status='SYNCING';__urasState.lastAttemptAt=Date.now();__urasState.retries=attempt;__urasState.lastError='';__urasEmit();__urasSyncTask=(async()=>{try{const result=await universalRatingShadowHistory({target:{current:true},queueMode:'standard',limit:20,scan:40,priority:'background',latestProbe:true,__ratingAutoSyncReason:'GAME_END_AUTO_SYNC'});try{if(__universalRatingShadowTask)await __universalRatingShadowTask}catch{}const sidecar=__universalRatingShadowLastResult||null;const newest=__urasNewestTime(result);const newMatches=Number(sidecar&&sidecar.ingest&&sidecar.ingest.newMatches)||0;__urasState.lastNewMatches=newMatches;if(result&&result.connected!==false&&Array.isArray(result.matches)&&result.matches.length){__urasState.status='SYNCED';__urasState.lastSuccessAt=Date.now();__urasEmit();if(newMatches===0&&attempt<2&&(!newest||newest<triggerAt-120000)){const wait=[0,8000,16000][attempt+1]||16000;setTimeout(()=>void __urasRunSync(triggerAt,attempt+1),wait)}return result}throw new Error('history_not_ready')}catch(e){__urasState.status='RETRY_WAIT';__urasState.lastError=e&&e.message?String(e.message):String(e);__urasEmit();if(attempt<2){const wait=[0,8000,16000][attempt+1]||16000;setTimeout(()=>void __urasRunSync(triggerAt,attempt+1),wait)}else{__urasState.status='ERROR';__urasEmit()}return null}finally{__urasSyncTask=null}})();return __urasSyncTask}\n`+
`function __urasSchedule(event){if(__urasSyncTimer)clearTimeout(__urasSyncTimer);__urasState.status='WAITING_HISTORY';__urasState.lastTriggerAt=event.at;__urasState.lastQueueId=event.queueId;__urasState.lastPhase=event.phase||'';__urasEmit();__urasSyncTimer=setTimeout(()=>{__urasSyncTimer=null;void __urasRunSync(event.at,0)},${DEFAULT_DELAY_MS})}\n`+
`function __urasObserve(raw){const s=__urasClassify(raw);__urasState.lastPhase=s.phase||__urasState.lastPhase;if(s.queueId!==null){__urasLastQueue=s.queueId;__urasState.lastQueueId=s.queueId}if(s.connected===false){__urasIdleSamples=0;return}if(s.inGame){__urasSeenGame=true;__urasIdleSamples=0;__urasState.status='IN_GAME';return}if(!__urasSeenGame)return;__urasIdleSamples=s.terminal?2:__urasIdleSamples+1;if(__urasIdleSamples<2)return;__urasSeenGame=false;__urasIdleSamples=0;if(__urasLastQueue!==null&&__urasLastQueue!==${STANDARD_ARAM_QUEUE}){__urasState.status='IGNORED_NON_ARAM';__urasEmit();return}__urasSchedule({at:Date.now(),phase:s.phase,queueId:__urasLastQueue})}\n`+
`async function universalRatingAutoSyncState(){const out=await ipcRenderer.invoke('autosync:get-state');try{__urasObserve(out)}catch{}return out}\n`;
}

module.exports={ACTIVE_PHASES,TERMINAL_PHASES,STANDARD_ARAM_QUEUE,DEFAULT_DELAY_MS,RETRY_DELAYS_MS,classifyAutoSyncState,createTransitionDetector,buildPreloadAutoSyncSource,production_active:false,network_owner:false,extends_existing_autosync_owner:true};
