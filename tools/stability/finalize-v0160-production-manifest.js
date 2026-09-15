'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {buildCandidateManifest}=require('./v0160-candidate-manifest');

const ROOT=path.resolve(__dirname,'../..');
const manifestPath=path.join(ROOT,'update','manifest.json');
const expectedProductionSha='d7636e64663ea667da4b74bfd1d31649564f3656f5e8a048ca4293596b013bbe';
const expectedPayloadSha='6aea509133140475952348cef3eaf49db74a36c4e9da03b0aa3bc0d7a608bbd5';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=()=>JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));

const current=read();
if(current.version==='0.16.0'){
  const bytes=fs.readFileSync(manifestPath);
  if(sha(bytes)!==expectedProductionSha)throw new Error(`existing v0.16 production manifest digest drift: ${sha(bytes)}`);
  console.log('V0.16 PRODUCTION MANIFEST: ALREADY FINALIZED',expectedProductionSha);
  process.exit(0);
}
if(current.version!=='0.15.135')throw new Error(`refusing cutover from unexpected production version ${current.version}`);

const candidate=buildCandidateManifest();
const payload=JSON.stringify({version:candidate.version,min_launcher:candidate.min_launcher,files:candidate.files,delete:candidate.delete});
if(sha(Buffer.from(payload,'utf8'))!==expectedPayloadSha)throw new Error('candidate payload digest no longer matches tested post-activation payload');

candidate.message='v0.16.0 · CLEAN BASELINE';
delete candidate.candidate;
candidate.release={
  schema:1,
  production:true,
  tested_candidate_commit:'e1c01b994adc09c262c16f1efbfad8530cef379f',
  tested_candidate_manifest_sha256:'4274f22596272514280d89c269f7d09060189f1a743efefce97c36502d050a88',
  post_activation_run_id:34995131695,
  production_candidate_gate_run_id:34995131586,
  physical_evidence_sha256:'34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec',
  golden_rollback_target:'0.15.135',
  legacy_removal:false,
  owner_mode:'production-adapter',
  main_payload_carry_forward:['update/data/aram-builds/current.json']
};
const text=JSON.stringify(candidate,null,2)+'\n';
if(sha(Buffer.from(text,'utf8'))!==expectedProductionSha)throw new Error(`generated production manifest digest mismatch: ${sha(Buffer.from(text,'utf8'))}`);
fs.writeFileSync(manifestPath,text,'utf8');
console.log('V0.16 PRODUCTION MANIFEST: FINALIZED',JSON.stringify({sha256:expectedProductionSha,files:candidate.files.length,canonical:candidate.release.owner_mode}));
