// Nightreel · Third-party embedded players (TMDB IDs for movies and TV)
let P=null;
const PLAYER_ORIGINS={src:'https://cinesrc.st',xtream:'https://cinextream.cc',vidy:'https://www.vidy.st'};
const epInSeason=(c,ep)=>ep-((c.seasons||[]).filter(s=>s.n<so(c,ep)).reduce((a,s)=>a+s.ec,0));
function playerChoice(){try{const saved=localStorage.getItem('nr_player');return Object.prototype.hasOwnProperty.call(PLAYER_ORIGINS,saved)?saved:'src'}catch(e){return 'src'}}
function playerColor(){const color=getComputedStyle(document.documentElement).getPropertyValue('--a').trim();return /^#[\da-f]{6}$/i.test(color)?color:'#8B7BFF'}
function playerUrl(c,ep,provider,time){
  const season=so(c,ep),episode=epInSeason(c,ep),id=encodeURIComponent(c.tid),origin=PLAYER_ORIGINS[provider];
  const tvPath=c.mt==='tv'?'/'+season+'/'+episode:'';
  const path=provider==='src'?'/embed/'+c.mt+'/'+id:provider==='vidy'?'/'+c.mt+'/'+id+tvPath:'/api/embed/'+c.mt+'/'+id+tvPath;
  const url=new URL(path,origin),color=playerColor();
  if(provider==='src'){
    if(c.mt==='tv'){url.searchParams.set('s',season);url.searchParams.set('e',episode)}
    url.searchParams.set('color',color);url.searchParams.set('autonext','false');
    if(time>0)url.searchParams.set('t',Math.floor(time));
  }else if(provider==='vidy'){
    url.searchParams.set('color',color.slice(1));
    if(time>0)url.searchParams.set('progress',Math.floor(time));
    // Vidy does not document episode-change events, so keep episode navigation in Nightreel.
  }else{
    url.searchParams.set('color',color.slice(1));url.searchParams.set('title',c.t);
  }
  return url.href;
}
function playerNotice(message){const n=$('#player-notice');n.textContent=message||'';n.hidden=!message}
function loadPlayer(provider){
  if(!P||!PLAYER_ORIGINS[provider])return;
  P.provider=provider;P.lastTime=null;P.lastSaved=0;
  document.querySelectorAll('[data-player]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.player===provider)));
  playerNotice(provider==='xtream'&&P.t>0?'Xtream may start from the beginning; resume support depends on the provider.':'');
  $('#player-frame').src=playerUrl(P.c,P.ep,provider,P.t);
}
async function play(id,ep){
  if(!needAuth(()=>play(id,ep)))return;
  const c=C[id];if(!c||!c.tid||!['movie','tv'].includes(c.mt))return;
  if(c.mt==='tv'&&!c.v3&&!c.seasons?.length)await hyd(id);
  if(!me())return;
  const pr=me().prog[id];if(ep==null)ep=pr&&!done(pr,c)?pr.ep:1;
  ep=Math.max(1,Math.floor(+ep||1));
  if(c.mt==='tv'&&ep>1&&!c.seasons?.length){toast('Could not load season information. Please try again.','err');return}
  const t=pr&&pr.ep===ep&&!done(pr,c)?pr.t:0;
  if(P)keep();
  P={c,ep,t,provider:playerChoice(),hasProgress:false,lastTime:null,lastSaved:0};
  $('#md').classList.remove('o');$('#pl').classList.add('o');document.body.style.overflow='hidden';
  $('#pti').textContent=c.t;$('#pep').textContent=c.mt==='tv'?se(c,ep):TY[c.ty];
  loadPlayer(P.provider);$('#pcl').focus();
}
function keep(){if(!P||!P.hasProgress||!me())return;me().prog[P.c.i]={ep:P.ep,t:P.t,u:Date.now()};save()}
function markWatched(){if(!P||!me())return;me().prog[P.c.i]={ep:P.ep,t:Math.max(P.t,P.c.m*60),u:Date.now()};save()}
function pnext(){if(!P||P.c.mt!=='tv'||P.ep>=P.c.ep)return;const c=P.c,e=P.ep+1;markWatched();P.hasProgress=false;play(c.i,e)}
function stop(){if(!P)return;keep();P=null;$('#player-frame').removeAttribute('src');$('#pl').classList.remove('o');playerNotice('');document.body.style.overflow='';if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});render()}
$('#pcl').onclick=stop;
document.querySelectorAll('[data-player]').forEach(b=>b.addEventListener('click',()=>{if(!P||P.provider===b.dataset.player)return;keep();try{localStorage.setItem('nr_player',b.dataset.player)}catch(e){}loadPlayer(b.dataset.player)}));
function updatePlayerTime(time,duration){
  time=Number(time);duration=Number(duration);if(!Number.isFinite(time)||time<0)return;
  if(Number.isFinite(duration)&&duration>0)time=Math.min(time,duration);
  // Count only short, forward playback intervals, never seeks or long gaps.
  if(P.lastTime!==null){const delta=time-P.lastTime;if(delta>0&&delta<=5&&me()){const u=me(),day=new Date().toISOString().slice(0,10);u.days=u.days||{};u.days[day]=(u.days[day]||0)+delta}}
  P.lastTime=time;P.t=time;P.hasProgress=true;
  if(Date.now()-P.lastSaved>5000){keep();P.lastSaved=Date.now()}
}
function syncEpisode(season,episode){
  if(!P||P.c.mt!=='tv')return;
  season=Number(season);episode=Number(episode);
  const seasons=P.c.seasons||[],s=seasons.find(x=>x.n===season);
  if(!s||!Number.isInteger(episode)||episode<1||episode>s.ec)return;
  const ep=seasons.filter(x=>x.n<season).reduce((n,x)=>n+x.ec,0)+episode;
  if(ep===P.ep)return;keep();P.ep=ep;P.t=0;P.lastTime=null;P.hasProgress=false;$('#pep').textContent=se(P.c,ep);
}
window.addEventListener('message',event=>{
  if(!P||event.origin!==PLAYER_ORIGINS[P.provider]||event.source!==$('#player-frame').contentWindow)return;
  let data=event.data;if(typeof data==='string'){try{data=JSON.parse(data)}catch(e){return}}
  if(!data||typeof data!=='object')return;
  if(P.provider==='src'){
    if(data.type==='cinesrc:timeupdate')updatePlayerTime(data.currentTime,data.duration);
    else if(data.type==='cinesrc:nextepisode'){const before=P.ep;syncEpisode(data.season,data.episode);if(!data.internalNavigation&&P.ep!==before)loadPlayer('src')}
    else if(data.type==='cinesrc:ended'){markWatched();if(P.c.mt==='tv'&&ON(me().st,'auto'))pnext()}
    else if(data.type==='cinesrc:error')playerNotice('CineSrc could not play this title. Try another player or check Where to watch.');
  }else if(P.provider==='xtream'){
    if(data.event==='time')updatePlayerTime(data.time,data.duration);
    else if(data.event==='VIDEO_ENDED')syncEpisode(data.season,data.episode);
    else if(data.event==='complete')markWatched();
    else if(data.event==='player_error'&&data.reason==='all_servers_failed')playerNotice('Xtream could not play this title. Try another player or check Where to watch.');
  }else if(P.provider==='vidy'){
    if(data.event==='timeupdate')updatePlayerTime(data.currentTime,data.duration);
    else if(data.event==='ended'){markWatched();if(P.c.mt==='tv'&&ON(me().st,'auto'))pnext()}
  }
});
