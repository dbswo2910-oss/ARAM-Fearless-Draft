'use strict';
(()=>{
  const V='0.15.40';
  if(window.__ARAM_DRAFT_SIDE_ORDER_V01540__)return;

  function sideFirst(){
    try{return typeof localDraftFirstSide==='function'?localDraftFirstSide():(state?.firstSide==='enemy'?'enemy':'our')}catch{return 'our'}
  }
  function other(side){return side==='our'?'enemy':'our'}

  function reorderPair(container,ourSelector,enemySelector,parentOfMatch=false){
    if(!container)return false;
    let our=container.querySelector(ourSelector),enemy=container.querySelector(enemySelector);
    if(parentOfMatch){our=our?.parentElement;enemy=enemy?.parentElement;}
    if(!our||!enemy)return false;
    const blue=sideFirst()==='our'?our:enemy,red=blue===our?enemy:our;
    container.append(blue,red);
    container.dataset.blueLeft=blue===our?'our':'enemy';
    return true;
  }

  function reorderBanRow(row){
    if(!row)return false;
    const op=row.querySelector('.localBanPortrait.our'),ep=row.querySelector('.localBanPortrait.enemy');
    const os=row.querySelector('.localBanField.our'),es=row.querySelector('.localBanField.enemy');
    if(!op||!ep||!os||!es)return false;
    const og=[op.previousElementSibling,op,os].filter(Boolean),eg=[ep.previousElementSibling,ep,es].filter(Boolean);
    if(og.length!==3||eg.length!==3)return false;
    const blue=sideFirst()==='our'?og:eg,red=sideFirst()==='our'?eg:og;
    row.append(...blue,...red);
    row.dataset.blueLeft=sideFirst()==='our'?'our':'enemy';
    return true;
  }

  function applyLocalDraftSideOrder(){
    try{
      document.querySelectorAll('#builder #banPhase1 .banRow.iconBan,#builder #banPhase2 .banRow.iconBan').forEach(reorderBanRow);
      reorderPair(document.querySelector('#builder .currentPickGrid'),'#ourPickRows','#enemyPickRows',true);
      reorderPair(document.querySelector('#live .liveBanGrid'),'.liveSide.our','.liveSide.enemy');
      reorderPair(document.querySelector('#live .liveDraftGrid'),'.liveSide.our','.liveSide.enemy');
      const first=sideFirst(),second=other(first);
      document.querySelectorAll('#builder .currentPickGrid,#live .liveBanGrid,#live .liveDraftGrid').forEach(el=>{if(el){el.dataset.blueSide=first;el.dataset.redSide=second}});
      return true;
    }catch(e){console.warn('[v0.15.40] local draft side order apply failed',e);return false}
  }

  function tagOnlinePanels(){
    const grid=document.querySelector('#online .onlineDraftGrid');
    if(grid){
      const panels=[...grid.querySelectorAll(':scope > .onlineTeamPanel')];
      if(panels.length>=2&&!panels.some(x=>x.dataset.onlineTeam)){
        panels[0].dataset.onlineTeam='A';panels[1].dataset.onlineTeam='B';
      }
    }
    const board=document.querySelector('#online .onlineScoreboard');
    if(board){
      const teams=[...board.querySelectorAll(':scope > .onlineTeamScore')];
      if(teams.length>=2&&!teams.some(x=>x.dataset.onlineTeam)){
        teams[0].dataset.onlineTeam='A';teams[1].dataset.onlineTeam='B';
      }
    }
  }

  function applyOnlineBlueRedOrder(){
    try{
      if(typeof onlineState==='undefined'||!onlineState)return false;
      tagOnlinePanels();
      const blue=onlineState.firstTeam==='B'?'B':'A',red=blue==='A'?'B':'A';
      const grid=document.querySelector('#online .onlineDraftGrid');
      if(grid){
        const bp=grid.querySelector(`:scope > .onlineTeamPanel[data-online-team="${blue}"]`),rp=grid.querySelector(`:scope > .onlineTeamPanel[data-online-team="${red}"]`);
        if(bp&&rp){grid.append(bp,rp);grid.dataset.blueTeam=blue;grid.dataset.redTeam=red}
      }
      const board=document.querySelector('#online .onlineScoreboard');
      if(board){
        const bp=board.querySelector(`:scope > .onlineTeamScore[data-online-team="${blue}"]`),rp=board.querySelector(`:scope > .onlineTeamScore[data-online-team="${red}"]`),center=board.querySelector(':scope > .onlineSetCenter');
        if(bp&&rp&&center){
          bp.classList.remove('right');rp.classList.add('right');
          const normalize=(el,isRight)=>{
            const info=el.querySelector(':scope > div'),score=el.querySelector(':scope > .score');
            if(info&&score){if(isRight)el.append(score,info);else el.append(info,score)}
            el.style.textAlign=isRight?'right':'left';
            el.style.justifyContent=isRight?'flex-end':'flex-start';
          };
          normalize(bp,false);normalize(rp,true);
          board.append(bp,center,rp);board.dataset.blueTeam=blue;board.dataset.redTeam=red;
        }
      }
      return true;
    }catch(e){console.warn('[v0.15.40] online draft side order apply failed',e);return false}
  }

  try{
    const oldRenderBuilder=typeof renderBuilder==='function'?renderBuilder:null;
    if(oldRenderBuilder){renderBuilder=function(...args){const r=oldRenderBuilder.apply(this,args);applyLocalDraftSideOrder();return r}}
    const oldRenderLive=typeof renderLive==='function'?renderLive:null;
    if(oldRenderLive){renderLive=function(...args){const r=oldRenderLive.apply(this,args);applyLocalDraftSideOrder();return r}}
    const oldRenderOnline=typeof renderOnline==='function'?renderOnline:null;
    if(oldRenderOnline){renderOnline=function(...args){const r=oldRenderOnline.apply(this,args);applyOnlineBlueRedOrder();return r}}

    // Current/NEXT calculation already follows the standard pro sequence. This patch only
    // makes the visible board consistently BLUE-left / RED-right in every draft workspace.
    applyLocalDraftSideOrder();
    applyOnlineBlueRedOrder();

    window.aramDraftSideOrderV01540={applyLocalDraftSideOrder,applyOnlineBlueRedOrder,localFirst:sideFirst};
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.draft_side_order_v01540={version:'v0.15.40 · BLUE-left / RED-right Draft Layout',sequence_changed:false,local_builder:true,live_draft:true,online_mock_draft:true};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.__ARAM_DRAFT_SIDE_ORDER_V01540__=true;
  }catch(e){
    console.error('[v0.15.40] draft side order patch failed',e);
    window.__ARAM_DRAFT_SIDE_ORDER_V01540__=false;
  }
})();
