import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, restoreState, plant, water, progress, move, discover, feedFish, feedCooldown, PLOT_COUNT } from '../src/model.js';
test('a planted flower requires water and blooms after its duration',()=>{const s=freshState();assert.equal(plant(s,0,'daisy'),true);assert.equal(progress(s.plots[0],999999),0);assert.equal(water(s,0,1000),true);assert.equal(progress(s.plots[0],16000),.5);assert.equal(progress(s.plots[0],31000),1);assert.equal(water(s,0,99999),false);assert.equal(s.plots[0].wateredAt,1000);});
test('cannot overwrite flowers or plant invalid species/positions',()=>{const s=freshState();plant(s,0,'tulip');assert.equal(plant(s,0,'daisy'),false);assert.equal(plant(s,-1,'daisy'),false);assert.equal(plant(s,PLOT_COUNT,'daisy'),false);assert.equal(plant(s,1,'unknown'),false);assert.equal(water(s,1),false);});
test('moving preserves growth and refuses occupied destinations',()=>{const s=freshState();plant(s,0,'daisy');plant(s,1,'tulip');water(s,0,500);assert.equal(move(s,0,1),false);assert.equal(move(s,0,11),true);assert.equal(s.plots[0],null);assert.equal(s.plots[11].wateredAt,500);assert.equal(move(s,11,PLOT_COUNT),false);});
test('offline growth survives saving and visitors unlock once by flower',()=>{const s=freshState();['daisy','tulip','lavender'].forEach((f,i)=>{plant(s,i,f);water(s,i,1000);});const loaded=restoreState(JSON.stringify(s),100000);assert.equal(discover(loaded,30000).length,0);assert.deepEqual(discover(loaded,31000).map(c=>c.id),['cream']);assert.deepEqual(discover(loaded,51000).map(c=>c.id),['peach','night']);assert.equal(discover(loaded,100000).length,0);assert.equal(restoreState(JSON.stringify(loaded)).discovered.length,3);});
test('corrupt and incompatible saves recover safely',()=>{assert.deepEqual(restoreState('{oops'),freshState());assert.deepEqual(restoreState('{"version":2}'),freshState());const s=freshState();s.plots[0]={flower:'unknown',wateredAt:1};s.plots[1]={flower:'daisy',wateredAt:'oops'};s.plots[2]={flower:'tulip',wateredAt:999999};s.discovered=['cream','cream','bad'];s.pets=-10;const result=restoreState(JSON.stringify(s),1000);assert.equal(result.plots[0],null);assert.equal(result.plots[1].wateredAt,null);assert.equal(result.plots[2].wateredAt,1000);assert.deepEqual(result.discovered,['cream']);assert.equal(result.pets,0);});

test('legacy 12-plot gardens migrate without losing flowers, growth, or cats', () => {
  const old = {version:1, plots:Array.from({length:12}, (_,i)=>({flower:['daisy','tulip','lavender'][i%3], wateredAt:1000+i})), discovered:['cream','peach','night'], pets:19};
  const migrated=restoreState(JSON.stringify(old),100000);
  assert.equal(migrated.version,2);
  assert.equal(migrated.plots.length,24);
  old.plots.forEach((p,i)=>assert.deepEqual(migrated.plots[Math.floor(i/4)*6+i%4],p));
  assert.equal(migrated.plots.filter(Boolean).length,12);
  assert.deepEqual(migrated.discovered,old.discovered);
  assert.equal(migrated.pets,19);
  assert.equal(plant(migrated,23,'daisy'),true);
  assert.equal(move(migrated,0,22),true);
  assert.deepEqual(restoreState(JSON.stringify(migrated),100000),migrated);
});

test('feeding persists and cannot be repeated during a meal, even after reload', () => {
  const s=freshState();
  assert.equal(feedFish(s,1000),true);
  assert.equal(feedFish(s,1001),false);
  assert.equal(s.pond.feedings,1);
  const restored=restoreState(JSON.stringify(s),6000);
  assert.equal(feedCooldown(restored,6000),5000);
  assert.equal(feedFish(restored,6000),false);
  assert.equal(feedFish(restored,11000),true);
  assert.equal(restored.pond.feedings,2);
  assert.equal(feedCooldown(restored,999999),0);
});

test('invalid pond values are sanitized', () => {
  const s=freshState();s.pond={feedings:-4,lastFedAt:'wrong'};
  assert.deepEqual(restoreState(JSON.stringify(s)).pond,{feedings:0,lastFedAt:null});
});
