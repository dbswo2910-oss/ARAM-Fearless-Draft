'use strict';
const path=require('path');
const L=require('./lib');
const main=require('../../src/main/bootstrap');
const preload=require('../../src/preload/ipc-contract');
const state=require('../../src/state');
const lifecycle=require('../../src/core/lifecycle');
const updater=require('../../src/updater');
const autosync=require('../../src/autosync');
const riot=require('../../src/riot');
const draft=require('../../src/draft');
const randomPick=require('../../src/random/pick');
const randomIngame=require('../../src/random/ingame');
const data=require('../../src/data');
const items=require('../../src/items');
const profile=require('../../src/profile');
const research=require('../../src/research');
const registry=require('../../src/core/owner-registry');

const inactiveModules={main,preload,state,lifecycle,updater,autosync,riot,random_ingame:randomIngame,items,profile,research};
for(const [name,mod] of Object.entries(inactiveModules)){
  L.must(mod.production_active===false,`${name} canonical implementation must remain shadow/inactive`);
  if(Object.prototype.hasOwnProperty.call(mod,'score_logic_changed'))L.must(mod.score_logic_changed===false,`${name} canonical implementation must remain scoring-neutral`);
  if(Object.prototype.hasOwnProperty.call(mod,'random_scoring_changed'))L.must(mod.random_scoring_changed===false,`${name} canonical implementation must remain random-scoring-neutral`);
}
const activeAdapters={draft,random_pick:randomPick,data};
for(const [name,mod] of Object.entries(activeAdapters)){
  L.must(mod.production_active===true,`${name} production adapter unexpectedly inactive`);
  L.must(mod.owner_status==='production',`${name} owner status drift`);
  L.must(mod.implementation_mode==='production-adapter',`${name} must remain an explicit production adapter`);
  L.must(mod.legacy_removal_authorized===false,`${name} legacy removal must remain unauthorized`);
  L.must(mod.score_logic_changed===false,`${name} adapter must remain scoring-neutral`);
  L.must(mod.random_scoring_changed===false,`${name} adapter must remain random-scoring-neutral`);
}

