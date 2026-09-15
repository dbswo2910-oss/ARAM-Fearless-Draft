'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const assert=require('assert');

const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
const shaFile=rel=>shaBytes(fs.readFileSync(p(rel)));
const json=rel=>JSON.parse(fs.readFileSync(p(rel),'utf8').replace(/^\uFEFF/,''));
const ORIGINAL_PRODUCTION_COMMIT='feb7cb0e62a3f862a484f521b7f3914561410990';
const ORIGINAL_MANIFEST_SHA256='d7636e64663ea667da4b74bfd1d31649564f3656f5e8a048ca4293596b013bbe';
const gitShow=rel=>cp.execFileSync('git',['show',`${ORIGINAL_PRODUCTION_COMMIT}:${rel}`],{cwd:ROOT});
function semantic(m){
  return JSON.stringify({
    version:m.version,
    min_launcher:m.min_launcher,
    files:(m.files||[]).map(x=>({path:x.path,sha256:String(x.sha256||'').toLowerCase()})),
    delete:Array.isArray(m.delete)?m.delete:[]
  });
}

const current=json('update/manifest.json');
const originalBytes=gitShow('update/manifest.json');
assert.strictEqual(shaBytes(originalBytes),ORIGINAL_MANIFEST_SHA256,'original production manifest fingerprint drifted');
const original=JSON.parse(originalBytes.toString('utf8').replace(/^\uFEFF/,''));
const record=json('release/v0.16.0-update-transport-hotfix.json');
const cutover=json('release/v0.16.0-production-cutover.json');

assert.strictEqual(current.version,'0.16.0','transport hotfix must remain v0.16.0');
assert.strictEqual(semantic(current),semantic(original),'runtime target/SHA payload changed during transport hotfix');
assert.strictEqual(current.files.length,original.files.length,'manifest file count changed');
assert.strictEqual(current.files.length,323,'expected v0.16 production file count');
assert.strictEqual(current.files.filter(x=>String(x.path||'').startsWith('canonical/src/')&&/\.js$/i.test(String(x.path||''))).length,82,'canonical JS count changed');
assert.strictEqual(record.stage,'V0160_UPDATE_TRANSPORT_COMPAT_HOTFIX','transport record stage mismatch');
assert.strictEqual(record.original_production_commit,ORIGINAL_PRODUCTION_COMMIT,'transport original commit mismatch');
assert.strictEqual(record.original_production_manifest_sha256,ORIGINAL_MANIFEST_SHA256,'transport original manifest mismatch');
assert.strictEqual(record.current_transport_manifest_sha256,shaFile('update/manifest.json'),'transport current manifest fingerprint mismatch');
assert.strictEqual(record.runtime_targets_or_sha_changed,false,'runtime payload drift must remain false');
assert.strictEqual(record.updater_security_relaxed,false,'updater security must not be relaxed');
assert.strictEqual(record.rating_logic_changed,false,'Rating logic must not change in updater hotfix');
assert.strictEqual(record.research_checkpoint_changed,false,'Research checkpoint must not change in updater hotfix');
assert.strictEqual(cutover.production_manifest_sha256,ORIGINAL_MANIFEST_SHA256,'initial production cutover manifest fingerprint changed unexpectedly');

const legacy=fs.readFileSync(p('update/v0.15.70/main.js'),'utf8');
assert.ok(legacy.includes("if(!source.startsWith('update/'))throw new Error(`허용되지 않은 update source: ${source}`)"),'legacy secure updater source-prefix guard was changed');
let verified=0,canonicalTransported=0;
for(const f of current.files){
  assert.ok(String(f.source||'').startsWith('update/'),`blocked source remains: ${f.source}`);
  assert.ok(fs.existsSync(p(f.source)),`manifest source missing: ${f.source}`);
  if(f.sha256)assert.strictEqual(shaFile(f.source),String(f.sha256).toLowerCase(),`manifest SHA mismatch: ${f.source}`);
  if(String(f.path||'').startsWith('canonical/src/')){
    assert.strictEqual(f.source,`update/v0.16.0/${f.path}`,`canonical transport source mismatch: ${f.path}`);
    canonicalTransported++;
  }
  verified++;
}
assert.strictEqual(canonicalTransported,82,'expected all 82 canonical JS entries to use update/v0.16.0 transport path');

const out={status:'SUCCESS',stage:'V0160_UPDATE_TRANSPORT_CUTOVER_EQUIVALENCE',release:'0.16.0',original_production_commit:ORIGINAL_PRODUCTION_COMMIT,original_manifest_sha256:ORIGINAL_MANIFEST_SHA256,current_manifest_sha256:shaFile('update/manifest.json'),runtime_payload_semantically_identical:true,verified_manifest_files:verified,canonical_sources_repackaged:canonicalTransported,legacy_updater_security_guard_preserved:true,updater_security_relaxed:false,rating_logic_changed:false,research_checkpoint_changed:false};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','v0160-update-transport-cutover-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('V0.16 UPDATE TRANSPORT CUTOVER EQUIVALENCE: SUCCESS',JSON.stringify(out));
