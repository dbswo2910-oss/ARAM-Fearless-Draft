'use strict';
const https=require('https');
const FALLBACK_VERSION='16.18.1';
const COMMUNITY_ITEMS='https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json';
const CURRENT_GAME_ICON_BASE='https://raw.communitydragon.org/latest/game/assets/items/icons2d/';
const CLIENT_PLUGIN_ICON_BASE='https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/';
let cache=null,pending=null,registered=false;

function allowedHost(host){return host==='ddragon.leagueoflegends.com'||host==='raw.communitydragon.org'}
function getJson(url,redirects=0){
  return new Promise((resolve,reject)=>{
    let u;try{u=new URL(url)}catch(e){reject(e);return}
    if(u.protocol!=='https:'||!allowedHost(u.hostname)){reject(new Error('허용되지 않은 아이템 데이터 호스트'));return}
    const req=https.get(u,{headers:{'User-Agent':'ARAM-Fearless-Draft/0.15.64','Cache-Control':'no-cache'}},res=>{
      const code=Number(res.statusCode)||0;
      if(code>=300&&code<400&&res.headers.location){
        res.resume();
        if(redirects>=3){reject(new Error('아이템 데이터 redirect 초과'));return}
        let next;try{next=new URL(res.headers.location,u).toString()}catch(e){reject(e);return}
        getJson(next,redirects+1).then(resolve,reject);return;
      }
      if(code!==200){res.resume();reject(new Error(`아이템 데이터 HTTP ${code}`));return}
      const chunks=[];let size=0;
      res.on('data',c=>{size+=c.length;if(size>14*1024*1024){req.destroy(new Error('아이템 데이터 응답 크기 초과'));return}chunks.push(c)});
      res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch(e){reject(e)}});
    });
    req.setTimeout(9000,()=>req.destroy(new Error('아이템 데이터 timeout')));req.on('error',reject);
  });
}

function ddragonIconUrl(version,id){return `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/img/item/${encodeURIComponent(id)}.png`}
function iconFile(iconPath){return String(iconPath||'').split('/').pop().toLowerCase()}
function currentGameIconUrl(iconPath){const file=iconFile(iconPath);return file?`${CURRENT_GAME_ICON_BASE}${encodeURIComponent(file)}`:''}
function clientPluginIconUrl(iconPath){const file=iconFile(iconPath);return file?`${CLIENT_PLUGIN_ICON_BASE}${encodeURIComponent(file)}`:''}
function communityIconMap(json){
  const out={};
  for(const row of Array.isArray(json)?json:[]){
    const id=String(Number(row?.id)||'');if(!id)continue;
    const url=currentGameIconUrl(row?.iconPath);if(url)out[id]=url;
  }
  return out;
}
function communityFallbackMap(json){
  const out={};
  for(const row of Array.isArray(json)?json:[]){
    const id=String(Number(row?.id)||'');if(!id)continue;
    const url=clientPluginIconUrl(row?.iconPath);if(url)out[id]=url;
  }
  return out;
}

