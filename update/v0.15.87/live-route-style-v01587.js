'use strict';
module.exports=`

  // v0.15.87 — RANDOM live route-adoption presentation.
  function ensureLiveRouteStylesV01587(){
    if($('#riLiveRouteStyleV01587'))return;
    const st=document.createElement('style');st.id='riLiveRouteStyleV01587';st.textContent=\`
      #riCoachShellV01550 .riCoachTitle small{font-size:0!important}
      #riCoachShellV01550 .riCoachTitle small::after{content:'RANDOM LIVE COACH · v0.15.87'!important;font-size:8px;letter-spacing:.06em}
      #riCoachShellV01550 .ri87DecisionRoute{display:inline-flex;align-items:center;gap:5px;margin-top:7px;border:1px solid #355872;border-radius:999px;background:#0d2437;padding:4px 7px;color:#9dc7df;font-size:8px;font-weight:900}
      #riCoachShellV01550 .ri87DecisionRoute.adopted{border-color:#824967;background:#2b1727;color:#ff9dce;box-shadow:0 0 18px rgba(219,72,163,.08)}
      #riCoachShellV01550 .ri87LiveBuild{display:grid;gap:8px}
      #riCoachShellV01550 .ri87RouteCompare{display:grid;grid-template-columns:minmax(0,1fr) 32px minmax(0,1.15fr);gap:8px;align-items:stretch}
      #riCoachShellV01550 .ri87Route{border:1px solid #29465e;border-radius:10px;background:#081522;padding:9px 10px;min-width:0}
      #riCoachShellV01550 .ri87Route.base{opacity:.72}
      #riCoachShellV01550 .ri87Route.active{border-color:#874769;background:linear-gradient(135deg,#251625,#11192b 62%,#0b2533);box-shadow:inset 0 0 26px rgba(225,72,165,.055)}
      #riCoachShellV01550 .ri87RouteHead{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-bottom:7px}
      #riCoachShellV01550 .ri87RouteHead b{color:#c5d8e7;font-size:10px}
      #riCoachShellV01550 .ri87Route.active .ri87RouteHead b{color:#ff9bc8}
      #riCoachShellV01550 .ri87RouteBadge{border:1px solid #355a73;border-radius:999px;padding:3px 6px;color:#8fb9d2;font-size:7px;font-weight:950;white-space:nowrap}
      #riCoachShellV01550 .ri87Route.active .ri87RouteBadge{border-color:#7b4160;color:#ffb2d4;background:#281423}
      #riCoachShellV01550 .ri87RouteItems{display:flex;align-items:center;gap:5px;min-height:40px;overflow:hidden}
      #riCoachShellV01550 .ri87RouteItems .ri84Item{width:35px;height:35px}
      #riCoachShellV01550 .ri87RouteCopy{margin-top:7px;color:#748fa4;font-size:7px;line-height:1.4}
      #riCoachShellV01550 .ri87Route.active .ri87RouteCopy{color:#c49ab1}
      #riCoachShellV01550 .ri87RouteArrow{display:grid;place-items:center;color:#57bfff;font-size:24px;font-weight:950}
      #riCoachShellV01550 .ri87AdoptNote{border:1px solid #31546d;border-radius:8px;background:#0a1d2d;padding:7px 9px;color:#9eb8ca;font-size:8px;line-height:1.4}
      #riCoachShellV01550 .ri87AdoptNote strong{color:#d9effd}
      #riCoachShellV01550 .ri87AdoptNote.adopted{border-color:#76425e;background:#221521;color:#d9aabd}
      #riCoachShellV01550 .ri87InventoryBar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;border:1px solid #27465d;border-radius:9px;background:#071521;padding:7px 9px}
      #riCoachShellV01550 .ri87InventoryLabel b{display:block;color:#8ecdf1;font-size:9px}.ri87InventoryLabel span{display:block;color:#647f94;font-size:7px;margin-top:2px}
      #riCoachShellV01550 .ri87InventoryItems{display:flex;gap:4px;align-items:center;min-height:34px}.ri87InventoryItems .ri84Item{width:32px;height:32px}
      #riCoachShellV01550 .ri87Gold{color:#f0c357;font-size:12px;font-weight:950;white-space:nowrap}
      #riCoachShellV01550 .ri87PriorityGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      #riCoachShellV01550 .ri87PriorityCard{border:1px solid #2a465d;border-radius:9px;background:#081522;padding:8px;min-width:0}
      #riCoachShellV01550 .ri87PriorityCard:first-child{border-color:#3b7290;background:#0a1d2d}
      #riCoachShellV01550 .ri87PriorityTop{display:grid;grid-template-columns:22px 38px minmax(0,1fr);gap:6px;align-items:center}
      #riCoachShellV01550 .ri87Rank{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#18436a;color:#b9e7ff;font-size:8px;font-weight:950}
      #riCoachShellV01550 .ri87PriorityTop .ri84Item{width:38px;height:38px}
      #riCoachShellV01550 .ri87PriorityText b{display:block;color:#eff8fe;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ri87PriorityText em{display:block;color:#ecc45e;font-style:normal;font-size:7px;margin-top:2px}.ri87PriorityText span{display:inline-block;margin-top:3px;border:1px solid #31566f;border-radius:999px;padding:2px 5px;color:#84c8ef;font-size:6px;font-weight:900}
      #riCoachShellV01550 .ri87PriorityReason{margin-top:6px;color:#7e98ac;font-size:7px;line-height:1.4;min-height:28px}
      #riCoachShellV01550 .ri87Recipe{margin-top:7px;border-top:1px solid #1f3547;padding-top:7px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      #riCoachShellV01550 .ri87Recipe>span:first-child{color:#75a9c9;font-size:7px;font-weight:950;margin-right:2px}.ri87RecipePart{display:inline-flex;align-items:center;gap:4px;color:#829eb1;font-size:6px}.ri87RecipePart .ri84Item{width:25px;height:25px}.ri87RecipeArrow{color:#4f7f9f;font-size:10px}
      #riCoachShellV01550 .ri87CombatBuildRow{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)!important}
      @media(max-width:1150px){#riCoachShellV01550 .ri87RouteCompare{grid-template-columns:1fr 24px 1fr}.ri87PriorityGrid{grid-template-columns:1fr}.ri87PriorityReason{min-height:0}}
      @media(max-width:820px){#riCoachShellV01550 .ri87CombatBuildRow{grid-template-columns:1fr!important}.ri87RouteCompare{grid-template-columns:1fr}.ri87RouteArrow{transform:rotate(90deg)}.ri87InventoryBar{grid-template-columns:1fr}.ri87InventoryItems{flex-wrap:wrap}}
    \`;document.head.appendChild(st);
  }
`;
