'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const defaultNorm=s=>String(s??'').replace(/\s+/g,' ').trim();
const defaultKey=s=>defaultNorm(s).toLowerCase();
function itemIdentityRank(id,it){const n=Number(id);let score=0;if(it?.map12===true)score+=100;if(it?.purchasable!==false)score+=40;if(it?.standardLiveId===true||(Number.isFinite(n)&&n>0&&n<10000))score+=30;if(it?.full===true)score+=8;if(Number.isFinite(n)&&n>0&&n<10000)score+=4;return score}
function buildCanonicalNameIndex(catalog,{norm=defaultNorm,key=defaultKey}={}){
  const best=new Map();
  for(const [id,it] of Object.entries(catalog?.items||{})){
    const name=norm(it?.name);if(!name)continue;const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k),row={id:String(id),name,k,score,it};
    if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,row);
  }
  const nameToId=new Map(),rows=[];for(const row of best.values()){nameToId.set(row.k,row.id);rows.push(row)}
  rows.sort((a,b)=>b.name.length-a.name.length||Number(a.id)-Number(b.id));
  return{nameToId,rows,best};
}
module.exports={IMPLEMENTATION_VERSION,itemIdentityRank,buildCanonicalNameIndex,production_active:false,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:false};
