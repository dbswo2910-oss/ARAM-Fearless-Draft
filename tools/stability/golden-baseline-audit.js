'use strict';
const L=require('./lib');
const GOLDEN='2048d56ceec2317b4cef225f284443521005994d';
const manifest=L.json('update/manifest.json');
const state=L.json('update/current-state.json');
const pkg=L.json('update/v0.15.135/package.json');
L.must(manifest.version==='0.15.135',`golden manifest drifted: ${manifest.version}`);
L.must(state.active?.version==='0.15.135',`current-state drifted: ${state.active?.version}`);
L.must(pkg.name==='aram-fearless-draft','stable Electron app identity changed');
L.must(pkg.version==='0.15.135'&&pkg.main==='main-v015135.js','golden package contract changed');
L.must(L.exists('update/v0.15.135/main-v015135.js'),'golden main missing');
L.must(L.exists('update/v0.15.135/runtime-source-stability-v015135.js'),'golden runtime source missing');
const runtime=require(L.p('update/v0.15.135/runtime-source-stability-v015135.js'));
L.must(runtime.score_logic_changed===false,'golden runtime unexpectedly marks scoring changed');
L.must(runtime.random_scoring_changed===false,'golden runtime unexpectedly marks RANDOM scoring changed');
const ancestor=L.git(['merge-base','--is-ancestor',GOLDEN,'HEAD']);
const head=L.git(['rev-parse','HEAD']);
const goldenManifest=L.git(['show',`${GOLDEN}:update/manifest.json`]);
L.must(goldenManifest.includes('"version": "0.15.135"'),'golden commit does not contain v0.15.135 manifest');
const report={
  status:'SUCCESS',
  golden_version:'0.15.135',
  golden_commit:GOLDEN,
  current_head:head||null,
  golden_is_ancestor_of_head:ancestor==='',
  stable_app_identity:pkg.name,
  manifest_sha256:L.shaFile('update/manifest.json'),
  package_sha256:L.shaFile('update/v0.15.135/package.json'),
  main_sha256:L.shaFile('update/v0.15.135/main-v015135.js'),
  runtime_sha256:L.shaFile('update/v0.15.135/runtime-source-stability-v015135.js'),
  owners:state.owners,
  safety:state.safety,
  scoring_changed:false,
  random_scoring_changed:false,
  real_windows_reference:{
    storage_cold_start:'verified_v0.15.132_and_preserved_into_golden',
    research_checkpoint_observation:'159 accepted matches observed by user; metadata only, personal DB not committed',
    patch_notes_shell_header:'verified on real Windows v0.15.135'
  }
};
L.write('audit-output/stability/golden-baseline-report.json',report);
console.log('GOLDEN BASELINE AUDIT: SUCCESS',report.golden_version,report.golden_commit);
