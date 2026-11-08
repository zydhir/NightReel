// Nightreel · Supabase sign-in, cloud sync, settings page, account menu
// ---- accounts (Supabase) ----
const SBU='https://pgvtdnpblfiaptsjtixr.supabase.co',SBK='sb_publishable_kxfnE7Hyz3Y9p-y635sC3Q_XDHGzSEQ';
let SB=null;try{SB=window.supabase?supabase.createClient(SBU,SBK):null}catch(e){SB=null}
let AUTH=null,A=null,SYNCT=null,SYNCO=false,AVT='me',RSND='',pending=null,AUTHMODE='in',LSTA='',AUTHCFG=null,RCOOL=0,rcT=null;
const STDEF={auto:1,anx:1,anim:1,cz:1,gls:1,hm:1,cf:1,wm:1,ctl:1};
const ON=(st,k)=>st[k]===undefined?STDEF[k]:!!st[k];
const UK=()=>AUTH?'nr_u:'+AUTH.id:'nr_u:local';
const OIDN=()=>AUTH?AUTH.email:'This device';
function loadA(){const k=UK();A=store.get(k,null);
  if(!A&&AUTH){const loc=store.get('nr_u:local',null);A=loc?JSON.parse(JSON.stringify(loc)):null;if(A)A.email=AUTH.email}
  if(!A){const old=store.get('nr_users',{}),em=store.get('nr_sess',null),o=old[em]||Object.values(old)[0];
    A=o?{name:o.name||'Me',email:o.email||em||'local',at:o.at||Date.now(),cur:o.cur||0,pf:(o.pf||[]).map(p=>({name:p.name||'Me',list:p.list||[],prog:p.prog||{},av:p.av||'🦊',pic:'',ac:p.ac||0,gn:p.gn||[],st:Object.assign({auto:1,anim:1},p.st),at:p.at||Date.now(),rt:p.rt||{}}))}
      :{name:(AUTH&&(AUTH.user_metadata&&(AUTH.user_metadata.full_name||AUTH.user_metadata.name)))||(AUTH?String(AUTH.email).split('@')[0]:'Me'),email:AUTH?AUTH.email:'local',at:Date.now(),cur:0,pf:[]}}
  if(!A.pf||!A.pf.length)A.pf=[{name:String(A.name||'Me').split(' ')[0].slice(0,24)||'Me',list:[],prog:{},av:'🦊',pic:'',ac:0,gn:[],st:{auto:1,anim:1},at:Date.now(),rt:{}}];
  if(A.cur==null||A.cur>=A.pf.length)A.cur=0;
  store.set(k,A)}
