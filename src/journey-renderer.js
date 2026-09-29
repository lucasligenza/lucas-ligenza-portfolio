const canvas=document.getElementById('universe'),ctx=canvas.getContext('2d');
const source=document.createElement('canvas');source.width=1000;source.height=600;const g=source.getContext('2d',{willReadFrequently:true});
let flight={lift:0,thrust:0,phase:'standby'},flightElapsed=0,activeApp='Journey';
/* ORIGINAL_ROCKET */
const rocketFrames=[];
const initialReduced=reduced;reduced=false;
for(let frame=0;frame<5;frame++){g.clearRect(0,0,1000,600);flight.thrust=frame?1:0;drawOriginalRocket(frame*.3);const data=g.getImageData(0,0,1000,600).data,cells=[];for(let y=153;y<478;y+=9)for(let x=660;x<798;x+=6){const i=(y*1000+x)*4;if(data[i+3]<60)continue;const r=data[i],green=data[i+1],b=data[i+2],lum=(r*.2126+green*.7152+b*.0722)/255;cells.push({x:x-728,y:y-278,char:'.,:;=+*#%@'[Math.max(0,Math.min(9,Math.floor(lum*9+(rand(x+y)-.4))))],color:'rgb('+r+','+green+','+b+')'});}rocketFrames.push(cells);}flight.thrust=0;
reduced=initialReduced;
const poses=[{x:.74,y:.59,size:1.08},{x:.40,y:.68,size:.66},{x:.66,y:.69,size:.65},{x:.39,y:.70,size:.64},{x:.66,y:.68,size:.68}];
const planetPos=[{x:.86,y:.19,width:140,kind:'terrestrial'},{x:.24,y:.45,width:380,kind:'moon'},{x:.79,y:.39,width:410,kind:'rust'},{x:.23,y:.41,width:395,kind:'ringed'},{x:.79,y:.31,width:220,kind:'blue'}];
const lerp=(a,b,t)=>a+(b-a)*t,clamp01=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp01(n);return n*n*(3-2*n);};
let stars=[],galaxy=[],renderWidth=0,renderHeight=0;
function prepareSpace(w,h){
 stars=Array.from({length:Math.min(330,Math.floor(w*h/3000))},(_,i)=>({angle:rand(i*13+2)*Math.PI*2,radius:rand(i*7+1),depth:.18+rand(i*3+2)*.82,seed:i}));galaxy=[];
 // A broad edge-on stellar band, split by broken dust lanes and a bright core.
 for(let y=-90;y<h+90;y+=9)for(let x=-90;x<w+90;x+=6){const u=x/w,v=y/h,spine=.79-u*.64+Math.sin(u*5)*.055,d=(v-spine)/.16,seed=x+y*179,n=rand(seed),lane=Math.sin(u*19+v*7)+Math.sin(u*53-v*21)*.4,cloud=Math.sin(u*27+v*17)*Math.sin(v*39-u*13),core=Math.exp(-((u-.38)**2*18+(v-.54)**2*24)),dust=Math.abs(d-lane*.16)<.15?.27:1,density=(Math.exp(-d*d*.8)*(.24+cloud*.09)+core*.19)*dust;if(n>density*1.8)continue;galaxy.push({x,y,seed,density,color:Math.abs(d)>.8?0:cloud>.35?1:2,char:'.,:;=+*#@'[Math.min(8,Math.floor(density*17))]});}
 renderWidth=w;renderHeight=h;
}
function asciiRows(rows,x,y,color,size=10,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.font=size+'px Consolas,monospace';rows.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.15));ctx.restore();}
// The animation clock is shared with navigation, so holding motion freezes every glyph.
function characterOrbit(x,y,rx,ry,t,color,alpha=1,tilt=0){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.font='10px Consolas,monospace';ctx.fillStyle=color;for(let i=0;i<110;i++){const a=i/110*Math.PI*2,phase=(i/110-t*.06+100)%1;ctx.globalAlpha=alpha*(phase<.13?.85:.2);ctx.fillText(phase<.025?'+':phase<.13?':':'.',Math.cos(a)*rx,Math.sin(a)*ry);}ctx.restore();}
function planetSurface(c,kind,t){
 const nx=(c.x-25.5)/(52*8.5/24),ny=(c.y-15.5)/(32*6.7/15),r2=nx*nx+ny*ny;if(r2>1)return c;
 const z=Math.sqrt(1-r2),lon=Math.atan2(nx,z)+t*(kind==='moon'?.075:.12),lat=Math.asin(ny),noise=Math.sin(lon*5+Math.sin(lat*7))*Math.cos(lat*8-lon*2)+.4*Math.sin(lon*13+lat*17);let rgb,detail=0;
 if(kind==='terrestrial'){rgb=noise>.12?[103,166,117]:[63,119,186];if(Math.sin(lon*9+lat*16+Math.sin(lon*4))>.82)rgb=[181,199,203];}
 else if(kind==='ringed'){const band=Math.sin(lat*24+Math.sin(lon*3)*.6);rgb=band>.1?[197,155,95]:[124,96,69];}
 else if(kind==='moon'){const crater=Math.cos(lon*17+Math.sin(lat*13))*Math.sin(lat*19);rgb=crater>.5?[193,191,181]:crater<-.45?[106,110,111]:[156,160,158];detail=crater>.63?-1.3:0;}
 else if(kind==='rust'){rgb=noise>.15?[218,131,74]:[156,68,44];if(Math.abs(lat-.12*Math.sin(lon*8))<.07)rgb=[103,50,37];if(lat<-.88)rgb=[203,178,156];}
 else{rgb=noise>.1?[92,186,205]:[50,105,159];}
 const light=.27+.73*Math.max(0,-nx*.48-ny*.3+z*.78),ramp='.,:;=+*#%@';return {char:ramp[Math.max(0,Math.min(9,Math.floor(light*7+(noise+1)*.8+detail)))],color:'rgb('+rgb.map(v=>Math.round(v*light)).join(',')+')'};
}
function drawPlanet(index,alpha,w,h,t,scale=1,depth=0,depart=0){
 if(alpha<.005||scale<.005)return;const narrow=w<=680,pose=planetPos[index],p=PLANET_ASSETS[pose.kind],width=(narrow?(index===0?95:index===4?160:Math.min(w*.88,340)):Math.min(pose.width,w*.36))*scale;
 const homeX=narrow?(index===0?w*.86:w*.46):w*pose.x,homeY=narrow?(index===0?h*.52:h*.22):h*pose.y,vanishX=w*.50,vanishY=h*.40;
 const x=lerp(homeX,vanishX,depth)+(homeX-vanishX)*depart,y=lerp(homeY,vanishY,depth)+(homeY-vanishY)*depart,cell=width/52,line=cell*1.48;
 ctx.save();ctx.globalAlpha=alpha;ctx.font=Math.max(2,line*.95)+'px Consolas,monospace';
 for(const c of p){const surface=planetSurface(c,pose.kind,t);ctx.fillStyle=surface.color;ctx.fillText(surface.char,x+(c.x-25.5)*cell,y+(c.y-15.5)*line);}ctx.restore();
 const detailAlpha=alpha*ease((scale-.2)/.6),unit=(narrow?8:11)*scale;
 if(index===1){characterOrbit(x,y,width*.53,width*.30,t,'#a4b5ba',detailAlpha*.7,-.3);const a=t*.25;asciiRows(['  _','=[#]=','  +'],x+Math.cos(a)*width*.49,y+Math.sin(a)*width*.28,'#abb6b9',unit,detailAlpha);asciiRows(['    _',' .-/_\\-.',' |[___]|','_/|___|\\_'],x-width*.21,y+width*.27,'#adb1a8',unit,detailAlpha*.85);}
 if(index===2){characterOrbit(x,y,width*.54,width*.30,t,'#c49673',detailAlpha*.65,-.35);const a=t*.19;asciiRows(['+---+','|:::|','+---+'],x+Math.cos(a)*width*.5,y+Math.sin(a)*width*.29,'#c8a17a',unit,detailAlpha*.8);asciiRows(['  ___','=[:::]--',' o---o'],x-width*.27,y+width*.23,'#b49878',unit,detailAlpha*.8);}
 if(index===3){characterOrbit(x,y,width*.57,width*.37,t,'#b7a477',detailAlpha*.5,-.14);for(let ray=0;ray<18;ray++){const a=t*.42;asciiRows(['.:+*'[ray%4]],x+Math.cos(a)*ray*width/35,y+Math.sin(a)*ray*width/48,'#d2be8b',Math.max(4,unit*.8),detailAlpha*(1-ray/20)*.45);}asciiRows(['       .','    .-(_)-.','     / | \\','   _/  |  \\_','  |__|_|_|__|','   /_______\\'],x-width*.20,y+width*.22,'#b7a884',unit,detailAlpha*.8);}
 if(index===4){for(let pulse=0;pulse<3;pulse++){const phase=(t*.24+pulse/3)%1;characterOrbit(x,y,width*(.4+phase),width*(.3+phase*.7),0,'#7bd2e5',detailAlpha*(1-phase)*.7);}asciiRows(['      \\ | /','       \\|/',' [::::]-(o)-[::::]','        /|\\','       / | \\','         |','      .--+--.','       \\   /','        \\_/','         |','     ____|____'],x-width*.53,y+width*.20,'#749eb6',unit*1.2,detailAlpha*.95);}
}
function drawStarTunnel(time,state,w,h){
 const travel=reduced?0:state.travel,vx=w*.5,vy=h*.4,progress=state.isFlying?state.flightProgress:0;
 ctx.font='9px Consolas,monospace';
 for(const star of stars){const phase=(star.radius+progress*4)%1,radius=.03+phase*phase*1.35,dx=Math.cos(star.angle)*w*.75,dy=Math.sin(star.angle)*h*.88,x=vx+dx*radius,y=vy+dy*radius,twinkle=.8+.2*Math.sin(time*.7+star.seed);
  if(x<0||x>w||y<0||y>h)continue;
  const tails=Math.floor(travel*(6+star.depth*12)),brightness=(.18+star.depth*.45)*twinkle;
  for(let tail=tails;tail>=0;tail--){const distance=tail*(.004+phase*.003),alpha=tail?travel*brightness*(1-tail/(tails+1))*.82:brightness;ctx.fillStyle='rgba(174,200,220,'+alpha+')';ctx.fillText(tail===0?(star.depth>.83?'+':'.'):tail%5===0?'+':':',x-dx*distance,y-dy*distance);}
 }
}
function drawShip(time,state,w,h,parallax){
 const narrow=w<=680,from=poses[state.from],to=poses[state.to],p=state.flightProgress||0,travel=reduced?0:state.travel;
 const anchor=pose=>({x:w*(narrow?(pose===poses[0]?.73:.81):pose.x),y:h*(narrow?(pose===poses[0]?.72:.29):pose.y),size:narrow?(pose===poses[0]?.70:.40):pose.size*Math.min(1.15,h/820)}),a=anchor(from),b=anchor(to);
 let x=a.x,y=a.y,scale=a.size;
 if(state.isFlying){const departure=ease(p/.23),arrival=ease((p-.74)/.26),cruise=clamp01((p-.23)/.51),cx=w*lerp(.61,.56,cruise),cy=h*lerp(.63,.54,cruise),cs=(narrow?.64:.76)*lerp(1,.82,cruise);x=lerp(lerp(a.x,cx,departure),b.x,arrival);y=lerp(lerp(a.y,cy,departure),b.y,arrival);scale=lerp(lerp(a.size,cs,departure),b.size,arrival);}
 // Transit position is entirely scroll-driven; only exhaust and twinkles use time.
 if(!state.isFlying){x+=Math.sin(time*.7)*4;y+=Math.sin(time*1.25)*6;}
 const inward=Math.atan2(w*.5-x,y-h*.36),angle=travel*Math.max(-.58,Math.min(.58,inward))+(state.isFlying?0:Math.sin(time*.85)*.018),foreshorten=travel*.46;
 ctx.save();ctx.translate(x+parallax.x*3,y+parallax.y*2);ctx.rotate(angle);ctx.scale(scale,scale);
 // A narrowing nose and a wider, nearer engine change the silhouette in depth.
 const project=(px,py)=>{const axial=clamp01((py+125)/270),perspective=lerp(1,lerp(.59,1.30,axial),travel);return {x:px*perspective,y:py*(1-foreshorten),size:lerp(1,perspective,travel*.7)};};
 const engine=project(0,143);ctx.font='9px Consolas,monospace';
 for(let i=0;i<(narrow?70:110);i++){const age=(time*(.72+travel*.85)+rand(i*11))%1,spread=7+age*(24+travel*78),plume=age*(95+travel*210),side=(rand(i*13)-.5)*spread;ctx.globalAlpha=(1-age)*(.32+travel*.5);ctx.fillStyle=i%3?'#d39b59':'#ead296';ctx.fillText(age<.23?'*':age<.52?'+':age<.78?':':'.',engine.x+side,engine.y+plume);}
 ctx.globalAlpha=1;const frame=!reduced?1+Math.floor(time*8)%4:0;
 for(const cell of rocketFrames[frame]){if(travel>.15&&cell.y>142)continue;const q=project(cell.x,cell.y);ctx.fillStyle='#080f1b';ctx.fillRect(q.x-1,q.y,Math.max(4,7*q.size),Math.max(5,10*(1-foreshorten)));ctx.fillStyle=cell.color;ctx.font=(9*q.size*(1-foreshorten*.3))+'px Consolas,monospace';ctx.fillText(cell.char,q.x,q.y);}
 if(travel>.2){asciiRows(['.:::.',':*@*:',' ::: '],engine.x-14,engine.y-8,'#f0d18a',8,travel*.9);}
 ctx.restore();
}
function drawUniverse(time,state,scroll,parallax){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);if(w!==renderWidth||h!==renderHeight){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);prepareSpace(w,h);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.textBaseline='top';
 const p=state.flightProgress||0,travel=reduced?0:state.travel,journey=lerp(state.from,state.to,state.blend),galaxyScale=1+travel*.075;
 ctx.save();ctx.translate(w*.5,h*.4);ctx.scale(galaxyScale,galaxyScale);ctx.translate(-w*.5,-h*.4);ctx.font='8px Consolas,monospace';
 for(const c of galaxy){const alpha=(.23+Math.min(.48,c.density*1.1))*(state.active===0?.90:.70)*(1+travel*.28),color=c.color===0?'97,135,174':c.color===1?'166,132,144':'158,170,180';ctx.fillStyle='rgba('+color+','+alpha+')';ctx.fillText(c.char,c.x+Math.sin(time*.06+c.y*.003)*5+parallax.x*4-journey*8,c.y+Math.cos(time*.07+c.x*.003)*4+parallax.y*3+journey*5);}ctx.restore();
 drawStarTunnel(time,state,w,h);
 // Character comets quietly cross the far edge of the Milky Way between flights.
 if(!state.isFlying){for(let comet=0;comet<2;comet++){const age=(time*.045+comet*.51)%1,cx=w*(.61+age*.43),cy=h*(.04+age*.43);for(let tail=0;tail<18;tail++){ctx.fillStyle='rgba(152,195,211,'+((1-tail/18)*.6)+')';ctx.fillText(tail===0?'*':tail<4?'+':'.',cx-tail*5,cy-tail*3);}}}

 // Shade only the reading area while a destination is present; the cruise opens up.
 const shade=ctx.createLinearGradient(0,0,w,0),textVisibility=state.isFlying?Math.max(1-ease(p/.16),ease((p-.9)/.1)):1;
 if(state.active===1||state.active===3){shade.addColorStop(0,'#080f1b00');shade.addColorStop(.55,'#080f1b33');shade.addColorStop(1,'#080f1bdd');}else{shade.addColorStop(0,'#080f1bcc');shade.addColorStop(.52,'#080f1b33');shade.addColorStop(1,'#080f1b00');}ctx.globalAlpha=textVisibility;ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
 if(state.isFlying){const departure=ease(p/.24),approach=ease((p-.53)/.47);drawPlanet(state.from,1-departure,w,h,time,1+departure*.65,0,departure*.7);drawPlanet(state.to,ease((p-.51)/.14),w,h,time,lerp(.035,1,approach),1-approach,0);}else drawPlanet(state.active,1,w,h,time);
 if(w>680&&!state.isFlying&&state.active!==0)asciiRows([' .::+.','::*#=:'," ':=: "],w*.50,h*.82,'#566679',8,.4);
 drawShip(time,state,w,h,parallax);
}
