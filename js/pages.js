// Nightreel · Router (render), history, coming soon, people, browse grids, hero rotation
const nf=()=>'<div class="pg" style="text-align:center"><h1 style="font-size:64px">404</h1><p class="empty">This scene was cut. That page doesn’t exist.</p><p><a class="btn p" href="#home">Back to Home</a></p></div>';
const rs=()=>store.get('nr_rs',[]),addRs=v=>{if(v)store.set('nr_rs',[v,...rs().filter(x=>x!==v)].slice(0,6))};
function histPage(){const u=me();if(!u)return '<div class="pg"><h1>Watch history</h1><p class="empty">Sign in to see your history.</p></div>';
  const it=Object.entries(u.prog).filter(([i])=>C[i]).sort((a,b)=>b[1].u-a[1].u);
  return `<div class="pg"><h1>Watch history</h1>${it.length?`<div class="rowb" style="padding:0 4vw;margin:0 0 16px"><button class="btn" data-a="clc">Clear history</button></div><div class="gr">${it.map(([i,p])=>card(C[i],{p:Math.min(100,p.t/(C[i].m*60)*100),s:(C[i].ty==='M'?'':se(C[i],p.ep))+(done(p,C[i])?' · Watched':'')})).join('')}</div>`:'<p class="empty">Nothing watched yet.</p>'}</div>`}
async function loadSoon(force=false){if(force)for(const page of [1,2])try{sessionStorage.removeItem('tm:/movie/upcoming&region=US&page='+page)}catch(e){}
  const request=++SOON_REQ;try{const r=await Promise.all([T('/movie/upcoming','&region=US&page=1'),T('/movie/upcoming','&region=US&page=2')]),t=new Date().toISOString().slice(0,10),u=me(),
    it=r.flatMap(j=>j.results||[]).map(x=>ing(x,'movie')).filter(c=>c&&c.rd>=t).sort((x,y)=>x.rd<y.rd?-1:1);if(request!==SOON_REQ||!$('#sg'))return;saveCat();
    $('#sg').innerHTML=it.length?it.map(c=>card(c,{s:(u&&u.rm&&u.rm[c.i]?I('bell')+' ':'')+new Date(c.rd+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})})).join(''):'<p class="empty">Nothing scheduled right now.</p>'}
  catch(e){if(request!==SOON_REQ||!$('#sg'))return;toast('Failed to load upcoming titles','err');$('#sg').innerHTML='<div class="empty-scene list-empty"><b>Coming-soon titles could not load</b><p>Check your connection, then try again.</p><button class="btn" data-a="retry-soon">Retry</button></div>'}}
async function loadPerson(id){
  try{const d=await T('/person/'+id,'&append_to_response=combined_credits');if(!$('#pp'))return;
    const cr=d.combined_credits||{},seen=new Set(),it=[...(cr.cast||[]),...(cr.crew||[]).filter(x=>x.job==='Director')].filter(x=>x.poster_path&&(x.media_type==='movie'||x.media_type==='tv')).sort((a,b)=>b.popularity-a.popularity).map(x=>ing(x)).filter(c=>c&&!seen.has(c.i)&&seen.add(c.i)).slice(0,40);saveCat();
    $('#pp').innerHTML=`<div class="pcard"><div class="bigav" style="${d.profile_path?`background:url('https://image.tmdb.org/t/p/w185${d.profile_path}') center/cover`:''}">${d.profile_path?'':I('user')}</div><div><h1>${esc(d.name)}</h1><p class="mu">${esc(d.known_for_department||'')}${d.birthday?' · Born '+d.birthday:''}${d.place_of_birth?' · '+esc(d.place_of_birth):''}</p></div></div>${d.biography?`<p class="bio">${esc(d.biography.slice(0,600))}${d.biography.length>600?'…':''}</p>`:''}<h2 class="ph">Known for</h2><div class="gr">${it.map(c=>card(c)).join('')}</div>`}
  catch(e){if($('#pp'))$('#pp').innerHTML='<p class="empty">Could not load this person.</p>';toast('Failed to load person','err')}}
