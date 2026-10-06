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
    // A softly lit, three-quarter face on a low, rounded four-legged body.
    const coats = {
      cream: { light:'#fff1cf', base:'#e6c793', dark:'#bc9563', bib:'#fff7df', stripe:'#c49a60' },
      peach: { light:'#f7ce92', base:'#dca268', dark:'#ae764d', bib:'#fff0d2', stripe:'#b77b49' },
      night: { light:'#a5a9b6', base:'#747c8e', dark:'#505969', bib:'#d9d9da', stripe:'#505b70' },
    };
    const coat=coats[c.id] || coats.cream;
    const fur=(x,y,r)=>shade(x,y,r,coat.light,coat.base);
    const ink=c.id==='night'?'#303b4b':'#625044';
    ctx.save();ctx.translate(c.x,c.y);shadow(0,3,46,10);
    ctx.scale(c.direction || 1,1);

    function face(x,y,sleeping) {
      // Ears sit behind the broad cheeks; the nose stays within the face.
      shape([[x-19,y-7],[x-18,y-30],[x-3,y-18]],coat.base);
      shape([[x+4,y-19],[x+20,y-29],[x+21,y-4]],coat.base);
      shape([[x-15,y-12],[x-15,y-24],[x-7,y-17]],'#dba69a');
      shape([[x+10,y-17],[x+17,y-23],[x+17,y-10]],'#dba69a');
      oval(x,y,24,21,fur(x-3,y-5,31));
      oval(x+2,y+9,16,10,coat.bib);
      for(const eye of [-8,12]) {
        if(sleeping || c.petting) {
          ctx.beginPath();ctx.moveTo(x+eye-4,y+1);
          ctx.quadraticCurveTo(x+eye,y+(sleeping?5:-4),x+eye+4,y+1);
          ctx.strokeStyle=ink;ctx.lineWidth=1.8;ctx.lineCap='round';ctx.stroke();
        } else {
          oval(x+eye,y,2.8,4,ink);
          oval(x+eye-.7,y-1.4,.9,1.2,'#fffbea');
        }
      }
      oval(x-14,y+7,4,2,'#dd9f8e44');oval(x+17,y+7,3,2,'#dd9f8e44');
      shape([[x-1,y+7],[x+6,y+7],[x+2.5,y+10]],'#b77f78');
      path([[x+2.5,y+10],[x+2.5,y+13],[x-1,y+14]],ink,.9);
      path([[x+2.5,y+13],[x+6,y+14]],ink,.9);
      path([[x-12,y+10],[x-26,y+8]],coat.dark,.7);
      path([[x+16,y+10],[x+28,y+8]],coat.dark,.7);
      if(c.id!=='cream') for(const dx of [-6,1,8])
        path([[x+dx,y-17],[x+dx-1,y-12]],coat.stripe,2.6);
    }

    if(c.sleeping) {
      const breath=Math.sin(t/1500)*.5;
      oval(-2,-15,35,23+breath,fur(-9,-22,45));
      oval(17,-4,13,5,coat.bib);
      face(20,-21,true);
      ctx.beginPath();ctx.moveTo(-29,-22);
      ctx.bezierCurveTo(-49,1,-17,10,5,-2);
      ctx.strokeStyle=coat.base;ctx.lineWidth=12;ctx.lineCap='round';ctx.stroke();
      ctx.beginPath();ctx.moveTo(-30,-20);ctx.bezierCurveTo(-41,-1,-19,5,-4,0);
      ctx.strokeStyle=coat.light;ctx.lineWidth=4;ctx.stroke();
    } else {
      // Distance, not elapsed time, drives the gait so paws slow at turns.
      const phase=c.gaitPhase ?? t/230;
      const stride=c.walking?1:0;
      const bob=Math.cos(phase*2)*.6*stride;
      function leg(x,offset,far) {
        const cycle=((phase/(Math.PI*2)+offset)%1+1)%1;
        // A long planted stance and a shorter, lifted return step.
        const stance=cycle<.64;
        const f=stance?cycle/.64:(cycle-.64)/.36;
        const swing=(stance?1-2*f:-Math.cos(f*Math.PI))*7*stride;
        const lift=stance?0:Math.sin(f*Math.PI)*5*stride;
        const y=(far?-3:0)-lift;
        path([[x,-23+bob],[x+swing*.35,-12],[x+swing,y-3]],far?coat.dark:coat.base,far?8:10);
        oval(x+swing+2,y-2,7,4,far?coat.base:coat.bib);
      }
      // Tail, far legs, body, near legs, then head give clear depth ordering.
      ctx.beginPath();ctx.moveTo(-28,-28);
      ctx.bezierCurveTo(-48,-27,-50,-48,-44,-51+Math.sin(t/950)*3);
      ctx.strokeStyle=coat.base;ctx.lineWidth=10;ctx.lineCap='round';ctx.stroke();
      leg(-22,.25,true);leg(21,.75,true);
      oval(-4,-27+bob,34,22,fur(-12,-34,45));
      oval(21,-23+bob,14,18,coat.bib);
      if(c.id!=='cream') for(let i=0;i<3;i++) {
        ctx.beginPath();ctx.moveTo(-24+i*10,-44+bob);
        ctx.quadraticCurveTo(-28+i*10,-38+bob,-23+i*10,-33+bob);
        ctx.strokeStyle=coat.stripe;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();
      }
      leg(-23,0,false);leg(22,.5,false);
      face(26,-43+bob,false);
    }
    ctx.scale(c.direction || 1,1);
    if(c.petting) {
      ctx.fillStyle='#c7807d';ctx.font='18px Georgia';ctx.fillText('♥',9,-82);
    }
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
