// Shared coordinates keep painted scenery and accessible buttons aligned.
export const WORLD = { width: 1000, height: 760 };
export const BED = { x: 65, y: 185, width: 600, height: 400, columns: 6, rows: 4 };
export const PLOT_COUNT = BED.columns * BED.rows;
export const POND = { x: 822, y: 390, rx: 132, ry: 116 };

export function plotPosition(index) {
  return {
    x: BED.x + (index % BED.columns + 0.5) * BED.width / BED.columns,
    y: BED.y + (Math.floor(index / BED.columns) + 0.64) * BED.height / BED.rows,
  };
}

export function catPose(id, time) {
  const routes = {
    cream: { x: 265, y: 656, travel: 125, offset: 0 },
    peach: { x: 420, y: 139, travel: 128, offset: 14000 },
    night: { x: 832, y: 619, travel: 62, offset: 28000 },
  };
  const route = routes[id];
  const phase = ((time + route.offset) % 48000) / 48000;
  const sleeping = phase >= 0.65;
  const walk = Math.min(phase / 0.65, 1);
  return {
    x: route.x - route.travel * Math.cos(walk * Math.PI * 2),
    y: route.y + (sleeping ? 0 : Math.sin(walk * Math.PI) * 6),
    // Arc length along the horizontal route keeps steps tied to ground travel.
    gaitPhase: (walk < .5 ? route.travel * (1 - Math.cos(walk * Math.PI * 2))
      : route.travel * (3 + Math.cos(walk * Math.PI * 2))) / 28 * Math.PI * 2,
    sleeping,
    walking: !sleeping,
    direction: walk < 0.5 ? 1 : -1,
  };
}
