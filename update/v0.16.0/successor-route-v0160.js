'use strict';
const OLD_ROUTE_FRAGMENT="'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')";
const NEW_ROUTE_FRAGMENT="'0.16.0').replaceAll(stabilityAnchor,'runtime-source-stability-v015135')";
function patchSuccessorSource(input){
  const src=String(input||'');
  const routeHits=src.split(OLD_ROUTE_FRAGMENT).length-1;
  if(routeHits!==1)throw new Error(`v0.16.0 main successor contract mismatch: expected one v0.15.122 route, got ${routeHits}`);
  return src.replace(OLD_ROUTE_FRAGMENT,NEW_ROUTE_FRAGMENT);
}
module.exports={OLD_ROUTE_FRAGMENT,NEW_ROUTE_FRAGMENT,patchSuccessorSource,policy_version:'0.16.0',runtime_stability_owner:'runtime-source-stability-v015135'};
