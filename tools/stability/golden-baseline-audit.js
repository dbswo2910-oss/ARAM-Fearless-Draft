'use strict';
const L=require('./lib');
const GOLDEN='2048d56ceec2317b4cef225f284443521005994d';
const GOLDEN_VERSION='0.15.135';
const manifest=L.json('update/manifest.json');
const state=L.json('update/current-state.json');
const goldenPkg=L.json(`update/v${GOLDEN_VERSION}/package.json`);
const activeVersion=String(manifest.version||'');
const activePkgPath=String(state.package?.source||`update/v${activeVersion}/package.json`);
const activePkg=L.json(activePkgPath);
L.must(activeVersion===String(state.active?.version||''),`active manifest/current-state drift: manifest=${activeVersion} state=${state.active?.version}`);
L.must(String(state.package?.version||'')===activeVersion,`active package handoff drift: package=${state.package?.version} manifest=${activeVersion}`);
L.must(activePkg.name==='aram-fearless-draft','stable Electron app identity changed');
L.must(String(activePkg.version)===activeVersion,`active package contract changed: ${activePkg.version} != ${activeVersion}`);
L.must(String(activePkg.main||'')===String(state.package?.main||''),`active package main drift: package=${activePkg.main} state=${state.package?.main}`);
const activeMain=String(state.package?.main_source||`update/v${activeVersion}/${activePkg.main}`);
L.must(L.exists(activeMain),`active main missing: ${activeMain}`);
L.must(goldenPkg.name==='aram-fearless-draft','historical Golden Electron app identity changed');
L.must(goldenPkg.version===GOLDEN_VERSION&&goldenPkg.main==='main-v015135.js','historical Golden package contract changed');
L.must(L.exists(`update/v${GOLDEN_VERSION}/main-v015135.js`),'historical Golden main missing');
L.must(L.exists(`update/v${GOLDEN_VERSION}/runtime-source-stability-v015135.js`),'historical Golden runtime source missing');
const runtime=require(L.p(`update/v${GOLDEN_VERSION}/runtime-source-stability-v015135.js`));
L.must(runtime.score_logic_changed===false,'historical Golden runtime unexpectedly marks scoring changed');
L.must(runtime.random_scoring_changed===false,'historical Golden runtime unexpectedly marks RANDOM scoring changed');
const ancestor=L.git(['merge-base','--is-ancestor',GOLDEN,'HEAD']);
const head=L.git(['rev-parse','HEAD']);
const goldenManifest=L.git(['show',`${GOLDEN}:update/manifest.json`]);
L.must(goldenManifest.includes(`"version": "${GOLDEN_VERSION}"`),'historical Golden commit does not contain v0.15.135 manifest');
const report={
  status:'SUCCESS',
  golden_version:GOLDEN_VERSION,
  golden_commit:GOLDEN,
  active_version:activeVersion,
  active_package:activePkgPath,
  active_main:activeMain,
  current_head:head||null,
  golden_is_ancestor_of_head:ancestor==='',
  stable_app_identity:activePkg.name,
  manifest_sha256:L.shaFile('update/manifest.json'),
  active_package_sha256:L.shaFile(activePkgPath),
  active_main_sha256:L.shaFile(activeMain),
  golden_package_sha256:L.shaFile(`update/v${GOLDEN_VERSION}/package.json`),
  golden_main_sha256:L.shaFile(`update/v${GOLDEN_VERSION}/main-v015135.js`),
  golden_runtime_sha256:L.shaFile(`update/v${GOLDEN_VERSION}/runtime-source-stability-v015135.js`),
  owners:state.owners,
  safety:state.safety,
  scoring_changed:false,
  random_scoring_changed:false,
  real_windows_reference:{
    storage_cold_start:'verified_v0.15.132_and_preserved_through_current_active_lineage',
    research_checkpoint_observation:'159 accepted matches observed by user at historical Golden validation; metadata only, personal DB not committed',
    patch_notes_shell_header:'verified on real Windows v0.15.135 historical Golden'
  }
};
L.write('audit-output/stability/golden-baseline-report.json',report);
console.log('GOLDEN BASELINE AUDIT: SUCCESS',GOLDEN_VERSION,'active='+activeVersion,GOLDEN);
