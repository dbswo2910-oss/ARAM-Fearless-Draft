'use strict';
(()=>{
  const V='0.15.55';
  if(window.__ARAM_RANDOM_PICK_DENSITY_V01555__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let timer=0;

  function ensureStyles(){
    if($('#rpPickDensityStyleV01555'))return;
    const st=document.createElement('style');
    st.id='rpPickDensityStyleV01555';
    st.textContent=`
      /* Exact Random Practice pick DOM only. No title/regex section discovery. */
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555{
        display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px!important;margin-top:6px
      }
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555>*{
        min-width:0!important;margin:0!important;padding:8px 10px!important;border-radius:9px!important
      }
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555 *{line-height:1.25}
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555 small,
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555 .muted{font-size:8px!important}
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555 b,
      #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555 strong{font-size:10px!important}

      #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555{
        grid-template-columns:auto minmax(0,1fr) auto!important;row-gap:3px!important;padding:9px 12px!important
      }
      #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555>span{align-self:center}
      #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555>b{
        font-size:12px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555>em{font-size:11px!important}
      #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555>small{
        grid-column:2/4;display:block;min-width:0;color:#a9bfd2;font-size:9px;line-height:1.35;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }

      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px!important;margin-top:6px
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo{
        min-width:0!important;margin:0!important
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:first-child{
        grid-column:1/-1;padding:10px 11px!important;border-width:2px!important;min-height:94px
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:first-child .desc{
        -webkit-line-clamp:2!important;line-height:1.35!important
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2){
        position:relative;padding:7px 10px!important;min-height:64px;background:#0a1727!important
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) .names{
        padding-right:62px!important;font-size:12px!important;line-height:1.25!important;margin-bottom:2px!important
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) .comboScore{
        position:absolute;right:10px;top:9px;font-size:12px!important
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) .desc{
        display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:1!important;
        overflow:hidden!important;line-height:1.3!important;font-size:9px!important;margin-top:3px!important;padding-right:2px
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) .comboIconLine{
        margin-top:2px!important;max-height:24px;overflow:hidden
      }
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) .comboIconLine>*:nth-child(n+4){display:none!important}
      #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:nth-child(n+2) img{
        width:22px!important;height:22px!important
      }

      @media(max-width:1100px){
        #random.rpPickDensityV01555 #comboResults.rpComboGridV01555{grid-template-columns:1fr}
        #random.rpPickDensityV01555 #comboResults.rpComboGridV01555>.combo:first-child{grid-column:auto}
      }
      @media(max-width:760px){
        #random.rpPickDensityV01555 #externalCheck.rpPickStatusV01555{grid-template-columns:1fr}
        #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555{grid-template-columns:1fr!important}
        #random.rpPickDensityV01555 .rpFocusCardV01549.rpFocusV01555>small{grid-column:auto;white-space:normal}
      }
    `;
    document.head.appendChild(st);
  }

  function collapseRepeat(s){
    s=String(s||'').trim();
    if(!s)return s;
    const parts=s.split(/\s*\+\s*/).map(x=>x.trim()).filter(Boolean).map(x=>{
      if(x.length%2===0&&x.slice(0,x.length/2)===x.slice(x.length/2))return x.slice(0,x.length/2);
      const m=x.match(/^(.{1,12})\s+\1$/);return m?m[1]:x;
    });
    return parts.join(' + ');
  }

  function firstComboData(){
    const row=$('#comboResults .combo');
    if(!row)return{name:'1위 조합',score:'',reason:'후보를 입력하면 가장 높은 완성 조합의 핵심 이유를 한 줄로 요약합니다.'};
    const iconText=collapseRepeat(text(row.querySelector('.comboIconLine')));
    const names=collapseRepeat(text(row.querySelector('.names')).replace(/🔒\s*고정.*$/,'').trim());
    const name=iconText&&iconText.length<=80?iconText:(names||'1위 조합');
    const score=text(row.querySelector('.comboScore'));
    let reason=text(row.querySelector('.desc'));
    reason=reason.replace(/^\S+\s*/,'').trim()||'현재 입력 기준 가장 높은 완성 조합입니다.';
    if(reason.length>135)reason=reason.slice(0,132)+'…';
    return{name,score,reason};
  }

  function polishFocus(){
    const card=$('#rpFocusCardV01549');if(!card)return;
    card.classList.add('rpFocusV01555');
    const x=firstComboData();
    const sig=[x.name,x.score,x.reason].join('|');
    if(card.dataset.rp55Sig===sig)return;
    card.dataset.rp55Sig=sig;
    card.innerHTML=`<span>💡 이번 선택의 핵심</span><b>추천 방향: ${esc(x.name)} 우선</b><em>${esc(x.score)}</em><small>${esc(x.reason)}</small>`;
  }

  function markCombos(){
    const results=$('#comboResults');if(!results)return;
    results.classList.add('rpComboGridV01555');
    $$('#comboResults > .combo').forEach((row,i)=>{
      row.classList.toggle('rpComboHeroV01555',i===0);
      row.classList.toggle('rpComboCompactV01555',i>0);
    });
  }

  function sync(){
    const root=$('#random');if(!root)return;
    ensureStyles();
    const pick=root.getAttribute('data-random-mode')!=='ingame';
    root.classList.toggle('rpPickDensityV01555',pick);
    const check=$('#externalCheck');if(check)check.classList.add('rpPickStatusV01555');
    markCombos();polishFocus();
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(sync,45)}
  function start(){
    const root=$('#random');if(!root){setTimeout(start,120);return}
    ensureStyles();sync();
    const watch=['#comboResults','#externalCheck','#poolInputs','#externalInputs','#manualPartyInputs'].map(s=>$(s)).filter(Boolean);
    const mo=new MutationObserver(schedule);watch.forEach(el=>mo.observe(el,{childList:true,subtree:true,characterData:true,attributes:true}));
    document.addEventListener('input',e=>{if(e.target?.closest?.('#random'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#random'))schedule()},true);
    window.__ARAM_RANDOM_PICK_DENSITY_V01555__=true;
    window.aramRandomPickDensityV01555={version:V,refresh:sync,score_logic_changed:false,scope:'exact Random Practice pick density polish'};
  }
  start();
})();
