// Nightreel · Title detail popup, seasons and episodes, where to watch
// ---- detail ----
let curD=-1,curS=1,MT='ov',ntT=null;
const SC={};
const so=(c,ep)=>{let a=0,r=1;for(const s of c.seasons||[]){r=s.n;if(ep<=a+s.ec)return s.n;a+=s.ec}return r};
const se=(c,ep)=>{if(!c.seasons||!c.seasons.length)return 'Episode '+ep;let a=0;for(const s of c.seasons){if(ep<=a+s.ec)return 'S'+s.n+' · E'+(ep-a);a+=s.ec}return 'Episode '+ep};
async function loadSeason(id){const c=C[id],n=curS;if(!$('#eg'))return;
  const k=c.tid+'-'+n;if(SC[k]){renderSeason(id);return}
  try{const j=await T('/tv/'+c.tid+'/season/'+n);if(curD!==id||curS!==n||!$('#eg'))return;
    SC[k]=(j.episodes||[]).map(e=>({n:e.episode_number,nm:e.name||('Episode '+e.episode_number),ov:e.overview||'',st:e.still_path,ad:e.air_date||'',rt:e.runtime||0}));renderSeason(id)}
  catch(x){if($('#eg'))$('#eg').innerHTML='<p class="mu">Could not load episodes.</p>';toast('Failed to load episodes','err')}}
function renderSeason(id){const c=C[id],u=me(),p=u&&u.prog[id],eps=SC[c.tid+'-'+curS]||[],eg=$('#eg');if(!eg)return;
  const off=(c.seasons||[]).filter(s=>s.n<curS).reduce((a,s)=>a+s.ec,0);
  eg.innerHTML=eps.length?eps.map(e=>{const g=off+e.n,w=p&&(done(p,c)||g<p.ep);return `<button data-a="play" class="epc${w?' w':''}" data-id="${id}" data-ep="${g}"><span class="th"${e.st?` style="background-image:url('https://image.tmdb.org/t/p/${me()&&me().st.ds?'w185':'w300'}${e.st}')"`:''}></span><b>${w?'<em class="wd">'+I('check')+'</em> ':''}${e.n}. ${esc(e.nm)}</b><small>${e.ad||''}${e.rt?' · '+e.rt+' min':''}</small>${e.ov?`<p>${esc(e.ov)}</p>`:''}</button>`}).join(''):'<p class="mu">No episode info yet.</p>'}
