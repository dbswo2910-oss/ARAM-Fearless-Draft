'use strict';

// Accuracy-first ARAM MMR research model.
//
// The model intentionally uses match outcome + opponent/team network as the
// primary skill signal. Champion effects are nuisance variables used only to
// separate champion strength from player skill; KDA/damage are not used to
// award rating points.

const BASE_RATING=1500;
const RATING_SCALE=400/Math.log(10); // one natural-logit unit in Elo-like points
const DAY_MS=24*60*60*1000;
const EPS=1e-12;

const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const sigmoid=z=>{
  if(z>=0){const e=Math.exp(-Math.min(40,z));return 1/(1+e)}
  const e=Math.exp(Math.max(-40,z));return e/(1+e);
};
const mean=xs=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:0;
const finite=v=>Number.isFinite(Number(v))?Number(v):null;

function sortedMatches(matches){
  return (Array.isArray(matches)?matches:[])
    .filter(m=>Array.isArray(m?.teamA)&&m.teamA.length===5&&Array.isArray(m?.teamB)&&m.teamB.length===5)
    .slice()
    .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0)||String(a.matchId||'').localeCompare(String(b.matchId||'')));
}

function participantMap(match){
  const out=new Map();
  for(const p of Array.isArray(match?.participants)?match.participants:[]){
    const id=String(p?.puuid||'').trim();
    if(id)out.set(id,p);
  }
  return out;
}

function championIds(match,team){
  const byId=participantMap(match);
  return (Array.isArray(team)?team:[]).map(id=>{
    const n=finite(byId.get(String(id))?.championId);
    return n===null?null:String(Math.trunc(n));
  });
}

function recencyWeight(timestamp,latestTimestamp,halfLifeDays){
  const half=finite(halfLifeDays);
  if(half===null||half<=0||!latestTimestamp||!timestamp)return 1;
  const ageDays=Math.max(0,(latestTimestamp-timestamp)/DAY_MS);
  return Math.pow(0.5,ageDays/half);
}

function cacheKey(matches,config={}){
  const rows=sortedMatches(matches);
  let h=2166136261;
  const mix=text=>{text=String(text);for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}};
  mix(JSON.stringify({
    playerPriorSd:config.playerPriorSd,
    championPriorSd:config.championPriorSd,
    championWeight:config.championWeight,
    halfLifeDays:config.halfLifeDays,
    iterations:config.iterations,
    learningRate:config.learningRate
  }));
  for(const m of rows){
    mix(m.matchId);mix(m.timestamp);mix(m.teamAWin?1:0);
    for(const id of m.teamA)mix(id);
    for(const id of m.teamB)mix(id);
    const cs=championIds(m,[...m.teamA,...m.teamB]);for(const c of cs)mix(c||'');
  }
  return `${rows.length}:${(h>>>0).toString(16).padStart(8,'0')}`;
}

class UnionFind{
  constructor(){this.parent=new Map();this.size=new Map()}
  add(x){x=String(x);if(!this.parent.has(x)){this.parent.set(x,x);this.size.set(x,1)}return x}
  find(x){x=this.add(x);let p=this.parent.get(x);if(p!==x){p=this.find(p);this.parent.set(x,p)}return p}
  union(a,b){a=this.find(a);b=this.find(b);if(a===b)return a;let sa=this.size.get(a)||1,sb=this.size.get(b)||1;if(sa<sb){[a,b]=[b,a];[sa,sb]=[sb,sa]}this.parent.set(b,a);this.size.set(a,sa+sb);return a}
  componentSize(x){const r=this.find(x);return this.size.get(r)||1}
}

class NetworkBradleyTerry{
  constructor({
    playerPriorSd=300,
    championPriorSd=80,
    championWeight=1,
    halfLifeDays=null,
    iterations=120,
    learningRate=0.045,
    uncertaintyInflation=1.35
  }={}){
    this.name='network_bt';
    this.playerPriorSd=Math.max(80,Number(playerPriorSd)||300);
    this.championPriorSd=Math.max(20,Number(championPriorSd)||80);
    this.championWeight=clamp(Number(championWeight)||0,0,2);
    this.halfLifeDays=halfLifeDays==null?null:Math.max(1,Number(halfLifeDays)||1);
    this.iterations=Math.max(20,Math.min(400,Math.trunc(Number(iterations)||120)));
    this.learningRate=clamp(Number(learningRate)||0.045,0.003,0.2);
    this.uncertaintyInflation=clamp(Number(uncertaintyInflation)||1.35,1,3);
    this.players=new Map();
    this.champions=new Map();
    this.games=new Map();
    this.effectiveGames=new Map();
    this.hessian=new Map();
    this.uf=new UnionFind();
    this.componentMatches=new Map();
    this.teammates=new Map();
    this.opponents=new Map();
    this.fittedMatches=0;
    this.latestTimestamp=0;
    this.objective=null;
  }

