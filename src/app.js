import { FLOWERS, CATS, freshState, restoreState, progress, plant, water, move, discover, PLOT_COUNT, feedFish, feedCooldown, makeBouquet } from './model.js';
import { createPainter } from './art.js';
import { WORLD, BED, plotPosition, catPose } from './layout.js';
import { BENCH, findPath, advanceWalker } from './walking.js';
const $ = s => document.querySelector(s);
const KEY = 'sodam-garden-v1';
let state = freshState();
try { state = restoreState(localStorage.getItem(KEY)); } catch { $('#save-status').textContent = '저장할 수 없는 브라우저'; }
let tool = 'seed', seed = 'daisy', moving = null;
const selectedFlowers = new Set();
const walker = { ...state.character, path: [], walking: false, direction: 1, sitOnArrival: false };
let lastFrame = 0;
const petStates = new Map();
const catButtons = new Map();
let lastCatPoses = new Map();
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
document.querySelectorAll('[data-tool]').forEach(b => { if (icons[b.dataset.tool]) b.querySelector('span').innerHTML = icons[b.dataset.tool]; b.addEventListener('click', () => selectTool(b.dataset.tool)); });
function selectTool(next) {
  tool = next; moving = null;
  if (next !== 'harvest') selectedFlowers.clear();
  $('#harvest-bar').hidden = next !== 'harvest';
  $('#scene').classList.toggle('walk-mode', next === 'walk');
  renderSelection();
  document.querySelectorAll('[data-tool]').forEach(b => {const active = b.dataset.tool === tool;b.classList.toggle('active', active);b.setAttribute('aria-pressed', active);});
  $('#hint').textContent = { seed: '씨앗을 고르고 빈 흙을 눌러 심어보세요.', water: '목마른 새싹을 눌러 물을 주세요.', remove: '옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.', harvest: '다 핀 꽃 3~9칸을 고른 뒤 꽃다발로 묶어주세요.', walk: '잔디나 길을 눌러 걸어가세요. 벤치를 누르면 앉아서 쉬어요.' }[tool];
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
const plotButtons = Array.from({length:PLOT_COUNT}, (_,i) => {
  const b=document.createElement('button');b.className='plot';b.dataset.plot=i;b.innerHTML='<span class="plot-label"></span>';b.addEventListener('click',()=>act(i));$('#plots').append(b);return b;
});
function renderPlots() {
  let blooms=0;
  plotButtons.forEach((b,i)=>{const p=state.plots[i];let label='빈 꽃밭';if(p){const f=FLOWERS.find(f=>f.id===p.flower),g=progress(p);if(g===1)blooms++;label=`${f.name} · ${p.wateredAt===null?'물을 주세요':g===1?'활짝 피었어요':Math.ceil(f.seconds*(1-g))+'초 후 개화'}`;}b.setAttribute('aria-label',`${i+1}번 ${label}`);b.querySelector('span').textContent=label;b.classList.toggle('selected',moving===i);b.classList.toggle('harvest-selected',selectedFlowers.has(i));if(tool==='harvest')b.setAttribute('aria-pressed',selectedFlowers.has(i));else b.removeAttribute('aria-pressed');});
  $('#bloom-count').textContent=`피어난 꽃 ${blooms} / ${PLOT_COUNT}`;
}
function act(index) {
  if (tool === 'walk') return;
  if (tool === 'harvest') {
    if (selectedFlowers.has(index)) selectedFlowers.delete(index);
    else if (!state.plots[index] || progress(state.plots[index]) < 1) { toast('활짝 핀 꽃만 꽃다발로 만들 수 있어요.'); return; }
    else if (selectedFlowers.size >= 9) { toast('한 다발에는 최대 9칸의 꽃을 묶을 수 있어요.'); return; }
    else selectedFlowers.add(index);
    renderSelection(); renderPlots(); return;
  }
  if(tool==='seed') {if(plant(state,index,seed)){toast(`${FLOWERS.find(f=>f.id===seed).name} 씨앗을 심었어요. 물을 주면 자라나요.`);chime(392);}else toast('이미 꽃이 있는 자리예요. 빈 흙에 심어주세요.');}
  if(tool==='water') {if(water(state,index)){toast('촉촉한 흙에서 조금씩 자라기 시작해요.');splash(index);chime(523.25);}else toast(state.plots[index]?'물은 충분해요. 편안히 기다려주세요.':'먼저 씨앗을 심어주세요.');}
  if(tool==='remove') {if(moving===null){if(!state.plots[index]){toast('먼저 옮길 꽃을 골라주세요.');return;}moving=index;$('#hint').textContent='이 꽃을 어디로 옮길까요? 빈 흙을 눌러주세요.';renderPlots();return;}if(moving===index){moving=null;$('#hint').textContent='옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.';renderPlots();return;}if(move(state,moving,index)){moving=null;toast('새로운 자리에 포근히 옮겼어요.');$('#hint').textContent='옮길 꽃을 고른 다음, 빈 흙을 눌러주세요.';}else toast('빈 흙을 골라주세요.');}
  save();renderPlots();
}
function splash(index) { if(reducedMotion.matches)return;const pos=plotPosition(index);for(let i=0;i<14;i++)particles.push({x:pos.x,y:pos.y-20,vx:(Math.random()-.5)*65,vy:-35-Math.random()*45,time:performance.now()}); }
function renderCats() {
  $('#visitors').replaceChildren();
  CATS.forEach(c => {
    const known = state.discovered.includes(c.id);
    const b = document.createElement('button');
    b.className = 'visitor' + (known ? ' known' : '');
    b.innerHTML = `<span class="portrait">${known ? catPortrait(c) : '?'}</span><span>${known ? c.name : '아직 낯선 친구'}</span>`;
    b.setAttribute('aria-label', known ? `${c.name} 쓰다듬기` : `${FLOWERS.find(f => f.id === c.flower).name} 꽃이 피면 만날 수 있어요`);
    b.addEventListener('click', () => known ? petCat(c.id) : toast(`${FLOWERS.find(f => f.id === c.flower).name} 꽃이 피면 찾아올 거예요.`));
    $('#visitors').append(b);
    if (known && !catButtons.has(c.id)) {
      const hit = document.createElement('button');
      hit.className = 'cat-hit';
      hit.dataset.cat = c.id;
      hit.setAttribute('aria-label', `정원의 ${c.name} 쓰다듬기`);
      hit.addEventListener('click', () => petCat(c.id));
      $('#cats').append(hit);
      catButtons.set(c.id, hit);
    }
  });
  $('#cat-count').textContent = `${state.discovered.length} / 3`;
  $('#visitor-hint').textContent = state.discovered.length ? `${state.discovered.length}마리가 함께 쉬고 있어요. 살짝 쓰다듬어 주세요.` : '꽃이 피면 친구들이 함께 찾아와요.';
}
function petCat(id) {
  if (tool === 'walk') return;
  const now = performance.now();
  if (now < (petStates.get(id)?.until || 0)) return;
  petStates.set(id, { until: now + 2600, pose: lastCatPoses.get(id) || catPose(id, now) });
  state.pets++;
  save();
  toast(`${CATS.find(c => c.id === id).name}가 가르릉… 기분 좋은 소리를 내요.`);
  chime(329.63);
}
function renderPond() {
  const remaining = Math.ceil(feedCooldown(state) / 1000);
  const label = remaining ? `오물오물 먹는 중 · ${remaining}초` : '물고기 밥 주기';
  $('#feed-fish').textContent = label;
  $('#feed-fish').disabled = remaining > 0;
  $('#pond-hit').setAttribute('aria-label', label);
  $('#pond-hit').setAttribute('aria-disabled', remaining > 0);
  $('#feed-count').textContent = `밥 준 횟수 ${state.pond.feedings}번`;
  $('#pond-status').textContent = remaining ? '물고기들이 모여서 밥을 먹고 있어요.' : '연못을 누르면 물고기들이 반겨줄 거예요.';
}
function feed() {
  if (!feedFish(state)) { toast('아직 맛있게 먹는 중이에요. 잠시만 기다려주세요.'); return; }
  save();
  renderPond();
  toast('톡톡, 밥을 뿌렸어요. 물고기들이 모여들어요!');
  chime(523.25);
}
$('#feed-fish').addEventListener('click', feed);
$('#pond-hit').addEventListener('click', () => { if (tool !== 'walk') feed(); });
function catPortrait(c) { return `<svg viewBox="0 0 50 50" width="39" height="39" aria-hidden="true"><path d="M8 25 7 8 21 17h8L43 8l-1 18" fill="${c.color}"/><ellipse cx="25" cy="29" rx="20" ry="17" fill="${c.color}"/><path d="m13 28 4 2 4-2m8 0 4 2 4-2" fill="none" stroke="#66564d" stroke-width="1.5" stroke-linecap="round"/><path d="m23 34 2 2 2-2" fill="none" stroke="#ad7770" stroke-width="2"/></svg>`; }
let audio, master, soundOn=false, soundTimer;
function chime(frequency) { if(!soundOn||!audio||audio.state!=='running')return;const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12,now+.03);gain.gain.exponentialRampToValueAtTime(.001,now+1.5);osc.connect(gain).connect(master);osc.start();osc.stop(now+1.6); }
$('#sound').addEventListener('click',async()=>{
  try {if(!audio){audio=new AudioContext();master=audio.createGain();master.gain.value=.3;master.connect(audio.destination);}soundOn=!soundOn;if(soundOn){await audio.resume();chime(392);soundTimer=setInterval(()=>{if(!document.hidden)chime([261.63,329.63,392,523.25][Math.floor(Math.random()*4)]);},4000);}else{clearInterval(soundTimer);await audio.suspend();}$('#sound').textContent=soundOn?'♫ 소리 끄기':'♫ 소리 켜기';$('#sound').setAttribute('aria-pressed',soundOn);}catch{soundOn=false;clearInterval(soundTimer);$('#sound').setAttribute('aria-pressed','false');$('#sound').textContent='♫ 소리 켜기';toast('이 브라우저에서는 소리를 재생할 수 없어요.');}
});
$('#help').addEventListener('click',()=>$('#help-dialog').showModal());
$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#start-garden').addEventListener('click',()=>$('#help-dialog').close());
document.addEventListener('keydown',e=>{if($('#help-dialog').open||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const next={'1':'seed','2':'water','3':'remove','4':'harvest','5':'walk'}[e.key];if(next)selectTool(next);});
function tick() {const arrivals=discover(state);if(arrivals.length){save();renderCats();toast(`${arrivals.map(c=>c.name).join(', ')}가 정원에 찾아왔어요! 살짝 쓰다듬어 볼까요?`);chime(659.25);}renderPlots();renderPond();}
function frame(t) {
  const dt = lastFrame ? (t - lastFrame) / 1000 : 0;
  lastFrame = t;
  if (!document.hidden && walker.walking) {
    advanceWalker(walker, dt);
    if (!walker.walking) {
      state.character = { x: walker.x, y: walker.y, sitting: walker.sitting };
      save();
      $('#character-status').textContent = walker.sitting ? '벤치에서 쉬고 있어요' : '정원을 둘러보고 있어요';
    }
  }
  if (!document.hidden && t - lastPaint > (reducedMotion.matches ? 250 : 32)) {
    particles = particles.filter(p => t - p.time < 1200);
    const cats = state.discovered.map(id => {
      const pet = petStates.get(id);
      const petting = t < (pet?.until || 0);
      const pose = petting ? { ...pet.pose, sleeping: false, walking: false } : catPose(id, reducedMotion.matches ? 0 : t);
      lastCatPoses.set(id, pose);
      const button = catButtons.get(id);
      button.style.left = `${(pose.x - 62) / WORLD.width * 100}%`;
      button.style.top = `${(pose.y - 78) / WORLD.height * 100}%`;
      return { id, ...pose, petting };
    });
    paint(state, reducedMotion.matches ? 0 : t, cats, particles, t, walker);
    lastPaint = t;
  }
  requestAnimationFrame(frame);
}
Object.assign($('#plots').style, {
  left: `${BED.x / WORLD.width * 100}%`, top: `${BED.y / WORLD.height * 100}%`,
  width: `${BED.width / WORLD.width * 100}%`, height: `${BED.height / WORLD.height * 100}%`,
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
$('#character-status').textContent = walker.sitting ? '벤치에서 쉬고 있어요' : '잔디를 누르면 함께 걸어가요';
renderSeeds();renderCats();renderBouquets();renderSelection();tick();setInterval(tick,1000);requestAnimationFrame(frame);

function renderSelection() {
  const count = selectedFlowers.size;
  $('#selection-summary').textContent = count ? `${count}칸 선택 · 꽃다발을 만들면 이 자리만 비워져요` : '다 핀 꽃을 3~9칸 골라주세요.';
  $('#make-bouquet').disabled = count < 3;
  $('#make-bouquet').textContent = count >= 3 ? `${count}칸의 꽃으로 묶기` : '꽃다발 묶기';
}
$('#clear-selection').addEventListener('click', () => { selectedFlowers.clear(); renderSelection(); renderPlots(); });
$('#make-bouquet').addEventListener('click', () => {
  const bouquet = makeBouquet(state, [...selectedFlowers]);
  if (!bouquet) { toast('다 핀 꽃을 3~9칸 골라주세요.'); return; }
  selectedFlowers.clear(); save(); renderPlots(); renderSelection(); renderBouquets(); chime(659.25);
  toast('꽃다발을 보관함에 담았어요. 비워진 꽃밭에 새 씨앗을 심어볼까요?');
});
function bouquetArt(flowers) {
  const stems = flowers.map((id,i) => {
    const angle = (i - (flowers.length - 1) / 2) * 8;
    return `<g transform="translate(80 100) rotate(${angle})"><path d="M0 25 0-27" stroke="#6f855b" stroke-width="2"/><svg x="-20" y="${-70 + (i%2)*9}" width="40" height="40" viewBox="0 0 40 40">${seedPortrait(FLOWERS.find(f=>f.id===id))}</svg></g>`;
  }).join('');
  return `<svg viewBox="0 0 160 165" aria-hidden="true"><ellipse cx="80" cy="145" rx="36" ry="7" fill="#c8bda838"/><path d="M36 72 80 149 124 72 99 65 80 83 60 65Z" fill="#e9d3ad"/><path d="M36 72 80 149 63 86Z" fill="#d7bd93"/>${stems}<path d="m50 99 30 50 30-50-30 17Z" fill="#f2e3c7"/><path d="M67 124h26v6H67z" fill="#bc8584"/><path d="M80 127c-36-24-31 14 0 0 27-24 33 13 0 0m-2 2-9 16m14-16 10 16" stroke="#bc8584" stroke-width="3" fill="none"/></svg>`;
}
function renderBouquets() {
  $('#bouquet-count').textContent = `${state.bouquets.length}개`;
  $('#bouquet-gallery').replaceChildren();
  if (!state.bouquets.length) { const p=document.createElement('p');p.className='bouquet-empty';p.textContent='꽃이 피면 꽃다발 도구로 첫 다발을 만들어보세요.';$('#bouquet-gallery').append(p);return; }
  state.bouquets.slice().reverse().forEach((b,i) => {
    const card=document.createElement('article');card.className='bouquet-card';
    const name=state.bouquets.length-i;
    const varieties=FLOWERS.filter(f=>b.flowers.includes(f.id)).map(f=>`${f.name} ${b.flowers.filter(id=>id===f.id).length}`).join(' · ');
    card.innerHTML=`${bouquetArt(b.flowers)}<h3>정원의 꽃다발 ${name}</h3><p>${varieties}</p><small>${new Date(b.createdAt).toLocaleDateString('ko-KR')}</small>`;
    $('#bouquet-gallery').append(card);
  });
}
function navigate(destination, sit = false) {
  const path = findPath(walker, destination);
  if (!path.length) { toast('이쪽으로는 갈 수 없어요. 다른 길을 골라주세요.'); return; }
  walker.sitting = false; walker.path = path; walker.walking = true; walker.sitOnArrival = sit;
  $('#character-status').textContent = sit ? '벤치로 걸어가는 중이에요' : '선택한 곳으로 걸어가는 중이에요';
}
$('#bench-hit').addEventListener('click', e => { e.stopPropagation(); navigate(BENCH, true); });
$('#sit-down').addEventListener('click', () => navigate(BENCH, true));
$('#go-walk').addEventListener('click', () => { selectTool('walk'); navigate({x:420,y:660}); });
$('#scene').addEventListener('click', e => {
  if (e.target.closest('#bench-hit')) return;
  if (tool !== 'walk' && e.target.closest('button')) return;
  const rect=$('#scene').getBoundingClientRect();
  navigate({x:(e.clientX-rect.left)/rect.width*WORLD.width,y:(e.clientY-rect.top)/rect.height*WORLD.height});
});
$('#scene').addEventListener('keydown', e => {
  if (tool !== 'walk' || e.altKey || e.metaKey || e.ctrlKey) return;
  const deltas={ArrowUp:[0,-60],ArrowDown:[0,60],ArrowLeft:[-60,0],ArrowRight:[60,0]};
  if (!deltas[e.key]) return;
  e.preventDefault();const [x,y]=deltas[e.key];navigate({x:walker.x+x,y:walker.y+y});
});

window.addEventListener('pagehide', () => {
  state.character = { x: walker.x, y: walker.y, sitting: walker.sitting };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* The normal save path already reports unavailable storage. */ }
});
