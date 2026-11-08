// Run with: node tests/ads.test.js (no dependencies required)
const assert=require('assert'),vm=require('vm'),fs=require('fs');

function makeClassList(initial=[]){
  const set=new Set(initial);
  return {
    add:(...cs)=>cs.forEach(c=>set.add(c)),
    remove:(...cs)=>cs.forEach(c=>set.delete(c)),
    toggle:(c,f)=>{if(f===undefined){set.has(c)?set.delete(c):set.add(c);return set.has(c)}f?set.add(c):set.delete(c);return !!f},
    contains:c=>set.has(c)
  };
}

function makeEl(tag,id=''){
  const attrs={};
  const el={
    tagName:tag.toUpperCase(),
    id,
    className:'',
    hidden:false,
    dataset:{},
    style:{},
    children:[],
    parentNode:null,
    innerHTML:'',
    textContent:'',
    classList:makeClassList(),
    setAttribute(k,v){attrs[k]=String(v)},
    getAttribute(k){return attrs[k]},
    appendChild(ch){
      if(ch.parentNode){
        const idx=ch.parentNode.children.indexOf(ch);
        if(idx>=0)ch.parentNode.children.splice(idx,1);
      }
      ch.parentNode=this;
      this.children.push(ch);
      return ch;
    },
    insertBefore(ch,ref){
      ch._reparented=(ch._reparented||0)+1;
      if(ch.parentNode){
        const idx=ch.parentNode.children.indexOf(ch);
        if(idx>=0)ch.parentNode.children.splice(idx,1);
      }
      ch.parentNode=this;
      const rIdx=this.children.indexOf(ref);
      if(rIdx>=0)this.children.splice(rIdx,0,ch);
      else this.children.push(ch);
      return ch;
    },
    remove(){
      if(this.parentNode){
        const idx=this.parentNode.children.indexOf(this);
        if(idx>=0)this.parentNode.children.splice(idx,1);
        this.parentNode=null;
      }
    },
    get lastElementChild(){return this.children[this.children.length-1]||null},
    insertAdjacentHTML(pos,html){this._inserted=(this._inserted||'')+html},
    querySelector(sel){
      if(sel==='.nr-ad-160')return this.children.find(c=>String(c.className||'').includes('nr-ad-160'))||null;
      if(sel==='.nr-ad-slink')return (this._linksBox&&String(this._linksBox._inserted||'').includes('nr-ad-slink'))?{}:null;
      if(sel==='.v3links')return this._linksBox||null;
      return null;
    }
  };
  return el;
}

