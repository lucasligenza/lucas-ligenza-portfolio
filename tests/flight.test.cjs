const assert=require('node:assert/strict'),test=require('node:test'),model=require('../src/journey-model.js');
const H=800,route=model.layout(H,[0,120,400,200,300]);
test('each of the four flight gaps is exactly 1.5 viewports; reading adds overflow',()=>{
 for(const stop of route.stops){assert.equal(stop.orbitEnd-stop.start,240+stop.overflow);assert.equal(stop.flightEnd-stop.orbitEnd,stop.index===4?0:1200);}
 assert.equal(route.documentHeight,route.stops[4].orbitEnd+H);assert.equal(route.maxScroll,route.stops[4].orbitEnd);
});
test('small and large scrolls sample the same route with no time, queue, or automatic completion',()=>{
 const start=route.stops[0].orbitEnd,a=model.sample(start+120,route),b=model.sample(start+600,route);
 assert.equal(a.flightProgress,.1);assert.equal(b.flightProgress,.5);assert.equal(b.phase,'cruise');
 for(let i=0;i<100;i++)assert.deepEqual(model.sample(start+600,route),b);
 assert.deepEqual(model.sample(start+120,route),a,'reversing retraces the exact pose');
});
test('every leg has departure, cruise, approach and fades content at either end',()=>{
 for(const stop of route.stops.slice(0,4)){
  const sample=p=>model.sample(stop.orbitEnd+p*1200,route);
  assert.equal(sample(.08).phase,'departure');assert(sample(.08).fromOpacity>0);assert.equal(sample(.5).fromOpacity,0);assert.equal(sample(.5).toOpacity,0);
  assert.equal(sample(.9).phase,'approach');assert(sample(.9).toOpacity>0);assert.equal(model.sample(stop.flightEnd,route).active,stop.index+1);
 }
});
test('long reading areas hold the planet and reveal all content before departure',()=>{
 const stop=route.stops[2];for(const distance of [0,100,400,500,640]){const s=model.sample(stop.start+distance,route);assert.equal(s.isFlying,false);assert.equal(s.active,2);assert.equal(s.fromOffset,Math.min(distance,400));}
});
test('overscroll and short viewports remain bounded',()=>{
 assert.equal(model.sample(-500,route).active,0);const last=model.sample(1e9,route);assert.equal(last.active,4);assert.equal(last.fromOffset,300);
 const small=model.layout(300,[100,200,300,400,500]);assert.equal(small.stops[0].flightEnd-small.stops[0].orbitEnd,450);
});
test('fractional viewport anchors remain in orbit after browser pixel rounding',()=>{
 const fractional=model.layout(663,[0,16,155,162,139]);
 for(const stop of fractional.stops){const state=model.sample(Math.round(stop.start),fractional);assert.equal(state.active,stop.index);assert.equal(state.isFlying,false);}
});
test('reduced motion is five ordinary content blocks with no flight gaps',()=>{
 const reduced=model.layout(H,[0,120,400,200,300],true);assert.equal(reduced.documentHeight,5020);
 for(const stop of reduced.stops){assert.equal(stop.flightEnd,stop.orbitEnd);assert.equal(stop.orbitEnd-stop.start,H+stop.overflow);assert.equal(model.sample(stop.start,reduced).isFlying,false);}
});
test('ambient time freezes for pause/reduced and cannot advance navigation',()=>{
 assert.equal(model.advance(2,1000,1050,false,false),2.05);assert.equal(model.advance(2,1000,90000,true,false),2);assert.equal(model.advance(2,null,90000,false,false),2);assert.equal(model.advance(2,1000,90000,false,true),2);
});
