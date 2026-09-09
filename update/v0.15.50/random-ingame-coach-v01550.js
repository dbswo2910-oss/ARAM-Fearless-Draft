'use strict';
(()=>{
  const V='0.15.50';
  if(window.__ARAM_RANDOM_INGAME_COACH_V01550__)return;

  const AUTO_KEY='aramRandomCoachAutoV01550';
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const short=(s,n=92)=>{s=norm(s);return s.length>n?s.slice(0,n-1)+'…':s};
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const safe=(fn,...args)=>{try{return typeof fn==='function'?fn(...args):null}catch{return null}};

  let preview={active:false,state:'alive',scenario:'even',role:'tank'};
  let ui={tab:'live',auto:true,lastLife:'',lastRenderSig:'',timer:0};
  try{ui.auto=localStorage.getItem(AUTO_KEY)!=='0'}catch{}

  function ensureStyles(){
    if($('#riCoachStyleV01550'))return;
    const st=document.createElement('style');st.id='riCoachStyleV01550';st.textContent=`
      #random[data-random-mode="ingame"]>#randomIngameShell{display:none!important}
      #riCoachShellV01550{display:none;margin-top:12px;min-width:0}
      #random[data-random-mode="ingame"]>#riCoachShellV01550{display:block}
      #random .riPreviewBtnV01550{margin-left:auto;border:1px solid #3b5876;background:#10233a;color:#c9def1;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}
      #random .riPreviewBtnV01550.active{border-color:#5ba6d8;background:#143a59;color:#fff}
      #random .riPreviewBtnV01550.live{border-color:#2f7d5f;background:#103326;color:#92efbd}
      #riCoachShellV01550 .riCoachFrame{border:1px solid #304b67;border-radius:14px;background:linear-gradient(180deg,#0b192a,#081421);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.18)}
      #riCoachShellV01550 .riCoachHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-bottom:1px solid #20384f;background:#0d1d30}
      #riCoachShellV01550 .riCoachHeadLeft{display:flex;align-items:center;gap:9px;min-width:0}
      #riCoachShellV01550 .riCoachStateIcon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#132a42;border:1px solid #31516f;font-size:15px;flex:0 0 auto}
      #riCoachShellV01550 .riCoachTitle{min-width:0}
      #riCoachShellV01550 .riCoachTitle small{display:block;color:#6f89a5;font-size:8px;font-weight:900;letter-spacing:.08em;margin-bottom:2px}
      #riCoachShellV01550 .riCoachTitle b{display:block;color:#edf7ff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #riCoachShellV01550 .riCoachHeadRight{display:flex;align-items:center;gap:6px;flex:0 0 auto}
      #riCoachShellV01550 .riSourceBadge,#riCoachShellV01550 .riAutoBtn{border:1px solid #38536e;border-radius:999px;background:#102239;color:#9fb9d1;padding:5px 8px;font-size:8px;font-weight:900;white-space:nowrap}
      #riCoachShellV01550 .riSourceBadge.live{border-color:#2f7d5f;background:#103326;color:#8df0ba}
      #riCoachShellV01550 .riSourceBadge.preview{border-color:#8b6c2a;background:#2b240f;color:#f2d276}
      #riCoachShellV01550 .riAutoBtn{cursor:pointer}
      #riCoachShellV01550 .riAutoBtn.on{border-color:#39769f;background:#123451;color:#bfe6ff}
      #riCoachShellV01550 .riPreviewBar{display:none;align-items:center;gap:7px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid #2d465f;background:#251f0d}
      #riCoachShellV01550.preview .riPreviewBar{display:flex}
      #riCoachShellV01550 .riPreviewNote{font-size:9px;font-weight:950;color:#f0d879;margin-right:3px}
      #riCoachShellV01550 .riPreviewBar button,#riCoachShellV01550 .riPreviewBar select{border:1px solid #5b4d29;background:#161b22;color:#d9e7f4;border-radius:7px;padding:6px 8px;font-size:9px;font-weight:850}
      #riCoachShellV01550 .riPreviewBar button{cursor:pointer}
      #riCoachShellV01550 .riPreviewBar button.active{background:#5a4720;border-color:#a68435;color:#fff1b0}
      #riCoachShellV01550 .riCoachTabs{display:flex;gap:5px;padding:8px 12px 0;background:#0a1726}
      #riCoachShellV01550 .riCoachTabs button{border:1px solid #2d475f;background:#0f2033;color:#8da7c0;border-radius:8px 8px 0 0;padding:7px 13px;font-size:10px;font-weight:900;cursor:pointer}
      #riCoachShellV01550 .riCoachTabs button.active{background:#163b59;border-color:#3e7da8;color:#f3fbff;box-shadow:inset 0 -2px 0 #67c6ff}
      #riCoachShellV01550 .riCoachBody{padding:11px 12px 13px;min-height:220px}
      #riCoachShellV01550 .riHero{border:1px solid #33546f;border-left:4px solid #5ca9db;border-radius:11px;background:#0d2032;padding:12px 13px;min-width:0}
      #riCoachShellV01550 .riHero.good{border-color:#2f7058;border-left-color:#55d79c;background:#0d261e}
      #riCoachShellV01550 .riHero.bad{border-color:#7b3e48;border-left-color:#ff7786;background:#2b171c}
      #riCoachShellV01550 .riHero.warn{border-color:#78642d;border-left-color:#e6bc51;background:#2a240f}
      #riCoachShellV01550 .riHeroTop{display:flex;align-items:center;justify-content:space-between;gap:12px}
      #riCoachShellV01550 .riHeroTop span{font-size:9px;font-weight:950;color:#87a6c3;letter-spacing:.05em}
      #riCoachShellV01550 .riHeroTop em{font-style:normal;font-size:9px;font-weight:900;color:#9ab4cc;white-space:nowrap}
      #riCoachShellV01550 .riHero h3{margin:5px 0 4px;font-size:20px;line-height:1.25;color:#f2f8fd}
      #riCoachShellV01550 .riHero p{margin:0;font-size:11px;line-height:1.45;color:#a8bdd0}
      #riCoachShellV01550 .riMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:9px}
      #riCoachShellV01550 .riMetric{min-width:0;border:1px solid #29445e;border-radius:9px;background:#091725;padding:9px 10px}
      #riCoachShellV01550 .riMetric span{display:block;font-size:8px;color:#728da7;font-weight:850;margin-bottom:3px}
      #riCoachShellV01550 .riMetric b{display:block;color:#eef7ff;font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #riCoachShellV01550 .riMetric small{display:block;color:#849db4;font-size:8px;line-height:1.35;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #riCoachShellV01550 .riAlert{display:flex;align-items:center;gap:8px;margin-top:8px;border:1px solid #70414a;border-radius:9px;background:#28171c;padding:8px 10px;color:#f3b0b8;font-size:10px;font-weight:850}
      #riCoachShellV01550 .riAlert.warn{border-color:#70602c;background:#29230f;color:#eed37c}
      #riCoachShellV01550 .riAlert.good{border-color:#2f7058;background:#0d261e;color:#9be9c4}
      #riCoachShellV01550 .riRespawnStrip{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;border:1px solid #6d4a59;border-radius:10px;background:#241820;padding:9px 11px;margin-bottom:9px}
      #riCoachShellV01550 .riRespawnStrip strong{font-size:21px;color:#ffb0bc}
      #riCoachShellV01550 .riRespawnStrip span{font-size:10px;color:#c9a6ad}
      #riCoachShellV01550 .riRespawnStrip b{font-size:13px;color:#eef7ff;white-space:nowrap}
      #riCoachShellV01550 .riBuildCompare{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      #riCoachShellV01550 .riBuildCard{min-width:0;border:1px solid #2d4862;border-radius:10px;background:#091725;padding:10px 11px}
      #riCoachShellV01550 .riBuildCard.opt{border-color:#2f6e58;background:#0c211b}
      #riCoachShellV01550 .riBuildCardHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
      #riCoachShellV01550 .riBuildCardHead span{font-size:9px;color:#7e99b3;font-weight:900}
      #riCoachShellV01550 .riBuildCardHead i{font-style:normal;border-radius:99px;background:#1a3147;color:#9dc0de;padding:3px 6px;font-size:7px;font-weight:950;white-space:nowrap}
      #riCoachShellV01550 .riBuildCardHead i.same{background:#143a2d;color:#83e5b1}
      #riCoachShellV01550 .riBuildMain{font-size:15px;font-weight:950;line-height:1.35;color:#eef7ff}
      #riCoachShellV01550 .riBuildTree{font-size:10px;color:#b0c1d1;line-height:1.55;overflow-wrap:anywhere}
      #riCoachShellV01550 .riBuildSub{font-size:8px;color:#758ea6;line-height:1.4;margin-top:5px}
      #riCoachShellV01550 .riAltRow{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
      #riCoachShellV01550 .riAltChip{border:1px solid #315269;background:#0c1c2b;color:#a8c2d7;border-radius:99px;padding:4px 7px;font-size:8px;font-weight:850}
      #riCoachShellV01550 .riOneLine{margin-top:9px;border:1px solid #2c4660;border-radius:9px;background:#0a1725;padding:8px 10px;font-size:10px;line-height:1.45;color:#a9bfd2}
      #riCoachShellV01550 .riOneLine b{color:#edf7ff}
      #riCoachShellV01550 .riDetails{display:grid;gap:7px}
      #riCoachShellV01550 .riDetails details{border:1px solid #2b455e;border-radius:9px;background:#091725;overflow:hidden}
      #riCoachShellV01550 .riDetails summary{cursor:pointer;padding:9px 10px;color:#b6c9da;font-size:10px;font-weight:900}
      #riCoachShellV01550 .riDetails .riDetailBody{padding:0 10px 10px}
      #riCoachShellV01550 .riThreatRows{display:grid;gap:5px}
      #riCoachShellV01550 .riThreatRow{display:grid;grid-template-columns:24px minmax(0,1fr) auto auto;gap:7px;align-items:center;border:1px solid #253d54;border-radius:8px;background:#081522;padding:7px 8px;font-size:9px}
      #riCoachShellV01550 .riThreatRow i{font-style:normal;color:#6f89a3;font-weight:950}
      #riCoachShellV01550 .riThreatRow b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ecf6ff}
      #riCoachShellV01550 .riThreatRow span{color:#8fa7bb;white-space:nowrap}
      #riCoachShellV01550 .riThreatRow em{font-style:normal;color:#d7a2a9;font-weight:900;white-space:nowrap}
      #riCoachShellV01550 .riDetailGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      #riCoachShellV01550 .riDetailCard{border:1px solid #29445e;border-radius:8px;background:#081522;padding:8px;min-width:0}
      #riCoachShellV01550 .riDetailCard span{display:block;color:#718ba4;font-size:8px;margin-bottom:3px}
      #riCoachShellV01550 .riDetailCard b{display:block;color:#eaf5ff;font-size:11px;overflow-wrap:anywhere}
      #riCoachShellV01550 .riWaiting{display:grid;place-items:center;text-align:center;min-height:210px;border:1px dashed #365069;border-radius:11px;background:#091522;padding:20px}
      #riCoachShellV01550 .riWaiting b{font-size:16px;color:#e9f4fd}
      #riCoachShellV01550 .riWaiting span{display:block;margin-top:6px;font-size:10px;color:#839db5;line-height:1.5}
      @media(max-width:1080px){#riCoachShellV01550 .riMetrics{grid-template-columns:1fr 1fr}#riCoachShellV01550 .riBuildCompare{grid-template-columns:1fr}#riCoachShellV01550 .riDetailGrid{grid-template-columns:1fr 1fr}}
      @media(max-width:680px){#riCoachShellV01550 .riCoachHead{align-items:flex-start}#riCoachShellV01550 .riCoachHeadRight{flex-direction:column;align-items:flex-end}#riCoachShellV01550 .riMetrics{grid-template-columns:1fr}#riCoachShellV01550 .riHero h3{font-size:17px}#riCoachShellV01550 .riRespawnStrip{grid-template-columns:1fr 1fr}#riCoachShellV01550 .riRespawnStrip span{display:none}#riCoachShellV01550 .riDetailGrid{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
  }

  function ensureShell(){
    const root=$('#random'),legacy=$('#randomIngameShell');
    if(!root||!legacy)return null;
    ensureStyles();
    const nav=root.querySelector(':scope > .randomModeNav');
    if(nav&&!$('#riPreviewBtnV01550',nav)){
      const b=document.createElement('button');b.id='riPreviewBtnV01550';b.type='button';b.className='riPreviewBtnV01550';b.textContent='🎮 인게임 미리보기';b.addEventListener('click',togglePreview);nav.appendChild(b);
    }
    let shell=$('#riCoachShellV01550');
    if(!shell){
      shell=document.createElement('div');shell.id='riCoachShellV01550';shell.innerHTML=`<div class="riCoachFrame"><div class="riCoachHead"><div class="riCoachHeadLeft"><div id="riCoachStateIconV01550" class="riCoachStateIcon">⚔️</div><div class="riCoachTitle"><small>INGAME COACH · v0.15.50</small><b id="riCoachTitleV01550">전투 모드</b></div></div><div class="riCoachHeadRight"><span id="riCoachSourceV01550" class="riSourceBadge">대기</span><button id="riCoachAutoV01550" class="riAutoBtn" type="button">AUTO ON</button></div></div><div class="riPreviewBar"><span class="riPreviewNote">PREVIEW · 실제 게임 데이터 아님</span><button type="button" data-ri-preview-state="alive">생존</button><button type="button" data-ri-preview-state="dead">사망 23초</button><button type="button" data-ri-preview-state="respawn">부활 5초</button><select id="riPreviewScenarioV01550"><option value="even">일반 대치</option><option value="advantage">수적 우세</option><option value="disadvantage">수적 열세</option><option value="fed">상대 캐리 급성장</option></select><select id="riPreviewRoleV01550"><option value="tank">탱커</option><option value="adc">원딜</option><option value="mage">메이지</option><option value="support">서포터</option><option value="bruiser">브루저</option></select></div><div class="riCoachTabs"><button type="button" data-ri-tab="live">LIVE</button><button type="button" data-ri-tab="build">빌드</button><button type="button" data-ri-tab="detail">상세</button></div><div id="riCoachBodyV01550" class="riCoachBody"></div></div>`;
      legacy.parentElement.insertBefore(shell,legacy);
      shell.querySelectorAll('[data-ri-tab]').forEach(b=>b.addEventListener('click',()=>{ui.tab=b.dataset.riTab||'live';render(true)}));
      $('#riCoachAutoV01550',shell)?.addEventListener('click',()=>{ui.auto=!ui.auto;try{localStorage.setItem(AUTO_KEY,ui.auto?'1':'0')}catch{}render(true)});
      shell.querySelectorAll('[data-ri-preview-state]').forEach(b=>b.addEventListener('click',()=>{preview.state=b.dataset.riPreviewState||'alive';render(true)}));
      $('#riPreviewScenarioV01550',shell)?.addEventListener('change',e=>{preview.scenario=e.target.value||'even';render(true)});
      $('#riPreviewRoleV01550',shell)?.addEventListener('change',e=>{preview.role=e.target.value||'tank';render(true)});
    }
    return shell;
  }

  function liveContext(){try{return typeof randomLiveContext==='function'?randomLiveContext():null}catch{return null}}
  function modes(){try{return typeof randomState!=='undefined'?(randomState.ourModes||{}):{}}catch{return {}}}
  function enemyModes(){try{return typeof randomState!=='undefined'?(randomState.enemyModes||{}):{}}catch{return {}}}
  function statBuildFor(name){try{const c=typeof byName!=='undefined'?byName?.[name]:null,it=c?.item||{};return{tree:norm(it['기본 트리']||''),source:norm(it['통계 기준']||it['기준']||'앱 기본 DB'),verified:norm(it['통계 검증등급']||'')}}catch{return{tree:'',source:'앱 기본 DB',verified:''}}}
  function aliasKey(s){try{return typeof randomLiveItemAliasKey==='function'?randomLiveItemAliasKey(s):norm(s).toLowerCase()}catch{return norm(s).toLowerCase()}}
  function powerLabel(diff){diff=num(diff);return diff>=6?'우리 우세':diff>=2?'우리 약우세':diff<=-6?'상대 우세':diff<=-2?'상대 약우세':'비슷'}
  function roleText(job,name){job=norm(job);if(name&&job.startsWith(name+':'))job=job.slice(name.length+1).trim();return short(job||'내 역할 계산 대기',76)}
  function importantWarning(model){const a=model.alive,t=model.threat,s=model.advice?.summary||{};if(a&&a.our<a.enemy-1)return{tone:'bad',text:`수적 열세 ${a.our}:${a.enemy} · 정면 교전보다 부활 합류를 기다리기`};if(t&&!t.dead&&t.score>=88)return{tone:'bad',text:`${t.name} 최고위협 ${Math.round(t.score)} · ${t.damageType||'핵심 딜'} 대응을 최우선`};if(num(s.healPressure)>=3.4)return{tone:'warn',text:`상대 회복 위협 ${num(s.healPressure).toFixed(1)}/5 · 치감 가치 상승`};if(num(s.shieldPressure)>=3.4)return{tone:'warn',text:`상대 보호막 위협 ${num(s.shieldPressure).toFixed(1)}/5 · 보호막 대응 가치 상승`};return null}

  function buildRealModel(){
    const ctx=liveContext();if(!ctx)return{source:'waiting',life:'waiting',gameTime:0,title:'인게임 연결 대기'};
    const om=modes(),em=enemyModes(),ours=(ctx.ours||[]).map(x=>x.name).filter(Boolean),enemies=(ctx.enemy||[]).map(x=>x.name).filter(Boolean);
    const threats=safe(typeof randomLiveThreatRows==='function'?randomLiveThreatRows:null,ctx)||[];
    const advice=safe(typeof randomLiveNextItems==='function'?randomLiveNextItems:null,ctx,ours,enemies,om,em,threats);
    const power=safe(typeof randomLivePowerSnapshot==='function'?randomLivePowerSnapshot:null,ctx,ours,enemies,om,em)||{our:0,enemy:0,diff:0,label:'-',ourItemAvg:0,enemyItemAvg:0,ourLevelAvg:0,enemyLevelAvg:0};
    const aliveSnap=safe(typeof randomLiveAliveSnapshot==='function'?randomLiveAliveSnapshot:null,ctx)||{our:{alive:0},enemy:{alive:0}};
    const plan=safe(typeof randomLiveFightPlan==='function'?randomLiveFightPlan:null,ctx,ours,enemies,om,em,threats)||{tone:'warn',headline:'현재 교전 판단 대기',detail:'',steps:[]};
    const local=ctx.local||{},dead=!!local.isDead||num(local.respawnTimer)>0,respawn=Math.ceil(num(local.respawnTimer)),life=dead?(respawn<=7?'respawn':'dead'):'alive';
    const top=threats[0]||null,best=advice?.items?.[0]||null,stat=statBuildFor(local.name||advice?.localName||''),job=roleText(safe(typeof randomLiveLocalJob==='function'?randomLiveLocalJob:null,ctx,om),local.name||'');
    const same=!!(best?.item&&stat.tree&&stat.tree.split('→').map(norm).some(x=>aliasKey(x)===aliasKey(best.item)));
    const model={source:'live',life,ctx,ours,enemies,threats,advice,power,plan,local,respawn,gameTime:num(ctx.gameTime),gold:num(ctx.currentGold),alive:{our:num(aliveSnap.our?.alive),enemy:num(aliveSnap.enemy?.alive)},threat:top?{name:top.name,score:num(top.score),damageType:top.damageType||'',dead:!!top.isDead||num(top.respawnTimer)>0,respawn:Math.ceil(num(top.respawnTimer))}:{name:'-',score:0,damageType:'',dead:false,respawn:0},item:best?{name:best.item,score:num(best.score),reason:short(best.reason,100)}:{name:'-',score:0,reason:'내 보유 아이템 정보 대기'},alts:(advice?.items||[]).slice(1,3).map(x=>x.item),stat,buildSame:same,job,matchup:powerLabel(power.diff)};
    model.warning=importantWarning(model);return model;
  }

  function previewRoleText(role){return({tank:'먼저 들어가지 말고 적 진입을 받아친 뒤 2차 진입',adc:'앞라인부터 안전하게 딜 · 핵심 CC 대상이면 생존기 보존',mage:'아군 진입에 광역딜 연계 · 단독 앞포지션 금지',support:'원딜 옆 유지 · 첫 다이브 보호 후 역이니시',bruiser:'1차 진입 뒤 퇴로 유지 · 적 캐리 노출 때 2차 진입'}[role]||'현재 역할 수행')}
  function buildPreviewModel(){
    const role=preview.role,sc=preview.scenario;let alive={our:5,enemy:5},diff=0,headline='조건부 교전 · 상대 핵심 진입부터 확인',detail='동수 한타라 먼저 무리하지 말고 상대 첫 진입을 받아친 뒤 전환하세요.',tone='warn',threat={name:'징크스',score:84,damageType:'물리',dead:false,respawn:0},warning={tone:'warn',text:'말파이트 R → 오리아나 R 연계 가능 · 팀 간격 유지'};
    if(sc==='advantage'){alive={our:5,enemy:4};diff=5;headline='지금 교전 가치 높음';detail='상대 핵심 딜러가 부활 대기 중이라 수적 우위를 활용할 창입니다.';tone='good';threat={...threat,dead:true,respawn:16};warning={tone:'good',text:'상대 최고위협 16초 부활 · 전진 가능한 짧은 타이밍'}}
    if(sc==='disadvantage'){alive={our:3,enemy:5};diff=-8;headline='수적 열세 · 정면 한타 피하기';detail='우리 부활 합류까지 웨이브/포킹으로 시간을 버는 편이 안전합니다.';tone='bad';warning={tone:'bad',text:'우리 3 : 상대 5 · 강제교전 금지'}}
    if(sc==='fed'){diff=-4;headline='상대 캐리 급성장 · 받아치기 중심';detail='징크스가 현재 가장 큰 승부 변수입니다. 접근 각을 차단하고 먼저 노출시키세요.';tone='bad';threat={...threat,score:94};warning={tone:'bad',text:'징크스 급성장 · 치명타 지속딜 대응 최우선'}}
    const life=preview.state,respawn=life==='dead'?23:life==='respawn'?5:0;if(life==='dead'){headline=`부활 ${respawn}초 · 구매와 다음 한타 준비`;detail='죽어 있는 동안 다음 구매와 상대 최고위협 대응을 정리하세요.';tone='bad'}if(life==='respawn'){headline=`부활 ${respawn}초 · 다음 한타 준비`;detail='복귀 직후 바로 진입하지 말고 현재 역할과 최고위협을 다시 확인하세요.';tone='warn'}
    return{source:'preview',life,gameTime:742,gold:1480,respawn,alive,threat,item:{name:'란두인의 예언',score:91,reason:'징크스 성장 + 치명타 위협 때문에 이번 판 우선순위 상승'},alts:['정령의 형상','워모그의 갑옷'],stat:{tree:'가시 갑옷 → 워모그의 갑옷 → 정령의 형상',source:'26.17 ARAM · LOL.PS/MetaSRC 교차검증 DB',verified:'A'},buildSame:false,job:previewRoleText(role),matchup:powerLabel(diff),power:{our:64+Math.max(0,diff),enemy:64+Math.max(0,-diff),diff,label:'중반',ourLevelAvg:13.2,enemyLevelAvg:13.5,ourItemAvg:10100,enemyItemAvg:10450},plan:{tone,headline,detail,steps:['상대 첫 진입/핵심 CC 위치 확인','우리 딜러 프리딜 공간 확보','최고위협이 노출되면 화력 집중']},warning,threats:[threat,{name:'말파이트',score:76,damageType:'마법'},{name:'오리아나',score:72,damageType:'마법'},{name:'브라움',score:59,damageType:'혼합'},{name:'이즈리얼',score:55,damageType:'물리'}],advice:{summary:{healPressure:1.5,shieldPressure:2.1},direction:'징크스 치명타 위협 대응',items:[{item:'란두인의 예언',score:91,reason:'징크스 성장 + 치명타 위협'},{item:'정령의 형상',score:78,reason:'상대 AP 2명 대응'},{item:'워모그의 갑옷',score:72,reason:'반복 대치 회복'}]}};
  }

  function stateMeta(m){if(m.life==='dead')return{icon:'☠️',title:`사망 분석 · 부활 ${m.respawn||0}초`,tag:'ANALYZE'};if(m.life==='respawn')return{icon:'⚡',title:`부활 준비 · ${m.respawn||0}초`,tag:'READY'};if(m.life==='alive')return{icon:'⚔️',title:'전투 모드',tag:'LIVE'};return{icon:'⌛',title:'인게임 연결 대기',tag:'WAIT'}}
  function autoTabFor(life){return life==='dead'?'build':'live'}
  function renderLive(m){
    if(m.life==='waiting')return `<div class="riWaiting"><div><b>인게임 연결 대기</b><span>일반 칼바람 게임에 들어가면 자동으로 전투 모드가 시작됩니다.<br>지금 디자인을 확인하려면 상단 <b>인게임 미리보기</b>를 누르세요.</span></div></div>`;
    const plan=m.plan||{},tone=plan.tone||'warn',state=m.life==='dead'?'사망 중 판단':m.life==='respawn'?'부활 직전':'NOW CALL',time=`${String(Math.floor(num(m.gameTime)/60)).padStart(2,'0')}:${String(Math.floor(num(m.gameTime)%60)).padStart(2,'0')}`,threatSub=m.threat?.dead?`사망 · ${m.threat.respawn||0}초`:`${m.threat?.damageType||'-'} · ${m.threat?.score?Math.round(m.threat.score)+'점':'-'}`;
    return `<div class="riHero ${esc(tone)}"><div class="riHeroTop"><span>${esc(state)}</span><em>${esc(m.source==='preview'?'가상 경기':`LIVE ${time}`)} · 생존 ${m.alive.our}:${m.alive.enemy}</em></div><h3>${esc(plan.headline||'현재 교전 판단')}</h3><p>${esc(short(plan.detail||'',120))}</p></div><div class="riMetrics"><div class="riMetric"><span>최고 위협</span><b>${esc(m.threat?.name||'-')}</b><small>${esc(threatSub)}</small></div><div class="riMetric"><span>내 역할</span><b>${esc(m.job||'-')}</b><small>행동 한 줄만 표시</small></div><div class="riMetric"><span>다음 구매</span><b>${esc(m.item?.name||'-')}</b><small>${esc(m.buildSame?'통계 기본트리와 일치':'이번 판 상황 보정')}</small></div><div class="riMetric"><span>현재 구도</span><b>${esc(m.matchup||'-')}</b><small>우리 ${m.alive.our} : ${m.alive.enemy} 상대</small></div></div>${m.warning?`<div class="riAlert ${esc(m.warning.tone||'warn')}"><span>${m.warning.tone==='good'?'✓':'!'}</span><b>${esc(short(m.warning.text,118))}</b></div>`:''}`;
  }
  function renderBuild(m){
    if(m.life==='waiting')return renderLive(m);const source=m.stat?.source||'앱 기본 DB',basic=m.stat?.tree||'통계 기본트리 정보 없음',same=m.buildSame,alts=(m.alts||[]).filter(Boolean),respawn=m.life==='dead'?`<div class="riRespawnStrip"><strong>${m.respawn||0}초</strong><span>부활까지 · 지금은 구매/분석 확인 시간</span><b>보유 골드 ${Math.round(num(m.gold)).toLocaleString('ko-KR')}</b></div>`:`<div class="riRespawnStrip"><strong>${m.life==='respawn'?`${m.respawn||0}초`:'LIVE'}</strong><span>${m.life==='respawn'?'곧 부활 · 구매보다 다음 한타 준비':'현재 생존 · 필요할 때만 빌드 확인'}</span><b>보유 골드 ${Math.round(num(m.gold)).toLocaleString('ko-KR')}</b></div>`;
    return `${respawn}<div class="riBuildCompare"><div class="riBuildCard"><div class="riBuildCardHead"><span>통계 기본트리</span><i>${esc(m.stat?.verified?`검증 ${m.stat.verified}`:'BASE')}</i></div><div class="riBuildTree">${esc(basic)}</div><div class="riBuildSub">${esc(source)}</div></div><div class="riBuildCard opt"><div class="riBuildCardHead"><span>이번 판 최적화</span><i class="${same?'same':''}">${same?'기본과 일치':'상황 대응'}</i></div><div class="riBuildMain">${esc(m.item?.name||'-')}</div><div class="riBuildSub">${esc(short(m.item?.reason||m.advice?.direction||'',100))}</div>${alts.length?`<div class="riAltRow">${alts.map(x=>`<span class="riAltChip">대안 · ${esc(x)}</span>`).join('')}</div>`:''}</div></div><div class="riOneLine"><b>다음 한타:</b> ${esc(m.job||'-')}${m.threat?.name&&m.threat.name!=='-'?` · <b>${esc(m.threat.name)}</b> 대응 우선`:''}</div>`;
  }
  function detailThreats(m){const xs=(m.threats||[]).slice(0,5);if(!xs.length)return'<div class="riOneLine">상대 위협 데이터 대기</div>';return `<div class="riThreatRows">${xs.map((x,i)=>{const dead=!!x.isDead||!!x.dead||num(x.respawnTimer)>0||num(x.respawn)>0;return `<div class="riThreatRow"><i>${i+1}</i><b>${esc(x.name||'-')}</b><span>${esc(x.damageType||'-')}</span><em>${dead?`사망 ${Math.ceil(num(x.respawnTimer||x.respawn))}초`:Math.round(num(x.score))+'점'}</em></div>`}).join('')}</div>`}
  function renderDetail(m){if(m.life==='waiting')return renderLive(m);const p=m.power||{},steps=(m.plan?.steps||[]).slice(0,4);return `<div class="riDetails"><details><summary>상대 위협 TOP5</summary><div class="riDetailBody">${detailThreats(m)}</div></details><details><summary>한타 상세</summary><div class="riDetailBody"><div class="riOneLine"><b>${esc(m.plan?.headline||'현재 판단')}</b><br>${esc(short(m.plan?.detail||'',140))}</div>${steps.length?`<div class="riOneLine">${steps.map((x,i)=>`<b>${i+1}.</b> ${esc(short(x,90))}`).join('<br>')}</div>`:''}</div></details><details><summary>파워 · 부활 상세</summary><div class="riDetailBody"><div class="riDetailGrid"><div class="riDetailCard"><span>LIVE 파워</span><b>${Math.round(num(p.our))} : ${Math.round(num(p.enemy))}</b></div><div class="riDetailCard"><span>평균 레벨</span><b>${num(p.ourLevelAvg).toFixed(1)} : ${num(p.enemyLevelAvg).toFixed(1)}</b></div><div class="riDetailCard"><span>평균 아이템 가치</span><b>${Math.round(num(p.ourItemAvg)).toLocaleString('ko-KR')} : ${Math.round(num(p.enemyItemAvg)).toLocaleString('ko-KR')}</b></div></div><div class="riOneLine"><b>생존:</b> 우리 ${m.alive.our} : ${m.alive.enemy} 상대 · <b>내 상태:</b> ${m.life==='dead'?`사망 ${m.respawn}초`:m.life==='respawn'?`곧 부활 ${m.respawn}초`:'생존'}</div></div></details></div>`}

  function render(force=false){
    const shell=ensureShell();if(!shell)return;const real=buildRealModel();if(preview.active&&real.source==='live')preview.active=false;const m=preview.active?buildPreviewModel():real;if(ui.auto&&m.life!==ui.lastLife){ui.tab=autoTabFor(m.life);ui.lastLife=m.life}else if(!ui.auto&&m.life!==ui.lastLife)ui.lastLife=m.life;
    const sig=JSON.stringify([preview.active,preview.state,preview.scenario,preview.role,ui.tab,ui.auto,m.source,m.life,Math.floor(num(m.gameTime)/2),m.respawn,m.alive?.our,m.alive?.enemy,m.threat?.name,Math.round(num(m.threat?.score)),m.item?.name,m.matchup,m.warning?.text]);if(!force&&sig===ui.lastRenderSig)return;ui.lastRenderSig=sig;shell.classList.toggle('preview',preview.active);
    const sm=stateMeta(m),icon=$('#riCoachStateIconV01550',shell),title=$('#riCoachTitleV01550',shell),src=$('#riCoachSourceV01550',shell),auto=$('#riCoachAutoV01550',shell),body=$('#riCoachBodyV01550',shell);if(icon)icon.textContent=sm.icon;if(title)title.textContent=sm.title;if(src){src.textContent=preview.active?'PREVIEW':m.source==='live'?sm.tag:'대기';src.className=`riSourceBadge ${preview.active?'preview':m.source==='live'?'live':''}`}if(auto){auto.textContent=ui.auto?'AUTO ON':'AUTO OFF';auto.classList.toggle('on',ui.auto)}shell.querySelectorAll('[data-ri-tab]').forEach(b=>b.classList.toggle('active',b.dataset.riTab===ui.tab));shell.querySelectorAll('[data-ri-preview-state]').forEach(b=>b.classList.toggle('active',b.dataset.riPreviewState===preview.state));const ps=$('#riPreviewScenarioV01550',shell);if(ps&&ps.value!==preview.scenario)ps.value=preview.scenario;const pr=$('#riPreviewRoleV01550',shell);if(pr&&pr.value!==preview.role)pr.value=preview.role;if(body)body.innerHTML=ui.tab==='build'?renderBuild(m):ui.tab==='detail'?renderDetail(m):renderLive(m);const pb=$('#riPreviewBtnV01550');if(pb){pb.classList.toggle('active',preview.active);pb.classList.toggle('live',m.source==='live'&&!preview.active);pb.textContent=preview.active?'✕ 미리보기 종료':m.source==='live'?'● LIVE 화면 보기':'🎮 인게임 미리보기'}}
  function togglePreview(){const real=buildRealModel();if(real.source==='live'){preview.active=false;try{if(typeof setRandomViewMode==='function')setRandomViewMode('ingame')}catch{}render(true);return}preview.active=!preview.active;try{if(typeof setRandomViewMode==='function')setRandomViewMode(preview.active?'ingame':'pick')}catch{}render(true)}
  function schedule(){clearTimeout(ui.timer);ui.timer=setTimeout(()=>render(),80)}

  ensureShell();document.addEventListener('click',e=>{if(e.target.closest?.('#random,.randomModeNav'))schedule()},true);setInterval(()=>render(),700);
  try{if(typeof DATA!=='undefined')DATA.random_ingame_coach_v01550={version:'v0.15.50 · Random In-game Coach + Preview',exact_dom:true,preview:true,life_states:['alive','dead','respawn'],tabs:['LIVE','빌드','상세'],auto_switch:true,stat_build_source:'embedded champion DB (LOL.PS/MetaSRC cross-validated where available)',score_logic_changed:false}}catch{}
  window.aramRandomIngamePreviewV01550={open(){preview.active=true;try{if(typeof setRandomViewMode==='function')setRandomViewMode('ingame')}catch{}render(true)},close(){preview.active=false;render(true)},setState(v){if(['alive','dead','respawn'].includes(v)){preview.state=v;render(true)}},setScenario(v){if(['even','advantage','disadvantage','fed'].includes(v)){preview.scenario=v;render(true)}},setRole(v){if(['tank','adc','mage','support','bruiser'].includes(v)){preview.role=v;render(true)}},render};
  window.__ARAM_RANDOM_INGAME_COACH_V01550__=true;render(true);
})();