import { FLOWERS, CATS, progress, FEED_INTERVAL } from './model.js';
import { WORLD, BED, POND, PLOT_COUNT, plotPosition } from './layout.js';
import { createCharacters } from './characters.js';
const W = WORLD.width, H = WORLD.height;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function createPainter(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0;
  const { drawCat, drawWoman } = createCharacters(ctx);
  const texture = document.createElement('canvas');
  texture.width=W;texture.height=H;
  const grass=texture.getContext('2d');
  const ground=grass.createLinearGradient(0,0,W,H);
  ground.addColorStop(0,'#91a57b');ground.addColorStop(.38,'#b7c59c');ground.addColorStop(1,'#7e986b');
  grass.fillStyle=ground;grass.fillRect(0,0,W,H);
  for(let i=0;i<14500;i++){
    const x=hash(i+100)*W,y=hash(i+600)*H;
    grass.strokeStyle=['#587b4933','#d5dfa84d','#f1e8b926','#6b86553d'][i%4];
    grass.lineWidth=.4+hash(i)*.7;
    grass.beginPath();grass.moveTo(x,y);grass.lineTo(x+(hash(i+4)-.5)*4,y-2-hash(i+5)*5);grass.stroke();
  }
  // Dappled light and leaf shadows are cached with the grass texture.
  for(let i=0;i<100;i++){
    const x=hash(i+900)*W,y=hash(i+200)*170,r=12+hash(i)*30;
    const light=grass.createRadialGradient(x,y,1,x,y,r);
    light.addColorStop(0,'#31522d12');light.addColorStop(1,'#31522d00');
    grass.fillStyle=light;grass.fillRect(x-r,y-r,r*2,r*2);
  }
  const soil=document.createElement('canvas');soil.width=BED.width;soil.height=BED.height;
  const dirt=soil.getContext('2d');
  for(let i=0;i<3000;i++) {
    dirt.fillStyle=['#d9bf8540','#4c3e3533','#b99a7338'][i%3];
    dirt.beginPath();dirt.ellipse(hash(i+46)*BED.width,hash(i+69)*BED.height,.5+hash(i)*1.3,.5,0,0,Math.PI*2);dirt.fill();
  }
  function volume(x,y,rx,ry,light,dark,rotation=0) {
    const g=ctx.createRadialGradient(x-rx*.3,y-ry*.35,0,x,y,Math.max(rx,ry));
    g.addColorStop(0,light);g.addColorStop(1,dark);ellipse(x,y,rx,ry,g,rotation);
  }

  function ellipse(x,y,rx,ry,color,rotation=0) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function line(points,color,size=2) {ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function shape(points,color) {ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function round(x,y,w,h,r,color) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
  function bush(x,y,s,color) {ellipse(x,y+13*s,46*s,13*s,'#7e986326');for(let i=0;i<7;i++)ellipse(x+(hash(i+10)-.5)*65*s,y+(hash(i+40)-.5)*25*s,(18+hash(i+70)*12)*s,(19+hash(i+90)*15)*s,color);}
  function flower(x,y,type,size=1,sway=0) {
    const f=FLOWERS.find(v=>v.id===type);ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    line([[0,0],[sway*.4,-23],[sway,-52]],'#6e8853',3);
    volume(-9,-20,12,5,'#a3b47b','#506f3b',.55);volume(10,-31,13,5,'#98b56b','#4f723f',-.6);line([[-17,-24],[-2,-17]],'#bdd09c77',.7);line([[2,-27],[20,-35]],'#bdd09c77',.7);
    if(type==='daisy') {for(let j=0;j<9;j++){const a=j*Math.PI*2/9;volume(sway+Math.cos(a)*11,-55+Math.sin(a)*11,8,4.5,'#fffdf0','#cfccaf',a);}volume(sway,-55,6,6,'#f2ce67','#a57d31');for(let k=0;k<8;k++)ellipse(sway+Math.cos(k)*3,-55+Math.sin(k)*3,.8,.8,'#b9953c');}
    if(type==='tulip') {volume(sway,-54,13,16,'#f0b2a7','#b66366');shape([[sway-13,-61],[sway-13,-74],[sway-4,-65],[sway,-76],[sway+5,-65],[sway+13,-73],[sway+13,-59]],f.color);volume(sway-5,-57,6,14,'#f2b8a9','#cd8380',-.13);volume(sway+6,-55,6,13,'#e9a69b','#b96f75',.17);}
    if(type==='lavender') {for(let j=0;j<6;j++){ellipse(sway-4,-44-j*6,5,4,j%2?f.color:'#b2a5cd',-.4);ellipse(sway+4,-47-j*6,5,4,f.color,.4);}ellipse(sway,-81,4,6,'#b7abd0');}
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
  return function paint(state, time, cats, particles, realTime, walker) {
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    if(rect.width!==width||rect.height!==height){width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.drawImage(texture,0,0);
    const glow=ctx.createRadialGradient(600,100,0,470,280,650);glow.addColorStop(0,'#f4efcf80');glow.addColorStop(1,'#c6d7ae40');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    for(let i=0;i<290;i++)ellipse(hash(i)*W,hash(i+250)*H,1.1,.7,'#8b9d6425');
    // A continuous path leaves room for the cats around the enlarged bed.
    ctx.beginPath();ctx.moveTo(690,-20);ctx.bezierCurveTo(640,140,720,240,700,440);ctx.bezierCurveTo(670,620,750,645,1040,665);ctx.strokeStyle='#d4cfb2';ctx.lineWidth=58;ctx.stroke();
    for(let i=0;i<35;i++){const y=i*19,x=690+Math.sin(i*.2)*8;volume(x,y,18,7,'#ddd8bb','#b1b09a',-.1);}
    round(75,76,830,9,3,'#c5c3a1');round(75,104,830,8,3,'#c8c6a5');
    for(let i=0;i<18;i++){const x=80+i*48;shape([[x,129],[x, 60],[x+8,50],[x+17,60],[x+17,129]],'#dfdbb7');}
    bush(40,65,1.6,'#a9bd89');bush(180,38,1,'#b7c997');bush(958,80,1.6,'#a9bb85');
    shape([[28,230],[45,230],[53,66],[35,66]],'#a49a74');
    for(let i=0;i<100;i++){const x=20+(hash(i+5)-.3)*135,y=20+hash(i+8)*95;volume(x,y,14+hash(i)*17,10+hash(i+20)*13,i%3?'#a8be83':'#b9c993','#62814e');}
    bush(12,666,1.1,'#aec18c');bush(980,688,1.4,'#bacc9b');
    // A quiet bench beside the pond.
    round(775,171,113,10,3,'#b9ac82');round(775,185,113,10,3,'#cdbb91');round(771,202,122,13,4,'#d7c49b');
    for(let i=0;i<14;i++)line([[778,173+i*3],[886,173+i*3]],'#97846135',.5);ellipse(832,235,64,9,'#36442924');line([[786,212],[782,235]],'#837859',7);line([[878,212],[881,235]],'#a59e7d',7);
    ellipse(915,225,23,6,'#8d976b25');shape([[900,202],[931,202],[926,225],[905,225]],'#c79474');ellipse(915,202,18,5,'#d7a889');flower(915,202,'tulip',.55,0);
    pond(state,time);
    const {x:bx,y:by,width:bw,height:bh}=BED;
    round(bx-13,by-5,bw+26,bh+23,23,'#9e926c25');round(bx-11,by-13,bw+22,bh+25,20,'#c5af83');round(bx-3,by-4,bw+6,bh+8,14,'#8d7758');
    ctx.drawImage(soil,bx,by);
    line([[bx+3,by-7],[bx+bw-3,by-7]],'#e0cda2',3);line([[bx,by+bh+7],[bx+bw,by+bh+7]],'#af966d',5);
    for(let i=0;i<PLOT_COUNT;i++){
      const {x,y}=plotPosition(i),p=state.plots[i];
      ellipse(x+5,y+7,40,23,'#493d3620');volume(x,y,39,20,p&&p.wateredAt!==null?'#9a8461':'#b0986c',p&&p.wateredAt!==null?'#695940':'#87714e');
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
    const actors=[...cats.map(c=>({y:c.y,draw:()=>drawCat(c,CATS,time)})),{y:walker.y,draw:()=>drawWoman(walker,time,state.bouquets.at(-1))}];
    actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
    if(walker.walking&&walker.path.length){const target=walker.path.at(-1);ctx.beginPath();ctx.ellipse(target.x,target.y,12,6,0,0,Math.PI*2);ctx.strokeStyle='#fff2c799';ctx.lineWidth=1.5;ctx.stroke();}
    for(let i=0;i<5;i++){const x=(hash(i+99)*W+time*.007*(i%2?1:-1)+100000)%(W+40)-20,y=(hash(i+9)*H+time*.009)%(H+30)-20;ellipse(x,y,3.5,1.8,'#fff7d775',Math.sin(time/2000+i));}
    for(const p of particles){const age=(realTime-p.time)/1000;if(age>1.2)continue;ellipse(p.x+p.vx*age,p.y+p.vy*age+30*age*age,3,4,`rgba(191,220,226,${1-age/1.2})`);}
  };
}
