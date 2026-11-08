// Nightreel · Admin panel (#admin) and the site-wide announcement banner.
// Access is enforced by Supabase (see admin-setup.sql): this file only shows what the database lets an admin read.
(()=>{
const D=document,$$=(s,r=D)=>[...r.querySelectorAll(s)];
KN.push('admin');
const BLUE='#3987e5',CAT={M:['Movies','#3987e5'],S:['Series','#d95926'],A:['Anime','#199e70']};
const ADM={tab:'overview',state:'idle',err:'',users:[],rows:[],dg:null,q:'',sort:'joined',dir:-1,sel:null,loadedAt:0,checks:null,ann:null};
window.NR_ADMIN=false;let known=false,setupMissing=false;
const fmtD=t=>t?new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
const ago=t=>{if(!t)return 'never';const s=(Date.now()-t)/1000;return s<60?'just now':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':s<2592000?Math.floor(s/86400)+'d ago':fmtD(t)};
const n0=v=>Number(v||0).toLocaleString();
// ---- who is an admin (asked of the database, never decided here) ----
async function checkAdmin(){if(!SB||!AUTH){NR_ADMIN=false;known=true;if(window.NR_ADS)NR_ADS.notifyAdmin();return}
  try{const {data,error}=await SB.rpc('is_admin');if(error){setupMissing=/PGRST202|42883|could not find the function/i.test((error.code||'')+' '+(error.message||''));NR_ADMIN=false}else{setupMissing=false;NR_ADMIN=data===true}}
  catch(e){NR_ADMIN=false}
  known=true;if(window.NR_ADS)NR_ADS.notifyAdmin();acct();if(location.hash==='#admin'&&!q)render()}
const _as=afterSignIn;afterSignIn=async function(){const r=await _as.apply(this,arguments);checkAdmin();return r};
const _a=acct;acct=function(){_a.apply(this,arguments);if(!AUTH){NR_ADMIN=false;known=true}
  const m=$('#menu'),pl=m&&m.querySelector('a[href="#profile"]');if(NR_ADMIN&&pl&&!m.querySelector('a[href="#admin"]'))pl.insertAdjacentHTML('beforebegin','<a href="#admin">'+I('shield')+' Admin panel</a>')};
// ---- data ----
async function load(){if(!NR_ADMIN)return;ADM.state='loading';ADM.err='';if(ADM.tab!=='ads'&&ADM.tab!=='announce')paint();
  try{const [u,s]=await Promise.all([SB.rpc('admin_users'),SB.from('app_state').select('user_id,data,updated_at')]);
    if(u.error)throw u.error;if(s.error)throw s.error;ADM.users=u.data||[];ADM.rows=s.data||[];ADM.dg=digest();ADM.state='ok';ADM.loadedAt=Date.now()}
  catch(e){ADM.state='error';ADM.err=(e&&e.message)||'Could not load admin data'}
  const u=$('#adm-upd');if(u&&ADM.loadedAt)u.textContent='updated '+ago(ADM.loadedAt);
  if(ADM.tab==='ads'){const vw=$('#ads-vip-wrap');if(vw&&(!D.activeElement||D.activeElement.id!=='ads-vip-input'))vw.innerHTML=adsVipCardHTML()}
  else if(ADM.tab!=='announce')paint()}
function digest(){const byId={},titles={},themes={},fonts={},prov={};ADM.rows.forEach(r=>byId[r.user_id]=r);
  const bump=(c,k)=>{const key=c.mt+c.tid,t=titles[key]||(titles[key]={t:c.t,p:c.p,mt:c.mt,tid:c.tid,ty:c.ty||(c.mt==='tv'?'S':'M'),g:c.g||[],saved:0,watched:0,liked:0,rs:0,rn:0});if(k)t[k]++;return t};
  const users=ADM.users.map(u=>{const r=byId[u.id],d=(r&&r.data)||{},refs=d.catalogRefs||{},pf=Array.isArray(d.pf)?d.pf:[];
    let list=0,started=0,fin=0,secs=0,rates=0,last=r?Date.parse(r.updated_at)||0:0;
    pf.forEach(p=>{(p.list||[]).forEach(i=>{list++;const c=refs[i];if(c)bump(c,'saved')});
      Object.entries(p.prog||{}).forEach(([i,pr])=>{pr=pr||{};started++;if(pr.u)last=Math.max(last,pr.u);const c=refs[i],t=+pr.t||0;
        if(c){bump(c,'watched');const m=+c.m||0,ep=+c.ep||1;secs+=c.mt==='tv'?Math.max(0,(pr.ep||1)-1)*m*60+t:t;if((pr.ep||1)>=ep&&t>=m*60*.95)fin++}else secs+=t});
      Object.entries(p.rt||{}).forEach(([i,v])=>{rates++;const c=refs[i];if(c&&v===1)bump(c,'liked')});
      Object.entries(p.r10||{}).forEach(([i,v])=>{rates++;const c=refs[i];if(c){const t=bump(c);t.rs+=+v||0;t.rn++}});
      const st=p.st||{};themes[st.theme||'midnight']=(themes[st.theme||'midnight']||0)+1;fonts[st.font||'system']=(fonts[st.font||'system']||0)+1});
    prov[u.provider||'email']=(prov[u.provider||'email']||0)+1;
    return {...u,joined:Date.parse(u.created_at)||0,signin:Date.parse(u.last_sign_in_at)||0,synced:!!r,profiles:pf.length,list,started,fin,hours:secs/3600,rates,last,pf,refs}});
  const T=Object.values(titles),genres={},types={M:0,S:0,A:0};
  T.forEach(t=>{const w=t.saved+t.watched||1;t.g.forEach(g=>genres[g]=(genres[g]||0)+w);types[t.ty]=(types[t.ty]||0)+w});
  const now=Date.now(),day=864e5;
  return {users,titles:T,genres,types,themes,fonts,prov,
    total:users.length,new7:users.filter(u=>now-u.joined<7*day).length,new30:users.filter(u=>now-u.joined<30*day).length,
    active7:users.filter(u=>now-Math.max(u.signin,u.last)<7*day).length,active30:users.filter(u=>now-Math.max(u.signin,u.last)<30*day).length,
    synced:users.filter(u=>u.synced).length,saved:users.reduce((a,u)=>a+u.list,0),hours:users.reduce((a,u)=>a+u.hours,0),
    unconfirmed:users.filter(u=>u.confirmed===false).length}}
// ---- small view helpers ----
const kpi=(v,l,s)=>`<div class="adm-kpi"><b>${v}</b><span>${l}</span>${s?`<small>${s}</small>`:''}</div>`;
const card=(title,body,extra)=>`<section class="pn adm-card"><div class="adm-ch"><h3>${title}</h3>${extra||''}</div>${body}</section>`;
const empty=t=>`<p class="mu adm-empty">${t}</p>`;
function hbars(entries,label){const top=entries.slice(0,8),mx=Math.max(1,...top.map(x=>x[1]));if(!top.length)return empty('Nothing yet.');
  return `<div class="adm-hb">${top.map(([k,v])=>`<div class="adm-hr" data-tip="${esc(k)}: ${n0(v)} ${label}"><span>${esc(k)}</span><i><u style="width:${Math.max(2,v/mx*100)}%"></u></i><b>${n0(v)}</b></div>`).join('')}</div>`}
function dayBars(stamps,days,label){const now=new Date();now.setHours(0,0,0,0);const start=now.getTime()-(days-1)*864e5,b=Array(days).fill(0);
  stamps.forEach(t=>{if(!t)return;const i=Math.floor((t-start)/864e5);if(i>=0&&i<days)b[i]++});const mx=Math.max(1,...b),lab=i=>new Date(start+i*864e5).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  return `<div class="adm-vb" role="img" aria-label="${label} per day, last ${days} days, total ${b.reduce((a,v)=>a+v,0)}"><em class="adm-ymax">${mx}</em>${b.map((v,i)=>`<span data-tip="${lab(i)}: ${v} ${label}"><i style="height:${v?Math.max(4,v/mx*100):0}%"></i></span>`).join('')}</div>
<div class="adm-vx"><span>${lab(0)}</span><span>${lab(Math.floor(days/2))}</span><span>Today</span></div>
<details class="adm-tbl"><summary>Show as table</summary><table><thead><tr><th>Day</th><th>${label}</th></tr></thead><tbody>${b.map((v,i)=>`<tr><td>${lab(i)}</td><td>${v}</td></tr>`).reverse().join('')}</tbody></table></details>`}
// Titles here come from each user's own synced data, so only well-formed values reach the page.
const poster=(t,badge)=>{const mt=t.mt==='tv'?'tv':'movie',tid=/^\d{1,10}$/.test(String(t.tid))?t.tid:'0',p=/^\/[\w.-]{1,80}$/.test(String(t.p||''))?t.p:'';return `<a class="adm-pt" href="#title-${mt}-${tid}" title="${esc(t.t)}">${p?`<img loading="lazy" alt="" src="https://image.tmdb.org/t/p/w154${p}">`:''}<b>${badge}</b><span>${esc(t.t)}</span></a>`};
// ---- tabs ----
const TABS=[['overview','Overview','barChart'],['users','Users','users'],['content','Content','film'],['ads','Ads','dollar'],['announce','Announcement','megaphone'],['system','System','server']];
function vOverview(g){const recent=[...g.users].sort((a,b)=>b.joined-a.joined).slice(0,6);
  return `<div class="adm-kpis">${kpi(n0(g.total),'Total users',g.unconfirmed?n0(g.unconfirmed)+' unconfirmed':'')}${kpi(n0(g.new7),'New this week',n0(g.new30)+' in 30 days')}${kpi(n0(g.active7),'Active this week',n0(g.active30)+' in 30 days')}${kpi(n0(g.synced),'Syncing data',g.total?Math.round(g.synced/g.total*100)+'% of users':'')}${kpi(n0(g.saved),'Titles saved','across all lists')}${kpi(g.hours.toFixed(1),'Hours watched','estimated')}</div>
<div class="adm-grid">${card('Sign-ups · last 30 days',dayBars(g.users.map(u=>u.joined),30,'sign-ups'))}${card('Active users · last 30 days',dayBars(g.users.map(u=>Math.max(u.signin,u.last)),30,'last seen'))}
${card('Sign-in method',hbars(Object.entries(g.prov).sort((a,b)=>b[1]-a[1]),'users'))}
${card('Newest users',recent.length?`<div class="adm-list">${recent.map(u=>`<button class="adm-li" data-adm="user" data-id="${u.id}"><span class="adm-av">${esc((u.email||'?')[0].toUpperCase())}</span><span><b>${esc(u.email||'(no email)')}</b><small>Joined ${ago(u.joined)} · ${esc(u.provider||'email')}</small></span>${I('chevR')}</button>`).join('')}</div>`:empty('No users yet.'))}</div>`}
function vUsers(g){const qq=ADM.q.trim().toLowerCase(),key=ADM.sort,dir=ADM.dir;
  let us=g.users.filter(u=>!qq||(u.email||'').toLowerCase().includes(qq)||(u.provider||'').includes(qq));
  us.sort((a,b)=>{const x=key==='email'?(a.email||''):a[key],y=key==='email'?(b.email||''):b[key];return (x>y?1:x<y?-1:0)*dir});
  const th=(k,l)=>`<th><button data-adm="sort" data-k="${k}" class="${ADM.sort===k?'on':''}">${l}${ADM.sort===k?I(dir<0?'chevD':'chevUp'):''}</button></th>`;
  return `<div class="adm-tools"><label class="adm-search">${I('search')}<input id="adm-q" type="search" placeholder="Search by email or sign-in method" value="${esc(ADM.q)}" aria-label="Search users"></label><span class="mu">${n0(us.length)} of ${n0(g.total)} users</span><button class="btn" data-adm="csv">${I('download')} Users CSV</button></div>
<div class="pn adm-tablewrap"><table class="adm-table"><thead><tr>${th('email','User')}${th('provider','Sign-in')}${th('joined','Joined')}${th('signin','Last sign-in')}${th('list','My List')}${th('started','Watched')}${th('hours','Hours')}${th('last','Last activity')}</tr></thead>
<tbody>${us.map(u=>{const vip=window.NR_ADS&&u.email&&NR_ADS.isAdFreeEmail(u.email);return `<tr data-adm="user" data-id="${u.id}" tabindex="0"><td><b>${esc(u.email||'(no email)')}</b>${vip?'<em class="adm-tag vip">ad-free</em>':''}${u.confirmed===false?'<em class="adm-tag warn">unconfirmed</em>':''}${u.synced?'':'<em class="adm-tag">no sync</em>'}</td><td>${esc(u.provider||'email')}</td><td>${fmtD(u.joined)}</td><td>${ago(u.signin)}</td><td>${n0(u.list)}</td><td>${n0(u.started)}</td><td>${u.hours.toFixed(1)}</td><td>${ago(u.last)}</td></tr>`}).join('')||`<tr><td colspan="8">${empty('No users match.')}</td></tr>`}</tbody></table></div>`}
function vUser(u){if(!u)return '';const refs=u.refs,titles=ids=>[...new Set(ids)].map(i=>refs[i]).filter(Boolean);
  const p=u.pf[0]||{},st=p.st||{};const all=u.pf.flatMap(x=>x.list||[]),prog=u.pf.flatMap(x=>Object.keys(x.prog||{})),liked=u.pf.flatMap(x=>Object.entries(x.rt||{}).filter(([,v])=>v===1).map(([i])=>i));
  const vip=window.NR_ADS&&u.email&&NR_ADS.isAdFreeEmail(u.email);
  const row=(h,ids)=>{const t=titles(ids);return `<h4>${h} <span class="mu">${t.length}</span></h4>${t.length?`<div class="adm-posters">${t.slice(0,18).map(c=>poster({...c,ty:c.ty},'')).join('')}</div>`:empty('None.')}`};
  return `<div class="ovl o adm-drawer-bg" data-adm="close"><aside class="adm-drawer" role="dialog" aria-modal="true" aria-label="User details"><button class="x" data-adm="close" aria-label="Close">${I('x')}</button>
<div class="adm-uh"><span class="adm-av big">${esc((u.email||'?')[0].toUpperCase())}</span><div><h2>${esc(u.email||'(no email)')}${vip?' <em class="adm-tag vip">ad-free</em>':''}</h2><p class="mu">${esc(u.provider||'email')} · joined ${fmtD(u.joined)} · last sign-in ${ago(u.signin)}</p></div></div>
<div class="adm-kpis sm">${kpi(n0(u.list),'In My List')}${kpi(n0(u.started),'Started')}${kpi(n0(u.fin),'Finished')}${kpi(u.hours.toFixed(1),'Hours')}${kpi(n0(u.rates),'Ratings')}</div>
<p class="mu adm-meta">Profile: ${esc(p.name||'—')} · theme ${esc(st.theme||'midnight')} · font ${esc(st.font||'system')} · last activity ${ago(u.last)} · ID <code>${esc(u.id)}</code></p>
${u.synced?row('My List',all)+row('Watched',prog)+row('Liked',liked):'<p class="mu">This user has no synced data yet (they haven’t saved anything while signed in, or sync isn’t set up).</p>'}
<div class="rowb adm-danger"><button class="btn" data-adm="copy" data-v="${esc(u.email||'')}">${I('copy')} Copy email</button>${u.email&&window.NR_ADS?`<button class="btn" data-adm="vip-toggle" data-v="${esc(u.email)}">${I('shield')} ${vip?'Remove ad-free':'No ads for this user'}</button>`:''}${u.synced?`<button class="btn dng" data-adm="wipe" data-id="${u.id}">${I('trash')} Clear synced data</button>`:''}</div></aside></div>`}
function vContent(g){const T=g.titles,top=k=>[...T].filter(t=>t[k]).sort((a,b)=>b[k]-a[k]).slice(0,12);
  const rated=[...T].filter(t=>t.rn).sort((a,b)=>b.rs/b.rn-a.rs/a.rn||b.rn-a.rn).slice(0,12),tot=Object.values(g.types).reduce((a,v)=>a+v,0);
  const split=tot?`<div class="adm-split" role="img" aria-label="${Object.entries(g.types).map(([k,v])=>CAT[k][0]+' '+Math.round(v/tot*100)+'%').join(', ')}">${Object.entries(g.types).filter(([,v])=>v).map(([k,v])=>`<i style="width:${v/tot*100}%;background:${CAT[k][1]}" data-tip="${CAT[k][0]}: ${Math.round(v/tot*100)}%"></i>`).join('')}</div><div class="adm-leg">${Object.entries(g.types).map(([k,v])=>`<span><i style="background:${CAT[k][1]}"></i>${CAT[k][0]} <b>${Math.round(v/tot*100)}%</b></span>`).join('')}</div>`:empty('No titles yet.');
  const grid=(ts,badge)=>ts.length?`<div class="adm-posters">${ts.map(t=>poster(t,badge(t))).join('')}</div>`:empty('Nothing yet.');
  return `<div class="adm-grid">${card('What people watch',split)}${card('Top genres',hbars(Object.entries(g.genres).sort((a,b)=>b[1]-a[1]),'saves and views'))}</div>
${card('Most saved to My List',grid(top('saved'),t=>t.saved+'×'))}${card('Most watched',grid(top('watched'),t=>t.watched+'×'))}
<div class="adm-grid">${card('Most liked',grid(top('liked'),t=>t.liked+' '+I('thumbUp')))}${card('Highest rated by users',grid(rated,t=>I('star','fill')+' '+(t.rs/t.rn).toFixed(1)))}</div>
<div class="adm-grid">${card('Themes in use',hbars(Object.entries(g.themes).sort((a,b)=>b[1]-a[1]),'profiles'))}${card('Fonts in use',hbars(Object.entries(g.fonts).sort((a,b)=>b[1]-a[1]),'profiles'))}</div>`}
function readAdsDraft(){
  const base=window.NR_ADS?NR_ADS.getConfig():{};
  if(!$('#ads-social'))return base;
  const natRaw=$('#ads-native').value.trim(),banRaw=$('#ads-banner').value.trim();
  const nat=NR_ADS.parseNativeInput(natRaw,base.nativeContainerId);
  const ban=NR_ADS.parseBannerInput(banRaw,{key:base.bannerKey,width:base.bannerWidth,height:base.bannerHeight});
  return {
    active:$('#ads-active').classList.contains('on'),
    socialOn:$('#ads-social-on').classList.contains('on'),
    socialSrc:$('#ads-social').value.trim(),
    nativeOn:$('#ads-native-on').classList.contains('on'),
    nativeSrc:natRaw,
    nativeContainerId:nat.ok&&nat.containerId?nat.containerId:base.nativeContainerId,
    bannerOn:$('#ads-banner-on').classList.contains('on'),
    bannerSrc:banRaw,
    bannerKey:ban.ok&&ban.key?ban.key:base.bannerKey,
    bannerWidth:ban.ok?ban.width:(base.bannerWidth||160),
    bannerHeight:ban.ok?ban.height:(base.bannerHeight||300),
    smartMode:($('#ads-smart-mode .on')||{}).dataset?.k||'play',
    smartCapHours:+((($('#ads-smart-cap .on')||{}).dataset?.k)||12),
    smartUrl:$('#ads-smart').value.trim(),
    adFreeEmails:[...(base.adFreeEmails||[])],
    skipUsers:$('#ads-skip-users')?$('#ads-skip-users').classList.contains('on'):!!base.skipUsers,
    skipAdmin:$('#ads-skip-admin')?$('#ads-skip-admin').classList.contains('on'):!!base.skipAdmin,
    skipKids:$('#ads-skip-kids').classList.contains('on'),
    skipAuth:$('#ads-skip-auth').classList.contains('on')
  };
}
function adsVipCardHTML(){
  const c=window.NR_ADS?NR_ADS.getConfig():{adFreeEmails:[]};
  const list=c.adFreeEmails||[];
  const set=new Set(list.map(e=>e.toLowerCase()));
  const myEmail=(AUTH&&AUTH.email||'').trim().toLowerCase();
  const suggestions=(ADM.users||[]).map(u=>(u.email||'').trim().toLowerCase()).filter(e=>e&&!set.has(e)).slice(0,8);
  const allKnown=(ADM.users||[]).map(u=>(u.email||'').trim().toLowerCase()).filter(Boolean);
  return card('Ad-free accounts',`<p class="mu">Add any email address you choose — whenever that person is signed into Nightreel on any device, they will see <b>zero ads</b> (no Social Bar, Native Banner, sidebar banner, or Smartlink).</p>
<div class="adm-vip-form"><input id="ads-vip-input" type="email" list="ads-vip-datalist" placeholder="Enter email (e.g. friend@gmail.com)" autocomplete="off" spellcheck="false" aria-label="Email address for ad-free access"><button class="btn p" type="button" data-adm="ads-vip-add">${I('plus')} Add email</button></div>
<datalist id="ads-vip-datalist">${allKnown.map(e=>`<option value="${esc(e)}">`).join('')}</datalist>
${suggestions.length?`<div class="adm-vip-picks"><span class="mu">Quick-add user:</span>${suggestions.map(e=>`<button type="button" class="adm-vip-chip" data-adm="ads-vip-pick" data-v="${esc(e)}">${I('plus')} ${esc(e)}</button>`).join('')}</div>`:''}
${list.length?`<div class="adm-vip-list">${list.map(e=>`<div class="adm-vip-row"><span class="adm-av">${esc(e[0].toUpperCase())}</span><span class="adm-vip-em"><b>${esc(e)}</b><small>${e===myEmail?'Your account · ':''}All ads disabled on every device</small></span><em class="adm-tag vip">No ads</em><button class="btn ic adm-vip-x" type="button" data-adm="ads-vip-rm" data-v="${esc(e)}" aria-label="Remove ${esc(e)}" title="Remove from ad-free list">${I('x')}</button></div>`).join('')}</div>`:`<p class="mu adm-empty" style="margin-top:8px">No ad-free emails added yet.</p>`}`,`<span class="adm-scope vip">${list.length?n0(list.length)+' ad-free':'Chosen emails only'}</span>`);
}
function adsSideHTML(draft){
  if(!window.NR_ADS)return card('Status',empty('Adsterra helper (js/ads.js) did not load.'));
  const st=NR_ADS.status(),c=draft||st.cfg;
  const soc=NR_ADS.parseSocialInput(c.socialSrc);
  const nat=NR_ADS.parseNativeInput(c.nativeSrc,c.nativeContainerId);
  const ban=NR_ADS.parseBannerInput(c.bannerSrc,{key:c.bannerKey,width:c.bannerWidth,height:c.bannerHeight});
  const sl=NR_ADS.parseSmartlinkInput(c.smartUrl);
  const badge={
    active:['check','Active','good'],
    enabled:['check','Enabled','good'],
    off:['x','Off','muted'],
    blocked:['alert','Blocked','warn'],
    nofill:['alert','No fill yet','warn'],
    paused:['alert','Paused','warn'],
    bad:['x','Invalid','bad']
  };
  const unitItem=(on,p,rt,extra,altRt)=>{
    if(!c.active)return ['paused','Master switch is paused'];
    if(!on)return ['off','Turned off'];
    if(!p.ok)return ['bad',p.error];
    const target=p.src||p.url;
    if(!target)return ['off','No URL set'];
    const s=(rt&&rt.src===target&&rt.state!=='idle')?rt:(altRt&&altRt.src===target?altRt:null);
    const state=s?s.state:'idle';
    if(state==='blocked')return ['blocked',p.host+' · blocked by adblocker/shield in this browser'];
    if(state==='loaded'){
      if(s&&s.filled===false)return ['nofill',p.host+' · script connected, waiting for Adsterra ad fill on '+(location.hostname||'this domain')];
      return ['active','Loaded from '+p.host+(extra?' · '+extra:'')];
    }
    return ['enabled',p.host+(extra?' · '+extra:'')];
  };
  const anyOn=(c.socialOn&&soc.ok&&!!soc.src)||(c.nativeOn&&nat.ok&&!!nat.src)||(c.bannerOn&&ban.ok&&!!ban.src)||(c.smartMode!=='off'&&sl.ok&&!!sl.url);
  const syncLabel=st.syncMode==='ads'||st.syncMode==='announcement'?'Live for everyone':'Saved locally';
  const vipCount=(c.adFreeEmails||[]).length;
  const audienceDesc=c.skipUsers?'Guests only (signed-in users ad-free)':(vipCount?`Everyone except ${vipCount} ad-free email${vipCount===1?'':'s'}`+(c.skipKids?' & Kids profiles':''):(c.skipKids?'Everyone except Kids profiles':'All visitors'));
  const items=[
    ['Master switch',c.active&&anyOn?'active':c.active?'nofill':'off',c.active?(anyOn?`${syncLabel} · ${audienceDesc}`:'Enabled, but all formats are off'):'Paused — no ads shown to anyone'],
    ['Social Bar',...unitItem(c.socialOn,soc,st.slots.social,'floating widget on browse & watch pages')],
    ['Native Banner',...unitItem(c.nativeOn,nat,st.slots.native,'below Hero on Home & top of browse pages')],
    ['160×300 Banner',...unitItem(c.bannerOn,ban,st.slots.banner,'title detail sidebar',st.slots.preview)],
    ['Smartlink',!c.active?['paused','Master switch is paused']:c.smartMode==='off'?['off','Turned off']:!sl.ok?['bad',sl.error]:sl.url?['enabled',sl.host+' · '+(c.smartMode==='play'?'Play click (1×/'+c.smartCapHours+'h) + Partner link':'Partner link only')]:['off','No URL set']],
    ['This browser',st.devicePaused?'paused':st.userIsAdFree?'paused':'enabled',st.devicePaused?'Paused on this device only (visitors still see ads)':st.userIsAdFree?`Ad-free via your email (${st.userEmail})`:(c.skipAdmin&&NR_ADMIN?'Paused for admin account (visitors still see ads)':'Showing ads normally on browse pages')]
  ];
  const snip=NR_ADS.buildHtmlSnippet(c);
  const capNote=st.lastSmartAt?`Last Smartlink tab on this browser: ${ago(st.lastSmartAt)}.`:'Smartlink ready (no cooldown active on this browser).';
  const blkBanner=st.anyBlocked?`<div class="adm-ad-alert">${I('alert')}<div><b>Adblocker detected in your browser</b><small><code>bancadeltempoidea.org</code> was blocked by a browser shield or extension (Brave Shields, uBlock Origin, AdGuard, or DNS filter). Visitors without adblockers still see ads — pause your blocker for <b>${esc(location.hostname||'this site')}</b> and click <b>Re-test</b>.</small></div></div>`:'';
  return card('Live Adsterra status',`${blkBanner}<div class="adm-checks">${items.map(([n,k,d])=>{const b=badge[k]||badge.off;return `<div class="adm-chk ${b[2]}"><span class="adm-st">${I(b[0])} ${b[1]}</span><b>${n}</b><small>${esc(d)}</small></div>`}).join('')}</div><p class="mu" style="margin:12px 0 0;font-size:12.5px">${esc(capNote)}</p>`)
    +card('Where each unit appears',`<ol class="adm-steps"><li><b>Native Banner</b> sits right below the Hero banner on <b>Home</b> and at the top of <b>Movies, Series, Anime, Coming Soon &amp; My List</b>.</li><li><b>160×300 Banner</b> renders inside the right-hand info sidebar whenever a viewer opens any movie or series popup.</li><li><b>Social Bar</b> runs as Adsterra’s floating notification widget on browse and watch pages.</li><li><b>Smartlink</b> opens at most once per cooldown window on <b>Play</b>, plus adds a <i>Partner offer</i> link inside title details and the Sponsored bar.</li></ol>${snip?`<pre class="adm-code">${esc(snip)}</pre>`:''}`,snip?`<button class="btn" data-adm="ads-copy">${I('copy')} Copy tags</button>`:'');
}
function ensureAdsPreview(){
  const host=$('#ads-live-preview');
  if(!host||!window.NR_ADS)return;
  NR_ADS.mountBannerPreview(host);
}
function vAds(){
  const c=window.NR_ADS?NR_ADS.getConfig():{};
  const devPause=window.NR_ADS?NR_ADS.getDevicePause():false;
  const smModes=[['play','On Play + link'],['button','Partner link only'],['off','Off']];
  const caps=[[4,'Every 4h'],[12,'Every 12h'],[24,'Every 24h']];
  const tg=(id,on,t,s,cls='ads-tg')=>`<button class="tg ${cls}${on?' on':''}" id="${id}" type="button" aria-pressed="${!!on}"><span>${t}<small>${s}</small></span><i></i></button>`;
  return `<div class="adm-grid"><div class="adm-col">${card('Site-wide ad units',`<p class="mu">Flipping any switch in this card updates <b>live for everyone</b> visiting Nightreel. Press <b>Save</b> after editing tag URLs.</p>
${tg('ads-active',c.active,'Enable Adsterra ads','Master switch — turns ads on or off for everyone')}
${tg('ads-social-on',c.socialOn!==false,'Social Bar','Floating in-page notification widget for all visitors')}
<label class="adm-f">Social Bar script / URL<input id="ads-social" type="text" spellcheck="false" autocomplete="off" value="${esc(c.socialSrc||'')}"></label>
${tg('ads-native-on',c.nativeOn!==false,'Native Banner','Responsive card banner below Hero on Home & top of browse pages')}
<label class="adm-f">Native Banner snippet / URL<textarea id="ads-native" rows="2" spellcheck="false">${esc(c.nativeSrc||'')}</textarea></label>
${tg('ads-banner-on',c.bannerOn!==false,'160×300 Sidebar Banner','Vertical banner inside the Title Detail sidebar')}
<label class="adm-f">160×300 Banner snippet / URL<textarea id="ads-banner" rows="2" spellcheck="false">${esc(c.bannerSrc||'')}</textarea></label>
<p class="setlb">Smartlink behaviour (everyone)</p><div class="seg2" id="ads-smart-mode">${smModes.map(([v,l])=>`<button type="button" data-k="${v}" class="${(c.smartMode||'play')===v?'on':''}">${l}</button>`).join('')}</div>
<p class="setlb">Play-click Smartlink frequency cap</p><div class="seg2" id="ads-smart-cap">${caps.map(([v,l])=>`<button type="button" data-k="${v}" class="${(+c.smartCapHours||12)===v?'on':''}">${l}</button>`).join('')}</div>
<label class="adm-f">Smartlink URL<input id="ads-smart" type="text" spellcheck="false" autocomplete="off" value="${esc(c.smartUrl||'')}"></label>
${tg('ads-skip-users',!!c.skipUsers,'Guests only (no ads for signed-in users)','Show ads only to logged-out visitors; all signed-in accounts browse ad-free')}
${tg('ads-skip-kids',c.skipKids!==false,'Skip on Kids profiles','Never show ads when a Kids profile is active')}
${tg('ads-skip-auth',c.skipAuth!==false,'Skip on Sign-in & Legal pages','Keep sign-in, admin and policy pages ad-free')}
<div class="rowb"><button class="btn p" data-adm="ads-save">${I('check')} Save</button><button class="btn" data-adm="ads-copy">${I('copy')} Copy tags</button><button class="btn" data-adm="ads-defaults">${I('refresh')} Reset defaults</button></div>`,'<span class="adm-scope all">Changes for everyone</span>')}<div id="ads-vip-wrap">${adsVipCardHTML()}</div></div>
<div id="ads-side">${card('Your browser &amp; admin controls',`<p class="mu">These controls only affect <b>you</b> — they never turn off ads for visitors.</p>
${tg('ads-device-pause',devPause,'Pause ads on this browser only','Mute all ads on this PC/phone without changing anything for visitors','ads-local-tg')}
${tg('ads-skip-admin',!!c.skipAdmin,'Skip ads when signed in as admin','Automatically hide ads for your admin login while visitors still see them')}
<div class="rowb" style="margin-top:12px"><button class="btn" data-adm="ads-probe">${I('refresh')} Re-test connection</button><button class="btn" data-adm="ads-test-smart">${I('external')} Test Smartlink</button><button class="btn" data-adm="ads-reset-cap">${I('clock')} Reset my cooldown</button></div>`,'<span class="adm-scope loc">Only affects you</span>')}<div id="ads-status-cards">${adsSideHTML(c)}</div>${card('Live banner test · <code>'+esc(location.hostname||'local')+'</code>',`<p class="mu" style="margin:0 0 10px;font-size:13px">Loads your real Adsterra <code>160×300</code> unit inside this browser to verify connectivity and domain fill.</p><div id="ads-live-preview" class="adm-prev-stage"></div>`,`<button class="btn" data-adm="ads-probe">${I('refresh')} Reload</button>`)}</div></div>`;
}
function adsPrev(){const s=$('#ads-status-cards');if(s)s.innerHTML=adsSideHTML(readAdsDraft());const vw=$('#ads-vip-wrap');if(vw&&(!D.activeElement||D.activeElement.id!=='ads-vip-input'))vw.innerHTML=adsVipCardHTML()}
async function persistAdsDraft(showFullToast){
  if(!window.NR_ADS)return toast('js/ads.js did not load','err');
  const draft=readAdsDraft();
  const res=await NR_ADS.saveConfig(draft,{ann:ADM.ann});
  if(!res.ok){adsPrev();return toast(res.error,'err')}
  if(res.annValue)ADM.ann=res.annValue;
  adsPrev();
  if(showFullToast){
    if(res.synced)toast(res.cfg.active?'Published live for everyone':'Ads paused for everyone','ok');
    else toast('Saved on this browser (run admin-setup.sql in Supabase to sync globally)','ok');
  }else{
    toast(res.synced?(res.cfg.active?'Updated for everyone':'Ads paused for everyone'):'Updated on this browser','ok');
  }
}
function vAnnounce(){const a=ADM.ann||{},kinds=[['info','Info'],['success','Good news'],['warning','Warning']];
  return `<div class="adm-grid">${card('Site-wide announcement',`<p class="mu">Shows as a banner at the top of the site for every visitor until you turn it off. Visitors can dismiss it; a new message shows again.</p>
<label class="adm-f">Message<textarea id="ann-text" maxlength="220" rows="3" placeholder="e.g. New: hover any poster to preview its trailer">${esc(a.text||'')}</textarea></label>
<label class="adm-f">Link (optional)<input id="ann-link" type="url" placeholder="https://… or #movies" value="${esc(a.link||'')}"></label>
<p class="setlb">Style</p><div class="seg2" id="ann-kind">${kinds.map(([v,l])=>`<button type="button" data-k="${v}" class="${(a.kind||'info')===v?'on':''}">${l}</button>`).join('')}</div>
<button class="tg${a.active?' on':''}" id="ann-active" type="button" aria-pressed="${!!a.active}"><span>Show banner<small>Turn on to publish live for everyone, off to hide it</small></span><i></i></button>
<div class="rowb"><button class="btn p" data-adm="ann-save">${I('check')} Save</button></div>`,'<span class="adm-scope all">Changes for everyone</span>')}${card('Preview',`<div class="ann-prev">${annHTML({text:a.text||'Your message will appear here.',kind:a.kind||'info',link:a.link},true)}</div>`)}</div>`}
async function persistAnn(){
  const textEl=$('#ann-text');if(!textEl)return;
  const text=textEl.value.trim(),link=$('#ann-link').value.trim(),kind=($('#ann-kind .on')||{}).dataset?.k||'info',active=$('#ann-active').classList.contains('on');
  if(active&&!text)return toast('Write a message first','err');
  if(link&&!safeLink(link))return toast('The link must start with https:// or #','err');
  const annVal={...(ADM.ann&&ADM.ann.ads?{ads:ADM.ann.ads,ads_updated_at:ADM.ann.ads_updated_at}:{}),text,link,kind,active};
  const {error}=await SB.from('site_config').upsert({key:'announcement',value:annVal,updated_at:new Date().toISOString()});
  if(error)return toast(/site_config/.test(error.message)?'Run admin-setup.sql first':error.message,'err');
  ADM.ann=annVal;toast(active?'Announcement published for everyone':'Announcement hidden for everyone','ok');store.set('nr_ann_x','');loadAnn();
}
function vSystem(){const c=ADM.checks,st={ok:['check','Working','good'],warn:['alert','Check','warn'],bad:['x','Problem','bad'],run:['refresh','Checking…','run']};
  const loc=(()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=k.length+(localStorage.getItem(k)||'').length}}catch(e){}return n*2})();
  let tm=0;try{for(let i=0;i<sessionStorage.length;i++)if(sessionStorage.key(i).startsWith('tm:'))tm++}catch(e){}
  return `<div class="adm-grid">${card('Health checks',c?`<div class="adm-checks">${c.map(x=>{const s=st[x.s];return `<div class="adm-chk ${s[2]}"><span class="adm-st">${I(s[0])} ${s[1]}</span><b>${x.n}</b><small>${esc(x.d)}</small></div>`}).join('')}</div>`:empty('Running checks…'),`<button class="btn" data-adm="checks">${I('refresh')} Re-run</button>`)}
${card('This browser',`<dl class="fact"><div><dt>Saved data on this device</dt><dd>${(loc/1024).toFixed(0)} KB</dd></div><div><dt>Titles in local catalog</dt><dd>${n0(C.length)}</dd></div><div><dt>Cached TMDB responses</dt><dd>${n0(tm)}</dd></div><div><dt>Address</dt><dd>${esc(location.origin)}</dd></div></dl><div class="rowb"><button class="btn" data-adm="clear-cache">${I('trash')} Clear TMDB cache</button><button class="btn" data-adm="export">${I('download')} Export all data</button></div>`)}</div>`}
async function runChecks(){ADM.checks=[{n:'Supabase sign-in service',s:'run',d:''},{n:'Synced data table',s:'run',d:''},{n:'Announcement & ad settings',s:'run',d:''},{n:'TMDB movie data',s:'run',d:''},{n:'Sign-in providers',s:'run',d:''},{n:'Adsterra status',s:'run',d:''}];paint();
  const set=(i,s,d)=>{ADM.checks[i]={...ADM.checks[i],s,d};if(ADM.tab==='system')paint()};
  const t0=performance.now();authCfg(true).then(c=>c?set(0,'ok','Reachable in '+Math.round(performance.now()-t0)+' ms'):set(0,'bad','Could not reach Supabase auth settings'));
  SB.from('app_state').select('user_id',{count:'exact',head:true}).then(({count,error})=>error?set(1,'bad',error.message):set(1,'ok',n0(count)+' rows'));
  SB.from('site_config').select('key',{count:'exact',head:true}).then(({error})=>error?set(2,'warn','Run admin-setup.sql to create it'):set(2,'ok','Ready'));
  const t1=performance.now();T('/configuration').then(()=>set(3,'ok','Responding in '+Math.round(performance.now()-t1)+' ms (may be cached)'),()=>set(3,'bad','TMDB did not respond. Check the API key'));
  authCfg().then(c=>{if(!c)return set(4,'warn','Unknown');const ex=c.external||{},on=['email','google','discord'].filter(k=>ex[k]);set(4,on.length?'ok':'warn',on.length?'Enabled: '+on.join(', '):'None enabled')});
  if(window.NR_ADS){const st=NR_ADS.status(),c=st.cfg,on=['Social Bar','Native','160×300','Smartlink'].filter((_,i)=>[c.socialOn&&st.social.src,c.nativeOn&&st.native.src,c.bannerOn&&st.banner.src,c.smartMode!=='off'&&st.smart.url][i]);set(5,c.active&&on.length?'ok':'warn',c.active?(on.length?'Enabled: '+on.join(', '):'Enabled, all formats off'):'Paused')}else set(5,'warn','js/ads.js not loaded')}
