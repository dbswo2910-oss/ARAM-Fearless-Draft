'use strict';
module.exports={
helpers:`
  function ri87Unique(xs){const seen=new Set(),out=[];for(const x0 of xs||[]){const x=norm(x0),k=aliasKey(x);if(x&&x!=='-'&&!seen.has(k)){seen.add(k);out.push(x)}}return out}
  function ri87RouteState(m){
    const profile=routeProfileV01587(m?.ctx||{},m?.stat||{}),base=ri86Base(m),inventory=ri86Inventory(m),ownedCores=profile.cores||[];
    const active=profile.adopted?ri87Unique([...ownedCores,m?.item?.name,...(m?.alts||[]),...base]).slice(0,6):base.slice(0,6);
    return{...profile,base,inventory,active};
  }
  function ri87RouteIcons(names,dim=false){const xs=(names||[]).filter(Boolean).slice(0,6);return `<div class="ri87RouteItems ${dim?'dim':''}">${xs.map(n=>itemArtV01584(n,'sm')).join('')||'<span class="ri82BuildReason">아이템 데이터 확인 중</span>'}</div>`}
  function ri87PriorityRows(m,route){
    const names=ri87Unique([m?.item?.name,...(m?.alts||[]),...(route?.active||[])]).filter(n=>!(route?.inventory||[]).some(x=>aliasKey(x)===aliasKey(n))).slice(0,3);
    return names.map((name,i)=>{const row=ri86Row(name),price=num(row?.it?.total),reason=i===0?(m?.item?.reason||m?.advice?.direction||(route?.adopted?'현재 선택 루트와 상대 조합을 함께 반영':'현재 경기 최우선')):i===1?'현재 루트에서 생존·상성 대응 2순위':'현재 빌드 정체성을 유지하는 3순위';return{name,price,reason}});
  }
  function ri87PriorityHtml(m,route){
    const rows=ri87PriorityRows(m,route);
    return `<div class="ri87PriorityGrid">${rows.map((x,i)=>`<div class="ri87PriorityCard"><div class="ri87PriorityTop"><b class="ri87Rank">${i+1}</b>${itemArtV01584(x.name,'sm')}<div class="ri87PriorityText"><b>${esc(x.name)}</b><em>${x.price?x.price.toLocaleString('ko-KR')+'G':'가격 확인 중'}</em><span>${route.adopted?'현재 '+esc(route.label)+' 루트':'현재 추천'} ${i+1}순위</span></div></div><div class="ri87PriorityReason">${esc(short(x.reason,68))}</div></div>`).join('')||'<div class="ri82BuildReason">추천 아이템 계산 중</div>'}</div>`;
  }
  function ri87RecipeHtml(m,route){
    const target=ri87PriorityRows(m,route)[0]?.name||m?.item?.name||'',row=ri86Row(target),it=row?.it,parts=(it?.from||[]).map(id=>buildCatalogV01581?.items?.[String(id)]).filter(Boolean).slice(0,4);
    if(!target)return'<div class="ri87Recipe"><span>부품 경로</span><span class="ri82BuildReason">다음 아이템 계산 중</span></div>';
    return `<div class="ri87Recipe"><span>부품 경로</span>${parts.length?parts.map((p,i)=>`${i?'<i class="ri87RecipeArrow">+</i>':''}<span class="ri87RecipePart">${itemArtV01584(p.name,'sm')}<b>${esc(short(p.name,10))} · ${num(p.total).toLocaleString('ko-KR')}G</b></span>`).join(''):'<span class="ri82BuildReason">직접 구매 또는 조합 정보 없음</span>'}<i class="ri87RecipeArrow">→</i><span class="ri87RecipePart">${itemArtV01584(target,'sm')}<b>${esc(short(target,12))}</b></span></div>`;
  }
  function ri87InventoryHtml(route){return (route?.inventory||[]).slice(0,6).map(n=>itemArtV01584(n,'sm')).join('')||'<span class="ri82BuildReason">현재 아이템 확인 중</span>'}
  function ri87LiveBuildHtml(m,route){
    const activeLetter=route.adopted?'B':'A',note=route.adopted?`완성 코어 ${route.off.slice(0,2).join(' · ')} 구매를 감지해 초기 A 고정을 해제했습니다. 이후 추천은 현재 ${route.label} 루트를 기준으로 다시 계산합니다.`:'현재 구매가 통계 기본 루트와 일치합니다. 상황 변화가 생기면 실제 구매 아이템을 기준으로 자동 전환합니다.';
    return `<div class="ri87LiveBuild"><div class="ri87RouteCompare"><div class="ri87Route base"><div class="ri87RouteHead"><b>초기 추천 루트 A</b><span class="ri87RouteBadge">통계 기본</span></div>${ri87RouteIcons(route.base,true)}<div class="ri87RouteCopy">챔피언 통계 기반의 범용 기준선입니다.</div></div><div class="ri87RouteArrow">»</div><div class="ri87Route active"><div class="ri87RouteHead"><b>현재 활성 루트 ${activeLetter}${route.adopted?' · 사용자 선택':''}</b><span class="ri87RouteBadge">${esc(route.label||'기본 빌드')}</span></div>${ri87RouteIcons(route.active)}<div class="ri87RouteCopy">${route.adopted?'실제 구매를 새로운 기준점으로 삼아 후속 추천을 갱신합니다.':'아직 기본 루트를 유지하고 있습니다.'}</div></div></div><div class="ri87AdoptNote ${route.adopted?'adopted':''}"><strong>${route.adopted?'사용자 선택 반영 완료':'루트 감시 중'}</strong> · ${esc(note)}</div><div class="ri87InventoryBar"><div class="ri87InventoryLabel"><b>현재 인벤토리</b><span>실제 보유 아이템</span></div><div class="ri87InventoryItems">${ri87InventoryHtml(route)}</div><div class="ri87Gold">● ${m.goldKnown===false?'골드 확인 중':Math.round(num(m.gold)).toLocaleString('ko-KR')+'G'}</div></div></div>`;
  }
`,
render:`
  function renderLive(m){
    ensureCommandCenterStylesV01582();ensureVisualStylesV01583();ensureReferenceLayoutStylesV01584();ensureFightStatusScaleStylesV01585();ensureLiveRouteStylesV01587();ensureBuildCatalogV01581();
    if(m.life==='waiting')return `<div class="riWaiting"><div><b>인게임 연결 대기</b><span>일반 칼바람 게임에 들어가면 자동으로 실시간 코치가 시작됩니다.<br>상단 <b>인게임 미리보기</b>에서 사용자 선택 반영 화면을 확인할 수 있습니다.</span></div></div>`;
    const plan=m.plan||{},tone=plan.tone||'warn',alive=m.alive||{our:0,enemy:0},time=`${String(Math.floor(num(m.gameTime)/60)).padStart(2,'0')}:${String(Math.floor(num(m.gameTime)%60)).padStart(2,'0')}`,source=m.source==='preview'?'실시간 분석 중':`LIVE ${time}`,me=localChampionV01583(m),threats=(m.threats||[]).slice(0,3),route=ri87RouteState(m);
    const art=threats.map(x=>portraitV01583(x?.name,'md')).join(''),headline=route.adopted?`${plan.headline||'현재 교전 판단'} · 사용자 선택 반영`:plan.headline||'현재 교전 판단';
    return `<div class="ri84LiveStack"><section class="ri84Decision ${esc(tone)}"><div class="ri84DecisionCopy"><div class="ri84DecisionMeta"><span>현재 판단</span><em>${esc(source)} · 생존 ${alive.our}:${alive.enemy}</em></div><h3>${esc(headline)}</h3><p>${inlineChampionsV01583(plan.detail||'',m,150)}</p><div class="ri87DecisionRoute ${route.adopted?'adopted':''}">${route.adopted?'↻ 초기 A → 현재 B · '+esc(route.label):'✓ 통계 기본 루트 유지'}</div></div><div class="ri84DecisionArt">${art}</div><div class="ri84DecisionActions">${decisionActionsV01584(m)}</div></section><div class="ri84Row"><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">⚑</i><div><b>내 플레이</b><small>지금 내가 해야 할 플레이</small></div></div><em>${esc(me)} 가이드 ›</em></div><div class="ri84PanelBody ri84MyPlay"><div class="ri84HeroCard"><div class="ri84HeroTop">${portraitV01583(me,'lg')}<div class="ri84HeroName"><strong>${esc(me||'내 챔피언')}</strong><div class="ri84HeroTags"><span class="ri84Tag">${esc(roleLabelV01584(m))}</span></div></div></div><div class="ri84Quote">“지금은 이니시보다 아군과 함께 각을 만들고, 최고위협 위치를 먼저 확인하세요.”</div></div><div class="ri84PlanList">${(plan.steps||[]).filter(Boolean).slice(0,3).map((x,i)=>`<div class="ri84PlanStep"><b>${i+1}</b><span>${inlineChampionsV01583(x,m,120)}</span></div>`).join('')||`<div class="ri84PlanStep"><b>1</b><span>${inlineChampionsV01583(m.job||plan.detail||'현재 역할 계산 대기',m,120)}</span></div>`}</div></div></section><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">☠</i><div><b style="color:#ff7c8c">위협 TOP3</b><small>지금 가장 주의해야 할 적입니다.</small></div></div><em>상세 분석 ›</em></div><div class="ri84PanelBody">${threatCardsV01584(m)}</div></section></div><div class="ri84Row ri87CombatBuildRow"><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">↻</i><div><b>실시간 빌드 갱신</b><small>사용자 선택을 반영해 이후 추천을 실시간으로 갱신합니다.</small></div></div><em>${route.adopted?'B 루트 활성':'A 루트 유지'}</em></div><div class="ri84PanelBody">${ri87LiveBuildHtml(m,route)}</div></section><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">▣</i><div><b>다음 구매 우선순위 TOP3</b><small>${route.adopted?'현재 선택 루트와 게임 상황 기준':'통계 기본 루트와 게임 상황 기준'}</small></div></div><em>아이템 가이드 ›</em></div><div class="ri84PanelBody">${ri87PriorityHtml(m,route)}${ri87RecipeHtml(m,route)}</div></section></div>${fightStatusV01584(m)}</div>`;
  }
`
};
