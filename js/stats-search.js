// Nightreel · Stats page, new episodes, search filters, title links, player keys
// ===== Nightreel v3 layer: stats, new episodes, time picker, search filters, themes, title links, player keys =====
(()=>{
const D=document;
KN.push('stats');
const fmtH=m=>{m=Math.max(0,Math.round(m));return m>=60?Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':''):m+'m'};
const runMin=c=>c.mt==='movie'?c.m:c.m*Math.max(1,c.ep);
const watchedSec=(c,p)=>c.mt==='tv'?Math.max(0,p.ep-1)*c.m*60+p.t:p.t;
// ---- stats page ----
function statsPage(){const u=me();if(!u)return '<div class="pg"><h1>Your stats</h1><p class="empty">Loading…</p></div>';
  const pool=[...new Set([...u.list,...Object.keys(u.prog).map(Number),...Object.keys(u.r10||{}).map(Number)])].map(i=>C[i]).filter(Boolean);
  if(!pool.length)return '<div class="pg"><h1>Your stats</h1>'+emptyScene('Nothing to chart yet','Add titles to My List, rate a few, or press play. Your viewing profile builds itself here.','#home','Find something to watch')+'</div>';
  const prog=Object.entries(u.prog).filter(([i])=>C[i]);
  const mins=prog.reduce((a,[i,p])=>a+watchedSec(C[i],p),0)/60,fin=prog.filter(([i,p])=>done(p,C[i])).length;
  const r10=Object.entries(u.r10||{}).filter(([i])=>C[i]).map(([i,v])=>[+i,+v]);
  const avg=r10.length?(r10.reduce((a,x)=>a+x[1],0)/r10.length).toFixed(1):'—';
  const queue=u.list.map(i=>C[i]).filter(c=>c&&watchState(u,c.i)!=='finished'),qmin=queue.reduce((a,c)=>a+runMin(c),0);
  const ty={M:0,S:0,A:0};pool.forEach(c=>ty[c.ty]=(ty[c.ty]||0)+1);const tot=pool.length;
  const gc={};pool.forEach(c=>c.g.forEach(g=>gc[g]=(gc[g]||0)+1));const tg=Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,8),gmx=tg.length?tg[0][1]:1;
  const dec={};pool.forEach(c=>{if(c.y>1900){const d=Math.floor(c.y/10)*10;dec[d]=(dec[d]||0)+1}});const dk=Object.keys(dec).map(Number).sort((a,b)=>a-b),dmx=Math.max(1,...Object.values(dec));
  const hist=Array(10).fill(0);r10.forEach(([,v])=>{if(v>=1&&v<=10)hist[v-1]++});const hmx=Math.max(1,...hist);
  const avgT=(pool.reduce((a,c)=>a+(+c.r||0),0)/tot).toFixed(1);
  const top=[...r10].sort((a,b)=>b[1]-a[1]).slice(0,12);
  const bars=(vals,labels,mx)=>`<div class="bars">${vals.map((v,n)=>`<span style="--h:${Math.max(3,v/mx*100)}%" title="${labels[n]}: ${v}"></span>`).join('')}</div><div class="bl">${labels.map(l=>`<span>${l}</span>`).join('')}</div>`;
  const TC=[['M','Movies','var(--a)'],['S','Series','var(--b)'],['A','Anime','var(--c)']];
  return `<div class="pg"><div class="page-heading"><div><h1>Your stats</h1><p>A snapshot of ${esc(u.name)}’s viewing, built from this profile’s list, ratings and progress.</p></div><a class="btn" href="#list">Open My List</a></div>
<div class="v3k"><div><b>${tot}</b><span>Titles tracked</span></div><div><b>${fmtH(mins)}</b><span>Estimated time watched</span></div><div><b>${fin}</b><span>Finished</span></div><div><b>${fmtH(qmin)}</b><span>Queued in My List</span></div><div><b>${avg}</b><span>Your average score</span></div><div><b>${avgT}</b><span>Avg TMDB score of your picks</span></div></div>
<div class="v3p">
<section class="pn"><h3>What you watch</h3><div class="v3split">${TC.map(([k,,col])=>ty[k]?`<i style="width:${ty[k]/tot*100}%;background:${col}"></i>`:'').join('')}</div><div class="v3leg">${TC.map(([k,l,col])=>`<span style="--k:${col}">${l} · ${ty[k]}</span>`).join('')}</div></section>
<section class="pn"><h3>Top genres</h3>${tg.map(([g,n])=>`<div class="gbar"><span>${esc(g)}</span><div class="gb"><i style="width:${n/gmx*100}%"></i></div><b>${n}</b></div>`).join('')}</section>
<section class="pn"><h3>By decade</h3>${dk.length?bars(dk.map(d=>dec[d]),dk.map(d=>'’'+String(d).slice(2)+'s'),dmx):'<p class="mu">No release years yet.</p>'}</section>
<section class="pn"><h3>How you rate</h3>${r10.length?bars(hist,hist.map((_,n)=>n+1),hmx):'<p class="mu">Rate titles out of 10 from the More menu on any title to see your curve here.</p>'}</section>
</div>${top.length?`<h2 class="ph">Your highest rated</h2><div class="gr">${top.map(([i,v])=>card(C[i],{s:'You: '+v+'/10'})).join('')}</div>`:''}</div>`}
// ---- new episodes for shows you follow ----
let NE={key:'',items:null,busy:''};window.NR_NE=()=>NE;
const dFrom=s=>(Date.parse(s+'T12:00:00')-Date.now())/864e5;
const dayLbl=s=>{const d=Math.round(dFrom(s)),dt=new Date(s+'T12:00:00');return d===0?'Today':d===1?'Tomorrow':d===-1?'Yesterday':d>1&&d<7?dt.toLocaleDateString(undefined,{weekday:'long'}):dt.toLocaleDateString(undefined,{month:'short',day:'numeric'})};
async function newEps(){const u=me();if(!u)return;
  const ids=[...new Set([...u.list,...Object.keys(u.prog).map(Number)])].filter(i=>C[i]&&C[i].mt==='tv').slice(0,16);if(!ids.length)return;
  const key=ids.join(',');if(NE.key===key&&NE.items)return paintNE();if(NE.busy===key)return;NE.busy=key;
  const out=[];await Promise.all(ids.map(async i=>{try{const d=await T('/tv/'+C[i].tid),n=d.next_episode_to_air,l=d.last_episode_to_air;
    if(n&&n.air_date&&dFrom(n.air_date)>-1&&dFrom(n.air_date)<=30)out.push({i,e:n,up:1});
    else if(l&&l.air_date&&dFrom(l.air_date)>=-14&&dFrom(l.air_date)<=0)out.push({i,e:l,up:0})}catch(e){}}));
  if(NE.busy!==key)return;NE={key,items:out.sort((a,b)=>a.e.air_date<b.e.air_date?-1:1),busy:''};paintNE()}
function paintNE(){const r=location.hash.slice(1)||'home';if(r!=='home'||q||!LD||!NE.items||!NE.items.length||$('#v3ne'))return;
  const host=[...$('#app').children].find(el=>el.tagName==='DIV'&&!el.className&&!el.id);if(!host)return;
  const lab={};NE.items.forEach(x=>lab[x.i]=(x.up?'':'New · ')+'S'+x.e.season_number+' E'+x.e.episode_number+' · '+dayLbl(x.e.air_date));
  const w=D.createElement('div');w.id='v3ne';w.innerHTML=row('New episodes for you',NE.items.map(x=>C[x.i]),{f:c=>({s:lab[c.i]})});host.prepend(w)}
// ---- My List: time-boxed pick + queue length ----
function listExtras(){const u=me(),tools=$('.list-tools');if(!u||!tools||$('#v3time'))return;
  const queue=u.list.map(i=>C[i]).filter(c=>c&&watchState(u,c.i)!=='finished');
  const s=D.createElement('select');s.id='v3time';s.setAttribute('aria-label','Pick something that fits the time you have');
  s.innerHTML='<option value="">I have…</option>'+[[30,'30 min'],[45,'45 min'],[60,'1 hour'],[90,'90 min'],[120,'2 hours'],[180,'3 hours']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('');tools.prepend(s);
  const p=$('.list-head p');if(p&&queue.length)p.insertAdjacentHTML('beforeend',` <span class="v3q">About <b>${fmtH(queue.reduce((a,c)=>a+runMin(c),0))}</b> of watching is queued.</span>`)}
function timePick(v){const u=me();if(!u||!v)return;const fits=u.list.map(i=>C[i]).filter(c=>c&&watchState(u,c.i)!=='finished'&&c.m<=v);
  if(!fits.length)return toast('Nothing in your list fits in '+fmtH(v)+'. Try a longer slot','err');
  const c=fits[Math.random()*fits.length|0];detail(c.i);toast((c.mt==='movie'?fmtH(c.m)+' movie':'~'+fmtH(c.m)+' episodes')+' · fits your '+fmtH(v),'ok')}
// ---- search: filter results by type ----
let SF='',lastQ='';
const tag=root=>root&&root.querySelectorAll('.card[data-id]:not([data-ty])').forEach(el=>{const c=C[+el.dataset.id];if(c)el.dataset.ty=c.ty});
function searchChips(){if(q!==lastQ){lastQ=q;SF=''}D.body.dataset.sf=SF;const h=$('#app .pg>h1');if(!h||$('.v3sf'))return;
  h.insertAdjacentHTML('afterend','<div class="chips v3sf" role="group" aria-label="Filter results by type">'+[['','All'],['M','Movies'],['S','Series'],['A','Anime']].map(([v,l])=>`<button data-v3sf="${v}" class="${SF===v?'on':''}" aria-pressed="${SF===v}">${l}</button>`).join('')+'</div>')}
new MutationObserver(()=>{if(q)tag($('#gr'))}).observe($('#app'),{childList:true,subtree:true});
// ---- title detail: runtime math + lookup links ----
function extras(id){const c=C[id],md=$('#md .md');if(!c||!md)return;const aside=md.querySelector('.ov2 aside');if(!aside||aside.querySelector('.v3links'))return;
  const fact=aside.querySelector('.fact');
  if(fact&&c.det){let rows='';if(c.mt==='movie'&&c.m)rows=`<div><dt>Runtime</dt><dd>${fmtH(c.m)}</dd></div><div><dt>Start now, ends</dt><dd>${new Date(Date.now()+c.m*60000).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</dd></div>`;
    else if(c.mt==='tv'&&c.ep>1)rows=`<div><dt>Episodes</dt><dd>${c.ep}</dd></div><div><dt>Binge time</dt><dd>≈ ${fmtH(c.ep*c.m)}</dd></div>`;fact.insertAdjacentHTML('beforeend',rows)}
  const t=encodeURIComponent(c.t),ty=encodeURIComponent(c.t+(c.y?' '+c.y:''));
  const links=[['TMDB','https://www.themoviedb.org/'+c.mt+'/'+c.tid],['IMDb','https://www.imdb.com/find/?q='+ty],c.mt==='movie'?['Letterboxd','https://letterboxd.com/search/'+t+'/']:null,['JustWatch','https://www.justwatch.com/us/search?q='+t],['Trailers','https://www.youtube.com/results?search_query='+encodeURIComponent(c.t+' '+(c.y||'')+' trailer')]].filter(Boolean);
  aside.insertAdjacentHTML('beforeend','<div class="v3links"><p class="setlb">Look it up</p>'+links.map(([l,h])=>`<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${l} ${I('external')}</a>`).join('')+'</div>')}
const _d=detail;detail=function(id){_d.apply(this,arguments);try{extras(id)}catch(e){}};
// ---- themes ----
const THEMES=[['midnight','Midnight'],['oled','True black (OLED)'],['ink','Ink blue'],['ember','Ember']];
function applyTheme(){const u=me(),t=u&&u.st&&u.st.theme;if(t&&t!=='midnight'&&THEMES.some(x=>x[0]===t))D.documentElement.dataset.theme=t;else delete D.documentElement.dataset.theme}
function themeUI(){const u=me();if(!u||$('#v3theme'))return;const h=[...D.querySelectorAll('.pn h3')].find(x=>x.textContent==='Appearance');if(!h)return;const cur=u.st.theme||'midnight';
  h.insertAdjacentHTML('afterend','<p class="setlb">Theme</p><select id="v3theme" aria-label="Theme">'+THEMES.map(([v,l])=>`<option value="${v}"${v===cur?' selected':''}>${l}</option>`).join('')+'</select>')}
const _a=acct;acct=function(){_a.apply(this,arguments);applyTheme();const m=$('#menu'),pl=m&&m.querySelector('a[href="#profile"]');if(pl&&!m.querySelector('a[href="#stats"]'))pl.insertAdjacentHTML('beforebegin','<a href="#stats">Your stats</a>')};
// ---- routing ----
function after(){const r=location.hash.slice(1)||'home';
  if(q){searchChips();tag($('#gr'))}else{delete D.body.dataset.sf;if(r==='home')newEps()}}
const _r=render;render=function(){const r=location.hash.slice(1);
  if(r==='stats'&&!q){SEEN.clear();GR=null;io.disconnect();D.querySelectorAll('#nl a,.dp a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#stats'));const a=$('#app');a.innerHTML=statsPage();a.classList.remove('pgin');void a.offsetWidth;a.classList.add('pgin');delete D.body.dataset.sf;return}
  _r.apply(this,arguments);after()};
// ---- events ----
D.addEventListener('click',e=>{const b=e.target.closest('[data-v3sf]');if(!b)return;SF=b.dataset.v3sf;D.body.dataset.sf=SF;D.querySelectorAll('[data-v3sf]').forEach(x=>{const on=x.dataset.v3sf===SF;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});tag($('#gr'))});
D.addEventListener('change',e=>{const t=e.target;
  if(t.id==='v3theme'){const u=me();if(!u)return;u.st.theme=t.value;save();applyTheme();toast('Theme updated','ok')}
  else if(t.id==='v3time'){const v=+t.value;t.value='';timePick(v)}});
function help3(){const k=(a,b)=>`<div class="v3kb">${b}<span>${a.split('+').map(x=>`<kbd>${x}</kbd>`).join('')}</span></div>`;
  $('#au').innerHTML='<div class="au v3help"><button class="x" data-a="cl" aria-label="Close">'+I('x')+'</button><h2>Keyboard shortcuts</h2><h4>Anywhere</h4>'+k('/','Search')+k('Ctrl+K','Command palette')+k('?','Show this help')+k('Esc','Close dialogs')+'<h4>Player</h4>'+k('Space','Play / pause')+k('←+→','Seek 10 seconds')+k('0–9','Jump to 0–90%')+k('N','Next episode')+k('M','Mute')+k('F','Fullscreen')+'</div>';$('#au').classList.add('o')}
// Player keys run in the capture phase: the old handler ignored keys while a player button had focus, so Space "clicked" the close button.
addEventListener('keydown',e=>{const el=e.target||{},tg=el.tagName||'',typing=(tg==='INPUT'&&el.type!=='range')||tg==='SELECT'||tg==='TEXTAREA';
  if(P){if(typing||e.ctrlKey||e.metaKey||e.altKey)return;const v=$('#vid'),k=e.key;let h=1;
    if(k==='Escape')stop();else if(k===' '||k==='k'||k==='K')ptoggle();else if(k==='ArrowLeft'||k==='j')pseek(-10);else if(k==='ArrowRight'||k==='l')pseek(10);
    else if(k==='f'||k==='F')$('#fs').click();else if(k==='m'||k==='M'){if(P.url){v.muted=!v.muted;toast(v.muted?'Muted':'Sound on')}else toast('Demo playback has no sound')}
    else if(k==='n'||k==='N')pnext();else if(/^[0-9]$/.test(k)){const d=(P.url&&v.duration)||P.c.m*60,t=d*(+k)/10;if(P.url)v.currentTime=t;else P.t=t;pwake()}else h=0;
    if(h){e.preventDefault();e.stopImmediatePropagation()}return}
  if(!typing&&e.key==='?'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();e.stopImmediatePropagation();help3()}},true);
addEventListener('offline',()=>toast('You’re offline. Some titles may not load','err'));addEventListener('online',()=>toast('Back online','ok'));
const up=Object.assign(D.createElement('button'),{id:'v3top',innerHTML:I('arrowUp'),title:'Back to top'});up.setAttribute('aria-label','Back to top');up.onclick=()=>scrollTo({top:0,behavior:'smooth'});D.body.append(up);
addEventListener('scroll',()=>up.classList.toggle('o',scrollY>900),{passive:true});
acct();render();
})();
