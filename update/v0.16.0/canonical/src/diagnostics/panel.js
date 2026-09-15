'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const UI_ROLES=Object.freeze({panel:'diagnostics-panel',title:'diagnostics-title',summary:'diagnostics-summary',json:'diagnostics-json',refresh:'diagnostics-refresh',copy:'diagnostics-copy',close:'diagnostics-close'});
function safeText(v){return String(v??'')}
function summaryLines(payload={}){
  const dupes=Array.isArray(payload?.ui?.duplicate_ids)?payload.ui.duplicate_ids:[];
  const violations=Array.isArray(payload?.ui?.contract_violations)?payload.ui.contract_violations:[];
  return[
    `APP ${safeText(payload?.app?.version||'unknown')} · ${safeText(payload?.app?.app_identity||'unknown')}`,
    `VIEW ${safeText(payload?.view?.current_view||'unknown')} / ${safeText(payload?.view?.current_mode||'unknown')}`,
    `DOM duplicate IDs ${dupes.length} · contract violations ${violations.length}`,
    `RESEARCH ${safeText(payload?.research?.status||'unknown')} · matches ${payload?.research?.accepted_matches??'?'}`,
    `AUTOSYNC ${safeText(payload?.autosync?.status||'unknown')} · queue ${Number(payload?.autosync?.queue_depth||0)}`
  ];
}
function serialize(payload){return JSON.stringify(payload||{},null,2)}
function createDiagnosticsPanel({documentRef=globalThis.document,collector=globalThis.aramDiagnosticsV1,clipboard=globalThis.navigator?.clipboard}={}){
  let root=null,summary=null,jsonNode=null,lastPayload=null;
  function el(tag,role,text=''){const node=documentRef.createElement(tag);node.setAttribute('data-ui-role',role);if(text)node.textContent=text;return node}
  function ensure(){
    if(root?.isConnected)return root;
    root=el('section',UI_ROLES.panel);root.hidden=true;root.setAttribute('aria-label','UI 진단');
    const head=documentRef.createElement('div'),title=el('strong',UI_ROLES.title,'UI 진단');
    const refreshBtn=el('button',UI_ROLES.refresh,'새로고침'),copyBtn=el('button',UI_ROLES.copy,'진단 JSON 복사'),closeBtn=el('button',UI_ROLES.close,'닫기');
    refreshBtn.type=copyBtn.type=closeBtn.type='button';head.append(title,refreshBtn,copyBtn,closeBtn);
    summary=el('pre',UI_ROLES.summary);jsonNode=el('pre',UI_ROLES.json);root.append(head,summary,jsonNode);documentRef.body.appendChild(root);
    refreshBtn.addEventListener('click',()=>{void refresh()});copyBtn.addEventListener('click',()=>{void copy()});closeBtn.addEventListener('click',close);
    return root;
  }
  async function refresh(extra={}){
    ensure();if(!collector?.collect)throw new Error('diagnostics collector unavailable');lastPayload=await collector.collect(extra);summary.textContent=summaryLines(lastPayload).join('\n');jsonNode.textContent=serialize(lastPayload);return lastPayload;
  }
  async function open(extra={}){ensure();root.hidden=false;await refresh(extra);return root}
  function close(){if(root)root.hidden=true}
  async function copy(extra={}){
    if(collector?.copy){const out=await collector.copy(extra);lastPayload=out?.payload||lastPayload;if(jsonNode&&lastPayload)jsonNode.textContent=serialize(lastPayload);return out}
    const payload=lastPayload||await refresh(extra),text=serialize(payload);try{await clipboard?.writeText?.(text);return{ok:true,text,payload}}catch{return{ok:false,text,payload}}
  }
  function destroy(){root?.remove?.();root=summary=jsonNode=null;lastPayload=null}
  return{ensure,open,close,refresh,copy,destroy,getLastPayload:()=>lastPayload,roles:UI_ROLES};
}
module.exports={IMPLEMENTATION_VERSION,UI_ROLES,summaryLines,serialize,createDiagnosticsPanel,production_active:false,read_only:true,privacy_safe:true};
