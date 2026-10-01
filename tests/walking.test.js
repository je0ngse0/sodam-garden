import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, isWalkable, advanceWalker, START, BENCH } from '../src/walking.js';

test('route to bench avoids flowers and water, including between grid points',()=>{
  const route=findPath(START,BENCH);assert.ok(route.length>1);assert.deepEqual(route.at(-1),BENCH);
  for(let i=0;i<route.length;i++) {
    assert.ok(isWalkable(route[i].x,route[i].y));
    if(i)for(let f=0;f<=1;f+=.1)assert.ok(isWalkable(route[i-1].x*(1-f)+route[i].x*f,route[i-1].y*(1-f)+route[i].y*f));
  }
});
test('clicking an obstacle chooses an accessible destination',()=>{
  for(const target of [{x:300,y:300},{x:822,y:390},{x:-99,y:9999}]) {
    const route=findPath(START,target);assert.ok(route.length);assert.ok(isWalkable(route.at(-1).x,route.at(-1).y));
  }
});
test('walking reaches bench before sitting and can stand up to leave',()=>{
  const w={...START,path:findPath(START,BENCH),walking:true,sitting:false,sitOnArrival:true};
  for(let i=0;i<1500&&w.walking;i++)advanceWalker(w,.05);
  assert.equal(w.walking,false);assert.equal(w.sitting,true);assert.equal(w.x,BENCH.x);assert.equal(w.y,BENCH.y);
  w.path=findPath(w,START);w.walking=true;w.sitting=false;
  for(let i=0;i<1500&&w.walking;i++)advanceWalker(w,.05);
  assert.equal(w.sitting,false);assert.equal(w.x,START.x);assert.equal(w.y,START.y);
});
