'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}

const v99=read('update/v0.15.99/main-v01599.js');
const v100=read('update/v0.15.100/main-v015100.js');
const v101=read('update/v0.15.101/main-v015101.js');
const pkg=JSON.parse(read('update/v0.15.101/package.json'));

assert(v99.includes("path.join(__dirname,'main-v01598.js')"),'v0.15.99 must resolve predecessor inside active overlay');
assert(!v99.includes("../v0.15.98/main-v01598.js"),'v0.15.99 must not depend on prior version directory');
assert(v100.includes("path.join(__dirname,'main-v01599.js')"),'v0.15.100 must resolve predecessor inside active overlay');
assert(!v100.includes("../v0.15.99/main-v01599.js"),'v0.15.100 must not depend on prior version directory');
assert(v101.includes("path.join(__dirname,'main-v015100.js')"),'v0.15.101 must resolve predecessor inside active overlay');
assert(!/\.\.\/v0\.15\.100\//.test(v101),'v0.15.101 must not depend on prior version directory');
assert(pkg.version==='0.15.101','v0.15.101 package version mismatch');
assert(pkg.main==='main-v015101.js','v0.15.101 package main mismatch');

if(fs.existsSync('update/manifest.json')){
  const m=JSON.parse(read('update/manifest.json'));
  if(m.version==='0.15.101'){
    const byPath=new Map(m.files.map(x=>[x.path,x.source]));
    assert(byPath.get('main-v01598.js')==='update/v0.15.98/main-v01598.js','manifest missing v0.15.98 predecessor');
    assert(byPath.get('main-v01599.js')==='update/v0.15.99/main-v01599.js','manifest missing fixed v0.15.99 predecessor');
    assert(byPath.get('main-v015100.js')==='update/v0.15.100/main-v015100.js','manifest missing fixed v0.15.100 predecessor');
    assert(byPath.get('main-v015101.js')==='update/v0.15.101/main-v015101.js','manifest missing v0.15.101 main');
    assert(byPath.get('package.json')==='update/v0.15.101/package.json','manifest package source mismatch');
  }
}
console.log('v0.15.101 packaged startup audit: PASS');