// A portable snapshot carries the TMDB identity behind every locally indexed title.
const indexFields=['prog','rt','r10','nt','rm','ws'];
function packState(state){
  const copy=JSON.parse(JSON.stringify(state)),refs=new Set();
  for(const p of copy.pf||[]){for(const i of [...(p.list||[]),...(p.view||[])])refs.add(String(i));for(const f of indexFields)Object.keys(p[f]||{}).forEach(i=>refs.add(i))}
  copy.catalogRefs={};for(const i of refs){const c=C[i];if(c&&c.mt&&c.tid)copy.catalogRefs[i]={...c,sim:[],v3:0,dv:0}}
  return copy;
}
function unpackState(data){
  const state=JSON.parse(JSON.stringify(data)),refs=state.catalogRefs;
  if(!refs||typeof refs!=='object')return state; // Legacy backups only work with their original catalog.
  const map={};for(const [old,entry] of Object.entries(refs)){
    if(!entry||!['movie','tv'].includes(entry.mt)||!Number.isInteger(entry.tid)||entry.tid<=0)continue;
    let c=CK[entry.mt+entry.tid];if(!c){c={...entry,i:C.length};C.push(c);CK[c.mt+c.tid]=c}map[old]=c.i;
  }
  for(const p of state.pf||[]){
    for(const f of ['list','view'])if(Array.isArray(p[f]))p[f]=p[f].filter(i=>Object.hasOwn(map,i)).map(i=>map[i]);
    for(const f of indexFields)if(p[f]&&typeof p[f]==='object'){const v={};for(const [i,x] of Object.entries(p[f]))if(Object.hasOwn(map,i))v[map[i]]=x;p[f]=v}
  }
  delete state.catalogRefs;saveCat();return state;
}
const acc=()=>A;
const me=()=>A&&A.pf&&A.pf.length?A.pf[A.cur]:null;
const save=()=>{if(!A)return;A.up=Date.now();store.set(UK(),A);queueSync()};
const done=(p,c)=>p.ep>=c.ep&&p.t>=c.m*60*.95;
function toast(m,k){const t=$('#toast');t.innerHTML=(k==='ok'?I('check'):k==='err'?I('alert'):'')+'<span>'+esc(m)+'</span>';t.className=(k||'')+' o';clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('o'),2600)}
function needAuth(then){if(me())return true;pending=then;goAuth('in');return false}
const okE=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const AMAP=er=>{const o=(typeof er==='object'&&er)||{},m=String(o.msg||o.message||er||''),c=String(o.code||'');
  const RL='Supabase\u2019s free-tier emailer is capped (~2 emails/hour) and it\u2019s exhausted right now. Wait a bit and try again \u2014 or, while testing, turn off \u201cConfirm email\u201d in Supabase \u2192 Authentication \u2192 Sign In / Up.';
  const M={'Invalid login credentials':'Email or password is wrong.','User already registered':'That email already has an account \u2014 try signing in.','Password should be at least 6 characters':'Password needs 6+ characters.','Unable to validate email address: invalid format':'That doesn\u2019t look like a real email address.','Email not confirmed':'Check your inbox and confirm your email, then sign in.','Signups not allowed on this instance':'Sign-ups are disabled on the server.','Provider is not enabled':'That provider isn\u2019t enabled in your Supabase dashboard yet (Auth \u2192 Providers).','email rate limit exceeded':RL,'over_email_send_rate_limit':RL,'over_request_rate_limit':'Too many attempts in a row \u2014 give it a minute and try again.','Email address is invalid':'That doesn\u2019t look like a real email address.','user_banned':'This account has been blocked.'};
  return M[c]||M[m]||(m&&m!=='error'?m:'Something went wrong \u2014 try again.')};
async function afterSignIn(u,nw){
  if(AUTH&&AUTH.id===u.id)return;
  AUTH=u;loadA();acct();
  const nm=String((u.user_metadata&&(u.user_metadata.full_name||u.user_metadata.name))||u.email);
  toast((nw?'Welcome, ':'Welcome back, ')+nm.split(' ')[0],'ok');
  cloudPull();
  const onAuth=location.hash.slice(1)==='auth';
  if(pending){const p=pending;pending=null;if(onAuth)location.hash='home';try{p()}catch(e){}}
  else if(onAuth)location.hash='home';else render()}
