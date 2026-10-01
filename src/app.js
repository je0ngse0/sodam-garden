import { FLOWERS, CATS, freshState, restoreState, progress, plant, water, move, discover } from './model.js';
import { createPainter } from './art.js';
const $ = s => document.querySelector(s);
const KEY = 'sodam-garden-v1';
let state = freshState();
try { state = restoreState(localStorage.getItem(KEY)); } catch { $('#save-status').textContent = '저장할 수 없는 브라우저'; }
let tool = 'seed', seed = 'daisy', moving = null, currentCat = state.discovered.at(-1), petUntil = 0;
let toastTimer, particles = [], lastPaint = 0;
const paint = createPainter($('#garden'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); $('#save-status').textContent = '내 기기에 저장했어요'; } catch { $('#save-status').textContent = '저장 불가 · 이번 창에서만 유지'; toast('브라우저 저장 공간을 사용할 수 없어요. 이번 정원은 창을 닫으면 사라질 수 있어요.'); } }
const icons = {
 seed: '<svg viewBox="0 0 30 30" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M15 25V13M15 19C4 20 5 8 5 8s12-1 10 11ZM15 14C13 4 25 4 25 4s1 11-10 10Z"/></svg>',
 water: '<svg viewBox="0 0 30 30" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 12h13v12H6zM19 16l7-5 2 3-9 8M6 14C-1 7-1 23 6 21M12 8V5M22 24l-1 3M26 22l-1 3"/></svg>',
 remove: '<svg viewBox="0 0 30 30" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="m8 22 14-14M19 4l7 7-4 4-7-7zM8 15l7 7-9 4-2-2z"/></svg>',
};
document.querySelectorAll('[data-tool]').forEach(b => { b.querySelector('span').innerHTML = icons[b.dataset.tool]; b.addEventListener('click', () => selectTool(b.dataset.tool)); });
function selectTool(next) {
  tool = next; moving = null;
  document.querySelectorAll('[data-tool]').forEach(b => {const active = b.dataset.tool === tool;b.classList.toggle('active', active);b.setAttribute('aria-pressed', active);});
  $('#hint').textContent = { seed: '씨앗을 고르고 빈 흙을 눌러 심어보세요.', water: '목마른 새싹을 눌러 물을 주세요.', remove: '옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.' }[tool];
  renderPlots();
}
FLOWERS.forEach(f => {
  const b = document.createElement('button');b.className = 'seed';b.dataset.seed = f.id;b.setAttribute('aria-label', `${f.name} 씨앗 선택, 물을 주면 ${f.seconds}초 후 개화`);
  b.innerHTML = `<span class="seed-icon" style="color:${f.id === 'daisy' ? '#fffdf1' : f.color}">${seedPortrait(f)}</span><span><strong>${f.name}</strong><small>${f.description}</small></span><span class="check"></span>`;
  b.addEventListener('click', () => { seed = f.id;selectTool('seed');renderSeeds(); });$('#seeds').append(b);
});
function seedPortrait(f) {
  const petals = f.id === 'daisy'
    ? '<g fill="#fffdf1">' + Array.from({length:8}, (_,i) => `<ellipse cx="20" cy="10" rx="3.3" ry="7" transform="rotate(${i*45} 20 16)"/>`).join('') + '</g><circle cx="20" cy="16" r="4" fill="#d9ae47"/>'
    : f.id === 'tulip'
    ? '<path d="M10 10l6 4 4-7 4 7 6-4v10c0 13-20 13-20 0Z" fill="#dd8e83"/>'
    : '<g fill="#a499c1">' + Array.from({length:5}, (_,i) => `<ellipse cx="17" cy="${10+i*4}" rx="4" ry="3"/><ellipse cx="23" cy="${8+i*4}" rx="4" ry="3"/>`).join('') + '</g>';
  return `<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M20 36V17m0 14-8-5m8 8 8-5" stroke="#809465" stroke-width="2" fill="none"/>${petals}</svg>`;
}
function renderSeeds() { document.querySelectorAll('[data-seed]').forEach(b => {const active=b.dataset.seed===seed;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);b.querySelector('.check').textContent=active?'✓':'';}); }
const plotButtons = Array.from({length:12}, (_,i) => {
  const b=document.createElement('button');b.className='plot';b.dataset.plot=i;b.innerHTML='<span class="plot-label"></span>';b.addEventListener('click',()=>act(i));$('#plots').append(b);return b;
});
function renderPlots() {
  let blooms=0;
  plotButtons.forEach((b,i)=>{const p=state.plots[i];let label='빈 꽃밭';if(p){const f=FLOWERS.find(f=>f.id===p.flower),g=progress(p);if(g===1)blooms++;label=`${f.name} · ${p.wateredAt===null?'물을 주세요':g===1?'활짝 피었어요':Math.ceil(f.seconds*(1-g))+'초 후 개화'}`;}b.setAttribute('aria-label',`${i+1}번 ${label}`);b.querySelector('span').textContent=label;b.classList.toggle('selected',moving===i);});
  $('#bloom-count').textContent=`피어난 꽃 ${blooms} / 12`;
}
function act(index) {
  if(tool==='seed') {if(plant(state,index,seed)){toast(`${FLOWERS.find(f=>f.id===seed).name} 씨앗을 심었어요. 물을 주면 자라나요.`);chime(392);}else toast('이미 꽃이 있는 자리예요. 빈 흙에 심어주세요.');}
  if(tool==='water') {if(water(state,index)){toast('촉촉한 흙에서 조금씩 자라기 시작해요.');splash(index);chime(523.25);}else toast(state.plots[index]?'물은 충분해요. 편안히 기다려주세요.':'먼저 씨앗을 심어주세요.');}
  if(tool==='remove') {if(moving===null){if(!state.plots[index]){toast('먼저 옮길 꽃을 골라주세요.');return;}moving=index;$('#hint').textContent='이 꽃을 어디로 옮길까요? 빈 흙을 눌러주세요.';renderPlots();return;}if(moving===index){moving=null;$('#hint').textContent='옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.';renderPlots();return;}if(move(state,moving,index)){moving=null;toast('새로운 자리에 포근히 옮겼어요.');$('#hint').textContent='옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.';}else toast('빈 흙을 골라주세요.');}
  save();renderPlots();
}
function splash(index) { if(reducedMotion.matches)return;const col=index%4,row=Math.floor(index/4);for(let i=0;i<14;i++)particles.push({x:249+col*139,y:260+row*107,vx:(Math.random()-.5)*65,vy:-35-Math.random()*45,time:performance.now()}); }
function renderCats() {
  $('#visitors').replaceChildren();
  CATS.forEach(c=>{const known=state.discovered.includes(c.id),b=document.createElement('button');b.className='visitor'+(known?' known':'');b.innerHTML=`<span class="portrait">${known?catPortrait(c):'?'}</span><span>${known?c.name:'아직 낯선 친구'}</span>`;b.setAttribute('aria-label',known?`${c.name} 정원에 부르기`:`${FLOWERS.find(f=>f.id===c.flower).name} 꽃이 피면 만날 수 있어요`);b.addEventListener('click',()=>{if(known){currentCat=c.id;toast(`${c.name} · ${c.description}`);updateCat();}else toast(`${FLOWERS.find(f=>f.id===c.flower).name} 꽃이 피면 찾아올 거예요.`);});$('#visitors').append(b);});
  $('#cat-count').textContent=`${state.discovered.length} / 3`;
  $('#visitor-hint').textContent=state.discovered.length?'친구를 눌러 정원으로 불러보세요.':'꽃이 피면 친구가 찾아올 거예요.';
  updateCat();
}
function catPortrait(c) { return `<svg viewBox="0 0 50 50" width="39" height="39" aria-hidden="true"><path d="M8 25 7 8 21 17h8L43 8l-1 18" fill="${c.color}"/><ellipse cx="25" cy="29" rx="20" ry="17" fill="${c.color}"/><path d="m13 28 4 2 4-2m8 0 4 2 4-2" fill="none" stroke="#66564d" stroke-width="1.5" stroke-linecap="round"/><path d="m23 34 2 2 2-2" fill="none" stroke="#ad7770" stroke-width="2"/></svg>`; }
function updateCat() {$('#cat').hidden=!currentCat;if(currentCat)$('#cat').setAttribute('aria-label',`${CATS.find(c=>c.id===currentCat).name} 쓰다듬기`);}
$('#cat').addEventListener('click',()=>{if(performance.now()<petUntil)return;petUntil=performance.now()+2200;state.pets++;save();toast(`${CATS.find(c=>c.id===currentCat).name}가 가르릉… 기분 좋은 소리를 내요.`);chime(329.63);});
let audio, master, soundOn=false, soundTimer;
function chime(frequency) { if(!soundOn||!audio||audio.state!=='running')return;const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12,now+.03);gain.gain.exponentialRampToValueAtTime(.001,now+1.5);osc.connect(gain).connect(master);osc.start();osc.stop(now+1.6); }
$('#sound').addEventListener('click',async()=>{
  try {if(!audio){audio=new AudioContext();master=audio.createGain();master.gain.value=.3;master.connect(audio.destination);}soundOn=!soundOn;if(soundOn){await audio.resume();chime(392);soundTimer=setInterval(()=>{if(!document.hidden)chime([261.63,329.63,392,523.25][Math.floor(Math.random()*4)]);},4000);}else{clearInterval(soundTimer);await audio.suspend();}$('#sound').textContent=soundOn?'♫ 소리 끄기':'♫ 소리 켜기';$('#sound').setAttribute('aria-pressed',soundOn);}catch{soundOn=false;clearInterval(soundTimer);$('#sound').setAttribute('aria-pressed','false');$('#sound').textContent='♫ 소리 켜기';toast('이 브라우저에서는 소리를 재생할 수 없어요.');}
});
$('#help').addEventListener('click',()=>$('#help-dialog').showModal());
$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#start-garden').addEventListener('click',()=>$('#help-dialog').close());
document.addEventListener('keydown',e=>{if($('#help-dialog').open||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const next={'1':'seed','2':'water','3':'remove'}[e.key];if(next)selectTool(next);});
function tick() {const arrivals=discover(state);if(arrivals.length){currentCat=arrivals.at(-1).id;save();renderCats();toast(`${arrivals.map(c=>c.name).join(', ')}가 정원에 찾아왔어요! 살짝 쓰다듬어 볼까요?`);chime(659.25);}renderPlots();}
function frame(t) {if(!document.hidden&&t-lastPaint>(reducedMotion.matches?250:32)){particles=particles.filter(p=>t-p.time<1200);paint(state,reducedMotion.matches?0:t,moving,currentCat,petUntil,particles);lastPaint=t;}requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
renderSeeds();renderCats();tick();setInterval(tick,1000);requestAnimationFrame(frame);
