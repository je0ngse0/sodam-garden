import { FLOWERS, CATS, progress } from './model.js';
const W = 900, H = 680;
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
  function cat(x,y,id,t,pet) {
    const c=CATS.find(v=>v.id===id);if(!c)return;
    const bob=Math.sin(t/1200)*1.5;ctx.save();ctx.translate(x,y+bob);
    ellipse(0,37,45,10,'#6c805529');
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
  return function paint(state, time, selected, currentCat, petUntil, particles) {
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    if(rect.width!==width||rect.height!==height){width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle='#dce6ca';ctx.fillRect(0,0,W,H);
    // Layered, hand-drawn garden: all original vector artwork.
    const glow=ctx.createRadialGradient(600,100,0,470,280,650);glow.addColorStop(0,'#f4efcf80');glow.addColorStop(1,'#c6d7ae40');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    for(let i=0;i<190;i++){const x=hash(i)*W,y=hash(i+250)*H;ellipse(x,y,1.1,.7,'#8b9d6425');}
    // Warm stone path under the garden.
    ctx.beginPath();ctx.moveTo(580,-20);ctx.bezierCurveTo(540,100,680,180,715,260);ctx.bezierCurveTo(750,360,790,455,950,470);ctx.strokeStyle='#e9e5ca';ctx.lineWidth=85;ctx.stroke();
    for(let i=0;i<20;i++){const y=i*29,x=610+Math.sin(i*.3-2)*75+i*5;ellipse(x,y,22,9,'#cfcdb355',-.12);}
    // Fence.
    round(90,125,670,10,3,'#c5c3a1');round(90,157,670,9,3,'#c8c6a5');
    for(let i=0;i<14;i++){const x=100+i*49;shape([[x,185],[x,111],[x+8,101],[x+17,111],[x+17,185]],'#dfdbb7');line([[x+15,115],[x+15,181]],'#babd9433',2);}
    bush(55,108,1.8,'#a9bd89');bush(166,79,1.3,'#b7c997');bush(837,100,1.8,'#a9bb85');bush(756,70,1.1,'#bccb95');
    // Tree framing the scene.
    shape([[28,281],[48,280],[59,106],[37,108]],'#a49a74');line([[45,184],[16,127]],'#a49a74',10);
    for(let i=0;i<13;i++)ellipse(25+(hash(i+5)-.3)*170,45+hash(i+8)*110,48,43,i%3?'#b3c793':'#a6be87');
    bush(32,568,1.6,'#a6ba87');bush(869,552,1.8,'#aec18c');bush(870,613,1.3,'#bacc9b');
    // Pot, watering can, and little sign.
    ellipse(153,236,26,7,'#8d976b25');shape([[132,207],[173,207],[167,236],[139,236]],'#c79474');ellipse(152,207,24,7,'#d7a889');ellipse(152,205,18,4,'#8d7156');flower(152,207,'daisy',.6,0);
    round(111,393,9,47,3,'#b7a887');ctx.save();ctx.translate(116,390);ctx.rotate(-.07);round(-39,-18,78,31,5,'#eae0bb');ctx.fillStyle='#929173';ctx.font='12px Georgia';ctx.textAlign='center';ctx.fillText('SODAM',0,2);ctx.restore();
    ellipse(144,530,35,9,'#92a16e28');round(122,493,34,32,8,'#99b2a0');ellipse(140,493,17,5,'#b4c9b4');line([[155,502],[174,491],[180,485]],'#99b2a0',9);ctx.beginPath();ctx.ellipse(119,503,10,13,0,0,Math.PI*2);ctx.strokeStyle='#8ea896';ctx.lineWidth=5;ctx.stroke();
    // Flower bed corresponds exactly to the accessible HTML grid.
    round(182,225,558,328,31,'#a0926b28');round(183,220,557,326,26,'#c1ab80');round(192,231,539,304,20,'#ab936b');
    line([[199,239],[718,239]],'#dbc597',3);line([[195,538],[723,538]],'#af966d',6);
    const gw=540,gh=312,gapX=gw*.025,gapY=gh*.025,cw=(gw-gapX*3)/4,ch=(gh-gapY*2)/3;
    for(let i=0;i<12;i++){
      const col=i%4,row=Math.floor(i/4),x=189+col*(cw+gapX)+cw/2,y=231+row*(ch+gapY)+ch*.62;
      const p=state.plots[i];ellipse(x,y+4,49,26,p&&p.wateredAt!==null?'#917e5c':'#a18a64');ellipse(x,y,47,22,p&&p.wateredAt!==null?'#978260':'#ad966e');
      for(let j=0;j<7;j++)ellipse(x+(hash(i*7+j)-.5)*70,y+(hash(i*7+j+90)-.5)*27,1.4,1,'#d9c39660');
      if(!p){line([[x-5,y],[x+5,y]],'#cfbc944f',1.5);line([[x,y-5],[x,y+5]],'#cfbc944f',1.5);continue;}
      const growth=progress(p),sway=Math.sin(time/1700+i)*2;
      if(growth===1){flower(x-16,y-2,p.flower,.72,sway);flower(x+16,y+6,p.flower,.8,-sway);flower(x,y+8,p.flower,1.05,sway);}
      else {const s=.4+growth*.65;line([[x,y+3],[x,y-12-25*growth]],'#718750',3);ellipse(x-7*s,y-10-10*growth,12*s,5*s,'#91a463',.5);ellipse(x+8*s,y-16-12*growth,13*s,5*s,'#819953',-.55);if(growth>.55)ellipse(x,y-15-27*growth,6,8,FLOWERS.find(f=>f.id===p.flower).color);if(p.wateredAt===null){ctx.fillStyle='#f4dfb5';ctx.font='14px serif';ctx.textAlign='center';ctx.fillText('◦',x,y-40);}else {round(x-16,y+21,32,3,2,'#756d5140');round(x-16,y+21,Math.max(1,32*growth),3,2,'#c6d09d');}}
    }
    // Meadow flowers and stepping stones.
    for(let i=0;i<16;i++){const x=215+i*31+hash(i)*15,y=582+hash(i+40)*35;line([[x,y],[x-2,y-8]],'#a2b582',1.5);if(i%3===0){ellipse(x-2,y-9,3,3,'#f4ebc9');ellipse(x-2,y-9,1,1,'#cab069');}}
    [[773,505,23,12],[803,535,25,13],[757,566,25,12]].forEach(p=>ellipse(...p,'#d3d2b8',-.15));
    if(currentCat)cat(729,181,currentCat,time,performance.now()<petUntil);
    // Drifting petals.
    for(let i=0;i<5;i++){const x=(hash(i+99)*900+time*.007*(i%2?1:-1)+90000)%940-20,y=(hash(i+9)*680+time*.009)%710-20;ellipse(x,y,3.5,1.8,'#fff7d775',Math.sin(time/2000+i));}
    for(const p of particles){const age=(time-p.time)/1000;if(age>1.2)continue;ellipse(p.x+p.vx*age,p.y+p.vy*age+30*age*age,3,4,`rgba(191,220,226,${1-age/1.2})`);}
  };
}