// OAuth provider callbacks are configured at Google and Discord, not as the app redirectTo.
const PROV=[['google','Google'],['discord','Discord']];
async function authCfg(refresh=false){if(AUTHCFG&&!refresh)return AUTHCFG;
  try{const response=await fetch(SBU+'/auth/v1/settings',{headers:{apikey:SBK}});if(!response.ok)throw new Error('settings');
    const j=await response.json();if(j&&j.external){AUTHCFG=j;return j}}
  catch(e){}return null;
}
function goAuth(mode){AUTHMODE=mode||'in';if(location.hash.slice(1)==='auth')render();else location.hash='auth'}
async function oauth(p){
  if(!PROV.some(x=>x[0]===p))return;
  const label=p==='google'?'Google':'Discord',status=$('#oautherr'),button=document.querySelector('[data-a="oi"][data-v="'+p+'"]');
  const fail=msg=>{if(status)status.textContent=msg;toast(msg,'err')};
  if(!SB)return fail('Sign-in service did not load. Check your connection and reload.');
  if(!/^https?:$/.test(location.protocol))return fail('Open Nightreel on an HTTP or HTTPS address for social sign-in.');
  if(button)button.disabled=true;if(status)status.textContent='Connecting to '+label+'…';
  try{
    const cfg=await authCfg(true);
    if(cfg&&cfg.external&&cfg.external[p]===false)return fail(label+' is not enabled in Supabase Authentication → Providers.');
    // Supabase redirects through its provider callback, then returns to this allowed app URL.
    const options={redirectTo:location.origin+location.pathname+location.search};
    if(p==='google')options.queryParams={prompt:'select_account'};
    const {error}=await SB.auth.signInWithOAuth({provider:p,options});
    if(error)return fail(AMAP(error));
  }catch(e){fail('Could not start '+label+' sign-in. Check your connection and provider setup.')}
  finally{if(button)button.disabled=false}
}
function coolUI(){const b=document.querySelector('[data-a="rsnd"]');if(!b)return;const s=Math.max(0,Math.ceil((RCOOL-Date.now())/1000));b.textContent=s>0?'Resend email ('+s+'s)':'Resend email';b.disabled=s>0;if(s>0&&!rcT)rcT=setInterval(()=>{if(RCOOL-Date.now()<=0){clearInterval(rcT);rcT=null}coolUI()},1000)}
async function resend(){if(!RSND||!SB)return;
  if(RCOOL>Date.now())return;
  try{const {error}=await SB.auth.resend({email:RSND,type:'signup'});if(error)return toast(AMAP(error),'err');
    RCOOL=Date.now()+60000;coolUI();toast('Confirmation email re-sent','ok')}catch(e){toast('Could not resend the email','err')}}
async function cloudPull(){if(!SB||!AUTH)return;const user=AUTH.id;
  try{const {data,error}=await SB.from('app_state').select('data,updated_at').eq('user_id',user).maybeSingle();if(!AUTH||AUTH.id!==user)return;
    if(!error&&data&&data.data&&Array.isArray(data.data.pf)&&data.data.pf.length){const ss=data.updated_at?Date.parse(data.updated_at):0,ls=A&&A.up||0;
      if(ss>=ls){A=unpackState(data.data);A.up=ss;A.email=AUTH.email;store.set(UK(),A);SYNCO=true;acct();render()}}}
  catch(e){}}
let syncChain=Promise.resolve();
function syncNow(){
  if(!SB||!AUTH||!A)return Promise.resolve(false);
  const user=AUTH.id,snapshot=packState(A),ts=new Date(snapshot.up||Date.now()).toISOString();
  syncChain=syncChain.catch(()=>{}).then(async()=>{try{const {error}=await SB.from('app_state').upsert({user_id:user,data:snapshot,updated_at:ts});if(error)throw error;
    if(AUTH&&AUTH.id===user&&A.up===snapshot.up)SYNCO=true;return true;
  }catch(e){if(AUTH&&AUTH.id===user)SYNCO=false;console.warn('Nightreel sync failed:',e);return false}});return syncChain;
}
function queueSync(){if(!SB||!AUTH)return;SYNCO=false;clearTimeout(SYNCT);SYNCT=setTimeout(syncNow,2500)}
function upPic(file,cb){
  // Only real images, at most 8 MB. The picture is then redrawn as a small 128px JPEG,
  // so nothing from the original file (scripts, metadata) is ever kept.
  if(!file||!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.type||''))return toast('Pick a PNG, JPG, WebP or GIF image','err');
  if(file.size>8*1024*1024)return toast('That image is over 8 MB. Pick a smaller one','err');
  const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{try{const s=128,cv=document.createElement('canvas');cv.width=cv.height=s;const x=cv.getContext('2d');x.fillStyle='#17141F';x.fillRect(0,0,s,s);const r=Math.max(s/im.width,s/im.height);x.drawImage(im,(s-im.width*r)/2,(s-im.height*r)/2,im.width*r,im.height*r);cb(cv.toDataURL('image/jpeg',.82))}catch(e){toast('Could not read that image','err')}};im.src=fr.result};fr.onerror=()=>toast('Could not read that image','err');fr.readAsDataURL(file)}
