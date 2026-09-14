'use strict';
const path=require('path');
const L=require('./lib');
const manifest=L.json('update/manifest.json');
const state=L.json('update/current-state.json');
const all=L.walk();
const activeManifestSources=L.uniq((manifest.files||[]).map(x=>x.source).filter(Boolean));
const activeSeeds=L.uniq([
  ...activeManifestSources,
  state.package?.source,
  state.package?.main_source,
  state.owners?.data_view?.active_source,
  state.owners?.state_integrity?.active_source,
  state.owners?.resource_lifecycle?.active_source,
  state.owners?.autosync_main?.active_source,
  state.owners?.autosync_renderer?.active_source,
  state.safety?.update_transaction_source,
  state.safety?.updater_guard_source,
  state.safety?.runtime_loader_source
].filter(Boolean));
const closure=L.dependencyClosure(activeSeeds);
const activeSet=new Set(activeManifestSources),depSet=new Set(closure.files);
const textRefs=new Map();
for(const f of all){
  if(!/\.(?:js|cjs|mjs|json|ya?ml|md)$/.test(f)||!L.exists(f))continue;
  let src='';try{src=L.read(f)}catch{continue}
  for(const target of all){
    if(target===f)continue;
    const base=path.posix.basename(target);
    if(base.length>=10&&src.includes(base)){
      if(!textRefs.has(target))textRefs.set(target,[]);
      if(textRefs.get(target).length<20)textRefs.get(target).push(f);
    }
  }
}
function isHistoricalVersionPath(f){
  const m=f.match(/^update\/v0\.15\.(\d+)\//);return m?Number(m[1])<135:false;
}
function flagsFor(f){
  const base=path.posix.basename(f).toLowerCase();
  const refs=textRefs.get(f)||[];
  const active_distribution=activeSet.has(f);
  const active_dependency=depSet.has(f)&&!active_distribution;
  const fallback_safety=/(safety|fallback|recovery|watchdog|snapshot|blackbox|heartbeat|lkg|quarantine|cold-start)/.test(base)&&depSet.has(f);
  const migration=/(migration|migrate|schema-upgrade|compat)/.test(base);
  const historical=isHistoricalVersionPath(f)&&!depSet.has(f);
  const workflow=/^\.github\/workflows\/.+\.ya?ml$/.test(f);
  let workflow_auto=false,workflow_dispatch=false,historical_workflow=false;
  if(workflow){const s=L.read(f);workflow_auto=/\n\s*(push|pull_request|schedule)\s*:/.test('\n'+s);workflow_dispatch=/workflow_dispatch\s*:/.test(s)||/workflow_dispatch\s*\n/.test(s);const vm=base.match(/v0?15(\d{2,3})/);historical_workflow=!!vm&&Number(vm[1])<135;}
  const candidateScope=/^(update|tools|backend|launcher)\//.test(f)&&/\.(?:js|json)$/.test(f);
  const unreferenced_candidate=candidateScope&&!active_distribution&&!active_dependency&&!migration&&!refs.length;
  return{active_distribution,active_dependency,fallback_safety,migration,historical,workflow,workflow_auto,workflow_dispatch,historical_workflow,unreferenced_candidate,refs};
}
const records=all.map(path=>({path,...flagsFor(path)}));
const counts={total_files:records.length};
for(const k of ['active_distribution','active_dependency','fallback_safety','migration','historical','workflow','workflow_auto','historical_workflow','unreferenced_candidate'])counts[k]=records.filter(x=>x[k]).length;
const ownerMap={
  random_pick:state.owners?.random_pick,
  data_view:state.owners?.data_view,
  state_integrity:state.owners?.state_integrity,
  resource_lifecycle:state.owners?.resource_lifecycle,
  autosync_main:state.owners?.autosync_main,
  autosync_renderer:state.owners?.autosync_renderer,
  updater_safety:state.safety
};
const graph={version:manifest.version,seeds:activeSeeds,nodes:closure.files,edges:closure.edges.map(([from,to])=>({from,to}))};
const dot=['digraph runtime {','  rankdir=LR;','  node [shape=box,fontname="Consolas",fontsize=9];',...graph.edges.map(e=>`  "${e.from.replaceAll('"','')}" -> "${e.to.replaceAll('"','')}";`),'}'].join('\n');
const dangerous=records.filter(x=>x.workflow&&x.historical_workflow&&x.workflow_auto).map(x=>x.path);
const report={schema:1,generated_at:new Date().toISOString(),active_version:manifest.version,classification_note:'unreferenced_candidate is not deletion authority; dynamic references require manual/contract confirmation',counts,owner_map:ownerMap,active_seeds:activeSeeds,runtime_dependency_graph:graph,historical_automatic_workflows:dangerous,files:records};
L.write('audit-output/stability/repository-inventory.json',report);
L.write('audit-output/stability/runtime-dependency.dot',dot+'\n');
const md=[
  '# Repository Inventory — generated',
  '',`Active version: **${manifest.version}**`,'',
  '## Counts','',
  ...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),
  '',`## Active owner map`,'',
  ...Object.entries(ownerMap).map(([k,v])=>`- **${k}**: \`${v?.owner||v?.permanent_root||'n/a'}\` → \`${v?.active_source||v?.runtime_loader_source||''}\``),
  '',`## Historical workflows still automatic (${dangerous.length})`,'',
  ...(dangerous.length?dangerous.map(x=>`- \`${x}\``):['- none']),
  '',`## Unreferenced/dead candidates (${counts.unreferenced_candidate})`,'',
  '- These are candidates only. Do not delete until dynamic/runtime usage is disproved by final-runtime/E2E/shadow tests.',
  '',...records.filter(x=>x.unreferenced_candidate).slice(0,200).map(x=>`- \`${x.path}\``),
  records.filter(x=>x.unreferenced_candidate).length>200?'\n- … truncated in Markdown; JSON report contains all candidates.':'',
  ''
].join('\n');
L.write('audit-output/stability/repository-inventory.md',md);
console.log('STABILITY INVENTORY: SUCCESS',counts,'historical automatic workflows',dangerous.length);