(async()=>{
  const storage={};
  const store={
    get:(k,d)=>k in storage?JSON.parse(JSON.stringify(storage[k])):d,
    set:(k,v)=>{storage[k]=JSON.parse(JSON.stringify(v))}
  };

  const homeTop=makeEl('div','nr-home-top');
  const nativeSec=makeEl('section','nr-native-ad');
  nativeSec.hidden=true;
  const nativeHead=makeEl('div');
  nativeHead.classList.add('nr-ad-head');
  const nativeSlink=makeEl('a','nr-native-slink');
  nativeSlink.hidden=true;
  const nativeInner=makeEl('div','container-c7aae407c5d2606d79f9479f53add952');
  nativeSec.appendChild(nativeHead);
  nativeSec.appendChild(nativeInner);

  const app=makeEl('main','app');
  const aside=makeEl('aside');
  const linksBox=makeEl('div');
  aside._linksBox=linksBox;

  const body=makeEl('body');
  body.appendChild(homeTop);
  body.appendChild(nativeSec);
  body.appendChild(app);

  const docListeners={},winListeners={};
  let activeProfile={name:'Alex',st:{}};
  let openedTabs=[];

  // Mock Supabase where key='ads' fails due to CHECK constraint, while key='announcement' succeeds!
  let sbRows={
    announcement:{value:{text:'Welcome',link:'',kind:'info',active:false},updated_at:'2026-11-01T00:00:00.000Z'}
  };
  const SB={
    from(table){
      assert.equal(table,'site_config');
      return {
        select(){
          return {
            in(col,keys){
              const data=keys.filter(k=>sbRows[k]).map(k=>({key:k,...sbRows[k]}));
              return Promise.resolve({data,error:null});
            },
            eq(col,key){
              return {
                maybeSingle(){
                  return Promise.resolve({data:sbRows[key]||null,error:null});
                }
              };
            }
          };
        },
        upsert(row){
          if(row.key==='ads'){
            return Promise.resolve({error:{message:'new row for relation "site_config" violates check constraint "site_config_key_check"'}});
          }
          sbRows[row.key]={value:row.value,updated_at:row.updated_at};
          return Promise.resolve({error:null});
        }
      };
    }
  };

  const doc={
    body,
    head:makeEl('head'),
    createElement:tag=>makeEl(tag),
    getElementById(id){
      if(id==='nr-native-ad')return nativeSec;
      if(id==='nr-native-slink')return nativeSlink;
      if(id==='nr-home-top')return homeTop;
      if(id==='app')return app;
      return null;
    },
    querySelector(sel){
      if(sel==='script[data-nr-ad="native"]')return body.children.find(c=>c.dataset&&c.dataset.nrAd==='native')||null;
      if(sel==='script[data-nr-ad="social"]')return body.children.find(c=>c.dataset&&c.dataset.nrAd==='social')||null;
      if(sel==='#md .ov2 aside')return aside;
      if(sel==='#md .nr-ad-160')return aside.querySelector('.nr-ad-160');
      return null;
    },
    addEventListener:(k,fn)=>{docListeners[k]=fn}
  };

  const win={
    location:{hash:'#home',origin:'https://nightreel.zydhir2x11.workers.dev',hostname:'nightreel.zydhir2x11.workers.dev'},
    open:(url)=>{openedTabs.push(url);return null},
    addEventListener:(k,fn)=>{winListeners[k]=fn},
    NR_ADMIN:false
  };

  let renderCount=0,detailCount=0;
  const ctx={
    window:win,
    globalThis:win,
    document:doc,
    URL,
    Date,
    Math,
    Number,
    String,
    Set,
    Promise,
    setTimeout:(fn)=>setTimeout(fn,0),
    clearTimeout,
    store,
    SB,
    C:[{i:0,tid:550,mt:'movie',v3:1}],
    q:'',
    me:()=>activeProfile,
    render(){renderCount++},
    detail(){detailCount++},
    acct(){},
    I:()=>'<svg></svg>',
    module:{exports:{}}
  };
  win.window=win;

  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('js/ads.js','utf8'),ctx);
  const ADS=ctx.module.exports;

  // 1. Default Adsterra credentials match user's exact 4 units
  const def=ADS.getConfig();
  assert.equal(def.active,true);
  assert.equal(def.socialSrc,'https://bancadeltempoidea.org/14/f5a14287da5fbb224d2b08c6981c796a');
  assert.equal(def.nativeSrc,'https://bancadeltempoidea.org/21/c7aae407c5d2606d79f9479f53add952');
  assert.equal(def.nativeContainerId,'container-c7aae407c5d2606d79f9479f53add952');
  assert.equal(def.bannerSrc,'https://bancadeltempoidea.org/22/17b8ed40c10ad08c3e5561c0f9f32bb8');
  assert.equal(def.bannerKey,'17b8ed40c10ad08c3e5561c0f9f32bb8');
  assert.equal(def.smartUrl,'https://directyp.org/4/6906911021995628340167e682dddcd1');

  // 2. Native Banner stays stationary across multiple render() calls (never re-parented!)
  assert.equal(nativeSec.hidden,false);
  assert.equal(nativeSlink.hidden,false);
  assert.equal(nativeSlink.href,'https://directyp.org/4/6906911021995628340167e682dddcd1');
  const natScript=doc.querySelector('script[data-nr-ad="native"]');
  const socScript=doc.querySelector('script[data-nr-ad="social"]');
  assert.ok(natScript,'Native script injected');
  assert.ok(socScript,'Social Bar script injected');
  natScript.onload();
  socScript.onload();

  ctx.render();
  ctx.render();
  win.location.hash='#movies';
  ctx.render();
  assert.equal(nativeSec._reparented||0,0,'Native Banner must never be re-parented in DOM');
  assert.equal(nativeSec.parentNode,body);

  // 3. Title Detail mounts same-origin ad-banner.html iframe + Partner Smartlink
  ctx.detail(0,1);
  const bannerBox=aside.querySelector('.nr-ad-160');
  assert.ok(bannerBox,'160x300 banner box mounted');
  const iframe=bannerBox.children.find(c=>c.tagName==='IFRAME');
  assert.ok(iframe,'160x300 iframe created');
  assert.ok(iframe.src.startsWith('ad-banner.html?slot=detail&seq='),'Uses real same-origin ad-banner.html');
  assert.ok(linksBox._inserted.includes('https://directyp.org/4/6906911021995628340167e682dddcd1'),'Partner offer Smartlink inserted');

  // 4. Verify ad-banner.html executes cleanly in a streaming HTML parser without doc.close() and ignores untrusted URL params
  const bannerHtml=fs.readFileSync('ad-banner.html','utf8');
  const scriptMatch=/<script[^>]*>([\s\S]*?)<\/script>/.exec(bannerHtml);
  assert.ok(scriptMatch,'ad-banner.html inline loader exists');
  let writtenHtml='',bannerEvents=[];
  const frameCtx={
    location:{search:'?slot=preview&src=https://evil.example/xss.js',origin:'https://nightreel.zydhir2x11.workers.dev'},
    URL,
    URLSearchParams,
    Math,
    Number,
    String,
    JSON,
    setTimeout:()=>{},
    localStorage:{getItem:()=>null},
    document:{
      documentElement:{style:{}},
      body:{style:{},querySelectorAll:()=>[{}]},
      write(s){writtenHtml+=s}
    },
    window:{
      parent:{
        NR_ADS:{
          getConfig:()=>ADS.getConfig(),
          _onBannerEvent:(slot,state,filled)=>bannerEvents.push({slot,state,filled})
        },
        postMessage:()=>{}
      }
    }
  };
  frameCtx.window.window=frameCtx.window;
  vm.createContext(frameCtx);
  vm.runInContext(scriptMatch[1],frameCtx);
  assert.equal(frameCtx.window.atOptions.key,'17b8ed40c10ad08c3e5561c0f9f32bb8');
  assert.equal(frameCtx.window.atOptions.width,160);
  assert.equal(frameCtx.window.atOptions.height,300);
  assert.ok(writtenHtml.includes('https://bancadeltempoidea.org/22/17b8ed40c10ad08c3e5561c0f9f32bb8'));
  assert.ok(!writtenHtml.includes('evil.example'),'Untrusted src query param ignored');
  frameCtx.window.__nrBannerDone(1);
  assert.equal(bannerEvents[0].slot,'preview');
  assert.equal(bannerEvents[0].state,'loaded');

  // 5. saveConfig() persists locally AND falls back to announcement row when site_config rejects key='ads'
  const saveRes=await ADS.saveConfig({...ADS.getConfig(),smartCapHours:4,socialOn:false});
  assert.equal(saveRes.ok,true);
  assert.equal(saveRes.synced,true);
  assert.equal(saveRes.syncMode,'announcement');
  assert.equal(ADS.getConfig().smartCapHours,4);
  assert.equal(ADS.getConfig().socialOn,false);
  assert.equal(sbRows.announcement.value.text,'Welcome','Existing announcement text preserved');
  assert.equal(sbRows.announcement.value.ads.smartCapHours,4);

  // 6. Viewer protections: protected routes & Kids profile pause ads cleanly
  win.location.hash='#admin';
  ADS.evaluate();
  assert.equal(ADS.status().gate.ok,false);
  assert.equal(nativeSec.hidden,true);
  assert.equal(body.classList.contains('nr-ads-paused'),true);

  win.location.hash='#home';
  activeProfile={name:'Kids',st:{}};
  ADS.evaluate();
  assert.equal(ADS.status().gate.code,'kids');
  assert.equal(nativeSec.hidden,true);

  // 7. Smartlink Play trigger + cooldown + resetSmartlinkCap()
  activeProfile={name:'Alex',st:{}};
  ADS.evaluate();
  assert.equal(ADS.triggerPlaySmartlink(false),true);
  assert.equal(openedTabs.length,1);
  assert.equal(ADS.triggerPlaySmartlink(false),false,'Capped within cooldown window');
  ADS.resetSmartlinkCap();
  assert.equal(ADS.triggerPlaySmartlink(false),true,'Fires again after cooldown reset');
  assert.equal(openedTabs.length,2);

  // 8. probe() clears blocked states so Re-test works after disabling adblocker
  natScript.onerror();
  assert.equal(ADS.status().anyBlocked,true);
  ADS.probe();
  assert.equal(ADS.status().slots.native.state,'loading');

  // 9. Ad-free email list: chosen email gets ZERO ads everywhere, other users still get ads
  const badVip=await ADS.addAdFreeEmail('not-an-email');
  assert.equal(badVip.ok,false);

  const addVip=await ADS.addAdFreeEmail('Friend@Example.com, second@test.org');
  assert.equal(addVip.ok,true);
  assert.deepEqual([...ADS.getConfig().adFreeEmails],['friend@example.com','second@test.org']);
  assert.equal(ADS.isAdFreeEmail('FRIEND@example.com'),true);
  assert.equal(ADS.isAdFreeEmail('stranger@example.com'),false);

  // Sign in as friend@example.com -> ALL ads immediately pause across all 4 formats
  ctx.AUTH={user:{id:'u1',email:'Friend@Example.com'},email:'Friend@Example.com'};
  ADS.evaluate();
  assert.equal(ADS.status().gate.ok,false);
  assert.equal(ADS.status().gate.code,'vip');
  assert.equal(ADS.status().userIsAdFree,true);
  assert.equal(nativeSec.hidden,true,'Native Banner hidden for ad-free email');
  assert.equal(body.classList.contains('nr-ads-paused'),true,'Social Bar paused for ad-free email');
  assert.equal(bannerBox.hidden,true,'Open 160x300 detail banner hidden immediately');
  ADS.resetSmartlinkCap();
  assert.equal(ADS.triggerPlaySmartlink(false),false,'Smartlink blocked for ad-free email');
  assert.equal(nativeSlink.hidden,true,'Partner Smartlink hidden for ad-free email');
  const freshAside=makeEl('aside');
  freshAside._linksBox=makeEl('div');
  ADS.mountDetailAds(freshAside);
  assert.equal(freshAside.querySelector('.nr-ad-160'),null,'No 160x300 banner mounted for ad-free email');
  assert.equal(freshAside._linksBox._inserted||'', '','No Partner offer link mounted for ad-free email');

  // Sign in as another user -> ads show normally!
  ctx.AUTH={user:{id:'u2',email:'visitor@example.com'},email:'visitor@example.com'};
  ADS.evaluate();
  assert.equal(ADS.status().gate.ok,true,'Non-listed email sees ads normally');
  assert.equal(nativeSec.hidden,false);

  // Remove email from ad-free list -> friend@example.com sees ads again
  ctx.AUTH={user:{id:'u1',email:'friend@example.com'},email:'friend@example.com'};
  ADS.evaluate();
  assert.equal(ADS.status().gate.code,'vip');
  const rmVip=await ADS.removeAdFreeEmail('FRIEND@EXAMPLE.COM');
  assert.equal(rmVip.ok,true);
  assert.equal(ADS.isAdFreeEmail('friend@example.com'),false);
  assert.equal(ADS.status().gate.ok,true,'Ads restored once removed from ad-free list');

  // Cold-boot localStorage sb-*-auth-token prevents ad flash before AUTH finishes booting
  await ADS.addAdFreeEmail('vipboot@example.com');
  ctx.AUTH=null;
  const rawLs={'sb-pgvtdnpblfiaptsjtixr-auth-token':JSON.stringify({user:{email:'vipboot@example.com'}})};
  win.localStorage={
    length:1,
    key:i=>Object.keys(rawLs)[i]||null,
    getItem:k=>rawLs[k]||null
  };
  ADS.evaluate();
  assert.equal(ADS.status().gate.code,'vip','Cold-boot Supabase token detected synchronously');
  delete win.localStorage;

  // 10. Guests-only switch (skipUsers): signed-in accounts get 0 ads, logged-out guests get ads
  ctx.AUTH={user:{id:'u2',email:'member@example.com'},email:'member@example.com'};
  await ADS.saveConfig({...ADS.getConfig(),skipUsers:true});
  assert.equal(ADS.status().gate.code,'signed_in');
  ctx.AUTH={user:null,email:''};
  ADS.evaluate();
  assert.equal(ADS.status().gate.ok,true,'Logged-out guest still sees ads');
  await ADS.saveConfig({...ADS.getConfig(),skipUsers:false});

  // 11. Local-only browser pause ("Only affects you") never alters global active config
  assert.equal(ADS.getDevicePause(),false);
  ADS.setDevicePause(true);
  assert.equal(ADS.getDevicePause(),true);
  assert.equal(ADS.status().gate.code,'device');
  assert.equal(ADS.getConfig().active,true,'Global config remains active for visitors');
  assert.equal(sbRows.announcement.value.ads.active,true,'Supabase config remains active for visitors');
  ADS.setDevicePause(false);
  assert.equal(ADS.status().gate.ok,true);

  // 12. Global visitor sync: when RLS allows admin upsert on key='ads' AND hides key='ads' from public SELECT,
  //     saveConfig() STILL mirrors into key='announcement' so every visitor receives live changes even with clock skew!
  let adminAdsRowSaved=false;
  SB.from=()=>({
    select:()=>({
      in:()=>Promise.resolve({
        // Public visitor RLS: only 'announcement' row is visible to anon visitors!
        data:[{key:'announcement',...sbRows.announcement}],
        error:null
      }),
      eq:()=>({maybeSingle:()=>Promise.resolve({data:sbRows.announcement,error:null})})
    }),
    upsert:(row)=>{
      if(row.key==='ads'){adminAdsRowSaved=true;sbRows.ads={value:row.value,updated_at:row.updated_at};return Promise.resolve({error:null})}
      sbRows[row.key]={value:row.value,updated_at:row.updated_at};
      return Promise.resolve({error:null});
    }
  });
  const globalSave=await ADS.saveConfig({...ADS.getConfig(),active:false,adFreeEmails:['chosen@example.com']});
  assert.equal(globalSave.ok,true);
  assert.equal(adminAdsRowSaved,true,'Saved to key=ads');
  assert.equal(sbRows.announcement.value.ads.active,false,'Also mirrored to public key=announcement for visitors');
  assert.deepEqual(sbRows.announcement.value.ads.adFreeEmails,['chosen@example.com']);

  // Simulate visitor with future-skewed local clock syncing from Supabase
  store.set('nr_ads_cfg_v2',{...ADS.DEFAULTS,active:true,updatedAt:'2099-01-01T00:00:00.000Z'});
  await ADS.loadRemote();
  assert.equal(ADS.getConfig().active,false,'Visitor applied global pause despite clock skew');
  assert.deepEqual([...ADS.getConfig().adFreeEmails],['chosen@example.com'],'Visitor synced ad-free email list');

  console.log('Adsterra integration, global sync & ad-free email tests passed');
})().catch(err=>{console.error(err);process.exitCode=1});