function authPage(){
  const arts=(L.trend||[]).filter(c=>c.b).slice(0,5);
  const left=`<div class="apl">${arts.map((c,i)=>`<div class="apbg" style="background-image:${art(c.i,1)};animation-delay:${(-i*9).toFixed(1)}s"></div>`).join('')}<div class="apc2"><a class="logo" href="#home">night<i>reel</i></a><p>Pick up any episode, on any device. Your list, ratings, notes and progress live in your account — not just this browser.</p><div class="apb"><span>${I('lock')} Syncs everywhere</span><span>${I('star')} Ratings &amp; notes</span><span>${I('clock')} Watch progress</span></div></div></div>`;
  if(AUTH)return `<div class="ap">${left}<div class="apr"><div class="apcard"><h1>You’re signed in</h1><p class="sub">${esc(AUTH.email)}</p><a class="btn p" style="justify-content:center" href="#home">Browse Nightreel</a><div class="rowb" style="margin-top:12px"><a class="btn" href="#profile">Profile &amp; settings</a><button class="btn" data-a="out">Sign out</button></div></div></div></div>`;
  const up=AUTHMODE==='up',fp=AUTHMODE==='fp',rec=AUTHMODE==='rec',sent=AUTHMODE==='sent';
  const en=PROV;
  const icons={google:`<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.48h3.23c1.89-1.74 2.99-4.3 2.99-7.31Z"/><path fill="#34A853" d="M12 22c2.7 0 4.95-.9 6.6-2.46l-3.22-2.48c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.56A9.97 9.97 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.89a5.99 5.99 0 0 1 0-3.78V7.55H3.08a10 10 0 0 0 0 8.9l3.33-2.56Z"/><path fill="#EA4335" d="M12 5.99c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.6 9.6 0 0 0 12 2a9.97 9.97 0 0 0-8.92 5.55l3.33 2.56C7.2 7.75 9.4 5.99 12 5.99Z"/></svg>`,discord:`<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><path fill="currentColor" d="M20.3 4.7A19.6 19.6 0 0 0 15.5 3l-.6 1.2a18.3 18.3 0 0 0-5.8 0L8.5 3a19.6 19.6 0 0 0-4.8 1.7C.7 9.2-.1 13.6.3 17.9a19.8 19.8 0 0 0 5.9 3l1.3-2.1a12.5 12.5 0 0 1-2.1-1l.5-.4a14 14 0 0 0 12.2 0l.5.4c-.7.4-1.4.8-2.1 1l1.3 2.1a19.8 19.8 0 0 0 5.9-3c.5-5-.8-9.3-3.4-13.2ZM8.2 15.3c-1.2 0-2.1-1.1-2.1-2.5s.9-2.5 2.1-2.5 2.1 1.1 2.1 2.5-.9 2.5-2.1 2.5Zm7.6 0c-1.2 0-2.1-1.1-2.1-2.5s.9-2.5 2.1-2.5 2.1 1.1 2.1 2.5-.9 2.5-2.1 2.5Z"/></svg>`};
  const ob=p=>`<button type="button" class="social social-${p[0]}" data-a="oi" data-v="${p[0]}">${icons[p[0]]}<span>Continue with ${p[1]}</span></button>`;
  let f='';
  if(rec)f=`<form id="af"><div class="fg"><input name="p" type="password" placeholder="New password (6+ characters)" autocomplete="new-password" required minlength="6"><button type="button" class="pwv" data-a="pwv" aria-label="Show password">${I('eye')}</button></div><div class="err" id="er"></div><button class="btn p" style="width:100%;justify-content:center">Save new password</button></form>`;
  else if(fp)f=`<form id="af"><div class="fg"><input name="e" type="email" placeholder="Email" autocomplete="email" required></div><div class="err" id="er"></div><button class="btn p" style="width:100%;justify-content:center">Send reset link</button></form>`;
  else if(sent)f=`<p class="sub" style="margin:0 0 6px">We sent a confirmation link to <b style="color:var(--tx)">${esc(RSND)}</b>. Open it in your email app, then come back and sign in.</p><button class="btn" data-a="rsnd" style="width:100%;justify-content:center;margin-top:8px">Resend email</button><button class="btn p" data-a="conf" style="width:100%;justify-content:center;margin-top:10px">I confirmed — sign in</button><p class="phint" style="margin:16px 0 0">No email yet? Supabase’s free-tier mailer only sends about 2 per hour — if it’s exhausted, wait an hour, or switch off “Confirm email” in Supabase → Authentication → Sign In / Up while testing.</p>`;
  else f=`<div class="oab">${en.map(ob).join('')}</div><p id="oautherr" class="err" role="status" aria-live="polite"></p><div class="ohr">or use email</div><form id="af">${up?'<div class="fg"><input name="n" placeholder="Name" autocomplete="name" required></div>':''}<div class="fg"><input name="e" type="email" placeholder="Email" autocomplete="email" value="${esc(LSTA)}" required></div><div class="fg"><input name="p" type="password" placeholder="Password (6+ characters)" autocomplete="${up?'new-password':'current-password'}" required minlength="6"><button type="button" class="pwv" data-a="pwv" aria-label="Show password">${I('eye')}</button></div>${up?'<div class="fg"><input name="p2" type="password" placeholder="Confirm password" autocomplete="new-password" required minlength="6"><button type="button" class="pwv" data-a="pwv" aria-label="Show password">'+I('eye')+'</button></div>':''}<div class="err" id="er"></div><button class="btn p" style="width:100%;justify-content:center">${up?'Create account':'Sign in'}</button></form>`;
  const head=rec?'Pick a new password':fp?'Reset your password':sent?'Almost there':up?'Create your account':'Welcome back';
  const sub=rec?'Set a new password for your account.':fp?'We’ll email you a link to set a new password.':sent?'One click left in your inbox.':'Your account syncs the list, ratings and progress to every device.';
  const foot=fp?'<button data-a="authm" data-m="in">Back to sign in</button>':sent?'<button data-a="authm" data-m="up">Use a different email</button>':up?'<button data-a="authm" data-m="in">Already have an account? Sign in</button>':'<button data-a="authm" data-m="fp">Forgot password?</button>';
  return `<div class="ap">${left}<div class="apr"><a class="apback" href="#home">${I('chevL')} Back to browsing</a><div class="apcard"><h1>${head}</h1><p class="sub">${sub}</p>${(!rec&&!fp&&!sent)?`<div class="tabs"><button data-a="authm" data-m="in" class="${up?'':'on'}">Sign in</button><button data-a="authm" data-m="up" class="${up?'on':''}">Create account</button></div>`:''}${f}<p class="afoot">${foot} · <a href="#home">keep browsing as guest</a></p></div></div></div>`;
}
function authBind(){
  const up=AUTHMODE==='up',fp=AUTHMODE==='fp',rec=AUTHMODE==='rec',sent=AUTHMODE==='sent';
  if(sent)coolUI();
  const F=$('#af');if(!F||F.onsubmit)return;
  F.onsubmit=async ev=>{ev.preventDefault();const fm=new FormData(F),er=$('#er'),btn=F.querySelector('.btn'),em=String(fm.get('e')||'').trim().toLowerCase(),pw=String(fm.get('p')||'');er.textContent='';
    if(!SB){er.textContent='The sign-in service didn’t load — check your connection and reload.';return}
    if(rec){if(pw.length<6)return er.textContent='Password needs 6+ characters.';
      btn.disabled=true;try{const {error}=await SB.auth.updateUser({password:pw});btn.disabled=false;
        if(error)return er.textContent=AMAP(error);
        toast('Password updated — you’re signed in','ok');location.hash='home'}catch(e){btn.disabled=false;er.textContent='Could not reach the sign-in service.'}return}
    if(fp){if(!okE(em))return er.textContent='That doesn’t look like a real email address.';
      btn.disabled=true;try{const {error}=await SB.auth.resetPasswordForEmail(em,{redirectTo:location.href.split('#')[0]});btn.disabled=false;
        if(error)return er.textContent=AMAP(error);
        toast('Reset link sent — check your inbox','ok');AUTHMODE='in';render()}catch(e){btn.disabled=false;er.textContent='Could not reach the sign-in service.'}return}
    if(up){if(!okE(em))return er.textContent='That doesn’t look like a real email address.';
      if(pw.length<6)return er.textContent='Password needs 6+ characters.';
      if(pw!==String(fm.get('p2')||''))return er.textContent='Passwords don’t match.';
      btn.disabled=true;btn.textContent='Creating account…';
      try{const {data,error}=await SB.auth.signUp({email:em,password:pw,options:{data:{name:String(fm.get('n')||'').trim().slice(0,40)||'Me'},emailRedirectTo:location.href.split('#')[0]}});
        btn.disabled=false;btn.textContent='Create account';
        if(error)return er.textContent=AMAP(error);
        if(data&&data.session){afterSignIn(data.session.user,1);return}
        RSND=em;LSTA=em;AUTHMODE='sent';render()}catch(e){btn.disabled=false;btn.textContent='Create account';er.textContent='Could not reach the sign-in service.'}return}
    if(!okE(em))return er.textContent='That doesn’t look like a real email address.';
    btn.disabled=true;btn.textContent='Signing in…';
    try{const {data,error}=await SB.auth.signInWithPassword({email:em,password:pw});
      btn.disabled=false;btn.textContent='Sign in';
      if(error){LSTA=em;
        if(String(error.code||'')==='email_not_confirmed'||/not confirmed/i.test(String(error.message||''))){RSND=em;er.innerHTML=AMAP(error)+' <button type="button" class="lk" data-a="rsnd">Resend it</button>';return}
        return er.textContent=AMAP(error)}
      LSTA='';afterSignIn(data.user)}catch(e){btn.disabled=false;btn.textContent='Sign in';er.textContent='Could not reach the sign-in service.'}};
}
const GM={M:{Action:28,Adventure:12,Animation:16,Comedy:35,Crime:80,Drama:18,Family:10751,Fantasy:14,Horror:27,Mystery:9648,Romance:10749,'Sci-Fi':878,Thriller:53},S:{Action:10759,Comedy:35,Crime:80,Drama:18,Family:10751,Mystery:9648,'Sci-Fi':10765,Fantasy:10765},A:{Action:10759,Comedy:35,Drama:18,Fantasy:10765,Mystery:9648}};
const AV=['🦊','🐼','🐙','🦄','🐲','🚀','🎧','🌙','🍿','👾','🔥','🌊'];
const PAL=[['#8B7BFF','#FF7AA8'],['#5CE1E6','#8B7BFF'],['#FFB86B','#FF5C8A'],['#7CE3A8','#5CE1E6'],['#FF6B6B','#FFB86B'],['#C084FC','#60A5FA']];
const GEN=['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama','Family','Fantasy','History','Horror','Mystery','Romance','Sci-Fi','Thriller','War'];
const MO=[['Action','zap',10],['Sci-Fi','rocket',200],['Romance','heart',330],['Comedy','smile',45],['Horror','ghost',280],['Fantasy','wand',150],['Crime','search',20],['Family','users',90]];
const moods=()=>`<section class="row"><h2>Browse by mood</h2><div class="tiles">${MO.map(m=>`<button class="tile" data-a="mood" data-g="${m[0]}" style="--h:${m[2]}">${m[0]}<span>${I(m[1])}</span></button>`).join('')}</div></section>`;
const avs=u=>`<div class="avs">${AV.map(v=>`<button data-a="av" data-v="${v}" class="${u.av===v?'on':''}">${v}</button>`).join('')}</div>`;
const gch=u=>`<div class="chips" style="padding:0;margin:0">${GEN.map(g=>`<button data-a="gn" data-g="${g}" class="${u.gn.includes(g)?'on':''}">${g}</button>`).join('')}</div>`;
function onboard(){const u=me();$('#au').innerHTML=`<div class="au"><button class="x" data-a="cl" aria-label="Close">${I('x')}</button><h2>Welcome, ${esc(u.name)}</h2><p>Add a photo, pick an avatar and tell us what you like — Home will tune itself.</p><div class="rowb" style="margin:0 0 12px"><button class="btn" data-a="avup" data-t="me">${I('camera')} Upload a photo</button></div>${avs(u)}${gch(u)}<button class="btn p" style="width:100%;justify-content:center;margin-top:16px" data-a="done">Let’s go</button></div>`;$('#au').classList.add('o')}
function profile(){const u=me();if(!u)return '<div class="pg"><h1>Profile &amp; settings</h1><p class="empty">Something went wrong loading your profile — reload the page.</p></div>';
  const st=u.st,trow=(k,l,d)=>`<button class="tg${ON(st,k)?' on':''}" data-a="tg" data-k="${k}" aria-pressed="${ON(st,k)}"><span>${l}${d?`<small>${d}</small>`:''}</span><i></i></button>`;
  const vs=Object.entries(u.prog),hrs=(vs.reduce((a,[i,p])=>a+p.t,0)/3600).toFixed(1),fin=vs.filter(([i,p])=>C[i]&&done(p,C[i])).length;
  const gc={};[...Object.keys(u.prog),...u.list].forEach(i=>{const c=C[i];if(c)c.g.forEach(g=>gc[g]=(gc[g]||0)+1)});
  const tg=Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,5),gmx=tg.length?tg[0][1]:1;
  const AM=(AUTH&&(AUTH.user_metadata&&(AUTH.user_metadata.avatar||AUTH.user_metadata.picture)))||((A&&typeof A.av==='string'&&A.av.slice(0,5)==='data:')?A.av:'')||(u.pic||''),prov=AUTH?((AUTH.app_metadata&&AUTH.app_metadata.providers&&AUTH.app_metadata.providers[0])||'email'):'';
  const psz=st.psz===undefined?1:st.psz,hm=st.home||'home';
  return `<div class="pg"><h1>Profile &amp; settings</h1>
<div class="pcard"><button class="bigav" data-a="avup" data-t="acct" style="cursor:pointer;overflow:hidden;${AM?`background:url('${AM}') center/cover`:''}" aria-label="Change account photo">${AM?'':(u.av)}</button><div><h1>${esc(A.name)}</h1><p class="mu">${AUTH?esc(AUTH.email)+' · '+esc(prov)+' account':'Guest on this device'} · joined ${new Date(A.at).toLocaleDateString()}</p>${AUTH?'':`<div class="rowb" style="margin-top:12px"><button class="btn p" data-a="auth" data-m="in">Sign in</button><button class="btn" data-a="auth" data-m="up">Create account</button></div><p class="mu" style="margin:10px 0 0;font-size:13px">Signing in moves this device’s list and history into your account and syncs it everywhere.</p>`}</div></div>
<div class="stats"><div><b>${u.list.length}</b>In My List</div><div><b>${vs.length}</b>Started</div><div><b>${fin}</b>Finished</div><div><b>${hrs}</b>Estimated hours</div></div>
<div class="pgrid">
<section class="pn"><h3>Profile</h3>
<input id="nm" value="${esc(u.name)}" maxlength="24" aria-label="Profile name" placeholder="Profile name">
<div class="rowb" style="margin:10px 0 14px"><button class="btn" data-a="avup" data-t="me">${I('camera')} Upload photo</button>${u.pic?'<button class="btn dng" data-a="rmpic">Remove photo</button>':''}<button class="btn p" data-a="sv">Save name</button></div>
${avs(u)}</section>
${window.NR_APPEAR?NR_APPEAR(u):''}
<section class="pn"><h3>Behaviour</h3>
${trow('spr','Blur episode spoilers','Hide episode descriptions until you hover over them')}
${trow('wm','Watched checkmarks','Show check marks on episodes you’ve finished')}
${trow('cf','Ask before deleting','Confirm before clearing history, lists or data')}</section>
<section class="pn"><h3>Your taste</h3><p class="mu" style="margin:0 0 12px">Powers “Picked for you” on Home.</p>${gch(u)}</section>
<section class="pn"><h3>Top genres</h3>${tg.length?tg.map(([g,n])=>`<div class="gbar"><span>${g}</span><div class="gb"><i style="width:${Math.round(n/gmx*100)}%"></i></div><b>${n}</b></div>`).join(''):'<p class="mu">Watch and list a few titles to see this fill in.</p>'}</section>
<section class="pn"><h3>${AUTH?'Account &amp; data':'Data'}</h3>
${AUTH&&prov==='email'?'<input id="np" type="password" placeholder="New password (6+ characters)"><div class="rowb" style="margin:0 0 14px"><button class="btn" data-a="pw">Change password</button></div>':''}
<div class="rowb"><button class="btn" data-a="clc">Clear continue watching</button><button class="btn" data-a="cll">Clear My List</button></div>
<div class="rowb"><button class="btn" data-a="exp">Export data</button><button class="btn" data-a="imp">Import data</button><input type="file" id="imf" accept="application/json" hidden></div>
${AUTH?`<p class="synline">${SYNCO?'<b>'+I('check')+' Synced</b> — your list follows your account on every device':'Your account is signed in; cloud sync turns on once the app_state table exists in Supabase (one SQL paste — see the README).'}</p><div class="rowb"><button class="btn" data-a="out">Sign out</button></div>`:'<p class="synline">Data lives in this browser only until you sign in.</p>'}
<div class="rowb"><button class="btn dng" data-a="del">Reset all data</button></div></section></div></div>`}
function acct(){const u=me(),r=document.documentElement.style;
  if(u){const q=PAL[u.ac]||PAL[0];r.setProperty('--a',q[0]);r.setProperty('--b',q[1])}else{r.removeProperty('--a');r.removeProperty('--b')}
  const st=u?u.st:{};
  document.body.classList.toggle('calm',!!u&&!ON(st,'anim'));
  document.body.classList.toggle('nozoom',!!u&&!ON(st,'cz'));
  document.body.classList.toggle('noglass',!!u&&!ON(st,'gls'));
  document.body.classList.toggle('spr',!!u&&!!st.spr);
  document.body.classList.toggle('wm0',!!u&&!ON(st,'wm'));
  ['psz0','psz1','psz2'].forEach(c=>document.body.classList.remove(c));
  if(u)document.body.classList.add('psz'+(st.psz===undefined?1:st.psz));
  $('#pf').innerHTML=u?(u.pic?`<img src="${u.pic}" alt="${esc(u.name)}">`:u.av):'?';
  $('#menu').innerHTML=`<p>${esc(OIDN())}</p><a href="#profile">Profile &amp; settings</a><a href="#list">My List</a><a href="#history">Watch history</a><hr>${AUTH?'<button data-a="out">Sign out</button>':'<button data-a="auth" data-m="in">Sign in</button><button data-a="auth" data-m="up">Create account</button>'}`}
