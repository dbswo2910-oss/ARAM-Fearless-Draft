'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const appDir=path.resolve(arg('--app')||'');
if(!arg('--app'))throw new Error('usage: node tools/rc/materialize-v0160-rc1.js --app <materialized-golden-app-dir>');
const req=['index.html','package.json','main-v015135.js','preload.js'];
for(const f of req)if(!fs.existsSync(path.join(appDir,f)))throw new Error(`RC1 base missing ${f}`);
const pkgPath=path.join(appDir,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
if(String(pkg.version)!=='0.15.135')throw new Error(`RC1 must materialize from Golden v0.15.135, got ${pkg.version}`);
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function copy(src,dst){fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}

const bundleName='v0160-canonical-browser-bundle.js';
const entryName='v0160-rc1-renderer.js';
const mainName='main-v0160-rc1.js';
const bundlePath=path.join(appDir,bundleName);
cp.execFileSync(process.execPath,[path.join(ROOT,'tools/rc/build-canonical-browser-bundle.js'),bundlePath],{cwd:ROOT,stdio:'inherit'});
copy(path.join(ROOT,'rc/v0160-rc1/renderer-entry.js'),path.join(appDir,entryName));
copy(path.join(ROOT,'rc/v0160-rc1/main.js'),path.join(appDir,mainName));

const indexPath=path.join(appDir,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
const markerStart='<!-- V0160_RC1_CANONICAL_START -->',markerEnd='<!-- V0160_RC1_CANONICAL_END -->';
const block=`${markerStart}\n<script src="./${bundleName}"></script>\n<script src="./${entryName}"></script>\n${markerEnd}`;
const existing=new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`,'g');
html=html.replace(existing,'');
const close=html.toLowerCase().lastIndexOf('</body>');
if(close<0)throw new Error('RC1 index injection failed: </body> not found');
html=html.slice(0,close)+block+'\n'+html.slice(close);
fs.writeFileSync(indexPath,html,'utf8');

pkg.main=mainName;
pkg.rc={version:'0.16.0-rc.1',base_version:'0.15.135',canonical_activation:'canary',production:false,user_data_mode:'isolated-clone'};
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');

const report={
  status:'SUCCESS',
  rc_version:'0.16.0-rc.1',
  golden_base_version:'0.15.135',
  package_version_preserved:pkg.version,
  package_main:pkg.main,
  production:false,
  production_userdata_mutated:false,
  sandbox_userdata:'%APPDATA%/ARAM Fearless Draft RC1 Sandbox/aram-fearless-draft',
  injected:[bundleName,entryName,mainName],
  hashes:{index:sha(indexPath),bundle:sha(bundlePath),renderer:sha(path.join(appDir,entryName)),main:sha(path.join(appDir,mainName)),package:sha(pkgPath)}
};
const out=path.join(ROOT,'audit-output/rc/v0160-rc1/materialization.json');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n','utf8');
console.log('V0.16 RC1 MATERIALIZATION: SUCCESS',JSON.stringify(report));
