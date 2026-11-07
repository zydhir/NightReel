// Nightreel · Splash, scroll effects, quick add, command palette, Tonight’s pick
// ===== Nightreel v2 layer =====
(()=>{
const A=document;let lastR='',ly=0,tk=0;
// splash
Promise.race([new Promise(r=>addEventListener('load',()=>setTimeout(r,120))),new Promise(r=>setTimeout(r,900))]).then(()=>{const s=$('#splash');if(s){s.classList.add('out');setTimeout(()=>s.remove(),800)}});
// light, cheap effects: cursor spotlight, film grain, scroll progress, hiding nav, hero parallax
if(false){const sp=A.createElement('div');sp.className='spot';A.body.append(sp);let r=0;
  addEventListener('pointermove',e=>{if(r)return;r=requestAnimationFrame(()=>{r=0;sp.style.setProperty('--sx',e.clientX+'px');sp.style.setProperty('--sy',e.clientY+'px');
    const h=e.target.closest&&e.target.closest('#hero');if(h){const b=h.getBoundingClientRect();h.style.setProperty('--hx',((e.clientX-b.left)/b.width-.5)*2);h.style.setProperty('--hy',((e.clientY-b.top)/b.height-.5)*2)}})},{passive:true})}

const bar=Object.assign(A.createElement('div'),{id:'sp'});A.body.append(bar);
addEventListener('scroll',()=>{if(tk)return;tk=requestAnimationFrame(()=>{tk=0;const y=scrollY,h=A.documentElement.scrollHeight-innerHeight,nv=$('#nav');bar.style.setProperty('--p',h>0?y/h:0);
  if(nv){nv.classList.toggle('hide',y>260&&y>ly+4&&!$('#menu').classList.contains('o'));if(y<ly-4||y<260)nv.classList.remove('hide')}ly=y})},{passive:true});
// ambient colour from a poster (used for the hero and the title popup)
const AMB={};
function amb(p,el){if(!el||!p)return;const set=c=>el.style.setProperty('--amb',c);if(AMB[p])return set(AMB[p]);
  const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{try{const cv=A.createElement('canvas');cv.width=cv.height=8;const x=cv.getContext('2d');x.drawImage(im,0,0,8,8);const d=x.getImageData(0,0,8,8).data;let r=0,g=0,b=0,n=0;
    for(let i=0;i<d.length;i+=4){const mx=Math.max(d[i],d[i+1],d[i+2]),s=mx-Math.min(d[i],d[i+1],d[i+2]);if(mx>40&&s>25){r+=d[i]*s;g+=d[i+1]*s;b+=d[i+2]*s;n+=s}}
    if(n){const c='rgba('+(r/n|0)+','+(g/n|0)+','+(b/n|0)+',.9)';AMB[p]=c;set(c)}}catch(e){}};im.src='https://image.tmdb.org/t/p/w92'+p}
// per-page extras
const rvo=window.IntersectionObserver?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rvo.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'}):null;
function strip(){return;const u=me();if(!u||!$('#hero')||$('.cstrip'))return;const cw=conts();if(!cw.length)return;const c=cw[0],p=u.prog[c.i],pc=Math.min(100,p.t/(c.m*60)*100),d=A.createElement('div');d.className='cstrip';
  d.innerHTML='<img alt="" src="https://image.tmdb.org/t/p/w185'+c.p+'"><div><small>Continue watching</small><b>'+esc(c.t)+'</b><span>'+(c.ty==='M'?'':se(c,p.ep)+' · ')+Math.round(pc)+'% watched</span><i><u style="width:'+pc+'%"></u></i></div><button class="btn p" data-a="play" data-id="'+c.i+'">'+I('play')+' Resume</button>';$('#hero').after(d)}
function activity(){const u=me(),g=A.querySelector('.pgrid');if(!u||!g||g.querySelector('.act'))return;const days=u.days||{},iso=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10),
  wk=[];for(let i=6;i>=0;i--)wk.push([new Date(Date.now()-i*864e5).toLocaleDateString(undefined,{weekday:'short'}),days[iso(i)]||0]);
  let st=0,i=days[iso(0)]?0:1;while(days[iso(i)]>0){st++;i++}
  const mx=Math.max(60,...wk.map(x=>x[1])),mins=Math.round(wk.reduce((a,x)=>a+x[1],0)/60),gc={};[...Object.keys(u.prog),...u.list].forEach(i=>C[i]&&C[i].g.forEach(x=>gc[x]=(gc[x]||0)+1));
  const tg=Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,5),s=A.createElement('section');s.className='pn act';
  s.innerHTML='<h3>Activity</h3><div class="stat3"><div><b>'+I('flame')+' '+st+'</b>day streak</div><div><b>'+mins+'m</b>this week</div></div><div class="bars">'+wk.map(x=>'<span style="--h:'+Math.max(4,x[1]/mx*100)+'%" title="'+Math.round(x[1]/60)+' min"></span>').join('')+'</div><div class="bl">'+wk.map(x=>'<span>'+x[0]+'</span>').join('')+'</div>'+(tg.length?'<p class="mu" style="margin:0 0 8px">Your top genres</p><div class="chips" style="padding:0">'+tg.map(x=>'<button disabled>'+x[0]+' · '+x[1]+'</button>').join('')+'</div>':'');g.prepend(s)}
