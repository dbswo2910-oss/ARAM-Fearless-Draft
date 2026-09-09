'use strict';
(()=>{
  const V='0.15.20';
  try{
    if(typeof randomLivePlayerValue!=='function')throw new Error('randomLivePlayerValue unavailable');
    const basePlayerValue=randomLivePlayerValue;
    const cache=new Map();
    let enemyKeys=new Set(),lastGameTime=0,lastOurRoster='';
    const norm=s=>{try{return typeof randomLiveNormPlayerName==='function'?randomLiveNormPlayerName(s):String(s||'').trim().toLowerCase()}catch{return String(s||'').trim().toLowerCase()}};
    const pkey=p=>norm(p?.riotId||((p?.riotIdGameName||p?.gameName)?`${p?.riotIdGameName||p?.gameName}#${p?.riotIdTagLine||p?.tagLine||''}`:'')||p?.summonerName||p?.name||p?.championName||p?.rawChampionName||'');
    const items=p=>Array.isArray(p?.items)?p.items:[];
    const count=p=>items(p).filter(x=>x&&((Number(x.itemID)||Number(x.itemId)||Number(x.id)||0)>0||Number(x.price)||Number(x.cost)||x.displayName||x.name)).length;
    const rawValue=p=>{const v=Number(basePlayerValue(p));return Number.isFinite(v)&&v>0?v:0};
    const clonePlayer=p=>({...p,items:items(p).map(x=>x&&typeof x==='object'?{...x}:x)});
    function shouldHold(old,raw,cnt){
      if(!old||old.value<=0)return false;
      if(raw<=0&&old.count>0)return true;
      const drop=old.value-raw;
      if(cnt===0&&old.count>0&&drop>0)return true;
      if(cnt<old.count&&drop>=700&&raw<=old.value*.75)return true;
      return false;
    }
    function observeEnemy(p){
      const k=pkey(p);if(!k)return null;
      enemyKeys.add(k);
      const raw=rawValue(p),cnt=count(p),old=cache.get(k);
      if(shouldHold(old,raw,cnt)){
        old.hiddenFallback=true;old.lastRaw=raw;old.lastCount=cnt;return old;
      }
      const next={key:k,value:raw,count:cnt,player:clonePlayer(p),hiddenFallback:false,lastRaw:raw,lastCount:cnt};
      cache.set(k,next);return next;
    }
    function reset(){cache.clear();enemyKeys=new Set();lastGameTime=0;lastOurRoster=''}
    function sync(ctx){
      if(!ctx)return ctx;
      const t=Number(ctx.gameTime)||0;
      const ourRoster=(ctx.ours||[]).map(p=>pkey(p)||norm(p?.championName||p?.name)).filter(Boolean).sort().join('|');
      if((lastGameTime&&t&&t+30<lastGameTime)||(lastOurRoster&&ourRoster&&lastOurRoster!==ourRoster))reset();
      if(t)lastGameTime=Math.max(lastGameTime,t);if(ourRoster)lastOurRoster=ourRoster;
      enemyKeys=new Set();
      const current=Array.isArray(ctx.enemy)?ctx.enemy:[];
      const out=[];
      for(const p of current){const rec=observeEnemy(p);out.push(rec?.hiddenFallback&&rec.player?rec.player:p)}
      const present=new Set(current.map(pkey).filter(Boolean));
      for(const [k,rec] of cache){if(!present.has(k)&&rec.player){enemyKeys.add(k);out.push(rec.player)}}
      return out===current?ctx:{...ctx,enemy:out};
    }
    randomLivePlayerValue=function(p){
      const raw=rawValue(p),k=pkey(p);
      if(!k||!enemyKeys.has(k))return raw;
      const old=cache.get(k),cnt=count(p);
      if(shouldHold(old,raw,cnt))return old.value;
      if(old&&raw>=0){old.value=raw;old.count=cnt;old.player=clonePlayer(p);old.hiddenFallback=false;old.lastRaw=raw;old.lastCount=cnt}
      return raw;
    };
    const oldSummary=randomLiveSummaryHtml;
    randomLiveSummaryHtml=function(ctx,...args){const stable=sync(ctx);let html=oldSummary.call(this,stable,...args);return String(html||'').replace('장비가치 = Live Client에 보이는 현재 장착 아이템 가격 합계','장비가치 = 현재 관측값 · 미노출 시 마지막 확인값 유지')};
    if(typeof randomLiveTimingHtml==='function'){
      const oldTiming=randomLiveTimingHtml;
      randomLiveTimingHtml=function(ctx,...args){return oldTiming.call(this,sync(ctx),...args)};
    }
    if(typeof window.randomLiveStrengthSnapshotV01513==='function'){
      const oldSnap=window.randomLiveStrengthSnapshotV01513;
      window.randomLiveStrengthSnapshotV01513=function(ctx,...args){return oldSnap.call(this,sync(ctx),...args)};
    }
    window.aramLiveItemMemoryV01520={version:V,reset,cache,sync,get cachedEnemies(){return [...cache.values()].map(x=>({key:x.key,value:x.value,count:x.count,hiddenFallback:!!x.hiddenFallback,lastRaw:x.lastRaw,lastCount:x.lastCount}))}};
    window.__ARAM_LIVE_ITEM_MEMORY_V01520__=true;
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.live_item_memory_v01520={version:'v0.15.20 · LIVE Last-Seen Item Memory',principle:'enemy item value never collapses only because Live Client temporarily hides item slots',fallback:'last observed enemy equipment value',new_match_reset:true,hidden_gold_estimate:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    if(typeof renderRandomDetails==='function')setTimeout(()=>{try{renderRandomDetails()}catch{}},0);
  }catch(e){console.error('[v0.15.20] LIVE item memory patch failed',e);window.__ARAM_LIVE_ITEM_MEMORY_V01520__=false}
})();
