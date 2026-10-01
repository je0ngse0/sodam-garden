import { PLOT_COUNT } from './layout.js';
import { START, BENCH, isWalkable } from './walking.js';
export { PLOT_COUNT } from './layout.js';
export const FEED_INTERVAL = 10000;
export const FLOWERS = [
  { id: 'daisy', name: '데이지', description: '작은 햇살을 닮은 꽃', color: '#fff8e7', center: '#d9ae47', seconds: 30 },
  { id: 'tulip', name: '튤립', description: '포근한 마음 한 송이', color: '#dd8e83', center: '#be6e66', seconds: 40 },
  { id: 'lavender', name: '라벤더', description: '보랏빛 쉼표 같은 향기', color: '#a499c1', center: '#80739d', seconds: 50 },
];
export const CATS = [
  { id: 'cream', name: '크림이', flower: 'daisy', color: '#ecd0a2', description: '햇볕 아래 낮잠을 좋아해요' },
  { id: 'peach', name: '모모', flower: 'tulip', color: '#cb9371', description: '꽃향기를 따라 찾아왔어요' },
  { id: 'night', name: '밤이', flower: 'lavender', color: '#777580', description: '조용히 곁을 지켜주는 친구' },
];
export const freshState = () => ({ version: 3, plots: Array(PLOT_COUNT).fill(null), discovered: [], pets: 0, pond: { feedings: 0, lastFedAt: null }, bouquets: [], character: { ...START, sitting: false } });
export function restoreState(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (![1, 2, 3].includes(value?.version) || !Array.isArray(value.plots) || value.plots.length !== (value.version === 1 ? 12 : PLOT_COUNT)) return freshState();
    const plots = Array(PLOT_COUNT).fill(null);
    value.plots.forEach((p, i) => {
      // Preserve the old four-column arrangement in the enlarged six-column bed.
      const target = value.version === 1 ? Math.floor(i / 4) * 6 + i % 4 : i;
      plots[target] = p && FLOWERS.some(f => f.id === p.flower) ? {
        flower: p.flower,
        wateredAt: Number.isFinite(p.wateredAt) && p.wateredAt >= 0 ? Math.min(p.wateredAt, now) : null,
      } : null;
    });
    return {
      version: 3,
      plots,
      discovered: CATS.filter(c => Array.isArray(value.discovered) && value.discovered.includes(c.id)).map(c => c.id),
      pets: Number.isSafeInteger(value.pets) && value.pets >= 0 ? value.pets : 0,
      pond: {
        feedings: Number.isSafeInteger(value.pond?.feedings) && value.pond.feedings >= 0 ? value.pond.feedings : 0,
        lastFedAt: Number.isFinite(value.pond?.lastFedAt) && value.pond.lastFedAt >= 0 ? Math.min(value.pond.lastFedAt, now) : null,
      },
      bouquets: Array.isArray(value.bouquets) ? value.bouquets.filter(b => b && Number.isFinite(b.createdAt) && b.createdAt >= 0 && Array.isArray(b.flowers) && b.flowers.length >= 3 && b.flowers.length <= 9 && b.flowers.every(id => FLOWERS.some(f => f.id === id))).map(b => ({ createdAt: b.createdAt, flowers: [...b.flowers] })) : [],
      character: value.character?.sitting === true ? { ...BENCH, sitting: true } : isWalkable(value.character?.x, value.character?.y) ? { x: value.character.x, y: value.character.y, sitting: false } : { ...START, sitting: false },
    };
  } catch { return freshState(); }
}
export function progress(plot, now = Date.now()) {
  if (!plot || plot.wateredAt === null) return 0;
  const flower = FLOWERS.find(f => f.id === plot.flower);
  return Math.max(0, Math.min(1, (now - plot.wateredAt) / (flower.seconds * 1000)));
}
export function plant(state, index, flower) {
  if (!Number.isInteger(index) || index < 0 || index >= PLOT_COUNT || state.plots[index] || !FLOWERS.some(f => f.id === flower)) return false;
  state.plots[index] = { flower, wateredAt: null };
  return true;
}
export function water(state, index, now = Date.now()) {
  if (!state.plots[index] || state.plots[index].wateredAt !== null) return false;
  state.plots[index].wateredAt = now;
  return true;
}
export function move(state, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= PLOT_COUNT || to < 0 || to >= PLOT_COUNT || !state.plots[from] || state.plots[to]) return false;
  state.plots[to] = state.plots[from];
  state.plots[from] = null;
  return true;
}
export function discover(state, now = Date.now()) {
  const flowers = new Set(state.plots.filter(p => p && progress(p, now) === 1).map(p => p.flower));
  const arrivals = CATS.filter(c => flowers.has(c.flower) && !state.discovered.includes(c.id));
  state.discovered.push(...arrivals.map(c => c.id));
  return arrivals;
}

export function feedCooldown(state, now = Date.now()) {
  return state.pond.lastFedAt === null ? 0 : Math.max(0, FEED_INTERVAL - (now - state.pond.lastFedAt));
}

export function feedFish(state, now = Date.now()) {
  if (feedCooldown(state, now) > 0) return false;
  state.pond.lastFedAt = now;
  state.pond.feedings += 1;
  return true;
}

export function makeBouquet(state, indices, now = Date.now()) {
  if (!Array.isArray(indices) || indices.length < 3 || indices.length > 9 || new Set(indices).size !== indices.length) return null;
  if (!indices.every(i => Number.isInteger(i) && i >= 0 && i < PLOT_COUNT && state.plots[i] && progress(state.plots[i], now) === 1)) return null;
  const bouquet = { createdAt: now, flowers: indices.map(i => state.plots[i].flower) };
  // Validate the whole selection first, then harvest only the selected plots.
  state.bouquets.push(bouquet);
  indices.forEach(i => { state.plots[i] = null; });
  return bouquet;
}
