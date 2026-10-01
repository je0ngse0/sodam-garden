import { FLOWERS, CATS, progress, FEED_INTERVAL } from './model.js';
import { WORLD, BED, POND, PLOT_COUNT, plotPosition } from './layout.js';
const W = WORLD.width, H = WORLD.height;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function createPainter(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0;
  function ellipse(x,y,rx,ry,color,rotation=0) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function line(points,color,size=2) {ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function shape(points,color) {ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function round(x,y,w,h,r,color) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
  function bush(x,y,s,color) {ellipse(x,y+13*s,46*s,13*s,'#7e986326');for(let i=0;i<7;i++)ellipse(x+(hash(i+10)-.5)*65*s,y+(hash(i+40)-.5)*25*s,(18+hash(i+70)*12)*s,(19+hash(i+90)*15)*s,color);}
  function flower(x,y,type,size=1,sway=0) {
    const f=FLOWERS.find(v=>v.id===type);ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    line([[0,0],[sway*.4,-23],[sway,-52]],'#6e8853',3);
    ellipse(-9,-20,12,5,'#8a9c65',.55);ellipse(10,-31,13,5,'#7e975b',-.6);
    if(type==='daisy') {for(let j=0;j<9;j++){const a=j*Math.PI*2/9;ellipse(sway+Math.cos(a)*11,-55+Math.sin(a)*11,8,4.5,f.color,a);}ellipse(sway,-55,6,6,f.center);}
    if(type==='tulip') {ellipse(sway,-54,13,16,f.color);shape([[sway-13,-61],[sway-13,-74],[sway-4,-65],[sway,-76],[sway+5,-65],[sway+13,-73],[sway+13,-59]],f.color);line([[sway,-62],[sway+1,-47]],'#c77e75',1);}
    if(type==='lavender') {for(let j=0;j<6;j++){ellipse(sway-4,-44-j*6,5,4,j%2?f.color:'#b2a5cd',-.4);ellipse(sway+4,-47-j*6,5,4,f.color,.4);}ellipse(sway,-81,4,6,'#b7abd0');}
    ctx.restore();
  }
  function cat(x,y,id,t,pet,sleeping,walking,direction) {
    const c=CATS.find(v=>v.id===id);if(!c)return;
    const bob=Math.sin(t/1200)*1.5;ctx.save();ctx.translate(x,y+bob);
    ellipse(0,37,45,10,'#6c805529');
    if (sleeping) {
      ellipse(0,19,38,23,c.color);ellipse(-23,11,21,18,c.color);
      shape([[-42,6],[-40,-15],[-24,-2]],c.color);
      shape([[-25,-2],[-12,-13],[-8,9]],c.color);
      line([[-36,11],[-30,14],[-25,11]],'#6e6056',1.5);
      ctx.beginPath();ctx.arc(13,20,19,-1,2.6);ctx.strokeStyle=id==='night'?'#96909c':'#f2d6ac';ctx.lineWidth=9;ctx.stroke();
      ctx.fillStyle='#82906f';ctx.font='italic 15px Georgia';ctx.fillText('z z',-8,-24-Math.sin(t/1600)*2);
      ctx.restore();return;
    }
    if(walking) { ctx.scale(direction,1);ctx.translate(0,Math.sin(t/140)*1.7); }
    ctx.beginPath();ctx.moveTo(22,21);ctx.bezierCurveTo(65,37,56,-11,42,0);ctx.strokeStyle=c.color;ctx.lineWidth=13;ctx.lineCap='round';ctx.stroke();
    ellipse(0,15,28,30,c.color);ellipse(-9,39,12,6,c.color);ellipse(13,39,12,6,c.color);
    shape([[-25,-15],[-23,-45],[-6,-27]],c.color);shape([[6,-27],[23,-45],[25,-15]],c.color);
    shape([[-20,-23],[-20,-38],[-11,-26]],'#dba79a');shape([[11,-26],[20,-38],[20,-23]],'#dba79a');
    ellipse(0,-14,29,25,c.color);ellipse(0,-2,17,11,id==='night'?'#b3abb0':'#f5dfbc');
    line([[-16,-14],[-12,-11],[-8,-14]],'#605344',2);line([[8,-14],[12,-11],[16,-14]],'#605344',2);
    shape([[-3,-6],[3,-6],[0,-2]],'#a97974');line([[0,-2],[0,1],[-4,3]],'#8d7163',1);line([[0,1],[4,3]],'#8d7163',1);
    line([[-18,-3],[-33,-5]],'#968470',1);line([[-18,1],[-33,4]],'#968470',1);line([[18,-3],[33,-5]],'#968470',1);line([[18,1],[33,4]],'#968470',1);
    if(pet){ctx.fillStyle='#c9857d';ctx.font='25px serif';ctx.fillText('♥',-8,-59-Math.sin(t/130)*3);}
    ctx.restore();
  }
  function fish(x, y, angle, color, t, index) {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ellipse(2,5,23,9,'#416f7118');
    shape([[-15,0],[-28,-10+Math.sin(t/170+index)*3],[-25,10+Math.sin(t/170+index)*3]],color);
    ellipse(0,0,20,9,color);ellipse(5,-1,8,7,'#fff2d3b0');
    shape([[-3,4],[-5,15],[6,6]],color);ellipse(14,-2,1.5,1.5,'#506566');
    ctx.restore();
  }
  function pond(state,time) {
    const {x,y,rx,ry}=POND;
    ellipse(x,y+9,rx+16,ry+12,'#829a7330');
    ellipse(x,y,rx+12,ry+10,'#cccab0');
    for(let i=0;i<18;i++){const a=i*Math.PI*2/18;ellipse(x+Math.cos(a)*(rx+5),y+Math.sin(a)*(ry+4),15+hash(i)*7,10+hash(i+1)*5,i%2?'#dedcc4':'#b9bea6',a+.6);}
    ellipse(x,y,rx,ry,'#9cbbb4');
    const water=ctx.createRadialGradient(x-30,y-30,10,x,y,rx);water.addColorStop(0,'#bad8ca');water.addColorStop(1,'#83aaa5');
    ellipse(x,y,rx-5,ry-5,water);
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx-6,ry-6,0,0,Math.PI*2);ctx.clip();
    for(let i=0;i<7;i++){const yy=y-90+i*31;line([[x-100+Math.sin(time/2300+i)*10,yy],[x-60+Math.sin(time/2300+i)*10,yy]],'#e3f0d943',2);}
    const elapsed=state.pond.lastFedAt===null?Infinity:Math.max(0,Date.now()-state.pond.lastFedAt);
    const eating=elapsed<FEED_INTERVAL;
    const gather=eating?Math.min(1,elapsed/2500):Math.max(0,1-(elapsed-FEED_INTERVAL)/3000);
    for(let i=0;i<3;i++){
      const a=time/6500+i*Math.PI*2/3;
      const cruise={x:x+Math.cos(a)*(75-i*8),y:y+Math.sin(a)*(61-i*5)};
      const target={x:x+Math.cos(i*2.1)*25,y:y+Math.sin(i*2.1)*20};
      const xx=cruise.x*(1-gather)+target.x*gather,yy=cruise.y*(1-gather)+target.y*gather;
      const heading=gather>.5?Math.atan2(y-yy,x-xx):Math.atan2(Math.cos(a)*60,-Math.sin(a)*75);
      fish(xx,yy,heading,['#f4d5a0','#d99478','#d7ebe1'][i],time,i);
    }
    if(eating){
      const fade=1-elapsed/FEED_INTERVAL;
      ctx.globalAlpha=fade;
      for(let i=0;i<12;i++)ellipse(x+(hash(i+40)-.5)*60,y+(hash(i+70)-.5)*45,2.8,2,'#a98955');
      ctx.globalAlpha=1;
      for(let i=0;i<3;i++){const radius=8+(elapsed/60+i*22)%80;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.65,0,0,Math.PI*2);ctx.strokeStyle=`rgba(235,250,234,${.35*(1-radius/90)})`;ctx.lineWidth=1.5;ctx.stroke();}
    }
    ellipse(x-75,y-53,23,13,'#789b78',-.3);shape([[x-75,y-53],[x-52,y-56],[x-54,y-46]],'#a9c6b5');
    ellipse(x+79,y+42,23,13,'#86a581',.3);flower(x+79,y+44,'daisy',.27,0);
    ctx.restore();
    for(let i=0;i<5;i++){const xx=x+102+i*5,yy=y-65+i*7;line([[xx,yy],[xx-7,yy-40-hash(i)*10]],'#83966d',2);ellipse(xx-7,yy-42-hash(i)*10,3,8,'#a69970');}
  }
  return function paint(state, time, cats, particles, realTime) {
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    if(rect.width!==width||rect.height!==height){width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle='#dce6ca';ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(600,100,0,470,280,650);glow.addColorStop(0,'#f4efcf80');glow.addColorStop(1,'#c6d7ae40');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    for(let i=0;i<290;i++)ellipse(hash(i)*W,hash(i+250)*H,1.1,.7,'#8b9d6425');
    // A continuous path leaves room for the cats around the enlarged bed.
    ctx.beginPath();ctx.moveTo(690,-20);ctx.bezierCurveTo(640,140,720,240,700,440);ctx.bezierCurveTo(670,620,750,645,1040,665);ctx.strokeStyle='#e9e5ca';ctx.lineWidth=58;ctx.stroke();
    round(75,76,830,9,3,'#c5c3a1');round(75,104,830,8,3,'#c8c6a5');
    for(let i=0;i<18;i++){const x=80+i*48;shape([[x,129],[x, 60],[x+8,50],[x+17,60],[x+17,129]],'#dfdbb7');}
    bush(40,65,1.6,'#a9bd89');bush(180,38,1,'#b7c997');bush(958,80,1.6,'#a9bb85');
    shape([[28,230],[45,230],[53,66],[35,66]],'#a49a74');
    for(let i=0;i<11;i++)ellipse(20+(hash(i+5)-.3)*135,20+hash(i+8)*95,43,37,i%3?'#b3c793':'#a6be87');
    bush(12,666,1.1,'#aec18c');bush(980,688,1.4,'#bacc9b');
    // A quiet bench beside the pond.
    round(775,171,113,10,3,'#b9ac82');round(775,185,113,10,3,'#cdbb91');round(771,202,122,13,4,'#d7c49b');
    line([[786,212],[782,235]],'#a59e7d',7);line([[878,212],[881,235]],'#a59e7d',7);
    ellipse(915,225,23,6,'#8d976b25');shape([[900,202],[931,202],[926,225],[905,225]],'#c79474');ellipse(915,202,18,5,'#d7a889');flower(915,202,'tulip',.55,0);
    pond(state,time);
    const {x:bx,y:by,width:bw,height:bh}=BED;
    round(bx-13,by-5,bw+26,bh+23,23,'#9e926c25');round(bx-11,by-13,bw+22,bh+25,20,'#c5af83');round(bx-3,by-4,bw+6,bh+8,14,'#ab936b');
    line([[bx+3,by-7],[bx+bw-3,by-7]],'#e0cda2',3);line([[bx,by+bh+7],[bx+bw,by+bh+7]],'#af966d',5);
    for(let i=0;i<PLOT_COUNT;i++){
      const {x,y}=plotPosition(i),p=state.plots[i];
      ellipse(x,y+3,40,23,p&&p.wateredAt!==null?'#917e5c':'#a18a64');ellipse(x,y,39,20,p&&p.wateredAt!==null?'#978260':'#ad966e');
      for(let j=0;j<6;j++)ellipse(x+(hash(i*7+j)-.5)*59,y+(hash(i*7+j+90)-.5)*26,1.4,1,'#d9c39660');
      if(!p){line([[x-4,y],[x+4,y]],'#dfcfa779',1.5);line([[x,y-4],[x,y+4]],'#dfcfa779',1.5);continue;}
      const growth=progress(p),sway=Math.sin(time/1700+i)*2;
      if(growth===1){flower(x-13,y-2,p.flower,.63,sway);flower(x+13,y+6,p.flower,.7,-sway);flower(x,y+8,p.flower,.92,sway);}
      else {const s=.4+growth*.65;line([[x,y+3],[x,y-12-25*growth]],'#718750',3);ellipse(x-7*s,y-10-10*growth,12*s,5*s,'#91a463',.5);ellipse(x+8*s,y-16-12*growth,13*s,5*s,'#819953',-.55);if(growth>.55)ellipse(x,y-15-27*growth,6,8,FLOWERS.find(f=>f.id===p.flower).color);if(p.wateredAt===null){ctx.fillStyle='#f4dfb5';ctx.font='14px serif';ctx.textAlign='center';ctx.fillText('◦',x,y-40);}else {round(x-16,y+21,32,3,2,'#756d5140');round(x-16,y+21,Math.max(1,32*growth),3,2,'#c6d09d');}}
    }
    // Meadow, stepping stones and a little basket.
    for(let i=0;i<24;i++){const x=65+i*36+hash(i)*13,y=710+hash(i+40)*20;line([[x,y],[x-2,y-8]],'#a2b582',1.5);if(i%3===0){ellipse(x-2,y-9,3,3,'#f4ebc9');ellipse(x-2,y-9,1,1,'#cab069');}}
    [[733,550,20,11],[755,584,23,12],[710,605,21,11]].forEach(p=>ellipse(...p,'#d3d2b8',-.15));
    ellipse(560,668,40,18,'#c5b486');ellipse(560,664,34,13,'#e2d6af');
    ctx.save();ctx.fillStyle='#8d997a';ctx.font='11px Georgia';ctx.textAlign='center';ctx.fillText('THE FLOWER PATCH',350,160);ctx.fillText('LITTLE POND',825,548);ctx.restore();
    for(const c of [...cats].sort((a,b)=>a.y-b.y))cat(c.x,c.y,c.id,time,c.petting,c.sleeping,c.walking,c.direction);
    for(let i=0;i<5;i++){const x=(hash(i+99)*W+time*.007*(i%2?1:-1)+100000)%(W+40)-20,y=(hash(i+9)*H+time*.009)%(H+30)-20;ellipse(x,y,3.5,1.8,'#fff7d775',Math.sin(time/2000+i));}
    for(const p of particles){const age=(realTime-p.time)/1000;if(age>1.2)continue;ellipse(p.x+p.vx*age,p.y+p.vy*age+30*age*age,3,4,`rgba(191,220,226,${1-age/1.2})`);}
  };
}