function post(){const a=$('#app'),r=location.hash.slice(1)||'home',key=location.hash+'|'+q+'|'+(LD?1:0),fresh=key!==lastR;
  if(a&&fresh){lastR=key;a.classList.remove('pgin');void a.offsetWidth;a.classList.add('pgin')}
  if(r==='home'&&!q)strip();if(r==='profile')activity();
  if(fresh&&rvo)A.querySelectorAll('.row,.pn,.pg>h1,.pcard,.stats,.tiles,.cstrip').forEach(el=>{if(!el.classList.contains('rv')){el.classList.add('rv');rvo.observe(el)}});
  A.querySelectorAll('#hero .sl').forEach((s,n)=>{const c=FEAT[n];c&&amb(c.p,s)})}
const _r=render;render=function(){_r.apply(this,arguments);post()};
const _d=detail;detail=function(id,keep){_d.apply(this,arguments);const c=C[id];c&&amb(c.p,$('#md .md'))};
// quick add on cards + confetti
function burst(x,y){for(let i=0;i<14;i++){const p=A.createElement('i'),a=Math.random()*6.28,d=40+Math.random()*60;p.className='pf2';p.style.cssText='left:'+x+'px;top:'+y+'px;--dx:'+Math.cos(a)*d+'px;--dy:'+(Math.sin(a)*d-20)+'px;background:hsl('+Math.random()*360+',90%,65%)';A.body.append(p);setTimeout(()=>p.remove(),900)}}
A.addEventListener('click',e=>{const t=e.target.closest('[data-a="list"],[data-a="rate"],.qa');if(t&&!(me()&&me().st&&me().st.anim===0))burst(e.clientX,e.clientY)},true);
A.addEventListener('click',e=>{const t=e.target.closest('.qa');if(!t)return;e.stopPropagation();e.preventDefault();const id=+t.dataset.id;if(!needAuth(()=>{}))return;
  const u=me(),k=u.list.indexOf(id);k<0?u.list.push(id):u.list.splice(k,1);if(k<0){u.ws=u.ws||{};u.ws[id]='want'}else if(u.ws)delete u.ws[id];save();
  A.querySelectorAll('.qa[data-id="'+id+'"]').forEach(b=>b.classList.toggle('on',k<0));toast(k<0?'Added to My List':'Removed from My List',k<0?'ok':'')},true);
