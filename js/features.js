// Nightreel · Discover features: Group Pick (live rooms), Swipe mode, Daily movie game, Tonight picker,
// actor/director pages, franchise watch order, "only on my services" filter, Wrapped and release calendar.
// Self-contained: wraps render(), T(), loadPerson() and chkRem() like the other layers. Does not touch the player or ads.
(()=>{
const D=document,$$=(s,r=D)=>[...r.querySelectorAll(s)];
const T0=T; // unfiltered TMDB request (Group Pick and the daily game must be identical for everyone)
const IMG=(s,p)=>'https://image.tmdb.org/t/p/'+s+p;
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const shuffle=(a,seed)=>{a=[...a];let s=seed||Math.random()*1e9|0;const r=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648};for(let i=a.length-1;i>0;i--){const j=Math.floor((seed?r():Math.random())*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const hash=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const uniq=l=>{const s=new Set();return l.filter(c=>c&&!s.has(c.i)&&s.add(c.i))};
const typing=()=>/INPUT|SELECT|TEXTAREA/.test((D.activeElement||{}).tagName||'');

// ---------- shared: what the user has seen ----------
function seenKeys(){const u=me(),s=new Set();if(!u)return s;const add=i=>{const c=C[i];if(c)s.add(c.mt+c.tid)};
  Object.keys(u.prog||{}).forEach(add);Object.keys(u.rt||{}).forEach(add);Object.keys(u.r10||{}).forEach(add);
  Object.entries(u.ws||{}).forEach(([i,v])=>v==='finished'&&add(i));return s}

// ---------- shared: trailers ----------
async function ytKey(c){if(c._tk!==undefined)return c._tk;if(c.vid)return c._tk=c.vid;
  try{const j=await T0('/'+c.mt+'/'+c.tid+'/videos'),v=(j.results||[]).filter(x=>x.site==='YouTube'),t=v.find(x=>x.type==='Trailer'&&x.official)||v.find(x=>x.type==='Trailer')||v.find(x=>x.type==='Teaser')||v[0];c._tk=t?t.key:''}catch(e){c._tk=''}return c._tk}
const ytFrame=k=>`<iframe src="https://www.youtube-nocookie.com/embed/${k}?autoplay=1&rel=0&playsinline=1" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
async function trailerSheet(host,c){if(!host||!c)return;const k=await ytKey(c);if(!k||!/^[\w-]{6,20}$/.test(k))return toast('No trailer for this title yet','err');
  let s=host.querySelector('.nrf-trl');if(!s){s=D.createElement('div');s.className='nrf-trl';host.append(s)}
  s.innerHTML=`<div class="nrf-trl-in"><div class="nrf-trl-v">${ytFrame(k)}</div><div class="nrf-trl-b"><b>${esc(c.t)}</b><button class="btn" data-nrf="trlx">${I('x')} Close trailer</button></div></div>`}

// ---------- "Only on my services" ----------
const region=()=>(me()&&me().st&&me().st.region)||store.get('nr_region','US');
const svcList=()=>{const u=me();return (u&&u.st&&Array.isArray(u.st.svc)?u.st.svc:store.get('nr_svc',[]))};
const svcOn=()=>{const u=me(),on=u&&u.st&&u.st.svcOn!==undefined?u.st.svcOn:store.get('nr_svcon',1),l=svcList();return on&&l.length?l:null};
function svcSet(ids,on){const u=me();if(u){u.st.svc=ids;u.st.svcOn=on?1:0;save()}store.set('nr_svc',ids);store.set('nr_svcon',on?1:0);
  LD=0;render();loadAll().then(()=>render())}
const SVCMAP={'/movie/popular':['/discover/movie','&sort_by=popularity.desc&vote_count.gte=150'],'/movie/top_rated':['/discover/movie','&sort_by=vote_average.desc&vote_count.gte=300'],
  '/movie/now_playing':['/discover/movie','&sort_by=primary_release_date.desc&vote_count.gte=40&primary_release_date.lte=TODAY'],'/tv/popular':['/discover/tv','&sort_by=popularity.desc&vote_count.gte=100'],
  '/trending/all/week':['/discover/movie','&sort_by=popularity.desc&vote_count.gte=300&primary_release_date.gte=YEARAGO']};
T=function(p,x=''){const s=svcOn();if(!s)return T0(p,x);let tag=false;
  if(SVCMAP[p]){const m=SVCMAP[p];tag=p.startsWith('/trending');x=m[1].replace('TODAY',today()).replace('YEARAGO',(new Date().getFullYear()-2)+today().slice(4))+x.replace(/&sort_by=[^&]*/,'');p=m[0]}
  if(/^\/discover\/(movie|tv)$/.test(p)&&!/with_watch_providers/.test(x))x+='&with_watch_providers='+s.join('|')+'&watch_region='+region()+'&with_watch_monetization_types=flatrate|free|ads';
  const r=T0(p,x);return tag?r.then(j=>({...j,results:(j.results||[]).map(o=>({...o,media_type:'movie'}))})):r};
let PROV=null;
async function servicesPage(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="page-heading"><div><h1>My services</h1><p>Pick the streaming services you pay for. Home rows and browse pages will only show what you can actually watch.</p></div></div>
  <div class="nrf-svc-top"><label>Region <select id="nrf-reg" aria-label="Region">${REGIONS.map(([c,n])=>`<option value="${c}"${c===region()?' selected':''}>${n}</option>`).join('')}</select></label><span class="nrf-grow"></span><button class="btn" data-nrf="svc-off">${svcOn()?'Turn filter off':'Filter is off'}</button><button class="btn p" data-nrf="svc-save">${I('check')} Save</button></div>
  <div class="nrf-svc" id="nrf-svc">${'<div class="nrf-svc-t sk"></div>'.repeat(12)}</div></div>`);
  try{const r=region(),j=await T0('/watch/providers/movie','&watch_region='+r),pr=(o)=>((o.display_priorities||{})[r]??o.display_priority??99);
    PROV=(j.results||[]).filter(o=>o.logo_path).sort((a,b)=>pr(a)-pr(b)).slice(0,36);const on=new Set(svcList());if(!$('#nrf-svc'))return;
    $('#nrf-svc').innerHTML=PROV.map(o=>`<button class="nrf-svc-t${on.has(o.provider_id)?' on':''}" data-nrf="svc-t" data-id="${o.provider_id}" aria-pressed="${on.has(o.provider_id)}"><img alt="" loading="lazy" src="${IMG('w92',o.logo_path)}"><span>${esc(o.provider_name)}</span><i>${I('check')}</i></button>`).join('')}
  catch(e){if($('#nrf-svc'))$('#nrf-svc').innerHTML='<p class="empty">Could not load streaming services. Check your connection.</p>'}}
function svcBar(){const s=svcOn(),names=store.get('nr_svcn',{});
  if(s)return `<div class="nrf-svcbar on">${I('tv')}<span>Only showing what’s on <b>${esc(s.map(id=>names[id]||'your services').slice(0,3).join(', '))}${s.length>3?' +'+(s.length-3):''}</b></span><a href="#services">Change</a><button data-nrf="svc-off">Show everything</button></div>`;
  return svcList().length?`<div class="nrf-svcbar">${I('tv')}<span>Your services filter is off.</span><button data-nrf="svc-onq">Turn on</button></div>`:`<div class="nrf-svcbar">${I('tv')}<span>Only want what you can actually watch?</span><a href="#services">Pick my services</a></div>`}

// ---------- Swipe deck (used by Swipe mode and Group Pick) ----------
let DECK=null;
const sCard=c=>`<div class="nrf-pic" style="background-image:url('${IMG('w780',c.p)}')"></div><div class="nrf-shade"></div><div class="nrf-info"><div class="nrf-meta"><span>${I('star','fill')} ${(+c.r||0).toFixed(1)}</span>${c.y?`<span>${c.y}</span>`:''}<span>${TY[c.ty]||''}</span></div><h2>${esc(c.t)}</h2><p class="nrf-g">${esc(c.g.slice(0,3).join(' · '))}</p><p class="nrf-ov">${esc(c.d)}</p></div><b class="nrf-stamp yes">${I('heart','fill')}</b><b class="nrf-stamp no">${I('x')}</b>`;
function makeDeck(el,items,onDecide,onLow){let i=0,busy=false;
  function draw(){const v=items.slice(i,i+3);if(!v.length){el.innerHTML='';onLow&&onLow(0);return}
    el.innerHTML=v.map((c,n)=>`<div class="nrf-card" data-n="${n}" style="--n:${n}" aria-label="${esc(c.t)}">${sCard(c)}</div>`).reverse().join('');bind();
    if(items.length-i<5&&onLow)onLow(items.length-i)}
  function bind(){const c=el.querySelector('.nrf-card[data-n="0"]');if(!c)return;let sx=0,sy=0,dx=0,dy=0,drag=false;
    c.onpointerdown=e=>{drag=true;sx=e.clientX;sy=e.clientY;dx=dy=0;try{c.setPointerCapture(e.pointerId)}catch(x){}c.classList.add('drag')};
    c.onpointermove=e=>{if(!drag)return;dx=e.clientX-sx;dy=e.clientY-sy;c.style.transform=`translate(${dx}px,${dy}px) rotate(${dx/16}deg)`;
      c.style.setProperty('--yes',Math.max(0,Math.min(1,dx/120)).toFixed(2));c.style.setProperty('--no',Math.max(0,Math.min(1,-dx/120)).toFixed(2))};
    c.onpointerup=c.onpointercancel=()=>{if(!drag)return;drag=false;c.classList.remove('drag');
      if(dx>110)go('yes');else if(dx<-110)go('no');else if(dy<-110&&Math.abs(dx)<90){reset(c);go('up')}else reset(c)}}
  const reset=c=>{c.style.transform='';c.style.setProperty('--yes',0);c.style.setProperty('--no',0)};
  function go(d){const it=items[i];if(!it||busy)return;if(d==='up'){onDecide(it,'up');return}
    const c=el.querySelector('.nrf-card[data-n="0"]');busy=true;
    if(c){c.classList.add('gone');c.style.setProperty('--'+d,1);c.style.transform=`translate(${d==='yes'?140:-140}vw,${-40}px) rotate(${d==='yes'?28:-28}deg)`}
    i++;onDecide(it,d);setTimeout(()=>{busy=false;draw()},230)}
  draw();return {go,draw,push(more){const had=items.length-i;items.push(...more);if(!had)draw()},get cur(){return items[i]},get left(){return items.length-i},get idx(){return i},set idx(v){i=v}}}
addEventListener('keydown',e=>{if(!DECK||typing()||D.querySelector('.ovl.o,#pl.o')||!$('#nrf-deck'))return;
  if(e.key==='ArrowRight'){e.preventDefault();DECK.go('yes')}else if(e.key==='ArrowLeft'){e.preventDefault();DECK.go('no')}else if(e.key==='ArrowUp'){e.preventDefault();DECK.go('up')}
  else if(e.key==='Escape'){const t=$('.nrf-trl');if(t)t.remove()}});
const deckUI=(title,right)=>`<div class="nrf-top"><a class="nrf-ib" href="#discover" aria-label="Back">${I('chevL')}</a><div class="nrf-tt">${title}</div>${right||'<span class="nrf-ib0"></span>'}</div>
  <div class="nrf-deck" id="nrf-deck"><div class="nrf-card nrf-sk"></div></div>
  <div class="nrf-acts"><button class="nrf-b no" data-nrf="sw" data-d="no" aria-label="Skip">${I('x')}</button><button class="nrf-b up" data-nrf="sw" data-d="up" aria-label="Trailer">${I('play')}</button><button class="nrf-b yes" data-nrf="sw" data-d="yes" aria-label="Yes">${I('heart','fill')}</button></div>`;

// ---------- Swipe mode ----------
const SW={page:0,seen:new Set(),saved:0,loading:false,items:[]};
async function swipeMore(){if(SW.loading)return [];SW.loading=true;SW.page++;const u=me(),sk=seenKeys();
  let src=SW.page===1?[...(u?pick(u):[]),...(L.trend||[]),...(L.pm||[]),...(L.ps||[])]:[];
  try{const j=await T('/discover/movie','&sort_by=popularity.desc&vote_count.gte=150&include_adult=false&page='+SW.page);src=src.concat((j.results||[]).map(x=>ing(x,'movie')))}catch(e){}
  if(SW.page%2===0)try{const j=await T('/discover/tv','&sort_by=popularity.desc&vote_count.gte=150&page='+(SW.page/2));src=src.concat((j.results||[]).map(x=>ing(x,'tv')))}catch(e){}
  saveCat();SW.loading=false;
  return shuffle(uniq(src).filter(c=>c.p&&!SW.seen.has(c.i)&&!(u&&u.list.includes(c.i))&&!sk.has(c.mt+c.tid)&&SW.seen.add(c.i)))}
async function swipePage(){show(`<div class="nrf-fs" id="nrf-root">${deckUI('Swipe',`<span class="nrf-pill" id="nrf-swc">${I('heart','fill')} ${SW.saved}</span>`)}<p class="nrf-hint">Right to save to My List · Left to skip · Up for the trailer</p></div>`,1);
  if(!SW.items.length)SW.items=await swipeMore();if(!$('#nrf-deck'))return;const rest=SW.items;SW.items=[];
  DECK=makeDeck($('#nrf-deck'),rest,(c,d)=>{const host=$('#nrf-root');
    if(d==='up')return trailerSheet(host,c);
    if(d==='yes'){const u=me();if(!u){toast('Sign in to save titles to My List','err');return}
      if(!u.list.includes(c.i)){u.list.push(c.i);u.ws=u.ws||{};u.ws[c.i]='want';save()}SW.saved++;const p=$('#nrf-swc');if(p)p.innerHTML=I('heart','fill')+' '+SW.saved;toast('Saved '+c.t+' to My List','ok')}},
    async left=>{if(SW.loading)return;const more=await swipeMore();if(DECK&&$('#nrf-deck'))DECK.push(more);if(!more.length&&!left&&$('#nrf-deck'))$('#nrf-deck').innerHTML=emptyScene('You’ve seen it all','Nothing new left to swipe right now. Come back later.','#home','Back to Home')})}

// ---------- Group Pick ----------
const CODEC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode=()=>Array.from({length:6},()=>CODEC[Math.random()*CODEC.length|0]).join('');
const CID=(()=>{try{let v=sessionStorage.getItem('nr_cid');if(!v){v=Math.random().toString(36).slice(2,10);sessionStorage.setItem('nr_cid',v)}return v}catch(e){return Math.random().toString(36).slice(2,10)}})();
let ROOM=null;
const gpName=()=>{const u=me(),ok=n=>n&&n!=='Me'&&n!=='Guest'?n:'';return ok(u&&u.name)||ok(AUTH&&A&&A.name)||store.get('nr_gpname','')};
function leaveRoom(){if(!ROOM)return;try{ROOM.ch&&SB&&SB.removeChannel(ROOM.ch)}catch(e){}ROOM=null}
function pickHub(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="nrf-hero2" style="--h:280"><div class="nrf-hi">${I('users')}</div><h1>Group Pick</h1><p>Start a room, send the link, and everyone swipes yes or no. The moment you all say yes to the same movie, it’s decided.</p>
  <div class="nrf-row"><button class="btn p" data-nrf="gp-new">${I('plus')} Start a room</button></div>
  <form class="nrf-join" data-nrf-form="join"><input id="nrf-code" maxlength="8" placeholder="Room code" aria-label="Room code" autocomplete="off" autocapitalize="characters"><button class="btn" type="submit">Join</button></form></div>
  <div class="nrf-how"><div><b>1</b>Start a room and share the link</div><div><b>2</b>Everyone swipes on the same movies</div><div><b>3</b>All yes on one? It’s a match</div></div></div>`)}
async function roomDeck(code,round){const seed=hash(code),pages=[1+(seed+round*2)%30,1+(seed+round*2+1)%30];
  const js=await Promise.all(pages.map(p=>T0('/discover/movie','&sort_by=popularity.desc&vote_count.gte=1500&include_adult=false&page='+p).catch(()=>({}))));
  const it=js.flatMap(j=>j.results||[]).filter(x=>x.poster_path).sort((a,b)=>a.id-b.id).map(x=>ing(x,'movie')).filter(Boolean);saveCat();return shuffle(uniq(it),seed+round+1)}
function roomSave(){if(!ROOM)return;try{sessionStorage.setItem('nr_gp_'+ROOM.code,JSON.stringify({idx:DECK?DECK.idx:0,yes:[...ROOM.yes],n:ROOM.count,round:ROOM.round}))}catch(e){}}
async function roomPage(code){
  if(!SB)return show(`<div class="pg nrf-pg" id="nrf-root">${emptyScene('Live rooms are unavailable','The live connection could not start in this browser. Reload the page and try again.','#pick','Back')}</div>`);
  if(!gpName())return show(`<div class="pg nrf-pg" id="nrf-root"><div class="nrf-hero2" style="--h:280"><div class="nrf-hi">${I('users')}</div><h1>Join room ${esc(code)}</h1><p>What should your friends call you?</p><form class="nrf-join" data-nrf-form="name"><input id="nrf-nm" maxlength="20" placeholder="Your name" aria-label="Your name" autocomplete="nickname"><button class="btn p" type="submit">Join room</button></form></div></div>`);
  if(ROOM&&ROOM.code===code&&$('#nrf-root[data-room="'+code+'"]'))return;
  leaveRoom();let saved={};try{saved=JSON.parse(sessionStorage.getItem('nr_gp_'+code)||'{}')}catch(e){}
  ROOM={code,yes:new Set(saved.yes||[]),count:saved.n||0,round:saved.round||0,shown:new Set(),members:[],items:[],ch:null,status:'connecting'};const R=ROOM;
  show(`<div class="nrf-fs nrf-room" id="nrf-root" data-room="${code}">${deckUI('Room <b>'+esc(code)+'</b>',`<button class="nrf-ib" data-nrf="gp-share" aria-label="Share room link">${I('share')}</button>`)}
    <div class="nrf-mem" id="nrf-mem"><span class="nrf-wait">Connecting…</span></div><div class="nrf-mlist" id="nrf-ml"></div></div>`,1);
  R.items=await roomDeck(code,R.round);if(ROOM!==R||!$('#nrf-deck'))return;
  DECK=makeDeck($('#nrf-deck'),R.items.slice(),(c,d)=>{if(d==='up')return trailerSheet($('#nrf-root'),c);R.count++;if(d==='yes')R.yes.add(c.tid);roomSave();track()},
    async left=>{if(left)return;const el=$('#nrf-deck');if(!el||ROOM!==R)return;el.innerHTML=`<div class="nrf-done"><b>You’ve swiped them all</b><p>Waiting on the others, or load another batch for everyone.</p><button class="btn p" data-nrf="gp-more">Load more movies</button></div>`});
  if(saved.idx){DECK.idx=Math.min(saved.idx,R.items.length);DECK.draw()}
  const ch=SB.channel('nrpick-'+code,{config:{presence:{key:CID}}});R.ch=ch;
  ch.on('presence',{event:'sync'},()=>{if(ROOM===R)roomSync()}).subscribe(st=>{if(ROOM!==R)return;R.status=st;if(st==='SUBSCRIBED')track();else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){const m=$('#nrf-mem');if(m)m.innerHTML='<span class="nrf-wait err">Live connection failed. Check your internet and reload.</span>'}})}
let trT=0;function track(){clearTimeout(trT);trT=setTimeout(()=>{const R=ROOM;if(!R||!R.ch||R.status!=='SUBSCRIBED')return;R.ch.track({n:gpName().slice(0,20),y:[...R.yes].slice(-300),c:R.count,r:R.round}).catch(()=>{})},150)}
function roomSync(){const R=ROOM;if(!R||!R.ch)return;const st=R.ch.presenceState();
  // Presence data comes from other people's browsers: keep only the expected types and sizes.
  const clean=p=>{p=p&&typeof p==='object'?p:{};const int=(v,max)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.max(0,Math.min(max,v)):0};
    return {n:typeof p.n==='string'?p.n.replace(/[\u0000-\u001f]/g,'').slice(0,20):'',c:int(p.c,100000),r:int(p.r,40),y:Array.isArray(p.y)?p.y.slice(-300).map(v=>int(v,1e9)).filter(Boolean):[]}};
  R.members=Object.entries(st).slice(0,24).map(([k,a])=>({k:String(k).slice(0,40),...clean(a[a.length-1])}));const m=$('#nrf-mem');
  if(m)m.innerHTML=R.members.map(x=>`<span class="nrf-av${x.k===CID?' me':''}" title="${esc(x.n||'Guest')}"><i>${esc((x.n||'?').slice(0,1).toUpperCase())}</i>${esc(x.k===CID?'You':(x.n||'Guest'))}<small>${x.c||0}</small></span>`).join('')+(R.members.length<2?'<span class="nrf-wait">Waiting for friends. Share the link.</span>':'');
  if(R.members.length<2)return;
  const maxR=Math.max(...R.members.map(x=>x.r||0));if(maxR>R.round)loadRound(maxR);
  const all=R.members.map(x=>new Set(x.y||[])),pool=uniq([...R.items,...C.filter(c=>c.mt==='movie'&&R.yes.has(c.tid))]);
  const hits=pool.filter(c=>all.every(s=>s.has(c.tid)));
  const ml=$('#nrf-ml');if(ml)ml.innerHTML=hits.length?`<b>Matches</b>${hits.map(c=>`<button data-nrf="gp-m" data-id="${c.i}"><img alt="" src="${IMG('w92',c.p)}">${esc(c.t)}</button>`).join('')}`:'';
  const fresh=hits.find(c=>!R.shown.has(c.tid));hits.forEach(c=>R.shown.add(c.tid));if(fresh)matchPop(fresh)}
async function loadRound(n){const R=ROOM;if(!R||R.loadingRound)return;R.loadingRound=1;R.round=n;const more=(await roomDeck(R.code,n)).filter(c=>!R.items.includes(c));R.loadingRound=0;if(ROOM!==R)return;R.items.push(...more);if(DECK)DECK.push(more);roomSave();track()}
function matchPop(c){const host=$('#nrf-root');if(!host)return;let o=host.querySelector('.nrf-match');if(!o){o=D.createElement('div');o.className='nrf-match';host.append(o)}
  o.innerHTML=`<div class="nrf-match-in"><div class="nrf-match-p" style="background-image:url('${IMG('w500',c.p)}')"></div><small>${I('sparkles')} It’s a match</small><h2>You’re watching <span>${esc(c.t)}</span> tonight.</h2><p>Everyone in the room said yes.</p><div class="nrf-row"><button class="btn p" data-nrf="gp-trl" data-id="${c.i}">${I('play')} Trailer</button><button class="btn" data-nrf="gp-m" data-id="${c.i}">Details</button><button class="btn" data-nrf="gp-x">Keep swiping</button></div></div>`;
  try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate([30,40,60])}catch(e){}}

// ---------- Daily movie game ----------
const DAY0=Date.UTC(2026,0,1),dayN=()=>{const n=new Date();return Math.floor((Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())-DAY0)/864e5)};
const BLUR=[26,18,12,7,4,2],MAXG=6;
let DG=null;
const dgStats=()=>Object.assign({streak:0,best:0,played:0,wins:0,last:-9,dist:[0,0,0,0,0,0]},store.get('nr_dstat',{}));
const dgStreak=()=>{const s=dgStats(),d=dayN();return s.last>=d-1?s.streak:0};
async function dailyMovie(d){const j=await T0('/discover/movie','&sort_by=vote_count.desc&include_adult=false&page='+(1+(d*7)%40)),r=(j.results||[]).filter(x=>x.poster_path);
  const x=r[(d*13)%r.length];const det=await T0('/movie/'+x.id,'&append_to_response=credits').catch(()=>({}));
  return {id:x.id,t:x.title,y:(x.release_date||'').slice(0,4),p:x.poster_path,g:(det.genres||[]).map(g=>g.name).slice(0,2),cast:((det.credits||{}).cast||[]).slice(0,1).map(c=>c.name)[0]||'',dir:(((det.credits||{}).crew||[]).find(c=>c.job==='Director')||{}).name||'',raw:x}}
async function dailyPage(){const d=dayN();show(`<div class="pg nrf-pg nrf-daily" id="nrf-root"><div class="page-heading"><div><h1>Daily movie</h1><p>Guess today’s movie from the blurry poster. It gets clearer with every wrong guess. New puzzle every day at midnight.</p></div><div class="nrf-streak">${I('flame')}<b>${dgStreak()}</b><span>day streak</span></div></div><div id="nrf-dg"><div class="nrf-dg-wrap"><div class="nrf-dg-p sk"></div></div></div></div>`);
  try{if(!DG||DG.d!==d)DG={d,m:await dailyMovie(d)};}catch(e){if($('#nrf-dg'))$('#nrf-dg').innerHTML='<p class="empty">Could not load today’s movie. Check your connection.</p>';return}
  drawDaily()}
const dgState=()=>{const s=store.get('nr_daily',{});return s.d===dayN()?s:{d:dayN(),g:[],done:0,win:0}};
function drawDaily(){const el=$('#nrf-dg');if(!el||!DG)return;const s=dgState(),m=DG.m,wrong=s.g.filter(x=>x.id!==m.id).length,fin=s.done,st=dgStats();
  const hints=[['Year',m.y],['Genre',m.g.join(', ')],['Starring',m.cast],['Director',m.dir],['Title',m.t.replace(/[A-Za-z0-9]/g,(ch,i)=>i===0||m.t[i-1]===' '?ch:'_')]];
  el.innerHTML=`<div class="nrf-dg-wrap"><div class="nrf-dg-p${fin?' clear':''}"><img alt="Today’s poster" src="${IMG('w500',m.p)}" style="filter:blur(${fin?0:BLUR[Math.min(wrong,MAXG-1)]}px)"></div>
    <div class="nrf-dg-side"><div class="nrf-dg-tries">${Array.from({length:MAXG},(_,i)=>{const g=s.g[i];return `<span class="${g?(g.id===m.id?'ok':g.id?'no':'sk'):''}">${g?esc(g.id?g.t:'Skipped'):''}</span>`}).join('')}</div>
    <div class="nrf-hints">${hints.slice(0,fin?5:wrong).filter(h=>h[1]).map(h=>`<div><small>${h[0]}</small><b>${esc(h[1])}</b></div>`).join('')||'<p class="mu">Each wrong guess unlocks a hint.</p>'}</div>
    ${fin?`<div class="nrf-dg-res ${s.win?'w':'l'}"><small>${s.win?'You got it in '+s.g.length:'Out of guesses'}</small><h2>${esc(m.t)} <span>${m.y}</span></h2>
      <div class="nrf-row"><button class="btn p" data-nrf="dg-share">${I('share')} Share result</button><button class="btn" data-nrf="dg-open">See the movie</button></div>
      <div class="nrf-dstats"><div><b>${st.played}</b>Played</div><div><b>${st.played?Math.round(st.wins/st.played*100):0}%</b>Wins</div><div><b>${dgStreak()}</b>Streak</div><div><b>${st.best}</b>Best</div></div>
      <div class="nrf-dist">${st.dist.map((n,i)=>`<div><span>${i+1}</span><i style="width:${Math.max(6,n/Math.max(1,...st.dist)*100)}%" class="${s.win&&s.g.length===i+1?'on':''}">${n}</i></div>`).join('')}</div>
      <p class="mu" id="nrf-next"></p></div>`
    :`<div class="nrf-guess"><input id="nrf-gi" placeholder="Type a movie title…" autocomplete="off" aria-label="Your guess"><div class="nrf-sug" id="nrf-sug"></div><div class="nrf-row"><button class="btn" data-nrf="dg-skip">Skip (reveal more)</button><span class="mu">${MAXG-s.g.length} guesses left</span></div></div>`}</div></div>`;
  if(fin)tickNext()}
function tickNext(){const el=$('#nrf-next');if(!el)return;const n=new Date(),mid=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),ms=mid-n;el.textContent='Next movie in '+Math.floor(ms/36e5)+'h '+Math.floor(ms%36e5/6e4)+'m';setTimeout(tickNext,30000)}
function dgGuess(id,t){const s=dgState();if(s.done||!DG)return;s.g.push({id,t});const win=id===DG.m.id;
  if(win||s.g.length>=MAXG){s.done=1;s.win=win?1:0;const st=dgStats();st.played++;if(win){st.wins++;st.streak=st.last===s.d-1?st.streak+1:1;st.last=s.d;st.best=Math.max(st.best,st.streak);st.dist[s.g.length-1]++}else{st.streak=0}store.set('nr_dstat',st);
    if(win)toast('Nailed it','ok')}else if(id)toast('Not quite. The poster just got clearer','err');
  store.set('nr_daily',s);drawDaily();const h=$('.nrf-streak b');if(h)h.textContent=dgStreak();setTimeout(()=>{const i=$('#nrf-gi');i&&i.focus()},50)}
let sugT=0;D.addEventListener('input',e=>{if(e.target.id!=='nrf-gi')return;clearTimeout(sugT);const v=e.target.value.trim(),box=$('#nrf-sug');if(v.length<2){box.innerHTML='';return}
  sugT=setTimeout(async()=>{try{const j=await T0('/search/movie','&include_adult=false&query='+encodeURIComponent(v));if(!$('#nrf-sug')||$('#nrf-gi').value.trim()!==v)return;
    const used=new Set(dgState().g.map(g=>g.id));$('#nrf-sug').innerHTML=(j.results||[]).filter(x=>!used.has(x.id)).slice(0,6).map(x=>`<button data-nrf="dg-g" data-id="${x.id}" data-t="${esc(x.title)}">${esc(x.title)} <small>${(x.release_date||'').slice(0,4)}</small></button>`).join('')||'<p class="mu">No matches</p>'}catch(x){}},220)});

// ---------- Tonight picker ----------
const TMOOD=[['Laugh','smile','35'],['Thrill me','zap','28|53'],['Feel something','heart','18|10749'],['Get scared','ghost','27'],['Mind-bending','infinity','878|9648'],['Escape','wand','14|12']];
const TTIME=[['Under 1h 40m','clock',100],['About 2 hours','coffee',135],['All night','moon',0]];
const TWHO=[['Just me','user',''],['Date night','heart','&without_genres=16|10751'],['Friends','users',''],['Family','home','&certification_country=US&certification.lte=PG']];
const TN={s:0,a:[]};
function openTonight(){TN.s=0;TN.a=[];drawTonight();$('#au').classList.add('o')}
function drawTonight(){const steps=[['What’s the mood?',TMOOD],['How much time do you have?',TTIME],['Who’s watching?',TWHO]],box=$('#au');
  if(TN.s<3){const [h,o]=steps[TN.s];box.innerHTML=`<div class="au nrf-tn"><button class="x" data-a="cl" aria-label="Close">${I('x')}</button><div class="nrf-dots">${[0,1,2].map(i=>`<i class="${i<=TN.s?'on':''}"></i>`).join('')}</div><small class="mu">Tonight picker · ${TN.s+1} of 3</small><h2>${h}</h2><div class="nrf-opts">${o.map((x,i)=>`<button data-nrf="tn" data-v="${i}">${I(x[1])}<span>${x[0]}</span></button>`).join('')}</div>${TN.s?'<button class="nrf-link" data-nrf="tn-back">Back</button>':''}</div>`;return}
  box.innerHTML=`<div class="au nrf-tn wide"><button class="x" data-a="cl" aria-label="Close">${I('x')}</button><small class="mu">${esc([TMOOD[TN.a[0]][0],TTIME[TN.a[1]][0],TWHO[TN.a[2]][0]].join(' · '))}</small><h2>Your three for tonight</h2><div class="nrf-tnr" id="nrf-tnr">${'<div class="nrf-tnc sk"></div>'.repeat(3)}</div><div class="nrf-row c"><button class="btn" data-nrf="tn-again">${I('shuffle')} Shuffle</button><button class="btn" data-nrf="tn-reset">Start over</button></div></div>`;tonightPicks()}
async function tonightPicks(){const [m,t,w]=TN.a,sk=seenKeys(),u=me();
  const base='&include_adult=false&sort_by=popularity.desc&vote_count.gte=300&vote_average.gte=6.2&with_genres='+TMOOD[m][2];
  const tries=[base+(TTIME[t][2]?'&with_runtime.lte='+TTIME[t][2]:'&with_runtime.gte=100')+TWHO[w][2],base+TWHO[w][2],base];let pool=[];
  for(const x of tries){const pg=1+(Math.random()*3|0);try{const js=await Promise.all([pg,pg+3].map(p=>T('/discover/movie',x+'&page='+p)));pool=uniq(js.flatMap(j=>j.results||[]).map(r=>ing(r,'movie'))).filter(c=>c.p&&!sk.has(c.mt+c.tid)&&!(u&&u.list.includes(c.i)))}catch(e){}if(pool.length>=3)break}
  saveCat();const out=shuffle(pool).slice(0,3),el=$('#nrf-tnr');if(!el)return;
  if(!out.length){el.innerHTML='<p class="empty">Nothing matched. Try a different mix.</p>';return}
  out.forEach(c=>ytKey(c));
  el.innerHTML=out.map(c=>`<div class="nrf-tnc"><div class="nrf-tnv" id="nrf-tv${c.i}" style="background-image:url('${IMG('w500',c.p)}')"><button class="nrf-play" data-nrf="tn-play" data-id="${c.i}" aria-label="Play trailer for ${esc(c.t)}">${I('play')}</button></div><div class="nrf-tnb"><b>${esc(c.t)}</b><small>${I('star','fill')} ${(+c.r).toFixed(1)} · ${c.y||''} · ${esc(c.g.slice(0,2).join(', '))}</small><p>${esc((c.d||'').slice(0,140))}${(c.d||'').length>140?'…':''}</p><button class="btn" data-nrf="tn-open" data-id="${c.i}">Details</button></div></div>`).join('')}

// ---------- Actor and director pages ----------
let PCR=new Map(),PST={f:'all',s:'new'};
loadPerson=async function(id){
  try{const d=await T0('/person/'+id,'&append_to_response=combined_credits');if(!$('#pp'))return;const cr=d.combined_credits||{};PCR=new Map();PST={f:d.known_for_department==='Directing'?'dir':'all',s:'new'};
    [...(cr.cast||[]).map(x=>[x,x.character||'','act']),...(cr.crew||[]).map(x=>[x,x.job||'',x.job==='Director'?'dir':'crew'])].forEach(([x,role,k])=>{
      if(x.media_type!=='movie'&&x.media_type!=='tv')return;if(x.adult||(x.genre_ids||[]).some(g=>g===10767||g===10763))return;const key=x.media_type+x.id,o=PCR.get(key);
      if(o){if(role&&!o.roles.includes(role))o.roles.push(role);o.ks.add(k)}else PCR.set(key,{...x,key,roles:role?[role]:[],ks:new Set([k])})});
    const all=[...PCR.values()],sk=seenKeys(),seen=all.filter(x=>sk.has(x.key)),sm=seen.filter(x=>x.media_type==='movie').length,ss=seen.length-sm;
    const nm=all.filter(x=>x.media_type==='movie').length,dirN=all.filter(x=>x.ks.has('dir')).length;
    const cardsOf=l=>l.map(x=>ing(x)).filter(Boolean);
    const known=cardsOf(all.filter(x=>x.poster_path).sort((a,b)=>b.popularity-a.popularity).slice(0,16));
    const best=cardsOf(all.filter(x=>x.poster_path&&x.vote_count>=200&&!(x.genre_ids||[]).includes(99)).sort((a,b)=>b.vote_average-a.vote_average).slice(0,12));saveCat();
    const bd=d.birthday?new Date(d.birthday+'T12:00'):null,age=bd&&!d.deathday?Math.floor((Date.now()-bd)/315576e5):null;
    $('#pp').innerHTML=`<div class="pcard"><div class="bigav" style="${d.profile_path?`background:url('${IMG('w185',d.profile_path)}') center/cover`:''}">${d.profile_path?'':I('user')}</div><div><h1>${esc(d.name)}</h1><p class="mu">${esc(d.known_for_department||'')}${d.birthday?' · Born '+esc(d.birthday)+(age?' ('+age+')':''):''}${d.place_of_birth?' · '+esc(d.place_of_birth):''}</p>
      <div class="nrf-pchips"><span>${nm} movies</span><span>${all.length-nm} series</span>${dirN?`<span>${dirN} directed</span>`:''}${me()?`<span class="nrf-seen${seen.length?' on':''}">${I('eye')} ${seen.length?`You’ve seen ${sm} of their movie${sm===1?'':'s'}${ss?' and '+ss+' series':''}`:'You haven’t seen any of their work yet'}</span>`:''}</div></div></div>
      ${d.biography?`<p class="bio">${esc(d.biography.slice(0,600))}${d.biography.length>600?'…':''}</p>`:''}
      ${known.length?`<h2 class="ph">Known for</h2><div class="gr">${known.map(c=>card(c,{s:sk.has(c.mt+c.tid)?'Seen':''})).join('')}</div>`:''}
      ${best.length>3?`<h2 class="ph">Best rated</h2><div class="gr">${best.map(c=>card(c,{s:(+c.r).toFixed(1)+' on TMDB'})).join('')}</div>`:''}
      <div class="nrf-fh"><h2 class="ph">Full filmography <span class="mu">${all.length}</span></h2><div class="chips">${[['all','All'],['act','Acting'],['dir','Directing'],['crew','Other crew']].filter(([k])=>k==='all'||all.some(x=>x.ks.has(k))).map(([k,l])=>`<button data-nrf="pf" data-v="${k}" class="${PST.f===k?'on':''}">${l}</button>`).join('')}<select id="nrf-ps" aria-label="Sort filmography"><option value="new">Newest</option><option value="old">Oldest</option><option value="top">Top rated</option></select></div></div><div class="nrf-film" id="nrf-film"></div>`;
    drawFilm()}
  catch(e){if($('#pp'))$('#pp').innerHTML='<p class="empty">Could not load this person.</p>';toast('Failed to load person','err')}};
function drawFilm(){const el=$('#nrf-film');if(!el)return;const sk=seenKeys(),dt=x=>x.release_date||x.first_air_date||'';
  let l=[...PCR.values()].filter(x=>PST.f==='all'||x.ks.has(PST.f));
  l.sort(PST.s==='top'?(a,b)=>(b.vote_count>=50?b.vote_average:0)-(a.vote_count>=50?a.vote_average:0):PST.s==='old'?(a,b)=>(dt(a)||'9999').localeCompare(dt(b)||'9999'):(a,b)=>(dt(b)||'9999').localeCompare(dt(a)||'9999'));
  el.innerHTML=l.map(x=>`<button class="nrf-fi${sk.has(x.key)?' seen':''}" data-nrf="pc" data-k="${x.key}"><span class="nrf-fy">${dt(x).slice(0,4)||'TBA'}</span>${x.poster_path?`<img loading="lazy" alt="" src="${IMG('w92',x.poster_path)}">`:'<i></i>'}<span class="nrf-ft"><b>${esc(x.title||x.name||'')}</b><small>${x.media_type==='tv'?'Series · ':''}${esc(x.roles.slice(0,2).join(', '))}</small></span>${x.vote_count>=50?`<span class="nrf-fr">${I('star','fill')} ${(+x.vote_average).toFixed(1)}</span>`:''}${sk.has(x.key)?`<span class="nrf-fs2">${I('check')}</span>`:''}</button>`).join('')||'<p class="empty">Nothing here.</p>'}

// ---------- Franchise watch order ----------
const FR={
  mcu:['Marvel Cinematic Universe',220,[['Captain America: The First Avenger',2011],['Captain Marvel',2019],['Iron Man',2008],['Iron Man 2',2010],['The Incredible Hulk',2008],['Thor',2011],['The Avengers',2012],['Thor: The Dark World',2013],['Iron Man 3',2013],['Captain America: The Winter Soldier',2014],['Guardians of the Galaxy',2014],['Guardians of the Galaxy Vol. 2',2017],['Avengers: Age of Ultron',2015],['Ant-Man',2015],['Captain America: Civil War',2016],['Black Widow',2021],['Black Panther',2018],['Spider-Man: Homecoming',2017],['Doctor Strange',2016],['Thor: Ragnarok',2017],['Ant-Man and the Wasp',2018],['Avengers: Infinity War',2018],['Avengers: Endgame',2019],['Shang-Chi and the Legend of the Ten Rings',2021],['Spider-Man: Far From Home',2019],['Eternals',2021],['Spider-Man: No Way Home',2021],['Doctor Strange in the Multiverse of Madness',2022],['Thor: Love and Thunder',2022],['Black Panther: Wakanda Forever',2022],['Ant-Man and the Wasp: Quantumania',2023],['Guardians of the Galaxy Vol. 3',2023],['The Marvels',2023],['Deadpool & Wolverine',2024],['Captain America: Brave New World',2025],['Thunderbolts*',2025],['The Fantastic Four: First Steps',2025]]],
  sw:['Star Wars',210,[['Star Wars: Episode I - The Phantom Menace',1999],['Star Wars: Episode II - Attack of the Clones',2002],['Star Wars: Episode III - Revenge of the Sith',2005],['Solo: A Star Wars Story',2018],['Rogue One: A Star Wars Story',2016],['Star Wars',1977],['The Empire Strikes Back',1980],['Return of the Jedi',1983],['Star Wars: The Force Awakens',2015],['Star Wars: The Last Jedi',2017],['Star Wars: The Rise of Skywalker',2019]]],
  ff:['Fast & Furious',20,[['The Fast and the Furious',2001],['2 Fast 2 Furious',2003],['Fast & Furious',2009],['Fast Five',2011],['Fast & Furious 6',2013],['The Fast and the Furious: Tokyo Drift',2006],['Furious 7',2015],['The Fate of the Furious',2017],['Fast & Furious Presents: Hobbs & Shaw',2019],['F9',2021],['Fast X',2023]]],
  ww:['Wizarding World',45,[['Fantastic Beasts and Where to Find Them',2016],['Fantastic Beasts: The Crimes of Grindelwald',2018],['Fantastic Beasts: The Secrets of Dumbledore',2022],['Harry Potter and the Philosopher\'s Stone',2001],['Harry Potter and the Chamber of Secrets',2002],['Harry Potter and the Prisoner of Azkaban',2004],['Harry Potter and the Goblet of Fire',2005],['Harry Potter and the Order of the Phoenix',2007],['Harry Potter and the Half-Blood Prince',2009],['Harry Potter and the Deathly Hallows: Part 1',2010],['Harry Potter and the Deathly Hallows: Part 2',2011]]],
  xm:['X-Men',190,[['X-Men: First Class',2011],['X-Men: Days of Future Past',2014],['X-Men: Apocalypse',2016],['X-Men Origins: Wolverine',2009],['X-Men',2000],['X2',2003],['X-Men: The Last Stand',2006],['The Wolverine',2013],['Dark Phoenix',2019],['Deadpool',2016],['Deadpool 2',2018],['Logan',2017]]],
  pota:['Planet of the Apes',100,[['Rise of the Planet of the Apes',2011],['Dawn of the Planet of the Apes',2014],['War for the Planet of the Apes',2017],['Kingdom of the Planet of the Apes',2024]]],
  conj:['The Conjuring Universe',0,[['The Nun',2018],['Annabelle: Creation',2017],['The Nun II',2023],['Annabelle',2014],['The Conjuring',2013],['Annabelle Comes Home',2019],['The Curse of La Llorona',2019],['The Conjuring 2',2016],['The Conjuring: The Devil Made Me Do It',2021],['The Conjuring: Last Rites',2025]]]};
const frCache=store.get('nr_fr',{});
async function frResolve([t,y]){const k=t+'|'+y;if(frCache[k])return frCache[k];
  try{const j=await T0('/search/movie','&include_adult=false&query='+encodeURIComponent(t)+'&primary_release_year='+y),r=(j.results||[]).sort((a,b)=>(b.vote_count||0)-(a.vote_count||0))[0];
    if(r){const o={id:r.id,title:r.title,poster_path:r.poster_path,backdrop_path:r.backdrop_path,release_date:r.release_date,vote_average:r.vote_average,overview:r.overview,genre_ids:r.genre_ids,original_language:r.original_language};frCache[k]=o;store.set('nr_fr',frCache);return o}}catch(e){}return null}
function frHub(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="page-heading"><div><h1>Watch order</h1><p>Big franchises in release order and story order, side by side. Tap any film to open it.</p></div></div>
  <div class="nrf-frg">${Object.entries(FR).map(([k,[n,h,l]])=>`<a class="nrf-frt" href="#f-${k}" style="--h:${h}"><b>${esc(n)}</b><span>${l.length} films</span>${I('chevR')}</a>`).join('')}</div></div>`)}
async function frPage(k){const f=FR[k];if(!f)return show(`<div class="pg">${nf()}</div>`);const [n,h,l]=f;
  show(`<div class="pg nrf-pg" id="nrf-root"><div class="page-heading"><div><a class="nrf-link" href="#franchises">${I('chevL')} All franchises</a><h1>${esc(n)}</h1><p>${l.length} films. Release order is how audiences first saw them; story order follows the in-universe timeline.</p></div></div>
    <div class="nrf-frtabs" role="group"><button class="on" data-nrf="frt" data-v="rel">Release order</button><button data-nrf="frt" data-v="story">Story order</button></div>
    <div class="nrf-frc" id="nrf-frc" data-v="rel"><div class="nrf-frcol rel"><h3>Release order</h3><div class="nrf-frl">${'<div class="nrf-fri sk"></div>'.repeat(6)}</div></div><div class="nrf-frcol story"><h3>Story order</h3><div class="nrf-frl">${'<div class="nrf-fri sk"></div>'.repeat(6)}</div></div></div></div>`);
  const res=await Promise.all(l.map(frResolve));if(!$('#nrf-frc'))return;const sk=seenKeys();
  const items=res.map((r,i)=>r&&{c:ing(r,'movie'),s:i}).filter(x=>x&&x.c);saveCat();
  const rel=[...items].sort((a,b)=>(a.c.rd||'').localeCompare(b.c.rd||''));
  const li=(x,n)=>`<button class="nrf-fri${sk.has('movie'+x.c.tid)?' seen':''}" data-a="open" data-id="${x.c.i}"><b>${n+1}</b><img loading="lazy" alt="" src="${IMG('w92',x.c.p)}"><span><b>${esc(x.c.t)}</b><small>${x.c.y||''}${sk.has('movie'+x.c.tid)?' · Seen':''}</small></span></button>`;
  const cols=$$('#nrf-frc .nrf-frl');cols[0].innerHTML=rel.map(li).join('');cols[1].innerHTML=items.map(li).join('')}

// ---------- Release calendar ----------
const CAL={y:new Date().getFullYear(),m:new Date().getMonth(),kind:'movie',sel:0,data:{}};
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function calPage(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="page-heading"><div><h1>Release calendar</h1><p>What’s coming out this month. Tap the bell to get a reminder on release day.</p></div><a class="btn" href="#soon">List view</a></div>
  <div class="nrf-calbar"><button class="nrf-ib" data-nrf="cal-m" data-d="-1" aria-label="Previous month">${I('chevL')}</button><h2 id="nrf-calt"></h2><button class="nrf-ib" data-nrf="cal-m" data-d="1" aria-label="Next month">${I('chevR')}</button><span class="nrf-grow"></span>
  <div class="nrf-seg" role="group"><button data-nrf="cal-k" data-v="movie">Movies</button><button data-nrf="cal-k" data-v="tv">Series</button></div>${('Notification' in window)&&Notification.permission!=='granted'?`<button class="btn" data-nrf="notif">${I('bell')} Allow alerts</button>`:''}</div>
  <div class="nrf-cal" id="nrf-cal"></div><div id="nrf-cald"></div></div>`);drawCal();loadCal()}
const calKey=()=>CAL.kind+CAL.y+'-'+CAL.m;
async function loadCal(){const k=calKey();if(CAL.data[k])return drawCal();const {y,m,kind}=CAL,s=`${y}-${pad(m+1)}-01`,e=`${y}-${pad(m+1)}-${pad(new Date(y,m+1,0).getDate())}`,dk=kind==='movie'?'primary_release_date':'first_air_date';
  const x=`&include_adult=false&sort_by=popularity.desc&${dk}.gte=${s}&${dk}.lte=${e}`+(kind==='tv'?'&with_type=2|4':'');
  const js=await Promise.all([1,2,3].map(p=>T0('/discover/'+kind,x+'&page='+p).catch(()=>({}))));
  CAL.data[k]=uniq(js.flatMap(j=>j.results||[]).filter(r=>(r.popularity||0)>3).map(r=>ing(r,kind))).filter(c=>c.rd>=s&&c.rd<=e);saveCat();if(calKey()===k)drawCal()}
function drawCal(){const el=$('#nrf-cal');if(!el)return;const {y,m}=CAL,list=CAL.data[calKey()],first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),td=today(),by={};
  $('#nrf-calt').textContent=MON[m]+' '+y;$$('[data-nrf="cal-k"]').forEach(b=>b.classList.toggle('on',b.dataset.v===CAL.kind));
  (list||[]).forEach(c=>{const d=+c.rd.slice(8,10);(by[d]=by[d]||[]).push(c)});
  el.innerHTML=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<b class="nrf-wd">${d}</b>`).join('')+'<i></i>'.repeat(first)+Array.from({length:days},(_,i)=>{const d=i+1,it=by[d]||[],iso=`${y}-${pad(m+1)}-${pad(d)}`;
    return `<button class="nrf-day${CAL.sel===d?' sel':''}${iso===td?' td':''}${it.length?' has':''}" data-nrf="cal-d" data-d="${d}"><span>${d}</span><div class="nrf-dp">${it.slice(0,2).map(c=>`<img loading="lazy" alt="" src="${IMG('w92',c.p)}">`).join('')}</div>${it.length?`<em>${it.length}</em>`:''}</button>`}).join('');
  const dl=$('#nrf-cald');if(!list){dl.innerHTML='<p class="empty">Loading releases…</p>';return}
  const u=me(),show2=CAL.sel?(by[CAL.sel]||[]):list.slice().sort((a,b)=>a.rd.localeCompare(b.rd));
  dl.innerHTML=`<h3 class="nrf-calh">${CAL.sel?new Date(y,m,CAL.sel).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}):'All of '+MON[m]}${CAL.sel?' <button class="nrf-link" data-nrf="cal-d" data-d="0">Show whole month</button>':''}</h3>`+(show2.length?`<div class="nrf-rel">${show2.map(c=>{const on=!!(u&&u.rm&&u.rm[c.i]),fut=c.rd>=td;
    return `<div class="nrf-ri"><button class="nrf-rip" data-a="open" data-id="${c.i}"><img loading="lazy" alt="" src="${IMG('w154',c.p)}"></button><div><small>${new Date(c.rd+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}${fut?'':' · Out now'}</small><b>${esc(c.t)}</b><span class="mu">${esc(c.g.slice(0,2).join(' · '))}</span></div>${fut?`<button class="nrf-bell${on?' on':''}" data-nrf="rem" data-id="${c.i}" aria-pressed="${on}" aria-label="${on?'Remove reminder':'Remind me'}">${I('bell')}</button>`:''}</div>`}).join('')}</div>`:'<p class="empty">No releases on this day.</p>')}
function notifyDue(list){if(!list.length||!('Notification' in window)||Notification.permission!=='granted')return;
  list.slice(0,3).forEach(c=>{const opt={body:'You asked Nightreel to remind you. Tap to see where to watch.',icon:'img/icon-192.png',tag:'nr-rel-'+c.mt+c.tid};
    try{const n=new Notification(c.t+' is out now',opt);n.onclick=()=>{focus();detail(c.i)}}catch(e){if(navigator.serviceWorker)navigator.serviceWorker.getRegistration().then(r=>r&&r.showNotification(c.t+' is out now',opt)).catch(()=>{})}})}
const _cr=chkRem;chkRem=function(){const u=me(),t=today(),due=u&&u.rm?Object.keys(u.rm).map(i=>C[i]).filter(c=>c&&c.rd&&c.rd<=t):[];_cr.apply(this,arguments);notifyDue(due)};
setInterval(()=>{if(!D.hidden)chkRem()},30*60e3);

// ---------- Nightreel Wrapped ----------
const PERS={Action:['The Adrenaline Chaser','Explosions, chases and big finales. You came for the ride.'],Adventure:['The World Hopper','Every night is a new place to explore.'],Comedy:['The Feel-Good Fan','You watch to laugh, and it shows.'],Horror:['The Fearless Night Owl','Lights off, volume up, no fear.'],Drama:['The Deep Feeler','You want stories that stay with you.'],'Sci-Fi':['The Future Seeker','Big ideas, other worlds, and what comes next.'],Romance:['The Hopeless Romantic','Slow burns and happy endings.'],Animation:['The Forever Young','Animation is cinema and you know it.'],Crime:['The Detective','Twists, heists and who-done-its.'],Thriller:['The Edge-of-Seat Viewer','You love not knowing what comes next.'],Mystery:['The Detective','Twists, heists and who-done-its.'],Fantasy:['The Dreamer','Dragons, magic and impossible places.'],Documentary:['The Curious Mind','Real stories over everything.'],Family:['The Crowd Pleaser','Movie night is better together.']};
let WR=null;
async function wrapData(){const u=me();if(!u)return null;const Y=new Date().getFullYear(),y0=new Date(Y,0,1).getTime();
  const prog=Object.entries(u.prog||{}).filter(([i,p])=>C[i]&&(p.u||0)>=y0).map(([i,p])=>({c:C[i],p}));
  let sec=0;prog.forEach(({c,p})=>sec+=c.mt==='tv'?Math.max(0,(p.ep||1)-1)*c.m*60+(p.t||0):(p.t||0));
  const liked=Object.entries(u.rt||{}).filter(([i,v])=>v>0&&C[i]).map(([i])=>C[i]),rated=Object.entries(u.r10||{}).filter(([i])=>C[i]).map(([i,v])=>({c:C[i],v:+v})).sort((a,b)=>b.v-a.v);
  const fin=Object.entries(u.ws||{}).filter(([i,v])=>v==='finished'&&C[i]).map(([i])=>C[i]);
  const w=new Map(),add=(c,n)=>c&&w.set(c,(w.get(c)||0)+n);prog.forEach(x=>add(x.c,3));fin.forEach(c=>add(c,3));liked.forEach(c=>add(c,2));rated.forEach(x=>add(x.c,Math.max(1,x.v/3)));
  if(!w.size)(u.list||[]).forEach(i=>add(C[i],1));if(!w.size)return {empty:1,Y};
  const pool=[...w.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const gen={};let gt=0;w.forEach((n,c)=>c.g.forEach(g=>{gen[g]=(gen[g]||0)+n;gt+=n}));const topG=Object.entries(gen).sort((a,b)=>b[1]-a[1]);
  const dec={};w.forEach((n,c)=>{if(c.y)dec[Math.floor(c.y/10)*10]=(dec[Math.floor(c.y/10)*10]||0)+n});const topD=Object.entries(dec).sort((a,b)=>b[1]-a[1])[0];
  const mv=pool.filter(c=>c.mt==='movie').length;
  await Promise.all(pool.slice(0,15).filter(c=>!c.cast||!c.cast.length).map(async c=>{try{const j=await T0('/'+c.mt+'/'+c.tid+'/credits');c.cast=(j.cast||[]).filter(x=>x.profile_path).slice(0,14).map(x=>({n:x.name,c:x.character,p:x.profile_path,i:x.id}))}catch(e){}}));
  const act={};pool.slice(0,15).forEach(c=>(c.cast||[]).slice(0,8).forEach(a=>{const o=act[a.i]=act[a.i]||{a,n:0,t:[]};o.n+=w.get(c)||1;o.t.push(c.t)}));
  const topA=Object.values(act).filter(x=>x.t.length>1).sort((a,b)=>b.n-a.n)[0]||null;
  const fav=(rated[0]&&rated[0].c)||pool[0],g0=topG[0]?topG[0][0]:'Drama',ps=PERS[g0]||['The Eclectic Explorer','A little bit of everything, and proud of it.'];
  return {Y,sec,count:w.size,mv,sv:pool.length-mv,pool,topG,gt,topD,topA,fav,ps,name:u.name}}
function wrapSlides(d){const S=[],hrs=Math.round(d.sec/360)/10,posters=d.pool.filter(c=>c.p).slice(0,6);
  S.push({h:265,k:'Nightreel Wrapped',v:'Your '+d.Y+' in movies',sub:d.count+' titles made your year','col':posters});
  S.push(d.sec>600?{h:200,k:'Time well spent',v:hrs+' hours',sub:'That’s about '+Math.max(1,Math.round(d.sec/6600))+' movie nights',big:1}:{h:200,k:'You discovered',v:d.count+' titles',sub:d.mv+' movies and '+d.sv+' series',big:1});
  if(d.topG[0])S.push({h:330,k:'Your top genre',v:d.topG[0][0],sub:Math.round(d.topG[0][1]/d.gt*100)+'% of everything you watched'+(d.topG[1]?' · then '+d.topG[1][0]:''),img:null});
  if(d.topA)S.push({h:20,k:'Your most-watched actor',v:d.topA.a.n,sub:'In '+d.topA.t.slice(0,3).join(', '),img:IMG('w342',d.topA.a.p),round:1});
  if(d.fav&&d.fav.p)S.push({h:160,k:'Your title of the year',v:d.fav.t,sub:(d.fav.y||'')+' · '+d.fav.g.slice(0,2).join(', '),img:IMG('w500',d.fav.p)});
  if(d.topD)S.push({h:45,k:'Your era',v:'The '+d.topD[0]+'s',sub:'Your favorite decade to watch',big:1});
  S.push({h:290,k:'Your movie personality',v:d.ps[0],sub:d.ps[1]});
  S.push({h:250,k:d.Y+' wrapped',v:d.ps[0],sub:[d.topG[0]&&'Top genre: '+d.topG[0][0],d.topA&&'Top actor: '+d.topA.a.n,d.fav&&'Favorite: '+d.fav.t].filter(Boolean).join(' · '),sum:1});return S}
async function wrappedPage(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="nrf-wr" id="nrf-wr"><div class="nrf-wr-stage" style="--h:265"><div class="nrf-wr-s"><p class="mu">Wrapping up your year…</p></div></div></div></div>`);
  const u=me();if(!u)return $('#nrf-wr').innerHTML=emptyScene('Sign in for your Wrapped','Your recap is built from your list, ratings and what you watch.','#auth','Sign in');
  const d=await wrapData();if(!$('#nrf-wr'))return;if(!d||d.empty)return $('#nrf-wr').innerHTML=emptyScene('Your Wrapped is still filming','Watch, rate or like a few titles and your recap builds itself here.','#home','Find something to watch');
  WR={d,s:wrapSlides(d),i:0};drawWrap()}
function drawWrap(){const el=$('#nrf-wr');if(!el||!WR)return;const s=WR.s[WR.i];
  el.innerHTML=`<div class="nrf-wr-bars">${WR.s.map((x,i)=>`<i class="${i<WR.i?'done':i===WR.i?'on':''}"></i>`).join('')}</div>
  <div class="nrf-wr-stage" style="--h:${s.h}"><div class="nrf-wr-s${s.round?' rnd':''}" key="${WR.i}">
    ${s.col?`<div class="nrf-col">${s.col.map((c,i)=>`<i style="background-image:url('${IMG('w342',c.p)}');--i:${i}"></i>`).join('')}</div>`:''}
    ${s.img?`<div class="nrf-wr-img" style="background-image:url('${s.img}')"></div>`:''}
    <small>${esc(s.k)}</small><h2 class="${s.big?'big':''}">${esc(s.v)}</h2><p>${esc(s.sub)}</p><span class="nrf-wr-brand">night<i>reel</i></span></div>
    <button class="nrf-wr-n l" data-nrf="wrn" data-d="-1" aria-label="Previous"></button><button class="nrf-wr-n r" data-nrf="wrn" data-d="1" aria-label="Next"></button></div>
  <div class="nrf-row c"><button class="btn p" data-nrf="wr-save">${I('download')} Save this slide</button>${WR.i===WR.s.length-1?`<button class="btn" data-nrf="wr-again">Watch again</button>`:`<button class="btn" data-nrf="wrn" data-d="1">Next ${I('chevR')}</button>`}</div>`}
const loadImg=src=>new Promise((ok,no)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>ok(im);im.onerror=no;im.src=src});
async function wrapImage(s,Y){const W=1080,H=1920,cv=D.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,W*.6,H);g.addColorStop(0,`hsl(${s.h},72%,34%)`);g.addColorStop(.55,`hsl(${(s.h+40)%360},60%,14%)`);g.addColorStop(1,'#07070B');x.fillStyle=g;x.fillRect(0,0,W,H);
  try{await Promise.all([D.fonts.load('800 100px "Bricolage Grotesque"'),D.fonts.load('600 40px Inter')])}catch(e){}
  const HF='"Bricolage Grotesque",-apple-system,sans-serif',BF='Inter,-apple-system,sans-serif';
  x.textAlign='center';x.fillStyle='rgba(255,255,255,.85)';x.font=`800 50px ${HF}`;x.fillText('nightreel wrapped '+Y,W/2,170);
  let y=420;const src=s.img||(s.col&&s.col[0]&&IMG('w500',s.col[0].p));
  if(src){try{const im=await loadImg(src),rw=s.round?560:600,rh=s.round?560:900,rx=(W-rw)/2;x.save();x.beginPath();if(s.round)x.arc(W/2,y+rh/2,rw/2,0,Math.PI*2);else x.roundRect?x.roundRect(rx,y-60,rw,rh,40):x.rect(rx,y-60,rw,rh);x.clip();
    const sc=Math.max(rw/im.width,rh/im.height);x.drawImage(im,W/2-im.width*sc/2,(s.round?y:y-60)+rh/2-im.height*sc/2,im.width*sc,im.height*sc);x.restore();y+=(s.round?rh:rh-60)+130}catch(e){y=760}}else y=760;
  const wrapT=(t,font,lh,max)=>{x.font=font;const words=String(t).split(' ');let line='';const lines=[];words.forEach(w=>{const tt=line?line+' '+w:w;if(x.measureText(tt).width>max&&line){lines.push(line);line=w}else line=tt});lines.push(line);lines.forEach(l=>{x.fillText(l,W/2,y);y+=lh})};
  x.fillStyle='rgba(255,255,255,.72)';wrapT(s.k.toUpperCase(),`700 40px ${BF}`,70,900);y+=40;x.fillStyle='#fff';wrapT(s.v,`800 ${s.big?150:104}px ${HF}`,s.big?160:116,940);y+=20;x.fillStyle='rgba(255,255,255,.8)';wrapT(s.sub,`500 42px ${BF}`,58,880);
  x.fillStyle='rgba(255,255,255,.6)';x.font=`800 44px ${HF}`;x.fillText('nightreel',W/2,H-110);
  return new Promise(r=>cv.toBlob(r,'image/png'))}
async function wrapSave(){if(!WR)return;const s=WR.s[WR.i];toast('Preparing image…');const b=await wrapImage(s,WR.d.Y);if(!b)return toast('Could not create the image','err');
  const name='nightreel-wrapped-'+WR.d.Y+'-'+(WR.i+1)+'.png';let f=null;try{f=new File([b],name,{type:'image/png'})}catch(e){}
  if(f&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'My Nightreel Wrapped'});return}catch(e){if(e&&e.name==='AbortError')return}}
  const u=URL.createObjectURL(b),a=D.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Image saved','ok')}

// ---------- Discover hub ----------
const HUB=[['pick','users','Group Pick','Swipe with friends until you all match on one movie',280],['swipe','zap','Swipe mode','Poster by poster. Right to save, left to skip',330],['daily','eye','Daily movie','Guess the blurry poster. New one every day',20],['tonight','moon','Tonight picker','Three taps, three picks, trailers ready',250],['franchises','list','Watch order','Marvel, Star Wars and more in the right order',200],['calendar','calendar','Release calendar','Month view with release-day alerts',160],['services','tv','My services','Only show what you can actually watch',120],['wrapped','sparkles','Wrapped','Your year in movies, ready for your story',300]];
const hubTile=([r,ic,t,s,h],extra)=>`<a class="nrf-hub-t" href="#${r}"${r==='tonight'?' data-nrf="tn-open-hub"':''} style="--h:${h}"><span class="nrf-hub-i">${I(ic)}</span><b>${t}</b><small>${extra||s}</small></a>`;
const dailyLine=()=>{const s=dgState();return s.done?(s.win?'Solved today':'Try again tomorrow')+' · '+dgStreak()+' day streak':dgStreak()?dgStreak()+' day streak. Keep it alive':'Today’s puzzle is ready'};
function hubPage(){show(`<div class="pg nrf-pg" id="nrf-root"><div class="page-heading"><div><h1>Discover</h1><p>Games, guided picks and smarter ways to find tonight’s watch.</p></div></div><div class="nrf-hub">${HUB.map(t=>hubTile(t,t[0]==='daily'?dailyLine():'')).join('')}</div></div>`)}
const strip=()=>`<section class="row nrf-strip"><h2>Play and pick</h2><div class="nrf-hub mini">${HUB.filter(t=>['daily','pick','swipe','tonight'].includes(t[0])).map(t=>hubTile(t,t[0]==='daily'?dailyLine():'')).join('')}</div></section>`;

// ---------- routing ----------
const MINE=['discover','pick','swipe','daily','franchises','calendar','services','wrapped'];KN.push(...MINE,'tonight');
const isMine=r=>MINE.includes(r)||/^pick-[A-Z0-9]{4,8}$/.test(r)||/^f-[a-z]+$/.test(r);
const navBase=r=>/^(pick-|f-)/.test(r)?(r[0]==='f'?'franchises':'pick'):r;
let LASTR='';
function show(html,full){SEEN.clear();GR=null;io.disconnect();const ht=$('#nr-home-top');if(ht)ht.innerHTML='';const r=location.hash.slice(1),a=$('#app');
  D.body.classList.toggle('nrf-full',!!full);a.innerHTML=html;a.classList.remove('pgin');if(!full){void a.offsetWidth;a.classList.add('pgin')}
  $$('#nl a,.dp a').forEach(x=>x.classList.toggle('on',x.getAttribute('href')==='#'+(navBase(r)==='discover'||MINE.includes(navBase(r))?'discover':r)));
  $$('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.tb===r||(b.dataset.tb==='discover'&&!['swipe'].includes(r))))}
function route(r){if(r==='discover')return hubPage();if(r==='pick')return pickHub();if(r.startsWith('pick-'))return roomPage(r.slice(5));if(r==='swipe')return swipePage();
  if(r==='daily')return dailyPage();if(r==='franchises')return frHub();if(r.startsWith('f-'))return frPage(r.slice(2));if(r==='calendar')return calPage();if(r==='services')return servicesPage();if(r==='wrapped')return wrappedPage()}
function post(r){const a=$('#app');if(!a||q)return;
  if(r==='home'&&LD&&!a.querySelector('.nrf-strip')){const first=a.firstElementChild;if(first){first.insertAdjacentHTML('afterbegin',svcBar()+strip())}
    const mh=[...a.querySelectorAll('.row h2')].find(h=>h.textContent==='Browse by mood');if(mh&&!mh.querySelector('button'))mh.insertAdjacentHTML('beforeend',`<button class="nrf-gp" data-nrf="tn-start">${I('target')} Help me pick</button>`)}
  else if((r==='movies'||r==='series'||r==='anime')&&svcOn()){const h=a.querySelector('.pg>h1');if(h&&!a.querySelector('.nrf-svcbar'))h.insertAdjacentHTML('afterend',svcBar())}
  else if(r==='soon'){const h=a.querySelector('.page-heading');if(h&&!h.querySelector('[href="#calendar"]'))h.insertAdjacentHTML('beforeend',`<a class="btn" href="#calendar">${I('calendar')} Month view</a>`)}
  else if(r==='stats'){const p=a.querySelector('.pg');if(p&&!p.querySelector('.nrf-wrb'))(p.querySelector('.page-heading')||p.firstElementChild).insertAdjacentHTML('afterend',`<a class="nrf-wrb" href="#wrapped"><span>${I('sparkles')}</span><div><b>Your ${new Date().getFullYear()} Wrapped is ready</b><small>Top genre, most-watched actor and your movie personality, as story-ready slides.</small></div>${I('chevR')}</a>`)}}
const _r=render;render=function(){const r=location.hash.slice(1)||'home';
  if(!(ROOM&&r==='pick-'+ROOM.code))leaveRoom();
  if(r==='tonight'&&!q){history.replaceState(null,'','#discover');hubPage();LASTR='discover';openTonight();return}
  if(!q&&isMine(r)){if(r===LASTR&&(r==='swipe'||r.startsWith('pick-'))&&$('#nrf-root'))return;if(r!=='swipe'&&!r.startsWith('pick-'))DECK=null;else if(r!==LASTR)DECK=null;LASTR=r;return route(r)}
  LASTR='';DECK=null;D.body.classList.remove('nrf-full');_r.apply(this,arguments);post(r)};

// ---------- events ----------
D.addEventListener('submit',e=>{const f=e.target.closest('[data-nrf-form]');if(!f)return;e.preventDefault();
  if(f.dataset.nrfForm==='join'){const v=($('#nrf-code').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length<4)return toast('Enter the room code from your friend’s link','err');location.hash='pick-'+v}
  else if(f.dataset.nrfForm==='name'){const v=($('#nrf-nm').value||'').trim().slice(0,20);if(!v)return toast('Add a name first','err');store.set('nr_gpname',v);LASTR='';render()}});
D.addEventListener('change',e=>{const t=e.target;if(t.id==='nrf-reg'){store.set('nr_region',t.value);const u=me();if(u){u.st.region=t.value;save()}servicesPage()}else if(t.id==='nrf-ps'){PST.s=t.value;drawFilm()}});
D.addEventListener('click',e=>{const t=e.target.closest('[data-nrf]');if(!t)return;const a=t.dataset.nrf,id=+t.dataset.id;
  if(a==='tn-open-hub'){e.preventDefault();openTonight()}
  else if(a==='tn-start')openTonight();
  else if(a==='tn'){TN.a[TN.s]=+t.dataset.v;TN.s++;drawTonight()}
  else if(a==='tn-back'){TN.s=Math.max(0,TN.s-1);drawTonight()}
  else if(a==='tn-again')drawTonight();
  else if(a==='tn-reset'){TN.s=0;TN.a=[];drawTonight()}
  else if(a==='tn-play'){const c=C[id],box=$('#nrf-tv'+id);if(!c||!box)return;ytKey(c).then(k=>{if(!k||!/^[\w-]{6,20}$/.test(k))return toast('No trailer for this title yet','err');box.classList.add('on');box.innerHTML=ytFrame(k)})}
  else if(a==='tn-open'){closeOvl($('#au'));setTimeout(()=>detail(id),230)}
  else if(a==='sw'){if(DECK)DECK.go(t.dataset.d)}
  else if(a==='trlx'){const s=t.closest('.nrf-trl');if(s)s.remove()}
  else if(a==='gp-new')location.hash='pick-'+newCode();
  else if(a==='gp-share'){if(!ROOM)return;const url=location.href.split('#')[0]+'#pick-'+ROOM.code,text='Help me pick a movie on Nightreel. Swipe in room '+ROOM.code+':';
    if(navigator.share)navigator.share({title:'Nightreel Group Pick',text,url}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Room link copied','ok'),()=>toast(url));else toast(url)}
  else if(a==='gp-more'){if(ROOM){loadRound(ROOM.round+1)}}
  else if(a==='gp-x'){const m=t.closest('.nrf-match');if(m)m.remove()}
  else if(a==='gp-trl'){const m=t.closest('.nrf-match');if(m)m.remove();trailerSheet($('#nrf-root'),C[id])}
  else if(a==='gp-m'){if(C[id])detail(id)}
  else if(a==='dg-g'){dgGuess(+t.dataset.id,t.dataset.t)}
  else if(a==='dg-skip'){dgGuess(0,'')}
  else if(a==='dg-open'){if(!DG)return;const c=ing(DG.m.raw,'movie');if(c){saveCat();detail(c.i)}}
  else if(a==='dg-share'){const s=dgState(),m=DG&&DG.m;if(!m)return;const line=s.g.map(g=>g.id===m.id?'✓':g.id?'✕':'–').join(' '),txt=`Nightreel Daily #${s.d+1} · ${s.win?s.g.length:'X'}/${MAXG}\n${line}\nStreak ${dgStreak()}`,url=location.href.split('#')[0]+'#daily';
    if(navigator.share)navigator.share({title:'Nightreel Daily',text:txt,url}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(txt+'\n'+url).then(()=>toast('Result copied','ok'),()=>toast(txt));else toast(txt)}
  else if(a==='pf'){PST.f=t.dataset.v;$$('[data-nrf="pf"]').forEach(b=>b.classList.toggle('on',b===t));drawFilm()}
  else if(a==='pc'){const x=PCR.get(t.dataset.k);if(!x)return;const c=ing(x);if(c){saveCat();detail(c.i)}else toast('This title has no details yet','err')}
  else if(a==='frt'){const c=$('#nrf-frc');if(c)c.dataset.v=t.dataset.v;$$('[data-nrf="frt"]').forEach(b=>b.classList.toggle('on',b===t))}
  else if(a==='cal-m'){CAL.m+=+t.dataset.d;if(CAL.m<0){CAL.m=11;CAL.y--}else if(CAL.m>11){CAL.m=0;CAL.y++}CAL.sel=0;drawCal();loadCal()}
  else if(a==='cal-k'){CAL.kind=t.dataset.v;CAL.sel=0;drawCal();loadCal()}
  else if(a==='cal-d'){const d=+t.dataset.d;CAL.sel=CAL.sel===d?0:d;drawCal();if(d)setTimeout(()=>{const h=$('.nrf-calh');h&&h.scrollIntoView({behavior:'smooth',block:'start'})},30)}
  else if(a==='rem'){const u=me();if(!u){needAuth(()=>{location.hash='calendar'});return}u.rm=u.rm||{};const on=!u.rm[id];on?u.rm[id]=1:delete u.rm[id];save();
    toast(on?'We’ll remind you on release day':'Reminder removed',on?'ok':'');t.classList.toggle('on',on);t.setAttribute('aria-pressed',on);
    if(on&&'Notification' in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}
  else if(a==='notif'){if('Notification' in window)Notification.requestPermission().then(p=>{toast(p==='granted'?'Release alerts are on':'Alerts are blocked in your browser settings',p==='granted'?'ok':'err');if(p==='granted')t.remove()}).catch(()=>{})}
  else if(a==='svc-t'){t.classList.toggle('on');t.setAttribute('aria-pressed',t.classList.contains('on'))}
  else if(a==='svc-save'){const ids=$$('.nrf-svc-t.on').map(b=>+b.dataset.id),names=store.get('nr_svcn',{});(PROV||[]).forEach(o=>names[o.provider_id]=o.provider_name);store.set('nr_svcn',names);
    if(!ids.length){svcSet([],0);toast('Filter off. Showing everything');location.hash='home';return}svcSet(ids,1);toast('Showing only your '+ids.length+' service'+(ids.length===1?'':'s'),'ok');location.hash='home'}
  else if(a==='svc-off'){svcSet(svcList(),0);toast('Showing everything')}
  else if(a==='svc-onq'){svcSet(svcList(),1);toast('Only showing your services','ok')}
  else if(a==='wrn'){if(!WR)return;WR.i=Math.max(0,Math.min(WR.s.length-1,WR.i+ +t.dataset.d));drawWrap()}
  else if(a==='wr-again'){if(WR){WR.i=0;drawWrap()}}
  else if(a==='wr-save')wrapSave()});
addEventListener('keydown',e=>{if(!WR||!$('#nrf-wr')||typing()||D.querySelector('.ovl.o'))return;if(e.key==='ArrowRight'){WR.i=Math.min(WR.s.length-1,WR.i+1);drawWrap()}else if(e.key==='ArrowLeft'){WR.i=Math.max(0,WR.i-1);drawWrap()}});

// ---------- nav entry points ----------
const nl=$('#nl');if(nl&&!nl.querySelector('[href="#discover"]')){const s=nl.querySelector('[href="#soon"]');s&&s.insertAdjacentHTML('afterend','<a href="#discover">Discover</a>')}
const dp=D.querySelector('.dp');if(dp&&!dp.querySelector('[href="#discover"]')){const s=dp.querySelector('[href="#soon"]');s&&s.insertAdjacentHTML('afterend','<a href="#discover">Discover</a><a href="#pick">Group Pick</a><a href="#swipe">Swipe mode</a><a href="#daily">Daily movie</a><a href="#calendar">Release calendar</a>')}
const tb=$('#tabbar');if(tb&&!tb.querySelector('[data-tb="discover"]')){const s=tb.querySelector('[data-tb="soon"]');s&&s.insertAdjacentHTML('afterend',`<button data-tb="discover"><i>${I('zap')}</i>Discover</button>`)}
const pickBtn=D.querySelector('#nav button[title="Tonight’s pick"]');if(pickBtn)pickBtn.onclick=openTonight;
if(isMine(location.hash.slice(1))||location.hash.slice(1)==='tonight')render();else post(location.hash.slice(1)||'home');
})();
