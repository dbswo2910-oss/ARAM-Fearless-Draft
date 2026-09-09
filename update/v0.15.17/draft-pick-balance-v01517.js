'use strict';
(()=>{
  const V='0.15.17';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const roleOf=c=>String(c?.['주 역할']||'');
  const f18=(c,k)=>Number(c?.['기능프로필18']?.[k])||0;
  function isRangedCore(c){const r=roleOf(c);return (r==='원딜'||(typeof isMagicCoreProfile==='function'&&isMagicCoreProfile(c)))&&f18(c,'유효 사거리')>=2.6}
  function isMeleeDamageCommit(c){const r=roleOf(c),d=(Number(c?.['유효AD딜'])||0)+(Number(c?.['유효AP딜'])||0);return ['AD브루저','AP브루저','암살자'].includes(r)&&d>=2&&f18(c,'유효 사거리')<=2.25}
  function teamPeak(names,key){const vals=(names||[]).filter(Boolean).map(n=>f18(byName?.[n],key)).sort((a,b)=>b-a);return (vals[0]||0)+(vals[1]||0)*.18}
  function consecutiveOurPick(){try{const p=typeof localDraftProgress==='function'?localDraftProgress():null;return !!(p?.current?.type==='pick'&&p?.next?.type==='pick'&&p.current.side==='our'&&p.next.side==='our')}catch{return false}}
  function architectureAdjustment(c,ownNames=[],enemyNames=[],mode='next',parts={}){
    const own=(ownNames||[]).filter(Boolean),enemy=(enemyNames||[]).filter(Boolean);if(mode==='first'||own.length>=4)return{score:0,why:[],detail:{}};
    const chain=consecutiveOurPick();
    const cnt=typeof rawRoleCounts==='function'?rawRoleCounts(own):{원딜:0,탱커:0,서포터:0,마법코어:0,브루저:0},magic=typeof magicCoreCount==='function'?magicCoreCount(cnt):(cnt.마법코어||0),missingRanged=(Number(cnt.원딜)||0)===0&&magic===0;
    const ownFront=own.filter(n=>{const p=byName?.[n];return roleOf(p)==='탱커'||f18(p,'프론트라인')>=3.5}).length,melee=isMeleeDamageCommit(c),ranged=isRangedCore(c),why=[];let score=0;
    // Early slots should secure a stable ranged damage core before a second conditional melee package.
    if(missingRanged&&ranged){const b=chain?(own.length<=1?4:3):(own.length<=1?8:5);score+=b;why.push(`초반 원거리 코어 확보 +${b}`)}
    if(missingRanged&&ownFront>=1&&melee){const p=chain?(own.length<=1?2:1.5):(own.length<=1?7:4);score-=p;why.push(`원거리 코어 공백 중 근접 캐리 선확정 -${p}`);if(chain)why.push('연속 2픽으로 구조 리스크 완화')}
    if(missingRanged&&ownFront>=1&&roleOf(c)==='탱커'){const p=chain?(own.length<=1?4:2.5):(own.length<=1?5:3);score-=p;why.push(`전열 보유 상태의 2중 전열 -${p}`)}
    // Two revealed ranged/control enemies make a low-range damage slot more committal. Projectile block helps, but does not erase comp cost.
    if(enemy.length>=2&&melee){const er=teamPeak(enemy,'유효 사거리'),ecc=teamPeak(enemy,'CC'),ez=teamPeak(enemy,'공간 장악'),ep=Math.max(teamPeak(enemy,'보호/필'),teamPeak(enemy,'역이니시/디스인게이지')),pressure=Math.max(0,er-3.25)*1.7+Math.max(0,ecc-3.25)*1.25+Math.max(0,Math.max(ez,ep)-3.35)*.9;if(pressure>0){let p=clamp(2.2+pressure,2,6);const block=(c?.['특수태그']||[]).includes('PROJECTILE_BLOCK');if(block)p=Math.max(1,p-2);if(chain)p*=(block?0.55:0.75);p=Math.round(p*10)/10;score-=p;why.push(`장거리·CC 상대로 근접 진입 리스크 -${p.toFixed(1)}`)}}
    // A single conditional duo should not consume an early core slot at full face value; it regains value once the rest of the comp supports it.
    const pair=Number(parts?.aramPair)||0;if(!chain&&missingRanged&&melee&&own.length<=2&&pair>=11){const p=Math.round(Math.min(3,(pair-10)*.45)*10)/10;score-=p;why.push(`조건부 듀오 조기확정 감쇠 -${p.toFixed(1)}`)}
    score=Math.round(clamp(score,-16,10)*10)/10;
    return{score,why,detail:{missingRanged,ownFront,melee,ranged,consecutivePick:chain,enemyRange:teamPeak(enemy,'유효 사거리'),enemyCC:teamPeak(enemy,'CC')}};
  }
  try{
    const oldCandidate=candidateScore;
    candidateScore=function(name,ownNames=state.our,enemyNames=state.enemy,mode='next'){
      const x=oldCandidate(name,ownNames,enemyNames,mode);if(!x||x.score<=-900||mode==='first')return x;
      const a=architectureAdjustment(x.c||byName?.[name],ownNames,enemyNames,mode,x.parts||{});if(!a.score)return x;
      const out={...x,score:Math.round((Number(x.score)+a.score)*10)/10,reason:String(x.reason||'')+(a.why.length?' · '+a.why.join(' · '):''),parts:{...(x.parts||{}),architectureV01517:a.score,architectureDetailV01517:a.detail,architectureWhyV01517:a.why}};
      return out;
    };
    // recommendPicks resolves candidateScore dynamically, but rebind it explicitly for old runtimes/caches.
    recommendPicks=function(mode='next',limit=6){return champs.map(c=>candidateScore(c['챔피언'],state.our,state.enemy,mode)).filter(x=>x&&x.score>-900).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko')).slice(0,limit)};
    const oldBreakdown=pickBreakdownHtml;pickBreakdownHtml=function(x){let h=String(oldBreakdown(x)||''),v=Number(x?.parts?.architectureV01517)||0;if(Math.abs(v)>=1)h+=`<span class="reasonTag ${v<0?'warn':'balance'}">구조안정 ${v>0?'+':''}${v.toFixed(1)}</span>`;return h};
    if(typeof DATA!=='undefined'){
      DATA.version=V;DATA.draft_pick_balance_v01517={version:'v0.15.17 · Early Draft Architecture Guard',scope:['next','late'],principle:'직접 시너지는 유지하되 초반 원거리 코어 공백·근접 캐리 조기확정·상대 장거리/CC 노출을 별도 비용으로 계산하고 연속 2픽이면 즉시 보완 가능성을 반영',consecutive_pick_aware:true,projectile_block_reduces_entry_risk:true,hardcoded_yasuo:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.aramDraftBalanceV01517={architectureAdjustment,isRangedCore,isMeleeDamageCommit,consecutiveOurPick};window.__ARAM_DRAFT_BALANCE_V01517__=true;
  }catch(e){console.error('[v0.15.17] draft pick balance patch failed',e);window.__ARAM_DRAFT_BALANCE_V01517__=false}
})();
