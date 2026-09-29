(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 // All distances are document pixels. No elapsed time participates in navigation.
 function layout(viewportHeight,overflows,reduced=false){
  const height=Math.max(1,Number(viewportHeight)||1);let cursor=0;
  const stops=overflows.map((value,index)=>{
   const overflow=Math.max(0,Number(value)||0),start=cursor;
   const orbitEnd=start+overflow+height*(reduced?1:.3);
   const flightEnd=orbitEnd+(!reduced&&index<overflows.length-1?height*1.5:0);
   cursor=flightEnd;return {index,start,orbitEnd,flightEnd,overflow};
  });
  const documentHeight=cursor+(reduced?0:height);
  return {stops,viewportHeight:height,documentHeight,maxScroll:Math.max(0,documentHeight-height),reduced};
 }
 function sample(scrollY,route){
  const y=clamp(Number(scrollY)||0,0,route.maxScroll),stops=route.stops;
  // Browser scroll coordinates may round fractional viewport distances to pixels.
  let stop=stops[0];for(const candidate of stops){if(y>=candidate.start-.75)stop=candidate;else break;}
  const orbit={from:stop.index,to:stop.index,active:stop.index,blend:0,travel:0,flightProgress:0,isFlying:false,phase:'orbit',direction:1,fromOpacity:1,toOpacity:0,fromOffset:clamp(y-stop.start,0,stop.overflow),toOffset:0};
  if(route.reduced||y<=stop.orbitEnd||stop.index===stops.length-1)return orbit;
  const p=clamp((y-stop.orbitEnd)/(stop.flightEnd-stop.orbitEnd),0,1);
  return {from:stop.index,to:stop.index+1,active:p<.5?stop.index:stop.index+1,blend:ease(p),travel:p<.2?ease(p/.2):p<.75?1:1-ease((p-.75)/.25),flightProgress:p,isFlying:true,phase:p<.2?'departure':p<.75?'cruise':'approach',direction:1,fromOpacity:1-ease(p/.16),toOpacity:ease((p-.84)/.16),fromOffset:stop.overflow,toOffset:0};
 }
 function advance(clock,last,now,paused,reduced){return clock+(!paused&&!reduced&&last!==null?Math.min(.1,Math.max(0,(now-last)/1000)):0);}
 root.JourneyModel={layout,sample,advance};if(typeof module!=='undefined')module.exports=root.JourneyModel;
})(typeof globalThis!=='undefined'?globalThis:this);
