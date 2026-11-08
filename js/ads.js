// Nightreel · Adsterra integration (Social Bar, Native Banner, 160×300 Sidebar Banner & Smartlink) + viewer protections.
// Configured out-of-the-box with Nightreel's Adsterra units and manageable live in #admin -> Ads.
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
  adFreeEmails:[],           // Specific emails chosen by admin that never see ads
  skipUsers:false,           // Optional: show ads to logged-out guests only
  skipAdmin:false,           // Optional: pause ads when signed in as verified site admin
  skipKids:true,             // Always keep Kids profiles ad-free
  skipAuth:true              // Keep sign-in, admin and legal pages ad-free
},G.NR_ADSTERRA_DEFAULTS||{});

function escHtml(v){
  return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function normalizeEmail(raw){
  return String(raw??'').trim().toLowerCase();
}

function isValidEmail(raw){
  const e=normalizeEmail(raw);
  return e.length<=160&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function parseEmailList(raw){
  const items=Array.isArray(raw)
    ?raw.flatMap(x=>String(x??'').split(/[\s,;]+/))
    :String(raw??'').split(/[\s,;]+/);
  const seen=new Set(),emails=[],invalid=[];
  for(const item of items){
    const e=normalizeEmail(item);
    if(!e)continue;
    if(!isValidEmail(e)){invalid.push(item.trim());continue}
    if(!seen.has(e)&&emails.length<200){seen.add(e);emails.push(e)}
  }
  return {ok:invalid.length===0,emails,invalid};
}

function cleanRaw(raw){
  let s=String(raw??'').trim();
  if(!s)return '';
  if(/&(?:lt|gt|quot|#39|amp);/i.test(s)){
    s=s.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&amp;/gi,'&');
  }
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
  const cid=(divMatch&&(divMatch[1]||divMatch[2]))||(keyMatch?'container-'+keyMatch[1]:'')||String(fallbackContainerId||'').trim();
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

function validateConfig(draft){
  const d=(draft&&typeof draft==='object')?draft:{};
  const soc=parseSocialInput(d.socialSrc);
  const nat=parseNativeInput(d.nativeSrc,d.nativeContainerId);
  const ban=parseBannerInput(d.bannerSrc,{key:d.bannerKey,width:d.bannerWidth,height:d.bannerHeight});
  const sl=parseSmartlinkInput(d.smartUrl);
  if(d.socialOn&&!soc.ok)return {ok:false,field:'social',error:'Social Bar: '+soc.error};
  if(d.nativeOn&&!nat.ok)return {ok:false,field:'native',error:'Native Banner: '+nat.error};
  if(d.bannerOn&&!ban.ok)return {ok:false,field:'banner',error:'160×300 Banner: '+ban.error};
  if(d.smartMode!=='off'&&!sl.ok)return {ok:false,field:'smart',error:'Smartlink: '+sl.error};
  if(d.adFreeEmails!==undefined){
    const em=parseEmailList(d.adFreeEmails);
    if(!em.ok)return {ok:false,field:'adFreeEmails',error:'Invalid email address: '+em.invalid[0]};
  }
  return {ok:true,soc,nat,ban,sl};
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
  const emSource=r.adFreeEmails!==undefined?r.adFreeEmails:(base.adFreeEmails||[]);
  const em=parseEmailList(emSource);
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
    adFreeEmails:em.emails,
    skipUsers:r.skipUsers!==undefined?!!r.skipUsers:!!base.skipUsers,
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

function isAdConfigObj(v){
  return !!(v&&typeof v==='object'&&('socialSrc' in v||'nativeSrc' in v||'bannerSrc' in v||'smartUrl' in v||'adFreeEmails' in v));
}

// ---- Runtime state ----
const cached=typeof store!=='undefined'&&store&&store.get?store.get('nr_ads_cfg_v2',null):null;
let cfg=normalizeConfig(cached&&cached.value?cached.value:null,DEFAULTS);
let updatedAt=(cached&&cached.updated_at)||'';
let syncMode=cached&&cached.syncMode?cached.syncMode:'default';
let devicePaused=!!(typeof store!=='undefined'&&store&&store.get&&store.get('nr_ads_device_mute',false));
let sessionEmail='';
let remoteLoaded=false;
let adminResolved=false;
let resolveAdminWait=null;
const adminWaitPromise=new Promise(r=>{resolveAdminWait=r});
let detailBannerTimer=0;
const listeners=new Set();
const remoteHooks=new Set();

const slots={
  social:{state:'idle',src:'',host:'',filled:null},
  native:{state:'idle',src:'',host:'',filled:null},
  banner:{state:'idle',src:'',host:'',filled:null},
  preview:{state:'idle',src:'',host:'',filled:null},
  smart:{opens:0}
};

function emit(){
  listeners.forEach(fn=>{try{fn()}catch(e){}});
}

function markOwnBodyNodes(){
  if(!D||!D.body||!D.body.children)return;
  for(const el of [...D.body.children]){
    if(el.dataset)el.dataset.nrOwn='1';
  }
}

function currentRoute(){
  if(!G.location)return 'home';
  const h=String(G.location.hash||'').replace(/^#/,'').trim();
  return h||'home';
}

function currentUserEmail(){
  if(typeof AUTH!=='undefined'&&AUTH&&AUTH.email)return normalizeEmail(AUTH.email);
  if(G.AUTH&&G.AUTH.email)return normalizeEmail(G.AUTH.email);
  if(sessionEmail)return normalizeEmail(sessionEmail);
  if(typeof A!=='undefined'&&A&&A.email&&A.email!=='local'&&isValidEmail(A.email))return normalizeEmail(A.email);
  if(G.A&&G.A.email&&G.A.email!=='local'&&isValidEmail(G.A.email))return normalizeEmail(G.A.email);
  // Cold-boot synchronous check of Supabase's persisted auth token before INITIAL_SESSION fires
  try{
    const ls=G.localStorage||(typeof localStorage!=='undefined'?localStorage:null);
    if(ls&&typeof ls.length==='number'){
      for(let i=0;i<ls.length;i++){
        const k=ls.key(i);
        if(k&&/^sb-.*-auth-token$/.test(k)){
          const parsed=JSON.parse(ls.getItem(k)||'null');
          const em=parsed&&parsed.user&&parsed.user.email;
          if(em)return normalizeEmail(em);
        }
      }
    }
  }catch(e){}
  return '';
}

function isAdFreeEmail(email,c=cfg){
  const e=normalizeEmail(email);
  if(!e||!Array.isArray(c.adFreeEmails)||!c.adFreeEmails.length)return false;
  return c.adFreeEmails.includes(e);
}

function getDevicePause(){
  return !!devicePaused;
}

function setDevicePause(on){
  devicePaused=!!on;
  if(typeof store!=='undefined'&&store&&store.set){
    store.set('nr_ads_device_mute',devicePaused);
  }
  evaluate();
  return devicePaused;
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
  if(!cfg.active)return {ok:false,code:'disabled',reason:'Ads are turned off site-wide'};
  if(devicePaused)return {ok:false,code:'device',reason:'Paused on this browser only'};
  if(!hasAnyEnabledUnit(cfg))return {ok:false,code:'unconfigured',reason:'All ad formats are turned off or empty'};
  const email=currentUserEmail();
  if(email&&isAdFreeEmail(email,cfg))return {ok:false,code:'vip',reason:'Ad-free account ('+email+')'};
  if(cfg.skipUsers&&email)return {ok:false,code:'signed_in',reason:'Paused for signed-in accounts'};
  if(cfg.skipAdmin&&G.NR_ADMIN)return {ok:false,code:'admin',reason:'Paused for your admin account'};
  const u=typeof me==='function'?me():null;
  if(cfg.skipKids&&isKidsProfile(u))return {ok:false,code:'kids',reason:'Paused on Kids profile'};
  if(cfg.skipAuth&&PROTECTED_ROUTES.has(currentRoute()))return {ok:false,code:'route',reason:'Paused on #'+(currentRoute())+' page'};
  return {ok:true,code:'active',reason:'Active on this page'};
}

// ---- Stationary Native Banner (never moved in the DOM so dynamic iframes stay alive) ----
let nativeObserverAttached=false;
function getNativeSection(){
  if(!D)return null;
  let sec=D.getElementById('nr-native-ad');
  if(!sec&&D.body){
    sec=D.createElement('section');
    sec.id='nr-native-ad';
    sec.className='nr-ad-native';
    sec.setAttribute('aria-label','Sponsored');
    sec.dataset.nrOwn='1';
    sec.hidden=true;
    sec.innerHTML='<div class="nr-ad-head"><span>Sponsored</span><a class="nr-ad-hlink" id="nr-native-slink" target="_blank" rel="noopener noreferrer sponsored" hidden>Partner offer ↗</a></div><div></div>';
    const app=D.getElementById('app');
    if(app&&app.parentNode)app.parentNode.insertBefore(sec,app);
    else D.body.appendChild(sec);
  }
  return sec;
}

function syncNative(){
  const sec=getNativeSection();
  if(!sec||!D)return;
  const gate=gateReason();
  const nat=parseNativeInput(cfg.nativeSrc,cfg.nativeContainerId);
  if(!gate.ok||!cfg.nativeOn||!nat.ok||!nat.src){
    const hlink=D.getElementById('nr-native-slink');
    if(hlink)hlink.hidden=true;
    sec.hidden=true;
    return;
  }

  const sl=parseSmartlinkInput(cfg.smartUrl);
  const hlink=D.getElementById('nr-native-slink');
  if(hlink){
    if(cfg.smartMode!=='off'&&sl.ok&&sl.url){
      hlink.href=sl.url;
      hlink.hidden=false;
    }else{
      hlink.hidden=true;
    }
  }

  let inner=sec.lastElementChild;
  if(!inner||inner.classList?.contains('nr-ad-head')){
    inner=D.createElement('div');
    sec.appendChild(inner);
  }
  const srcChanged=slots.native.src&&slots.native.src!==nat.src;
  if(srcChanged)inner.innerHTML='';
  if(inner.id!==nat.containerId)inner.id=nat.containerId;

  const checkFilled=()=>{
    const hasNodes=!!(inner.children&&inner.children.length>0);
    sec.classList.toggle('has-ad',hasNodes);
    if(slots.native.state==='loaded')slots.native.filled=hasNodes;
  };

  sec.hidden=false;
  checkFilled();

  if(!nativeObserverAttached&&typeof MutationObserver!=='undefined'){
    nativeObserverAttached=true;
    new MutationObserver(()=>{checkFilled();emit()}).observe(inner,{childList:true,subtree:true});
  }

  if(srcChanged||slots.native.src!==nat.src||(slots.native.state!=='loading'&&slots.native.state!=='loaded')){
    const existing=D.querySelector('script[data-nr-ad="native"]');
    if(existing)existing.remove();
    const s=D.createElement('script');
    s.async=true;
    s.setAttribute('async','async');
    s.setAttribute('data-cfasync','false');
    s.dataset.nrAd='native';
    slots.native={state:'loading',src:nat.src,host:nat.host,filled:null};
    s.onload=()=>{
      slots.native.state='loaded';
      checkFilled();
      emit();
      setTimeout(()=>{checkFilled();emit()},1200);
      setTimeout(()=>{checkFilled();emit()},3200);
    };
    s.onerror=()=>{
      slots.native.state='blocked';
      slots.native.filled=false;
      sec.classList.remove('has-ad');
      emit();
    };
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
  slots.social={state:'loading',src:soc.src,host:soc.host,filled:null};
  s.onload=()=>{slots.social.state='loaded';slots.social.filled=true;emit()};
  s.onerror=()=>{slots.social.state='blocked';slots.social.filled=false;emit()};
  s.src=soc.src;
  (D.body||D.head).appendChild(s);
}

// ---- 160×300 Banner via same-origin streaming ad-banner.html ----
let bannerSeq=0;
function onBannerEvent(slotName,state,filled){
  const key=slotName==='preview'?'preview':'banner';
  const ban=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  slots[key]={
    state:state==='blocked'?'blocked':'loaded',
    src:ban.src,
    host:ban.host,
    filled:filled===undefined?slots[key].filled:filled
  };
  if(key==='banner'&&D){
    const box=D.querySelector('#md .nr-ad-160');
    if(box&&(state==='blocked'||filled===false||!gateReason().ok||!cfg.bannerOn))box.hidden=true;
    else if(box&&filled===true&&gateReason().ok&&cfg.bannerOn)box.hidden=false;
  }
  emit();
}

function renderBannerBox(container,ban,slotName='detail'){
  if(!D||!container)return null;
  if(slotName==='detail'&&container.querySelector('.nr-ad-160'))return container.querySelector('.nr-ad-160');
  const box=D.createElement('div');
  box.className='nr-ad-box nr-ad-160'+(slotName==='preview'?' nr-ad-prev':'');
  box.setAttribute('aria-label','Sponsored');
  const lbl=D.createElement('span');
  lbl.className='nr-ad-lbl';
  lbl.textContent=slotName==='preview'?'Live 160×300 preview':'Sponsored';
  box.appendChild(lbl);

  const frame=D.createElement('iframe');
  frame.width=String(ban.width);
  frame.height=String(ban.height);
  frame.title='Sponsored advertisement';
  frame.setAttribute('scrolling','no');
  frame.setAttribute('frameborder','0');
  frame.setAttribute('referrerpolicy','no-referrer-when-downgrade');
  frame.style.cssText=`width:${ban.width}px;height:${ban.height}px;border:0;overflow:hidden;display:block;border-radius:10px`;
  const targetSlot=slotName==='preview'?'preview':'banner';
  slots[targetSlot]={state:'loading',src:ban.src,host:ban.host,filled:null};
  frame.src=`ad-banner.html?slot=${encodeURIComponent(slotName)}&seq=${++bannerSeq}`;
  box.appendChild(frame);
  container.appendChild(box);
  return box;
}

function mountBannerPreview(container){
  if(!D||!container)return false;
  container.innerHTML='';
  const ban=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  if(!ban.ok||!ban.src)return false;
  renderBannerBox(container,ban,'preview');
  return true;
}

function syncOpenDetailAds(){
  if(!D||!D.querySelector)return;
  const gate=gateReason();
  const box=D.querySelector('#md .nr-ad-160');
  if(box)box.hidden=!gate.ok||!cfg.bannerOn;
  const slink=D.querySelector('#md .nr-ad-slink');
  if(slink)slink.hidden=!gate.ok||cfg.smartMode==='off';
}

function mountDetailAds(id,keep){
  if(!D)return;
  clearTimeout(detailBannerTimer);
  const gate=gateReason();
  if(!gate.ok)return;
  const aside=D.querySelector('#md .ov2 aside');
  if(!aside)return;

  const sl=parseSmartlinkInput(cfg.smartUrl);
  if(cfg.smartMode!=='off'&&sl.ok&&sl.url&&!aside.querySelector('.nr-ad-slink')){
    const linksBox=aside.querySelector('.v3links');
    const extIcon=typeof I==='function'?I('external'):'↗';
    const linkHtml=`<a class="nr-ad-slink" href="${escHtml(sl.url)}" target="_blank" rel="noopener noreferrer sponsored">Partner offer ${extIcon}</a>`;
    if(linksBox&&linksBox.insertAdjacentHTML)linksBox.insertAdjacentHTML('beforeend',linkHtml);
  }

  const ban=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  if(!cfg.bannerOn||!ban.ok||!ban.src)return;
  const c=(typeof C!=='undefined'&&Array.isArray(C))?C[id]:null;
  if(c&&!c.v3&&!keep){
    detailBannerTimer=setTimeout(()=>{
      const a2=D.querySelector('#md .ov2 aside');
      if(a2&&gateReason().ok)renderBannerBox(a2,ban,'detail');
    },1800);
    return;
  }
  renderBannerBox(aside,ban,'detail');
}

// ---- Play-click Smartlink (frequency-capped) ----
function triggerPlaySmartlink(force=false){
  const sl=parseSmartlinkInput(cfg.smartUrl);
  if(!sl.ok||!sl.url)return false;
  if(!force){
    const gate=gateReason();
    if(!gate.ok||cfg.smartMode!=='play')return false;
    const capMs=Math.max(1,Number(cfg.smartCapHours)||12)*3600*1000;
    const last=typeof store!=='undefined'&&store&&store.get?Number(store.get('nr_ad_sl_ts',0))||0:0;
    const now=Date.now();
    if(now-last<capMs)return false;
    if(typeof store!=='undefined'&&store&&store.set)store.set('nr_ad_sl_ts',now);
  }
  slots.smart.opens++;
  try{if(typeof G.open==='function')G.open(sl.url,'_blank','noopener,noreferrer')}catch(e){}
  emit();
  return true;
}

function evaluate(){
  syncSocial();
  syncNative();
  syncOpenDetailAds();
  emit();
  return gateReason();
}

function setConfig(nextCfg,stamp,mode){
  cfg=normalizeConfig(nextCfg,DEFAULTS);
  if(stamp!==undefined)updatedAt=stamp||'';
  if(mode)syncMode=mode;
  if(typeof store!=='undefined'&&store&&store.set){
    store.set('nr_ads_cfg_v2',{value:cfg,updated_at:updatedAt,syncMode});
  }
  evaluate();
  return cfg;
}

// Saves site-wide settings to BOTH key='announcement' (publicly readable by 100% of visitors & guests
// even when RLS restricts key='ads' to admins) AND key='ads' when supported.
async function saveConfig(nextCfg,opts={}){
  const v=validateConfig(nextCfg);
  if(!v.ok)return {ok:false,error:v.error,field:v.field};
  const clean=normalizeConfig(nextCfg,DEFAULTS);
  const stamp=opts.stamp||new Date().toISOString();
  setConfig(clean,stamp,'local');

  if(typeof SB==='undefined'||!SB||!SB.from){
    return {ok:true,cfg:clean,synced:false,syncMode:'local',remoteError:'Supabase client unavailable'};
  }

  let annOk=false,adsOk=false,lastErr='',mergedAnn=null;

  // 1. Always mirror into 'announcement' row's JSON so EVERY visitor/guest receives updates regardless of RLS on 'ads'
  try{
    let annBase=(opts.ann&&typeof opts.ann==='object')?{...opts.ann}:null;
    let annStamp='';
    if(!annBase){
      const cur=await SB.from('site_config').select('value,updated_at').eq('key','announcement').maybeSingle();
      if(!cur.error&&cur.data&&cur.data.value&&typeof cur.data.value==='object'){
        annBase={...cur.data.value};
        annStamp=cur.data.updated_at||'';
      }
    }
    const base=annBase||{text:'',link:'',kind:'info',active:false};
    mergedAnn={
      text:base.text||'',
      link:base.link||'',
      kind:base.kind||'info',
      active:!!base.active,
      ads:clean,
      ads_updated_at:stamp
    };
    const keepDismissStamp=(base.active&&base.text&&annStamp)?annStamp:stamp;
    const {error}=await SB.from('site_config').upsert({
      key:'announcement',
      value:mergedAnn,
      updated_at:keepDismissStamp
    });
    if(!error)annOk=true;
    else lastErr=error.message||'Could not write announcement config';
  }catch(e){
    lastErr=(e&&e.message)||'Could not write announcement config';
  }

  // 2. Also write dedicated key='ads' when allowed by schema/constraints
  try{
    const {error}=await SB.from('site_config').upsert({key:'ads',value:clean,updated_at:stamp});
    if(!error)adsOk=true;
    else if(!annOk)lastErr=error.message||lastErr;
  }catch(e){
    if(!annOk)lastErr=(e&&e.message)||lastErr;
  }

  if(annOk||adsOk){
    const mode=annOk?'announcement':'ads';
    setConfig(clean,stamp,mode);
    return {ok:true,cfg:clean,synced:true,syncMode:mode,annValue:annOk?mergedAnn:undefined};
  }
  return {ok:true,cfg:clean,synced:false,syncMode:'local',remoteError:lastErr};
}

async function addAdFreeEmail(rawInput,opts={}){
  const parsed=parseEmailList(rawInput);
  if(!parsed.ok||!parsed.emails.length){
    return {ok:false,error:parsed.invalid.length?'Invalid email: '+parsed.invalid[0]:'Enter an email address first.'};
  }
  const merged=[...new Set([...(cfg.adFreeEmails||[]),...parsed.emails])];
  const res=await saveConfig({...cfg,adFreeEmails:merged},opts);
  return {...res,added:parsed.emails};
}

async function removeAdFreeEmail(email,opts={}){
  const target=normalizeEmail(email);
  const next=(cfg.adFreeEmails||[]).filter(e=>e!==target);
  return saveConfig({...cfg,adFreeEmails:next},opts);
}

async function loadRemote(){
  if(typeof SB==='undefined'||!SB||!SB.from)return cfg;
  try{
    let rows=[];
    const tbl=SB.from('site_config').select('key,value,updated_at');
    if(tbl&&typeof tbl.in==='function'){
      const {data,error}=await tbl.in('key',['ads','announcement']);
      if(!error&&Array.isArray(data))rows=data;
    }else if(tbl&&typeof tbl.eq==='function'){
      const {data,error}=await tbl.eq('key','announcement').maybeSingle();
      if(!error&&data)rows=[{key:'announcement',...data}];
    }
    remoteLoaded=true;

    let bestCfg=null,bestStamp='',bestTs=0,bestMode='';
    for(const r of rows){
      if(!r||!r.value||typeof r.value!=='object')continue;
      if((r.key==='ads'||!r.key)&&isAdConfigObj(r.value)){
        const st=r.updated_at||'';
        const ts=Date.parse(st)||1;
        if(ts>=bestTs){bestTs=ts;bestCfg=r.value;bestStamp=st;bestMode='ads'}
      }else if(r.key==='announcement'&&isAdConfigObj(r.value.ads)){
        const st=r.value.ads_updated_at||r.updated_at||'';
        const ts=Date.parse(st)||1;
        if(ts>=bestTs){bestTs=ts;bestCfg=r.value.ads;bestStamp=st;bestMode='announcement'}
      }
    }

    if(bestCfg){
      // Only preserve local config over remote if an admin made a local-only edit while Supabase was unreachable
      const hasUnsyncedLocalEdit=(syncMode==='local'&&!!G.NR_ADMIN&&updatedAt&&(Date.parse(updatedAt)||0)>bestTs);
      if(!hasUnsyncedLocalEdit){
        const normalizedRemote=normalizeConfig(bestCfg,DEFAULTS);
        if(bestStamp!==updatedAt||JSON.stringify(normalizedRemote)!==JSON.stringify(cfg)){
          setConfig(normalizedRemote,bestStamp,bestMode);
        }
      }
    }
  }catch(e){}
  return cfg;
}

function attachLiveSync(){
  // 1. Supabase Realtime channel for instant site-wide propagation across open visitor tabs
  try{
    if(typeof SB!=='undefined'&&SB&&typeof SB.channel==='function'){
      SB.channel('nr-site-config-live')
        .on('postgres_changes',{event:'*',schema:'public',table:'site_config'},()=>{
          loadRemote();
          remoteHooks.forEach(fn=>{try{fn()}catch(e){}});
        })
        .subscribe();
    }
  }catch(e){}

  // 2. Refresh when visitor switches back to tab + lightweight background poll
  if(D&&D.addEventListener){
    D.addEventListener('visibilitychange',()=>{
      if(!D.hidden){
        loadRemote();
        remoteHooks.forEach(fn=>{try{fn()}catch(e){}});
      }
    });
  }
  if(typeof setInterval==='function'&&D){
    const timer=setInterval(()=>{
      if(!D.hidden)loadRemote();
    },45000);
    if(timer&&typeof timer.unref==='function')timer.unref();
  }
}

function probe(){
  for(const k of ['social','native','banner','preview']){
    if(slots[k]&&slots[k].state==='blocked'){
      slots[k]={state:'idle',src:'',host:'',filled:null};
    }
  }
  evaluate();
  return status();
}

async function startup(){
  markOwnBodyNodes();
  const hasSignedUser=!!currentUserEmail();
  if(typeof SB!=='undefined'&&SB&&SB.auth){
    if(typeof SB.auth.onAuthStateChange==='function'){
      try{
        SB.auth.onAuthStateChange((ev,s)=>{
          sessionEmail=(s&&s.user&&s.user.email)?normalizeEmail(s.user.email):'';
          if(ev==='SIGNED_OUT')sessionEmail='';
          evaluate();
        });
      }catch(e){}
    }
    if(typeof SB.auth.getSession==='function'&&(cfg.skipAdmin||hasSignedUser)){
      try{
        const {data}=await SB.auth.getSession();
        if(data&&data.session&&data.session.user){
          sessionEmail=normalizeEmail(data.session.user.email||'');
          if(cfg.skipAdmin&&!adminResolved){
            await Promise.race([adminWaitPromise,new Promise(r=>setTimeout(r,1500))]);
          }
        }
      }catch(e){}
    }
  }
  // If a signed-in user opens Nightreel on a fresh browser before remote config has ever cached,
  // check remote site_config first (up to 1.2s) so ad-free accounts never get a first-visit flash of ads.
  if(hasSignedUser&&!cached){
    await Promise.race([loadRemote(),new Promise(r=>setTimeout(r,1200))]);
  }
  evaluate();
  await loadRemote();
  evaluate();
  attachLiveSync();
}

function status(){
  const social=parseSocialInput(cfg.socialSrc);
  const native=parseNativeInput(cfg.nativeSrc,cfg.nativeContainerId);
  const banner=parseBannerInput(cfg.bannerSrc,{key:cfg.bannerKey,width:cfg.bannerWidth,height:cfg.bannerHeight});
  const smart=parseSmartlinkInput(cfg.smartUrl);
  const lastSl=typeof store!=='undefined'&&store&&store.get?Number(store.get('nr_ad_sl_ts',0))||0:0;
  const anyBlocked=['social','native','banner','preview'].some(k=>slots[k]&&slots[k].state==='blocked');
  const userEmail=currentUserEmail();
  return {
    cfg:{...cfg,adFreeEmails:[...(cfg.adFreeEmails||[])]},
    devicePaused,
    userEmail,
    userIsAdFree:!!(userEmail&&isAdFreeEmail(userEmail,cfg)),
    updatedAt,
    syncMode,
    remoteLoaded,
    anyBlocked,
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
      preview:{...slots.preview},
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
      if(currentRoute()!=='home'||(typeof q!=='undefined'&&q)){
        const ht=D.getElementById('nr-home-top');
        if(ht)ht.innerHTML='';
      }
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
      if(playBtn)triggerPlaySmartlink(false);
    });
  }
  if(G.addEventListener){
    G.addEventListener('hashchange',()=>evaluate());
    G.addEventListener('message',ev=>{
      if(!G.location||ev.origin!==G.location.origin)return;
      const d=ev.data;
      if(d&&typeof d==='object'&&d.type==='nr-ad-banner'){
        onBannerEvent(d.slot,d.state,d.filled);
      }
    });
  }
}

const API={
  DEFAULTS,
  SMART_MODES,
  normalizeEmail,
  isValidEmail,
  parseEmailList,
  parseHttpsUrl,
  parseSocialInput,
  parseNativeInput,
  parseBannerInput,
  parseSmartlinkInput,
  validateConfig,
  normalizeConfig,
  buildHtmlSnippet,
  getConfig:()=>({...cfg,adFreeEmails:[...(cfg.adFreeEmails||[])]}),
  setConfig,
  saveConfig,
  addAdFreeEmail,
  removeAdFreeEmail,
  isAdFreeEmail,
  currentUserEmail,
  getDevicePause,
  setDevicePause,
  loadRemote,
  probe,
  evaluate,
  mountDetailAds,
  mountBannerPreview,
  triggerPlaySmartlink,
  resetSmartlinkCap,
  status,
  notifyAdmin,
  isKidsProfile,
  _onBannerEvent:onBannerEvent,
  onStateChange:fn=>{listeners.add(fn);return ()=>listeners.delete(fn)},
  onRemoteSync:fn=>{remoteHooks.add(fn);return ()=>remoteHooks.delete(fn)}
};

G.NR_ADS=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(D)startup();
})();
