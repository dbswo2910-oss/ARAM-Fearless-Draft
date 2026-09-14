'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ARAMRatingResearchEngineV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const EPS=1e-12;
  const clipProb=p=>Math.min(1-1e-9,Math.max(1e-9,Number(p)));
  const normalPdf=x=>Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);
  const erf=x=>{
    const sign=x<0?-1:1,a=Math.abs(x),t=1/(1+0.3275911*a);
    const y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-a*a);
    return sign*y;
  };
  const normalCdf=x=>0.5*(1+erf(x/Math.sqrt(2)));
  const median=xs=>{const a=[...xs].sort((x,y)=>x-y);if(!a.length)return 0;const n=a.length;return n%2?a[n>>1]:(a[n/2-1]+a[n/2])/2};
  const matchRoots=g=>[g,g?.game,g?.match,g?.data,g?.raw,g?.info].filter(Boolean);
  const pick=(g,keys)=>{for(const r of matchRoots(g))for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const matchId=g=>{const v=pick(g,['gameId','id','matchId','match_id']);return v===null?'':String(v)};
  const matchTime=g=>{
    const v=pick(g,['gameEndTimestamp','gameEnd','timestamp','ts','createdAt','gameCreation','gameCreationDate','gameStartTimestamp','game_datetime']);
    if(typeof v==='string'&&!/^\d+(\.\d+)?$/.test(v)){const t=Date.parse(v);return Number.isFinite(t)?t:0}
    const n=Number(v);return Number.isFinite(n)?n:0;
  };
  const queueId=g=>{const v=pick(g,['queueId','queue_id']);const n=Number(v);return Number.isFinite(n)?n:null};
  function participants(g){for(const r of matchRoots(g)){if(Array.isArray(r?.participants)&&r.participants.length)return r.participants;const a=Array.isArray(r?.team)?r.team:[],b=Array.isArray(r?.enemy)?r.enemy:[];if(a.length||b.length)return [...a,...b]}return []}
  const puuidOf=p=>String(p?.puuid||p?.player?.puuid||'').trim();
  function patchOf(g){const raw=String(pick(g,['gameVersion','patch','version'])||'UNKNOWN');const m=raw.match(/^(\d+)\.(\d+)/);return m?`${m[1]}.${m[2]}`:raw}
  function normalizeMatch(g){
    if(queueId(g)!==450)return null;
    const ps=participants(g).filter(Boolean),rows=ps.map((p,i)=>({p,puuid:puuidOf(p),teamId:Number(p?.teamId||p?.team?.id||0),idx:i})).filter(x=>x.puuid);
    if(new Set(rows.map(x=>x.puuid)).size!==10)return null;
    let a=rows.filter(x=>x.teamId===100),b=rows.filter(x=>x.teamId===200);
    if(a.length!==5||b.length!==5){a=rows.slice(0,5);b=rows.slice(5,10)}
    if(a.length!==5||b.length!==5)return null;
    let teamAWin=null;
    const aw=a.map(x=>x.p?.win??x.p?.stats?.win).find(v=>typeof v==='boolean');
    if(typeof aw==='boolean')teamAWin=aw;
    if(teamAWin===null){const me=g?.me;const mw=me?.win??me?.stats?.win,mt=Number(me?.teamId||0);if(typeof mw==='boolean'&&(mt===100||mt===200))teamAWin=mt===100?mw:!mw}
    if(teamAWin===null)return null;
    const id=matchId(g),time=matchTime(g);if(!id||!time)return null;
    return {match_id:id,time,patch:patchOf(g),team_a:a.map(x=>x.puuid),team_b:b.map(x=>x.puuid),team_a_win:!!teamAWin};
  }
  function normalizeMatches(rows){
    const out=[],seen=new Set();
    for(const g of Array.isArray(rows)?rows:[]){const m=normalizeMatch(g);if(!m||seen.has(m.match_id))continue;seen.add(m.match_id);out.push(m)}
    return out.sort((x,y)=>x.time-y.time||x.match_id.localeCompare(y.match_id));
  }
  function fnv1a(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
  function datasetFingerprint(matches){return fnv1a(matches.map(m=>m.match_id).sort().join('|'))}
  function buildIdentity(matches){
    const puuids=[...new Set(matches.flatMap(m=>[...m.team_a,...m.team_b]))].sort();
    const p2i={},i2p={};puuids.forEach((p,i)=>{const id=String(i+1);p2i[p]=id;i2p[id]=p});
    return {puuid_to_player_id:p2i,player_id_to_puuid:i2p,player_count:puuids.length};
  }
  function internalize(matches,identity){return matches.map(m=>({...m,team_a:m.team_a.map(p=>identity.puuid_to_player_id[p]),team_b:m.team_b.map(p=>identity.puuid_to_player_id[p])}))}

  class TeamElo{
    constructor(k=24,scale=400){this.name='elo';this.k=k;this.scale=scale;this.s=new Map()}
    get(pid){pid=String(pid);if(!this.s.has(pid))this.s.set(pid,{rating:1500,games:0});return this.s.get(pid)}
    clone(){const x=new TeamElo(this.k,this.scale);for(const[k,v]of this.s)x.s.set(k,{...v});return x}
    predict(a,b){const ra=a.reduce((s,p)=>s+this.get(p).rating,0)/a.length,rb=b.reduce((s,p)=>s+this.get(p).rating,0)/b.length;return clipProb(1/(1+10**(-(ra-rb)/this.scale)))}
    update(a,b,win){const p=this.predict(a,b),score=win?1:0,delta=this.k*(score-p);for(const pid of a){const s=this.get(pid);s.rating+=delta;s.games++}for(const pid of b){const s=this.get(pid);s.rating-=delta;s.games++}}
    view(pid){const s=this.get(pid);return {rating:s.rating,uncertainty:Math.max(35,350/Math.sqrt(Math.max(1,s.games+1))),games:s.games,raw:null,uncertainty_kind:'sample_size_proxy'}}
    teamRating(team){return team.reduce((s,p)=>s+this.view(p).rating,0)/team.length}
  }
  class TeamGlicko{
    constructor(rdFloor=45,rdDrift=10){this.name='glicko';this.rdFloor=rdFloor;this.rdDrift=rdDrift;this.q=Math.log(10)/400;this.s=new Map()}
    get(pid){pid=String(pid);if(!this.s.has(pid))this.s.set(pid,{rating:1500,rd:350,games:0});return this.s.get(pid)}
    clone(){const x=new TeamGlicko(this.rdFloor,this.rdDrift);for(const[k,v]of this.s)x.s.set(k,{...v});return x}
    team(team){const ss=team.map(p=>this.get(p)),r=ss.reduce((a,s)=>a+s.rating,0)/ss.length,rd=Math.sqrt(ss.reduce((a,s)=>a+s.rd*s.rd,0))/ss.length;return[r,Math.max(this.rdFloor,rd)]}
    g(rd){return 1/Math.sqrt(1+3*this.q*this.q*rd*rd/(Math.PI*Math.PI))}
    predict(a,b){const[ra,rda]=this.team(a),[rb,rdb]=this.team(b),pooled=Math.sqrt(rda*rda+rdb*rdb),g=this.g(pooled);return clipProb(1/(1+10**(-g*(ra-rb)/400)))}
    update(a,b,win){const ids=[...new Set([...a,...b])],snap=new Map(ids.map(p=>[p,{...this.get(p)}]));const tstats=team=>{const ss=team.map(p=>snap.get(p)),r=ss.reduce((x,s)=>x+s.rating,0)/ss.length,rd=Math.sqrt(ss.reduce((x,s)=>x+s.rd*s.rd,0))/ss.length;return[r,Math.max(this.rdFloor,rd)]};const[ra,rda]=tstats(a),[rb,rdb]=tstats(b),scoreA=win?1:0,pending=new Map();for(const [team,oppR,oppRd,score] of [[a,rb,rdb,scoreA],[b,ra,rda,1-scoreA]]){const gg=this.g(oppRd);for(const pid of team){const s=snap.get(pid),rd=Math.min(350,Math.sqrt(s.rd*s.rd+this.rdDrift*this.rdDrift)),e=1/(1+10**(-gg*(s.rating-oppR)/400)),d2=1/(this.q*this.q*gg*gg*Math.max(EPS,e*(1-e))),inv=1/(rd*rd)+1/d2,newRd=Math.max(this.rdFloor,Math.sqrt(1/inv)),newR=s.rating+(this.q/inv)*gg*(score-e);pending.set(pid,{rating:newR,rd:newRd,games:s.games+1})}}for(const[pid,v]of pending)this.s.set(String(pid),v)}
    view(pid){const s=this.get(pid);return {rating:s.rating,uncertainty:s.rd,games:s.games,raw:{rating:s.rating,rd:s.rd},uncertainty_kind:'glicko_rd'}}
    teamRating(team){return team.reduce((s,p)=>s+this.view(p).rating,0)/team.length}
  }
  class TrueSkillTeam{
    constructor(beta=25/6,tau=25/300,displayBase=1500,displayScale=20){this.name='trueskill_family';this.beta=beta;this.tau=tau;this.displayBase=displayBase;this.displayScale=displayScale;this.s=new Map()}
    get(pid){pid=String(pid);if(!this.s.has(pid))this.s.set(pid,{mu:25,sigma:25/3,games:0});return this.s.get(pid)}
    clone(){const x=new TrueSkillTeam(this.beta,this.tau,this.displayBase,this.displayScale);for(const[k,v]of this.s)x.s.set(k,{...v});return x}
    predict(a,b){const all=[...a,...b].map(p=>this.get(p)),muA=a.reduce((s,p)=>s+this.get(p).mu,0),muB=b.reduce((s,p)=>s+this.get(p).mu,0),variance=all.reduce((s,x)=>s+x.sigma*x.sigma+this.beta*this.beta,0),c=Math.sqrt(Math.max(EPS,variance));return clipProb(normalCdf((muA-muB)/c))}
    update(a,b,win){const all=[...a,...b],snap=new Map(all.map(p=>{const s=this.get(p);return[p,{mu:s.mu,sigma:Math.sqrt(s.sigma*s.sigma+this.tau*this.tau),games:s.games}]})),muA=a.reduce((s,p)=>s+snap.get(p).mu,0),muB=b.reduce((s,p)=>s+snap.get(p).mu,0),variance=all.reduce((s,p)=>{const x=snap.get(p);return s+x.sigma*x.sigma+this.beta*this.beta},0),c=Math.sqrt(Math.max(EPS,variance)),sign=win?1:-1,t=sign*(muA-muB)/c,denom=Math.max(1e-12,normalCdf(t)),v=normalPdf(t)/denom,w=v*(v+t),pending=new Map();for(const pid of a){const s=snap.get(pid),s2=s.sigma*s.sigma,newMu=s.mu+sign*(s2/c)*v,f=Math.max(1e-6,1-(s2/(c*c))*w);pending.set(pid,{mu:newMu,sigma:Math.sqrt(s2*f),games:s.games+1})}for(const pid of b){const s=snap.get(pid),s2=s.sigma*s.sigma,newMu=s.mu-sign*(s2/c)*v,f=Math.max(1e-6,1-(s2/(c*c))*w);pending.set(pid,{mu:newMu,sigma:Math.sqrt(s2*f),games:s.games+1})}for(const[pid,x]of pending)this.s.set(String(pid),x)}
    view(pid){const s=this.get(pid);return {rating:this.displayBase+(s.mu-25)*this.displayScale,uncertainty:s.sigma*this.displayScale,games:s.games,raw:{mu:s.mu,sigma:s.sigma,display_rating:this.displayBase+(s.mu-25)*this.displayScale,display_uncertainty:s.sigma*this.displayScale},uncertainty_kind:'gaussian_sigma'}}
    teamRating(team){return team.reduce((s,p)=>s+this.view(p).rating,0)/team.length}
  }
  const makeModel=name=>name==='elo'?new TeamElo():name==='glicko'?new TeamGlicko():new TrueSkillTeam();
  const MODEL_NAMES=['elo','glicko','trueskill_family'];
  function metrics(preds){if(!preds.length)return{n:0,accuracy:null,log_loss:null,brier:null,ece:null};const logloss=(y,p)=>{p=Math.min(1-1e-15,Math.max(1e-15,p));return -(y*Math.log(p)+(1-y)*Math.log(1-p))};const accuracy=preds.filter(x=>(x.prob>=.5)===!!x.actual).length/preds.length,ll=preds.reduce((s,x)=>s+logloss(x.actual,x.prob),0)/preds.length,brier=preds.reduce((s,x)=>s+(x.prob-x.actual)**2,0)/preds.length;let ece=0;for(let i=0;i<10;i++){const lo=i/10,hi=(i+1)/10,rows=preds.filter(x=>(lo<=x.prob&&x.prob<hi)||(i===9&&x.prob===1));if(rows.length){const pp=rows.reduce((s,x)=>s+x.prob,0)/rows.length,aa=rows.reduce((s,x)=>s+x.actual,0)/rows.length;ece+=(rows.length/preds.length)*Math.abs(pp-aa)}}return{n:preds.length,accuracy,log_loss:ll,brier,ece}}
  function split(matches,frac=.8){const cut=Math.max(1,Math.min(matches.length-1,Math.floor(matches.length*frac)));return[matches.slice(0,cut),matches.slice(cut)]}
  function trainModel(model,matches){const seen=new Set();for(const m of matches){model.update(m.team_a,m.team_b,m.team_a_win);for(const p of[...m.team_a,...m.team_b])seen.add(p)}return seen}
  function predictSet(model,test,mode,trainSeen){const mdl=model.clone(),seen=new Set(trainSeen),preds=[];for(const m of test){const p=mdl.predict(m.team_a,m.team_b),ra=mdl.teamRating(m.team_a),rb=mdl.teamRating(m.team_b),players=[...m.team_a,...m.team_b],known=players.filter(x=>seen.has(x)).length;preds.push({match_id:m.match_id,time:m.time,patch:m.patch,prob:p,actual:m.team_a_win?1:0,team_a_rating:ra,team_b_rating:rb,rating_diff:ra-rb,known_players:known,cold_start_players:10-known});if(mode==='walk_forward'){mdl.update(m.team_a,m.team_b,m.team_a_win);players.forEach(x=>seen.add(x))}}return preds}
  function coldSummary(preds){if(!preds.length)return{match_fraction:0,player_fraction:0,matches_with_cold_start:0,cold_players:0};const cold=preds.reduce((s,x)=>s+x.cold_start_players,0),m=preds.filter(x=>x.cold_start_players>0).length;return{match_fraction:m/preds.length,player_fraction:cold/(10*preds.length),matches_with_cold_start:m,cold_players:cold}}
  function winRatePredictions(train,test,kind,mode){const games=new Map(),wins=new Map(),recent=new Map(),push=(p,w)=>{games.set(p,(games.get(p)||0)+1);wins.set(p,(wins.get(p)||0)+w);const a=recent.get(p)||[];a.push(w);if(a.length>10)a.shift();recent.set(p,a)},update=m=>{m.team_a.forEach(p=>push(p,m.team_a_win?1:0));m.team_b.forEach(p=>push(p,m.team_a_win?0:1))};train.forEach(update);const seen=new Set(games.keys()),rate=p=>{if(kind==='recent'){const a=recent.get(p)||[];return(a.reduce((x,y)=>x+y,0)+1)/(a.length+2)}const n=games.get(p)||0;return((wins.get(p)||0)+1)/(n+2)},preds=[];for(const m of test){const a=m.team_a.reduce((s,p)=>s+rate(p),0)/5,b=m.team_b.reduce((s,p)=>s+rate(p),0)/5,prob=clipProb(.5+.5*(a-b)),players=[...m.team_a,...m.team_b],known=players.filter(p=>seen.has(p)).length;preds.push({match_id:m.match_id,time:m.time,patch:m.patch,prob,actual:m.team_a_win?1:0,team_a_rating:a,team_b_rating:b,rating_diff:(a-b)*400,known_players:known,cold_start_players:10-known});if(mode==='walk_forward'){update(m);players.forEach(p=>seen.add(p))}}return preds}
  function patchMetrics(preds){const by={};for(const p of preds)(by[p.patch]||(by[p.patch]=[])).push(p);return Object.fromEntries(Object.entries(by).map(([k,v])=>[k,metrics(v)]))}
  function rngMulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function bootstrapDelta(a,b,iterations=1000,seed=1701){if(a.length!==b.length||!a.length)return null;const ma=new Map(a.map(x=>[x.match_id,x])),mb=new Map(b.map(x=>[x.match_id,x])),ids=[...ma.keys()].filter(x=>mb.has(x)).sort();if(ids.length<20)return null;const logloss=(y,p)=>{p=Math.min(1-1e-15,Math.max(1e-15,p));return -(y*Math.log(p)+(1-y)*Math.log(1-p))},rand=rngMulberry32(seed),ds=[];for(let n=0;n<iterations;n++){let la=0,lb=0;for(let i=0;i<ids.length;i++){const id=ids[Math.floor(rand()*ids.length)],xa=ma.get(id),xb=mb.get(id);la+=logloss(xa.actual,xa.prob);lb+=logloss(xb.actual,xb.prob)}ds.push((la-lb)/ids.length)}ds.sort((x,y)=>x-y);return{mean_delta:ds.reduce((x,y)=>x+y,0)/ds.length,ci95:[ds[Math.floor(.025*(ds.length-1))],ds[Math.floor(.975*(ds.length-1))]]}}
  function candidateGate(dataset,modelReports,frozenPreds){const total=dataset.matches,testN=dataset.test;if(total<500||testN<100)return{status:'insufficient_real_data',reason:'need at least 500 real matches and 100 frozen-test matches',matches:total,test_matches:testN};const ranked=MODEL_NAMES.slice().sort((a,b)=>modelReports[a].frozen.log_loss-modelReports[b].frozen.log_loss),best=ranked[0],runner=ranked[1],bm=modelReports[best].frozen,base=metrics(frozenPreds.constant_50),cmp=bootstrapDelta(frozenPreds[best],frozenPreds[runner]),noColdRows=frozenPreds[best].filter(x=>x.cold_start_players===0),noCold=metrics(noColdRows),noColdBase=metrics(noColdRows.map(x=>({...x,prob:.5,rating_diff:0}))),per=patchMetrics(frozenPreds[best]),eligible=Object.fromEntries(Object.entries(per).filter(([,v])=>v.n>=30)),improved=Object.values(eligible).filter(v=>v.log_loss<Math.log(2)).length,patchPass=Object.keys(eligible).length>=2&&improved>=Math.ceil(Object.keys(eligible).length/2),conditions={beats_50_log_loss:bm.log_loss<base.log_loss,beats_50_brier:bm.brier<base.brier,calibration_not_materially_worse:bm.ece<=Math.max(.05,base.ece+.03),no_cold_start_improves:noCold.n>=30&&noCold.log_loss<noColdBase.log_loss,paired_bootstrap_clear_vs_runner:!!(cmp&&cmp.ci95[1]<0),test_sample_sufficient:testN>=100,multi_patch_robustness:patchPass};return{status:Object.values(conditions).every(Boolean)?'candidate_winner':'no_clear_winner',best_observed:best,runner_up:runner,conditions,best_minus_runner_bootstrap:cmp,no_cold_start:noCold,no_cold_start_constant_50:noColdBase,patch_robustness:{eligible_patches:Object.keys(eligible).length,improved_patches:improved,passes:patchPass,details:eligible}}}
  function networkKpis(matches){const counts=new Map(),adj=new Map(),edges=new Set(),ensure=p=>{if(!adj.has(p))adj.set(p,new Set());return adj.get(p)};for(const m of matches){const ps=[...new Set([...m.team_a,...m.team_b])];for(const p of ps){counts.set(p,(counts.get(p)||0)+1);ensure(p)}for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i]<ps[j]?ps[i]:ps[j],b=ps[i]<ps[j]?ps[j]:ps[i];edges.add(`${a}|${b}`);ensure(a).add(b);ensure(b).add(a)}}const vals=[...counts.values()],players=vals.length,seen=new Set();let giant=0,components=0;for(const p of adj.keys()){if(seen.has(p))continue;components++;let n=0,stack=[p];seen.add(p);while(stack.length){const u=stack.pop();n++;for(const v of adj.get(u)||[])if(!seen.has(v)){seen.add(v);stack.push(v)}}giant=Math.max(giant,n)}const denom=players>1?players*(players-1)/2:1;return{matches:matches.length,players,avg_matches_per_player:players?vals.reduce((a,b)=>a+b,0)/players:0,median_matches_per_player:median(vals),single_match_players:vals.filter(x=>x===1).length,single_match_fraction:players?vals.filter(x=>x===1).length/players:0,players_2_plus:vals.filter(x=>x>=2).length,players_5_plus:vals.filter(x=>x>=5).length,players_10_plus:vals.filter(x=>x>=10).length,component_count:components,largest_component_players:giant,largest_component_fraction:players?giant/players:0,pair_edges:edges.size,pair_graph_density:edges.size/denom,observation_counts:Object.fromEntries(counts)}}
  function trainAllWithHistory(matches,identity){const result={};for(const name of MODEL_NAMES){const model=makeModel(name),history={};for(const m of matches){model.update(m.team_a,m.team_b,m.team_a_win);for(const pid of [...m.team_a,...m.team_b]){const v=model.view(pid);(history[pid]||(history[pid]=[])).push({match_id:m.match_id,time:m.time,rating:v.rating,uncertainty:v.uncertainty,raw:v.raw})}}const states={};for(const pid of Object.keys(identity.player_id_to_puuid)){const v=model.view(pid);states[pid]={...v,history:(history[pid]||[]).slice(-20),last_match_at:(history[pid]||[]).at(-1)?.time||null}}result[name]=states}return result}
  function buildLatestRun(rawRows,meta={}){
    const normalized=normalizeMatches(rawRows);if(normalized.length<10)throw new Error('research_dataset_requires_at_least_10_standard_aram_matches');const identity=buildIdentity(normalized),matches=internalize(normalized,identity),net=networkKpis(matches),[train,test]=split(matches,.8),modelReports={},frozenPreds={},allStates=trainAllWithHistory(matches,identity);for(const name of MODEL_NAMES){const model=makeModel(name),seen=trainModel(model,train),frozen=predictSet(model,test,'frozen',seen),walk=predictSet(model,test,'walk_forward',seen);frozenPreds[name]=frozen;modelReports[name]={frozen:metrics(frozen),walk_forward:metrics(walk),frozen_cold_start:coldSummary(frozen),walk_forward_cold_start:coldSummary(walk),frozen_by_patch:patchMetrics(frozen),walk_forward_by_patch:patchMetrics(walk)}}const constant50=test.map(m=>({match_id:m.match_id,time:m.time,patch:m.patch,prob:.5,actual:m.team_a_win?1:0,rating_diff:0,cold_start_players:10}));frozenPreds.constant_50=constant50;const baselines={constant_50:{frozen:metrics(constant50),walk_forward:metrics(constant50)}};for(const kind of['historical','recent']){const f=winRatePredictions(train,test,kind,'frozen'),w=winRatePredictions(train,test,kind,'walk_forward');baselines[`${kind}_winrate`]={frozen:metrics(f),walk_forward:metrics(w),frozen_cold_start:coldSummary(f),walk_forward_cold_start:coldSummary(w)}}const ranked=MODEL_NAMES.slice().sort((a,b)=>modelReports[a].frozen.log_loss-modelReports[b].frozen.log_loss),dataset={...net,train:train.length,test:test.length,train_start:train[0]?.time||null,train_end:train.at(-1)?.time||null,test_start:test[0]?.time||null,test_end:test.at(-1)?.time||null,latest_match_at:matches.at(-1)?.time||null,fingerprint:datasetFingerprint(normalized),phase:String(meta.phase||'UNKNOWN'),collection_status:String(meta.status||'unknown'),sampling_version:String(meta.sampling_version||'v0.3'),source:String(meta.source||'local_research_dataset')},selection=candidateGate(dataset,modelReports,frozenPreds),players={};for(const pid of Object.keys(identity.player_id_to_puuid)){players[pid]={player_id:pid,games:Number(net.observation_counts[pid]||0),last_match_at:allStates.elo[pid]?.last_match_at||null,models:{elo:allStates.elo[pid],glicko:allStates.glicko[pid],trueskill_family:allStates.trueskill_family[pid]}}}return{schema:'aram-rating-ui-latest-run-v01',real_data:true,generated_at:new Date().toISOString(),engine_version:'v0.1-js-port-of-research-models',dataset,identity,selection,observed_leader:ranked[0]||null,observed_runner_up:ranked[1]||null,models:modelReports,baselines,players,privacy:{identity_mapping_local_only:true,riot_ids_included:false,puuid_mapping_export_forbidden:true}}}
  return{normalizeMatch,normalizeMatches,datasetFingerprint,buildIdentity,buildLatestRun,metrics,MODEL_NAMES,TeamElo,TeamGlicko,TrueSkillTeam};
});
