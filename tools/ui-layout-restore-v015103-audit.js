'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function ok(v,m){if(!v)throw new Error(m)}
const ui=read('update/v0.15.103/ui-layout-restore-v015103.js');
const main=read('update/v0.15.103/main-v015103.js');
const pkg=JSON.parse(read('update/v0.15.103/package.json'));
const m=JSON.parse(read('update/manifest.json'));
const old=read('update/v0.15.90/runtime-source-stability-v01590.js');
const dh=read('update/v0.15.99/runtime-source-stability-v01599.js');
ok(ui.includes('rp103Center')&&ui.includes('rpPickIntelV01589'),'random three-column/DNA restore missing');
ok(ui.includes('autoCalculate')&&ui.includes('완성 조합 TOP5 계산'),'random TOP5 auto-calc restore missing');
ok(ui.includes('dataHubTopNavV015103')&&ui.includes('dataHubPatchV015103'),'DATA top subnav restore missing');
ok(!ui.includes('MutationObserver')&&!ui.includes('setInterval('),'restore must not add recurring observer/interval owner');
ok(old.includes('rp90CenterStack')&&old.includes('현재 큐 인원 기준 완성 조합 TOP5'),'v0.15.90 reference layout lineage missing');
ok(dh.includes('dataHubNavV01599')&&dh.includes("version:'26.18'"),'v0.15.99 patch-note lineage missing');
ok(main.includes("'ui-layout-restore-v015103.js'")&&main.includes("replaceAll('0.15.102','0.15.103')"),'main runtime adoption missing');
ok(pkg.version==='0.15.103'&&pkg.main==='main-v015103.js','v0.15.103 package mismatch');
ok(m.version==='0.15.103','manifest not activated to v0.15.103');
for(const [p,s] of [['ui-layout-restore-v015103.js','update/v0.15.103/ui-layout-restore-v015103.js'],['main-v015103.js','update/v0.15.103/main-v015103.js'],['package.json','update/v0.15.103/package.json']]){
  ok(m.files.some(x=>x.path===p&&x.source===s),'manifest entry missing: '+p);
}
console.log('v0.15.103 UI Layout Restore Audit SUCCESS');
