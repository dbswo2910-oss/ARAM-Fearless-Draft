'use strict';
const L=require('./lib');const legacy=require('../../update/v0.15.135/runtime-source-stability-v015135');const next=require('../../src/data/patch-mode-shell');
class Style{constructor(){this.map={}}setProperty(k,v,p=''){this.map[k]={value:String(v),priority:String(p)}}removeProperty(k){delete this.map[k]}}
class Node{
  constructor({id='',classes=[],text='',tag='div'}={}){this.id=id;this.classes=new Set(classes);this.textContent=text;this.tag=tag;this.children=[];this.parentElement=null;this.dataset={};this.hidden=false;this.attrs={};this.style=new Style()}
  append(x){x.parentElement=this;this.children.push(x);return x}
  contains(x){if(!x)return false;if(x===this)return true;return this.children.some(c=>c.contains(x))}
  matches(sel){if(sel==='button')return this.tag==='button';if(sel==='.title')return this.classes.has('title');if(sel.startsWith('#'))return this.id===sel.slice(1);return false}
  closest(selector){const sels=String(selector).split(',');for(let n=this;n;n=n.parentElement)if(sels.some(s=>n.matches(s)))return n;return null}
  querySelectorAll(selector){const out=[];const attr=selector.match(/^\[data-([^=]+)="([^"]+)"\]$/);const dataKey=attr?attr[1].split('-').map((x,i)=>i?x[0].toUpperCase()+x.slice(1):x).join(''):'';function visit(n){for(const c of n.children){if(selector==='button'&&c.tag==='button')out.push(c);else if(selector==='.title'&&c.classes.has('title'))out.push(c);else if(attr&&String(c.dataset?.[dataKey]||'')===attr[2])out.push(c);visit(c)}}visit(this);return out}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  getAttribute(k){return this.attrs[k]??null}setAttribute(k,v){this.attrs[k]=String(v)}removeAttribute(k){delete this.attrs[k]}
}
function tree(){
  const view=new Node({id:'data'}),header=view.append(new Node({classes:['title'],text:'챔피언 상세 닫기'})),close=header.append(new Node({tag:'button',text:'닫기'}));close.setAttribute('aria-label','상세 닫기');
  const card=view.append(new Node({id:'dataCard',text:'Patch Notes body'})),body=card.append(new Node({id:'dataPatchNotesV01599',classes:['title'],text:'챔피언 상세 패치노트 닫기'}));body.append(new Node({tag:'button',text:'닫기'}));
  const nav=view.append(new Node({id:'dataHubTopNavV015115',classes:['title'],text:'챔피언 상세 닫기'}));nav.append(new Node({tag:'button',text:'닫기'}));
  const ordinary=view.append(new Node({classes:['title'],text:'일반 통계'}));ordinary.append(new Node({tag:'button',text:'닫기'}));
  return{view,header,card,body,nav,ordinary,parts:{view,card}};
}
function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function state(x,kind){const hiddenKey=kind==='legacy'?'data115PatchShellHiddenV015135':next.HIDDEN_DATASET_KEY;return{hidden:x.hidden,aria:x.getAttribute('aria-hidden'),display:x.style.map.display||null,tag:String(x.dataset?.[hiddenKey]||''),role:String(x.dataset?.uiRole||'')}}
const a=tree(),b=tree();const lm=legacy.applyPatchShellSemanticSweepV015135(a.parts,true,text),nm=next.applyPatchShellSemanticSweep(b.parts,true,text);L.must(lm===nm&&lm===1,'Patch mode matched-row count drift');const la=state(a.header,'legacy'),nb=state(b.header,'canonical');for(const key of ['hidden','aria','display'])L.must(JSON.stringify(la[key])===JSON.stringify(nb[key]),`Patch header ${key} drift`);L.must(la.tag==='1'&&nb.tag==='1','Patch hidden ownership tag missing');L.must(nb.role===next.UI_ROLE,'canonical stable UI role not assigned');for(const [name,x,y] of [['Patch Notes body',a.body,b.body],['DATA nav',a.nav,b.nav],['ordinary title',a.ordinary,b.ordinary]])L.must(x.hidden===false&&y.hidden===false,`${name} must not be hidden`);
// Prove restoration is ownership-tag based, not dependent on the original label still matching.
a.header.textContent='교체된 제목';b.header.textContent='교체된 제목';a.header.children[0].textContent='X';b.header.children[0].textContent='X';legacy.applyPatchShellSemanticSweepV015135(a.parts,false,text);next.applyPatchShellSemanticSweep(b.parts,false,text);const lr=state(a.header,'legacy'),nr=state(b.header,'canonical');for(const key of ['hidden','aria','display'])L.must(JSON.stringify(lr[key])===JSON.stringify(nr[key]),`Tier restore ${key} drift`);L.must(lr.hidden===false&&nr.hidden===false&&lr.tag===''&&nr.tag==='','owned row did not restore cleanly');
// Second topology: close button is nested below a non-.title shell row; parent walk must still resolve it.
function nested(){const view=new Node({id:'data'}),row=view.append(new Node({text:'챔피언 상세 옵션'})),wrap=row.append(new Node({text:'controls'})),btn=wrap.append(new Node({tag:'button',text:'닫기'})),card=view.append(new Node({id:'dataCard'}));return{view,row,card,parts:{view,card}}}
const c=nested(),d=nested();const lc=legacy.applyPatchShellSemanticSweepV015135(c.parts,true,text),nd=next.applyPatchShellSemanticSweep(d.parts,true,text);L.must(lc===nd&&lc===1&&c.row.hidden&&d.row.hidden,'nested semantic close-row discovery drift');
L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical DATA Patch shell must remain inactive/scoring-neutral');const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,ui_role:next.UI_ROLE,fixtures:['title row','Patch Notes body exclusion','DATA nav exclusion','ownership-tag restore after label replacement','nested close-button parent walk'],hotfix_intent_absorbed:'Patch Notes hides only generic champion-detail/close shell; tier mode restores it',legacy_version_names_in_canonical_behavior:false,scoring_changed:false,cutover_allowed:false};L.write('audit-output/stability/data-patch-shell-canonical-differential.json',report);console.log('DATA PATCH SHELL CANONICAL DIFFERENTIAL: SUCCESS · v0.15.135 intent preserved without versioned hotfix ownership');
