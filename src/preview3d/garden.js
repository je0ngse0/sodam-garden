import * as THREE from 'three';

export function createGarden() {
  const group=new THREE.Group();
  let seed=9173;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:1});
  function mesh(geo,mat,p,scale=[1,1,1]) {
    const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...scale);m.receiveShadow=true;m.castShadow=true;group.add(m);return m;
  }
  // Seeded canvas texture adds a mottled, softly woven surface without assets.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#a7bf71';ctx.fillRect(0,0,512,512);
  for(let i=0;i<1300;i++) {
    const x=random()*512,y=random()*512,r=4+random()*25;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,i%2?'#d8df9427':'#708d5420');g.addColorStop(1,'#99b66c00');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<11000;i++) {
    ctx.fillStyle=['#eff0b328','#75945725','#bfcf852c'][i%3];
    const x=random()*512,y=random()*512;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*2+1,y+3+random()*3);ctx.lineTo(x+4,y+1);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const grassMat=new THREE.MeshStandardMaterial({map:texture,roughness:1,color:'#f6f4da'});
  mesh(new THREE.CylinderGeometry(4.27,4.13,.26,96),material('#b9aa7d'),[0,-.17,0]);
  const top=mesh(new THREE.CylinderGeometry(4.29,4.27,.12,96),grassMat,[0,.015,0]);
  top.castShadow=false;
  // Small, varied grass blades are instanced: one draw call for the whole lawn.
  const bladeGeo=new THREE.BufferGeometry();
  bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute([
    -.023,0,0,.023,0,0,.012,.15,.015,
    -.023,0,0,.012,.15,.015,-.009,.15,.015,
    -.009,.15,.015,.012,.15,.015,.045,.29,.045,
  ],3));bladeGeo.computeVertexNormals();
  const wind={value:0};
  const bladeMat=new THREE.MeshStandardMaterial({color:'#b3c97e',roughness:1,side:THREE.DoubleSide});
  bladeMat.onBeforeCompile=shader=>{
    shader.uniforms.gardenTime=wind;
    shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      transformed.x += sin(gardenTime * 1.4 + instanceMatrix[3].x * 1.7 + instanceMatrix[3].z) * position.y * position.y * 0.65;`);
  };
  const count=1500, blades=new THREE.InstancedMesh(bladeGeo,bladeMat,count), dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<count;i++) {
    const a=random()*Math.PI*2,r=Math.sqrt(random())*4.14;
    dummy.position.set(Math.cos(a)*r,.078,Math.sin(a)*r);
    dummy.rotation.set(0,random()*Math.PI*2,0);
    const s=(r<2.4?.2:.38)+random()*.46;dummy.scale.setScalar(s);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);
    color.setHSL(.21+random()*.035,.28+random()*.14,.48+random()*.16);blades.setColorAt(i,color);
  }
  blades.receiveShadow=true;group.add(blades);
  const stoneMat=material('#c8c3a2');
  for(let i=0;i<6;i++) {
    const z=-2.3+i*.76,x=-2.7-Math.sin(i*.55)*.3;
    const stone=mesh(new THREE.IcosahedronGeometry(1,2),stoneMat,[x,.115,z],[.33+random()*.13,.105,.26+random()*.12]);
    stone.rotation.y=random()*3;stone.rotation.z=(random()-.5)*.09;
  }
  // Modest edge planting keeps the cat and open lawn as the focus.
  const foliage=[material('#869f59'),material('#9db46c'),material('#b4c582')];
  const leafGeo=new THREE.SphereGeometry(1,16,12);
  for(const [x,z,s] of [[-2.75,-2.6,.8],[-1.95,-3.2,.65],[2.75,-2.65,.65],[3.4,-1.5,.5]]) {
    for(let i=0;i<5;i++) {
      const a=i*2.4;
      mesh(leafGeo,foliage[i%3],[x+Math.sin(a)*s*.3,s*.24,z+Math.cos(a)*s*.3],[s*.43,s*(.3+random()*.1),s*.43]);
    }
  }
  const petalMat=material('#fff4d5'),pollenMat=material('#ddb95d'),stemMat=material('#729153');
  const flowers=18, petals=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),petalMat,flowers*7);
  const centers=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),pollenMat,flowers);
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.015,1,5),stemMat,flowers);
  for(let i=0;i<flowers;i++) {
    const a=(i/flowers)*Math.PI*2+.17*random(), r=3.35+random()*.58;
    const x=Math.sin(a)*r,z=Math.cos(a)*r,h=.2+random()*.19;
    dummy.position.set(x,.08+h*.5,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,h,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,.08+h,z);dummy.scale.set(.055,.036,.055);dummy.updateMatrix();centers.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<7;j++) {
      const angle=j/7*Math.PI*2;
      dummy.position.set(x+Math.cos(angle)*.073,.075+h,z+Math.sin(angle)*.073);
      dummy.rotation.set(0,-angle,0);dummy.scale.set(.073,.022,.033);dummy.updateMatrix();petals.setMatrixAt(i*7+j,dummy.matrix);
    }
  }
  petals.castShadow=true;centers.castShadow=true;stems.castShadow=true;
  group.add(petals,centers,stems);
  return {group,update:time=>{wind.value=time;}};
}
