'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const builder=require(path.join(ROOT,'tools/research/aram-rating-v032-r18-build-installed-shadow-rc-kit.js'));
let pass=0;const ok=(c,m)=>{if(!c)throw new Error('R18 INSTALLED SHADOW RC KIT AUDIT: '+m);pass++};

const kit=builder.build(),out=builder.OUT;
ok(kit.mode==='temporary_copy_overlay_only','kit is temp-copy overlay only');
ok(kit.production_install_mutated===false&&kit.production_manifest_mutated===false,'kit does not mutate production install/manifest');
ok(kit.package_main_override_for_temp_copy==='main-r17-shadow-rc.js','temp-copy main override explicit');
ok(kit.canonical_research_db==='aram-rating-research-v03'&&kit.shadow_evidence_db==='aram-rating-shadow-evidence-v1','canonical and shadow DBs remain separate');
ok(Array.isArray(kit.source_modules)&&kit.source_modules.length===6,'six bounded Research modules bundled');

for(const f of ['r17-shadow-renderer.js','main-r17-shadow-rc.js','rc-kit.json'])ok(fs.existsSync(path.join(out,f)),`${f} generated`);
const renderer=fs.readFileSync(path.join(out,'r17-shadow-renderer.js'),'utf8'),main=fs.readFileSync(path.join(out,'main-r17-shadow-rc.js'),'utf8');
new Function(renderer);new Function(main);
ok(renderer.includes("__req('installed-shadow-rc')"),'renderer boots canonical R17 RC core');
ok(renderer.includes('requestIdleCallback')&&!renderer.includes('setInterval'),'renderer schedules one idle run and no poller');
ok(renderer.includes('[ARAM_R17_SHADOW_RC_RESULT]'),'renderer emits privacy-safe result marker');
ok(!renderer.includes('.innerHTML')&&!renderer.includes('appendChild'),'renderer bundle contains no UI mutation');
ok(main.includes("require('./main-v0160.js')"),'RC main delegates to exact production v0.16 main');
ok(main.includes("webContents.on('did-finish-load',inject)"),'RC main injects only after load');
ok(main.includes('ARAM_R17_SHADOW_RC_REPORT'),'RC main supports machine-readable physical report');
ok(!main.includes('writeFileSync(path.join(__dirname')&&!main.includes('update/manifest.json'),'RC main does not rewrite installed runtime or manifest');

const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
ok(String(manifest.version)==='0.16.0','production manifest stays v0.16.0');
ok(!(manifest.files||[]).some(x=>/r17-shadow|installed-shadow-rc|shadow-evidence-store/.test(String(x.path||'')+' '+String(x.source||''))),'production manifest does not ship RC overlay');
ok(!fs.existsSync(path.join(out,'package.json')),'kit cannot silently replace package.json');

const mainProduction=fs.readFileSync(path.join(ROOT,'update/v0.16.0/main-v0160.js'),'utf8');
ok(mainProduction.includes("const VERSION='0.16.0'"),'production main remains v0.16.0');
ok(!mainProduction.includes('ARAM_R17_SHADOW_RC'),'production main has no R17 injection');

const report={status:'SUCCESS',passes:pass,phase:'R18_INSTALLED_SHADOW_RC_KIT',mode:kit.mode,production_active:false,production_install_mutated:false,production_manifest_mutated:false,physical_acceptance_required:true,kit_files:kit.files.map(x=>({file:x.file,sha256:x.sha256,bytes:x.bytes}))};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-r18-installed-shadow-rc-kit-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(`R18 INSTALLED SHADOW RC KIT AUDIT: SUCCESS · ${pass} checks`);
