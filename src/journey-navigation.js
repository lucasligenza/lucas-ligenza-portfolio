const sections=[...document.querySelectorAll('.scene')],destinationLinks=[...document.querySelectorAll('#destinations a')],names=['Earth','The Moon','Mars','Ringed World','Beyond'],stopLabels=['Departure · Earth','About · Moon','Projects · Mars','Beyond work · Rings','Contact · Beyond'];
const sceneFrames=sections.map(s=>s.querySelector('.scene-inner')),sceneCopies=sections.map(s=>s.querySelector('.departure-copy,.destination-copy'));
let clock=0,lastFrame=null,rafId=0,dirty=true,paused=false,active=-1,parallax={x:0,y:0};
let route=null,modalScroll=null,measurePending=false,measuring=false,lastScroll=window.scrollY,scrollDirection=1,initialMeasure=true,jumpAnimations=[],pendingHistoryRestore=false,historyTimer=0;
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)'),mainStage=document.querySelector('main');
const pauseButton=document.getElementById('pauseMotion'),menuButton=document.getElementById('destinationsToggle'),menu=document.getElementById('destinations'),previousButton=document.getElementById('previousStop'),nextButton=document.getElementById('nextStop');
history.scrollRestoration='manual';
document.documentElement.dataset.reduced=String(reduced);
// Preserve links shared before the ringed-world stop became Beyond work.
function destinationIndex(hash){const id=hash.replace(/^#/, '');return sections.findIndex(section=>section.id===(id==='experiments'?'beyond-work':id));}
function currentScroll(){return modalScroll??window.scrollY;}
function rememberPosition(){clearTimeout(historyTimer);historyTimer=0;if(modalScroll!==null||!route)return;const state=JourneyModel.sample(currentScroll(),route);history.replaceState({...history.state,journeyScroll:currentScroll()},'','#'+sections[state.active].id);}
function measure(){
 if(modalScroll!==null){measurePending=true;return;}if(measuring)return;measuring=true;
 const y=currentScroll(),oldRoute=route,oldState=oldRoute&&JourneyModel.sample(y,oldRoute);
 const overflows=sceneFrames.map((box,i)=>{const css=getComputedStyle(box);return Math.max(0,Math.ceil(sceneCopies[i].getBoundingClientRect().height+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)-innerHeight));});
 route=JourneyModel.layout(innerHeight,overflows,reduced);
 sections.forEach((section,i)=>{const stop=route.stops[i],height=stop.flightEnd-stop.start+(!reduced&&i===sections.length-1?innerHeight:0);section.style.height=height+'px';sceneFrames[i].style.height=(innerHeight+stop.overflow)+'px';});
 let target=y;
 if(initialMeasure){const index=destinationIndex(location.hash);target=Number.isFinite(history.state?.journeyScroll)?history.state.journeyScroll:route.stops[Math.max(0,index)].start;initialMeasure=false;}
 else if(oldState&&(oldRoute.viewportHeight!==route.viewportHeight||oldRoute.reduced!==reduced)){
  const stop=route.stops[oldState.from];target=oldState.isFlying&&!reduced?stop.orbitEnd+oldState.flightProgress*(stop.flightEnd-stop.orbitEnd):stop.start+Math.min(oldState.fromOffset,stop.overflow);
 }
 // Content edits keep the same planet, even if an earlier reading zone grew.
 else if(oldState){const stop=route.stops[oldState.from],oldStop=oldRoute.stops[oldState.from];target=oldState.isFlying?stop.orbitEnd+oldState.flightProgress*(stop.flightEnd-stop.orbitEnd):stop.start+Math.min(y-oldStop.start,stop.orbitEnd-stop.start);}
 target=Math.max(0,Math.min(route.maxScroll,target));if(Math.abs(window.scrollY-target)>.5)window.scrollTo({top:target,behavior:'instant'});
 measuring=false;measurePending=false;requestPaint();
}
function requestPaint(){dirty=true;if(!document.hidden&&!rafId)rafId=requestAnimationFrame(frame);}
function syncFlightUI(state){
 document.body.dataset.flightPhase=state.phase;mainStage.dataset.flight=String(state.isFlying);
 sections.forEach((section,i)=>{
  const opacity=i===state.from?state.fromOpacity:i===state.to?state.toOpacity:0,offset=i===state.from?state.fromOffset:state.toOffset;
  section.dataset.current=String(i===state.active);section.dataset.visible=String(reduced||opacity>.001);
  section.setAttribute('aria-hidden',String(!reduced&&opacity<=.001));section.inert=!reduced&&opacity<.5;
  sceneFrames[i].style.opacity=reduced?'1':String(opacity);sceneFrames[i].style.transform=reduced?'none':'translateY(-'+offset+'px)';
 });
 if(active!==state.active){active=state.active;destinationLinks.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});document.getElementById('locationReadout').textContent=String(active+1).padStart(2,'0')+' / '+names[active];document.body.dataset.destination=sections[active].id;}
 const previous=state.isFlying?state.from:active-1,next=state.isFlying?state.to:active+1;
 previousButton.disabled=previous<0;nextButton.disabled=next>=sections.length;
 previousButton.setAttribute('aria-label',previous<0?'At the beginning':'Go to '+stopLabels[previous]);
 nextButton.textContent=next>=sections.length?'You made it':stopLabels[next];nextButton.setAttribute('aria-label',nextButton.textContent);
 const fraction=state.isFlying?(state.from+state.blend)/4:active/4;document.getElementById('routeProgress').style.width=(fraction*100)+'%';
 document.getElementById('shipReadout').textContent=state.isFlying?names[state.from]+' ↔ '+names[state.to]+' · Scroll to fly':active===4?'Somewhere beyond. Explore a little.':reduced?'Explore, then scroll onward':'Scroll to explore · reverse to return';
}
function frame(now){
 rafId=0;if(document.hidden){lastFrame=null;return;}if(lastFrame!==null&&now-lastFrame<1000/24&&!dirty){rafId=requestAnimationFrame(frame);return;}if(!route)return;
 clock=JourneyModel.advance(clock,lastFrame,now,paused,reduced);lastFrame=now;
 const state=JourneyModel.sample(currentScroll(),route);state.direction=scrollDirection;syncFlightUI(state);
 drawUniverse(clock,state,state.from+(state.to-state.from)*state.blend,parallax);
 if(typeof JourneyDiscoveries!=='undefined')JourneyDiscoveries.update({active,phase:state.phase,isFlying:state.isFlying,time:clock,paused,reduced});
 dirty=false;if(!paused&&!reduced)rafId=requestAnimationFrame(frame);
}
function discoveryOpen(){return modalScroll!==null;}
function jumpTo(index,focus=false,push=true,exactScroll=null){
 if(!route||index<0||index>=sections.length||discoveryOpen())return false;
 const target=exactScroll??route.stops[index].start;
 if(push){rememberPosition();history.pushState({journeyScroll:target},'','#'+sections[index].id);}
 closeMenu();window.scrollTo({top:target,behavior:'instant'});syncFlightUI(JourneyModel.sample(target,route));
 if(focus)sections[index].querySelector('h1,h2')?.focus({preventScroll:true});
 jumpAnimations.forEach(animation=>animation.cancel());jumpAnimations=!reduced?[mainStage,document.getElementById('universe')].map(element=>element.animate([{opacity:.12},{opacity:1}],{duration:200,easing:'ease-out'})):[];
 lastScroll=target;requestPaint();return true;
}
addEventListener('scroll',()=>{if(modalScroll!==null)return;const y=window.scrollY;if(y!==lastScroll)scrollDirection=Math.sign(y-lastScroll);lastScroll=y;clearTimeout(historyTimer);historyTimer=setTimeout(rememberPosition,120);requestPaint();},{passive:true});
addEventListener('scrollend',rememberPosition,{passive:true});addEventListener('pagehide',rememberPosition);
// Fixed reading surfaces need document-level focus reveal for keyboard users.
document.addEventListener('focusin',e=>{
 if(reduced||!route||discoveryOpen()||!e.target.matches('a,button,input,textarea,summary')||!e.target.matches(':focus-visible'))return;
 const index=sections.findIndex(section=>section.contains(e.target));if(index<0)return;
 const state=JourneyModel.sample(currentScroll(),route);if(state.isFlying||state.active!==index)return;
 const rect=e.target.getBoundingClientRect(),top=document.querySelector('.journey-nav').getBoundingClientRect().bottom+16,bottom=innerHeight-document.querySelector('.journey-status').offsetHeight-16;
 const delta=rect.bottom>bottom?rect.bottom-bottom:rect.top<top?rect.top-top:0;
 if(delta){const stop=route.stops[index],offset=Math.max(0,Math.min(stop.overflow,state.fromOffset+delta));window.scrollTo({top:stop.start+offset,behavior:'instant'});requestPaint();}
});
previousButton.onclick=()=>{const s=JourneyModel.sample(currentScroll(),route);jumpTo(s.isFlying?s.from:s.active-1,true);};
nextButton.onclick=()=>{const s=JourneyModel.sample(currentScroll(),route);jumpTo(s.isFlying?s.to:s.active+1,true);};
pauseButton.onclick=()=>{paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.textContent=paused?'Resume ambience':'Pause ambience';lastFrame=null;requestPaint();};
reducedQuery.addEventListener('change',e=>{reduced=e.matches;document.documentElement.dataset.reduced=String(reduced);parallax={x:0,y:0};lastFrame=null;jumpAnimations.forEach(animation=>animation.cancel());measure();});
document.addEventListener('visibilitychange',()=>{lastFrame=null;if(document.hidden){if(rafId)cancelAnimationFrame(rafId);rafId=0;}else requestPaint();});
addEventListener('resize',()=>{measure();if(innerWidth>680)closeMenu();});
addEventListener('pointermove',e=>{if(reduced||paused||e.pointerType==='touch')return;parallax={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};requestPaint();},{passive:true});
addEventListener('journey:modal',e=>{modalScroll=e.detail.open?e.detail.scrollY:null;lastScroll=e.detail.scrollY;if(!e.detail.open){if(measurePending)measure();if(pendingHistoryRestore){pendingHistoryRestore=false;restoreHistory();}}requestPaint();});
function closeMenu(returnFocus=false){menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');if(returnFocus)menuButton.focus();}
menuButton.onclick=()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))closeMenu(true);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.journey-nav'))closeMenu();});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const index=destinationIndex(link.getAttribute('href'));if(index<0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();jumpTo(index,true);}));
function restoreHistory(){clearTimeout(historyTimer);historyTimer=0;if(discoveryOpen()){pendingHistoryRestore=true;return;}const index=Math.max(0,destinationIndex(location.hash));jumpTo(index,false,false,Number.isFinite(history.state?.journeyScroll)?history.state.journeyScroll:null);}
addEventListener('popstate',restoreHistory);addEventListener('hashchange',restoreHistory);
if(typeof JourneyDiscoveries!=='undefined')JourneyDiscoveries.init();
