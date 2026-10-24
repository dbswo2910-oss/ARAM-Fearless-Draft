'use strict';
const assert=require('assert');
const {PassThrough}=require('stream');
const {createUpdaterClient,OWNER}=require('../src/main/updater-client');

function fakeHttps(payloads){
  let calls=0;
  return{get(_url,_opts,cb){
    const req={setTimeout(){},on(){return req},destroy(err){if(err&&req._error)req._error(err)},_error:null};
    const entry=payloads[calls++];
    process.nextTick(()=>{
      if(entry instanceof Error){if(req._error)req._error(entry);return}
      const res=new PassThrough();res.statusCode=entry.statusCode||200;res.headers=entry.headers||{};res.resume=()=>{};cb(res);res.end(Buffer.from(entry.body||''));
    });
    req.on=(event,fn)=>{if(event==='error')req._error=fn;return req};
    return req;
  },get calls(){return calls}};
}

const app={relaunch(){throw new Error('current-version path must not relaunch')},exit(){throw new Error('current-version path must not exit')}};
const tx={CRITICAL_FILES:['index.html','autosync-core.js','main.js','preload.js','package.json'],prepareTransaction(){throw new Error('current-version path must not prepare transaction')},abortTransaction(){return false},markApplied(){throw new Error('current-version path must not mark applied')}};
const manifest={version:'0.17.0',files:[{path:'main.js',source:'update/v0.17.0/main.js'}],delete:[]};
const net=fakeHttps([{body:JSON.stringify(manifest)}]);
const client=createUpdaterClient({app,appDir:process.cwd(),version:'0.17.0',updateRepo:'owner/repo',launcherVersion:'2.0.2',httpsModule:net,transaction:tx,now:()=>123});

assert.strictEqual(OWNER,'main.updater-client');
assert.strictEqual(client.compareVersion('0.18.0','0.17.0'),1);
assert.strictEqual(client.compareVersion('0.17.0','0.17.0'),0);
assert.strictEqual(client.compareVersion('0.16.9','0.17.0'),-1);
assert.strictEqual(client.safeRel('./update/manifest.json'),'update/manifest.json');
assert.throws(()=>client.safeRel('../secret'),/Unsafe update path/);
assert.throws(()=>client.safeRel('/absolute'),/Unsafe update path/);
assert.strictEqual(client.allowedHost('raw.githubusercontent.com'),true);
assert.strictEqual(client.allowedHost('evil.example.com'),false);
assert.doesNotThrow(()=>client.validateManifest(manifest));
assert.throws(()=>client.validateManifest({version:'0.18.0',files:[{path:'x',source:'outside/x'}]}),/허용되지 않은 update source/);
assert.throws(()=>client.validateManifest({version:'0.18.0',files:[{path:'x',source:'update/x'}],delete:['main.js']}),/핵심 런타임 삭제 금지/);

(async()=>{
  const result=await client.checkAndApplyUpdate();
  assert.deepStrictEqual(result,{status:'current',current:'0.17.0',latest:'0.17.0',message:'최신 버전입니다 · v0.17.0'});
  assert.strictEqual(net.calls,1);
  assert.strictEqual(client.busy,false);
  console.log(JSON.stringify({status:'PASS',owner:OWNER,manifestValidation:true,currentVersionPath:true,canonicalTransactionBoundary:true,networkCalls:net.calls}));
})().catch(e=>{console.error(e);process.exit(1)});
