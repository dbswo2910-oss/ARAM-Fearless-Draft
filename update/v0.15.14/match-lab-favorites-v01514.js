'use strict';
(()=>{
  const V='0.15.14';
  const STORAGE='aram_match_lab_favorites_v1';
  const MAX_FAVORITES=30;
  const esc=s=>typeof aramHistoryEsc==='function'?aramHistoryEsc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const labelOf=a=>typeof aramHistoryAccountLabel==='function'?aramHistoryAccountLabel(a):String(a?.riotId||a?.summonerName||'').trim();
  const norm=s=>String(s||'').trim().toLowerCase();
  const keyOf=a=>String(a?.puuid||'').trim()||norm(labelOf(a));
  const clean=a=>{
    if(!a)return null;
    const riotId=labelOf(a);
    const out={
      puuid:String(a.puuid||''),summonerId:String(a.summonerId||''),accountId:String(a.accountId||''),
      riotId:String(a.riotId||riotId||''),gameName:String(a.gameName||a.displayName||''),tagLine:String(a.tagLine||''),
      summonerName:String(a.summonerName||a.displayName||''),region:String(a.region||''),savedAt:Date.now()
    };
    if(!out.riotId&&out.gameName)out.riotId=out.gameName+(out.tagLine?'#'+out.tagLine:'');
    return keyOf(out)?out:null;
  };
  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(STORAGE)||'[]');
      if(!Array.isArray(x))return[];
      const seen=new Set(),out=[];
      for(const raw of x){const a=clean(raw),k=keyOf(a);if(!a||!k||seen.has(k))continue;seen.add(k);out.push({...a,savedAt:Number(raw?.savedAt)||a.savedAt})}
      return out.slice(0,MAX_FAVORITES);
    }catch{return[]}
  }
  function write(items){try{localStorage.setItem(STORAGE,JSON.stringify((items||[]).slice(0,MAX_FAVORITES)));return true}catch{return false}}
  const current=()=>aramHistoryState?.targetMode==='searched'?clean(aramHistoryState?.account||aramHistoryState?.target):null;
  const has=a=>{const k=keyOf(a);return !!k&&read().some(x=>keyOf(x)===k)};
  function add(a){a=clean(a);if(!a)return false;const k=keyOf(a),arr=read().filter(x=>keyOf(x)!==k);arr.unshift(a);write(arr);render();return true}
  function remove(a){const k=typeof a==='string'?a:keyOf(a);if(!k)return false;const arr=read().filter(x=>keyOf(x)!==k);write(arr);render();return true}
  function toggle(){const a=current();if(!a)return false;return has(a)?remove(a):add(a)}
  async function selectByKey(k){
    const f=read().find(x=>keyOf(x)===k);if(!f)return;
    aramHistoryState.target=f.puuid?{...f}:{query:f.riotId||f.summonerName,...f};
    aramHistoryState.targetMode='searched';aramHistoryState.filter='all';
    const input=document.getElementById('historyPlayerSearch');if(input)input.value=labelOf(f);
    closeDrop();
    await loadAramHistory(true);
    document.getElementById('history')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeDrop(){document.getElementById('historyFavoriteMenu')?.classList.remove('open');document.getElementById('historyFavoriteDropdownBtn')?.setAttribute('aria-expanded','false')}
  function toggleDrop(){const m=document.getElementById('historyFavoriteMenu');if(!m)return;const open=!m.classList.contains('open');m.classList.toggle('open',open);document.getElementById('historyFavoriteDropdownBtn')?.setAttribute('aria-expanded',String(open))}
  function installStyle(){if(document.getElementById('matchLabFavoritesV01514Style'))return;const s=document.createElement('style');s.id='matchLabFavoritesV01514Style';s.textContent=`
@media(min-width:721px){.historySearchBar{grid-template-columns:minmax(240px,520px) auto auto auto}}.historyFavoriteWrap{position:relative;display:inline-flex}.historyFavoriteDropBtn{white-space:nowrap;min-width:118px;justify-content:center}.historyFavoriteDropBtn .count{display:inline-flex;min-width:18px;height:18px;padding:0 5px;margin-left:5px;align-items:center;justify-content:center;border-radius:999px;background:#172d43;border:1px solid #365b7a;color:#b9d9ef;font-size:8px}.historyFavoriteMenu{display:none;position:absolute;z-index:80;top:calc(100% + 6px);right:0;width:300px;max-height:360px;overflow:auto;padding:7px;border:1px solid #365a78;border-radius:11px;background:#07131f;box-shadow:0 18px 44px #0009}.historyFavoriteMenu.open{display:block}.historyFavoriteMenuHead{display:flex;align-items:center;justify-content:space-between;padding:3px 5px 7px;color:#809ab3;font-size:9px;font-weight:900}.historyFavoriteEmpty{padding:16px 10px;text-align:center;color:#6f879e;font-size:9px;border:1px dashed #2e4a63;border-radius:8px}.historyFavoriteRow{display:grid;grid-template-columns:minmax(0,1fr) 28px;gap:5px;margin-top:5px}.historyFavoritePick,.historyFavoriteRemove{border:1px solid #29465f;background:#0a1a29;color:#d5e7f5;border-radius:8px;cursor:pointer}.historyFavoritePick{display:flex;align-items:center;gap:8px;min-width:0;padding:8px 9px;text-align:left}.historyFavoritePick:hover{border-color:#4b86ae;background:#102a3f}.historyFavoritePick .star{color:#ffd66e;font-size:13px}.historyFavoritePick span:last-child{min-width:0}.historyFavoritePick b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.historyFavoritePick small{display:block;margin-top:2px;color:#6f879e;font-size:8px}.historyFavoriteRemove{font-size:13px;color:#839bb0}.historyFavoriteRemove:hover{color:#ff98a3;border-color:#86515a;background:#2c171c}.historyFavoriteToggle{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid #3a5670;border-radius:999px;background:#0a1826;color:#8da6bd;font-size:9px;font-weight:950;cursor:pointer}.historyFavoriteToggle.on{border-color:#b78a26;background:#2a210b;color:#ffdb76}.historyFavoriteToggle:disabled{opacity:.42;cursor:not-allowed}.historyFavoriteToggle .star{font-size:13px;line-height:1}.historyFavoriteHint{color:#627d95;font-size:8px;margin-left:2px}@media(max-width:760px){.historyFavoriteMenu{left:0;right:auto;width:min(300px,88vw)}.historyFavoriteDropBtn{min-width:104px}}
`;document.head.appendChild(s)}
  function installUI(){
    const bar=document.querySelector('.historySearchBar'),line=document.querySelector('.historyAccountLine');if(!bar||!line)return false;
    if(!document.getElementById('historyFavoriteWrap')){
      const wrap=document.createElement('div');wrap.id='historyFavoriteWrap';wrap.className='historyFavoriteWrap';wrap.innerHTML=`<button id="historyFavoriteDropdownBtn" class="btn secondary historyFavoriteDropBtn" type="button" aria-expanded="false">★ 친구 <span class="count">0</span> ▾</button><div id="historyFavoriteMenu" class="historyFavoriteMenu"></div>`;
      bar.appendChild(wrap);
      wrap.querySelector('#historyFavoriteDropdownBtn').addEventListener('click',e=>{e.stopPropagation();toggleDrop()});
      wrap.querySelector('#historyFavoriteMenu').addEventListener('click',e=>e.stopPropagation());
    }
    if(!document.getElementById('historyFavoriteToggle')){
      const b=document.createElement('button');b.id='historyFavoriteToggle';b.className='historyFavoriteToggle';b.type='button';b.innerHTML='<span class="star">☆</span><span class="txt">즐겨찾기</span>';b.addEventListener('click',toggle);line.insertBefore(b,document.getElementById('historySourceBadge')||null);
      const h=document.createElement('span');h.id='historyFavoriteHint';h.className='historyFavoriteHint';h.textContent='검색한 친구를 저장';line.appendChild(h);
    }
    return true;
  }
  function render(){
    installStyle();if(!installUI())return;
    const arr=read(),btn=document.getElementById('historyFavoriteDropdownBtn'),menu=document.getElementById('historyFavoriteMenu'),toggleBtn=document.getElementById('historyFavoriteToggle'),hint=document.getElementById('historyFavoriteHint'),a=current(),fav=a&&has(a);
    if(btn){const c=btn.querySelector('.count');if(c)c.textContent=String(arr.length);btn.title=arr.length?`저장한 친구 ${arr.length}명`:'저장한 친구가 없습니다'}
    if(menu){menu.innerHTML=`<div class="historyFavoriteMenuHead"><span>친구 즐겨찾기</span><span>${arr.length}/${MAX_FAVORITES}</span></div>${arr.length?arr.map(x=>{const k=keyOf(x),lab=labelOf(x),meta=[x.region,x.puuid?'PUUID 저장':'Riot ID 저장'].filter(Boolean).join(' · ');return `<div class="historyFavoriteRow"><button class="historyFavoritePick" type="button" data-fav-key="${esc(k)}"><span class="star">★</span><span><b>${esc(lab||'이름 없음')}</b><small>${esc(meta||'클릭해서 전적 열기')}</small></span></button><button class="historyFavoriteRemove" type="button" data-remove-key="${esc(k)}" title="즐겨찾기 삭제">×</button></div>`}).join(''):'<div class="historyFavoriteEmpty">친구 전적을 검색한 뒤 ☆ 즐겨찾기를 눌러 저장하세요.</div>'}`;menu.querySelectorAll('[data-fav-key]').forEach(x=>x.addEventListener('click',()=>selectByKey(x.dataset.favKey)));menu.querySelectorAll('[data-remove-key]').forEach(x=>x.addEventListener('click',()=>remove(x.dataset.removeKey)))}
    if(toggleBtn){toggleBtn.disabled=!a;toggleBtn.classList.toggle('on',!!fav);toggleBtn.querySelector('.star').textContent=fav?'★':'☆';toggleBtn.querySelector('.txt').textContent=fav?'즐겨찾기됨':'즐겨찾기';toggleBtn.title=a?(fav?'이 친구를 즐겨찾기에서 삭제':'이 친구를 즐겨찾기에 추가'):'다른 Riot ID 전적을 먼저 검색하세요'}
    if(hint)hint.textContent=a?(fav?'친구 목록에 저장됨':'검색한 친구를 저장'):'다른 Riot ID 검색 후 저장 가능';
  }
  try{
    installStyle();installUI();render();
    document.addEventListener('click',e=>{if(!e.target.closest?.('#historyFavoriteWrap'))closeDrop()});
    const oldRenderAccount=aramHistoryRenderAccount;aramHistoryRenderAccount=function(...args){const r=oldRenderAccount.apply(this,args);render();return r};
    const oldRenderFeedback=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...args){const r=oldRenderFeedback.apply(this,args);render();return r};
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.match_lab_favorites_v01514={version:'v0.15.14 · Match Lab Friend Favorites',storage:'localStorage only',max_favorites:MAX_FAVORITES,stores:['Riot ID','PUUID when available','region'],credentials:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    const info=document.querySelector?.('.dataInfoPanel .callout');
    if(info&&!String(info.innerHTML||'').includes('Match Lab Friend Favorites'))info.innerHTML=`<b>v0.15.14:</b> <b>Match Lab Friend Favorites</b> — 검색한 친구 Riot ID를 별표로 저장하고, 검색창 옆 친구 드롭다운에서 한 번에 다시 전적을 열 수 있습니다. PUUID가 확보된 계정은 PUUID를 함께 로컬에 저장해 이름 표기가 바뀌어도 동일 계정을 우선 추적합니다. 즐겨찾기는 이 PC의 localStorage에만 저장하며 Riot 인증정보는 저장하지 않습니다.<br><br>`+info.innerHTML;
    window.aramHistoryFavoritesV01514={read,add,remove,toggle,selectByKey,render,keyOf,current};
    window.__ARAM_MATCH_LAB_FAVORITES_V01514__=true;
  }catch(e){console.error('[v0.15.14] Match Lab favorites patch failed',e);window.__ARAM_MATCH_LAB_FAVORITES_V01514__=false}
})();
