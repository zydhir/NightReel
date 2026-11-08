// Nightreel · Adsterra integration (Social Bar, Native Banner, 160×300 Sidebar Banner & Smartlink) + viewer protections.
// Configured out-of-the-box with Nightreel's Adsterra units and manageable live in #admin -> Ads (Supabase site_config key "ads").
(()=>{
const G=typeof window!=='undefined'?window:globalThis;
const D=typeof document!=='undefined'?document:null;

const SMART_MODES=['play','button','off'];
const PROTECTED_ROUTES=new Set(['auth','admin','privacy','terms','dmca','contact']);

const DEFAULTS=Object.assign({
  active:true,
  socialOn:true,
  socialSrc:'https://bancadeltempoidea.org/14/f5a14287da5fbb224d2b08c6981c796a',
  nativeOn:true,
  nativeSrc:'https://bancadeltempoidea.org/21/c7aae407c5d2606d79f9479f53add952',
  nativeContainerId:'container-c7aae407c5d2606d79f9479f53add952',
  bannerOn:true,
  bannerSrc:'https://bancadeltempoidea.org/22/17b8ed40c10ad08c3e5561c0f9f32bb8',
  bannerKey:'17b8ed40c10ad08c3e5561c0f9f32bb8',
  bannerWidth:160,
  bannerHeight:300,
  smartMode:'play',          // 'play' = On Play (capped) + Partner link | 'button' = Partner link only | 'off' = Disabled
  smartCapHours:12,          // Hours between automatic Play-click Smartlink tabs per browser
  smartUrl:'https://directyp.org/4/6906911021995628340167e682dddcd1',
  skipAdmin:false,           // Optional: pause ads when signed in as verified site admin
  skipKids:true,             // Always keep Kids profiles ad-free
  skipAuth:true              // Keep sign-in, admin and legal pages ad-free
},G.NR_ADSTERRA_DEFAULTS||{});

function escHtml(v){
  return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function cleanRaw(raw){
  let s=String(raw??'').trim();
  if(!s)return '';
  // Unescape HTML entities if pasted from rich-text/markdown notes
  if(/&(?:lt|gt|quot|#39|amp);/i.test(s)){
    s=s.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&amp;/gi,'&');
  }
  // Unwrap markdown links like [https://example.com](https://example.com)
  s=s.replace(/\[(https?:\/\/[^\]\s]+)\]\((https?:\/\/[^)\s]+)\)/gi,'$1');
  return s.trim();
}

function parseHttpsUrl(raw){
  let u=cleanRaw(raw).replace(/^["']|["']$/g,'').trim();
  if(!u)return {ok:true,url:'',host:''};
  if(u.startsWith('//'))u='https:'+u;
  let parsed;
  try{parsed=new URL(u)}catch(e){
    return {ok:false,url:'',host:'',error:'Enter a valid https:// URL from Adsterra.'};
  }
  if(parsed.protocol!=='https:'||!parsed.hostname.includes('.')||parsed.username||parsed.password||parsed.href.length>1024){
    return {ok:false,url:'',host:'',error:'Adsterra URL must use https:// on a valid domain.'};
  }
  return {ok:true,url:parsed.href,host:parsed.hostname};
}

function extractFirstScriptSrc(text){
  const re=/<\s*script\b([^>]*)>/gi;
  let m;
  while((m=re.exec(text))){
    const s=/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/i.exec(m[1]);
    if(s)return (s[1]||s[2]||s[3]||'').trim();
  }
  return '';
}

function parseSocialInput(raw){
  const text=cleanRaw(raw);
  if(!text)return {ok:true,src:'',host:''};
  const candidate=text.includes('<')?extractFirstScriptSrc(text):text;
  if(!candidate)return {ok:false,src:'',host:'',error:'Paste your Adsterra Social Bar <script src="…"> tag or https:// URL.'};
  const u=parseHttpsUrl(candidate);
  return u.ok?{ok:true,src:u.url,host:u.host}:{ok:false,src:'',host:'',error:u.error};
}

function parseNativeInput(raw,fallbackContainerId=''){
  const text=cleanRaw(raw);
  if(!text)return {ok:true,src:'',containerId:'',host:''};
  const candidate=text.includes('<')?extractFirstScriptSrc(text):text;
  if(!candidate)return {ok:false,src:'',containerId:'',host:'',error:'Paste your Adsterra Native Banner snippet or https:// script URL.'};
  const u=parseHttpsUrl(candidate);
  if(!u.ok)return {ok:false,src:'',containerId:'',host:'',error:u.error};
  const divMatch=/\bid\s*=\s*(?:"(container-[\w-]+)"|'(container-[\w-]+)')/i.exec(text);
  const keyMatch=/\/([a-f0-9]{32})(?:\/|$|\?|\.js)/i.exec(u.url);
  let cid=(divMatch&&(divMatch[1]||divMatch[2]))||String(fallbackContainerId||'').trim()||(keyMatch?'container-'+keyMatch[1]:'');
  if(!cid||!/^container-[\w-]{4,80}$/.test(cid)){
    return {ok:false,src:'',containerId:'',host:'',error:'Could not detect a container-… ID. Paste the full Native Banner snippet including <div id="container-…"></div>.'};
  }
  return {ok:true,src:u.url,containerId:cid,host:u.host};
}

function parseBannerInput(raw,fallback={}){
  const text=cleanRaw(raw);
  if(!text)return {ok:true,src:'',key:'',width:160,height:300,host:''};
  const candidate=text.includes('<')?extractFirstScriptSrc(text):text;
  if(!candidate)return {ok:false,src:'',key:'',width:160,height:300,host:'',error:'Paste your Adsterra Banner snippet or https:// script URL.'};
  const u=parseHttpsUrl(candidate);
  if(!u.ok)return {ok:false,src:'',key:'',width:160,height:300,host:'',error:u.error};
  const keyInOpts=/['"]?key['"]?\s*:\s*['"]([a-f0-9]{16,64})['"]/i.exec(text);
  const keyInUrl=/\/([a-f0-9]{32})(?:\/|$|\?|\.js)/i.exec(u.url);
  const key=(keyInOpts&&keyInOpts[1])||(keyInUrl&&keyInUrl[1])||String(fallback.key||'').trim();
  if(!key||!/^[a-f0-9]{16,64}$/i.test(key)){
    return {ok:false,src:'',key:'',width:160,height:300,host:'',error:'Could not detect the 32-character Adsterra banner key.'};
  }
  const wMatch=/['"]?width['"]?\s*:\s*(\d{2,4})/i.exec(text);
  const hMatch=/['"]?height['"]?\s*:\s*(\d{2,4})/i.exec(text);
  const clamp=(n,def)=>Math.max(50,Math.min(1200,Math.floor(Number(n)||def)));
  const width=clamp(wMatch?wMatch[1]:fallback.width,160);
  const height=clamp(hMatch?hMatch[1]:fallback.height,300);
  return {ok:true,src:u.url,key,width,height,host:u.host};
}

function parseSmartlinkInput(raw){
  const text=cleanRaw(raw);
  if(!text)return {ok:true,url:'',host:''};
  const hrefMatch=/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(text);
  const u=parseHttpsUrl(hrefMatch?(hrefMatch[1]||hrefMatch[2]):text);
  return u.ok?u:{ok:false,url:'',host:'',error:u.error};
}

function normalizeConfig(raw,base=DEFAULTS){
  const r=(raw&&typeof raw==='object')?raw:{};
  const soc=parseSocialInput(r.socialSrc!==undefined?r.socialSrc:base.socialSrc);
  const nat=parseNativeInput(
    r.nativeSrc!==undefined?r.nativeSrc:base.nativeSrc,
    r.nativeContainerId!==undefined?r.nativeContainerId:base.nativeContainerId
  );
  const ban=parseBannerInput(r.bannerSrc!==undefined?r.bannerSrc:base.bannerSrc,{
    key:r.bannerKey!==undefined?r.bannerKey:base.bannerKey,
    width:r.bannerWidth!==undefined?r.bannerWidth:base.bannerWidth,
    height:r.bannerHeight!==undefined?r.bannerHeight:base.bannerHeight
  });
  const sl=parseSmartlinkInput(r.smartUrl!==undefined?r.smartUrl:base.smartUrl);
  const cap=[4,12,24].includes(+r.smartCapHours)?+r.smartCapHours:(+base.smartCapHours||12);
  return {
    active:r.active!==undefined?!!r.active:!!base.active,
    socialOn:r.socialOn!==undefined?!!r.socialOn:(base.socialOn!==false),
    socialSrc:soc.ok?soc.src:String(r.socialSrc??base.socialSrc??'').trim(),
    nativeOn:r.nativeOn!==undefined?!!r.nativeOn:(base.nativeOn!==false),
    nativeSrc:nat.ok?nat.src:String(r.nativeSrc??base.nativeSrc??'').trim(),
    nativeContainerId:nat.ok?nat.containerId:String(r.nativeContainerId??base.nativeContainerId??'').trim(),
    bannerOn:r.bannerOn!==undefined?!!r.bannerOn:(base.bannerOn!==false),
    bannerSrc:ban.ok?ban.src:String(r.bannerSrc??base.bannerSrc??'').trim(),
    bannerKey:ban.ok?ban.key:String(r.bannerKey??base.bannerKey??'').trim(),
    bannerWidth:ban.ok?ban.width:(+base.bannerWidth||160),
    bannerHeight:ban.ok?ban.height:(+base.bannerHeight||300),
    smartMode:SMART_MODES.includes(r.smartMode)?r.smartMode:(base.smartMode||'play'),
    smartCapHours:cap,
    smartUrl:sl.ok?sl.url:String(r.smartUrl??base.smartUrl??'').trim(),
    skipAdmin:r.skipAdmin!==undefined?!!r.skipAdmin:!!base.skipAdmin,
    skipKids:r.skipKids!==undefined?!!r.skipKids:(base.skipKids!==false),
    skipAuth:r.skipAuth!==undefined?!!r.skipAuth:(base.skipAuth!==false)
  };
}

function buildHtmlSnippet(rawCfg){
  const c=normalizeConfig(rawCfg);
  const soc=parseSocialInput(c.socialSrc);
  const nat=parseNativeInput(c.nativeSrc,c.nativeContainerId);
  const ban=parseBannerInput(c.bannerSrc,{key:c.bannerKey,width:c.bannerWidth,height:c.bannerHeight});
  const sl=parseSmartlinkInput(c.smartUrl);
  const out=[];
  if(c.socialOn&&soc.ok&&soc.src){
    out.push(`<!-- Adsterra Social Bar -->\n<script data-cfasync="false" src="${escHtml(soc.src)}"></script>`);
  }
  if(c.nativeOn&&nat.ok&&nat.src){
    out.push(`<!-- Adsterra Native Banner -->\n<script async="async" data-cfasync="false" src="${escHtml(nat.src)}"></script>\n<div id="${escHtml(nat.containerId)}"></div>`);
  }
  if(c.bannerOn&&ban.ok&&ban.src){
    out.push(`<!-- Adsterra ${ban.width}x${ban.height} Banner -->\n<script>\n  atOptions = {\n    'key' : '${escHtml(ban.key)}',\n    'format' : 'iframe',\n    'height' : ${ban.height},\n    'width' : ${ban.width},\n    'params' : {}\n  };\n</script>\n<script src="${escHtml(ban.src)}"></script>`);
  }
  if(c.smartMode!=='off'&&sl.ok&&sl.url){
    out.push(`<!-- Adsterra Smartlink -->\n<!-- ${escHtml(sl.url)} -->`);
  }
  return out.join('\n\n');
}

// ---- Runtime state ----
const cached=typeof store!=='undefined'&&store&&store.get?store.get('nr_ads_cfg_v2',null):null;
let cfg=normalizeConfig(cached&&cached.value?cached.value:null,DEFAULTS);
let updatedAt=(cached&&cached.updated_at)||'';
let remoteLoaded=false;
let adminResolved=false;
let resolveAdminWait=null;
const adminWaitPromise=new Promise(r=>{resolveAdminWait=r});
let detailBannerTimer=0;
const listeners=new Set();

const slots={
  social:{state:'idle',src:'',host:''},
  native:{state:'idle',src:'',host:''},
  banner:{state:'idle',src:'',host:''},
  smart:{opens:0}
};

function emit(){
  listeners.forEach(fn=>{try{fn()}catch(e){}});
}

function currentRoute(){
  if(!G.location)return 'home';
  const h=String(G.location.hash||'').replace(/^#/,'').trim();
  return h||'home';
}

function isKidsProfile(u){
  if(!u)return false;
  if(u.kids||u.kid||(u.st&&(u.st.kids||u.st.kid)))return true;
  return /^kids?$/i.test(String(u.name||'').trim());
}

function hasAnyEnabledUnit(c=cfg){
  const soc=parseSocialInput(c.socialSrc);
  const nat=parseNativeInput(c.nativeSrc,c.nativeContainerId);
  const ban=parseBannerInput(c.bannerSrc,{key:c.bannerKey,width:c.bannerWidth,height:c.bannerHeight});
  const sl=parseSmartlinkInput(c.smartUrl);
  return (c.socialOn&&soc.ok&&!!soc.src)||(c.nativeOn&&nat.ok&&!!nat.src)||(c.bannerOn&&ban.ok&&!!ban.src)||(c.smartMode!=='off'&&sl.ok&&!!sl.url);
}

function gateReason(){
  if(!cfg.active)return {ok:false,code:'disabled',reason:'Ads are turned off'};
  if(!hasAnyEnabledUnit(cfg))return {ok:false,code:'unconfigured',reason:'All ad formats are turned off or empty'};
  if(cfg.skipAdmin&&G.NR_ADMIN)return {ok:false,code:'admin',reason:'Paused for your admin account'};
  const u=typeof me==='function'?me():null;
  if(cfg.skipKids&&isKidsProfile(u))return {ok:false,code:'kids',reason:'Paused on Kids profile'};
  if(cfg.skipAuth&&PROTECTED_ROUTES.has(currentRoute()))return {ok:false,code:'route',reason:'Paused on #'+(currentRoute())+' page'};
  return {ok:true,code:'active',reason:'Active on this page'};
}

// ---- Persistent Native Banner DOM management ----
let nativeObserverAttached=false;
function getNativeSection(){
  if(!D)return null;
  let sec=D.getElementById('nr-native-ad');
  if(!sec&&D.body){
    sec=D.createElement('section');
    sec.id='nr-native-ad';
    sec.className='nr-ad-native';
    sec.setAttribute('aria-label','Sponsored');
    sec.hidden=true;
    sec.innerHTML='<div class="nr-ad-head"><span>Sponsored</span></div><div></div>';
    const ft=D.querySelector('footer');
    if(ft&&ft.parentNode)ft.parentNode.insertBefore(sec,ft);
    else D.body.appendChild(sec);
  }
  return sec;
}

function parkNative(){
  const sec=getNativeSection();
  if(!sec||!D)return;
  const app=D.getElementById('app');
  if(app&&app.contains(sec)&&app.parentNode){
    app.parentNode.insertBefore(sec,app.nextSibling);
  }
}

function dockNative(){
  const sec=getNativeSection();
  if(!sec||!D)return;
  const gate=gateReason();
  const nat=parseNativeInput(cfg.nativeSrc,cfg.nativeContainerId);
  if(!gate.ok||!cfg.nativeOn||!nat.ok||!nat.src){
    parkNative();
    sec.hidden=true;
    return;
  }
  // Ensure inner container ID matches configured Adsterra container ID
  let inner=sec.lastElementChild;
  if(!inner||inner.classList?.contains('nr-ad-head')){
    inner=D.createElement('div');
    sec.appendChild(inner);
  }
  if(inner.id!==nat.containerId)inner.id=nat.containerId;
  const syncFilled=()=>sec.classList.toggle('has-ad',inner.children&&inner.children.length>0);
  syncFilled();
  if(!nativeObserverAttached&&typeof MutationObserver!=='undefined'){
    nativeObserverAttached=true;
    new MutationObserver(syncFilled).observe(inner,{childList:true,subtree:true});
  }

  // On Home (once catalog has loaded and not searching), place right after "Browse by mood" (or 3rd row) for high visibility
  const route=currentRoute();
  const app=D.getElementById('app');
  const searching=typeof q!=='undefined'&&!!q;
  const homeReady=typeof LD==='undefined'?true:!!LD;
  if(route==='home'&&!searching&&homeReady&&app){
    const tiles=app.querySelector('.tiles');
    const moodRow=tiles&&tiles.closest?tiles.closest('.row'):null;
    const rows=app.querySelectorAll?app.querySelectorAll('.row'):[];
    const anchor=moodRow||(rows.length>=3?rows[2]:null);
    if(anchor&&anchor.parentNode){
      anchor.parentNode.insertBefore(sec,anchor.nextSibling);
    }else parkNative();
  }else{
    parkNative();
  }
  sec.hidden=false;

  // Inject Native Banner script once (after container is unhidden so width measurement succeeds)
  if(slots.native.src!==nat.src||(slots.native.state!=='loading'&&slots.native.state!=='loaded')){
    const existing=D.querySelector('script[data-nr-ad="native"]');
    if(existing)existing.remove();
    const s=D.createElement('script');
    s.async=true;
    s.setAttribute('async','async');
    s.setAttribute('data-cfasync','false');
    s.dataset.nrAd='native';
    slots.native={state:'loading',src:nat.src,host:nat.host};
    s.onload=()=>{slots.native.state='loaded';syncFilled();emit()};
    s.onerror=()=>{slots.native.state='blocked';sec.classList.remove('has-ad');emit()};
    s.src=nat.src;
    (D.body||D.head).appendChild(s);
  }
}

// ---- Social Bar ----
function syncSocial(){
  if(!D)return;
  const gate=gateReason();
  if(D.body&&D.body.classList)D.body.classList.toggle('nr-ads-paused',!gate.ok||!cfg.socialOn);
  const soc=parseSocialInput(cfg.socialSrc);
  if(!gate.ok||!cfg.socialOn||!soc.ok||!soc.src)return;
  if(slots.social.src===soc.src&&(slots.social.state==='loading'||slots.social.state==='loaded'))return;
  const existing=D.querySelector('script[data-nr-ad="social"]');
  if(existing)existing.remove();
  const s=D.createElement('script');
  s.async=true;
  s.setAttribute('data-cfasync','false');
  s.dataset.nrAd='social';
  slots.social={state:'loading',src:soc.src,host:soc.host};
  s.onload=()=>{slots.social.state='loaded';emit()};
  s.onerror=()=>{slots.social.state='blocked';emit()};
  s.src=soc.src;
  (D.body||D.head).appendChild(s);
}

// ---- Title Detail: 160×300 Sidebar Banner & Partner Smartlink ----
function renderBannerBox(aside,ban){
  if(!D||!aside||aside.querySelector('.nr-ad-160'))return;
  const box=D.createElement('div');
  box.className='nr-ad-box nr-ad-160';
  box.setAttribute('aria-label','Sponsored');
  const lbl=D.createElement('span');
  lbl.className='nr-ad-lbl';
  lbl.textContent='Sponsored';
  box.appendChild(lbl);

  const frame=D.createElement('iframe');
  frame.width=String(ban.width);
  frame.height=String(ban.height);
  frame.title='Sponsored advertisement';
  frame.setAttribute('scrolling','no');
  frame.setAttribute('frameborder','0');
  frame.style.cssText=`width:${ban.width}px;height:${ban.height}px;border:0;overflow:hidden;display:block;border-radius:10px`;
  box.appendChild(frame);
  aside.appendChild(box);

  slots.banner={state:'loading',src:ban.src,host:ban.host};
  G.__nrAdBannerState=ok=>{
    slots.banner.state=ok?'loaded':'blocked';
    if(!ok)box.hidden=true;
    emit();
  };

  const optsJson=JSON.stringify({key:ban.key,format:'iframe',height:ban.height,width:ban.width,params:{}});
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${ban.width}px;height:${ban.height}px;overflow:hidden;background:transparent}</style></head><body><script>window.atOptions=${optsJson};<\/script><script data-cfasync="false" src="${escHtml(ban.src)}" onload="parent.__nrAdBannerState&&parent.__nrAdBannerState(1)" onerror="parent.__nrAdBannerState&&parent.__nrAdBannerState(0)"><\/script></body></html>`;
  try{
    const doc=frame.contentDocument||(frame.contentWindow&&frame.contentWindow.document);
    if(doc){doc.open();doc.write(html);doc.close();return}
  }catch(e){}
  frame.srcdoc=html;
}

function mountDetailAds(id,keep){
  if(!D)return;
  clearTimeout(detailBannerTimer);
  const gate=gateReason();
  if(!gate.ok)return;
  const aside=D.querySelector('#md .ov2 aside');
  if(!aside)return;

  // 1. Subtle partner Smartlink inside "Look it up" links
  const sl=parseSmartlinkInput(cfg.smartUrl);
  if(cfg.smartMode!=='off'&&sl.ok&&sl.url&&!aside.querySelector('.nr-ad-slink')){
    const linksBox=aside.querySelector('.v3links');
    const extIcon=typeof I==='function'?I('external'):'↗';
    const linkHtml=`<a class="nr-ad-slink" href="${escHtml(sl.url)}" target="_blank" rel="noopener noreferrer sponsored">Partner offer ${extIcon}</a>`;
    if(linksBox&&linksBox.insertAdjacentHTML)linksBox.insertAdjacentHTML('beforeend',linkHtml);
  }

  // 2. 160×300 Banner inside aside (wait briefly if hyd(id) is about to re-render #md)
  const ban=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  if(!cfg.bannerOn||!ban.ok||!ban.src)return;
  const c=(typeof C!=='undefined'&&Array.isArray(C))?C[id]:null;
  if(c&&!c.v3&&!keep){
    detailBannerTimer=setTimeout(()=>{
      const a2=D.querySelector('#md .ov2 aside');
      if(a2&&gateReason().ok)renderBannerBox(a2,ban);
    },550);
    return;
  }
  renderBannerBox(aside,ban);
}

// ---- Play-click Smartlink (frequency-capped) ----
function triggerPlaySmartlink(){
  const gate=gateReason();
  if(!gate.ok||cfg.smartMode!=='play')return false;
  const sl=parseSmartlinkInput(cfg.smartUrl);
  if(!sl.ok||!sl.url)return false;
  if(typeof me==='function'&&!me())return false;
  const capMs=Math.max(1,Number(cfg.smartCapHours)||12)*3600*1000;
  const last=typeof store!=='undefined'&&store&&store.get?Number(store.get('nr_ad_sl_ts',0))||0:0;
  const now=Date.now();
  if(now-last<capMs)return false;
  if(typeof store!=='undefined'&&store&&store.set)store.set('nr_ad_sl_ts',now);
  slots.smart.opens++;
  try{if(typeof G.open==='function')G.open(sl.url,'_blank','noopener,noreferrer')}catch(e){}
  emit();
  return true;
}

function evaluate(){
  syncSocial();
  dockNative();
  emit();
  return gateReason();
}

function setConfig(nextCfg,stamp){
  cfg=normalizeConfig(nextCfg,DEFAULTS);
  if(stamp!==undefined)updatedAt=stamp||'';
  if(typeof store!=='undefined'&&store&&store.set){
    store.set('nr_ads_cfg_v2',{value:cfg,updated_at:updatedAt});
  }
  evaluate();
  return cfg;
}

async function loadRemote(){
  if(typeof SB==='undefined'||!SB)return cfg;
  try{
    const {data,error}=await SB.from('site_config').select('value,updated_at').eq('key','ads').maybeSingle();
    remoteLoaded=true;
    if(!error&&data&&data.value&&typeof data.value==='object'){
      // Only apply remote config if it matches our Adsterra schema (or has active explicitly saved)
      if('socialSrc' in data.value||'nativeSrc' in data.value||'bannerSrc' in data.value||'smartUrl' in data.value){
        setConfig(data.value,data.updated_at||'');
      }
    }
  }catch(e){}
  return cfg;
}

async function startup(){
  if(typeof SB!=='undefined'&&SB&&SB.auth&&typeof SB.auth.getSession==='function'&&cfg.skipAdmin){
    try{
      const {data}=await SB.auth.getSession();
      if(data&&data.session&&data.session.user&&!adminResolved){
        await Promise.race([adminWaitPromise,new Promise(r=>setTimeout(r,1500))]);
      }
    }catch(e){}
  }
  evaluate();
  await loadRemote();
  evaluate();
}

function status(){
  const social=parseSocialInput(cfg.socialSrc);
  const native=parseNativeInput(cfg.nativeSrc,cfg.nativeContainerId);
  const banner=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  const smart=parseSmartlinkInput(cfg.smartUrl);
  const lastSl=typeof store!=='undefined'&&store&&store.get?Number(store.get('nr_ad_sl_ts',0))||0:0;
  return {
    cfg:{...cfg},
    updatedAt,
    remoteLoaded,
    social,
    native,
    banner,
    smart,
    lastSmartAt:lastSl,
    gate:gateReason(),
    slots:{
      social:{...slots.social},
      native:{...slots.native},
      banner:{...slots.banner},
      smart:{...slots.smart}
    }
  };
}

function resetSmartlinkCap(){
  if(typeof store!=='undefined'&&store&&store.set)store.set('nr_ad_sl_ts',0);
  emit();
}

function notifyAdmin(){
  adminResolved=true;
  if(resolveAdminWait)resolveAdminWait();
  evaluate();
}

// ---- Hook into Nightreel router, detail popup, profile switch & Play button ----
if(D){
  if(typeof render==='function'){
    const _render=render;
    render=function(){
      parkNative();
      const r=_render.apply(this,arguments);
      evaluate();
      return r;
    };
  }
  if(typeof detail==='function'){
    const _detail=detail;
    detail=function(id,keep){
      const r=_detail.apply(this,arguments);
      try{mountDetailAds(id,keep)}catch(e){}
      return r;
    };
  }
  if(typeof acct==='function'){
    const _acct=acct;
    acct=function(){
      const r=_acct.apply(this,arguments);
      evaluate();
      return r;
    };
  }
  if(D.addEventListener){
    D.addEventListener('click',e=>{
      if(e.isTrusted===false)return;
      const playBtn=e.target&&e.target.closest&&e.target.closest('[data-a="play"]');
      if(playBtn)triggerPlaySmartlink();
    });
  }
  if(G.addEventListener){
    G.addEventListener('hashchange',()=>evaluate());
  }
}

const API={
  DEFAULTS,
  SMART_MODES,
  parseHttpsUrl,
  parseSocialInput,
  parseNativeInput,
  parseBannerInput,
  parseSmartlinkInput,
  normalizeConfig,
  buildHtmlSnippet,
  getConfig:()=>({...cfg}),
  setConfig,
  loadRemote,
  evaluate,
  mountDetailAds,
  triggerPlaySmartlink,
  resetSmartlinkCap,
  status,
  notifyAdmin,
  isKidsProfile,
  onStateChange:fn=>{listeners.add(fn);return ()=>listeners.delete(fn)}
};

G.NR_ADS=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(D)startup();
})();
