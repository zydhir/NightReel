// Nightreel · Demo player and video adapter (add licensed sources here)
// ---- player: demo timeline, plus a <video> adapter for files you own or are licensed to stream ----
// Add sources you have rights to:  window.NIGHTREEL_SOURCES = { 'movie603':'https://…/film.mp4', 'tv1399:1:1':'https://…/s1e1.m3u8' }
// (movies use movie<tmdbId>, episodes use tv<tmdbId>:<season>:<episode>)
let P=null,praf=0,plt=0,psv=0,phd=0;
const epInSeason=(c,ep)=>ep-((c.seasons||[]).filter(s=>s.n<so(c,ep)).reduce((a,s)=>a+s.ec,0));
const srcFor=(c,ep)=>{const S=window.NIGHTREEL_SOURCES||{};return S[c.mt+c.tid+(c.mt==='tv'?':'+so(c,ep)+':'+epInSeason(c,ep):'')]||''};
const fmt2=s=>{s=Math.max(0,s|0);const h=s/3600|0,m=(s%3600)/60|0;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s%60).padStart(2,'0')};
function play(id,ep){
  if(!needAuth(()=>play(id,ep)))return;const c=C[id];if(!c)return;const pr=me().prog[id];
  if(ep==null)ep=pr&&!done(pr,c)?pr.ep:1;ep=Math.max(1,Math.floor(+ep||1));
  const url=srcFor(c,ep),t=pr&&pr.ep===ep&&!done(pr,c)?pr.t:0,v=$('#vid');
  P={c,ep,t,on:true,url};$('#md').classList.remove('o');$('#pl').classList.add('o');document.body.style.overflow='hidden';
  $('#pti').textContent=c.t;$('#pep').textContent=c.ep>1?se(c,ep):TY[c.ty];$('#nx').style.display=c.ep>1&&ep<c.ep?'':'none';
  $('#scn').style.backgroundImage=art(id,1);$('#scn').hidden=!!url;v.hidden=!url;
  $('#pn2').textContent=url?'':'Demo playback. Connect your own licensed video source to stream real files.';
  if(url){v.src=url;v.onloadedmetadata=()=>{if(t)v.currentTime=t};v.onended=()=>{if(P&&P.ep<P.c.ep&&ON(me().st,'auto'))pnext()};v.play().catch(()=>{})}
  plt=performance.now();psv=0;pwake();cancelAnimationFrame(praf);praf=requestAnimationFrame(ptick)}
function ptick(now){if(!P)return;const dt=Math.min(.1,(now-plt)/1000);plt=now;const c=P.c,v=$('#vid'),d=(P.url&&v.duration)||c.m*60;
  if(P.url){P.t=v.currentTime||P.t;P.on=!v.paused&&!v.ended}
  else if(P.on){P.t+=dt*(P.rate||1);if(P.t>=d){if(P.ep<c.ep&&ON(me().st,'auto')){pnext();return}P.t=d;P.on=false}}
  $('#rg').max=d;$('#rg').value=P.t;$('#tm').textContent=fmt2(P.t)+' / '+fmt2(d);{const pb=$('#ppb'),ps=P.on?'pause':'play';if(pb.dataset.s!==ps){pb.dataset.s=ps;pb.innerHTML=I(ps)}}
  if(P.on){psv+=dt;if(psv>2){psv=0;const u=me(),k=new Date().toISOString().slice(0,10);u.days=u.days||{};u.days[k]=(u.days[k]||0)+2;keep()}}
  praf=requestAnimationFrame(ptick)}
function keep(){if(!P)return;const u=me();u.prog[P.c.i]={ep:P.ep,t:P.t,u:Date.now()};save()}
function markWatched(){if(!P)return;const u=me();u.prog[P.c.i]={ep:P.ep,t:P.c.m*60,u:Date.now()};save()}
function pnext(){if(!P||P.ep>=P.c.ep)return;const c=P.c,e=P.ep+1;markWatched();play(c.i,e)}
function ptoggle(){if(!P)return;const v=$('#vid');if(P.url)v.paused?v.play():v.pause();else P.on=!P.on;pwake()}
function pseek(s){if(!P)return;const v=$('#vid');if(P.url)v.currentTime=Math.max(0,v.currentTime+s);else P.t=Math.max(0,Math.min(P.c.m*60,P.t+s));pwake()}
function pwake(){const el=$('#pl');el.classList.remove('hid');clearTimeout(phd);phd=setTimeout(()=>P&&P.on&&me()&&ON(me().st,'ctl')&&el.classList.add('hid'),3000)}
function stop(){if(!P)return;keep();P=null;cancelAnimationFrame(praf);const v=$('#vid');v.pause();v.removeAttribute('src');v.load();$('#pl').classList.remove('o');document.body.style.overflow='';if(document.fullscreenElement)document.exitFullscreen();render()}
$('#pcl').onclick=stop;$('#ppb').onclick=ptoggle;$('#b10').onclick=()=>pseek(-10);$('#f10').onclick=()=>pseek(10);$('#nx').onclick=pnext;
$('#rg').oninput=e=>{if(!P)return;const v=$('#vid');if(P.url)v.currentTime=+e.target.value;else P.t=+e.target.value;pwake()};
$('#fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('#pl').requestFullscreen&&$('#pl').requestFullscreen();
$('#pl').addEventListener('mousemove',pwake);$('#pl').addEventListener('touchstart',pwake,{passive:true});$('#scn').onclick=ptoggle;
