'use strict';
function patch(mod){
  if(!mod||mod.__ARAM_AUTOSYNC_TELEMETRY_V01534__)return mod;
  const Core=mod.LeagueAutoSyncCore;if(!Core?.prototype)return mod;
  const cache=new Map(),MAX_GAMES=240;
  const banned=/(?:puuid|summoner|account|riotid|riot_id|gamename|game_name|tagline|tag_line|displayname|display_name|accesstoken|access_token|token|password|email|phone|gameid|game_id)/i;
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const str=v=>v==null?'':String(v);
  const canon=v=>{const s=str(v).trim(),m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  function sanitize(root,depth=0,budget={n:0,max:900}){
    if(root==null)return null;
    const t=typeof root;
    if(t==='number')return Number.isFinite(root)?root:null;
    if(t==='boolean')return root;
    if(t==='string'||t!=='object'||depth>5)return null;
    if(Array.isArray(root)){
      const a=[];for(const v of root.slice(0,128)){const x=sanitize(v,depth+1,budget);if(x!=null)a.push(x);if(budget.n>=budget.max)break}return a.length?a:null;
    }
    const o={};
    for(const [k,v] of Object.entries(root)){if(budget.n>=budget.max)break;if(banned.test(k))continue;const x=sanitize(v,depth+1,budget);if(x==null)continue;o[k]=x;budget.n++}
    return Object.keys(o).length?o:null;
  }
  function leafCount(x){if(x==null)return 0;if(typeof x!=='object')return 1;if(Array.isArray(x))return x.reduce((a,v)=>a+leafCount(v),0);return Object.values(x).reduce((a,v)=>a+leafCount(v),0)}
  function touch(gid,pid,raw){
    gid=canon(gid);pid=num(pid);if(!gid||pid==null||!raw)return;
    let row=cache.get(gid);if(!row){row=new Map();cache.set(gid,row)}
    row.set(pid,raw);
    cache.delete(gid);cache.set(gid,row);
    while(cache.size>MAX_GAMES)cache.delete(cache.keys().next().value);
  }
  function visitGame(g){
    if(!g||typeof g!=='object')return;
    const gid=canon(g.gameId||g?.metadata?.matchId);if(!gid)return;
    const ps=Array.isArray(g.participants)?g.participants:Array.isArray(g?.info?.participants)?g.info.participants:[];
    for(const p of ps){const st=p?.stats&&typeof p.stats==='object'?p.stats:p,pid=num(p?.participantId??st?.participantId),raw=sanitize(st);if(raw)touch(gid,pid,raw)}
  }
  function scan(root){
    const seen=new Set();let visits=0;
    function walk(x){
      if(!x||typeof x!=='object'||seen.has(x)||visits>500)return;seen.add(x);visits++;
      if((x.gameId||x?.metadata?.matchId)&&(Array.isArray(x.participants)||Array.isArray(x?.info?.participants)))visitGame(x);
      if(Array.isArray(x)){for(const v of x.slice(0,180))walk(v);return}
      for(const [k,v] of Object.entries(x)){if(k==='participantIdentities'||k==='player'||k==='identity')continue;walk(v)}
    }walk(root);
  }
  const oldGet=Core.prototype.lcuGet;
  if(typeof oldGet==='function'&&!oldGet.__telemetryV01534){
    const wrapped=async function(pathname,...args){const out=await oldGet.call(this,pathname,...args);try{if(String(pathname||'').includes('/lol-match-history/'))scan(out)}catch{}return out};
    wrapped.__telemetryV01534=true;Core.prototype.lcuGet=wrapped;
  }
  const oldHistory=Core.prototype.getAramMatchHistory;
  if(typeof oldHistory==='function'&&!oldHistory.__telemetryV01534){
    const wrapped=async function(...args){
      const r=await oldHistory.apply(this,args);
      try{
        for(const m of Array.isArray(r?.matches)?r.matches:[]){
          const gid=canon(m?.gameId),pid=num(m?.me?.participantId),raw=cache.get(gid)?.get(pid);
          if(raw&&m?.me){m.me.rawGameplaySchema=1;m.me.rawGameplay=raw;m.rawGameplayAvailable=true;m.rawGameplayFieldCount=leafCount(raw)}
          else{m.rawGameplayAvailable=false;m.rawGameplayFieldCount=0}
        }
      }catch{}
      return r;
    };
    wrapped.__telemetryV01534=true;Core.prototype.getAramMatchHistory=wrapped;
  }
  mod.aramTelemetryV01534={sanitize,scan,cache,leafCount};
  mod.__ARAM_AUTOSYNC_TELEMETRY_V01534__=true;
  return mod;
}
module.exports={patch};