  config(){return{
    playerPriorSd:this.playerPriorSd,
    championPriorSd:this.championPriorSd,
    championWeight:this.championWeight,
    halfLifeDays:this.halfLifeDays,
    iterations:this.iterations,
    learningRate:this.learningRate,
    uncertaintyInflation:this.uncertaintyInflation
  }}

  _player(id){id=String(id);if(!this.players.has(id))this.players.set(id,0);return this.players.get(id)}
  _champ(id){if(id==null||id==='')return 0;id=String(id);if(!this.champions.has(id))this.champions.set(id,0);return this.champions.get(id)}
  _setRelation(map,id,others){id=String(id);let s=map.get(id);if(!s){s=new Set();map.set(id,s)}for(const x of others)if(String(x)!==id)s.add(String(x))}

  _indexNetwork(rows){
    for(const m of rows){
      const all=[...m.teamA,...m.teamB].map(String);
      all.forEach(x=>this.uf.add(x));
      for(let i=1;i<all.length;i++)this.uf.union(all[0],all[i]);
      for(const id of m.teamA){this._setRelation(this.teammates,id,m.teamA);this._setRelation(this.opponents,id,m.teamB)}
      for(const id of m.teamB){this._setRelation(this.teammates,id,m.teamB);this._setRelation(this.opponents,id,m.teamA)}
    }
    const counts=new Map();
    for(const m of rows){const root=this.uf.find(m.teamA[0]);counts.set(root,(counts.get(root)||0)+1)}
    this.componentMatches=counts;
  }

  _matchTerms(match){
    const a=match.teamA.map(id=>this._player(id));
    const b=match.teamB.map(id=>this._player(id));
    let z=mean(a)-mean(b);
    let ca=[],cb=[];
    if(this.championWeight>0){
      ca=championIds(match,match.teamA);
      cb=championIds(match,match.teamB);
      z+=this.championWeight*(mean(ca.map(id=>this._champ(id)))-mean(cb.map(id=>this._champ(id))));
    }
    return{z,ca,cb};
  }

  fit(matches){
    const rows=sortedMatches(matches);
    this.players.clear();this.champions.clear();this.games.clear();this.effectiveGames.clear();this.hessian.clear();this.uf=new UnionFind();this.componentMatches=new Map();this.teammates=new Map();this.opponents=new Map();
    this.fittedMatches=rows.length;
    this.latestTimestamp=rows.reduce((m,x)=>Math.max(m,Number(x.timestamp)||0),0);
    if(!rows.length){this.objective=0;return this}
    for(const m of rows){for(const id of [...m.teamA,...m.teamB])this._player(id);if(this.championWeight>0){for(const c of championIds(m,[...m.teamA,...m.teamB]))if(c)this._champ(c)}}
    this._indexNetwork(rows);

    const pPriorLatent=this.playerPriorSd/RATING_SCALE;
    const cPriorLatent=this.championPriorSd/RATING_SCALE;
    const pPrec=1/(pPriorLatent*pPriorLatent);
    const cPrec=1/(cPriorLatent*cPriorLatent);
    const pM=new Map(),pV=new Map(),cM=new Map(),cV=new Map();
    const b1=.9,b2=.999,adamEps=1e-8;

    for(let epoch=1;epoch<=this.iterations;epoch++){
      const pg=new Map([...this.players.keys()].map(k=>[k,pPrec*this._player(k)]));
      const cg=new Map([...this.champions.keys()].map(k=>[k,cPrec*this._champ(k)]));
      let loss=0;
      for(const m of rows){
        const w=recencyWeight(Number(m.timestamp)||0,this.latestTimestamp,this.halfLifeDays);
        const {z,ca,cb}=this._matchTerms(m),p=sigmoid(z),y=m.teamAWin?1:0,res=(p-y)*w;
        loss+=w*(-(y*Math.log(Math.max(EPS,p))+(1-y)*Math.log(Math.max(EPS,1-p))));
        const step=res/5;
        for(const id of m.teamA)pg.set(String(id),(pg.get(String(id))||0)+step);
        for(const id of m.teamB)pg.set(String(id),(pg.get(String(id))||0)-step);
        if(this.championWeight>0){
          const cstep=res*this.championWeight/5;
          for(const id of ca)if(id)cg.set(String(id),(cg.get(String(id))||0)+cstep);
          for(const id of cb)if(id)cg.set(String(id),(cg.get(String(id))||0)-cstep);
        }
      }
      for(const [id,g] of pg){
        const m=b1*(pM.get(id)||0)+(1-b1)*g,v=b2*(pV.get(id)||0)+(1-b2)*g*g;pM.set(id,m);pV.set(id,v);
        const mh=m/(1-Math.pow(b1,epoch)),vh=v/(1-Math.pow(b2,epoch));
        this.players.set(id,this._player(id)-this.learningRate*mh/(Math.sqrt(vh)+adamEps));
      }
      for(const [id,g] of cg){
        const m=b1*(cM.get(id)||0)+(1-b1)*g,v=b2*(cV.get(id)||0)+(1-b2)*g*g;cM.set(id,m);cV.set(id,v);
        const mh=m/(1-Math.pow(b1,epoch)),vh=v/(1-Math.pow(b2,epoch));
        this.champions.set(id,this._champ(id)-this.learningRate*mh/(Math.sqrt(vh)+adamEps));
      }
      // Remove the unidentifiable global offset. Priors already anchor the
      // model, but explicit centering improves numerical stability.
      const pm=mean([...this.players.values()]);if(pm)for(const [id,x] of this.players)this.players.set(id,x-pm);
      const cm=mean([...this.champions.values()]);if(cm)for(const [id,x] of this.champions)this.champions.set(id,x-cm);
      this.objective=loss;
    }

    const ph=new Map([...this.players.keys()].map(k=>[k,pPrec]));
    for(const m of rows){
      const w=recencyWeight(Number(m.timestamp)||0,this.latestTimestamp,this.halfLifeDays),{z}=this._matchTerms(m),p=sigmoid(z),curv=w*p*(1-p)/25;
      for(const id of [...m.teamA,...m.teamB])ph.set(String(id),(ph.get(String(id))||pPrec)+curv);
      for(const id of [...m.teamA,...m.teamB]){
        const key=String(id);this.games.set(key,(this.games.get(key)||0)+1);this.effectiveGames.set(key,(this.effectiveGames.get(key)||0)+w);
      }
    }
    this.hessian=ph;
    return this;
  }

