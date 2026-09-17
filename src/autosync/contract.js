'use strict';
module.exports={
  subsystem:'autosync',
  status:'legacy-removal-in-progress',
  legacy:'autosync-concurrency-v015119 + historical feature patches',
  responsibilities:['single-flight sync','queue ownership','reconnect backoff','stale write rejection','privacy-safe telemetry enrichment'],
  canonical_owners:{telemetry:{module:'src/autosync/telemetry.js',production_capable:true,parity_locked:true}},
  production_active:false,
  legacy_removal_complete:false
};
