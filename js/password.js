// Account recovery pages: #forgot (email a reset link) and #reset (choose a new password).
// Also sends the sign-in page's "Forgot password?" here, and catches the link from the email
// (Supabase signs the person in and fires PASSWORD_RECOVERY) so it opens the new-password form.
(()=>{
const D=document,$=s=>D.querySelector(s),ss=window.sessionStorage;
const sg=k=>{try{return ss.getItem(k)}catch(e){return null}},sp=(k,v)=>{try{v==null?ss.removeItem(k):ss.setItem(k,v)}catch(e){}};
const COOL=60;                       // seconds before another reset email can be sent
const P={sent:'',err:'',done:false}; // page state

// ---- What the email link brought back ----
const H=location.hash.slice(1),HP=new URLSearchParams(H.includes('=')?H:'');
if(HP.get('type')==='recovery')sp('nr_rec','1');
if(HP.get('error_code')||HP.get('error')){
  const c=HP.get('error_code')||'';P.err=c==='otp_expired'?'expired':(HP.get('error_description')||'This link didn’t work.').replace(/\+/g,' ');
  history.replaceState(null,'',location.pathname+location.search+'#reset');
}
const recovering=()=>sg('nr_rec')==='1';
const tokenHash=()=>/(^|&)(access_token|refresh_token|type=recovery)/.test(location.hash.slice(1));

// ---- Shared bits ----
const left=()=>{const arts=(typeof L!=='undefined'&&L.trend||[]).filter(c=>c.b).slice(0,5);
  return `<div class="apl">${arts.map((c,i)=>`<div class="apbg" style="background-image:${art(c.i,1)};animation-delay:${(-i*9).toFixed(1)}s"></div>`).join('')}<div class="apc2"><a class="logo" href="#home">night<i>reel</i></a><p>Locked out? It happens. Get back to your list, ratings and watch progress in a minute.</p><div class="apb"><span>${I('lock')} Secure reset link</span><span>${I('clock')} Expires in 1 hour</span></div></div></div>`};
const wrap=(inner,back='#auth',backTxt='Back to sign in')=>`<div class="ap nrp">${left()}<div class="apr"><a class="apback" href="${back}">${I('chevL')} ${backTxt}</a><div class="apcard">${inner}</div></div></div>`;
const badge=(ic,cls='')=>`<div class="nrp-ic ${cls}">${ic}</div>`;
const mail='<svg class="nri" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>';
const key='<svg class="nri" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2"/></svg>';
const okI='<svg class="nri" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const warn='<svg class="nri" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>';
const eye=()=>`<button type="button" class="pwv" data-a="pwv" aria-label="Show password">${I('eye')}</button>`;
const left_s=()=>Math.max(0,Math.ceil(((+sg('nr_fpcool')||0)-Date.now())/1000));
const mapErr=e=>typeof AMAP==='function'?AMAP(e):String(e&&e.message||'Something went wrong. Try again.');
const signedIn=()=>typeof AUTH!=='undefined'&&!!AUTH;

// ---- #forgot ----
function forgotPage(){
  if(P.sent)return wrap(`${badge(mail)}<h1>Check your inbox</h1>
    <p class="sub">If <b style="color:var(--tx)">${esc(P.sent)}</b> has a Nightreel account, a reset link is on its way.</p>
    <ul class="nrp-tips"><li>The link works once and expires in 1 hour.</li><li>Nothing there after a few minutes? Check spam or promotions.</li><li>Open it on this device for the smoothest reset.</li></ul>
    <button class="btn p nrp-w" data-nrp="resend"></button>
    <p class="afoot"><button data-nrp="other">Use a different email</button> · <a href="#auth">Back to sign in</a></p>`);
  const pre=esc(sg('nr_fpmail')||(typeof LSTA!=='undefined'?LSTA:'')||'');
  return wrap(`${badge(key)}<h1>Forgot your password?</h1>
    <p class="sub">Enter the email you sign in with and we’ll send you a link to choose a new one.</p>
    <form id="nrp-f" novalidate><div class="fg"><input name="e" type="email" placeholder="Email" autocomplete="email" value="${pre}" required autofocus></div>
    <div class="err" id="nrp-er" role="alert"></div><button class="btn p nrp-w">Send reset link</button></form>
    <p class="afoot">Remembered it? <a href="#auth">Sign in</a> · Signed up with Google or Discord? Use that button instead.</p>`);
}
async function sendLink(em,btn){
  const er=$('#nrp-er');if(er)er.textContent='';
  if(!SB){if(er)er.textContent='The sign-in service didn’t load. Check your connection and reload.';return false}
  if(left_s()>0)return false;
  const label=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
  try{const {error}=await SB.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});
    btn.disabled=false;btn.textContent=label;
    if(error){const m=mapErr(error);if(er)er.textContent=m;else toast(m,'err');return false}
    sp('nr_fpcool',String(Date.now()+COOL*1000));sp('nr_fpmail',em);return true}
  catch(e){btn.disabled=false;btn.textContent=label;const m='Could not reach the sign-in service.';if(er)er.textContent=m;else toast(m,'err');return false}
}
let coolT=null;
function coolBtn(){const b=$('[data-nrp="resend"]');if(!b){clearInterval(coolT);coolT=null;return}
  const s=left_s();b.disabled=s>0;b.textContent=s>0?`Resend link (${s}s)`:'Resend link';
  if(s>0&&!coolT)coolT=setInterval(coolBtn,1000);if(s<=0&&coolT){clearInterval(coolT);coolT=null}}

