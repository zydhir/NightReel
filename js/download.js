// Nightreel apps: #download page (Windows installer + portable; Android and iOS coming soon)
// and the nav, drawer and footer links that open it. Loads after features.js.
(()=>{
const D=document,$=s=>D.querySelector(s);
// Files are attached to the newest GitHub release; "latest/download" always points at it.
const REL='https://github.com/zydhir/NightReel/releases/latest/download/';
const WIN={setup:REL+'Nightreel-Setup.exe',portable:REL+'Nightreel-Portable.exe',size:'82 MB',ver:'1.0.0'};
const ico=p=>`<svg class="nri" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
const IC={
  win:ico('<path d="M3 5.5 10.5 4.5v7H3zM12 4.3 21 3v8.5h-9zM3 12.5h7.5v7L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor" stroke="none"/>'),
  and:ico('<rect x="5" y="9" width="14" height="10" rx="2.5"/><path d="M8 9a4 4 0 0 1 8 0M8.5 5.5 7 3.5M15.5 5.5 17 3.5"/><circle cx="10" cy="6.8" r=".6" fill="currentColor" stroke="none"/><circle cx="14" cy="6.8" r=".6" fill="currentColor" stroke="none"/>'),
  ios:ico('<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/>'),
  dl:ico('<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15"/>'),
  ok:ico('<path d="m5 12.5 4.5 4.5L19 7.5"/>')
};
const isWin=/Windows/i.test(navigator.userAgent)&&!/Phone/i.test(navigator.userAgent);
const isPhone=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function page(){
  const note=isPhone?'<p class="nrd-note">You’re on a phone. Open this page on a Windows PC to get the app, or keep using Nightreel right here in your browser.</p>':!isWin?'<p class="nrd-note">The Windows app is ready now. Mac and Linux aren’t available yet, but the website works the same in any browser.</p>':'';
  return `<div class="pg nrd" id="nrd-root">
  <div class="nrd-hero"><span class="nrd-badge">${IC.dl} Nightreel apps</span>
    <h1>Take Nightreel off the browser</h1>
    <p>Its own window, its own taskbar icon, and it opens straight to tonight’s picks. Your account, list and stats come with you.</p></div>
  ${note}
  <div class="nrd-grid">
    <section class="nrd-card on">
      <div class="nrd-top"><span class="nrd-ic win">${IC.win}</span><div><h2>Windows</h2><small>Windows 10 and 11 · 64-bit · v${WIN.ver}</small></div><span class="nrd-tag ok">Available</span></div>
      <ul class="nrd-li"><li>${IC.ok}Opens in its own window with fullscreen (F11)</li><li>${IC.ok}Always up to date, with no reinstalling</li><li>${IC.ok}Release-day alerts as Windows notifications</li></ul>
      <a class="btn p nrd-btn" href="${WIN.setup}" download data-nrd="setup">${IC.dl} Download for Windows</a>
      <a class="nrd-alt" href="${WIN.portable}" download>No install? Get the portable version</a>
      <p class="nrd-fine">${WIN.size}. If Windows shows “Windows protected your PC”, click <b>More info</b> then <b>Run anyway</b>. The app isn’t code-signed yet.</p>
    </section>
    <section class="nrd-card">
      <div class="nrd-top"><span class="nrd-ic and">${IC.and}</span><div><h2>Android</h2><small>Phones and tablets</small></div><span class="nrd-tag">Coming soon</span></div>
      <p class="nrd-soon">We’re building it. Until then, open Nightreel in Chrome and tap <b>Add to Home screen</b> for an app-like icon.</p>
      <button class="btn nrd-btn" disabled>Coming soon</button>
    </section>
    <section class="nrd-card">
      <div class="nrd-top"><span class="nrd-ic ios">${IC.ios}</span><div><h2>iPhone and iPad</h2><small>iOS and iPadOS</small></div><span class="nrd-tag">Coming soon</span></div>
      <p class="nrd-soon">We’re building it. Until then, open Nightreel in Safari, tap <b>Share</b> then <b>Add to Home Screen</b>.</p>
      <button class="btn nrd-btn" disabled>Coming soon</button>
    </section>
  </div></div>`;
}

KN.push('download');
let T0=D.title,TITLED=false;
const _r=render;render=function(){const r=location.hash.slice(1);
  if(r!=='download'||(typeof q!=='undefined'&&q)){if(TITLED){D.title=T0;TITLED=false}return _r.apply(this,arguments)}
  if(!TITLED)T0=D.title;TITLED=true;
  D.body.classList.remove('nrf-full');const a=$('#app');a.innerHTML=page();a.classList.remove('pgin');void a.offsetWidth;a.classList.add('pgin');
  const ht=$('#nr-home-top');if(ht)ht.innerHTML='';
  D.querySelectorAll('#nl a,.dp a').forEach(x=>x.classList.toggle('on',x.getAttribute('href')==='#download'));
  D.querySelectorAll('#tabbar button').forEach(b=>b.classList.remove('on'));
  D.title='Download Nightreel · Apps for Windows, Android and iOS';scrollTo(0,0)};

D.addEventListener('click',e=>{const t=e.target.closest('[data-nrd="setup"]');if(t&&typeof toast==='function')toast('Downloading Nightreel for Windows','ok')});

// Entry points: a pill in the top bar (desktop), the side drawer and the footer.
const nav=$('#nav'),pf=$('#pf');
if(nav&&pf&&!$('#nrd-nav'))pf.insertAdjacentHTML('beforebegin',`<a class="nrd-nav" id="nrd-nav" href="#download" title="Get the app">${IC.dl}<span>Get the app</span></a>`);
const dp=$('.dp');if(dp&&!dp.querySelector('[href="#download"]')){const s=dp.querySelector('[href="#stats"]');s&&s.insertAdjacentHTML('afterend','<a href="#download">Get the app</a>')}
const fc=D.querySelector('footer .fcol');if(fc&&!D.querySelector('footer [href="#download"]'))fc.insertAdjacentHTML('beforeend','<a href="#download">Get the app</a>');
if(location.hash==='#download')render();
})();
