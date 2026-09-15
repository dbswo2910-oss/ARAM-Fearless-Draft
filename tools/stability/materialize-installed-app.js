'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const L=require('./lib');
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const base=arg('--base'),out=arg('--out'),manifestPath=arg('--manifest')||'update/manifest.json',inPlace=process.argv.includes('--in-place');
if(!base||!out)throw new Error('usage: node tools/stability/materialize-installed-app.js --base <base-app-dir> --out <out-dir> [--manifest update/manifest.json] [--in-place]');
const absBase=path.resolve(base),absOut=path.resolve(out),root=path.resolve('.');
function safeRel(v,label){const s=String(v||'').replace(/\\/g,'/');if(!s||s.startsWith('/')||s.includes('../')||s==='..'||/^[A-Za-z]:/.test(s))throw new Error(`unsafe ${label}: ${v}`);return s}
function shaBytes(bytes){return crypto.createHash('sha256').update(bytes).digest('hex')}
function gitBlob(rel){try{return cp.execFileSync('git',['show',`HEAD:${rel}`],{cwd:root,encoding:null,maxBuffer:64*1024*1024,windowsHide:true})}catch{return null}}
function copyDir(src,dst){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,e.name),b=path.join(dst,e.name);if(e.isDirectory())copyDir(a,b);else if(e.isFile())fs.copyFileSync(a,b)}}
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(!/^0\.15\.135$/.test(String(manifest.version)))throw new Error(`installed materializer pinned to Golden v0.15.135, got ${manifest.version}`);
if(!fs.existsSync(path.join(absBase,'index.html'))||!fs.existsSync(path.join(absBase,'main.js'))||!fs.existsSync(path.join(absBase,'package.json')))throw new Error('base app directory missing index.html/main.js/package.json');
if(inPlace){
  if(absBase!==absOut)throw new Error('--in-place requires --base and --out to resolve to the same app directory');
}else{
  if(absBase===absOut)throw new Error('refusing destructive same-directory materialization without --in-place');
  fs.rmSync(absOut,{recursive:true,force:true});copyDir(absBase,absOut);
}
const copied=[];let gitBlobSources=0;
for(const f of manifest.files||[]){
  const target=safeRel(f.path,'manifest target'),source=safeRel(f.source,'manifest source'),src=path.resolve(root,source);
  if(!src.startsWith(root+path.sep)||!fs.existsSync(src))throw new Error(`manifest source missing: ${source}`);
  const blob=gitBlob(source),bytes=blob||fs.readFileSync(src),actual=shaBytes(bytes);
  if(blob)gitBlobSources++;
  if(f.sha256&&actual!==String(f.sha256).toLowerCase())throw new Error(`manifest sha mismatch: ${source}; expected=${String(f.sha256).toLowerCase()} actual=${actual} source=${blob?'git-blob':'worktree'}`);
  const dst=path.join(absOut,target);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,bytes);copied.push({target,source,sha256:actual,byte_source:blob?'git-blob':'worktree'});
}
const deleted=[];for(const d of manifest.delete||manifest.deletes||[]){const rel=safeRel(typeof d==='string'?d:d.path,'manifest delete'),dst=path.join(absOut,rel);fs.rmSync(dst,{recursive:true,force:true});deleted.push(rel)}
const pkg=JSON.parse(fs.readFileSync(path.join(absOut,'package.json'),'utf8'));
if(String(pkg.version)!==String(manifest.version))throw new Error(`assembled package version ${pkg.version} != manifest ${manifest.version}`);
const entry=safeRel(pkg.main||'main.js','package main');if(!fs.existsSync(path.join(absOut,entry)))throw new Error(`assembled package main missing: ${entry}`);
for(const required of ['index.html','preload.js',entry])if(!fs.existsSync(path.join(absOut,required)))throw new Error(`assembled required file missing: ${required}`);
const canonicalDst=path.join(absOut,'canonical-shadow','src');fs.rmSync(canonicalDst,{recursive:true,force:true});copyDir(path.join(root,'src'),canonicalDst);
const canonicalFiles=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&/\.js$/i.test(e.name))canonicalFiles.push(p)}})(canonicalDst);
const report={status:'SUCCESS',stage:'INSTALLED_APP_MATERIALIZED',golden_version:manifest.version,base_dir:path.basename(absBase),output_dir:path.basename(absOut),in_place_update:inPlace,manifest_files:(manifest.files||[]).length,copied_files:copied.length,git_blob_sources:gitBlobSources,deleted_files:deleted.length,package_version:pkg.version,package_main:entry,canonical_shadow_files:canonicalFiles.length,canonical_shadow_embedded_for_test_only:true,production_manifest_unchanged:true,user_data_identity:'aram-fearless-draft',research_database:'aram-rating-research-v03',checkpoint_key:'checkpoint-v03',acceptance_scope:'materialized installed-like Golden app + canonical shadow payload; manifest sources are copied from Git blobs when available so Windows CRLF checkout conversion cannot alter pinned bytes; --in-place is test-only and preserves the external stable userData profile while applying the Golden manifest'};
L.write('audit-output/stability/installed-windows/materialization.json',report);console.log('INSTALLED APP MATERIALIZATION: SUCCESS',JSON.stringify(report));
