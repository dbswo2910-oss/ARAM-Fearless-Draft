'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {patchPreloadSource,MARKER,RATING_CHANNEL}=require('../src/preload/universal-rating-history-hook');

const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');

test('preload sidecar patches exactly the existing match-history bridge and preserves other desktop methods',()=>{
  const base=read('update/v0.15.117/preload.js');
  const patched=patchPreloadSource(base);
  assert.equal(patched.changed,true);
  assert.equal(patched.count,1);
  assert.match(patched.source,new RegExp(MARKER));
  assert.match(patched.source,new RegExp(RATING_CHANNEL));
  assert.match(patched.source,/getAutoSyncState/);
  assert.match(patched.source,/pollRiotGrade/);
  assert.match(patched.source,/getItemCatalog/);
  assert.match(patched.source,/getAramMatchHistory: options => universalRatingShadowHistory\(options\)/);
  const second=patchPreloadSource(patched.source);
  assert.equal(second.alreadyPatched,true);
  assert.equal(second.changed,false);
});

test('v0.16.1 candidate inherits v0.16.0 and only routes preload plus rating IPC sidecar',()=>{
  const main=read('update/v0.16.1/main-v0161-shadow.js');
  const preload=read('update/v0.16.1/preload-v0161-shadow.js');
  const pkg=JSON.parse(read('update/v0.16.1/package.json'));
  assert.equal(pkg.version,'0.16.1');
  assert.equal(pkg.main,'main-v0161-shadow.js');
  assert.match(main,/main-v0160\.js/);
  assert.match(main,/installUniversalRatingIpc/);
  assert.match(main,/ARAM_UNIVERSAL_RATING_DB_ROOT/);
  assert.match(main,/ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT/);
  assert.match(main,/preload-v0161-shadow\.js/);
  assert.match(preload,/preload\.js/);
  assert.match(preload,/patchPreloadSource/);
  assert.doesNotMatch(main,/productionActive\s*:\s*true/);
});

test('active production manifest remains v0.16.0 while shipped shadow is only a candidate',()=>{
  const active=JSON.parse(read('update/manifest.json'));
  assert.equal(active.version,'0.16.0');
  assert.equal(active.message,'v0.16.0 · CLEAN BASELINE');
});