  predict(teamA,teamB,match=null){
    const a=(Array.isArray(teamA)?teamA:[]).map(id=>this._player(id)),b=(Array.isArray(teamB)?teamB:[]).map(id=>this._player(id));
    let z=mean(a)-mean(b);
    if(match&&this.championWeight>0){const ca=championIds(match,teamA),cb=championIds(match,teamB);z+=this.championWeight*(mean(ca.map(id=>this._champ(id)))-mean(cb.map(id=>this._champ(id))))}
    return clamp(sigmoid(z),1e-9,1-1e-9);
  }

  teamRating(team){return BASE_RATING+mean((Array.isArray(team)?team:[]).map(id=>this._player(id)))*RATING_SCALE}

  view(pid){
    const id=String(pid||'');
    const games=this.games.get(id)||0;
    if(!games)return{rating:BASE_RATING,uncertainty:this.playerPriorSd,games:0,raw:{networkModel:'regularized_bradley_terry',componentSize:1,componentMatches:0,effectiveGames:0},uncertainty_kind:'network_bt_hessian'};
    const root=this.uf.find(id),componentSize=this.uf.componentSize(id),componentMatches=this.componentMatches.get(root)||0;
    const h=Math.max(EPS,this.hessian.get(id)||1/Math.pow(this.playerPriorSd/RATING_SCALE,2));
    let uncertainty=(1/Math.sqrt(h))*RATING_SCALE*this.uncertaintyInflation;
    // Diagonal Hessians ignore parameter correlations. Sparse/disconnected
    // graphs therefore get an additional conservative penalty.
    const networkPenalty=componentSize<20?1.35:componentSize<50?1.2:componentMatches<20?1.15:1;
    uncertainty=Math.min(500,Math.max(35,uncertainty*networkPenalty));
    return{
      rating:BASE_RATING+this._player(id)*RATING_SCALE,
      uncertainty,
      games,
      raw:{
        networkModel:'regularized_bradley_terry',
        championControl:this.championWeight>0,
        playerPriorSd:this.playerPriorSd,
        championPriorSd:this.championPriorSd,
        halfLifeDays:this.halfLifeDays,
        componentSize,
        componentMatches,
        effectiveGames:Number((this.effectiveGames.get(id)||0).toFixed(3)),
        distinctTeammates:this.teammates.get(id)?.size||0,
        distinctOpponents:this.opponents.get(id)?.size||0,
        fittedMatches:this.fittedMatches,
        objective:this.objective
      },
      uncertainty_kind:'network_bt_hessian'
    };
  }
}

module.exports={
  BASE_RATING,RATING_SCALE,DAY_MS,recencyWeight,cacheKey,championIds,NetworkBradleyTerry,
  production_active:false,automatic_promotion:false,performance_stats_used:false,
  outcome_network_primary:true,champion_control_only:true
};
