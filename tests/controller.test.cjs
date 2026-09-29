const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),vm=require('node:vm'),JourneyModel=require('../src/journey-model.js');
const source=fs.readFileSync(__dirname+'/../src/journey-navigation.js','utf8');
function harness({reduced=false,hash=''}={}){
 const events=new Map(),docEvents=new Map(),mediaEvents=new Map(),frames=new Map(),elements=new Map();let next=0,now=0,drawn=null;
 const add=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
 const emit=(map,type,event={})=>(map.get(type)||[]).forEach(fn=>fn(event));
 function element(id){const attributes=new Map(),classes=new Set();return {id,dataset:{},style:{},inert:false,offsetHeight:65,textContent:'',disabled:false,
 setAttribute(k,v){attributes.set(k,v);},getAttribute(k){return attributes.get(k);},removeAttribute(k){attributes.delete(k);},
 getBoundingClientRect(){return {height:500,top:100,bottom:600};},querySelector(selector){return selector==='.scene-inner'?this.box:selector==='.departure-copy,.destination-copy'?this.copy:this.heading;},
 addEventListener(type,fn){this[type]=fn;},focus(){document.activeElement=this;},contains(target){return target===this.copy;},animate(){return {cancel(){}};},
 classList:{add(v){classes.add(v);},remove(v){classes.delete(v);},contains(v){return classes.has(v);},toggle(v,on){if(on)classes.add(v);else classes.delete(v);}}};}
 const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id);};
 const sections=['departure','about','projects','beyond-work','contact'].map(id=>{const s=get(id);s.box=get(id+'-box');s.copy=get(id+'-copy');s.heading=get(id+'-heading');return s;});
 const links=sections.map(s=>{const link=element(s.id+'-link');link.setAttribute('href','#'+s.id);return link;});
 const document={hidden:false,body:get('body'),documentElement:get('html'),activeElement:null,querySelector:selector=>get(selector),querySelectorAll:selector=>selector==='.scene'?sections:links,getElementById:get,addEventListener:(type,fn)=>add(docEvents,type,fn)};
 const location={hash},entries=[{hash,state:null}];let position=0;
 const history={state:null,replaceState(state,_title,newHash){this.state=state;entries[position]={state,hash:newHash};location.hash=newHash;},pushState(state,_title,newHash){entries.splice(position+1);entries.push({state,hash:newHash});position++;this.state=state;location.hash=newHash;}};
 const context={JourneyModel,document,location,history,reduced,innerHeight:800,innerWidth:1200,scrollY:0,scrollX:0,Math,Number,setTimeout(){return 1;},clearTimeout(){},
 getComputedStyle:()=>({paddingTop:'90',paddingBottom:'90'}),matchMedia:()=>({matches:reduced,addEventListener:(type,fn)=>add(mediaEvents,type,fn)}),
 addEventListener:(type,fn)=>add(events,type,fn),requestAnimationFrame(fn){const id=++next;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},
 scrollTo({top}){context.scrollY=top;},drawUniverse(_time,state){drawn=state;},JourneyDiscoveries:{init(){},update(){}}};context.window=context;
 vm.createContext(context);vm.runInContext(source+'\nthis.api={measure,jumpTo,get:()=>({clock,route,modalScroll})};',context);
 function tick(){now+=50;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}
 context.api.measure();tick();
 return {api:context.api,get,context,sections,links,events,document,tick,
 scroll(y){context.scrollY=y;emit(events,'scroll');tick();},modal(open,y){emit(events,'journey:modal',{detail:{open,scrollY:y}});},
 visibility(hidden){document.hidden=hidden;emit(docEvents,'visibilitychange');},reduce(value){emit(mediaEvents,'change',{matches:value});tick();},
 back(){position--;history.state=entries[position].state;location.hash=entries[position].hash;emit(events,'popstate');emit(events,'hashchange');tick();},
 get state(){return drawn;},get scheduled(){return frames.size;}};
}
test('controller uses native scroll; no wheel or touch interception',()=>{
 const h=harness();for(const name of ['wheel','touchstart','touchend','keydown'])assert.equal(h.events.has(name),false);
 h.scroll(800);const before=h.state.flightProgress;for(let i=0;i<20;i++)h.tick();assert.equal(h.state.flightProgress,before);h.scroll(600);assert(h.state.flightProgress<before);
});
test('pause stops ambience but scroll and direct navigation still work',()=>{
 const h=harness();h.get('pauseMotion').onclick();h.tick();const time=h.api.get().clock;assert.equal(h.scheduled,0);
 h.scroll(800);assert.equal(h.state.phase,'cruise');assert.equal(h.api.get().clock,time);assert.equal(h.api.jumpTo(3),true);h.tick();assert.equal(h.state.active,3);assert.equal(h.get('nextStop').disabled,false);
});
test('direct navigation is immediate, responsive midflight and Back restores exact scroll',()=>{
 const h=harness();h.scroll(800);h.api.jumpTo(3,true);h.tick();assert.equal(h.state.active,3);assert.equal(h.state.isFlying,false);h.back();assert.equal(h.context.scrollY,800);assert.equal(h.state.phase,'cruise');
});
test('deep links resolve after measurement and reduced motion collapses gaps',()=>{
 const h=harness({hash:'#projects'});assert.equal(h.state.active,2);assert.equal(h.context.scrollY,h.api.get().route.stops[2].start);h.reduce(true);assert.equal(h.state.active,2);assert.equal(h.state.isFlying,false);assert.equal(h.api.get().route.documentHeight,4000);assert.equal(h.scheduled,0);
});
test('old Experiments links and the new Beyond work link reach the same planet',()=>{
 for(const hash of ['#experiments','#beyond-work']){
  const h=harness({hash});assert.equal(h.state.active,3);assert.equal(h.context.scrollY,h.api.get().route.stops[3].start);
  h.api.jumpTo(4);h.tick();h.back();assert.equal(h.state.active,3);
 }
});
test('modal uses frozen scroll and defers geometry and Back until close',()=>{
 const h=harness();h.scroll(300);h.api.jumpTo(2);h.tick();const saved=h.context.scrollY;h.modal(true,saved);h.scroll(0);assert.equal(h.state.active,2);
 const before=h.api.get().route;h.api.measure();assert.equal(h.api.get().route,before);h.back();assert.equal(h.state.active,2);
 h.context.scrollY=saved;h.modal(false,saved);h.tick();assert.equal(h.context.scrollY,300);assert.equal(h.state.from,0);
});
test('hidden pages stop drawing and resume without consuming hidden time',()=>{
 const h=harness();h.tick();const before=h.api.get().clock;h.visibility(true);assert.equal(h.scheduled,0);h.tick();h.visibility(false);h.tick();assert.equal(h.api.get().clock,before);h.tick();assert(h.api.get().clock>before);
});