// ---- #reset ----
function strength(p){if(!p)return [0,''];let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
  if(p.length<6)return [1,'Too short'];return s<=2?[2,'Weak']:s===3?[3,'Okay']:[4,'Strong']}
let waitT=null;
function resetPage(){
  if(P.done)return wrap(`${badge(okI,'ok')}<h1>Password changed</h1><p class="sub">You’re signed in. Use your new password next time you sign in on another device.</p><a class="btn p nrp-w" href="#home">Continue to Nightreel</a>`,'#home','Back to browsing');
  if(P.err)return wrap(`${badge(warn,'bad')}<h1>${P.err==='expired'?'This link has expired':'That link didn’t work'}</h1>
    <p class="sub">${P.err==='expired'?'Reset links work once and only for an hour. It may also have been opened already, sometimes by an email app scanning it.':esc(P.err)}</p>
    <a class="btn p nrp-w" href="#forgot">Send a new link</a><p class="afoot"><a href="#auth">Back to sign in</a></p>`);
  if(tokenHash()||(recovering()&&!signedIn())){
    clearTimeout(waitT);waitT=setTimeout(()=>{if(!signedIn()&&location.hash.slice(1)==='reset'){sp('nr_rec',null);render()}},8000);
    return wrap(`${badge(key)}<h1>Checking your link…</h1><p class="sub">One second while we verify it.</p><div class="nrp-spin" aria-hidden="true"></div>`)}
  if(!signedIn())return wrap(`${badge(mail)}<h1>Open the link from your email</h1><p class="sub">To choose a new password, use the reset link we emailed you. Don’t have one?</p><a class="btn p nrp-w" href="#forgot">Email me a reset link</a><p class="afoot"><a href="#auth">Back to sign in</a></p>`);
  const rec=recovering();
  return wrap(`${badge(key)}<h1>${rec?'Choose a new password':'Change your password'}</h1>
    <p class="sub">${rec?'For ':'Signed in as '}<b style="color:var(--tx)">${esc(AUTH.email||'your account')}</b>. Use at least 8 characters; a mix of letters, numbers and symbols is best.</p>
    <form id="nrp-r" novalidate>
      <div class="fg"><input name="p" type="password" placeholder="New password" autocomplete="new-password" required minlength="6" autofocus>${eye()}</div>
      <div class="nrp-meter" data-s="0"><i></i><i></i><i></i><i></i><span id="nrp-ml"></span></div>
      <div class="fg"><input name="p2" type="password" placeholder="Confirm new password" autocomplete="new-password" required minlength="6">${eye()}</div>
      <div class="err" id="nrp-er" role="alert"></div><button class="btn p nrp-w">Save new password</button></form>
    <p class="afoot">${rec?'Changed your mind? <a href="#home">Keep your old password</a>':'<a href="#forgot">Forgot your current password?</a>'}</p>`,rec?'#home':'#profile',rec?'Back to browsing':'Back to settings');
}

// ---- Routing ----
KN.push('forgot','reset');
function paint(r){
  D.body.classList.remove('nrf-full');const a=$('#app');a.innerHTML=r==='forgot'?forgotPage():resetPage();
  a.classList.remove('pgin');void a.offsetWidth;a.classList.add('pgin');
  const ht=$('#nr-home-top');if(ht)ht.innerHTML='';
  D.querySelectorAll('#nl a,.dp a').forEach(x=>x.classList.remove('on'));D.querySelectorAll('#tabbar button').forEach(b=>b.classList.remove('on'));
  if(!TITLED)T0=D.title;TITLED=true;D.title=(r==='forgot'?'Reset your password':'Choose a new password')+' · Nightreel';
  if(r==='forgot')coolBtn();scrollTo(0,0)}
