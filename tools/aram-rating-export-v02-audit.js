'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');

const ROOT=path.resolve(__dirname,'..');
const helperPath=path.join(ROOT,'research','aram-rating-v02','export-current-history-devtools.js');

function game(i){
  return {
    gameId:`KR_PHASEA_${String(i).padStart(5,'0')}`,
    queueId:450,
    gameCreation:1765000000000+i*600000,
    gameDuration:1100,
    gameVersion:'26.18.1',
    participants:Array.from({length:10},(_,j)=>({
      participantId:j+1,teamId:j<5?100:200,puuid:`real-like-puuid-${(i+j)%300}`,
      championId:1+((i*13+j)%173),win:j<5,kills:5,deaths:5,assists:10
    }))
  };
}

async function main(){
  const fresh=Array.from({length:83},(_,i)=>game(i+1));
  const renderer=fresh.slice(0,20),cache=fresh.slice(0,35);
  const calls=[];
  let clicks=0,createdUrl=0;

  global.window={
    aramDesktop:{
      getAramMatchHistory:async opts=>{
        calls.push({...opts});
        if(opts.cacheOnly)return {connected:true,matches:cache,_historyLatency:{cacheHit:true}};
        return {connected:true,matches:fresh,_historyLatency:{mode:'interactive',ms:12}};
      }
    }
  };
  global.aramHistoryState={targetMode:'current',target:null,matches:renderer};
  global.navigator={clipboard:{writeText:async()=>{}}};
  global.Blob=class Blob{constructor(parts,opts){this.parts=parts;this.opts=opts}};
  global.URL={createObjectURL:()=>{createdUrl++;return'blob:phase-a'},revokeObjectURL:()=>{}};
  global.document={
    body:{appendChild:()=>{}},
    createElement:()=>({style:{},href:'',download:'',click(){clicks++},remove(){}})
  };

  const code=fs.readFileSync(helperPath,'utf8');
  vm.runInThisContext(code,{filename:helperPath});
  const result=await window.__ARAM_RATING_EXPORT_PROMISE_V02__;
  const env=result.envelope;
  assert.equal(env.metadata.source,'local_running_app');
  assert.equal(env.metadata.region,'KR');
  assert.equal(env.metadata.queue,450);
  assert.equal(env.metadata.match_count,83);
  assert.equal(env.matches.length,83);
  assert(env.matches.every(x=>x.queueId===450));
  assert.equal(env.metadata.validation.invalid_queue,0);
  assert.equal(env.metadata.validation.missing_participants,0);
  assert.equal(env.metadata.validation.missing_puuid,0);
  assert.equal(env.metadata.validation.duplicate_match_ids,0);
  assert.equal(clicks,1);
  assert.equal(createdUrl,1);
  assert(/^aram-rating-real-sample-\d{8}-\d{4}\.json$/.test(result.filename));
  assert.equal(calls.length,2);
  assert.equal(calls[0].cacheOnly,true);
  assert.equal(calls[0].queueMode,'standard');
  assert.equal(calls[1].queueMode,'standard');
  assert.equal(calls[1].scan,100);
  assert(!calls.some(x=>x.queueMode==='mayhem'));

  const preload=fs.readFileSync(path.join(ROOT,'update','v0.15.117','preload.js'),'utf8');
  const main=fs.readFileSync(path.join(ROOT,'update','v0.15.70','main.js'),'utf8');
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update','manifest.json'),'utf8'));
  assert(preload.includes("getAramMatchHistory: options => ipcRenderer.invoke('match-history:load'"));
  assert(main.includes("ipcMain.handle('match-history:load',(_event,opts)=>core.getAramMatchHistory(opts||{}))"));
  assert(manifest.files.some(x=>x.path==='preload.js'&&x.source==='update/v0.15.117/preload.js'));
  assert(manifest.files.some(x=>x.path==='main.js'&&x.source==='update/v0.15.70/main.js'));
  assert(!manifest.files.some(x=>String(x.path).includes('aram-rating')||String(x.source).includes('aram-rating')));

  const out={status:'PASS',exported:83,queue450:83,invalidQueue:0,missingParticipants:0,missingPuuid:0,duplicates:0,
    bridge:'window.aramDesktop.getAramMatchHistory -> match-history:load -> core.getAramMatchHistory',
    productionManifestModified:false,downloadPath:'Blob + download anchor'};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output','aram-rating-export-v02-report.json'),JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify(out));
}

main().catch(e=>{console.error(e);process.exitCode=1});
