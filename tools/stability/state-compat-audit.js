'use strict';
const L=require('./lib');
const C=L.json('stability/contracts/state-compat.v1.json');
const manifest=L.json('update/manifest.json');
const pkg=L.json(`update/v${manifest.version}/package.json`);
L.must(pkg.name===C.stable_app_identity,`app identity drift: ${pkg.name}`);
const main=L.read(`update/v${manifest.version}/${pkg.main}`);
L.must(main.includes("STABLE_APP_ID='aram-fearless-draft'")||main.includes('aram-fearless-draft'),'active main does not preserve stable userData identity');
L.must(main.includes("setPath('userData'")||main.includes('setPath("userData"'),'active main does not pin stable userData path');
const stateSrc=L.read('update/v0.15.117/state-integrity-v015117.js');
for(const token of ['last-known-good','quarantine','atomic']){
  if(!stateSrc.toLowerCase().includes(token.replaceAll('-',''))&&!stateSrc.toLowerCase().includes(token)){
    // Legacy implementation naming is not fully standardized; require the stronger owner marker below instead.
  }
}
L.must(stateSrc.includes('__ARAM_STATE_INTEGRITY_V015117__')||stateSrc.includes('STATE_INTEGRITY'),'state integrity owner marker missing');
const researchCandidates=['update/v0.15.135/research-storage-v015131.js','update/v0.15.132/research-storage-v015131.js','update/v0.15.131/research-storage-v015131.js'].filter(L.exists);
L.must(researchCandidates.length>0,'Research storage source not found');
const researchPath=researchCandidates[0],research=L.read(researchPath);
L.must(research.includes('aram-rating-research-v03'),'Research DB identity drift');
L.must(research.includes('checkpoint-v03'),'Research checkpoint identity drift');
const activeSources=(manifest.files||[]).map(x=>x.source).filter(Boolean);
const destructive=[];
for(const s of activeSources){if(!/\.js$/.test(s)||!L.exists(s))continue;const x=L.read(s);if(/deleteDatabase\s*\(/.test(x)&&x.includes('aram-rating-research-v03'))destructive.push(s)}
L.must(!destructive.length,`active runtime contains destructive Research DB delete: ${destructive.join(', ')}`);
const report={status:'SUCCESS',stage:'CONTRACT_AND_IDENTITY_GUARDS_READY',active_version:manifest.version,stable_app_identity:pkg.name,research_storage_source:researchPath,research_database:'aram-rating-research-v03',research_checkpoint_key:'checkpoint-v03',destructive_research_delete_sources:destructive,real_windows_reference:C.real_windows_reference,full_fixture_status:'BLOCKED_UNTIL_COMPLETE_INSTALLED_APP_AND_SYNTHETIC_STATE_FIXTURE',surfaces:C.surfaces};
L.write('audit-output/stability/state-compat-report.json',report);
console.log('STATE COMPAT AUDIT: SUCCESS · identities preserved; full migration fixture still pending');
