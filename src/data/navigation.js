'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const NAV_ID='dataCanonicalNavV016';
const NAV_ROLE='data-nav';
function createNavigation(documentRef,{patchLabel='26.18',onMode=(()=>{})}={}){
  if(!documentRef?.createElement)throw new Error('document.createElement required');
  const nav=documentRef.createElement('nav');nav.id=NAV_ID;nav.dataset=nav.dataset||{};nav.dataset.uiRole=NAV_ROLE;nav.setAttribute?.('aria-label','데이터 보기');
  nav.innerHTML=`<button type="button" data-data-mode="tier">챔피언 티어리스트</button><button type="button" data-data-mode="patch">패치노트 <span class="badge">${String(patchLabel)}</span></button>`;
  nav.addEventListener?.('click',e=>{const b=e?.target?.closest?.('[data-data-mode]');if(!b)return;const mode=b.dataset?.dataMode;if(mode==='tier'||mode==='patch')onMode(mode)});
  return nav;
}
function mountNavigation(host,nav){if(!host||!nav)return false;if(nav.parentElement!==host||host.firstElementChild!==nav)host.insertBefore?.(nav,host.firstElementChild||null);return nav.parentElement===host||!nav.parentElement}
module.exports={IMPLEMENTATION_VERSION,NAV_ID,NAV_ROLE,createNavigation,mountNavigation,production_active:false,score_logic_changed:false,random_scoring_changed:false};
