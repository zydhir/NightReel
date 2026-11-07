// Nightreel · Click and keyboard handlers, data loading, start-up
// ---- events ----
function closeOvl(el){if(!el||!el.classList.contains('o')||el.classList.contains('bye'))return;el.classList.add('bye');setTimeout(()=>{el.classList.remove('o','bye');if(el.id==='md'&&(location.hash.startsWith('#t-')||location.hash.startsWith('#title-')))location.hash='home'},215)}
const CF=(msg,fn)=>{const u=me();if(!u||u.st&&u.st.cf===0)return fn();if(confirm(msg))fn()};
document.addEventListener('click',e=>{
  if(!e.target.closest('#menu,#pf'))$('#menu').classList.remove('o');if(!e.target.closest('.sb'))$('#rsd').classList.remove('o');
  if(!e.target.closest('.gow'))document.querySelectorAll('.mm').forEach(m=>m.hidden=true);
  if(e.target.classList.contains('ovl'))closeOvl(e.target);
  const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,id=+t.dataset.id;
  if(a==='retry-home'){LD=0;render();loadAll().then(()=>render())}
  else if(a==='retry-soon'){const grid=$('#sg');if(grid)grid.innerHTML=skel(12);loadSoon(true)}
  else if(a==='retry-title')openShared(location.hash.slice(1));
  else if(a==='open'){if(q)addRs(q);detail(id)}
  else if(a==='play')play(id,t.dataset.ep?+t.dataset.ep:null);
  else if(a==='list'){if(!needAuth(()=>detail(id)))return;const u=me(),k=u.list.indexOf(id);k<0?u.list.push(id):u.list.splice(k,1);if(k<0){u.ws=u.ws||{};u.ws[id]='want'}else if(u.ws)delete u.ws[id];save();toast(k<0?'Added to My List':'Removed from My List',k<0?'ok':'');
    if(t.dataset.h)document.querySelectorAll('[data-h][data-id="'+id+'"]').forEach(b=>b.innerHTML=k<0?I('check')+' In List':I('plus')+' My List');else{detail(id,1);rr()}}
  else if(a==='retry-providers'){delete PROVIDER_CACHE[C[id].mt+C[id].tid];const box=$('#availability');if(box)box.innerHTML=providerMarkup(id);loadProviders(id)}
  else if(a==='list-filter'){if(['all',...WATCH_STATES.map(x=>x[0])].includes(t.dataset.v)){LISTFILTER=t.dataset.v;render()}}
  else if(a==='list-search-clear'){LISTQ='';render();$('#list-search')?.focus()}
  else if(a==='list-surprise'){const {items}=listItems(me());if(items.length)detail(items[Math.random()*items.length|0].i);else toast('No titles match your current filters','err')}
  else if(a==='export-list')exportListCsv()
  else if(a==='watch-state'){if(!needAuth(()=>detail(id)))return;const value=t.dataset.v,u=me();if(!C[id]||!WATCH_STATES.some(x=>x[0]===value))return;if(!u.list.includes(id))u.list.push(id);u.ws=u.ws||{};u.ws[id]=value;save();detail(id,1);rr();toast('Moved to '+WATCH_STATES.find(x=>x[0]===value)[1],'ok')}
  else if(a==='rate'){if(!needAuth(()=>detail(id)))return;const rt=me().rt,v=+t.dataset.v;rt[id]===v?delete rt[id]:rt[id]=v;save();toast(rt[id]===1?'Liked. Expect more like this.':rt[id]===-1?'Noted. Fewer like this.':'Rating removed',rt[id]?'ok':'');detail(id,1);rr()}
  else if(a==='trl'){const b=$('#md .bn');b.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${t.dataset.v}?autoplay=1&rel=0" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><a class="btn tfb" href="https://www.youtube.com/watch?v=${t.dataset.v}" target="_blank" rel="noopener">Open on YouTube</a>`;$('#md').scrollTo({top:0,behavior:'smooth'})}
  else if(a==='cl')closeOvl(t.closest('.ovl'));
  else if(a==='sc'){const s=t.parentElement.querySelector('.sc');s.scrollBy({left:+t.dataset.d*s.clientWidth*.8,behavior:'smooth'})}
  else if(a==='reset-filters'){GS=[];SO='pop';DY=null;RG=0;render();toast('Filters reset')}
  else if(a==='chip'){const g=t.dataset.g,k=GS.indexOf(g);k<0?GS.push(g):GS.splice(k,1);render()}
  else if(a==='slide')slide(+t.dataset.n);
  else if(a==='authm')goAuth(t.dataset.m);
  else if(a==='pwv'){const i=t.parentElement.querySelector('input');if(i){i.type=i.type==='password'?'text':'password';t.innerHTML=I(i.type==='password'?'eye':'eyeOff')}}
  else if(a==='conf'){AUTHMODE='in';render()}
  else if(a==='more'){const m=t.parentElement.querySelector('.mm');const open=m&&!m.hidden;document.querySelectorAll('.mm').forEach(x=>x.hidden=true);if(m&&!open){m.hidden=false;t.setAttribute('aria-expanded','true')}else t.setAttribute('aria-expanded','false')}
  else if(a==='oi')oauth(t.dataset.v);
  else if(a==='rsnd')resend();
  else if(a==='auth'){$('#menu').classList.remove('o');goAuth(t.dataset.m==='up'?'up':'in')}
  else if(a==='out'){$('#menu').classList.remove('o');if(AUTH&&SB){clearTimeout(SYNCT);syncNow().then(ok=>{if(!ok&&!confirm('Cloud sync failed. Sign out anyway? Your data will remain on this browser.'))return;SB.auth.signOut().then(({error})=>{if(error)toast(AMAP(error),'err')}).catch(()=>toast('Could not sign out','err'))})}else{AUTH=null;loadA();acct();render();toast('Signed out')}}
  else if(a==='av'){me().av=t.dataset.v;me().pic='';save();acct();t.closest('#au')?onboard():render()}
  else if(a==='acc'){me().ac=+t.dataset.n;save();acct();render()}
  else if(a==='gn'){const g=me().gn,k=g.indexOf(t.dataset.g);k<0?g.push(t.dataset.g):g.splice(k,1);save();t.closest('#au')?onboard():render()}
  else if(a==='tg'){const st=me().st,k=t.dataset.k;st[k]=ON(st,k)?0:1;if(k==='ds')Object.keys(AC).forEach(key=>delete AC[key]);save();acct();render()}
  else if(a==='sv'){const n=$('#nm').value.trim();if(n){me().name=n;save();acct();render();toast('Saved','ok')}}
  else if(a==='pw'){if(!AUTH||!SB)return toast('Sign in with an email account to change your password','err');const el=$('#np'),n=el?el.value:'';if(n.length<6)return toast('New password needs 6+ characters','err');SB.auth.updateUser({password:n}).then(({error})=>{if(error)toast(AMAP(error.message),'err');else{el.value='';toast('Password updated','ok')}},()=>toast('Could not reach the sign-in service','err'))}
  else if(a==='clc')CF('Clear your continue-watching progress?',()=>{me().prog={};save();render();toast('Continue watching cleared')});
  else if(a==='cll')CF('Clear every title from My List?',()=>{me().list=[];me().ws={};save();render();toast('My List cleared')});
  else if(a==='del')CF('Reset all watch data, lists, notes and settings for this account on this device?',()=>{A={name:A.name,email:A.email,at:A.at,pf:[{name:'Me',list:[],prog:{},av:'🦊',pic:'',ac:0,gn:[],st:{auto:1,anim:1},at:Date.now(),rt:{}}],cur:0};save();acct();render();toast('Everything reset','ok')});
  else if(a==='done'){$('#au').classList.remove('o');toast('You’re all set');render();if(pending){const p=pending;pending=null;p()}}
  else if(a==='mood'){q='';$('#q').value='';keepGS=1;GS=[t.dataset.g];SO='pop';if(location.hash==='#movies'){keepGS=0;render()}else location.hash='movies'}
  else if(a==='swp'){A.cur=+t.dataset.n;save();$('#menu').classList.remove('o');acct();render();toast('Switched to '+me().name,'ok')}
  else if(a==='addp'){const n=(prompt('Profile name')||'').trim().slice(0,24);$('#menu').classList.remove('o');if(n){A.pf.push({name:n,list:[],prog:{},av:AV[A.pf.length%AV.length],pic:'',ac:0,gn:[],st:{auto:1,anim:1},at:Date.now(),rt:{}});A.cur=A.pf.length-1;save();acct();render();onboard()}}
  else if(a==='delp')CF('Delete this profile with its list and history?',()=>{A.pf.splice(A.cur,1);A.cur=0;save();acct();render();toast('Profile deleted')});
  else if(a==='avup'){AVT=t.dataset.t||'me';$('#avf').click()}
  else if(a==='rmpic'){me().pic='';save();acct();render();toast('Photo removed')}
  else if(a==='seg'){const st=me().st;st.sub=t.dataset.v?1:0;save();render()}
  else if(a==='clc1'){const uu=me();if(uu){delete uu.prog[id];save();detail(id,1);toast('Progress reset — starting fresh')}}
  else if(a==='exp'){const b=new Blob([JSON.stringify({v:2,...packState(A)},null,1)],{type:'application/json'}),l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='nightreel-data.json';l.click();setTimeout(()=>URL.revokeObjectURL(l.href),2000);toast('Data exported','ok')}
  else if(a==='imp')$('#imf').click()
  else if(a==='per'){if(!t.dataset.id||t.dataset.id==='undefined')return;$('#md').classList.remove('o');location.hash='p-'+t.dataset.id}
  else if(a==='rsq'){q=t.dataset.v;$('#q').value=q;$('#rsd').classList.remove('o');render()}
  else if(a==='clear-searches'){store.set('nr_rs',[]);$('#rsd').classList.remove('o');toast('Recent searches cleared','ok')}
  else if(a==='rem'){if(!needAuth(()=>detail(id)))return;const u=me();u.rm=u.rm||{};u.rm[id]?delete u.rm[id]:u.rm[id]=1;save();toast(u.rm[id]?'We’ll remind you on release day':'Reminder removed',u.rm[id]?'ok':'');detail(id,1)}
  else if(a==='rnd'){const u=me(),pk=u?pick(u):[],pool=(pk.length>3?pk:C).filter(c=>c.p);$('#drw').classList.remove('o');$('#hb').setAttribute('aria-expanded','false');if(pool.length)detail(pool[Math.random()*pool.length|0].i);else toast('No titles are ready yet','err')}
  else if(a==='mtab'){MT=t.dataset.v;detail(curD,1)}
  else if(a==='rate10'){if(!needAuth(()=>detail(id)))return;const u=me();u.r10=u.r10||{};const v=+t.dataset.v;u.r10[id]===v?delete u.r10[id]:u.r10[id]=v;save();toast(u.r10[id]?'Rated '+u.r10[id]+'/10':'Rating cleared',u.r10[id]?'ok':'');detail(id,1)}
  else if(a==='shr'){const c=C[id],url=location.href.split('#')[0]+'#title-'+c.mt+'-'+c.tid;
    if(navigator.share)navigator.share({title:'Nightreel · '+c.t,text:c.t+(c.y?' ('+c.y+')':''),url}).catch(()=>{});
    else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(()=>toast('Link copied','ok'),()=>toast(url));
    else toast(url)}
  else if(a==='dy'){const v=+t.dataset.v;DY=DY===v?null:v;render()}
  else if(a==='mr'){const v=+t.dataset.v;RG=RG===v?0:v;render()}
});
$('#pf').onclick=()=>$('#menu').classList.toggle('o');
let sT;$('#q').oninput=e=>{$('#rsd').classList.remove('o');q=e.target.value.trim();clearTimeout(sT);if(!q)render();else sT=setTimeout(()=>{if(q.length>1)render()},300)};
$('#q').onkeydown=e=>{if(e.key==='Enter'&&q)addRs(q)};
document.addEventListener('input',e=>{if(e.target.id==='list-search'){LISTQ=e.target.value;const {all,items}=listItems(me());$('#list-results').innerHTML=listResults(me(),all,items);const pick=$('[data-a="list-surprise"]');if(pick)pick.disabled=!items.length}
  else if(e.target.id==='pnt'&&curD>-1){clearTimeout(ntT);const id=curD,u=me(),value=e.target.value.slice(0,2000);ntT=setTimeout(()=>{if(!u||!A||!A.pf.includes(u))return;u.nt=u.nt||{};u.nt[id]=value;save()},500)}});
$('#q').onfocus=()=>{if(!$('#q').value&&rs().length){$('#rsd').innerHTML=`<div class="rsd-head"><span>Recent searches</span><button class="rs-clear" data-a="clear-searches">Clear</button></div>`+rs().map(x=>`<button data-a="rsq" data-v="${esc(x)}">${I('clock')} ${esc(x)}</button>`).join('');$('#rsd').classList.add('o')}};
const rr=()=>{const r=location.hash.slice(1);if(!q&&(r===''||r==='home'||r==='list'))render()};
addEventListener('hashchange',()=>{$('#drw').classList.remove('o');$('#hb').setAttribute('aria-expanded','false');if(keepGS)keepGS=0;else{GS=[];SO='pop';DY=null;RG=0}G='All';q='';LISTQ='';$('#q').value='';scrollTo(0,0);render()});
addEventListener('scroll',()=>$('#nav').classList.toggle('s',scrollY>40),{passive:true});
const FOC='button,a[href],input,select,[tabindex]:not([tabindex="-1"])';
addEventListener('keydown',e=>{
  if(e.key==='Tab'){const d=[...document.querySelectorAll('.ovl.o,#pl.o')].pop();if(d){const f=[...d.querySelectorAll(FOC)].filter(x=>!x.disabled&&x.offsetParent!==null),i=f.indexOf(document.activeElement);if(f.length&&(i<0||(e.shiftKey&&i===0)||(!e.shiftKey&&i===f.length-1))){e.preventDefault();f[e.shiftKey?f.length-1:0].focus()}}}
  const ty=/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName);
  if(!ty&&!P&&e.key==='/'){e.preventDefault();$('#q').focus()}else if(!ty&&!P&&e.key==='?')help();
  if(P){if(e.key==='Escape')stop();return}
  if(e.key==='Escape'){const o=[...document.querySelectorAll('.ovl.o')].pop();if(o){closeOvl(o)}else $('#drw').classList.remove('o');$('#menu').classList.remove('o')}
});
addEventListener('pagehide',keep);
document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.card');if(!c)return;const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;c.style.setProperty('--mx',x+'px');c.style.setProperty('--my',y+'px');c.style.setProperty('--rx',((.5-y/r.height)*12).toFixed(1)+'deg');c.style.setProperty('--ry',((x/r.width-.5)*12).toFixed(1)+'deg')},{passive:true});
async function hyd(id){const c=C[id];if(c.v3)return;c.dv=1;
  try{const d=await T('/'+c.mt+'/'+c.tid,'&append_to_response=credits,videos,similar,recommendations,release_dates,content_ratings,images&include_image_language=en,null');
    if(c.mt==='tv'){c.ep=Math.max(1,d.number_of_episodes||1);c.m=(d.episode_run_time&&d.episode_run_time[0])||c.m}else c.m=d.runtime||c.m;
    if(d.genres&&d.genres.length)c.g=[...new Set(d.genres.map(x=>GN[x.id]||x.name))];
    c.tl=d.tagline||'';c.seasons=(d.seasons||[]).filter(x=>x.season_number>0&&x.episode_count).map(x=>({n:x.season_number,ec:x.episode_count}));c.cast=((d.credits||{}).cast||[]).filter(x=>x.profile_path).slice(0,14).map(x=>({n:x.name,c:x.character,p:x.profile_path,i:x.id}));c.crew=((d.credits||{}).crew||[]).filter(x=>/^(Director|Writer|Screenplay)$/.test(x.job)).filter((x,n,a)=>a.findIndex(y=>y.id===x.id&&y.job===x.job)===n).slice(0,4).map(x=>({n:x.name,j:x.job,i:x.id}));if(c.mt==='tv')(d.created_by||[]).forEach(x=>c.crew.unshift({n:x.name,j:'Creator',i:x.id}));
    const v=((d.videos||{}).results||[]).filter(x=>x.site==='YouTube'),tr=v.find(x=>x.type==='Trailer')||v[0];c.vid=tr?tr.key:'';c.clips=v.filter(x=>x!==tr).slice(0,8).map(x=>({k:x.key,n:x.name}));
    let ct='';if(c.mt==='movie'){const us=((d.release_dates||{}).results||[]).find(x=>x.iso_3166_1==='US');ct=us?((us.release_dates.find(x=>x.certification)||{}).certification||''):''}else{const us=((d.content_ratings||{}).results||[]).find(x=>x.iso_3166_1==='US');ct=us?us.rating:''}
    c.ct=ct;c.st=d.status||'';c.net=(d.networks||d.production_companies||[]).slice(0,3).map(x=>x.name);c.bgs=((d.images||{}).backdrops||[]).map(x=>x.file_path).slice(0,10);
    c.sim=[...((d.recommendations||{}).results||[]),...((d.similar||{}).results||[])].map(x=>ing(x,c.mt)).filter(Boolean).map(x=>x.i).filter((v,n,a)=>a.indexOf(v)===n).slice(0,14);
    c.det=1;c.v3=1;saveCat()}catch(e){c.dv=0;toast('Failed to load details','err')}
  if($('#md').classList.contains('o')&&curD===id)detail(id,1)}
