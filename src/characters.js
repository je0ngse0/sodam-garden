// Articulated canvas figures. Feet are the origin, so their shadows stay grounded.
export function createCharacters(ctx) {
  function oval(x,y,rx,ry,color,rotation=0) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  function path(points,color,width) {
    ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
  function shape(points,color) {
    ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  function shade(x,y,r,light,dark) {
    const g=ctx.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);g.addColorStop(0,light);g.addColorStop(1,dark);return g;
  }
  function shadow(x,y,rx,ry) {
    ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);const g=ctx.createRadialGradient(0,0,1,0,0,rx);g.addColorStop(0,'#28392246');g.addColorStop(1,'#28392200');oval(0,0,rx,rx,g);ctx.restore();
  }
  function drawCat(c, palette, t) {
    ctx.save();ctx.translate(c.x,c.y);shadow(0,2,48,11);
    const colors={cream:['#f5e2be','#c5ab82'],peach:['#dfa774','#9e6946'],night:['#929297','#444950']}[c.id];
    const fur=shade(-8,-24,51,...colors);
    if(c.sleeping) {
      oval(0,-11,35,19,fur);oval(-22,-16,17,14,shade(-25,-20,24,...colors));
      shape([[-36,-23],[-35,-40],[-22,-29]],colors[1]);shape([[-22,-29],[-10,-37],[-9,-20]],colors[1]);
      path([[-32,-16],[-27,-13],[-22,-16]],'#534c43',1.2);
      ctx.beginPath();ctx.ellipse(5,-12,24,14,.2,-1,2.5);ctx.strokeStyle=colors[0];ctx.lineWidth=8;ctx.stroke();
      ctx.fillStyle='#637259';ctx.font='italic 12px Georgia';ctx.fillText('z z',7,-41-Math.sin(t/1600)*2);
      ctx.restore();return;
    }
    ctx.scale(c.direction,1);
    const phase=t/170, stride=c.walking?1:0;
    const leg=(x,offset,far)=>{
      const a=Math.sin(phase+offset)*stride;
      const hipY=-25;
      const kneeX=x+a*6, kneeY=-13-Math.max(0,a)*3;
      const footX=x+a*11,footY=-Math.max(0,a)*5;
      path([[x,hipY],[kneeX,kneeY],[footX,footY]],far?colors[1]:colors[0],far?6:7);
      oval(footX+3,footY,6,3,far?colors[1]:colors[0]);
    };
    leg(-23,Math.PI,true);leg(20,0,true);
    const bob=c.walking?Math.sin(phase*2)*1.1:0;
    ctx.save();ctx.translate(0,bob);
    ctx.beginPath();ctx.moveTo(-34,-30);ctx.bezierCurveTo(-54,-39,-57,-68,-45,-62+Math.sin(t/700)*4);ctx.strokeStyle=colors[1];ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke();
    oval(-5,-29,35,16,fur,-.03);oval(-26,-26,14,17,fur);oval(24,-34,13,17,fur,-.2);
    oval(34,-47,16,14,shade(31,-52,22,...colors));
    shape([[22,-54],[23,-72],[34,-60]],colors[1]);shape([[35,-59],[46,-70],[46,-50]],colors[1]);
    shape([[25,-57],[26,-66],[31,-59]],'#c6978b');shape([[38,-59],[43,-65],[43,-54]],'#c6978b');
    oval(46,-43,9,6,c.id==='night'?'#b4afb0':'#eee0c8');oval(53,-45,2.5,2,'#87615d');
    oval(40,-51,3,3,'#c6cf93');oval(41,-51,1.1,2.5,'#313a30');oval(40,-52,1,1,'#fffbea');
    path([[46,-40],[55,-38]],'#80796c',.7);path([[44,-41],[58,-44]],'#80796c',.7);
    for(let i=0;i<5;i++)path([[-22+i*9,-39],[-18+i*9,-30]],c.id==='night'?'#484d5555':'#95765444',2);
    ctx.restore();leg(-20,0,false);leg(22,Math.PI,false);
    if(c.petting){ctx.scale(c.direction,1);ctx.fillStyle='#bf7b7a';ctx.font='20px Georgia';ctx.fillText('♥',-3,-80);}
    ctx.restore();
  }
  function drawWoman(w,t,bouquet) {
    ctx.save();ctx.translate(w.x,w.y);shadow(0,3,31,9);
    const sit=w.sitting, step=w.walking?Math.sin(t/190):0;
    const bob=w.walking?Math.abs(Math.sin(t/190))*1.5:Math.sin(t/1600)*.4;
    ctx.scale(w.direction || 1,1);ctx.translate(0,-bob);
    const skin=shade(0,-70,70,'#f5d4b6','#bd9279');
    const hair=shade(-2,-99,30,'#80604b','#392e28');
    const dress=shade(-5,-55,48,'#e7ead9','#9ba990');
    const hip=sit?-40:-47, shoulder=sit?-81:-91, head=sit?-103:-114;
    // Far limbs precede the body, near limbs follow it.
    const leg=(side,far)=>{
      const swing=step*side;
      const hipX=side*6;
      const knee=sit?[hipX+11,-22]:[hipX+swing*6,-23];
      const foot=sit?[hipX+12,0]:[hipX+swing*11,-Math.max(0,swing)*4];
      path([[hipX,hip],knee,foot],far?'#be9d86':'#e6c4a6',6);
      oval(foot[0]+3,foot[1]+1,8,3.5,far?'#695546':'#856c54');
    };
    leg(-1,true);leg(1,false);
    // Long loose hair, a linen dress, and a small waist tie.
    oval(-2,head+17,15,25,hair,-.08);
    path([[-11,shoulder+5],[-18-step*3,shoulder+22],[-15-step*6,hip+2]],skin,5);
    shape([[-12,shoulder],[10,shoulder],[12,hip-4],[sit?23:26,sit?-24:-23],[sit?-13:-25,sit?-24:-23],[-12,hip-4]],dress);
    for(let i=-2;i<=2;i++)path([[i*3,hip-7],[i*9+(sit?7:0),sit?-27:-26]],'#b1bba363',1);
    path([[-11,hip-5],[12,hip-5]],'#8f9f85',2);
    path([[3,hip-5],[7,hip+10]],'#8a9b7d',1.5);
    path([[0,shoulder],[0,shoulder-7]],skin,7);
    oval(0,head,10.5,14,skin,-.08);
    ctx.beginPath();ctx.moveTo(-11,head+3);ctx.bezierCurveTo(-20,head-23,15,head-23,12,head+7);ctx.bezierCurveTo(6,head+2,7,head-8,3,head-9);ctx.bezierCurveTo(-2,head-3,-7,head-6,-11,head+3);ctx.fillStyle=hair;ctx.fill();
    path([[-3,head+2],[-1,head+2]],'#594638',.9);path([[5,head+2],[7,head+2]],'#594638',.9);
    path([[2,head+3],[3,head+6]],'#c28f78',.7);path([[0,head+9],[4,head+9]],'#ba7c73',1);
    oval(-7,head+7,2.5,1.2,'#dca19266');
    // Straw hat, a ribbon, and softly highlighted woven brim.
    oval(0,head-12,24,5,shade(-5,head-14,27,'#f1dfae','#b69b68'),-.08);
    ctx.beginPath();ctx.roundRect(-12,head-26,25,14,[8,8,2,2]);ctx.fillStyle=shade(-3,head-21,22,'#eddbac','#c0a675');ctx.fill();
    path([[-12,head-14],[12,head-15]],'#ae8180',2.5);
    for(let i=0;i<4;i++)path([[-9,head-24+i*3],[10,head-24+i*3]],'#ac915833',.6);
    if(bouquet){
      path([[11,shoulder+5],[17,shoulder+20],[4,hip-4]],skin,5);
      ctx.save();ctx.translate(3,hip-5);ctx.rotate(-.2);
      shape([[-14,-15],[0,18],[15,-15]],'#ddc6a0');
      bouquet.flowers.slice(0,7).forEach((id,i)=>{const x=(i%3-1)*10,y=-18-Math.floor(i/3)*8;path([[0,9],[x,y]],'#7f9165',1.4);oval(x,y,6,5,id==='tulip'?'#ce8d83':id==='lavender'?'#aaa0c5':'#fff2d6');});
      path([[-4,7],[5,7]],'#ad777a',3);ctx.restore();
    } else path([[11,shoulder+5],[17+step*3,shoulder+21],[sit?8:16+step*6,sit?hip:hip+3]],skin,5);
    ctx.restore();
  }
  return { drawCat, drawWoman };
}
