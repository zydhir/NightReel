// Nightreel · Helpers, storage, TMDB requests, title catalog, artwork
const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const $=s=>document.querySelector(s);
const mem={};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='acf09b7384dde461a7080bd7d53b852e';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.NR_LANG='en-US';try{localStorage.removeItem('nr_lang')}catch(e){}
async function T(p,x=''){const lg=window.NR_LANG||'en-US',k='tm:'+(lg==='en-US'?'':lg+':')+p+x;
  try{const v=JSON.parse(sessionStorage.getItem(k)||'null');if(v&&Date.now()-v.t<18e5)return v.j}catch(e){}
  for(let n=0;n<3;n++){try{const r=await fetch('https://api.themoviedb.org/3'+p+'?api_key='+KEY+'&language='+lg+x);
    if(r.status===429){await sleep((+r.headers.get('Retry-After')||1)*1000);continue}
    if(r.status===401||r.status===404)throw new Error('tmdb '+r.status);if(!r.ok)throw 0;const j=await r.json();try{sessionStorage.setItem(k,JSON.stringify({t:Date.now(),j}))}catch(e){}return j}catch(e){if(e&&/^tmdb \d/.test(e.message||''))throw e;await sleep(400*3**n)}}
  throw new Error('tmdb')}
function saveCat(){const ref=new Set();if(A)(A.pf||[]).forEach(p=>{p.list.forEach(i=>ref.add(i));Object.keys(p.prog).forEach(i=>ref.add(+i));Object.keys(p.rt||{}).forEach(i=>ref.add(+i))});
  const slim=n=>C.forEach((c,i)=>{if(i<C.length-n&&!ref.has(i)){delete c.cast;delete c.sim;delete c.crew;delete c.clips;delete c.v3;delete c.dv;delete c.bgs}});
  if(C.length>500)slim(300);
  try{localStorage.setItem('nr_cat',JSON.stringify(C))}catch(e){slim(100);try{localStorage.setItem('nr_cat',JSON.stringify(C))}catch(x){}}}
const GN={28:'Action',12:'Adventure',16:'Animation',35:'Comedy',80:'Crime',99:'Documentary',18:'Drama',10751:'Family',14:'Fantasy',27:'Horror',9648:'Mystery',10749:'Romance',878:'Sci-Fi',53:'Thriller',10765:'Sci-Fi',10759:'Action',10768:'War',37:'Western',36:'History',10402:'Music',10752:'War'};
let C=store.get('nr_cat',[]),CK={};C.forEach(c=>CK[c.mt+c.tid]=c);
function ing(x,mt){mt=x.media_type||mt;if((mt!=='movie'&&mt!=='tv')||!x.poster_path)return null;
  const an=(x.genre_ids||[]).includes(16)&&x.original_language==='ja',g=[...new Set((x.genre_ids||[]).map(i=>GN[i]).filter(Boolean))];
  const o={t:x.title||x.name,ty:an?'A':mt==='tv'?'S':'M',y:+((x.release_date||x.first_air_date||'0').slice(0,4)),g:g.length?g:['Drama'],r:+(x.vote_average||0).toFixed(1),d:x.overview||'No description yet.',p:x.poster_path,b:x.backdrop_path,tid:x.id,mt,rd:x.release_date||x.first_air_date||''},k=mt+x.id;
  let c=CK[k];if(c){const m=c.m,ep=c.ep,gg=c.det?c.g:o.g;Object.assign(c,o,{m,ep,g:gg});return c}
  c={i:C.length,m:mt==='tv'?(an?24:45):110,ep:1,...o};C.push(c);CK[k]=c;return c}
const TY={M:'Movie',S:'Series',A:'Anime'};
const AC={};
function art(i,w){
  const k=i+(w?'w':'');if(AC[k])return AC[k];
  const cc=C[i],ds=me()&&me().st.ds;if(cc&&cc.p){const u=w&&cc.b?(ds?'w780':'w1280')+cc.b:(ds?'w185':'w500')+cc.p;return AC[k]="url('https://image.tmdb.org/t/p/"+u+"')"}
  const h=(i*47+13)%360,W=w?800:300,H=450,r=n=>rnd(i*31+n);
  let s=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl(${h},85%,42%)'/><stop offset='1' stop-color='hsl(${(h+70)%360},80%,10%)'/></linearGradient></defs><rect width='${W}' height='${H}' fill='url(#g)'/>`;
  const sx=W*(.25+r(1)*.5),sy=H*(.25+r(2)*.2),sr=H*(.12+r(3)*.1);for(let b=0;b<3;b++)s+=`<polygon points='${sx},${sy} ${sx-90+b*90},${H} ${sx-20+b*90},${H}' fill='#fff' opacity='.08'/>`;s+=`<circle cx='${sx}' cy='${sy}' r='${sr*1.9}' fill='hsl(${h+150},90%,70%)' opacity='.14'/><circle cx='${sx}' cy='${sy}' r='${sr*1.35}' fill='none' stroke='#fff' stroke-opacity='.35' stroke-width='1.5'/><circle cx='${sx}' cy='${sy}' r='${sr}' fill='hsl(${h+150},95%,75%)' opacity='.92'/>`;
  for(let j=0;j<16;j++)s+=`<circle cx='${r(j+10)*W}' cy='${r(j+40)*H*.5}' r='${.8+r(j+70)*1.6}' fill='#fff' opacity='${.3+r(j+90)*.5}'/>`;
  for(let L=0;L<3;L++){const y=H*(.55+L*.14);let d=`M0 ${H} L0 ${y}`;for(let q=0;q<=10;q++)d+=` L${q*W/10} ${y-r(L*20+q)*H*.14}`;s+=`<path d='${d} L${W} ${H}Z' fill='hsl(${h+L*15},45%,${18-L*5}%)'/>`}
  return AC[k]="url('data:image/svg+xml,"+encodeURIComponent(s+'</svg>').replace(/'/g,'%27')+"')";
}