// overlay helper + command palette
function ovlBox(id){let b=$('#'+id);if(!b){b=A.createElement('div');b.id=id;b.className='ovl';b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');A.body.append(b)}return b}
const surprise=()=>{const b=A.createElement('button');b.dataset.a='rnd';A.body.append(b);b.click();b.remove()};
const CMD=[['home','Home','#home'],['film','Movies','#movies'],['tv','Series','#series'],['sparkles','Anime','#anime'],['calendar','Coming soon','#soon'],['heart','My List','#list'],['clock','Watch history','#history'],['settings','Profile and settings','#profile'],['dice','Surprise me','',surprise],['target','Tonight’s pick','',()=>openPick()]];
function openCmd(){const b=ovlBox('cmk');b.innerHTML='<div class="cmk"><input id="cmi" placeholder="Search titles or jump to a page…" autocomplete="off" aria-label="Command palette"><div id="cml" role="listbox"></div><small class="mu">↑ ↓ move · Enter open · Esc close</small></div>';b.classList.add('o');
  const inp=$('#cmi'),list=$('#cml');let items=[],ix=0,tm=0;
  const go=it=>{closeOvl(b);setTimeout(it.run,230)},paint=()=>{list.innerHTML=items.map((it,n)=>'<button class="cmr'+(n===ix?' on':'')+'" data-n="'+n+'" role="option">'+(it.img?'<img alt="" src="'+it.img+'">':'<span class="ic">'+I(it.ic)+'</span>')+'<span>'+esc(it.t)+'</span><small>'+esc(it.s||'')+'</small></button>').join('')||'<p class="mu" style="padding:12px">No matches.</p>'};
  const tItem=c=>({img:'https://image.tmdb.org/t/p/w92'+c.p,t:c.t,s:TY[c.ty]+' · '+(c.y||''),run:()=>detail(c.i)});
  const build=()=>{const v=inp.value.trim().toLowerCase(),nav=CMD.filter(c=>!v||c[1].toLowerCase().includes(v)).map(c=>({ic:c[0],t:c[1],s:'Go to',run:c[3]||(()=>{location.hash=c[2]})}));
    items=[...nav.slice(0,v?3:10),...(v?C.filter(c=>c.t.toLowerCase().includes(v)).slice(0,6).map(tItem):[])];ix=0;paint();
    if(v.length>1){clearTimeout(tm);tm=setTimeout(async()=>{try{const j=await T('/search/multi','&include_adult=false&query='+encodeURIComponent(v));if(inp.value.trim().toLowerCase()!==v)return;
      const seen=new Set(items.map(i=>i.t)),extra=(j.results||[]).map(x=>ing(x)).filter(c=>c&&!seen.has(c.t)).slice(0,5).map(tItem);saveCat();items=[...items,...extra];paint()}catch(e){}},250)}};
  inp.oninput=build;inp.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(items.length){ix=(ix+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;paint();const el=list.querySelector('.on');el&&el.scrollIntoView({block:'nearest'})}}else if(e.key==='Enter'&&items[ix])go(items[ix])};
  list.onclick=e=>{const r=e.target.closest('.cmr');if(r)go(items[+r.dataset.n])};build();setTimeout(()=>inp.focus(),60)}
// tonight's pick wizard
const VIBE=[['Cozy and warm','coffee','35,10751','35,10751'],['Edge of my seat','activity','53,28','10759,9648'],['Mind-bending','infinity','878,9648','10765,9648'],['Make me cry','droplet','18,10749','18'],['Dark and gritty','moon','80,27','80,18']];
let PK={};const X='<button class="x" data-x aria-label="Close">'+I('x')+'</button>';
function openPick(){const b=ovlBox('pk');PK={};b.classList.add('o');pkStep(b,0)}
function pkStep(b,n){
  b.innerHTML='<div class="pk">'+X+(n?'<h2>What are you in the mood to watch?</h2><div class="opts">'+['Movie','Series','Anime'].map(f=>'<button data-f="'+f+'">'+f+'</button>').join(''):'<h2>What’s the vibe tonight?</h2><div class="opts">'+VIBE.map((v,i)=>'<button data-v="'+i+'">'+I(v[1])+' '+v[0]+'</button>').join(''))+'</div></div>';
  b.onclick=e=>{if(e.target.closest('[data-x]'))return closeOvl(b);const v=e.target.closest('[data-v]'),f=e.target.closest('[data-f]');if(v){PK.v=+v.dataset.v;pkStep(b,1)}else if(f){PK.f=f.dataset.f;pkGo(b)}else if(e.target.closest('[data-again]'))pkGo(b)}}
async function pkGo(b){b.innerHTML='<div class="pk"><div class="sk" style="margin:30px 0;height:160px"></div></div>';
  try{const vb=VIBE[PK.v],an=PK.f==='Anime',mt=PK.f==='Movie'?'movie':'tv',key=PK.v+PK.f;
    if(PK.key!==key){let qs='&include_adult=false&sort_by=popularity.desc&vote_count.gte='+(an?100:400)+'&page='+(1+Math.random()*3|0);qs+=an?'&with_original_language=ja&with_genres=16':'&with_genres='+(mt==='movie'?vb[2]:vb[3]);
      const j=await T('/discover/'+mt,qs);PK.pool=(j.results||[]).map(x=>ing(x,mt)).filter(Boolean);PK.key=key;PK.seen=new Set();saveCat()}
    let o=PK.pool.filter(c=>!PK.seen.has(c.i));if(!o.length){PK.seen=new Set();o=PK.pool}if(!o.length)throw 0;const c=o[Math.random()*o.length|0];PK.seen.add(c.i);
    b.innerHTML='<div class="pk">'+X+'<div class="pkr"><div class="pst2" style="background-image:url(\'https://image.tmdb.org/t/p/w342'+c.p+'\')"></div><div><small class="mu">Tonight, watch</small><h2>'+esc(c.t)+'</h2><div class="ch"><span>'+I('star','fill')+' '+(+c.r).toFixed(1)+'</span><span>'+(c.y||'')+'</span><span>'+c.g.slice(0,2).join(' · ')+'</span></div><p>'+esc((c.d||'').slice(0,220))+((c.d||'').length>220?'…':'')+'</p><div class="opts"><button class="btn p" data-det="1">Details</button><button class="btn" data-again="1">Another one</button></div></div></div></div>';
    b.querySelector('[data-det]').onclick=()=>{closeOvl(b);setTimeout(()=>detail(c.i),230)}}
  catch(e){b.innerHTML='<div class="pk">'+X+'<h2>Couldn’t find a pick</h2><p class="mu">Check your connection and try again.</p><button class="btn p" data-again="1">Retry</button></div>'}}
const tb=Object.assign(A.createElement('button'),{className:'pf rnd',title:'Tonight’s pick',innerHTML:I('target')});tb.setAttribute('aria-label','Tonight’s pick');tb.onclick=openPick;$('#pf').before(tb);
// The embedded players handle their own playback keyboard shortcuts.
addEventListener('keydown',e=>{
  if(!P&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmd()}});
post();
})();