// TMDB's regional availability is separate from the embedded player.
const PROVIDER_CACHE={};
const REGIONS=[['US','United States'],['BZ','Belize'],['CA','Canada'],['GB','United Kingdom'],['MX','Mexico'],['AU','Australia'],['IN','India'],['FR','France'],['DE','Germany'],['BR','Brazil'],['JP','Japan'],['ES','Spain'],['JM','Jamaica'],['TT','Trinidad & Tobago']];
function providerMarkup(id){
  const c=C[id],u=me(),region=(u&&u.st.region)||'US',data=PROVIDER_CACHE[c.mt+c.tid];
  const selector=`<label>Region <select id="provider-region" aria-label="Streaming availability region">${REGIONS.map(([code,name])=>`<option value="${code}"${code===region?' selected':''}>${name}</option>`).join('')}</select></label>`;
  let content='<p>Checking availability…</p>';
  if(data&&data.error)content='<p>Availability could not be loaded. <button class="lk" data-a="retry-providers" data-id="'+id+'">Try again</button></p>';
  else if(data&&!data.loading){
    const r=(data.results||{})[region]||{},groups=[['flatrate','Subscription'],['free','Free'],['ads','With ads'],['rent','Rent'],['buy','Buy']];
    let rows=groups.filter(([key])=>Array.isArray(r[key])&&r[key].length).map(([key,label])=>`<div class="provider-row"><strong>${label}</strong>${r[key].map(item=>`<span class="provider">${/^\/[a-zA-Z0-9_.-]+$/.test(item.logo_path||'')?`<img loading="lazy" src="https://image.tmdb.org/t/p/w92${item.logo_path}" alt="">`:''}${esc(item.provider_name||'Provider')}</span>`).join('')}</div>`).join('');
    let link='';try{const url=new URL(r.link);if(url.protocol==='https:'&&url.hostname==='www.themoviedb.org')link=`<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">View availability on TMDB ${I('external')}</a>`}catch(e){}
    content=(rows||'<p>No availability reported for this region. Try another region or check again later.</p>')+`<p class="source-note">Availability data provided by JustWatch via TMDB. Offers and prices may change. ${link}</p>`;
  }
  return `<div class="availability-head"><h3>Where to watch</h3>${selector}</div>${content}`;
}
async function loadProviders(id,force=false){
  const c=C[id];if(!c)return;const key=c.mt+c.tid;
  if(PROVIDER_CACHE[key]&&!force)return;PROVIDER_CACHE[key]={loading:true};
  try{const j=await T('/'+c.mt+'/'+c.tid+'/watch/providers');PROVIDER_CACHE[key]={results:j.results||{}}}
  catch(e){PROVIDER_CACHE[key]={error:true}}
  const box=$('#availability');if(box&&curD===id&&$('#md').classList.contains('o'))box.innerHTML=providerMarkup(id);
}
function detail(id,keep){
  curD=id;const c=C[id],u=me(),inL=u&&u.list.includes(id),p=u&&u.prog[id],res=p&&!done(p,c),pct=Math.round(c.r*10),my=u&&u.r10?u.r10[id]||0:0;
  if(!keep){curS=(p&&c.seasons&&so(c,p.ep))||(c.seasons&&c.seasons[0]&&c.seasons[0].n)||1;MT='ov';
    if(u){u.view=[id,...(u.view||[]).filter(x=>x!==id)].slice(0,14);save()}}
  const sim=(c.sim&&c.sim.length?c.sim.map(i=>C[i]):C.filter(x=>x.i!==id&&x.g.some(g=>c.g.includes(g))).slice(0,10)).filter(Boolean);
  const tabs=[['ov','Overview']].concat(c.mt!=='movie'?[['ep','Episodes']]:[]).concat((c.cast&&c.cast.length)||(c.crew&&c.crew.length)?[['cc','Cast & Crew']]:[]).concat((c.clips&&c.clips.length)||(c.bgs&&c.bgs.length)?[['md','Media']]:[]).concat([['si','More like this']]);
  let tc='';
  if(MT==='ov')tc=`<div class="ov2"><div><p class="syn">${esc(c.d)}</p>
${c.cast&&c.cast.length?`<p class="cast-preview"><b>Starring:</b> ${c.cast.slice(0,4).map(x=>`<button class="lk" data-a="per" data-id="${x.i}">${esc(x.n)}</button>`).join(' · ')}</p>`:''}
${c.vid?`<div class="rowb"><button class="btn" data-a="trl" data-v="${c.vid}">${I('play')} Watch trailer</button></div>`:''}
${c.crew&&c.crew.length?`<p class="crew">${c.crew.map(x=>`<button class="lk" data-a="per" data-id="${x.i}">${esc(x.n)}</button> <small>${x.j}</small>`).join(' · ')}</p>`:''}
${res?`<p class="fct">${c.mt==='movie'?'In progress':'You’re on '+se(c,p.ep)} · estimated ${Math.max(1,Math.round((c.m*60-p.t)/60))} min left (player position may differ) · <button class="lk" data-a="clc1" data-id="${id}">start over</button></p>`:''}
<div id="availability" class="availability" aria-live="polite">${providerMarkup(id)}</div>
<h3>Private note</h3>
<textarea class="note" id="pnt" maxlength="2000" placeholder="Keep a note to yourself — filler to skip, the scene everyone quotes…"${u?'':' disabled'}>${u&&u.nt&&u.nt[id]?esc(u.nt[id]):''}</textarea></div>
<aside><dl class="fact">
<div><dt>Status</dt><dd>${esc(c.st||'—')}</dd></div>
<div><dt>${c.mt==='movie'?(c.net&&c.net.length>1?'Studios':'Studio'):(c.net&&c.net.length>1?'Networks':'Network')}</dt><dd>${esc((c.net||[]).join(', ')||'—')}</dd></div>
<div><dt>Genres</dt><dd>${esc(c.g.join(', '))}</dd></div>
<div><dt>Rated</dt><dd>${esc(c.ct||'Not rated')}</dd></div>
<div><dt>TMDB score</dt><dd>${I('star','fill')} ${c.r}/10</dd></div>
<div><dt>Your score</dt><dd>${my?my+'/10':'—'}</dd></div>
${c.mt!=='movie'?`<div><dt>Seasons</dt><dd>${(c.seasons||[]).length||1}</dd></div>`:''}
<div><dt>Released</dt><dd>${esc(c.rd||String(c.y||'—'))}</dd></div>
</dl></aside></div>`;
  else if(MT==='ep')tc=c.seasons&&c.seasons.length?`<select id="ssn" aria-label="Season">${c.seasons.map(x=>`<option value="${x.n}"${x.n===curS?' selected':''}>Season ${x.n} · ${x.ec} eps</option>`).join('')}</select><div class="eg" id="eg"><div class="sk" style="margin:0"></div></div>`
    :c.ep>1?`<div class="eps">${Array.from({length:Math.min(c.ep,40)},(_,n)=>`<button data-a="play" data-id="${id}" data-ep="${n+1}"${p&&p.ep===n+1?' class="on"':''}>${n+1}</button>`).join('')}</div>`:'<p class="mu">Single episode.</p>';
  else if(MT==='cc')tc=`${c.cast&&c.cast.length?`<h3>Cast</h3><div class="cast" style="padding:0 0 12px">${c.cast.map(x=>`<button class="cm" data-a="per" data-id="${x.i}"><i style="background-image:url('https://image.tmdb.org/t/p/w185${x.p}')"></i>${esc(x.n)}<small>${esc(x.c||'')}</small></button>`).join('')}</div>`:''}
${c.crew&&c.crew.length?`<h3>Crew</h3><p class="crew">${c.crew.map(x=>`<button class="lk" data-a="per" data-id="${x.i}">${esc(x.n)}</button> <small>${x.j}</small>`).join(' · ')}</p>`:''}
${(c.cast&&c.cast.length)||(c.crew&&c.crew.length)?'':'<div class="sk"></div>'}`;
  else if(MT==='md')tc=`${c.vid?`<h3>Trailer</h3><div class="rowb"><button class="btn p" data-a="trl" data-v="${c.vid}">${I('play')} Play trailer</button></div>`:''}
${c.clips&&c.clips.length?`<h3>Clips & extras</h3><div class="cast" style="padding:0 0 12px">${c.clips.map(x=>`<button class="clip" data-a="trl" data-v="${x.k}"><span style="background-image:url('https://img.youtube.com/vi/${x.k}/mqdefault.jpg')"></span>${esc(x.n)}</button>`).join('')}</div>`:''}
${c.bgs&&c.bgs.length?`<h3>Photos</h3><div class="gal">${c.bgs.map(b=>`<img loading="lazy" src="https://image.tmdb.org/t/p/${me()&&me().st.ds?'w300':'w710'}${b}" alt="">`).join('')}</div>`:''}
${(!c.vid&&!(c.clips&&c.clips.length)&&!(c.bgs&&c.bgs.length))?'<div class="sk"></div>':''}`;
  else tc=sim.length?`<div class="gr" style="padding:0">${sim.map(x=>card(x)).join('')}</div>`:'<p class="mu">Nothing loaded yet — check back in a moment.</p>';
  $('#md').innerHTML=`<div class="md${keep?' k':''}"><div class="mbg" style="background-image:${art(id)}"></div><button class="x" data-a="cl" aria-label="Close">${I('x')}</button><div class="bn"><div class="bnx" style="background-image:${art(id,1)}"></div></div>
<div class="mh"><div class="pst" style="background-image:${art(id)}"></div><div class="mi"><h1>${esc(c.t)}</h1><p class="tl">${c.tl?'“'+esc(c.tl)+'”':''}</p><div class="ch"><div class="ringw"><svg class="ring" viewBox="0 0 64 64"><circle class="rb" cx="32" cy="32" r="26"/><circle class="rf" cx="32" cy="32" r="26" style="--d:${pct}"/></svg><b>${pct}</b></div><span class="mut">match</span>${c.ct?`<span class="cert">${esc(c.ct)}</span>`:''}<span>${c.y||'—'}</span><span>${TY[c.ty]}</span>${c.det?`<span>${c.mt==='movie'?c.m+' min':c.ep+(c.ep===1?' ep':' eps')}</span>`:''}<span>${I('star','fill')} ${c.r}</span><span class="hd">HD</span></div><div class="ch">${c.g.map(g=>`<span>${g}</span>`).join('')}</div></div></div>
<div class="mx"><div class="go"><button class="btn p" data-a="play" data-id="${id}">${I('play')} ${res?'Resume':'Play'}</button><button class="btn" data-a="trailer" data-id="${id}">${I('play')} Watch trailer</button><button class="btn" data-a="wtw">${I('tv')} Where to watch</button><button class="btn" data-a="list" data-id="${id}">${inL?I('check')+' In My List':I('plus')+' My List'}</button><div class="gow"><button class="btn ic" data-a="more" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">${I('more')}</button><div class="mm" hidden role="menu">${c.vid?`<button role="menuitem" data-a="trl" data-v="${c.vid}"><i>${I('play')}</i>Watch trailer</button>`:''}${u?`<div class="mmr"><i>${I('star')}</i><span class="str" role="group" aria-label="Your rating out of 10">${Array.from({length:10},(_,n)=>`<button data-a="rate10" data-id="${id}" data-v="${n+1}" class="${n<my?'on':''}" aria-label="Rate ${n+1} out of 10">${I('star',n<my?'fill':'')}</button>`).join('')}</span></div>`:''}<button role="menuitem" data-a="rate" data-id="${id}" data-v="1" class="${u&&u.rt&&u.rt[id]===1?'onm':''}"><i>${I('thumbUp')}</i>${u&&u.rt&&u.rt[id]===1?'Liked — more like this':'Like it — more like this'}</button><button role="menuitem" data-a="rate" data-id="${id}" data-v="-1" class="${u&&u.rt&&u.rt[id]===-1?'onm':''}"><i>${I('thumbDown')}</i>${u&&u.rt&&u.rt[id]===-1?'Noted':'Not for me — fewer like this'}</button><button role="menuitem" data-a="shr" data-id="${id}"><i>${I('share')}</i>Share title link</button>${c.rd&&c.rd>new Date().toISOString().slice(0,10)?`<button role="menuitem" data-a="rem" data-id="${id}" class="${u&&u.rm&&u.rm[id]?'onm':''}"><i>${I('bell')}</i>${u&&u.rm&&u.rm[id]?'Reminder is on':'Remind me at release'}</button>`:''}</div></div></div>
${watchPills(u,id)}
<div class="tabs2">${tabs.map(x=>`<button data-a="mtab" data-v="${x[0]}" class="${MT===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>
<div class="tcontent">${tc}</div></div>`;
  $('#md').classList.add('o');if(!keep){$('#md').scrollTop=0;hyd(id)}
  if(MT==='ep'&&c.seasons&&c.seasons.length)loadSeason(id);
  if(MT==='ov')loadProviders(id);
}