async function loadAll(){const ld=(p,x,mt)=>T(p,x).then(r=>(r.results||[]).map(i=>ing(i,mt)).filter(Boolean)).catch(()=>[]);
  [L.trend,L.pm,L.tm,L.ps,L.an,L.new]=await Promise.all([ld('/trending/all/week','',''),ld('/movie/popular','','movie'),ld('/movie/top_rated','','movie'),ld('/tv/popular','','tv'),ld('/discover/tv','&with_genres=16&with_original_language=ja&sort_by=popularity.desc','tv'),ld('/movie/now_playing','','movie')]);
  FEAT=L.trend.filter(c=>c.b).slice(0,5);LD=1;saveCat();if(!L.trend.length)toast('Failed to load from TMDB. Check your internet.','err')}
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='provider-region'){if(!REGIONS.some(x=>x[0]===t.value))return;me().st.region=t.value;save();$('#availability').innerHTML=providerMarkup(curD)}
  else if(t.id==='so'){SO=t.value;render()}
  else if(t.id==='ssn'){curS=+t.value;loadSeason(curD)}
  else if(t.id==='ls'){LS=t.value;render()}
  else if(t.dataset&&t.dataset.set){const st=me().st;if(t.dataset.set==='psz')st.psz=+t.value;else st.home=t.value;save();acct();toast('Saved','ok')}
  else if(t.id==='avf'&&t.files[0]){const file=t.files[0];t.value='';upPic(file,d=>{if(AVT==='acct'){if(AUTH&&SB)SB.auth.updateUser({data:{avatar:d}}).catch(()=>{});A.av=d}else{const m=me();if(m)m.pic=d}save();acct();if(location.hash.slice(1)==='profile')render();toast('Photo saved','ok')})}
  else if(t.id==='imf'&&t.files[0]){const fr=new FileReader();fr.onload=()=>{try{let j=JSON.parse(fr.result);if(!Array.isArray(j.pf)||!j.pf.length)throw 0;const apply=()=>{const portable=!!j.catalogRefs;j=unpackState(j);j.pf.forEach(p=>{p.list=p.list||[];p.prog=p.prog||{};p.gn=p.gn||[];p.rt=p.rt||{};p.st=Object.assign({auto:1,anim:1},p.st);p.pic=p.pic||'';p.av=p.av||'🦊';p.ac=p.ac||0;p.name=p.name||'Me';p.at=p.at||Date.now()});A.pf=j.pf;A.cur=Math.max(0,Math.min(Math.floor(Number(j.cur)||0),j.pf.length-1));save();acct();render();toast(portable?'Data imported':'Legacy import: titles require the original browser catalog',portable?'ok':'err')};CF('Replace your current profiles and lists with this import?',apply)}catch(x){toast('That file is not valid Nightreel data','err')}};fr.readAsText(t.files[0]);t.value=''}});
