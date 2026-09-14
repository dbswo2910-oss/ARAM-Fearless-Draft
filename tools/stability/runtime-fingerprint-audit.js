'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const L=require('./lib');
const baseline=L.json('stability/snapshots/v015135-runtime-fingerprints.json');
const outDir=L.p('audit-output/stability/final-runtime');
L.must(fs.existsSync(outDir),'final runtime directory missing; run final-runtime-audit first');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const drift=[];let checked=0;
for(const [domain,files] of Object.entries(baseline.domains||{})){
  for(const [name,expected] of Object.entries(files||{})){
    const p=path.join(outDir,name);checked++;
    if(!fs.existsSync(p)){drift.push({domain,name,expected,actual:null,reason:'missing'});continue}
    const actual=sha(p);if(actual!==expected)drift.push({domain,name,expected,actual,reason:'sha256-drift'});
  }
}
L.must(!drift.length,'v0.15.135 Golden runtime fingerprint drift: '+JSON.stringify(drift.slice(0,5)));
const report={status:'SUCCESS',baseline:baseline.baseline,checked,domains:Object.keys(baseline.domains||{}),drift,behavioral_snapshot_status:baseline.behavioral_snapshot_status,note:'This freezes selected final-runtime owner inputs. It complements, not replaces, behavioral differential fixtures.'};
L.write('audit-output/stability/runtime-fingerprint-report.json',report);
console.log(`RUNTIME FINGERPRINT AUDIT: SUCCESS · ${checked} Golden files unchanged`);
