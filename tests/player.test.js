// Run with: node tests/player.test.js (no dependencies required)
const assert=require('assert'),vm=require('vm'),fs=require('fs');
const handlers={},elements={};
function el(id){return elements[id]||(elements[id]={id,hidden:false,textContent:'',style:{},classList:{add(){},remove(){}},focus(){},removeAttribute(name){delete this[name]}})}
const frame=el('#player-frame');frame.contentWindow={};
const buttons=['src','xtream','vidy'].map(provider=>({dataset:{player:provider},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this[k]=fn}}));
const user={prog:{},st:{auto:1}},storage={};
const c={i:0,tid:1396,t:'A & B',mt:'tv',ty:'S',ep:5,m:50,v3:1,seasons:[{n:1,ec:3},{n:2,ec:2}]};
const context={URL,Date,Number,Math,encodeURIComponent,console, C:[c],TY:{S:'Series'},window:{addEventListener:(k,f)=>handlers[k]=f},
 document:{documentElement:{},body:{style:{}},querySelectorAll:()=>buttons,fullscreenElement:null},
 $:el,localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},getComputedStyle:()=>({getPropertyValue:()=> '#8B7BFF'}),
 needAuth:()=>true,me:()=>user,done:(p,c)=>p.ep>=c.ep&&p.t>=c.m*60*.95,save(){},render(){},toast(){},ON:()=>true,
 so:(c,ep)=>ep<=3?1:2,se:(c,ep)=>ep<=3?'S1 · E'+ep:'S2 · E'+(ep-3)};
vm.createContext(context);vm.runInContext(fs.readFileSync('js/player.js','utf8'),context);
(async()=>{
 await context.play(0,4);let url=new URL(frame.src);assert.equal(url.origin,'https://cinesrc.st');assert.equal(url.pathname,'/embed/tv/1396');assert.equal(url.searchParams.get('s'),'2');assert.equal(url.searchParams.get('e'),'1');assert.equal(url.searchParams.get('color'),'#8B7BFF');
 const message=(origin,data,source=frame.contentWindow)=>handlers.message({origin,data,source});
 message('https://evil.example',{type:'cinesrc:timeupdate',currentTime:100,duration:1000});assert.deepEqual(user.prog,{});
 message('https://cinesrc.st',{type:'cinesrc:timeupdate',currentTime:100,duration:1000},{});assert.deepEqual(user.prog,{});
 message('https://cinesrc.st',{type:'cinesrc:timeupdate',currentTime:100,duration:1000});assert.equal(user.prog[0].ep,4);assert.equal(user.prog[0].t,100);
 buttons[1].click();url=new URL(frame.src);assert.equal(url.origin,'https://cinextream.cc');assert.equal(url.pathname,'/api/embed/tv/1396/2/1');assert.equal(url.searchParams.get('title'),'A & B');assert.equal(storage.nr_player,'xtream');
 message('https://cinesrc.st',{type:'cinesrc:timeupdate',currentTime:999,duration:1000});assert.equal(user.prog[0].t,100);
 message('https://cinextream.cc',JSON.stringify({event:'time',time:25,duration:1000}));context.stop();assert.equal(user.prog[0].t,25);assert.equal(frame.src,undefined);
 await context.play(0,4);assert.equal(new URL(frame.src).origin,'https://cinextream.cc');buttons[0].click();url=new URL(frame.src);assert.equal(url.searchParams.get('t'),'25');
 message('https://cinesrc.st',{type:'cinesrc:nextepisode',season:2,episode:2,internalNavigation:true});assert.equal(el('#pep').textContent,'S2 · E2');assert.equal(new URL(frame.src).searchParams.get('e'),'1');
 message('https://cinesrc.st',{type:'cinesrc:timeupdate',currentTime:12,duration:1000});context.stop();assert.equal(user.prog[0].ep,5);assert.equal(user.prog[0].t,12);
 await context.play(0,5);buttons[2].click();url=new URL(frame.src);assert.equal(url.origin,'https://www.vidy.st');assert.equal(url.pathname,'/tv/1396/2/2');assert.equal(url.searchParams.get('color'),'8B7BFF');assert.equal(url.searchParams.get('progress'),'12');assert.equal(storage.nr_player,'vidy');
 message('https://evil.example',JSON.stringify({event:'timeupdate',currentTime:555,duration:1000}));assert.equal(user.prog[0].t,12);
 message('https://www.vidy.st',JSON.stringify({event:'timeupdate',currentTime:35,duration:1000}),{});assert.equal(user.prog[0].t,12);
 message('https://www.vidy.st',JSON.stringify({event:'timeupdate',currentTime:35,duration:1000}));context.stop();assert.equal(user.prog[0].t,35);
 await context.play(0,5);assert.equal(new URL(frame.src).origin,'https://www.vidy.st');assert.equal(new URL(frame.src).searchParams.get('progress'),'35');
 c.mt='movie';c.tid=603;c.ep=1;await context.play(0,1);url=new URL(frame.src);assert.equal(url.pathname,'/movie/603');assert.equal(url.searchParams.has('s'),false);
 console.log('Player integration tests passed');
})().catch(err=>{console.error(err);process.exitCode=1});
