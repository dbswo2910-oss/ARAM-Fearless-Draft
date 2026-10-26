'use strict';
module.exports={
  subsystem:'items',
  status:'legacy-removal-in-progress',
  legacy:'v0.15.80 canonical item identity + v0.15.81 recommendation gate + v0.15.66 art runtime + remaining renderer adapters',
  components:{catalog_identity:'shadow',recommendation_gate:'shadow',art_resolver:'shadow',art_dom_runtime:'shadow',catalog_ipc_contract:'shadow',catalog_ipc_owner:'canonical-parity-locked'},
  canonical_owners:{catalog:{module:'src/items/catalog-service.js',production_capable:true,parity_locked:true}},
  migration_rule:'catalog identity/service, art resolution/runtime lifecycle, bridge contract and recommendation outputs are differential/structural gated; production main/renderer integration remains disabled until installed-app acceptance',
  production_active:false,
  legacy_removal_complete:false,
  score_logic_changed:false,
  item_recommendation_logic_changed:false
};
