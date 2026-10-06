import test from 'node:test';
import assert from 'node:assert/strict';
import { pawStep, walkPose, damp } from '../src/preview3d/motion.js';
import { createCat } from '../src/preview3d/cat.js';

test('3D preview paws remain grounded during stance and return without a jump',()=>{
  const start=pawStep(.1),next=pawStep(.11);
  assert.equal(start.y,0);assert.equal(next.y,0);
  // Forward body travel is canceled by the planted paw's backward motion.
  assert.ok(Math.abs((next.z-start.z)+.01)<1e-9);
  for(const boundary of [.64*.68,.64]) {
    const before=pawStep(boundary-1e-7),after=pawStep(boundary+1e-7);
    assert.ok(Math.abs(before.z-after.z)<1e-5);
    assert.ok(Math.abs(before.y-after.y)<1e-5);
  }
  for(let d=0;d<3;d+=.01)for(const phase of [0,.25,.5,.75]) {
    const step=pawStep(d,phase);assert.ok(step.y>=0&&step.y<=.130001);
  }
});

test('3D preview route faces along its travel direction and stays on the lawn',()=>{
  for(let d=0;d<14;d+=.1) {
    const p=walkPose(d),q=walkPose(d+1e-5);
    const dx=q.x-p.x,dz=q.z-p.z;
    assert.ok(Math.hypot(p.x,p.z)<=2.10001);
    assert.ok((dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))/Math.hypot(dx,dz)>.999);
  }
  const a=walkPose(0),b=walkPose(2*Math.PI*1.05);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-9);
  assert.equal(damp(2,8,4,0),2);
});

test('procedural cat poses produce finite, reusable geometry without replacing mesh geometry',()=>{
  const cat=createCat();const meshes=[];cat.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const geometries=meshes.map(m=>m.geometry);
  for(let frame=0;frame<160;frame++) {
    cat.update(frame/30,1/30,{distance:frame*.012,walking:frame<80,petting:frame>120});
    meshes.forEach((mesh,i)=>{
      assert.equal(mesh.geometry,geometries[i]);
      assert.ok([mesh.position.x,mesh.position.y,mesh.position.z,...mesh.scale.toArray(),...mesh.quaternion.toArray()].every(Number.isFinite));
      if(mesh.geometry.type==='TubeGeometry') {
        assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));
        assert.ok(mesh.geometry.attributes.normal.array.every(Number.isFinite));
      }
    });
  }
});