L.must(main.APP_ID==='aram-fearless-draft','canonical main app identity drift');
const probe=main.deriveUserDataPath(path.join('C:','Users','fixture','AppData','Roaming')).replace(/\\/g,'/');
L.must(probe.endsWith('/aram-fearless-draft'),'canonical userData path derivation drift');
const legacyMain=L.read('update/v0.15.135/main-v015135.js');
L.must(legacyMain.includes('aram-fearless-draft'),'legacy main stable app identity not found');
L.must(/setPath\(['\"]userData['\"]/.test(legacyMain),'legacy main userData pin not found');

const legacyPreload=L.read('update/v0.15.117/preload.js');
for(const m of preload.bridgeMethods)L.must(m==='isElectron'||legacyPreload.includes(m+':')||legacyPreload.includes(m+' :'),`legacy preload missing bridge method ${m}`);
const inv=[...legacyPreload.matchAll(/ipcRenderer\.invoke\(['\"]([^'\"]+)['\"]/g)].map(x=>x[1]).sort();
const snd=[...legacyPreload.matchAll(/ipcRenderer\.send\(['\"]([^'\"]+)['\"]/g)].map(x=>x[1]).sort();
L.must(JSON.stringify(inv)===JSON.stringify([...preload.invokeChannels].sort()),'preload invoke channel contract differs from Golden legacy');
L.must(JSON.stringify(snd)===JSON.stringify([...preload.sendChannels].sort()),'preload send channel contract differs from Golden legacy');

for(const fn of ['readNamespace','writeNamespace','guardExternalJson','writeTextAtomic'])L.must(typeof state[fn]==='function',`canonical state missing ${fn}`);
L.must(state.FORMAT_VERSION==='0.15.117','canonical state on-disk format drift');

L.must(typeof lifecycle.createResourceLifecycle==='function'&&typeof lifecycle.attachBeforeUnload==='function','canonical lifecycle API incomplete');

for(const fn of ['prepareTransaction','markApplied','abortTransaction','restoreSnapshot','readPending'])L.must(typeof updater[fn]==='function',`canonical updater missing ${fn}`);
L.must(updater.FORMAT_ROOT==='update-safety-v01579','canonical updater storage root drift');
L.must(updater.bootGuard&&typeof updater.bootGuard.assessPriorBoot==='function'&&typeof updater.bootGuard.createProbationMonitor==='function'&&typeof updater.bootGuard.markCleanExit==='function','canonical updater boot guard API incomplete');
L.must(updater.bootGuard.production_active===false,'canonical updater boot guard must remain inactive');

for(const fn of ['createCoordinator','backoffMs','credentialSignature','historyTargetKey','mergeHistoryPayload'])L.must(typeof autosync[fn]==='function',`canonical AutoSync missing ${fn}`);
L.must(autosync.CORE_INTERVAL_MS===1200&&autosync.HISTORY_CACHE_MAX_KEYS===12&&autosync.HISTORY_CACHE_MAX_ROWS===40,'canonical AutoSync constants drift');

for(const fn of ['normGrade','canonGameId','extractPrimaryRows','trustedRecord','migrateLegacyRecords','validStore'])L.must(typeof riot.grade?.[fn]==='function',`canonical Riot grade missing ${fn}`);
L.must(riot.grade.PRIMARY_PROVENANCE==='riot-primary-update','canonical Riot primary provenance drift');

L.must(typeof draft.risk?.createRiskEngine==='function','canonical Draft risk engine missing');
L.must(Array.isArray(draft.risk.CATEGORIES)&&draft.risk.CATEGORIES.length===8,'canonical Draft risk categories drift');

L.must(typeof randomPick.dna?.createDnaEngine==='function'&&typeof randomPick.selection?.createSelectionState==='function'&&typeof randomPick.top5?.enumerateTop5==='function','canonical RANDOM PICK partial shadow API incomplete');
L.must(randomPick.contract?.components?.candidate_dna==='shadow'&&randomPick.contract?.components?.selection_state==='shadow'&&randomPick.contract?.components?.top5_enumeration==='shadow'&&randomPick.contract?.components?.team_score==='planned','RANDOM PICK component migration contract drift');

L.must(typeof randomIngame.semantic?.semanticSignature==='function'&&typeof randomIngame.semantic?.localLivePlayer==='function'&&typeof randomIngame.volatileHud?.volatileHudModel==='function'&&typeof randomIngame.coordinator?.createCoordinator==='function'&&typeof randomIngame.shopPipeline?.createShopPipeline==='function'&&typeof randomIngame.coachRender?.nextUiState==='function'&&typeof randomIngame.scheduler?.createScheduler==='function','canonical RANDOM IN GAME shadow API incomplete');
L.must(randomIngame.contract?.status==='shadow'&&randomIngame.contract?.components?.semantic_signature==='shadow'&&randomIngame.contract?.components?.volatile_hud==='shadow'&&randomIngame.contract?.components?.tick_coordinator==='shadow'&&randomIngame.contract?.components?.shop_pipeline==='shadow'&&randomIngame.contract?.components?.runtime_scheduler==='shadow'&&randomIngame.contract?.components?.coach_render==='shadow','RANDOM IN GAME migration contract drift');

L.must(typeof data.patchModeShell?.applyPatchShellSemanticSweep==='function'&&typeof data.workspace?.nearestCommonWithin==='function','canonical DATA partial shadow API incomplete');
L.must(data.patchModeShell?.UI_ROLE==='data-detail-generic-shell-header'&&data.contract?.components?.patch_mode_shell==='shadow'&&data.contract?.components?.workspace_topology==='shadow'&&data.contract?.components?.mode_owner==='planned','DATA partial migration contract drift');

L.must(typeof items.identity?.itemIdentityRank==='function'&&typeof items.identity?.buildCanonicalNameIndex==='function'&&typeof items.recommendation?.createRecommendationEngine==='function'&&typeof items.artResolver?.createArtResolver==='function'&&typeof items.artRuntime?.createArtRuntime==='function'&&typeof items.catalogContract?.validateCatalog==='function'&&typeof items.catalogService?.createCatalogService==='function','canonical Item shadow API incomplete');
L.must(items.contract?.status==='shadow'&&items.contract?.components?.catalog_identity==='shadow'&&items.contract?.components?.recommendation_gate==='shadow'&&items.contract?.components?.art_resolver==='shadow'&&items.contract?.components?.art_dom_runtime==='shadow'&&items.contract?.components?.catalog_ipc_contract==='shadow'&&items.contract?.components?.catalog_ipc_owner==='shadow','Item migration contract drift');
L.must(items.identity.score_logic_changed===false&&items.recommendation.score_logic_changed===false&&items.recommendation.item_recommendation_logic_changed===false&&items.artResolver.score_logic_changed===false&&items.artRuntime.score_logic_changed===false&&items.catalogContract.score_logic_changed===false&&items.catalogService.score_logic_changed===false,'Item shadow migration must not change scoring or recommendations');

L.must(typeof profile.results?.createResultsNormalizer==='function'&&typeof profile.history?.createHistoryService==='function'&&typeof profile.metrics?.buildProfile==='function'&&typeof profile.riotGradeLink?.findAuthoritativeRecord==='function','canonical Profile shadow API incomplete');
L.must(profile.contract?.status==='shadow'&&profile.contract?.components?.results_normalizer==='shadow'&&profile.contract?.components?.history_fetch==='shadow'&&profile.contract?.components?.profile_metrics==='shadow'&&profile.contract?.components?.results_render==='planned'&&profile.contract?.components?.profile_render==='planned'&&profile.contract?.components?.riot_grade_link==='shadow','Profile migration contract drift');
L.must(profile.results.score_logic_changed===false&&profile.metrics.score_logic_changed===false&&profile.riotGradeLink.score_logic_changed===false,'Profile shadows must remain scoring-neutral');

L.must(typeof research.storage?.loadExisting==='function'&&typeof research.storage?.selectRun==='function'&&typeof research.sampling?.buildCandidatePool==='function'&&typeof research.sampling?.scoreFeature==='function','canonical Research partial shadow API incomplete');
L.must(research.storage.DB_NAME==='aram-rating-research-v03'&&research.storage.CHECKPOINT_KEY==='checkpoint-v03','Research storage identity drift');
L.must(research.contract?.status==='shadow'&&research.contract?.components?.storage_read==='shadow'&&research.contract?.components?.rating_engine==='planned'&&research.contract?.components?.research_ui==='planned'&&research.contract?.components?.active_sampling==='shadow-v0.3.1','Research migration contract drift');
L.must(research.storage.read_only_boot===true&&research.storage.destructive_migration===false&&research.storage.network_collection_default===false&&research.sampling.production_active===false&&research.sampling.automatic_collection===false&&research.sampling.b2_manual_only===true,'Research safety contract drift');

const required=['main','preload','state','lifecycle','updater','autosync','riot','draft','random_pick','random_ingame','data','items','profile','research','diagnostics'];
L.must(registry.production_active===true,'owner registry must remain production-active after v0.16 cutover');
L.must(registry.legacy_removal_authorized===false,'legacy removal must remain globally unauthorized');
L.must(registry.assertSingleOwner()===true,'canonical owner registry duplicate path');
for(const name of required){
  const owner=registry.owners[name];
  L.must(owner,`missing canonical owner ${name}`);
  L.must(owner.status==='production',`${name} registry owner must remain production`);
  L.must(String(owner.mode||'').includes('production-adapter'),`${name} registry owner must remain an adapter`);
  L.must(typeof owner.legacy==='string'&&owner.legacy.length>0,`${name} registry owner lost legacy delegate`);
}

const report={
  status:'SUCCESS',
  architecture:'v0.16-production-adapter-with-shadow-implementations',
  registry_production_active:registry.production_active,
  legacy_removal_authorized:registry.legacy_removal_authorized,
  active_module_adapters:['draft','random_pick','data'],
  inactive_canonical_implementations:Object.keys(inactiveModules),
  main:{app_id:main.APP_ID,user_data_probe:probe},
  preload:{bridge_methods:preload.bridgeMethods.length,invoke_channels:preload.invokeChannels,send_channels:preload.sendChannels},
  state:{mode:'canonical-shadow',implementation_version:state.IMPLEMENTATION_VERSION,format_version:state.FORMAT_VERSION},
  lifecycle:{mode:'canonical-shadow',implementation_version:lifecycle.IMPLEMENTATION_VERSION},
  updater:{mode:'canonical-shadow',implementation_version:updater.IMPLEMENTATION_VERSION,format_root:updater.FORMAT_ROOT},
  autosync:{mode:'canonical-shadow',implementation_version:autosync.IMPLEMENTATION_VERSION,core_interval_ms:autosync.CORE_INTERVAL_MS,history_cache_max_keys:autosync.HISTORY_CACHE_MAX_KEYS},
  riot:{mode:'canonical-shadow',implementation_version:riot.grade.IMPLEMENTATION_VERSION,primary_provenance:riot.grade.PRIMARY_PROVENANCE},
  adapters:{draft:draft.implementation_mode,random_pick:randomPick.implementation_mode,data:data.implementation_mode},
  cutover_allowed:true,
  next_gate:'Preserve v0.16 production adapters while remaining canonical implementations continue shadow validation; legacy removal remains separately gated.'
};
L.write('audit-output/stability/subsystem-shadow-report.json',report);
console.log('SUBSYSTEM ARCHITECTURE AUDIT: SUCCESS · production adapters and shadow implementations match the v0.16 cutover contract');
