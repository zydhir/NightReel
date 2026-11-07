// Nightreel · Appearance settings, glass dropdowns, hover cards, Top 10, notifications, player extras, tab bar
// ===== Nightreel v5: appearance studio, glass dropdowns, hover cards, Top 10, notifications, player extras =====
(()=>{
const D=document,H=D.documentElement;
const S=(k,d)=>{const u=me(),v=u&&u.st?u.st[k]:undefined;return v===undefined?d:v};
const setS=(k,v)=>{const u=me();if(!u)return;u.st[k]=v;save()};
const fmtM=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':''):m+'m'};
// ---- Top 10 badges ----
function tagCards(){const top=new Set((L.trend||[]).slice(0,10).map(c=>c.i)),on=S('t10',1);
  D.querySelectorAll('#app .card[data-id],#md .card[data-id]').forEach(el=>{const id=+el.dataset.id,has=el.querySelector('.t10');
    if(on&&top.has(id)&&!el.closest('.rk')){if(!has)el.insertAdjacentHTML('beforeend','<span class="t10" aria-label="Top 10 this week">TOP<b>10</b></span>')}else if(has)has.remove()})}
let tq=0;const mo=new MutationObserver(()=>{if(tq)return;tq=requestAnimationFrame(()=>{tq=0;tagCards();enhanceAll()})});
mo.observe($('#app'),{childList:true,subtree:true});mo.observe($('#md'),{childList:true,subtree:true});
// ---- polished glass dropdowns (replace the browser's native <select> look) ----
const pop=D.createElement('div');pop.id='nrpop';pop.setAttribute('role','listbox');pop.hidden=true;D.body.append(pop);let popSel=null,popBtn=null,popIx=0;
function enhance(sel){if(sel.dataset.nr||sel.id==='imf')return;sel.dataset.nr='1';const w=D.createElement('span');w.className='nrsel';sel.parentNode.insertBefore(w,sel);w.appendChild(sel);
  const b=D.createElement('button');b.type='button';b.className='nrsel-b';b.setAttribute('aria-haspopup','listbox');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',sel.getAttribute('aria-label')||'Choose an option');
  const lab=()=>{const o=sel.options[sel.selectedIndex];b.innerHTML=`<span>${esc(o?o.text:'')}</span><i aria-hidden="true"></i>`;b.disabled=sel.disabled};lab();w.appendChild(b);
  sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');sel.addEventListener('change',lab);b.onclick=e=>{e.stopPropagation();popSel===sel?closePop():openPop(sel,b)}}
function enhanceAll(){D.querySelectorAll('select:not([data-nr])').forEach(enhance)}
function paintPop(){pop.innerHTML=[...popSel.options].map((o,i)=>`<button type="button" role="option" class="nrop${i===popSel.selectedIndex?' sel':''}${i===popIx?' on':''}" data-i="${i}" aria-selected="${i===popSel.selectedIndex}"${o.disabled?' disabled':''}><span>${esc(o.text)}</span></button>`).join('')}
function openPop(sel,b){closePop();popSel=sel;popBtn=b;popIx=Math.max(0,sel.selectedIndex);paintPop();pop.hidden=false;b.setAttribute('aria-expanded','true');b.classList.add('open');
  const r=b.getBoundingClientRect(),W=Math.max(r.width,190),below=innerHeight-r.bottom-12,h=Math.min(pop.scrollHeight,320);
  pop.style.width=W+'px';pop.style.left=Math.min(innerWidth-W-10,Math.max(10,r.left))+'px';
  if(below<h&&r.top>below){pop.style.top='';pop.style.bottom=(innerHeight-r.top+6)+'px';pop.classList.add('up')}else{pop.style.bottom='';pop.style.top=(r.bottom+6)+'px';pop.classList.remove('up')}
  const on=pop.querySelector('.sel');on&&on.scrollIntoView({block:'nearest'})}
function closePop(){if(!popSel)return;pop.hidden=true;popBtn.setAttribute('aria-expanded','false');popBtn.classList.remove('open');popSel=null;popBtn=null}
function choosePop(i){const s=popSel,b=popBtn;if(!s)return;closePop();if(s.selectedIndex!==i){s.selectedIndex=i;s.dispatchEvent(new Event('change',{bubbles:true}))}b&&D.contains(b)&&b.focus()}
pop.onclick=e=>{const o=e.target.closest('[data-i]');if(o)choosePop(+o.dataset.i)};
D.addEventListener('click',e=>{if(popSel&&!e.target.closest('#nrpop'))closePop()});
addEventListener('resize',closePop);addEventListener('scroll',e=>{if(popSel&&!pop.contains(e.target))closePop()},{passive:true,capture:true});
addEventListener('keydown',e=>{if(!popSel)return;const n=popSel.options.length;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();popIx=(popIx+(e.key==='ArrowDown'?1:-1)+n)%n;paintPop();const on=pop.querySelector('.on');on&&on.scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();choosePop(popIx)}
  else if(e.key==='Escape'||e.key==='Tab'){e.stopImmediatePropagation();const b=popBtn;closePop();if(e.key==='Escape'){e.preventDefault();b&&b.focus()}}},true);
// ---- hover preview cards ----
const hp=D.createElement('div');hp.id='hpv';D.body.append(hp);let hpT=0,hpX=0,hpId=-1,hpCard=null;
const fine=matchMedia('(hover:hover) and (pointer:fine)');
function hideHP(){clearTimeout(hpT);hpTok++;clearInterval(hpSl);if(hpCard){hp.classList.remove('o','playing');hpCard=null;const v=hp.querySelector('.hpvid');if(v)v.innerHTML=''}}
// ---- hover previews: a slow slideshow of the title's scene stills from TMDB (no YouTube player involved) ----
let hpTok=0,hpSl=0;const STILLS={};
async function stills(c){const k=c.mt+c.tid;if(STILLS[k])return STILLS[k];let a=(c.bgs||[]).slice();
  if(a.length<3){try{const j=await T('/'+c.mt+'/'+c.tid+'/images','&include_image_language=en,null');a=(j.backdrops||[]).sort((x,y)=>(y.vote_count||0)-(x.vote_count||0)).map(x=>x.file_path)}catch(e){}}
  if(c.b)a=[c.b,...a.filter(p=>p!==c.b)];return STILLS[k]=a.slice(0,8)}
const still=p=>'https://image.tmdb.org/t/p/w780'+p;
const preload=p=>new Promise(r=>{const im=new Image();im.onload=im.onerror=r;im.src=still(p)});
async function hpPreview(id){const tok=++hpTok,c=C[id];if(!c||!S('hvt',1)||S('ds',0))return;const a=await stills(c);
  if(tok!==hpTok||hpId!==id||!hp.classList.contains('o')||a.length<2)return;await Promise.all([preload(a[0]),preload(a[1])]);if(tok!==hpTok)return;
  const box=hp.querySelector('.hpvid');if(!box)return;box.innerHTML=a.map(p=>'<i style="background-image:url(\''+still(p)+'\')"></i>').join('');
  const sl=[...box.children];let n=0,z=1;sl[0].style.zIndex=z;sl[0].classList.add('on');box.classList.add('on');hp.classList.add('playing');
  a.slice(2).forEach(preload);
  hpSl=setInterval(()=>{if(tok!==hpTok)return clearInterval(hpSl);const prev=sl[n];n=(n+1)%sl.length;const nx=sl[n];nx.classList.remove('on');void nx.offsetWidth;nx.style.zIndex=++z;nx.classList.add('on');setTimeout(()=>{if(prev!==sl[n])prev.classList.remove('on')},1000)},2800)}
// Trailers open in the title page using YouTube's normal player (branding visible, as YouTube requires).
async function trailerKey(c){if(c.vid)return c.vid;if(c._tk!==undefined)return c._tk;
  try{const j=await T('/'+c.mt+'/'+c.tid+'/videos'),v=(j.results||[]).filter(x=>x.site==='YouTube'),t=v.find(x=>x.type==='Trailer'&&x.official)||v.find(x=>x.type==='Trailer')||v.find(x=>x.type==='Teaser')||v[0];c._tk=t?t.key:''}catch(e){c._tk=''}return c._tk}
async function openTrailer(id){const c=C[id];if(!c)return;hideHP();if(curD!==id||!$('#md').classList.contains('o'))detail(id);
  for(let i=0;i<40&&!c.v3;i++)await new Promise(r=>setTimeout(r,100));const k=await trailerKey(c);
  if(curD!==id||!$('#md').classList.contains('o'))return;if(!k||!/^[\w-]{6,20}$/.test(k))return toast('No trailer for this title yet','err');
  const bn=$('#md .bn');if(!bn)return;bn.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+k+'?autoplay=1&rel=0" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><a class="btn tfb" href="https://www.youtube.com/watch?v='+k+'" target="_blank" rel="noopener">Open on YouTube</a>';
  $('#md').scrollTo({top:0,behavior:'smooth'})}
window.openTrailer=openTrailer;
D.addEventListener('click',e=>{const t=e.target.closest('[data-a="trailer"],[data-a="wtw"]');if(!t)return;
  if(t.dataset.a==='trailer')return openTrailer(+t.dataset.id);
  if(MT!=='ov'){MT='ov';detail(curD,1)}const w=$('#availability');if(w)w.scrollIntoView({behavior:'smooth',block:'center'})});
function showHP(el){if(!D.contains(el)||D.querySelector('.ovl.o,#pl.o')||!S('hpv',1))return;const id=+el.dataset.id,c=C[id];if(!c)return;
  hpCard=el;hpId=id;const u=me(),r=el.getBoundingClientRect(),W=Math.max(300,Math.min(380,r.width*1.8)),Hh=W*.5625+132,inL=u&&u.list.includes(id),liked=u&&u.rt&&u.rt[id]===1;
  hp.innerHTML=`<div class="hpi" data-h="info" style="background-image:${art(id,1)}"><div class="hpvid"></div><b>${esc(c.t)}</b></div><div class="hpb"><div class="hpr"><button class="hpc pri" data-h="trailer" aria-label="Watch trailer" title="Watch trailer">${I('play')}</button><button class="hpc" data-h="list" aria-label="${inL?'Remove from My List':'Add to My List'}" title="My List">${I(inL?'check':'plus')}</button><button class="hpc${liked?' on':''}" data-h="like" aria-label="I like this" title="I like this">${I('thumbUp')}</button><button class="hpc" data-h="share" aria-label="Copy link" title="Copy link">${I('share')}</button><span class="sp"></span><button class="hpc" data-h="info" aria-label="More info" title="More info">${I('chevD')}</button></div><div class="hpm"><b>${Math.round(c.r*10)}% match</b>${c.ct?`<span class="cert2">${esc(c.ct)}</span>`:''}<span>${c.y||''}</span>${c.det?`<span>${c.mt==='movie'?fmtM(c.m):c.ep+(c.ep===1?' episode':' episodes')}</span>`:''}<span class="hd2">HD</span></div><div class="hpg">${c.g.slice(0,3).map(esc).join('<i>•</i>')}</div></div>`;
  const left=Math.min(innerWidth-W-12,Math.max(12,r.left+r.width/2-W/2)),top=Math.min(innerHeight-Hh-12,Math.max(72,r.top+r.height/2-Hh/2));
  Object.assign(hp.style,{width:W+'px',left:left+'px',top:top+'px'});hp.classList.add('o');hpPreview(id)}
D.addEventListener('pointerover',e=>{if(!fine.matches)return;const t=e.target;
  if(t.closest&&t.closest('#hpv')){clearTimeout(hpX);return}
  const c=t.closest&&t.closest('.card[data-id]');
  if(c&&!c.closest('.ovl')&&!c.classList.contains('skc')){clearTimeout(hpX);if(c===hpCard)return;clearTimeout(hpT);if(hpCard)hideHP();hpT=setTimeout(()=>showHP(c),650);return}
  clearTimeout(hpT);clearTimeout(hpX);if(hpCard)hpX=setTimeout(hideHP,180)},{passive:true});
addEventListener('scroll',hideHP,{passive:true});addEventListener('hashchange',hideHP);
hp.onclick=e=>{const b=e.target.closest('[data-h]');if(!b)return;const id=hpId,h=b.dataset.h,u=me();
  if(h==='trailer'){openTrailer(id)}else if(h==='info'){hideHP();detail(id)}
  else if(h==='list'){if(!u)return;const k=u.list.indexOf(id);k<0?u.list.push(id):u.list.splice(k,1);if(k<0){u.ws=u.ws||{};u.ws[id]='want'}else if(u.ws)delete u.ws[id];save();b.innerHTML=I(k<0?'check':'plus');D.querySelectorAll('.qa[data-id="'+id+'"]').forEach(x=>x.classList.toggle('on',k<0));toast(k<0?'Added to My List':'Removed from My List',k<0?'ok':'')}
  else if(h==='like'){if(!u)return;u.rt=u.rt||{};u.rt[id]===1?delete u.rt[id]:u.rt[id]=1;save();b.classList.toggle('on',u.rt[id]===1);toast(u.rt[id]?'Liked. Expect more like this.':'Rating removed',u.rt[id]?'ok':'')}
  else if(h==='share'){const c=C[id],url=location.href.split('#')[0]+'#title-'+c.mt+'-'+c.tid;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(()=>toast('Link copied','ok'),()=>toast(url));else toast(url)}};
// ---- notifications ----
const bell=D.createElement('button');bell.className='pf v4bell';bell.setAttribute('aria-label','Notifications');bell.title='Notifications';bell.innerHTML=I('bell')+'<i class="dot"></i>';$('#pf').before(bell);
const ntf=D.createElement('div');ntf.id='ntf';ntf.setAttribute('role','dialog');ntf.setAttribute('aria-label','Notifications');D.body.append(ntf);
function notifs(){const u=me(),out=[],ne=window.NR_NE&&NR_NE();
  if(ne&&ne.items)ne.items.forEach(x=>{const c=C[x.i];if(c)out.push({k:'ep'+x.i+x.e.air_date,i:x.i,t:c.t,s:(x.up?'New episode ':'Now streaming ')+'S'+x.e.season_number+' E'+x.e.episode_number+' · '+x.e.air_date})});
  if(u&&u.rm)Object.keys(u.rm).forEach(i=>{const c=C[i];if(c)out.push({k:'rm'+i,i:+i,t:c.t,s:'Reminder · out '+(c.rd||'soon')})});
  (L.new||[]).slice(0,4).forEach(c=>out.push({k:'nw'+c.i,i:c.i,t:c.t,s:'Now in theaters'}));
  (L.trend||[]).slice(0,3).forEach((c,n)=>out.push({k:'tr'+c.i,i:c.i,t:c.t,s:'#'+(n+1)+' trending this week'}));return out}
function updBell(){const seen=new Set(store.get('nr_ntf',[]));bell.classList.toggle('new',notifs().some(n=>!seen.has(n.k)))}
bell.onclick=e=>{e.stopPropagation();if(ntf.classList.toggle('o')){const seen=new Set(store.get('nr_ntf',[])),it=notifs();
  ntf.innerHTML='<h3>Notifications</h3>'+(it.length?it.map(n=>{const c=C[n.i];return `<button class="nti${seen.has(n.k)?'':' new'}" data-nt="${n.i}"><img alt="" loading="lazy" src="https://image.tmdb.org/t/p/w300${c.b||c.p}"><span><b>${esc(n.t)}</b><small>${esc(n.s)}</small></span></button>`}).join(''):'<p class="mu" style="padding:6px 12px 14px">You’re all caught up.</p>');
  store.set('nr_ntf',[...new Set([...it.map(n=>n.k),...seen])].slice(0,300));bell.classList.remove('new');$('#menu').classList.remove('o')}};
ntf.onclick=e=>{const b=e.target.closest('[data-nt]');if(b){ntf.classList.remove('o');detail(+b.dataset.nt)}};
D.addEventListener('click',e=>{if(!e.target.closest('#ntf,.v4bell'))ntf.classList.remove('o')});
// ---- Play Something ----
function playSomething(){const u=me();let pool=u?pick(u):[];if(pool.length<4)pool=C.filter(c=>c&&c.p);
  if(!pool.length)return toast('Titles are still loading','err');const c=pool[Math.random()*pool.length|0];toast('Playing something: '+c.t,'ok');play(c.i)}
// ---- player extras: speed, episodes, picture-in-picture, skip intro, next-episode countdown ----
const pl=$('#pl'),pr=pl.querySelector('.pr');
pr.querySelector('#nx').insertAdjacentHTML('beforebegin','<button id="v4spd" class="v4pb" aria-label="Playback speed" title="Speed">1×</button><button id="v4eps" aria-label="Episodes" title="Episodes">'+I('list')+'</button><button id="v4pip" aria-label="Picture in picture" title="Picture in picture">'+I('pip')+'</button>');
pl.insertAdjacentHTML('beforeend','<button id="v4skip" hidden>Skip Intro '+I('skip')+'</button><div id="v4next" hidden><span>Next episode in <b>20</b>s</span><button>'+I('play')+' Play now</button></div><div id="psheet" hidden></div>');
function sheet(kind,force){const sh=$('#psheet');if(!P)return;if(!force&&sh.dataset.k===kind&&!sh.hidden){sh.hidden=true;return}sh.dataset.k=kind;sh.hidden=false;const c=P.c;let h='';
  if(kind==='spd')h='<h4>Playback speed</h4>'+[0.5,0.75,1,1.25,1.5,2].map(v=>`<button class="po${(P.rate||1)===v?' on':''}" data-ps="spd" data-v="${v}">${v===1?'1× (Normal)':v+'×'}</button>`).join('');
  else{const ss=c.seasons&&c.seasons.length?c.seasons:[{n:1,ec:c.ep}];let g=0;
    h='<h4>Episodes · '+esc(c.t)+'</h4>'+ss.map(s=>{const st=g;g+=s.ec;return `<p class="setlb">Season ${s.n}</p><div class="epsg">${Array.from({length:Math.min(s.ec,100)},(_,k)=>`<button class="${st+k+1===P.ep?'on':''}" data-ps="ep" data-v="${st+k+1}" aria-label="Season ${s.n} episode ${k+1}">${k+1}</button>`).join('')}</div>`}).join('')}
  sh.innerHTML=h;pwake()}
$('#v4spd').onclick=()=>sheet('spd');$('#v4eps').onclick=()=>sheet('eps');
$('#v4pip').onclick=()=>{const v=$('#vid');if(D.pictureInPictureElement)D.exitPictureInPicture();else if(v.requestPictureInPicture)v.requestPictureInPicture().catch(()=>toast('Picture-in-picture is not available here','err'))};
$('#psheet').onclick=e=>{const b=e.target.closest('[data-ps]');if(!b||!P)return;const k=b.dataset.ps,v=b.dataset.v;
  if(k==='spd'){P.rate=+v;if(P.url)$('#vid').playbackRate=P.rate;sheet('spd',1);toast('Speed '+v+'×')}else if(k==='ep'){$('#psheet').hidden=true;play(P.c.i,+v)}};
$('#v4skip').onclick=()=>{if(!P)return;if(P.url)$('#vid').currentTime=90;else P.t=90;pwake()};
$('#v4next').querySelector('button').onclick=()=>pnext();
const _play=play;play=function(){_play.apply(this,arguments);if(P){P.rate=1;$('#psheet').hidden=true;tickP()}};
// The player check only runs while the player is open, instead of a timer that never stops.
let pT=0;function tickP(){clearInterval(pT);pT=setInterval(()=>{const skip=$('#v4skip'),nx=$('#v4next'),sh=$('#psheet');
  if(!P||!pl.classList.contains('o')){skip.hidden=nx.hidden=sh.hidden=true;clearInterval(pT);return}
  const v=$('#vid'),d=(P.url&&v.duration)||P.c.m*60,t=P.t,left=d-t,tv=P.c.mt==='tv';
  skip.hidden=!(tv&&t>5&&t<90);const showN=tv&&P.ep<P.c.ep&&left<20&&left>0;nx.hidden=!showN;if(showN)nx.querySelector('b').textContent=Math.ceil(left);
  $('#v4spd').textContent=(P.rate||1)+'×';$('#v4eps').hidden=!tv||P.c.ep<2;$('#v4pip').hidden=!P.url||!D.pictureInPictureEnabled},300)}
// ---- iOS tab bar (phones) ----
const tbar=D.createElement('div');tbar.id='tabbar';tbar.setAttribute('role','navigation');tbar.setAttribute('aria-label','Tabs');
tbar.innerHTML=[['home','home','Home'],['soon','flame','New & Hot'],['search','search','Search'],['profile','me','My Reel']].map(([r,i,l])=>`<button data-tb="${r}"><i>${i==='me'?'<span class="tbav"></span>':I(i)}</i>${l}</button>`).join('');D.body.append(tbar);
tbar.onclick=e=>{const b=e.target.closest('[data-tb]');if(!b)return;const r=b.dataset.tb;if(r==='search'){scrollTo({top:0,behavior:'smooth'});$('#nav').classList.remove('hide');setTimeout(()=>$('#q').focus(),150)}else if(location.hash.slice(1)===r)scrollTo({top:0,behavior:'smooth'});else location.hash=r};
function tabSync(){const r=location.hash.slice(1)||'home';tbar.querySelectorAll('button').forEach(b=>b.classList.toggle('on',q?b.dataset.tb==='search':b.dataset.tb===r))}
// ---- Appearance studio ----
if(PAL.length<=6)PAL.push(['#0A84FF','#5E5CE6'],['#FF9F0A','#FF375F'],['#30D158','#64D2FF'],['#BF5AF2','#FF2D55'],['#FFD60A','#FF9F0A'],['#E50914','#FF6B6B'],['#64D2FF','#0A84FF'],['#D1D1D6','#8E8E93']);
const THEMES=[['midnight','Midnight','#07070B','#2a2140'],['oled','True black','#000','#1a1a1a'],['graphite','Graphite','#18181B','#3a3a40'],['ink','Ink blue','#050913','#1F2B47'],['ocean','Ocean','#03090D','#183240'],['forest','Forest','#050B08','#1D2F23'],['plum','Plum','#0B0610','#2D1D3D'],['ember','Ember','#0B0706','#33201B']];
const FONTS=[['system','System','-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif'],['inter','Inter','Inter,sans-serif'],['grotesk','Grotesk','"Bricolage Grotesque",sans-serif'],['rounded','Rounded','ui-rounded,"SF Pro Rounded",Nunito,sans-serif'],['serif','Serif','Fraunces,Georgia,serif']];
const FONT_URL={rounded:'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',serif:'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap'};
const segA=(k,o,def)=>`<div class="seg2" role="group">${o.map(([v,l])=>`<button data-ap="${k}" data-v="${v}" class="${String(S(k,def))===String(v)?'on':''}" aria-pressed="${String(S(k,def))===String(v)}">${l}</button>`).join('')}</div>`;
const tgA=(k,l,d,def,orig)=>{const on=orig?ON(me().st,k):!!S(k,def);return `<button class="tg${on?' on':''}" data-apt="${k}" data-def="${def}"${orig?' data-orig="1"':''} aria-pressed="${on}"><span>${l}<small>${d}</small></span><i></i></button>`};
window.NR_APPEAR=u=>{const st=u.st,th=st.theme||'midnight',fn=st.font||'system',hm=st.home||'home',glass=st.glass||(ON(st,'gls')?'frost':'clear');
  return `<section class="pn ap5"><h3>${I('palette')} Look &amp; feel</h3>
<p class="setlb">Theme</p><div class="thg">${THEMES.map(([v,l,c1,c2])=>`<button class="thb${th===v?' on':''}" data-ap="theme" data-v="${v}" aria-pressed="${th===v}"><i style="background:linear-gradient(135deg,${c2},${c1} 70%)"></i><span>${l}</span></button>`).join('')}</div>
<p class="setlb">Accent color</p><div class="sw sw5">${PAL.map((p,n)=>`<button data-ap="ac" data-v="${n}" class="${(u.ac||0)===n?'on':''}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Accent ${n+1}" aria-pressed="${(u.ac||0)===n}"></button>`).join('')}</div>
<p class="setlb">Font</p><div class="fng">${FONTS.map(([v,l,ff])=>`<button class="fnb${fn===v?' on':''}" data-ap="font" data-v="${v}" aria-pressed="${fn===v}"><b style="font-family:${ff.replace(/"/g,'&quot;')}">Aa</b><span>${l}</span></button>`).join('')}</div>
<p class="setlb">Text size</p>${segA('tsz',[['s','Small'],['m','Default'],['l','Large'],['xl','Extra large']],'m')}
<p class="setlb">Corners</p>${segA('rad',[['round','Round'],['soft','Soft'],['sharp','Sharp']],'round')}
<p class="setlb">Glass</p><div class="seg2" role="group">${[['frost','Frosted'],['clear','Clear'],['solid','Solid']].map(([v,l])=>`<button data-ap="glass" data-v="${v}" class="${glass===v?'on':''}" aria-pressed="${glass===v}">${l}</button>`).join('')}</div>
<p class="setlb">Background</p>${segA('bgx',[['aurora','Aurora'],['vivid','Vivid'],['plain','Plain']],'aurora')}</section>
<section class="pn ap5"><h3>${I('layout')} Layout</h3>
<p class="setlb">Poster size</p>${segA('psz',[[0,'Compact'],[1,'Regular'],[2,'Large']],1)}
<p class="setlb">Poster titles</p>${segA('ctt',[['hover','On hover'],['always','Always'],['off','Hidden']],'hover')}
<p class="setlb">Home banner</p>${segA('hero',[['tall','Tall'],['compact','Compact'],['off','Hidden']],'tall')}
<p class="setlb">Spacing</p>${segA('dens',[['comfy','Comfortable'],['compact','Compact']],'comfy')}
<p class="setlb">Start page</p><select data-set="home" aria-label="Start page">${[['home','Home'],['movies','Movies'],['series','Series'],['anime','Anime'],['soon','Coming soon'],['list','My List']].map(([v,l])=>`<option value="${v}"${hm===v?' selected':''}>${l}</option>`).join('')}</select></section>
<section class="pn ap5"><h3>${I('sparkles')} Effects</h3>
${tgA('anim','Animations','Page transitions and motion',1,1)}
${tgA('cz','Poster zoom &amp; tilt','Posters lift toward your cursor on hover',1,1)}
${tgA('hm','Rotate home banner','Cycle the big banner every 6 seconds',1,1)}
${tgA('hpv','Hover preview cards','Pop out a quick-info card when you hover a poster',1)}
${tgA('hvt','Hover scene previews','Slowly cycle through scene stills inside the hover card',1)}
${tgA('t10','Top 10 badges','Mark this week’s Top 10 on posters',1)}
${tgA('rtb','Rating badges','Show the star score on posters',1)}
${tgA('ds','Data saver','Smaller images: faster on slow connections',0,1)}</section>`};
function loadFont(f){const url=FONT_URL[f];if(!url||D.querySelector('link[data-font="'+f+'"]'))return;const l=D.createElement('link');l.rel='stylesheet';l.href=url;l.dataset.font=f;D.head.append(l)}
function applyAppear(){const u=me();if(!u)return;const st=u.st,set=(k,v,def)=>{if(v===undefined||v===def)delete H.dataset[k];else H.dataset[k]=v};
  set('theme',st.theme,'midnight');set('font',st.font,'system');set('tsz',st.tsz,'m');set('rad',st.rad,'round');set('bgx',st.bgx,'aurora');set('ctt',st.ctt,'hover');set('hero',st.hero,'tall');set('dens',st.dens,'comfy');
  set('glass',st.glass==='solid'?'solid':undefined);set('rtb',st.rtb===0?'0':undefined);if(st.font)loadFont(st.font);
  bell.hidden=false;const av=tbar.querySelector('.tbav');if(av)av.innerHTML=u.pic?`<img src="${u.pic}" alt="">`:esc(u.av);updBell()}
D.addEventListener('click',e=>{const t=e.target.closest('[data-ap],[data-apt]');if(!t)return;const u=me();if(!u)return;const st=u.st;
  if(t.dataset.apt){const k=t.dataset.apt,orig=t.dataset.orig,on=orig?ON(st,k):!!S(k,+t.dataset.def);st[k]=on?0:1;save();
    if(k==='ds')Object.keys(AC).forEach(x=>delete AC[x]);acct();t.classList.toggle('on',!on);t.setAttribute('aria-pressed',!on);if(k==='ds'||k==='rtb'||k==='t10')tagCards();return}
  const k=t.dataset.ap,v=t.dataset.v;
  if(k==='ac')u.ac=+v;else if(k==='psz')st.psz=+v;else if(k==='glass'){st.glass=v;st.gls=v==='frost'?1:0}else st[k]=v;
  save();acct();const grp=t.closest('.seg2,.thg,.fng,.sw');if(grp)grp.querySelectorAll('[data-ap]').forEach(b=>{const on=b===t;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})});
// ---- privacy panel ----
const privacyHTML=()=>`<section class="pn v4p"><h3>${I('shield')} Privacy</h3><p class="mu" style="margin:0 0 6px">Clear what you’ve left behind on this device.</p><div class="rowb"><button class="btn" data-v4="clrs">Clear search history</button><button class="btn" data-v4="clrv">Clear recently viewed</button><button class="btn" data-v4="clrr">Clear likes &amp; ratings</button></div></section>`;
D.addEventListener('click',e=>{const t=e.target.closest('[data-v4]');if(!t)return;const u=me(),a=t.dataset.v4;$('#menu').classList.remove('o');
  if(a==='ps')playSomething();if(!u)return;
  if(a==='clrs'){store.set('nr_rs',[]);toast('Search history cleared','ok')}
  else if(a==='clrv'){u.view=[];save();toast('Recently viewed cleared','ok')}
  else if(a==='clrr')CF('Clear all likes and ratings?',()=>{u.rt={};u.r10={};save();toast('Likes and ratings cleared','ok')})});
// ---- wiring ----
const _a=acct;acct=function(){_a.apply(this,arguments);applyAppear()};

const _r=render;render=function(){closePop();_r.apply(this,arguments);
  const r=location.hash.slice(1)||'home';hideHP();tabSync();tagCards();
  if(!q&&r==='profile'){const g=$('.pgrid');if(g&&!g.querySelector('.v4p'))g.insertAdjacentHTML('beforeend',privacyHTML())}
  enhanceAll()};
addEventListener('keydown',e=>{if(e.key==='Escape'){ntf.classList.remove('o');hideHP()}});
acct();render();
})();