let T0=D.title,TITLED=false;
const _r=render;render=function(){const r=location.hash.slice(1);
  if(r!=='reset'){P.err='';P.done=false}
  if(r!=='forgot'&&!(r==='reset'||(tokenHash()&&recovering()))&&TITLED){D.title=T0;TITLED=false}
  if(typeof q!=='undefined'&&q)return _r.apply(this,arguments);
  if(r==='forgot'||r==='reset')return paint(r);
  if(tokenHash()&&recovering())return paint('reset');
  return _r.apply(this,arguments)};

// The sign-in page's own "Forgot password?" mode and the recovery event both land here instead.
const _g=goAuth;goAuth=function(mode){
  if(mode==='fp'){location.hash='forgot';return}
  if(mode==='rec'){sp('nr_rec','1');P.err='';P.done=false;if(location.hash.slice(1)==='reset')render();else location.hash='reset';return}
  return _g.apply(this,arguments)};
D.addEventListener('click',e=>{const t=e.target.closest('[data-a="authm"][data-m="fp"]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();location.hash='forgot'},true);
if(SB)SB.auth.onAuthStateChange(ev=>{const r=location.hash.slice(1);
  if(ev==='PASSWORD_RECOVERY'){sp('nr_rec','1');setTimeout(()=>goAuth('rec'),0)}
  else if(ev==='SIGNED_OUT'){sp('nr_rec',null);if(r==='reset')setTimeout(render,0)}
  else if(r==='reset'&&!P.done)setTimeout(render,0)});

// ---- Forms ----
D.addEventListener('submit',async e=>{const f=e.target;
  if(f.id==='nrp-f'){e.preventDefault();const em=String(new FormData(f).get('e')||'').trim().toLowerCase(),er=$('#nrp-er');
    if(!(typeof okE==='function'?okE(em):/\S+@\S+\.\S+/.test(em))){er.textContent='That doesn’t look like a real email address.';return}
    if(left_s()>0){er.textContent=`You just asked for a link. Wait ${left_s()}s to send another.`;return}
    if(await sendLink(em,f.querySelector('.btn'))){P.sent=em;if(typeof LSTA!=='undefined')LSTA=em;paint('forgot')}}
  else if(f.id==='nrp-r'){e.preventDefault();const fm=new FormData(f),p=String(fm.get('p')||''),p2=String(fm.get('p2')||''),er=$('#nrp-er'),btn=f.querySelector('.btn');er.textContent='';
    if(p.length<6)return er.textContent='Password needs at least 6 characters.';
    if(p!==p2)return er.textContent='The two passwords don’t match.';
    if(!SB||!signedIn())return er.textContent='Your reset session ended. Ask for a new link.';
    btn.disabled=true;btn.textContent='Saving…';
    try{const {error}=await SB.auth.updateUser({password:p});btn.disabled=false;btn.textContent='Save new password';
      if(error){const c=String(error.code||'');return er.textContent=c==='same_password'||/different from the old/i.test(error.message||'')?'That’s your current password. Pick a new one.':c==='weak_password'?'That password is too easy to guess. Try a longer one.':mapErr(error)}
      sp('nr_rec',null);P.done=true;toast('Password changed','ok');paint('reset')}
    catch(x){btn.disabled=false;btn.textContent='Save new password';er.textContent='Could not reach the sign-in service.'}}});
D.addEventListener('input',e=>{const t=e.target;if(!t.closest('#nrp-r'))return;const f=t.form;
  if(t.name==='p'){const [s,l]=strength(t.value),m=$('.nrp-meter');if(m){m.dataset.s=s;$('#nrp-ml').textContent=l}}
  const a=f.elements.p.value,b=f.elements.p2.value;f.elements.p2.classList.toggle('nrp-bad',!!b&&a!==b)});
D.addEventListener('click',async e=>{const t=e.target.closest('[data-nrp]');if(!t)return;
  if(t.dataset.nrp==='other'){P.sent='';paint('forgot')}
  else if(t.dataset.nrp==='resend'){if(await sendLink(P.sent,t))toast('New link sent','ok');coolBtn()}});

if(['forgot','reset'].includes(location.hash.slice(1))||(tokenHash()&&recovering()))render();
})();
