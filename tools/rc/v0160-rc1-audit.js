'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function must(v,msg){if(!v)throw new Error(msg)}
function syntax(rel){const src=read(rel);new Function(src);return src}

const main=syntax('rc/v0160-rc1/main.js');
const renderer=syntax('rc/v0160-rc1/renderer-entry.js');
const materializer=syntax('tools/rc/materialize-v0160-rc1.js');
const builder=syntax('tools/rc/build-canonical-browser-bundle.js');
const registry=require(path.join(ROOT,'src/core/owner-registry.js'));
const bundleOut=path.join(ROOT,'audit-output/rc/v0160-rc1/audit-bundle.js');
cp.execFileSync(process.execPath,[path.join(ROOT,'tools/rc/build-canonical-browser-bundle.js'),bundleOut],{cwd:ROOT,stdio:'inherit'});
const bundle=fs.readFileSync(bundleOut,'utf8');new Function(bundle);

must(main.includes("RC_APPDATA_DIR='ARAM Fearless Draft RC1 Sandbox'"),'RC1 sandbox identity missing');
must(main.includes("require('./main-v015135.js')"),'RC1 Golden shell base missing');
must(main.includes("app.setPath('appData',rcAppData)"),'RC1 appData sandbox pin missing');
must(main.includes("--aram-rc1-reset-sandbox"),'RC1 sandbox reset control missing');
must(main.includes("--aram-rc1-probe"),'RC1 renderer probe missing');
must(main.includes('production_untouched'),'RC1 production userData guard report missing');
must(renderer.includes('__ARAM_V0160_CANONICAL__'),'RC1 canonical browser API missing');
must(renderer.includes('createDataOwner'),'RC1 DATA canonical activation missing');
must(renderer.includes('createDiagnosticsOwner'),'RC1 diagnostics canonical activation missing');
must(renderer.includes('createResearchOwner'),'RC1 Research canonical activation missing');
must(renderer.includes('bindStableRoles'),'RC1 RANDOM semantic-role activation missing');
for(const forbidden of ['fetch(','XMLHttpRequest','https://','http://','b2_upload','automatic_collection=true'])must(!renderer.toLowerCase().includes(forbidden.toLowerCase()),`RC1 renderer unexpectedly contains network/collection token: ${forbidden}`);
must(materializer.includes("pkg.main=mainName"),'RC1 materializer does not activate RC main wrapper');
must(materializer.includes('V0160_RC1_CANONICAL_START'),'RC1 materializer injection marker missing');
must(materializer.includes("package_version_preserved:pkg.version"),'RC1 materializer must preserve Golden package version contract');
must(builder.includes('external_dependencies:0'),'RC1 browser bundle external-dependency guard missing');
must(Object.values(registry.owners).every(x=>x.status==='shadow'),'canonical registry must remain shadow on RC branch');
must(registry.production_active===false,'canonical registry must remain production inactive on RC branch');

const report={status:'SUCCESS',rc:'0.16.0-rc.1',mode:'isolated-canary',golden_shell:'0.15.135',production_main_untouched:true,production_userdata_untouched_by_design:true,canonical_registry_production_active:false,browser_bundle_bytes:Buffer.byteLength(bundle),canonical_activations:['data','diagnostics','research','random-semantic-roles'],real_league_client_tested:false,physical_user_pc_tested:false};
const out=path.join(ROOT,'audit-output/rc/v0160-rc1/static-audit.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log('V0.16 RC1 STATIC AUDIT: SUCCESS',JSON.stringify(report));
