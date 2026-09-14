'use strict';
const vm=require('vm');
const L=require('./lib');
const contract=L.json('stability/contracts/diagnostics.v1.json');
const src=L.read('stability/diagnostics/runtime-diagnostics.js');
const panelSrc=L.read('src/diagnostics/panel.js');
const ownerSrc=L.read('src/diagnostics/owner.js');
const diagnostics=require('../../src/diagnostics');
L.must(contract.schema===1,'diagnostics contract schema mismatch');
for(const section of contract.required_sections||[])L.must(contract.required_fields?.[section],`missing required field list for ${section}`);
for(const token of ['aramDiagnosticsV1','duplicateIds','contractViolations','researchCheckpoint','navigator.clipboard.writeText','rawHistory'])L.must(src.includes(token),`diagnostics source missing ${token}`);
L.must(src.includes("APP_ID='aram-fearless-draft'"),'diagnostics app identity drift');
L.must(src.includes("RESEARCH_DB='aram-rating-research-v03'"),'research DB identity drift');
L.must(src.includes("CHECKPOINT_KEY='checkpoint-v03'"),'research checkpoint key drift');
try{new vm.Script(src)}catch(e){throw new Error('diagnostics runtime syntax failed: '+e.message)}
try{new vm.Script(panelSrc)}catch(e){throw new Error('diagnostics panel syntax failed: '+e.message)}
try{new vm.Script(ownerSrc)}catch(e){throw new Error('diagnostics owner syntax failed: '+e.message)}
L.must(!/indexedDB\.deleteDatabase\s*\(/.test(src),'diagnostics must never delete IndexedDB');
L.must(!/transaction\s*\([^)]*,\s*['\"]readwrite['\"]/.test(src),'diagnostics must never open readwrite IndexedDB transactions');
L.must(!/objectStore\s*\([^)]*\)\s*\.\s*(put|add|delete|clear)\s*\(/.test(src),'diagnostics must never mutate IndexedDB object stores');
L.must(!/createObjectStore\s*\(|deleteObjectStore\s*\(/.test(src),'diagnostics must never mutate IndexedDB schema');
L.must(src.includes("if(k==='matches'||k==='matchHistory'||k==='rawHistory')continue"),'raw history redaction missing');
L.must(!/setInterval\s*\(|MutationObserver\s*\(/.test(panelSrc+'\n'+ownerSrc),'diagnostics panel/owner must not create recurring repair/polling owners');
L.must(diagnostics.production_active===false&&diagnostics.read_only===true&&diagnostics.privacy_safe===true,'diagnostics canonical owner must remain inactive/read-only/privacy-safe');
L.must(diagnostics.contract?.components?.collector==='shadow'&&diagnostics.contract?.components?.panel==='shadow'&&diagnostics.contract?.components?.canonical_shell_entry==='shadow'&&diagnostics.contract?.components?.production_menu_entry==='planned','diagnostics migration contract drift');
const roles=Object.values(diagnostics.panel.UI_ROLES);L.must(new Set(roles).size===roles.length,'diagnostics UI roles must be unique');for(const role of ['diagnostics-panel','diagnostics-json','diagnostics-copy','diagnostics-close'])L.must(roles.includes(role),`diagnostics stable role missing ${role}`);
L.must(diagnostics.owner?.owner_status==='shadow'&&diagnostics.owner?.read_only===true&&diagnostics.owner?.privacy_safe===true,'diagnostics shell owner export drift');
const fixture={app:{version:'0.16-shadow',app_identity:'aram-fearless-draft'},view:{current_view:'data-root',current_mode:'patch'},ui:{duplicate_ids:[],contract_violations:[]},research:{status:'ok',accepted_matches:159},autosync:{status:'IDLE',queue_depth:0}};
const lines=diagnostics.panel.summaryLines(fixture);L.must(lines.length===5&&lines.some(x=>x.includes('matches 159')),'diagnostics panel summary fixture drift');const serialized=diagnostics.panel.serialize(fixture);L.must(serialized.includes('aram-fearless-draft')&&serialized.includes('159'),'diagnostics panel JSON serialization drift');
const report={status:'SUCCESS',schema:contract.schema,privacy:contract.privacy,read_only:true,stable_app_identity:'aram-fearless-draft',research_database:'aram-rating-research-v03',checkpoint_key:'checkpoint-v03',canonical_panel:{status:'shadow',stable_roles:roles,recurring_polling:false,copy_json:true},canonical_shell_entry:'shadow',production_enabled:false,note:'Canonical diagnostics collector + panel + shell owner are shadow-only; production v0.15.135 remains untouched.'};
L.write('audit-output/stability/diagnostics-report.json',report);
console.log('DIAGNOSTICS CONTRACT AUDIT: SUCCESS · collector, panel and canonical shell entry shadow ready');