$('#hb').onclick=()=>{$('#drw').classList.add('o');$('#hb').setAttribute('aria-expanded','true')};
$('#drw').onclick=e=>{if(e.target.id==='drw'||e.target.closest('a')){$('#drw').classList.remove('o');$('#hb').setAttribute('aria-expanded','false')}};
['#md','#au','#pl'].forEach(sel=>{const el=$(sel);el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');let was=false,last;
  new MutationObserver(()=>{const on=el.classList.contains('o');
    if(on&&!was){last=document.activeElement;setTimeout(()=>{const f=el.querySelector(FOC);f&&f.focus()},60)}
    else if(!on&&was){if(sel==='#md')el.innerHTML='';if(last&&last.focus&&document.contains(last))last.focus()}
    was=on}).observe(el,{attributes:true,attributeFilter:['class']})});
loadA();acct();
if(!location.hash.slice(1)){const s0=me()&&me().st&&me().st.home;if(s0&&KN.includes(s0))location.hash=s0}
render();
authCfg().catch(()=>{});
loadAll().then(()=>{render();chkRem()});
if(SB)SB.auth.onAuthStateChange((ev,s)=>{const us=s&&s.user;
  if((ev==='INITIAL_SESSION'||ev==='SIGNED_IN')&&us){if(!AUTH||AUTH.id!==us.id)afterSignIn(us,ev==='SIGNED_IN')}
  else if(ev==='SIGNED_OUT'){AUTH=null;loadA();acct();render();toast('Signed out');if(location.hash.slice(1)==='auth'){AUTHMODE='in';render()}}
  else if(ev==='PASSWORD_RECOVERY'&&us){AUTH=us;loadA();acct();goAuth('rec')}
  else if(ev==='USER_UPDATED'&&us){AUTH=us;acct()}});