function chkRem(){const u=me();if(!u||!u.rm)return;const t=new Date().toISOString().slice(0,10);const out=[];for(const i of Object.keys(u.rm)){const c=C[i];if(c&&c.rd&&c.rd<=t){out.push(c.t);delete u.rm[i]}}if(out.length){toast(out.length===1?out[0]+' is out now':out[0]+' and '+(out.length-1)+' more are out now','ok');save()}}
const help=()=>{$('#au').innerHTML='<div class="au"><button class="x" data-a="cl" aria-label="Close">'+I('x')+'</button><h2>Shortcuts</h2><p><b>/</b> Focus search<br><b>?</b> This help<br><b>Esc</b> Close anything (player included)<br><b>Ctrl/Cmd K</b> Command palette<br><b>Space</b> Play or pause · <b>← →</b> Seek</p></div>';$('#au').classList.add('o')};
const skel=n=>'<div class="card skc"></div>'.repeat(n);
const skHome=()=>'<div class="hero hsk"><div class="nr-loading" role="status" aria-live="polite"><div><div class="nr-reel" aria-hidden="true">'+I('sparkles')+'</div><b>NIGHTREEL</b><p>Finding your next scene…</p></div></div></div><div style="margin-top:10px">'+[0,1,2].map(()=>`<section class="row"><div class="skt"></div><div class="sc">${skel(9)}</div></section>`).join('')+'</div>';
const DC=[['2020s',2020],['2010s',2010],['2000s',2000],['90s',1990],['80s',1980],['Older',1970]];
const RC=[[I('star','fill')+' 7+',7],[I('star','fill')+' 8+',8],[I('star','fill')+' 9+',9]];
function page(ty,title){
  return `<div class="pg"><h1>${title}</h1><div class="ctl"><button class="btn" data-a="reset-filters">Reset filters</button><select id="so" aria-label="Sort by">${[['pop','Most popular'],['rate','Highest rated'],['new','Newest release']].map(o=>`<option value="${o[0]}"${SO===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></div><div class="chips">${Object.keys(GM[ty]).map(g=>`<button data-a="chip" data-g="${g}" class="${GS.includes(g)?'on':''}">${g}</button>`).join('')}</div><div class="chips" style="margin-top:-14px">${DC.map(d=>`<button data-a="dy" data-v="${d[1]}" class="${DY===d[1]?'on':''}">${d[0]}</button>`).join('')}${RC.map(r=>`<button data-a="mr" data-v="${r[1]}" class="${RG===r[1]?'on':''}">${r[0]}</button>`).join('')}</div><div class="gr" id="gr" data-k="d" data-t="${ty}">${skel(12)}</div><div id="more" style="height:40px"></div></div>`}
let GR=null;
const io=new IntersectionObserver(es=>{if(es[0].isIntersecting)loadMore()},{rootMargin:'700px'});
function gridInit(){GR=null;io.disconnect();const g=$('#gr');if(!g)return;GR={k:g.dataset.k,ty:g.dataset.t,pg:0,tot:1,busy:0,seen:new Set()};loadMore()}
async function loadMore(){const R=GR;if(!R||R.busy||R.pg>=R.tot)return;R.busy=1;
  try{let j,mt='';
    if(R.k==='q')j=await T('/search/multi','&include_adult=false&page='+(R.pg+1)+'&query='+encodeURIComponent(q));
    else{const m=R.ty==='M',ids=GS.map(n=>GM[R.ty][n]).filter(Boolean),dk=m?'primary_release_date':'first_air_date';mt=m?'movie':'tv';
      let x='&page='+(R.pg+1)+'&sort_by='+(SO==='rate'?'vote_average.desc&vote_count.gte=300':SO==='new'?dk+'.desc&'+dk+'.lte='+new Date().toISOString().slice(0,10)+'&vote_count.gte=25':'popularity.desc');
      if(DY)x+='&'+dk+'.gte='+(DY===1970?'1900':DY)+'-01-01&'+dk+'.lte='+(DY===1970?'1979':DY+9)+'-12-31';
      if(RG)x+='&vote_average.gte='+RG;
      if(R.ty==='A'){ids.push(16);x+='&with_original_language=ja'}
      if(ids.length)x+='&with_genres='+ids.join(',');
      j=await T(m?'/discover/movie':'/discover/tv',x)}
    if(GR!==R)return;R.pg=j.page||R.pg+1;R.tot=Math.min(j.total_pages||1,25);
    if(R.k==='q'&&R.pg===1){const pd=$('#ppl');if(pd){const ppl=(j.results||[]).filter(x=>x.media_type==='person'&&x.profile_path).slice(0,9);pd.innerHTML=ppl.length?'<h2 style="font-size:16px;padding:0 4vw;margin:0 0 10px">People</h2><div class="cast" style="padding:0 4vw 8px">'+ppl.map(x=>`<button class="cm" data-a="per" data-id="${x.id}"><i style="background-image:url('https://image.tmdb.org/t/p/w185${x.profile_path}')"></i>${esc(x.name)}<small>${esc(x.known_for_department||'')}</small></button>`).join('')+'</div>':''}}
    const it=(j.results||[]).map(x=>ing(x,mt)).filter(c=>c&&!R.seen.has(c.i)&&R.seen.add(c.i)),g=$('#gr');
    if(R.pg===1)g.innerHTML=it.length?'':emptyScene('No titles found','Try another search or reset your filters.','#home','Back to home');
    g.insertAdjacentHTML('beforeend',it.map(c=>card(c)).join(''));saveCat()}
  catch(e){if(GR===R){R.tot=0;toast('Failed to load titles','err');const g=$('#gr');if(g&&!g.querySelector('a,.card:not(.skc)'))g.innerHTML='<p class="empty">Could not load titles.</p>'}}
  R.busy=0;const m=$('#more');if(m&&GR===R&&R.tot){io.unobserve(m);io.observe(m)}}
function pick(u){const w={};u.gn.forEach(g=>w[g]=(w[g]||0)+1);Object.entries(u.rt||{}).forEach(([i,v])=>{const c=C[i];c&&c.g.forEach(g=>w[g]=(w[g]||0)+2*v)});
  Object.entries(u.r10||{}).forEach(([i,v])=>{const c=C[i];c&&c.g.forEach(g=>w[g]=(w[g]||0)+Math.max(1,Math.round(v/3)))});
  return C.filter(c=>!(u.rt&&u.rt[c.i])).map(c=>({c,s:c.g.reduce((a,g)=>a+(w[g]||0),0)+c.r/10})).filter(x=>x.s>=1).sort((a,b)=>b.s-a.s).slice(0,14).map(x=>x.c)}
function render(){
  const r=location.hash.slice(1)||'home',u=me();SEEN.clear();
  document.querySelectorAll('#nl a,.dp a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+r&&!q));
  let h;
  if(!q&&NF(r))h=nf();else if(!q&&ST[r])h=statics(r);else if(q)h=`<div class="pg"><h1>Results for “${esc(q)}”</h1><div id="ppl"></div><div class="gr" id="gr" data-k="q">${skel(12)}</div><div id="more" style="height:40px"></div></div>`;
  else if(r==='movies')h=page('M','Movies');
  else if(r==='auth')h=authPage();
  else if(r==='profile')h=profile();
  else if(r==='history')h=histPage();
  else if(r==='soon')h='<div class="pg"><div class="page-heading"><div><h1>Coming soon</h1><p>Upcoming theatrical releases. Dates and availability vary by region.</p></div><button class="btn" data-a="retry-soon">Refresh</button></div><div class="gr" id="sg">'+skel(12)+'</div></div>';
  else if(r.startsWith('p-'))h='<div class="pg" id="pp"><div class="sk" style="margin:0 4vw;height:120px"></div></div>';
  else if(r.startsWith('title-')||r.startsWith('t-'))h='<div class="pg"><p class="empty">Opening title… <a href="#home">Back to Home</a></p></div>';
  else if(r==='series')h=page('S','Series');
  else if(r==='anime')h=page('A','Anime');
  else if(r==='list')h=listPage(u);
  else{
    const cw=conts(),last=cw[0],rec=last?C.filter(c=>c.i!==last.i&&c.g.some(g=>last.g.includes(g))).slice(0,10):[];
    h=(FEAT.length?hero():'<div style="height:90px"></div>')+`<div style="margin-top:10px">`+row('Continue watching',cw,{f:c=>{const p=u.prog[c.i];return{p:Math.min(100,p.t/(c.m*60)*100),s:c.mt==='movie'?'':se(c,p.ep)}}})+row('Recently viewed',(u&&u.view?u.view:[]).map(i=>C[i]).filter(Boolean).slice(0,12))+row('Picked for you',u?pick(u):[])+row('Trending this week',dd((L.trend||[]).slice(0,10)),{rank:1})+moods()+(last?row('Because you watched '+esc(last.t),rec):'')+row('In theaters now',dd(L.new))+row('Popular movies',dd(L.pm))+row('Top rated',dd(L.tm))+row('Popular series',dd(L.ps))+row('Anime',dd(L.an))+`</div>`;
  }
  if(!LD&&r==='home'&&!q)h=skHome();else if(LD&&r==='home'&&!q&&!FEAT.length&&!C.length)h='<div class="pg"><h1>Could not load titles</h1><p class="empty">Check your internet connection or TMDB API key, then <button class="btn" data-a="retry-home">try again</button>.</p></div>';$('#app').innerHTML=h;if(r==='auth')authBind();slide(0);gridInit();if(!q){if(r==='soon')loadSoon();else if(r.startsWith('p-'))loadPerson(+r.slice(2));else if(r.startsWith('title-'))openShared(r);else if(r.startsWith('t-')){const tid=+r.slice(2);if(C[tid])detail(tid);else $('#app').innerHTML='<div class="pg"><p class="empty">This older link only works on the device where it was created. <a href="#home">Go home</a></p></div>'}}
}
// Stable share links use TMDB type and ID rather than a browser-local array index.
let openingShared='';
async function openShared(route){
  const match=/^title-(movie|tv)-(\d+)$/.exec(route);if(!match)return;
  let c=CK[match[1]+match[2]];
  if(!c){if(openingShared===route)return;openingShared=route;
    try{const d=await T('/'+match[1]+'/'+match[2]);d.genre_ids=(d.genres||[]).map(g=>g.id);c=ing(d,match[1]);if(c)saveCat()}
    catch(e){}finally{openingShared=''}
  }
  if(location.hash.slice(1)!==route)return;
  if(c)detail(c.i);else $('#app').innerHTML='<div class="pg"><p class="empty">Could not open this title. Check your connection and <button class="btn" data-a="retry-title">try again</button>.</p></div>';
}
// ---- hero rotation ----
let sn=0;
function slide(n){const s=document.querySelectorAll('.sl');if(!s.length)return;sn=n%s.length;s.forEach((e,i)=>e.classList.toggle('on',i===sn));document.querySelectorAll('.dots button').forEach((e,i)=>e.classList.toggle('on',i===sn))}
let hp=0;document.addEventListener('mouseover',e=>{hp=!!e.target.closest('#hero')});
setInterval(()=>{if(!hp&&me()&&ON(me().st,'hm')&&ON(me().st,'anim')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.querySelector('.ovl.o,#pl.o')&&!document.hidden)slide(sn+1)},6000);
