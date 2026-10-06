import * as THREE from '../../vendor/three/three.module.js';
import { pawStep, damp } from './motion.js';
import { shortFur } from './fur.js';

// Original procedural model: all meshes, markings and joints are made here.
export function createCat() {
  const root = new THREE.Group();
  root.name = 'Cream';
  const torso = new THREE.Group();
  root.add(torso);
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const fur = shortFur('#eac891');
  const pale = shortFur('#fff0d0');
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
  // The thighs emerge from inside the torso, without separate ball-shaped hips.
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

  // Continuous tapered surfaces replace overlapping joint ellipsoids.
  // Parallel-transport frames avoid the old tail's sudden twist at vertical tangents.
  function sweep(name, count, radiusAt) {
    const points=Array.from({length:count},(_,i)=>new THREE.Vector3(0,i*.2,0));
    const path=new THREE.CatmullRomCurve3(points);
    const segments=40,sides=16;
    const geometry=new THREE.TubeGeometry(path,segments,.1,sides,false);
    const mesh=new THREE.Mesh(geometry,fur);mesh.name=name;
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    const point=new THREE.Vector3();
    function set(coords) {
      points.forEach((p,i)=>p.set(...coords[i]));path.updateArcLengths();
      const frames=path.computeFrenetFrames(segments,false);
      const positions=geometry.attributes.position;
      for(let i=0;i<=segments;i++) {
        const u=i/segments;path.getPointAt(u,point);
        const normal=frames.normals[i],binormal=frames.binormals[i],r=radiusAt(u);
        for(let j=0;j<=sides;j++) {
          const a=j/sides*Math.PI*2,c=-Math.cos(a),sn=Math.sin(a);
          positions.setXYZ(i*(sides+1)+j,point.x+r*(normal.x*c+binormal.x*sn),point.y+r*(normal.y*c+binormal.y*sn),point.z+r*(normal.z*c+binormal.z*sn));
        }
      }
      positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    }
    return {set};
  }
  const legs=[];
  for(const front of [false,true]) for(const side of [-1,1]) {
    const x=side*(front?.255:.265),z=front?.49:-.58;
    const limb=sweep(`${front?'foreleg':'hindleg'}-${side}`,5,u=>{
      // Muscular upper leg, narrower wrist/hock, soft overlap with the paw.
      return front?.075+.095*Math.pow(1-u,2):.078+.16*Math.pow(1-u,2.3);
    });
    const paw=ellipsoid(root,pale,[x,.105,z+.06],[.125,.105,.185]);
    legs.push({front,side,x,z,limb,paw,offset:front?(side===1?.75:.25):(side===1?0:.5)});
  }
  const tail=sweep('tail',6,u=>{
    // Close the rounded tip as part of the same mesh, rather than attaching a ball.
    const taper=.135*Math.pow(1-u,.65);
    return Math.max(.0005,taper);
  });
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
    const weightShift=Math.sin(distance/.64*Math.PI*2)*(1-rest)*.014;
    torso.rotation.z=weightShift;
    legs.forEach(leg=>{
      const step=pawStep(distance,leg.offset);
      const y=.105+step.y*(1-rest);
      const footZ=leg.z+step.z*(1-rest)+.075+rest*(leg.front?-.04:.22);
      const hipY=(leg.front?.89:.87)-rest*.33+bob;
      const hipX=leg.x+weightShift*(leg.front?1:-1);
      // Hind knee points forward; hock folds back above the weight-bearing paw.
      const kneeZ=leg.z+(leg.front?-.025:.18)*(1-rest)+rest*.1;
      const hockZ=footZ-(leg.front?.025:.12)*(1-rest);
      leg.limb.set([
        [hipX,hipY,leg.z],
        [leg.x,(hipY+y)*.68,kneeZ],
        [leg.x,(hipY+y)*.43,hockZ],
        [leg.x,y+.07,footZ-.025],
        [leg.x,y,footZ+.035],
      ]);
      leg.paw.position.set(leg.x,y,footZ+.055);
      leg.paw.rotation.x=-(step.y/.13)*.16*(1-rest);
    });
    // A quiet wave travels out toward the tip; the root stays anchored in the rump.
    const standing=[[0,1.03+bob,-.81],[.025,1.05+bob,-1.04],[.06,1.26,-1.28],[.10,1.62,-1.43],[.12,1.89,-1.38],[.08,1.97,-1.19]];
    const curled=[[0,.70,-.8],[-.19,.43,-1.04],[-.49,.24,-1.06],[-.66,.20,-.72],[-.67,.19,-.3],[-.49,.18,-.09]];
    const coords=standing.map((p,i)=>{
      const u=i/5,wave=Math.sin(time*1.7-u*2.2)*.11*u*u;
      return [p[0]*(1-rest)+curled[i][0]*rest+wave*(1-rest*.7),p[1]*(1-rest)+curled[i][1]*rest,p[2]*(1-rest)+curled[i][2]*rest];
    });
    tail.set(coords);
  }
  update(0,0);
  return {root,update};
}
