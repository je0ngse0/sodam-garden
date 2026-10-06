import * as THREE from '../../vendor/three/three.module.js';
import { pawStep, damp } from './motion.js';

// Original procedural model: all meshes, markings and joints are made here.
export function createCat() {
  const root = new THREE.Group();
  root.name = 'Cream';
  const torso = new THREE.Group();
  root.add(torso);
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const fur = new THREE.MeshStandardMaterial({ color: '#eac891', roughness: .92 });
  const pale = new THREE.MeshStandardMaterial({ color: '#fff0d0', roughness: .98 });
  const warm = new THREE.MeshStandardMaterial({ color: '#d4a367', roughness: .93 });
  const pink = new THREE.MeshStandardMaterial({ color: '#dba49b', roughness: .85 });
  const noseMat = new THREE.MeshStandardMaterial({ color: '#b97e78', roughness: .7 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#302f28', roughness: .27 });
  const glint = new THREE.MeshBasicMaterial({ color: '#fff9e7' });
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#8c7160', roughness: 1 });
  const whiskerMat = new THREE.MeshStandardMaterial({ color: '#af9876', roughness: 1 });
  function ellipsoid(parent, mat, p, s) {
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.position.set(...p); mesh.scale.set(...s);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function curve(parent, points, radius, material, segments=20) {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))), segments, radius, 6, false);
    const mesh = new THREE.Mesh(geo, material); parent.add(mesh); return mesh;
  }
  const body = ellipsoid(torso, fur, [0,.87,-.17], [.49,.49,.82]);
  ellipsoid(torso, fur, [0,.84,.39], [.4,.47,.4]);
  ellipsoid(torso, pale, [0,.83,.57], [.3,.39,.19]);
  // Slightly tucked haunches connect visually to the hind legs.
  for(const side of [-1,1]) ellipsoid(torso, fur, [side*.32,.64,-.64], [.25,.35,.32]);
  const head = new THREE.Group();head.position.set(0,1.36,.65);torso.add(head);
  ellipsoid(head, fur, [0,0,0], [.54,.47,.45]);
  ellipsoid(head, pale, [0,-.22,.14], [.43,.24,.32]);

  function ear(side) {
    const group = new THREE.Group();group.position.set(side*.31,.26,-.04);group.rotation.z=-side*.18;head.add(group);
    const outline = new THREE.Shape();
    outline.moveTo(-.19,0);outline.quadraticCurveTo(-.21,.05,-.16,.18);
    outline.lineTo(-.035,.49);outline.quadraticCurveTo(0,.54,.04,.48);
    outline.lineTo(.2,.08);outline.quadraticCurveTo(.23,-.04,-.19,0);
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.095,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.038,bevelThickness:.04,curveSegments:8}),fur);
    mesh.castShadow=true;group.add(mesh);
    const inside=new THREE.Mesh(new THREE.ShapeGeometry(outline,12),pink);
    inside.scale.set(.62,.69,1);inside.position.set(0,.045,.139);group.add(inside);return group;
  }
  const ears=[ear(-1),ear(1)];
  const eyes=[];
  for(const side of [-1,1]) {
    const eye = ellipsoid(head, eyeMat, [side*.21,.015,.415], [.068,.087,.034]);
    eye.rotation.y=side*.22;
    const shine=ellipsoid(eye,glint,[-.22,.3,.93],[.22,.19,.13]);
    shine.castShadow=false;eyes.push(eye);
    ellipsoid(head,pale,[side*.135,-.165,.404],[.18,.125,.115]);
    // Tiny cheek tufts keep the silhouette from reading as a perfect sphere.
    const tuft=ellipsoid(head,fur,[side*.46,-.11,.01],[.085,.11,.12]);tuft.rotation.z=side*.45;
    for(let i=0;i<3;i++) curve(head,[[side*.27,-.15-i*.034,.438],[side*.46,-.14-i*.05,.455],[side*.67,-.08-i*.075,.43]],.006,whiskerMat,10);
  }
  const noseShape=new THREE.Shape();
  noseShape.moveTo(-.06,0);noseShape.quadraticCurveTo(0,.02,.06,0);noseShape.quadraticCurveTo(.05,-.035,0,-.058);noseShape.quadraticCurveTo(-.05,-.035,-.06,0);
  const nose = new THREE.Mesh(new THREE.ExtrudeGeometry(noseShape,{depth:.025,bevelEnabled:true,bevelSegments:2,bevelThickness:.01,bevelSize:.008,steps:1}),noseMat);
  nose.position.set(0,-.125,.522);head.add(nose);
  curve(head,[[0,-.182,.526],[0,-.21,.526],[-.035,-.23,.514],[-.075,-.215,.5]],.009,mouthMat);
  curve(head,[[0,-.21,.526],[.035,-.23,.514],[.075,-.215,.5]],.009,mouthMat);

  const legs=[];
  for(const front of [false,true]) for(const side of [-1,1]) {
    const x=side*(front?.285:.33), z=front?.49:-.65;
    const upper=ellipsoid(root,fur,[x,.5,z],[.15,.3,.15]);
    const lower=ellipsoid(root,fur,[x,.3,z],[.11,.25,.11]);
    const paw=ellipsoid(root,pale,[x,.11,z+.06],[.145,.12,.21]);
    legs.push({front,side,x,z,upper,lower,paw,offset:front?(side===1?.75:.25):(side===1?0:.5)});
  }
  const from = new THREE.Vector3(), to = new THREE.Vector3(), up = new THREE.Vector3(0,1,0), delta=new THREE.Vector3();
  function bone(mesh,a,b,radius) {
    from.set(...a);to.set(...b);delta.subVectors(to,from);
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(up,delta.clone().normalize());
    mesh.scale.set(radius,delta.length()*.5+radius*.45,radius);
  }
  // One continuous tube avoids a chain-of-balls tail silhouette.
  const tailPoints=Array.from({length:5},()=>new THREE.Vector3());
  const tailPath=new THREE.CatmullRomCurve3(tailPoints);
  tailPoints.forEach((p,i)=>p.set(0,.9+i*.2,-.85-i*.15));
  const tailGeo=new THREE.TubeGeometry(tailPath,28,.11,10,false);
  const tail=new THREE.Mesh(tailGeo,fur);tail.castShadow=true;tail.receiveShadow=true;root.add(tail);
  const tailTip=ellipsoid(root,pale,[0,1.6,-1.2],[.07,.07,.07]);
  const tangent=new THREE.Vector3(), normal=new THREE.Vector3(), binormal=new THREE.Vector3(), point=new THREE.Vector3();
  let rest=1;
  function update(time,dt,{distance=0,walking=false,petting=false}={}) {
    rest=damp(rest,walking?0:1,5,dt);
    const bob=(1-rest)*Math.cos(distance/.64*Math.PI*4)*.017;
    torso.position.y=-rest*.33+bob+Math.sin(time*1.6)*.008;
    body.scale.y=.49+Math.sin(time*1.6)*.007;
    head.rotation.z=petting?Math.sin(time*3)*.11:Math.sin(time*.8)*.025;
    head.rotation.x=petting?-.12:rest*.055;
    ears.forEach((ear,i)=>{ear.rotation.z=(i===0?1:-1)*.18+Math.sin(time*1.1+i)*.018;});
    const blink=petting?.13:(Math.sin(time*.71)>.991?.1:1);
    eyes.forEach(eye=>eye.scale.y=.087*blink);
    legs.forEach(leg=>{
      const step=pawStep(distance,leg.offset);
      const z=leg.z+step.z*(1-rest), y=.11+step.y*(1-rest)-rest*.015;
      const hipY=(leg.front?.82:.71)-rest*.33+bob;
      const footZ=z+.055+rest*(leg.front?-.07:.21);
      // Hock folds rearward, foreleg bends gently toward the chest.
      const kneeZ=(leg.z+footZ)*.5+(leg.front?-.06:.13)*(1-rest);
      const kneeY=(hipY+y)*.52;
      bone(leg.upper,[leg.x,hipY,leg.z],[leg.x,kneeY,kneeZ],leg.front?.13:.17);
      bone(leg.lower,[leg.x,kneeY,kneeZ],[leg.x,y,footZ],.095);
      leg.paw.position.set(leg.x,y,footZ+.035);
      leg.paw.scale.y=.12-rest*.025;
    });
    const sway=Math.sin(time*1.5)*.13;
    const standing=[[0,.91,-.84],[.05,.98,-1.17],[.13+sway,1.43,-1.48],[.12+sway,1.88,-1.52],[.03+sway,1.97,-1.33]];
    const curled=[[0,.59,-.83],[-.34,.34,-1.05],[-.65,.23,-.7],[-.67,.2,-.08],[-.47,.21,.13]];
    tailPoints.forEach((p,i)=>p.set(...standing[i]).lerp(new THREE.Vector3(...curled[i]),rest));
    tailPath.updateArcLengths();
    const positions=tailGeo.attributes.position;
    for(let i=0;i<=28;i++) {
      const u=i/28;
      tailPath.getPointAt(u,point);tailPath.getTangentAt(u,tangent).normalize();
      normal.crossVectors(tangent,up);
      if(normal.lengthSq()<.0001)normal.set(1,0,0);else normal.normalize();
      binormal.crossVectors(tangent,normal).normalize();
      const radius=.115*(1-u*.45);
      for(let j=0;j<=10;j++) {
        const a=j/10*Math.PI*2,idx=i*11+j;
        positions.setXYZ(idx,point.x+radius*(-normal.x*Math.cos(a)+binormal.x*Math.sin(a)),point.y+radius*(-normal.y*Math.cos(a)+binormal.y*Math.sin(a)),point.z+radius*(-normal.z*Math.cos(a)+binormal.z*Math.sin(a)));
      }
    }
    positions.needsUpdate=true;tailGeo.computeVertexNormals();tailGeo.computeBoundingSphere();
    tailTip.position.copy(tailPoints[4]);
  }
  update(0,0);
  return {root,update};
}
