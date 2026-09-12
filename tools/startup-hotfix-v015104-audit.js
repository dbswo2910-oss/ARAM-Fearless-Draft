'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const main104=read('update/v0.15.104/main-v015104.js');
const main100=read('update/v0.15.100/main-v015100.js');
const pkg=JSON.parse(read('update/v0.15.104/package.json'));
const ui103=read('update/v0.15.103/ui-layout-restore-v015103.js');

assert(main104.includes("main-v015100.js"),'v104 must resume from last behavior-bearing v100 main');
assert(main104.includes("runtime-source-stability-v015104"),'v104 must redirect runtime source stability');
assert(!main104.includes('runtime script anchor mismatch'),'broken v103 renderer-anchor startup guard must not survive');
assert.strictEqual(pkg.version,'0.15.104');
assert.strictEqual(pkg.main,'main-v015104.js');

const rewritten=main100.replaceAll('0.15.100','0.15.104').replaceAll('runtime-source-stability-v015100','runtime-source-stability-v015104');
assert(rewritten.includes("'runtime-source-stability-v015104'"),'rewritten main must target v104 stability');
assert(rewritten.includes("const marker='0.15.99'"),'v100 predecessor contract must remain intact');

const stability=require(path.join(root,'update/v0.15.104/runtime-source-stability-v015104.js'));
assert.strictEqual(stability.score_logic_changed,false,'startup hotfix must not change score logic');
assert.strictEqual(stability.startup_hotfix_changed,true);
const focus=read('update/v0.15.72/random-practice-focus-v01549.js');
const patched=stability.patchRuntimeSource('random-practice-focus-v01549.js',focus);
assert(patched.length>focus.length,'v104 must append the UI restore to the renderer payload');
assert(patched.includes('__ARAM_UI_LAYOUT_RESTORE_V015103__'),'v103 UI restore readiness marker missing');
assert(patched.includes('rpLayoutRestoreV015103'),'random reference layout missing');
assert(patched.includes('dataHubTopNavV015103'),'Data top subnav restore missing');
assert(ui103.includes('score_logic_changed:false'),'v103 UI layer must remain UI-only');
console.log('v0.15.104 startup hotfix audit: OK');
