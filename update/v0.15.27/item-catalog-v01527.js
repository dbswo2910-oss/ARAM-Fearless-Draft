'use strict';
const https=require('https');
const FALLBACK_VERSION='16.17.1';
let cache=null,pending=null,registered=false;
function getJson(url,redirects=0){
  return new Promise((resolve,reject)=>{
    let u;try{u=new URL(url)}catch(e){reject(e);return}
    if(u.protocol!=='https:'||u.hostname!=='ddragon.leagueoflegends.com'){reject(new Error('허용되지 않은 Data Dragon 호스트'));return}
    const req=https.get(u,{headers:{'User-Agent':'ARAM-Fearless-Draft/0.15.27','Cache-Control':'no-cache'}},res=>{
      const code=Number(res.statusCode)||0;
      if(code>=300&&code<400&&res.headers.location){res.resume();if(redirects>=3){reject(new Error('Data Dragon redirect 초과'));return}let next;try{next=new URL(res.headers.location,u).toString()}catch(e){reject(e);return}getJson(next,redirects+1).then(resolve,reject);return}
      if(code!==200){res.resume();reject(new Error(`Data Dragon HTTP ${code}`));return}
      const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size>8*1024*1024){req.destroy(new Error('Data Dragon 응답 크기 초과'));return}chunks.push(c)});res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch(e){reject(e)}})
    });req.setTimeout(8000,()=>req.destroy(new Error('Data Dragon timeout')));req.on('error',reject)
  })
}
function compact(version,json){
  const data=json?.data&&typeof json.data==='object'?json.data:{},items={};
  for(const [id,it] of Object.entries(data)){
    const name=String(it?.name||''),low=name.toLowerCase(),total=Number(it?.gold?.total)||0,map12=it?.maps?.['12']===true,purchasable=it?.gold?.purchasable!==false,tags=Array.isArray(it?.tags)?it.tags:[],depth=Number(it?.depth)||0,noInto=!Array.isArray(it?.into)||it.into.length===0;
    const excluded=tags.includes('Boots')||tags.includes('Consumable')||/guardian|elixir|potion|trinket|ward|biscuit/.test(low);
    const full=!!(map12&&purchasable&&total>=2000&&!excluded&&(depth>=3||noInto));
    items[String(id)]={name,total,full,map12,purchasable,depth};
  }
  return{ok:true,version,items,count:Object.keys(items).length,loadedAt:Date.now(),source:'Data Dragon realms/kr'}
}
async function fetchCatalog(){
  if(cache?.ok)return cache;if(pending)return pending;
  pending=(async()=>{
    let version='',json=null,error='',realmError='';
    try{const realm=await getJson('https://ddragon.leagueoflegends.com/realms/kr.json');version=String(realm?.n?.item||realm?.v||'')}catch(e){realmError=e?.message||String(e)}
    if(version){try{json=await getJson(`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/data/en_US/item.json`)}catch(e){error=e?.message||String(e)}}
    if(!json){version=FALLBACK_VERSION;try{json=await getJson(`https://ddragon.leagueoflegends.com/cdn/${FALLBACK_VERSION}/data/en_US/item.json`)}catch(e){error=e?.message||String(e)}}
    cache=json?compact(version,json):{ok:false,version:'',items:{},count:0,loadedAt:Date.now(),source:'fallback',error:error||realmError||'Data Dragon item catalog unavailable'};
    pending=null;return cache
  })();return pending
}
function register(ipcMain){if(registered)return;registered=true;ipcMain.handle('desktop:get-item-catalog',()=>fetchCatalog())}
module.exports={register,fetchCatalog,compact,get cache(){return cache}};
