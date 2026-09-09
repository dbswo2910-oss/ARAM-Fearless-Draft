'use strict';
(()=>{
  const V='0.15.17';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const roleOf=c=>String(c?.['주 역할']||'');
  const f18=(c,k)=>Number(c?.['기능프로필18']?.[k])||0;
  const legacy=(c,k)=>Number(c?.[k])||0;
  const tagsOf=c=>new Set(c?.['특수태그']||[]);
  function isStableRangedCore(c){
    if(!c)return false;
    const r=roleOf(c),range=f18(c,'유효 사거리'),dps=f18(c,'지속딜'),poke=f18(c,'포킹'),burst=f18(c,'순간폭딜');
    const carry=(r==='원딜'&&dps>=2.8)||(typeof isMagicCoreProfile==='function'&&isMagicCoreProfile(c)&&Math.max(dps,poke,burst)>=3.15);
    return carry&&range>=2.85;
  }
  function isFrontline(c){return !!c&&(roleOf(c)==='탱커'||f18(c,'프론트라인')>=3.45||legacy(c,'프론트')>=3.7)}
  function isLowRangeCommit(c){
    if(!c)return false;
    const r=roleOf(c),range=f18(c,'유효 사거리'),front=f18(c,'프론트라인'),damage=Math.max(f18(c,'지속딜'),f18(c,'순간폭딜'),f18(c,'다이브/후방 접근'));
    return range<=2.35&&front<3.75&&damage>=3.0&&['AD브루저','AP브루저','브루저','암살자'].includes(r);
  }
  function teamPeak(names,key){const vals=(names||[]).filter(Boolean).map(n=>f18(byName?.[n],key)).sort((a,b)=>b-a);return (vals[0]||0)+(vals[1]||0)*.18+(vals[2]||0)*.06}
  function consecutiveOurPick(){try{const p=typeof localDraftProgress==='function'?localDraftProgress():null;return !!(p?.current?.type==='pick'&&p?.next?.type==='pick'&&p.current.side==='our'&&p.next.side==='our')}catch{return false}}
  function teamArchitecture(names=[],enemyNames=[]){
    const own=(names||[]).filter(Boolean),profiles=own.map(n=>byName?.[n]).filter(Boolean),m=typeof compMetrics==='function'?compMetrics(own):{},enemy=(enemyNames||[]).filter(Boolean);
    const stableRanged=profiles.filter(isStableRangedCore).length,frontline=profiles.filter(isFrontline).length,lowRangeCommit=profiles.filter(isLowRangeCommit).length;
    const dps=Number(m?.['지속딜'])||0,engage=(Number(m?.['이니시'])||0)+(Number(m?.['캐치'])||0)*.45,peel=(Number(m?.['보호'])||0)+(Number(m?.['역이니시'])||0),clear=Number(m?.['라클'])||0;
    const enemyDive=(Number((typeof compMetrics==='function'?compMetrics(enemy):{})?.['다이브'])||0)+(Number((typeof compMetrics==='function'?compMetrics(enemy):{})?.['이니시'])||0)*.45;
    let deficit=0;const gaps=[];
    if(!stableRanged){deficit+=5.5;gaps.push('안정 원거리 딜코어')}
    if(!frontline){deficit+=4.5;gaps.push('전열')}
    if(dps<5.5){const x=Math.min(3.1,(5.5-dps)*.56);deficit+=x;if(x>=1.2)gaps.push('지속딜')}
    if(engage<4.8){const x=Math.min(2.4,(4.8-engage)*.45);deficit+=x;if(x>=1.0)gaps.push('시동/캐치')}
    if(clear<4.2){const x=Math.min(1.8,(4.2-clear)*.38);deficit+=x;if(x>=.9)gaps.push('라클')}
    if(enemyDive>=8&&peel<5.5){const x=Math.min(2.6,(5.5-peel)*.4*(.75+Math.min(1,enemyDive/16)));deficit+=x;if(x>=1)gaps.push('후방 보호')}
    return{own,m,stableRanged,frontline,lowRangeCommit,dps,engage,peel,clear,enemyDive,deficit,gaps};
  }
  function enemyEntryPressure(enemyNames=[]){
    const enemy=(enemyNames||[]).filter(Boolean);if(!enemy.length)return 0;
    const er=teamPeak(enemy,'유효 사거리'),ecc=teamPeak(enemy,'CC'),ez=teamPeak(enemy,'공간 장악'),ep=Math.max(teamPeak(enemy,'보호/필'),teamPeak(enemy,'역이니시/디스인게이지'));
    return clamp(Math.max(0,er-3.0)*1.15+Math.max(0,ecc-3.1)*.9+Math.max(0,Math.max(ez,ep)-3.3)*.65,0,6);
  }
  function architectureAdjustment(c,ownNames=[],enemyNames=[],mode='next',parts={}){
    const own=(ownNames||[]).filter(Boolean),enemy=(enemyNames||[]).filter(Boolean);if(!c||mode==='first'||own.length>=4)return{score:0,why:[],detail:{}};
    const chain=consecutiveOurPick(),before=teamArchitecture(own,enemy),after=teamArchitecture([...own,c['챔피언']],enemy),why=[];
    const stageScale=mode==='late'?.72:1,chainScale=chain?.72:1;
    let score=(before.deficit-after.deficit)*.9;
    if(before.deficit-after.deficit>=2.3)why.push(`핵심 구조 결손 보완 +${((before.deficit-after.deficit)*.9).toFixed(1)}`);
    if(before.stableRanged===0&&after.stableRanged===0&&isLowRangeCommit(c)){
      let p=(own.length<=1?4.4:3.0)*chainScale;
      if(before.frontline>=1)p+=1.0*chainScale;
      score-=p;why.push(`원거리 코어 공백 중 근접 캐리 선확정 -${p.toFixed(1)}`);if(chain)why.push('연속 2픽으로 즉시 보완 가능');
    }
    if(before.stableRanged===0&&before.frontline>=1&&isFrontline(c)&&!isStableRangedCore(c)){
      const p=(own.length<=1?3.2:2.0)*chainScale;score-=p;why.push(`딜코어 전 전열 중복 -${p.toFixed(1)}`);
    }
    if(before.lowRangeCommit>=1&&isLowRangeCommit(c)&&before.stableRanged===0){const p=2.8*chainScale;score-=p;why.push(`저사거리 딜축 중복 -${p.toFixed(1)}`)}
    if(enemy.length>=2&&isLowRangeCommit(c)){
      const pressure=enemyEntryPressure(enemy);if(pressure>.5){let p=1.25+pressure*.72;const tags=tagsOf(c);if(tags.has('PROJECTILE_BLOCK'))p-=1.35;if(before.frontline>=1)p-=.45;if(chain)p*=.72;p=clamp(p,.6,5.2);score-=p;why.push(`상대 사거리·CC 진입비용 -${p.toFixed(1)}`)}
    }
    const synContrib=Math.max(0,Number(parts?.contrib?.synergy)||0),criticalAfter=(after.stableRanged===0?1:0)+(after.frontline===0&&own.length>=2?1:0)+(after.dps<4.2&&own.length>=2?1:0);
    if(synContrib>20&&criticalAfter>0){const p=Math.min(3.8,(synContrib-20)*.16*criticalAfter)*chainScale;score-=p;if(p>=.7)why.push(`시너지 과대우선 방지 -${p.toFixed(1)}`)}
    if(before.stableRanged>=1&&before.frontline>=1&&before.dps>=6.5&&before.engage>=5.5&&before.peel>=5.0&&after.deficit<before.deficit){score-=Math.min(1.5,(before.deficit-after.deficit)*.4)}
    score=Math.round(clamp(score*stageScale,-16,10)*10)/10;
    return{score,why,detail:{before:{deficit:+before.deficit.toFixed(2),gaps:before.gaps,stableRanged:before.stableRanged,frontline:before.frontline,lowRangeCommit:before.lowRangeCommit},after:{deficit:+after.deficit.toFixed(2),gaps:after.gaps,stableRanged:after.stableRanged,frontline:after.frontline,lowRangeCommit:after.lowRangeCommit},consecutivePick:chain,enemyEntryPressure:+enemyEntryPressure(enemy).toFixed(2),synergyContribution:+synContrib.toFixed(2)}};
  }
  function removeProgramCriteria(){
    try{
      document.querySelectorAll('.dataInfoPanel').forEach(panel=>{const t=String(panel.querySelector?.('.title')?.textContent||'').trim();if(t==='프로그램 기준')panel.remove()});
      document.querySelectorAll('.panel').forEach(panel=>{const t=String(panel.querySelector?.('.title')?.textContent||'').trim();if(t==='프로그램 기준')panel.remove()});
    }catch{}
  }
  try{
    const oldCandidate=candidateScore;
    candidateScore=function(name,ownNames=state.our,enemyNames=state.enemy,mode='next'){
      const x=oldCandidate(name,ownNames,enemyNames,mode);if(!x||x.score<=-900||mode==='first')return x;
      const a=architectureAdjustment(x.c||byName?.[name],ownNames,enemyNames,mode,x.parts||{});if(!a.score)return x;
      const oldPolicy=Number(x.parts?.policy)||0,oldContrib=x.parts?.contrib||{};return{...x,score:Math.round((Number(x.score)+a.score)*10)/10,reason:String(x.reason||'')+(a.why.length?' · '+a.why.join(' · '):''),parts:{...(x.parts||{}),policyBaseV01517:oldPolicy,policy:oldPolicy+a.score,architectureV01517:a.score,architectureDetailV01517:a.detail,architectureWhyV01517:a.why,contrib:{...oldContrib,architecture:a.score}}};
    };
    recommendPicks=function(mode='next',limit=6){return champs.map(c=>candidateScore(c['챔피언'],state.our,state.enemy,mode)).filter(x=>x&&x.score>-900).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko')).slice(0,limit)};
    const oldBreakdown=pickBreakdownHtml;pickBreakdownHtml=function(x){let h=String(oldBreakdown(x)||''),v=Number(x?.parts?.architectureV01517)||0;if(Math.abs(v)>=1)h+=`<span class="reasonTag ${v<0?'warn':'balance'}">구조보정 ${v>0?'+':''}${v.toFixed(1)}</span>`;return h};
    removeProgramCriteria();if(typeof setTimeout==='function'){setTimeout(removeProgramCriteria,0);setTimeout(removeProgramCriteria,500);}
    if(typeof DATA!=='undefined'){
      DATA.version=V;DATA.draft_pick_balance_v01517={version:'v0.15.17 · Draft Architecture Guard v2',scope:['next','late'],principle:'챔피언 이름 하드코딩 없이 현재 조합의 안정 원거리 딜코어·전열·지속딜·시동·라클·후방보호 결손을 전후 비교하고, 공개된 상대 사거리/CC/공간장악 및 시너지 과대우선까지 함께 가격화',consecutive_pick_aware:true,projectile_block_reduces_entry_risk:true,synergy_is_evidence_not_override:true,hardcoded_champion:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.aramDraftBalanceV01517={architectureAdjustment,teamArchitecture,isStableRangedCore,isFrontline,isLowRangeCommit,enemyEntryPressure,consecutiveOurPick,removeProgramCriteria};window.__ARAM_DRAFT_BALANCE_V01517__=true;
  }catch(e){console.error('[v0.15.17] draft pick balance patch failed',e);window.__ARAM_DRAFT_BALANCE_V01517__=false}
})();
