'use strict';
const panelMod=require('./panel');
const IMPLEMENTATION_VERSION='0.16-shadow';
const IDS=Object.freeze({style:'diagnosticsCanonicalStyleV016',launch:'diagnosticsCanonicalLaunchV016',panel:'diagnosticsCanonicalPanelV016'});
const STYLE=`
[data-ui-role="diagnostics-launch"]{border:1px solid #355673;background:#0e2134;color:#b9d9ee;border-radius:9px;padding:7px 10px;font-size:9px;font-weight:800;cursor:pointer}[data-ui-role="diagnostics-panel"]{position:fixed;z-index:520;right:14px;bottom:14px;width:min(720px,calc(100vw - 28px));max-height:min(82vh,760px);overflow:auto;border:1px solid #35536d;border-radius:14px;background:#071422;color:#dceaf6;padding:12px;box-shadow:0 18px 55px #0008}[data-ui-role="diagnostics-panel"]>div:first-child{display:flex;align-items:center;gap:7px;position:sticky;top:0;background:#071422;padding-bottom:9px}[data-ui-role="diagnostics-title"]{margin-right:auto}[data-ui-role="diagnostics-panel"] button{border:1px solid #34516a;background:#102338;color:#cde4f4;border-radius:7px;padding:6px 8px;cursor:pointer}[data-ui-role="diagnostics-summary"],[data-ui-role="diagnostics-json"]{white-space:pre-wrap;word-break:break-word;border:1px solid #20384d;border-radius:9px;background:#06101b;padding:10px;font-size:9px;line-height:1.5}[data-ui-role="diagnostics-json"]{max-height:48vh;overflow:auto;color:#9db8cb}@media(max-width:720px){[data-ui-role="diagnostics-panel"]{right:0;bottom:0;width:100%;max-height:92vh;border-radius:14px 14px 0 0}}`;
function createDiagnosticsOwner({documentRef=globalThis.document,collector=globalThis.aramDiagnosticsV1,clipboard=globalThis.navigator?.clipboard,resolveMount=null,getExtra=(()=>({})),onOpen=(()=>{}),onClose=(()=>{})}={}){
  if(!documentRef)throw new Error('document required');
  let disposed=false,launchListener=null;
  const panel=panelMod.createDiagnosticsPanel({documentRef,collector,clipboard});
  function mountTarget(){if(typeof resolveMount==='function'){const x=resolveMount();if(x)return x}return documentRef.querySelector?.('[data-ui-role="canonical-shell-tools"]')||documentRef.body||null}
  function ensureStyle(){let st=documentRef.getElementById?.(IDS.style);if(st)return st;st=documentRef.createElement?.('style');if(!st)return null;st.id=IDS.style;st.textContent=STYLE;(documentRef.head||documentRef.body)?.appendChild?.(st);return st}
  function ensurePanel(){const root=panel.ensure();if(root&&!root.id)root.id=IDS.panel;return root}
  function ensureLauncher(){let b=documentRef.getElementById?.(IDS.launch);if(b)return b;const host=mountTarget();if(!host||!documentRef.createElement)return null;b=documentRef.createElement('button');b.id=IDS.launch;b.type='button';b.textContent='UI 진단';b.setAttribute?.('data-ui-role','diagnostics-launch');launchListener=()=>{void open()};b.addEventListener?.('click',launchListener);host.appendChild?.(b);return b}
  async function open(extra=getExtra()){if(disposed)return null;ensureStyle();ensureLauncher();const root=ensurePanel();if(!root)return null;await panel.open(extra||{});onOpen(panel.getLastPayload());return root}
  function close(){if(disposed)return false;panel.close();onClose();return true}
  async function refresh(extra=getExtra()){if(disposed)return null;ensureStyle();ensureLauncher();ensurePanel();return panel.refresh(extra||{})}
  async function copy(extra=getExtra()){if(disposed)return{ok:false,reason:'disposed'};ensureStyle();ensureLauncher();ensurePanel();return panel.copy(extra||{})}
  function render(){if(disposed)return false;ensureStyle();ensureLauncher();ensurePanel();return true}
  function dispose(){if(disposed)return;disposed=true;const b=documentRef.getElementById?.(IDS.launch),st=documentRef.getElementById?.(IDS.style);if(b&&launchListener)b.removeEventListener?.('click',launchListener);b?.remove?.();st?.remove?.();panel.destroy();launchListener=null}
  return{render,open,close,refresh,copy,dispose,ensureStyle,ensureLauncher,ensurePanel,panel,get disposed(){return disposed}};
}
module.exports={IMPLEMENTATION_VERSION,IDS,STYLE,createDiagnosticsOwner,production_active:false,owner_status:'shadow',read_only:true,privacy_safe:true,recurring_polling:false};
