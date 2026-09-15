'use strict';
const L=require('./lib');
const ownerMod=require('../../src/diagnostics/owner');
function makeNode(tag='div'){
  const listeners={};
  const n={tagName:String(tag).toUpperCase(),id:'',type:'',textContent:'',hidden:false,isConnected:false,attrs:{},dataset:{},children:[],parentElement:null,
    setAttribute(k,v){this.attrs[k]=String(v);if(k==='data-ui-role')this.dataset.uiRole=String(v)},
    getAttribute(k){return this.attrs[k]||null},
    appendChild(x){x.parentElement=this;x.isConnected=this.isConnected;this.children.push(x);return x},
    append(...xs){for(const x of xs)this.appendChild(x)},
    addEventListener(t,fn){(listeners[t]||(listeners[t]=new Set())).add(fn)},
    removeEventListener(t,fn){listeners[t]?.delete(fn)},
    listenerCount(t){return listeners[t]?.size||0},
    remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null;this.isConnected=false},
    querySelector(sel){return walk(this).find(x=>sel==='[data-ui-role="canonical-shell-tools"]'&&x.attrs['data-ui-role']==='canonical-shell-tools')||null},
    closest(){return null}
  };return n;
}
function walk(x){return[x,...(x.children||[]).flatMap(walk)]}
const head=makeNode('head'),body=makeNode('body'),tools=makeNode('div');head.isConnected=body.isConnected=true;tools.setAttribute('data-ui-role','canonical-shell-tools');body.appendChild(tools);
const documentRef={head,body,createElement:t=>makeNode(t),getElementById:id=>[...walk(head),...walk(body)].find(x=>x.id===id)||null,querySelector:sel=>sel==='[data-ui-role="canonical-shell-tools"]'?tools:null};
const fixture={app:{version:'0.16-shadow',app_identity:'aram-fearless-draft'},view:{current_view:'random-root',current_mode:'pick'},ui:{duplicate_ids:[],contract_violations:[]},research:{status:'ok',accepted_matches:159},autosync:{status:'IDLE',queue_depth:0},runtime:{owners:{diagnostics:'shadow'},loaded_modules:[]}};
let collects=0,copied='';const collector={async collect(){collects++;return JSON.parse(JSON.stringify(fixture))}};const clipboard={async writeText(v){copied=String(v)}};
(async()=>{
  const owner=ownerMod.createDiagnosticsOwner({documentRef,collector,clipboard,getExtra:()=>({version:'0.16-shadow'})});
  for(let i=0;i<30;i++){L.must(owner.render()===true,`diagnostics render failed ${i}`);await owner.open();owner.close()}
  const all=[...walk(head),...walk(body)];
  L.must(all.filter(x=>x.id===ownerMod.IDS.launch).length===1,'30 diagnostics renders duplicated launcher');
  L.must(all.filter(x=>x.id===ownerMod.IDS.style).length===1,'30 diagnostics renders duplicated style');
  L.must(all.filter(x=>x.id===ownerMod.IDS.panel).length===1,'30 diagnostics opens duplicated panel');
  const launch=documentRef.getElementById(ownerMod.IDS.launch),panel=documentRef.getElementById(ownerMod.IDS.panel);
  L.must(launch?.attrs['data-ui-role']==='diagnostics-launch','diagnostics launch semantic role missing');
  L.must(panel?.attrs['data-ui-role']==='diagnostics-panel','diagnostics panel semantic role missing');
  L.must(launch.listenerCount('click')===1,'diagnostics launch listener duplicated');
  L.must(collects===30,'diagnostics open must collect once per open');
  const out=await owner.copy();L.must(out.ok===true&&copied.includes('aram-fearless-draft')&&copied.includes('159'),'diagnostics clipboard JSON path failed');
  const src=L.read('src/diagnostics/owner.js');L.must(!src.includes('MutationObserver')&&!src.includes('setInterval(')&&!src.includes('setTimeout('),'diagnostics shell owner must not add repair/polling loops');
  L.must(ownerMod.production_active===false&&ownerMod.owner_status==='shadow'&&ownerMod.read_only===true&&ownerMod.privacy_safe===true,'diagnostics shell safety contract drift');
  owner.dispose();L.must(!documentRef.getElementById(ownerMod.IDS.launch)&&!documentRef.getElementById(ownerMod.IDS.style)&&!documentRef.getElementById(ownerMod.IDS.panel),'diagnostics dispose cleanup failed');
  const report={status:'SUCCESS',stage:'DIAGNOSTICS_CANONICAL_SHELL_SHADOW',production_active:false,owner:'src/diagnostics/owner.js',stable_roles:['diagnostics-launch','diagnostics-panel'],fixtures:['30 open/close cycles','single launcher/style/panel','single launcher listener','refresh collect','clipboard JSON','dispose cleanup'],read_only:true,privacy_safe:true,recurring_polling:false,cutover_allowed:false,next_requirement:'Strengthen installed-app and real-Windows acceptance before any legacy runtime removal'};
  L.write('audit-output/stability/diagnostics-owner-report.json',report);console.log('DIAGNOSTICS OWNER AUDIT: SUCCESS · canonical shell entry is shadow-complete');
})().catch(e=>{console.error(e);process.exit(1)});
