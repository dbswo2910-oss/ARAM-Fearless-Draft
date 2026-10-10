'use strict';
module.exports={
  subsystem:'autosync',
  status:'legacy-removal-in-progress',
  legacy:'autosync-concurrency-v015119 + remaining runtime/history adapters',
  responsibilities:['single-flight sync','queue ownership','reconnect backoff','stale write rejection','privacy-safe telemetry enrichment','CC impact enrichment','mission timeline enrichment'],
  canonical_owners:{
    queue:{module:'src/autosync/queue.js',production_capable:true,parity_locked:true},
    ccImpact:{module:'src/autosync/cc-impact.js',production_capable:true,parity_locked:true},
    missionTimeline:{module:'src/autosync/mission-timeline.js',production_capable:true,parity_locked:true},
    telemetry:{module:'src/autosync/telemetry.js',production_capable:true,parity_locked:true}
  },
  production_active:false,
  legacy_removal_complete:false
};
