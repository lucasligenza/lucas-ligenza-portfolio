function planet(kind,{columns=24,rows=15}={}){
 const colors={terrestrial:[[39,109,153],[68,122,75]],ringed:[[167,119,51],[195,158,92]],moon:[[103,102,135],[141,140,165]],blue:[[33,108,183],[73,175,194]],rust:[[172,73,44],[202,123,69]]};
 let out='';for(let j=0;j<rows;j++){for(let i=0;i<columns;i++){
 const x=(i-(columns-1)/2)/(columns*8.5/24),y=(j-(rows-1)/2)/(rows*6.7/15),r=x*x+y*y,ring=kind==='ringed'&&Math.abs(Math.sqrt(x*x+(y+x*.31)**2*10)-1.34)<.11;
 if(r>1&&!ring){out+=' ';continue;}
 const z=Math.sqrt(Math.max(0,1-r)),light=.32+.68*Math.max(0,-x*.55-y*.4+z*.65),terrain=Math.sin(x*9+y*3)+Math.sin(y*12-x*5)+Math.cos(x*17+y*11)*.4;
 let c=colors[kind][0],v=light,ch;
 if(kind==='terrestrial'){if(terrain>.5)c=colors[kind][1];if(y<-.77||Math.sin(y*21+x*8)>.92)c=[184,202,201];}
 if(kind==='ringed'){c=colors[kind][Math.sin(y*29)>0?1:0];v*=.86+.14*Math.cos(y*35);}
 if(kind==='moon'){const crater=[[.25,.2,.23],[-.35,-.3,.19],[-.25,.5,.13],[.45,-.5,.12]].find(([a,b,s])=>Math.hypot(x-a,y-b)<s);if(crater){v*=.53;ch=Math.hypot(x-crater[0],y-crater[1])>crater[2]*.65?'o':':';}}
 if(kind==='blue'){c=colors[kind][Math.sin(y*19+x*4)>.55?1:0];v*=.84+.16*Math.sin(y*25+x*4);}
 if(kind==='rust'){if(terrain>.4)c=colors[kind][1];if(Math.abs(y-.13*Math.sin(x*8))<.08)v*=.55;}
 if(ring&&(r>1||y>-.1)){c=[158,124,68];v=.8;ch='=';}
 ch??='.:=+*#%@'[Math.min(7,Math.floor(v*7))];const color=c.map(n=>Math.round(n*(.57+v*.55)));
 out+='<span style="color:rgb('+color.join(',')+')">'+ch+'</span>';
 }out+=j===rows-1?'':'\n';}return '<pre class="ascii-planet" aria-hidden="true">'+out+'</pre>';
}

module.exports = { planet };
