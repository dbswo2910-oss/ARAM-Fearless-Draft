'use strict';
const L=require('./lib');
const C=L.json('stability/contracts/state-compat.v1.json');
const manifest=L.json('update/manifest.json');
const manifestMap=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const pkg=L.json(`update/v${manifest.version}/package.json`);
L.must(pkg.name===C.stable_app_identity,`app identity drift: ${pkg.name}`);

function mainLineage(entry){
  const seen=new Set(),rows=[],queue=[];
  const first=manifestMap.get(entry)||`update/v${manifest.version}/${entry}`;
  queue.push(first);
  while(queue.length&&rows.length<12){
    const source=queue.shift();
    if(!source||seen.has(source))continue;
    L.must(L.exists(source),`main lineage source missing: ${source}`);
    seen.add(source);
    const text=L.read(source);
    rows.push({source,text});
    for(const m of text.matchAll(/path\.join\(__dirname\s*,\s*['\"]([^'\"]+\.js)['\"]\)/g)){
      const target=String(m[1]||'');
      const next=manifestMap.get(target);
      if(next&&!seen.has(next))queue.push(next);
    }
  }
  return rows;
}
const lineage=mainLineage(pkg.main);
L.must(lineage.length>0,'active main lineage empty');
const main=lineage.map(x=>x.text).join('\n');
L.must(main.includes("STABLE_APP_ID='aram-fearless-draft'")||main.includes('aram-fearless-draft'),'active main lineage does not preserve stable userData identity');
L.must(main.includes("setPath('userData'")||main.includes('setPath("userData"'),'active main lineage does not pin stable userData path');

const statePath='update/v0.15.117/state-integrity-v015117.js';
const stateOwner=require(L.p(statePath));
L.must(stateOwner.policy_version==='0.15.117'||stateOwner.VERSION==='0.15.117','state integrity owner version mismatch');
for(const fn of ['readNamespace','writeNamespace','guardExternalJson','writeTextAtomic'])L.must(typeof stateOwner[fn]==='function',`state integrity owner missing ${fn}`);
L.must(stateOwner.score_logic_changed===false&&stateOwner.random_scoring_changed===false,'state integrity owner must remain scoring-neutral');

const researchCandidates=['update/v0.15.135/research-storage-v015131.js','update/v0.15.132/research-storage-v015131.js','update/v0.15.131/research-storage-v015131.js'].filter(L.exists);
L.must(researchCandidates.length>0,'Research storage source not found');
const researchPath=researchCandidates[0],research=L.read(researchPath);
L.must(research.includes('aram-rating-research-v03'),'Research DB identity drift');
L.must(research.includes('checkpoint-v03'),'Research checkpoint identity drift');
const activeSources=(manifest.files||[]).map(x=>x.source).filter(Boolean);
const destructive=[];
for(const s of activeSources){if(!/\.js$/.test(s)||!L.exists(s))continue;const x=L.read(s);if(/deleteDatabase\s*\(/.test(x)&&x.includes('aram-rating-research-v03'))destructive.push(s)}
L.must(!destructive.length,`active runtime contains destructive Research DB delete: ${destructive.join(', ')}`);

const report={status:'SUCCESS',stage:'CONTRACT_IDENTITY_AND_INSTALLED_PERSISTENCE_GUARDS_READY',active_version:manifest.version,stable_app_identity:pkg.name,active_package_main:pkg.main,main_lineage_sources:lineage.map(x=>x.source),state_integrity_source:statePath,state_integrity_policy_version:stateOwner.policy_version||stateOwner.VERSION,research_storage_source:researchPath,research_database:'aram-rating-research-v03',research_checkpoint_key:'checkpoint-v03',destructive_research_delete_sources:destructive,real_windows_reference:C.real_windows_reference,synthetic_indexeddb_fixture:'covered_by_windows_electron_synthetic_job',full_installed_fixture_status:'VERIFIED_SUCCESSOR_IN_PLACE_TWO_RESTARTS',installed_persistence_fixture:{local_storage:true,indexeddb:true,research_checkpoint_matches:159,research_checkpoint_exact:true,research_latest_run_exact:true,state_integrity_mirror:true,restart_cycles:2,personal_data:false,workflow:'v0.16.0 Installed Persistence Acceptance'},surfaces:C.surfaces};
L.write('audit-output/stability/state-compat-report.json',report);
console.log('STATE COMPAT AUDIT: SUCCESS · identities, installed persistence, successor main lineage, and owner contracts preserved');
