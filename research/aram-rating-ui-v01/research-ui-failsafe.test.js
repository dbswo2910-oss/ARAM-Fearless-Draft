'use strict';
const assert=require('assert');
const path=require('path');
const originalWarn=console.warn;console.warn=()=>{};
global.window=global;
global.localStorage={getItem:()=>null,setItem:()=>{}};
global.document={
  addEventListener(){},removeEventListener(){},getElementById(){return null},querySelector(){return null},
  createElement(){return{style:{},appendChild(){},remove(){},set textContent(v){this._t=v},get textContent(){return this._t}}},
  head:{appendChild(){}},body:{appendChild(){}}
};
global.MutationObserver=class{observe(){}disconnect(){}};
global.fetch=async()=>({ok:false,status:503,text:async()=>''});
const historySentinel=function historySentinel(){};
const profileSentinel=function profileSentinel(){};
global.renderAramHistoryFeedback=historySentinel;
global.openPlayerProfile=profileSentinel;
require(path.resolve(__dirname,'research-ui-devtools.js'));
setTimeout(()=>{
  try{
    assert.strictEqual(global.renderAramHistoryFeedback,historySentinel);
    assert.strictEqual(global.openPlayerProfile,profileSentinel);
    assert(global.aramRatingResearchUIV01);
    assert.strictEqual(global.aramRatingResearchUIV01.status().latest_run,false);
    console.warn=originalWarn;
    console.log(JSON.stringify({status:'PASS',engine_unavailable:true,production_history_untouched:true,production_profile_untouched:true}));
  }catch(e){console.warn=originalWarn;console.error(e);process.exitCode=1}
},30);
