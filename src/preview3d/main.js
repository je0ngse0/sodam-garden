import * as THREE from 'three';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';
import { createCat } from './cat.js';
import { createGarden } from './garden.js';
import { walkPose, damp } from './motion.js';

// This entry point never imports app.js/model.js or reads/writes browser storage.
const $=selector=>document.querySelector(selector);
const viewport=$('#viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.domElement.setAttribute('aria-hidden','true');viewport.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e3e8d5');
scene.fog=new THREE.Fog('#e3e8d5',19,40);
const camera=new THREE.OrthographicCamera(-6,6,4,-4,.1,60);
const target=new THREE.Vector3(0,.5,0),initialPosition=new THREE.Vector3(6.4,5.8,9.2);
camera.position.copy(initialPosition);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.08;
controls.enablePan=false;controls.minPolarAngle=.3;controls.maxPolarAngle=1.35;
controls.minZoom=.8;controls.maxZoom=2.3;controls.rotateSpeed=.65;controls.zoomSpeed=.8;controls.update();
controls.saveState();
scene.add(new THREE.HemisphereLight('#fff7de','#8c9a76',1.8));
const sun=new THREE.DirectionalLight('#fff0ca',2.6);sun.position.set(-3.8,7.5,4.5);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.5,far:22});
sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;sun.shadow.radius=5;sun.shadow.intensity=.82;scene.add(sun);
const fill=new THREE.DirectionalLight('#dce8df',.65);fill.position.set(5,3,-5);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#dce3c9',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.32;floor.receiveShadow=true;scene.add(floor);
const garden=createGarden();scene.add(garden.group);
const catScale=1.22;
const cat=createCat();cat.root.scale.setScalar(catScale);cat.root.position.set(0,.08,.35);cat.root.rotation.y=.16;scene.add(cat.root);
// A soft contact shadow grounds the paws even under the broad fill light.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,8,64,64,64);
sg.addColorStop(0,'#40462870');sg.addColorStop(.5,'#40462838');sg.addColorStop(1,'#40462800');sc.fillStyle=sg;sc.fillRect(0,0,128,128);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
contact.rotation.x=-Math.PI/2;contact.position.y=.08;scene.add(contact);

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=reducedMotion.matches, mode='rest',petRemaining=0,distance=0,time=0,speed=0,last=0,ready=false;
function syncPause(){ $('#motion').setAttribute('aria-pressed',String(paused));$('#motion').textContent=paused?'움직임 재생':'움직임 멈추기'; }
syncPause();
function syncStatus(){
  $('#activity').textContent=petRemaining>0?'기분 좋은 크림이, 골골골…':paused?'이 순간을 가만히 바라봐요':mode==='walk'?'크림이가 느긋하게 산책해요':'크림이가 햇살 아래 쉬고 있어요';
}
function setMode(value){mode=value;petRemaining=0;$('#heart').classList.remove('show');document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));syncStatus();}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
function pet(){
  petRemaining=2.8;$('#heart').classList.remove('show');void $('#heart').offsetWidth;$('#heart').classList.add('show');syncStatus();
  // A deliberate action still gives visual feedback with animation paused.
  if(paused)cat.update(time,0,{distance:distance/catScale,walking:mode==='walk',petting:true});
}
$('#pet').addEventListener('click',pet);
$('#motion').addEventListener('click',()=>{paused=!paused;syncPause();syncStatus();});
reducedMotion.addEventListener('change',e=>{paused=e.matches;syncPause();syncStatus();});
$('#golden').addEventListener('change',e=>{
  const on=e.target.checked;
  sun.color.set(on?'#ffd2a0':'#fff0ca');sun.intensity=on?2.8:2.6;sun.position.set(on?-6:-3.8,on?4:7.5,4.5);
  scene.background.set(on?'#e9dfc9':'#e3e8d5');scene.fog.color.copy(scene.background);floorMat.color.set(on?'#ded8bc':'#dce3c9');
  $('#weather-label').textContent=on?'노을이 머무는 오후':'햇살 좋은 오후';
});
function zoom(multiplier){camera.zoom=THREE.MathUtils.clamp(camera.zoom*multiplier,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();}
$('#zoom-in').addEventListener('click',()=>zoom(1.18));$('#zoom-out').addEventListener('click',()=>zoom(1/1.18));
$('#reset-view').addEventListener('click',()=>{controls.reset();camera.position.copy(initialPosition);controls.target.copy(target);camera.zoom=1;camera.updateProjectionMatrix();controls.update();});
viewport.addEventListener('keydown',event=>{
  if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.1);}
  if(event.key==='-'){event.preventDefault();zoom(1/1.1);}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
    event.preventDefault();const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);
    if(event.key==='ArrowLeft')s.theta-=.12;if(event.key==='ArrowRight')s.theta+=.12;
    if(event.key==='ArrowUp')s.phi-=.1;if(event.key==='ArrowDown')s.phi+=.1;
    s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();
  }
});
// A tap pets the cat; dragging remains a camera gesture.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,id:event.pointerId};});
renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!down||down.id!==event.pointerId||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6){down=null;return;}down=null;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(cat.root,true).length)pet();
});
function resize(){
  const {width,height}=viewport.getBoundingClientRect();const aspect=width/height;
  // Fit the entire diorama on phones; desktop leaves space above the cat.
  const span=Math.max(7.3,8.9/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(width,height);
}
new ResizeObserver(resize).observe(viewport);resize();
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();$('#loading').hidden=false;$('#loading').textContent='3D 화면이 잠시 멈췄어요. 새로고침하면 다시 만날 수 있어요.';});
renderer.domElement.addEventListener('webglcontextrestored',()=>{$('#loading').hidden=true;});
function frame(timestamp){
  requestAnimationFrame(frame);
  const dt=Math.min(last?(timestamp-last)/1000:0,.04);last=timestamp;
  if(document.hidden)return;
  if(petRemaining>0){
    petRemaining=Math.max(0,petRemaining-dt);
    if(!petRemaining){$('#heart').classList.remove('show');cat.update(time,0,{distance:distance/catScale,walking:mode==='walk'});syncStatus();}
  }
  if(!paused){
    time+=dt;
    speed=damp(speed,mode==='walk'&&petRemaining===0?.36:0,4,dt);
    distance+=speed*dt;
    if(mode==='walk'||speed>.005){
      const pose=walkPose(distance);cat.root.position.x=pose.x;cat.root.position.z=pose.z+.35;
      const turn=Math.atan2(Math.sin(pose.yaw-cat.root.rotation.y),Math.cos(pose.yaw-cat.root.rotation.y));cat.root.rotation.y+=turn*(1-Math.exp(-dt*4));
    }
    cat.update(time,dt,{distance:distance/catScale,walking:mode==='walk',petting:petRemaining>0});garden.update(time);
  }
  contact.position.x=cat.root.position.x;contact.position.z=cat.root.position.z;contact.rotation.z=-cat.root.rotation.y;
  controls.update();renderer.render(scene,camera);
  if(!ready){ready=true;$('#loading').hidden=true;syncStatus();}
}
requestAnimationFrame(frame);
