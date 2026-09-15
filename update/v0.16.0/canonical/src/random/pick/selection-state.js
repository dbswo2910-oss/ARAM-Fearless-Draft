'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const DATASET_KEYS=Object.freeze(['selectedCandidate','selectedCandidateScore','selectedCandidateDesc','selectedCandidateAd','selectedCandidateAp']);
function createSelectionState({normalizeName=(v=>String(v||'').trim()),canonicalName=((text)=>String(text||'').trim()),text=(el=>String(el?.textContent||'').trim())}={}){
  function clear(results){if(!results)return false;for(const key of DATASET_KEYS){try{delete results.dataset[key]}catch{}}return true}
  function write(results,{name,profile={},score='-',desc='선택한 후보를 포함한 조합 미리보기입니다.'}={}){
    if(!results)return false;const selected=normalizeName(name);if(!selected)return false;const ad=Number(profile?.adPct),ap=Number(profile?.apPct);const normalized={adPct:Number.isFinite(ad)?ad:50,apPct:Number.isFinite(ap)?ap:50};results.dataset.selectedCandidate=selected;results.dataset.selectedCandidateScore=String(score||'-');results.dataset.selectedCandidateDesc=String(desc||'선택한 후보를 포함한 조합 미리보기입니다.');results.dataset.selectedCandidateAd=String(normalized.adPct);results.dataset.selectedCandidateAp=String(normalized.apPct);return{selected,profile:normalized,score:results.dataset.selectedCandidateScore,desc:results.dataset.selectedCandidateDesc}
  }
  function rowCandidate(row){return normalizeName(row?.dataset?.randomCandidate||row?.dataset?.rp93Candidate||canonicalName(text(row?.querySelector?.('.names')),row))}
  function snapshot(results,options={}){
    if(!results)return null;const selected=normalizeName(results.dataset.selectedCandidate||'');if(!selected)return null;const rows=[...(results.querySelectorAll?.('.combo')||[])].slice(0,5);const row=rows.find(x=>rowCandidate(x)===selected)||null;
    if(!row){if(rows.length&&options.clearMissing!==false){clear(results);return null}const ad=Number(results.dataset.selectedCandidateAd),ap=Number(results.dataset.selectedCandidateAp);return{row:null,name:selected,profile:{adPct:Number.isFinite(ad)?ad:50,apPct:Number.isFinite(ap)?ap:50},score:results.dataset.selectedCandidateScore||'-',desc:results.dataset.selectedCandidateDesc||'선택한 후보를 포함한 조합 미리보기입니다.'}}
    const name=row?.dataset?.randomCandidate||row.dataset?.rp93Candidate||selected,ad=Number(row?.dataset?.randomCandidateAd??row.dataset?.rp93Ad),ap=Number(row?.dataset?.randomCandidateAp??row.dataset?.rp93Ap),score=text(row.querySelector?.('.comboScore'))||text(row.querySelector?.('.rp90Score'))||results.dataset.selectedCandidateScore||'-',desc=text(row.querySelector?.('.desc'))||text(row.querySelector?.('.rp90Desc'))||results.dataset.selectedCandidateDesc||'선택 후보 기준 조합 미리보기입니다.';return{row,name,profile:{adPct:Number.isFinite(ad)?ad:50,apPct:Number.isFinite(ap)?ap:50},score,desc}
  }
  return{clear,write,rowCandidate,snapshot};
}
module.exports={IMPLEMENTATION_VERSION,DATASET_KEYS,createSelectionState,production_active:false,score_logic_changed:false,random_scoring_changed:false};
