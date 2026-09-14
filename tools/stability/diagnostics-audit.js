'use strict';
const fs=require('fs');
const vm=require('vm');
const L=require('./lib');
const contract=L.json('stability/contracts/diagnostics.v1.json');
const src=L.read('stability/diagnostics/runtime-diagnostics.js');
L.must(contract.schema===1,'diagnostics contract schema mismatch');
for(const section of contract.required_sections||[])L.must(contract.required_fields?.[section],`missing required field list for ${section}`);
for(const token of ['aramDiagnosticsV1','duplicateIds','contractViolations','researchCheckpoint','navigator.clipboard.writeText','rawHistory'])L.must(src.includes(token),`diagnostics source missing ${token}`);
L.must(src.includes("APP_ID='aram-fearless-draft'"),'diagnostics app identity drift');
L.must(src.includes("RESEARCH_DB='aram-rating-research-v03'"),'research DB identity drift');
L.must(src.includes("CHECKPOINT_KEY='checkpoint-v03'"),'research checkpoint key drift');
try{new vm.Script(src)}catch(e){throw new Error('diagnostics runtime syntax failed: '+e.message)}
L.must(!/indexedDB\.deleteDatabase\s*\(/.test(src),'diagnostics must never delete IndexedDB');
L.must(!/\.put\s*\(|\.add\s*\(|\.delete\s*\(/.test(src),'diagnostics must remain read-only');
L.must(src.includes("if(k==='matches'||k==='matchHistory'||k==='rawHistory')continue"),'raw history redaction missing');
const report={status:'SUCCESS',schema:contract.schema,privacy:contract.privacy,read_only:true,stable_app_identity:'aram-fearless-draft',research_database:'aram-rating-research-v03',checkpoint_key:'checkpoint-v03',production_enabled:false,note:'Canonical-ready diagnostics core only; v0.15.135 Golden runtime remains untouched.'};
L.write('audit-output/stability/diagnostics-report.json',report);
console.log('DIAGNOSTICS CONTRACT AUDIT: SUCCESS');
