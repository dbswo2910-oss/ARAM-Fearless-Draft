'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ARAMRatingResearchUICoreV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MODEL_LABEL={elo:'Elo',glicko:'Glicko-family',trueskill_family:'TrueSkill-family'};
  const MODEL_SHORT={elo:'Elo',glicko:'Glicko',trueskill_family:'TrueSkill'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=null)=>Number.isFinite(Number(v))?Number(v):d;
  const pct=v=>num(v)==null?'—':`${(Number(v)*100).toFixed(2)}%`;
  const int=v=>num(v)==null?'—':Math.round(Number(v)).toLocaleString('en-US');
  const f=(v,d=3)=>num(v)==null?'—':Number(v).toFixed(d);
  const date=v=>{if(!v)return'—';const n=Number(v),d=new Date(Number.isFinite(n)?n:v);if(Number.isNaN(d.getTime()))return'—';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const labelModel=k=>MODEL_LABEL[k]||String(k||'—');
  const shortModel=k=>MODEL_SHORT[k]||String(k||'—');

  function selectionText(sel,leader){
    const status=String(sel?.status||'unknown');
    if(status==='candidate_winner')return{status,title:'PRIMARY MODEL',main:shortModel(sel.best_observed||leader),sub:'기존 candidate gate를 통과한 연구 후보',tone:'candidate'};
    if(status==='no_clear_winner')return{status,title:'연구 상태',main:'모델 미선정',sub:`현재 관측 선두 ${shortModel(sel?.best_observed||leader)} · 통계적 우위 미확인`,tone:'neutral'};
    if(status==='insufficient_real_data')return{status,title:'연구 상태',main:'데이터 부족 · 모델 미선정',sub:`현재 관측 선두 ${shortModel(sel?.best_observed||leader)} · candidate gate 대기`,tone:'low'};
    return{status,title:'연구 상태',main:'평가 상태 확인 불가',sub:'Latest Rating Run의 gate 결과를 확인하세요.',tone:'low'};
  }

  function networkDensity(dataset){
    const density=num(dataset?.pair_graph_density,0),single=num(dataset?.single_match_fraction,1);
    if(single>0.75||density<0.02)return{key:'LOW',label:'낮음'};
    if(single>0.45||density<0.08)return{key:'MEDIUM',label:'보통'};
    return{key:'HIGH',label:'높음'};
  }

  function uncertaintyLevel(player){
    const games=num(player?.games,0),g=num(player?.models?.glicko?.uncertainty,350),ts=num(player?.models?.trueskill_family?.raw?.sigma,25/3),elo=num(player?.models?.elo?.uncertainty,350);
    if(games<=2||g>220||ts>7.2||elo>220)return{key:'HIGH',label:'높음'};
    if(games<10||g>125||ts>5.2||elo>110)return{key:'MEDIUM',label:'보통'};
    return{key:'LOW',label:'낮음'};
  }

  function dataConfidence(run,player){
    if(!run||!player)return{key:'NONE',label:'없음',reason:'Research Dataset에 플레이어 상태가 없습니다.'};
    const ds=run.dataset||{},games=num(player.games,0),leader=run.observed_leader||run.selection?.best_observed||'elo',cold=num(run.models?.[leader]?.frozen_cold_start?.player_fraction,1),single=num(ds.single_match_fraction,1),unc=uncertaintyLevel(player);
    if(games<=2)return{key:'LOW',label:'LOW',reason:'개인 관측이 1~2경기라 표본이 부족합니다.'};
    // Dataset-wide sparsity is an explicit cap: a well-observed player inside a sparse graph must not look fully trusted.
    if(num(ds.matches,0)<250||cold>0.50||single>0.80)return{key:'LOW',label:'LOW',reason:'전체 네트워크가 아직 희소하고 cold-start 비중이 높습니다.'};
    if(games<10||unc.key==='HIGH'||num(ds.matches,0)<500||cold>0.25||single>0.60)return{key:'MEDIUM',label:'MEDIUM',reason:'반복 관측은 형성됐지만 데이터 구조가 아직 충분히 안정적이지 않습니다.'};
    if(games>=20&&unc.key==='LOW'&&num(ds.matches,0)>=500&&cold<=0.15&&single<=0.50)return{key:'HIGH',label:'HIGH',reason:'개인 반복 관측과 전체 네트워크 품질이 모두 안정 구간입니다.'};
    return{key:'MEDIUM',label:'MEDIUM',reason:'개인 표본은 확보됐지만 전체 연구 데이터 품질을 함께 반영했습니다.'};
  }

  function sampleBadge(games){
    games=num(games,0);
    if(games<=2)return{key:'insufficient',label:'표본 부족'};
    if(games<10)return{key:'limited',label:'제한적 표본'};
    if(games<20)return{key:'repeat',label:'반복 관측'};
    return{key:'established',label:'반복 관측 20+'};
  }

  function trend(player){
    const pick=player?.models?.glicko||player?.models?.elo||player?.models?.trueskill_family;
    const h=Array.isArray(pick?.history)?pick.history:[];
    if(h.length<10)return{available:false,label:'추세 데이터 부족',delta:null,points:[]};
    const rows=h.slice(-10),delta=num(rows.at(-1)?.rating,0)-num(rows[0]?.rating,0);
    return{available:true,label:`최근 10경기 ${delta>=0?'+':''}${Math.round(delta)}`,delta,points:rows.map(x=>num(x.rating,0))};
  }

  function sparkline(points){
    if(!Array.isArray(points)||points.length<2)return'';
    const xs=points.map(Number),lo=Math.min(...xs),hi=Math.max(...xs),span=Math.max(1e-9,hi-lo),w=116,h=28,pad=2;
    const p=xs.map((v,i)=>`${(pad+i*(w-pad*2)/(xs.length-1)).toFixed(1)},${(h-pad-(v-lo)*(h-pad*2)/span).toFixed(1)}`).join(' ');
    return `<svg class="arui-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${p}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function findPlayerId(run,puuid){
    if(!run||!puuid)return null;
    return run.identity?.puuid_to_player_id?.[String(puuid)]||null;
  }

  function buildViewModel(run,puuid,opts={}){
    if(!run||run.schema!=='aram-rating-ui-latest-run-v01')return{kind:'unavailable',message:'Research data unavailable'};
    const dataset=run.dataset||{},playerId=findPlayerId(run,puuid),sel=selectionText(run.selection,run.observed_leader),density=networkDensity(dataset);
    const shared={run,dataset,selection:sel,density,collection:{phase:dataset.phase||'UNKNOWN',status:dataset.collection_status||'unknown',sampling_version:dataset.sampling_version||'unknown',progress:`${int(dataset.matches)} / ${int(opts.hardCap||500)} matches`}};
    if(!playerId||!run.players?.[playerId])return{kind:'no_data',...shared,message:'이 플레이어는 아직 Research Dataset에 포함되지 않았습니다.'};
    const player=run.players[playerId],confidence=dataConfidence(run,player),uncertainty=uncertaintyLevel(player),sample=sampleBadge(player.games),t=trend(player);
    const models={};
    for(const key of ['elo','glicko','trueskill_family']){
      const s=player.models?.[key];
      if(!s)continue;
      models[key]={key,label:labelModel(key),short:shortModel(key),rating:num(s.rating),uncertainty:num(s.uncertainty),games:num(s.games,player.games),raw:s.raw||null,validation:run.models?.[key]||null,is_primary:run.selection?.status==='candidate_winner'&&run.selection?.best_observed===key,is_observed_leader:run.observed_leader===key};
    }
    return{kind:'player',...shared,player_id:playerId,player,models,confidence,uncertainty,sample,trend:t,last_updated:date(player.last_match_at||dataset.latest_match_at),generated_at:date(run.generated_at)};
  }

  function modelCard(m,sample){
    if(!m)return'';
    const muted=sample?.key==='insufficient'?' arui-model-muted':'';
    const crown=m.is_primary?'<span class="arui-primary">PRIMARY</span>':m.is_observed_leader?'<span class="arui-observed">OBSERVED LEADER</span>':'';
    let main='',sub='';
    if(m.key==='elo'){
      main=int(m.rating);sub=`불확실성 proxy ±${int(m.uncertainty)}`;
    }else if(m.key==='glicko'){
      main=int(m.rating);sub=`RD ±${int(m.uncertainty)}`;
    }else{
      const mu=num(m.raw?.mu),sigma=num(m.raw?.sigma);
      main=mu==null?'—':`μ ${mu.toFixed(2)}`;sub=`σ ${sigma==null?'—':sigma.toFixed(2)} · display ${int(m.rating)} ±${int(m.uncertainty)}`;
    }
    return `<div class="arui-model${muted}${m.is_primary?' arui-model-primary':''}"><div class="arui-model-head"><span>${esc(m.short)}</span>${crown}</div><strong>${main}</strong><small>${esc(sub)}</small></div>`;
  }

  function metricRow(name,m){
    if(!m)return `<tr><td>${esc(name)}</td><td colspan="5">—</td></tr>`;
    return `<tr><td>${esc(name)}</td><td>${int(m.n)}</td><td>${f(m.log_loss,4)}</td><td>${f(m.brier,4)}</td><td>${f(m.ece,4)}</td><td>${m.accuracy==null?'—':pct(m.accuracy)}</td></tr>`;
  }

  function details(vm){
    if(vm.kind!=='player')return'';
    const r=vm.run,b=r.baselines||{},ds=vm.dataset;
    return `<details class="arui-details"><summary>상세 분석 · Model Comparison</summary><div class="arui-detail-body">
      <div class="arui-detail-block"><h4>MODEL VALIDATION · Frozen</h4><table><thead><tr><th>모델</th><th>N</th><th>Log Loss</th><th>Brier</th><th>ECE</th><th>Accuracy</th></tr></thead><tbody>${metricRow('Elo',r.models?.elo?.frozen)}${metricRow('Glicko',r.models?.glicko?.frozen)}${metricRow('TrueSkill',r.models?.trueskill_family?.frozen)}${metricRow('50% baseline',b.constant_50?.frozen)}${metricRow('Historical WR',b.historical_winrate?.frozen)}${metricRow('Recent WR',b.recent_winrate?.frozen)}</tbody></table></div>
      <div class="arui-detail-grid"><div class="arui-detail-block"><h4>MODEL STATUS</h4><dl><div><dt>Gate</dt><dd>${esc(String(r.selection?.status||'unknown').toUpperCase())}</dd></div><div><dt>현재 관측 선두</dt><dd>${esc(shortModel(r.observed_leader))}</dd></div><div><dt>Frozen cold-start</dt><dd>${pct(r.models?.[r.observed_leader]?.frozen_cold_start?.player_fraction)}</dd></div><div><dt>Walk-forward cold-start</dt><dd>${pct(r.models?.[r.observed_leader]?.walk_forward_cold_start?.player_fraction)}</dd></div></dl></div>
      <div class="arui-detail-block"><h4>PHASE B DATASET</h4><dl><div><dt>Matches</dt><dd>${int(ds.matches)}</dd></div><div><dt>Players</dt><dd>${int(ds.players)}</dd></div><div><dt>Single-match</dt><dd>${pct(ds.single_match_fraction)}</dd></div><div><dt>2+ / 5+ / 10+</dt><dd>${int(ds.players_2_plus)} / ${int(ds.players_5_plus)} / ${int(ds.players_10_plus)}</dd></div><div><dt>Largest component</dt><dd>${pct(ds.largest_component_fraction)}</dd></div><div><dt>Network Density</dt><dd>${esc(vm.density.key)}</dd></div></dl></div></div>
      <div class="arui-detail-block"><h4>DATA COLLECTION</h4><div class="arui-collection"><b>${esc(vm.collection.phase)}</b><span>${esc(String(vm.collection.status).toUpperCase())}</span><span>${esc(vm.collection.progress)}</span><span>Active Sampling ${esc(vm.collection.sampling_version)}</span></div></div>
      <div class="arui-disclaimer">개인 연구용 비공식 지표입니다. Riot 공식 MMR·랭크가 아니며, 모델 선택 gate가 우선합니다.</div>
    </div></details>`;
  }

  function renderCard(vm){
    if(vm.kind==='unavailable')return `<section id="aramRatingResearchCardV01" class="arui-card arui-state"><div class="arui-head"><div><span class="arui-badge" title="개인 연구용 비공식 지표입니다. Riot 공식 MMR 또는 랭크가 아닙니다.">RESEARCH</span><h3>ARAM 실력 분석</h3></div><button class="arui-refresh" data-arui-action="refresh" title="로컬 Research Dataset에서 Latest Rating Run 다시 생성">↻</button></div><div class="arui-empty">Research data unavailable<small>Rating 연구 데이터 로드에 실패했습니다. 기존 전적검색에는 영향을 주지 않습니다.</small></div></section>`;
    const ds=vm.dataset||{};
    if(vm.kind==='no_data')return `<section id="aramRatingResearchCardV01" class="arui-card arui-state"><div class="arui-head"><div><span class="arui-badge" title="개인 연구용 비공식 지표입니다. Riot 공식 MMR 또는 랭크가 아닙니다.">RESEARCH</span><h3>ARAM 실력 분석</h3></div><button class="arui-refresh" data-arui-action="refresh" title="로컬 Research Dataset에서 Latest Rating Run 다시 생성">↻</button></div><div class="arui-empty"><b>분석 데이터 없음</b><small>${esc(vm.message)}</small></div><div class="arui-dataset-mini"><span>${int(ds.matches)} matches</span><span>${int(ds.players)} players</span><span>2+ ${int(ds.players_2_plus)}</span><span>5+ ${int(ds.players_5_plus)}</span><span>10+ ${int(ds.players_10_plus)}</span></div></section>`;
    const p=vm.player,t=vm.trend;
    return `<section id="aramRatingResearchCardV01" class="arui-card"><div class="arui-head"><div><span class="arui-badge" title="개인 연구용 비공식 지표입니다. Riot 공식 MMR 또는 랭크가 아닙니다.">RESEARCH</span><h3>ARAM 실력 분석</h3><small>세 모델을 병렬 관찰하는 개인 연구 화면</small></div><button class="arui-refresh" data-arui-action="refresh" title="외부 호출 없이 로컬 Research Dataset에서 Latest Rating Run 다시 생성">↻</button></div>
      <div class="arui-summary"><div><small>데이터 표본</small><b>${int(ds.matches)}경기</b></div><div class="arui-confidence ${esc(vm.confidence.key.toLowerCase())}"><small>데이터 신뢰도</small><b>${esc(vm.confidence.label)}</b><em>${esc(vm.confidence.reason)}</em></div><div><small>반복관측 품질</small><b>${pct(1-num(ds.single_match_fraction,1))}</b><em>2+ 관측 ${int(ds.players_2_plus)}명</em></div></div>
      <div class="arui-research-status ${esc(vm.selection.tone)}"><div><small>${esc(vm.selection.title)}</small><b>${esc(vm.selection.main)}</b></div><span>${esc(vm.selection.sub)}</span></div>
      <div class="arui-models">${modelCard(vm.models.elo,vm.sample)}${modelCard(vm.models.glicko,vm.sample)}${modelCard(vm.models.trueskill_family,vm.sample)}</div>
      <div class="arui-player-meta"><div><small>관측 경기</small><b>${int(p.games)}경기</b><span class="arui-sample ${esc(vm.sample.key)}">${esc(vm.sample.label)}</span></div><div><small>최근 업데이트</small><b>${esc(vm.last_updated)}</b></div><div><small>Uncertainty</small><b>${esc(vm.uncertainty.label)}</b></div><div class="arui-trend"><small>최근 변화</small><b>${esc(t.label)}</b>${t.available?sparkline(t.points):''}</div></div>
      <div class="arui-dataset-mini"><span>Dataset ${int(ds.matches)} / ${int(ds.players)}</span><span>Single ${pct(ds.single_match_fraction)}</span><span>2+ ${int(ds.players_2_plus)}</span><span>5+ ${int(ds.players_5_plus)}</span><span>10+ ${int(ds.players_10_plus)}</span><span>Network ${esc(vm.density.key)}</span></div>
      ${details(vm)}<div class="arui-foot">Riot 공식 MMR/랭크가 아닙니다 · ${esc(vm.collection.phase)} ${esc(String(vm.collection.status).toUpperCase())} · Sampling ${esc(vm.collection.sampling_version)}</div></section>`;
  }

  return{MODEL_LABEL,selectionText,networkDensity,uncertaintyLevel,dataConfidence,sampleBadge,trend,findPlayerId,buildViewModel,renderCard,details};
});
