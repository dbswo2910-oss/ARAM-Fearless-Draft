'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01584')}catch{prior=require('../v0.15.84/runtime-source-stability-v01584')}

function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.85 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,text+anchor);
}
function replaceOnce(src,from,to,label){
  const n=countOf(src,from);
  if(n!==1)throw new Error(`v0.15.85 source contract mismatch ${label} count=${n}`);
  return src.replace(from,to);
}

const FIGHT_STATUS_SCALE_HELPER=`

  // v0.15.85 — enlarge the bottom fight-status board for live readability.
  function ensureFightStatusScaleStylesV01585(){
    if($('#riFightStatusScaleV01585'))return;
    const st=document.createElement('style');st.id='riFightStatusScaleV01585';st.textContent=\`
      #riCoachShellV01550 .ri84Fight{min-height:118px;padding:14px 16px 16px!important;border-color:#32617c!important;box-shadow:inset 0 0 28px rgba(41,116,164,.035)}
      #riCoachShellV01550 .ri84FightHead{margin-bottom:12px!important}
      #riCoachShellV01550 .ri84FightHead b{font-size:16px!important;letter-spacing:-.01em}
      #riCoachShellV01550 .ri84FightHead span{font-size:9px!important}
      #riCoachShellV01550 .ri84FightGrid{grid-template-columns:minmax(0,1.22fr) 180px 270px 165px minmax(0,1.22fr)!important;gap:14px!important;min-height:68px}
      #riCoachShellV01550 .ri84FightTeam>span{font-size:9px!important;margin-bottom:7px!important;color:#8aaac0!important}
      #riCoachShellV01550 .ri84Fight .ri83Faces{gap:7px!important;min-height:38px;align-items:center}
      #riCoachShellV01550 .ri84Fight .ri83Portrait{width:34px!important;height:34px!important;border-radius:8px!important;border-width:1px!important}
      #riCoachShellV01550 .ri84Fight .ri83Face{gap:4px!important}
      #riCoachShellV01550 .ri84Fight .ri83Face span,#riCoachShellV01550 .ri84Fight .ri83Face small{font-size:8px!important;line-height:1.15!important}
      #riCoachShellV01550 .ri84FightMetric{padding-left:14px!important;min-height:58px;display:flex;flex-direction:column;justify-content:center}
      #riCoachShellV01550 .ri84FightMetric span{font-size:9px!important;margin-bottom:5px!important;color:#829eb3!important;font-weight:900}
      #riCoachShellV01550 .ri84FightMetric b{font-size:17px!important;line-height:1.15!important;letter-spacing:-.01em}
      #riCoachShellV01550 .ri84FightMetric small{font-size:9px!important;color:#91a8b9!important;margin-top:4px}
      #riCoachShellV01550 .ri84PowerBar{height:13px!important;margin-top:8px!important;box-shadow:inset 0 0 0 1px rgba(111,153,180,.13)}
      @media(max-width:1280px){
        #riCoachShellV01550 .ri84FightGrid{grid-template-columns:minmax(0,1fr) 145px 220px 140px minmax(0,1fr)!important;gap:10px!important}
        #riCoachShellV01550 .ri84Fight .ri83Portrait{width:30px!important;height:30px!important}
        #riCoachShellV01550 .ri84FightMetric b{font-size:15px!important}
      }
      @media(max-width:980px){
        #riCoachShellV01550 .ri84Fight{min-height:0}
        #riCoachShellV01550 .ri84FightGrid{grid-template-columns:1fr 1fr!important}
        #riCoachShellV01550 .ri84FightTeam.enemy{text-align:left!important}
        #riCoachShellV01550 .ri84FightTeam.enemy .ri83Faces{justify-content:flex-start!important}
        #riCoachShellV01550 .ri84FightMetric{border-left:0!important;padding-left:0!important}
      }
    \`;document.head.appendChild(st);
  }
`;

function patchCoach(src){
  src=insertBefore(src,'  function renderLive(m){',FIGHT_STATUS_SCALE_HELPER,'function ensureFightStatusScaleStylesV01585()','fight status scale helper');
  src=replaceOnce(
    src,
    'ensureCommandCenterStylesV01582();ensureVisualStylesV01583();ensureReferenceLayoutStylesV01584();',
    'ensureCommandCenterStylesV01582();ensureVisualStylesV01583();ensureReferenceLayoutStylesV01584();ensureFightStatusScaleStylesV01585();',
    'renderLive style chain'
  );
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true,reference_layout_changed:true,fight_status_scale_changed:true,policy_version:'0.15.85'};