function compact(version,json,currentIcons={},pluginIcons={}){
  const data=json?.data&&typeof json.data==='object'?json.data:{},items={};
  for(const [id,it] of Object.entries(data)){
    const name=String(it?.name||''),low=name.toLowerCase(),gold=it?.gold||{},total=Number(gold.total)||0,base=Number(gold.base)||0,sell=Number(gold.sell)||0;
    const map12=it?.maps?.['12']===true,purchasable=gold.purchasable!==false,tags=Array.isArray(it?.tags)?it.tags:[],depth=Number(it?.depth)||0;
    const from=Array.isArray(it?.from)?it.from.map(String):[],into=Array.isArray(it?.into)?it.into.map(String):[];
    const noInto=into.length===0,excluded=tags.includes('Consumable')||/elixir|potion|trinket|ward|biscuit/.test(low);
    const full=!!(map12&&purchasable&&total>=2000&&!excluded&&(depth>=3||noInto));
    const primary=currentIcons[String(id)]||'';
    const plugin=pluginIcons[String(id)]||'';
    const dd=ddragonIconUrl(version,id);
    const fallbacks=[plugin,dd].filter((x,i,a)=>x&&x!==primary&&a.indexOf(x)===i);
    items[String(id)]={id:String(id),name,total,base:base||(!from.length?total:0),sell,from,into,full,map12,purchasable,depth,tags,
      iconUrl:primary||plugin||dd,
      iconPrimaryUrl:primary,
      iconFallbackUrls:fallbacks,
      iconSource:primary?'CommunityDragon latest current game asset':(plugin?'CommunityDragon latest client plugin fallback':'Data Dragon current-version fallback')};
  }
  const all=Object.values(items),aram=all.filter(x=>x.map12&&x.purchasable);
  const primaryMapped=aram.filter(x=>!!x.iconPrimaryUrl).length;
  const fallbackOnly=aram.filter(x=>!x.iconPrimaryUrl&&x.iconFallbackUrls.length>0).length;
  const missing=aram.filter(x=>!x.iconUrl).length;
  return{ok:true,version,locale:'ko_KR',items,count:Object.keys(items).length,loadedAt:Date.now(),source:'Data Dragon realms/kr · ko_KR',recipeAware:true,
    iconSource:'CommunityDragon latest /game/assets/items/icons2d current game art',
    iconFallback:'CommunityDragon client-plugin latest → Data Dragon current version',
    iconCount:all.filter(x=>!!x.iconPrimaryUrl).length,
    iconAudit:{aramPurchasable:aram.length,primaryMapped,fallbackOnly,missing},
    cachePolicy:'v0.15.64 renderer cache-bust + legacy art flags invalidated'};
}

async function fetchItemJson(version,locale){
  return getJson(`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/data/${locale}/item.json`);
}

async function fetchCatalog(){
  if(cache?.ok)return cache;if(pending)return pending;
  pending=(async()=>{
    let version='',json=null,error='',realmError='',iconError='',communityRows=[],currentIcons={},pluginIcons={};
    try{communityRows=await getJson(COMMUNITY_ITEMS);currentIcons=communityIconMap(communityRows);pluginIcons=communityFallbackMap(communityRows)}catch(e){iconError=e?.message||String(e)}
    try{const realm=await getJson('https://ddragon.leagueoflegends.com/realms/kr.json');version=String(realm?.n?.item||realm?.v||'')}catch(e){realmError=e?.message||String(e)}
    if(version){
      try{json=await fetchItemJson(version,'ko_KR')}catch(e){error=e?.message||String(e)}
      if(!json){try{json=await fetchItemJson(version,'en_US')}catch(e){error=e?.message||String(e)}}
    }
    if(!json){
      version=FALLBACK_VERSION;
      try{json=await fetchItemJson(version,'ko_KR')}catch(e){error=e?.message||String(e)}
      if(!json){try{json=await fetchItemJson(version,'en_US')}catch(e){error=e?.message||String(e)}}
    }
    cache=json?compact(version,json,currentIcons,pluginIcons):{ok:false,version:'',locale:'',items:{},count:0,loadedAt:Date.now(),source:'fallback',recipeAware:false,
      iconSource:'CommunityDragon latest /game/assets/items/icons2d current game art',iconCount:Object.keys(currentIcons).length,
      iconFallback:'CommunityDragon client-plugin latest → Data Dragon current version',
      iconAudit:{aramPurchasable:0,primaryMapped:0,fallbackOnly:0,missing:0},
      error:error||realmError||'Data Dragon item catalog unavailable',iconError};
    if(cache?.ok&&iconError)cache.iconError=iconError;
    pending=null;return cache;
  })();return pending;
}

function register(ipcMain){if(registered)return;registered=true;ipcMain.handle('desktop:get-item-catalog',()=>fetchCatalog())}
module.exports={register,fetchCatalog,compact,communityIconMap,communityFallbackMap,currentGameIconUrl,clientPluginIconUrl,get cache(){return cache}};
