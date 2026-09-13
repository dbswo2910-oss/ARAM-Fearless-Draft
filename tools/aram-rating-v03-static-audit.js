'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const helper=read('research/aram-rating-v03/phase-b-expansion-devtools.js');
const core=read('research/aram-rating-v03/collector-core.js');
new vm.Script(helper,{filename:'phase-b-expansion-devtools.js'});
new vm.Script(core,{filename:'collector-core.js'});

assert(helper.includes("maxExpandedPlayers:10"));
assert(helper.includes("maxMatchesPerPlayer:20"));
assert(helper.includes("maxAcceptedMatches:500"));
assert(helper.includes("maxRequests:30"));
assert(helper.includes("retryLimit:2"));
assert(helper.includes("cooldownMs:1800"));
assert(helper.includes("overallTimeoutMs:10*60*1000"));
assert(helper.includes("window.aramRatingPhaseB.abort()"));
assert(helper.includes("checkpoint-v03"));
assert(helper.includes("blocked_by_data_source"));
assert(helper.includes("target:{puuid}"));
assert(helper.includes("target_hits===0"));
assert(helper.includes("empty_target_history"));
assert(helper.includes("queueMode:'standard'"));
assert(helper.includes("limit:cfg.maxMatchesPerPlayer"));
assert(helper.includes("scan:cfg.scan"));
assert(helper.includes("acceptance_order_match_ids"));
assert(helper.includes("production_ui_modified:false"));

const forbidden=[/op\.gg/i,/match-v5/i,/captcha/i,/anti-bot/i,/rate-limit bypass/i,/private endpoint/i];
for(const re of forbidden){assert(!re.test(helper),`forbidden source/bypass reference in helper: ${re}`);assert(!re.test(core),`forbidden source/bypass reference in core: ${re}`)}
const manifest=read('update/manifest.json');
assert(!manifest.includes('aram-rating-v03'),'production manifest must not reference v0.3 research helper');
for(const p of ['research/aram-rating-v03/data/.gitignore','research/aram-rating-v03/checkpoints/.gitignore']){
  const x=read(p);assert(x.includes('*')&&x.includes('!.gitignore'),`${p} must ignore local sensitive artifacts`);
}

const preload=read('update/v0.15.70/preload.js');
const main=read('update/v0.15.70/main.js');
const concurrency=read('update/v0.15.128/autosync-concurrency-v015119.js');
const latency=read('update/v0.15.128/history-latency-v015128.js');
assert(preload.includes('match-history:load'));
assert(main.includes('match-history:load')&&main.includes('getAramMatchHistory'));
assert(concurrency.includes('cacheRowsMax')&&concurrency.includes('40'));
assert(concurrency.includes('oldHistory.call(this, target, normalizedOpts)')||concurrency.includes('oldHistory.call(this,target,normalizedOpts)'));
assert(latency.includes('profileMaxHistoryRows')&&latency.includes('30'));
assert(latency.includes('historyLimit')&&latency.includes('20'));
assert(!fs.existsSync(path.join(root,'update/v0.15.128/autosync-core.js')));

const out={status:'PASS',fixture_only:true,production_manifest_untouched:true,bounded_collector:true,blocked_by_data_source_guard:true,checkpoint_resume:true,tracked_history_path:{ui_default:20,renderer_max:30,session_cache_max:40,base_autosync_core_source_tracked:false}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/aram-rating-v03-static-report.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out));
