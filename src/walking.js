import { BED, POND, WORLD } from './layout.js';

export const BENCH = { x: 840, y: 240 };
export const START = { x: 700, y: 640 };
const STEP = 20;

export function isWalkable(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 20 || x > WORLD.width - 20 || y < 140 || y > 700) return false;
  if (x > BED.x - 15 && x < BED.x + BED.width + 15 && y > BED.y - 20 && y < BED.y + BED.height + 20) return false;
  return ((x - POND.x) / (POND.rx + 16)) ** 2 + ((y - POND.y) / (POND.ry + 16)) ** 2 > 1;
}

function closestPoint(point) {
  let closest = START, distance = Infinity;
  for (let y = 140; y <= 700; y += STEP) {
    for (let x = 20; x <= 980; x += STEP) {
      if (!isWalkable(x, y)) continue;
      const next = Math.hypot(x - point.x, y - point.y);
      if (next < distance) { closest = { x, y }; distance = next; }
    }
  }
  return closest;
}

// Small navigation grid: route around the flowers and water, not through them.
export function findPath(from, destination) {
  const start = closestPoint(from), end = closestPoint(destination);
  const key = p => `${p.x},${p.y}`;
  const queue = [start], parents = new Map([[key(start), null]]);
  let head = 0;
  while (head < queue.length) {
    const point = queue[head++];
    if (key(point) === key(end)) {
      const path = [];
      let current = point;
      while (current) { path.unshift(current); current = parents.get(key(current)); }
      return path;
    }
    for (const [dx, dy] of [[STEP,0],[-STEP,0],[0,STEP],[0,-STEP],[STEP,STEP],[-STEP,STEP],[STEP,-STEP],[-STEP,-STEP]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      if (!isWalkable(next.x, next.y) || parents.has(key(next))) continue;
      if (dx && dy && (!isWalkable(point.x + dx, point.y) || !isWalkable(point.x, point.y + dy))) continue;
      parents.set(key(next), point);
      queue.push(next);
    }
  }
  return [];
}

export function advanceWalker(walker, seconds) {
  let distance = Math.max(0, Math.min(seconds, 0.1)) * 95;
  while (walker.path.length && distance > 0) {
    const next = walker.path[0];
    const dx = next.x - walker.x, dy = next.y - walker.y;
    const length = Math.hypot(dx, dy);
    if (Math.abs(dx) > .1) walker.direction = dx > 0 ? 1 : -1;
    if (length <= distance) { walker.x = next.x; walker.y = next.y; walker.path.shift(); distance -= length; }
    else { walker.x += dx / length * distance; walker.y += dy / length * distance; distance = 0; }
  }
  walker.walking = walker.path.length > 0;
  if (!walker.walking && walker.sitOnArrival) { walker.sitting = true; walker.sitOnArrival = false; }
}