// ---- announcement banner (everyone) ----
function safeLink(l){if(!l)return '';if(/^#[\w-]+$/.test(l))return l;try{const u=new URL(l);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}}
function annHTML(a,preview){const ic={info:'megaphone',success:'check',warning:'alert'}[a.kind]||'megaphone',l=safeLink(a.link);
  return `<div class="nr-ann ann-${['info','success','warning'].includes(a.kind)?a.kind:'info'}"${preview?'':' role="status"'}>${I(ic)}<span>${esc(a.text||'')}</span>${l?`<a href="${esc(l)}"${l[0]==='#'?'':' target="_blank" rel="noopener noreferrer"'}>Learn more ${I('chevR')}</a>`:''}${preview?'':`<button class="nr-ann-x" aria-label="Dismiss">${I('x')}</button>`}</div>`}
async function loadAnn(){if(!SB)return;try{const {data,error}=await SB.from('site_config').select('value,updated_at').eq('key','announcement').maybeSingle();if(error||!data)return;
    ADM.ann=data.value||{};const a=ADM.ann,stamp=data.updated_at||'',old=$('#nr-ann-wrap');if(old)old.remove();
    if(!a.active||!a.text||store.get('nr_ann_x','')===stamp)return;const w=D.createElement('div');w.id='nr-ann-wrap';w.innerHTML=annHTML(a);D.body.append(w);
    w.querySelector('.nr-ann-x').onclick=()=>{store.set('nr_ann_x',stamp);w.remove()};
    // Phones: the banner covers the hero, so fade it out after 6s (it shows again next visit until dismissed)
    if(matchMedia('(max-width:720px)').matches)setTimeout(()=>{if(!w.isConnected)return;w.classList.add('out');setTimeout(()=>w.remove(),400)},6000)}catch(e){}}
// ---- page ----
function gate(t,p,btn){return `<div class="pg"><div class="empty-scene adm-gate"><div aria-hidden="true">${I('shield')}</div><b>${t}</b><p>${p}</p>${btn||''}</div></div>`}
function setup(){return `<div class="pg"><div class="page-heading"><div><h1>${I('shield')} Admin setup</h1><p>One step left: the database rules that make this panel private.</p></div></div>
<div class="pgrid"><section class="pn"><h3>Turn on the admin panel</h3><ol class="adm-steps"><li>Open your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">supabase.com/dashboard</a> and go to <b>SQL Editor → New query</b>.</li><li>Open <b>admin-setup.sql</b> from the Night Reel folder, and replace <code>YOUR-EMAIL-HERE</code> (near the bottom) with the email you sign in to Nightreel with.</li><li>Paste the whole file into Supabase and press <b>Run</b>. The last result should list your email.</li><li>Come back here and reload. The panel appears, and an <b>Admin panel</b> link shows in your account menu.</li></ol><p class="mu">Only accounts in the admins table can read other users’ data. Supabase enforces that, so nobody else gets in even if they find this page.</p><div class="rowb"><button class="btn p" data-adm="recheck">${I('refresh')} I ran it, check again</button></div></section></div></div>`}
function shell(){return `<div class="pg adm"><div class="page-heading"><div><h1>${I('shield')} Admin</h1><p>${esc(AUTH.email||'')} · <span id="adm-upd">${ADM.loadedAt?'updated '+ago(ADM.loadedAt):'loading…'}</span></p></div><div class="rowb"><button class="btn" data-adm="refresh">${I('refresh')} Refresh</button><button class="btn" data-adm="export">${I('download')} Export</button></div></div>
<div class="adm-tabs" role="tablist">${TABS.map(([k,l,ic])=>`<button role="tab" aria-selected="${ADM.tab===k}" class="${ADM.tab===k?'on':''}" data-adm="tab" data-v="${k}">${I(ic)}${l}</button>`).join('')}</div><div id="adm-body"></div></div>`}
function body(){const t=ADM.tab;if(t==='ads')return vAds();if(t==='announce')return vAnnounce();if(t==='system')return vSystem();
  if(ADM.state==='loading'||ADM.state==='idle')return `<div class="adm-kpis">${'<div class="adm-kpi skc" style="height:96px"></div>'.repeat(6)}</div>`;
  if(ADM.state==='error')return `<div class="empty-scene"><b>Couldn’t load admin data</b><p>${esc(ADM.err)}</p><button class="btn" data-adm="refresh">Try again</button></div>`;
  const g=ADM.dg;return t==='users'?vUsers(g):t==='content'?vContent(g):vOverview(g)}
// The user drawer lives at the top level of the page so the fixed nav can't sit on top of it.
function drawer(){let r=$('#adm-drawer-root');if(!r){r=D.createElement('div');r.id='adm-drawer-root';r.className='adm';D.body.append(r)}const u=ADM.sel&&ADM.dg&&location.hash==='#admin'&&ADM.tab==='users'?ADM.dg.users.find(x=>x.id===ADM.sel):null;r.innerHTML=u?vUser(u):'';D.body.style.overflow=u?'hidden':''}
function paint(){drawer();const b=$('#adm-body');if(!b)return;const f=D.activeElement&&D.activeElement.id==='adm-q';b.innerHTML=body();const u=$('#adm-upd');if(u&&ADM.loadedAt)u.textContent='updated '+ago(ADM.loadedAt);
  if(ADM.tab==='ads')ensureAdsPreview();
  if(f){const i=$('#adm-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
function page(){if(!AUTH)return gate('Admin','Sign in with your admin account to continue.','<button class="btn p" data-a="auth" data-m="in">Sign in</button>');
  if(!SB)return gate('Admin','The sign-in service didn’t load. Check your connection and reload.');
  if(!known)return gate('Admin','Checking access…');if(setupMissing)return setup();
  if(!NR_ADMIN)return gate('Not available','This page is only for the site owner.','<a class="btn" href="#home">Back to Home</a>');return shell()}
const _r=render;render=function(){if(location.hash.slice(1)==='admin'&&!q){SEEN.clear();GR=null;io.disconnect();const ht=$('#nr-home-top');if(ht)ht.innerHTML='';$$('#nl a,.dp a').forEach(a=>a.classList.remove('on'));
    $('#app').innerHTML=page();if($('#adm-body')){paint();if(ADM.state==='idle')load();if(ADM.tab==='system'&&!ADM.checks)runChecks()}return}
  ADM.sel=null;drawer();_r.apply(this,arguments)};
// ---- exports ----
function dl(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),a=D.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function csv(){const g=ADM.dg;if(!g)return;const cell=v=>{let t=String(v??'');if(/^[\t\r\n ]*[=+\-@]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};
  const rows=[['Email','Sign-in','Joined','Last sign-in','Confirmed','Syncing','My List','Watched','Finished','Hours','Ratings','Last activity'],...g.users.map(u=>[u.email,u.provider,u.created_at,u.last_sign_in_at||'',u.confirmed,u.synced,u.list,u.started,u.fin,u.hours.toFixed(2),u.rates,u.last?new Date(u.last).toISOString():''])];
  dl('nightreel-users.csv','﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('Users exported','ok')}
// ---- events ----
D.addEventListener('click',async e=>{const t=e.target.closest('[data-adm]');if(!t||!t.closest('.adm,.adm-gate,.pgrid,.adm-drawer-bg'))return;const a=t.dataset.adm;
  if(a==='close'&&(e.target===t||t.classList.contains('x'))){ADM.sel=null;paint();return}if(a==='close')return;
  if(a==='tab'){ADM.tab=t.dataset.v;ADM.sel=null;$$('.adm-tabs button').forEach(b=>{const on=b.dataset.v===ADM.tab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});paint();if(ADM.tab==='system'&&!ADM.checks)runChecks()}
  else if(a==='refresh'){load();if(ADM.tab==='system')runChecks();loadAnn();if(window.NR_ADS)NR_ADS.loadRemote().then(()=>ADM.tab==='ads'&&paint())}
  else if(a==='recheck'){known=false;render();checkAdmin()}
  else if(a==='sort'){const k=t.dataset.k;ADM.dir=ADM.sort===k?-ADM.dir:(k==='email'||k==='provider'?1:-1);ADM.sort=k;paint()}
  else if(a==='user'){ADM.sel=t.dataset.id;if(ADM.tab!=='users'){ADM.tab='users';render()}else paint()}
  else if(a==='copy'){navigator.clipboard&&navigator.clipboard.writeText(t.dataset.v).then(()=>toast('Email copied','ok'),()=>toast(t.dataset.v))}
  else if(a==='wipe'){const u=ADM.dg.users.find(x=>x.id===t.dataset.id);if(!u||!confirm('Permanently clear the synced list, history and settings for '+(u.email||'this user')+'? Their account stays, but this data cannot be recovered.'))return;
    const {error}=await SB.rpc('admin_clear_user_data',{target:u.id});if(error)return toast(error.message,'err');toast('Synced data cleared','ok');ADM.sel=null;load()}
  else if(a==='csv')csv();
  else if(a==='export'){if(!ADM.dg)return toast('Data is still loading','err');dl('nightreel-admin-export.json',JSON.stringify({exported:new Date().toISOString(),users:ADM.users,app_state:ADM.rows},null,1),'application/json');toast('Export downloaded','ok')}
  else if(a==='checks')runChecks();
  else if(a==='clear-cache'){let n=0;try{Object.keys(sessionStorage).filter(k=>k.startsWith('tm:')).forEach(k=>{sessionStorage.removeItem(k);n++})}catch(x){}toast('Cleared '+n+' cached responses','ok');paint()}
  else if(a==='ads-save'){await persistAdsDraft(true);ensureAdsPreview()}
  else if(a==='ads-defaults'){if(!window.NR_ADS)return;if(!confirm('Restore Nightreel’s default Adsterra tags and turn all four formats on? (Your ad-free email list will be kept.)'))return;
    const keepEmails=NR_ADS.getConfig().adFreeEmails||[];
    const res=await NR_ADS.saveConfig({...NR_ADS.DEFAULTS,adFreeEmails:keepEmails},{ann:ADM.ann});if(res.annValue)ADM.ann=res.annValue;paint();toast('Default Adsterra units restored','ok')}
  else if(a==='ads-vip-add'){if(!window.NR_ADS)return;const inp=$('#ads-vip-input');if(!inp)return;
    const res=await NR_ADS.addAdFreeEmail(inp.value,{ann:ADM.ann});if(!res.ok)return toast(res.error,'err');
    if(res.annValue)ADM.ann=res.annValue;inp.value='';const vw=$('#ads-vip-wrap');if(vw)vw.innerHTML=adsVipCardHTML();adsPrev();
    toast('No ads enabled for '+res.added.join(', '),'ok')}
  else if(a==='ads-vip-pick'){if(!window.NR_ADS)return;const em=t.dataset.v;
    const res=await NR_ADS.addAdFreeEmail(em,{ann:ADM.ann});if(!res.ok)return toast(res.error,'err');
    if(res.annValue)ADM.ann=res.annValue;const vw=$('#ads-vip-wrap');if(vw)vw.innerHTML=adsVipCardHTML();adsPrev();
    toast('No ads enabled for '+em,'ok')}
  else if(a==='ads-vip-rm'){if(!window.NR_ADS)return;const em=t.dataset.v;
    const res=await NR_ADS.removeAdFreeEmail(em,{ann:ADM.ann});if(!res.ok)return toast(res.error,'err');
    if(res.annValue)ADM.ann=res.annValue;const vw=$('#ads-vip-wrap');if(vw)vw.innerHTML=adsVipCardHTML();adsPrev();
    toast('Removed '+em+' from ad-free list','ok')}
  else if(a==='vip-toggle'){if(!window.NR_ADS)return;const em=t.dataset.v;if(!em)return;
    const has=NR_ADS.isAdFreeEmail(em);
    const res=has?await NR_ADS.removeAdFreeEmail(em,{ann:ADM.ann}):await NR_ADS.addAdFreeEmail(em,{ann:ADM.ann});
    if(!res.ok)return toast(res.error,'err');if(res.annValue)ADM.ann=res.annValue;paint();
    toast(has?'Ads re-enabled for '+em:'No ads enabled for '+em,'ok')}
  else if(a==='ads-probe'){if(!window.NR_ADS)return;NR_ADS.probe();ensureAdsPreview();adsPrev();toast('Re-testing Adsterra connection…','ok')}
  else if(a==='ads-test-smart'){if(!window.NR_ADS)return;const sl=NR_ADS.parseSmartlinkInput(readAdsDraft().smartUrl);
    if(!sl.ok||!sl.url)return toast(sl.error||'Enter a Smartlink URL first','err');
    window.open(sl.url,'_blank','noopener,noreferrer');toast('Opened Smartlink in a new tab','ok')}
  else if(a==='ads-copy'){if(!window.NR_ADS)return;const snip=NR_ADS.buildHtmlSnippet(readAdsDraft());
    if(!snip)return toast('Enable at least one ad unit first','err');
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(snip).then(()=>toast('Adsterra tags copied','ok'),()=>toast('Could not copy automatically','err'));
    else toast('Copy from the preview box on the right')}
  else if(a==='ads-reset-cap'){if(!window.NR_ADS)return;NR_ADS.resetSmartlinkCap();adsPrev();toast('Smartlink cooldown reset on this browser','ok')}
  else if(a==='ann-save'){await persistAnn()}});
D.addEventListener('click',e=>{const k=e.target.closest('#ann-kind [data-k]');if(k){$$('#ann-kind button').forEach(b=>b.classList.toggle('on',b===k));annPrev();if($('#ann-active')?.classList.contains('on')&&$('#ann-text')?.value.trim())persistAnn()}
  const sm=e.target.closest('#ads-smart-mode [data-k]');if(sm){$$('#ads-smart-mode button').forEach(b=>b.classList.toggle('on',b===sm));persistAdsDraft(false)}
  const sc=e.target.closest('#ads-smart-cap [data-k]');if(sc){$$('#ads-smart-cap button').forEach(b=>b.classList.toggle('on',b===sc));persistAdsDraft(false)}
  const t=e.target.closest('#ann-active,.ads-tg,.ads-local-tg');if(t){
    const nextOn=!t.classList.contains('on');
    if(t.id==='ann-active'&&nextOn&&!$('#ann-text')?.value.trim()){toast('Write a message first before turning on the banner','err');return}
    t.classList.toggle('on',nextOn);t.setAttribute('aria-pressed',nextOn);
    if(t.classList.contains('ads-local-tg')){if(window.NR_ADS){NR_ADS.setDevicePause(nextOn);adsPrev();toast(nextOn?'Ads paused on this browser only':'Ads resumed on this browser','ok')}}
    else if(t.classList.contains('ads-tg'))persistAdsDraft(false);
    else if(t.id==='ann-active')persistAnn()}});
function annPrev(){const p=$('.ann-prev');if(p)p.innerHTML=annHTML({text:$('#ann-text').value||'Your message will appear here.',kind:($('#ann-kind .on')||{}).dataset?.k||'info',link:$('#ann-link').value},true)}
D.addEventListener('input',e=>{if(e.target.id==='adm-q'){ADM.q=e.target.value;paint()}else if(e.target.id==='ann-text'||e.target.id==='ann-link')annPrev();else if(/^ads-(social|native|banner|smart)$/.test(e.target.id||''))adsPrev()});
D.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ads-vip-input'){e.preventDefault();const b=$('[data-adm="ads-vip-add"]');if(b)b.click();return}
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('tr[data-adm="user"]'))e.target.click();if(e.key==='Escape'&&ADM.sel){ADM.sel=null;paint()}});
if(window.NR_ADS){NR_ADS.onStateChange(()=>{if(location.hash==='#admin'&&ADM.tab==='ads')adsPrev()});if(NR_ADS.onRemoteSync)NR_ADS.onRemoteSync(()=>loadAnn())}
// hover tooltips on chart marks
const tip=D.createElement('div');tip.id='adm-tip';tip.hidden=true;D.body.append(tip);
D.addEventListener('pointermove',e=>{const t=e.target.closest&&e.target.closest('.adm [data-tip]');if(!t){tip.hidden=true;return}tip.textContent=t.dataset.tip;tip.hidden=false;
  const w=tip.offsetWidth;tip.style.left=Math.min(innerWidth-w-8,Math.max(8,e.clientX-w/2))+'px';tip.style.top=(e.clientY-44)+'px'},{passive:true});
addEventListener('scroll',()=>{tip.hidden=true},{passive:true});
// ---- start ----
if(AUTH)checkAdmin();else{known=true;if(window.NR_ADS)NR_ADS.notifyAdmin()}
loadAnn();
if(location.hash==='#admin')render();
})();
