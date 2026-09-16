'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const readJson=p=>JSON.parse(read(p));
const safeGit=args=>{try{return cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{return''}};
const sha256Text=text=>crypto.createHash('sha256').update(String(text)).digest('hex');
const RETIRED_UI=[
  'ui-layout-restore-v015103.js',
  'random-data-ui-hotfix-v015105.js',
  'random-data-ui-hotfix-v015106.js',
  'view-boundary-repair-v015107.js',
  'data-random-hardfix-v015108.js',
  'ui-screenshot-polish-v015109.js',
  'patch-notes-density-v015110.js',
  'random-dna-rail-v015111.js',
  'random-workspace-stability-v015112.js',
  'random-workspace-readable-v015113.js',
  'random-pick-integrity-v015114.js'
];
function matchExport(src,key,fallback='unknown'){
  const re=new RegExp(`${key}\\s*:\\s*['\"]([^'\"]+)['\"]`);
  return src.match(re)?.[1]||fallback;
}
function buildSnapshot(){
  const manifestText=read('update/manifest.json');
  const manifest=JSON.parse(manifestText);
  const manual=readJson('docs/continuity-manual.json');
  const files=Array.isArray(manifest.files)?manifest.files:[];
  const byPath=new Map(files.map(x=>[x.path,x.source]));
  const pkgSource=byPath.get('package.json');
  if(!pkgSource)throw new Error('active manifest missing package.json');
  const pkg=readJson(pkgSource);
  const compact=String(manifest.version||'').replace(/\./g,'');
  const runtimePath=`runtime-source-stability-v${compact}.js`;
  const runtimeSource=byPath.get(runtimePath)||[...files].reverse().find(x=>/^runtime-source-stability-v\d+\.js$/.test(x.path))?.source||'';
  const runtimeText=runtimeSource&&fs.existsSync(path.join(ROOT,runtimeSource))?read(runtimeSource):'';
  const deletes=new Set(Array.isArray(manifest.delete)?manifest.delete:[]);
  const manifestFingerprint=sha256Text(manifestText);
  const mainSource=byPath.get(pkg.main)||'';
  const owners={
    random_pick:{owner:matchExport(runtimeText,'random_pick_owner','runtime-v015100'),contract:'v0.15.115 single-owner baseline',active_runtime_source:runtimeSource},
    data_view:{owner:matchExport(runtimeText,'data_view_owner','ui-stability-v015115'),active_source:byPath.get('ui-stability-baseline-v015115.js')||''},
    state_integrity:{owner:matchExport(runtimeText,'state_integrity_owner','state-integrity-v015117'),active_source:byPath.get('state-integrity-v015117.js')||''},
    resource_lifecycle:{owner:matchExport(runtimeText,'resource_lifecycle_owner','resource-lifecycle-v015118'),active_source:byPath.get('resource-lifecycle-v015118.js')||''},
    autosync_main:{owner:matchExport(runtimeText,'autosync_main_owner','autosync-concurrency-v015119'),active_source:byPath.get('autosync-concurrency-v015119.js')||''},
    autosync_renderer:{owner:matchExport(runtimeText,'autosync_renderer_owner','runtime-live-autosync-v01571+v015119'),active_source:byPath.get('runtime-live-autosync-v01571.js')||''}
  };
  return {
    schema:1,
    repository:'dbswo2910-oss/ARAM-Fearless-Draft',
    authority:'update/manifest.json is authoritative for active distribution; this file is a generated handoff snapshot',
    active:{
      version:String(manifest.version||''),
      message:String(manifest.message||''),
      min_launcher:String(manifest.min_launcher||''),
      manifest_fingerprint:manifestFingerprint,
      manifest_commit:manifestFingerprint
    },
    package:{source:pkgSource,version:String(pkg.version||''),main:String(pkg.main||''),main_source:mainSource},
    owners,
    safety:{
      permanent_root:'v0.15.79',
      update_transaction_source:byPath.get('update-safety-v01579.js')||'',
      updater_guard_source:byPath.get('updater-safety-patch-v01579.js')||'',
      runtime_loader_source:byPath.get('runtime-loader-v01579.js')||''
    },
    retired_ui_overlays:RETIRED_UI.map(p=>({path:p,active:byPath.has(p),scheduled_delete:deletes.has(p)})),
    real_world_validation:manual.real_world_validation||{},
    next_planned_work:manual.next_planned_work||{},
    working_style:manual.working_style||{},
    release_contract:{
      scoring_changed_by_continuity_system:false,
      random_scoring_changed_by_continuity_system:false,
      visual_success_requires_real_windows_evidence:true,
      future_activation_workflows_from_v015120_must_run:'node tools/sync-current-state.js after manifest mutation and before release metadata commit'
    },
    cold_start_order:[
      'AGENTS.md',
      'docs/CURRENT_STATE.md',
      'update/current-state.json',
      'update/manifest.json',
      'docs/KNOWN_ISSUES.md',
      'docs/AI_HANDOFF.md',
      'latest main commit + latest merged PR + relevant GitHub Actions results'
    ]
  };
}
function renderMarkdown(s){
  const validation=Object.entries(s.real_world_validation||{}).map(([k,v])=>`- **${k}** — \`${v.status||'unknown'}\`: ${v.evidence||''}`).join('\n')||'- none';
  const retired=s.retired_ui_overlays.map(x=>`- \`${x.path}\` — active=${x.active}, delete=${x.scheduled_delete}`).join('\n');
  return `# CURRENT STATE — ARAM Fearless Draft\n\n> **Cold-start handoff file.** Read this after \`AGENTS.md\` before changing code. It is generated from \`update/manifest.json\` + \`docs/continuity-manual.json\` by \`tools/sync-current-state.js\`. Do not hand-edit generated facts.\n\n## Active distribution\n\n- Active updater: **v${s.active.version}**\n- Manifest message: ${s.active.message}\n- Manifest fingerprint: \`${s.active.manifest_fingerprint||s.active.manifest_commit||'unknown'}\`\n- Package: \`${s.package.source}\` → **v${s.package.version}**\n- Electron entry: \`${s.package.main}\` → \`${s.package.main_source}\`\n- Current runtime stability source: \`${s.owners.random_pick.active_runtime_source}\`\n\n## Active ownership — do not create competing owners\n\n- RANDOM PICK DOM/state owner: **${s.owners.random_pick.owner}** (${s.owners.random_pick.contract})\n- DATA view owner: **${s.owners.data_view.owner}** → \`${s.owners.data_view.active_source}\`\n- Persistent-state owner: **${s.owners.state_integrity.owner}** → \`${s.owners.state_integrity.active_source}\`\n- Resource lifecycle owner: **${s.owners.resource_lifecycle.owner}** → \`${s.owners.resource_lifecycle.active_source}\`\n- AutoSync main owner: **${s.owners.autosync_main.owner}** → \`${s.owners.autosync_main.active_source}\`\n- AutoSync renderer owner: **${s.owners.autosync_renderer.owner}** → \`${s.owners.autosync_renderer.active_source}\`\n- Permanent update/runtime safety root: **${s.safety.permanent_root}**\n\n## Non-negotiable continuity rules\n\n1. Repository state wins over conversational memory. Never reconstruct the current architecture from an old chat summary alone.\n2. Do not revive the v0.15.103–v0.15.114 late RANDOM/DATA overlay stack. Extend the active owner or atomically replace it.\n3. CI success proves code/regression contracts, **not** final Electron appearance. If real-Windows evidence is pending, say so.\n4. Do not call a visual issue fixed until the user has supplied/confirmed the relevant real-Windows screenshot/video when the change is visual/runtime-sensitive.\n5. Accuracy over speed: inspect active source, owner lineage, manifest, and relevant historical regression before patching.\n6. Future v0.15.120+ activation workflows must run \`node tools/sync-current-state.js\` after mutating the manifest and before committing the release metadata.\n\n## Real-world validation still open\n\n${validation}\n\n## Next planned work\n\n- Version: **${s.next_planned_work.version||'unspecified'}**\n- Theme: **${s.next_planned_work.theme||'unspecified'}**\n- Status: \`${s.next_planned_work.status||'unknown'}\`\n- Intent: ${s.next_planned_work.intent||''}\n\n## Retired UI overlays — regression guard\n\n${retired}\n\n## New-chat restore sequence\n\nBefore editing anything, read in this order:\n\n${s.cold_start_order.map((x,i)=>`${i+1}. \`${x}\``).join('\n')}\n\nThen state, in a short pre-work checkpoint: active version, active owners, unresolved real-Windows checks, planned next work, and whether the requested change touches scoring/UI/state/AutoSync. If any of those facts conflict, stop and resolve the repository evidence before editing.\n`;
}
function serializeJson(s){return JSON.stringify(s,null,2)+'\n'}
function sync({check=false}={}){
  const snapshot=buildSnapshot();
  const outputs={
    'update/current-state.json':serializeJson(snapshot),
    'docs/CURRENT_STATE.md':renderMarkdown(snapshot)
  };
  const stale=[];
  for(const [p,content] of Object.entries(outputs)){
    const full=path.join(ROOT,p),old=fs.existsSync(full)?fs.readFileSync(full,'utf8'):'';
    if(old!==content){
      stale.push(p);
      if(!check){fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content,'utf8')}
    }
  }
  if(check&&stale.length)throw new Error('continuity snapshot stale: '+stale.join(', '));
  return{snapshot,stale};
}
if(require.main===module){
  try{const check=process.argv.includes('--check');const r=sync({check});console.log(check?'AI CONTINUITY SNAPSHOT: CURRENT':`AI CONTINUITY SNAPSHOT: SYNCED${r.stale.length?' · '+r.stale.join(', '):' · no changes'}`)}catch(e){console.error(e.stack||e);process.exit(1)}
}
module.exports={buildSnapshot,renderMarkdown,serializeJson,sync,RETIRED_UI,sha256Text};
