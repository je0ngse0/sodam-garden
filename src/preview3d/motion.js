// Pure, deterministic preview motion; independent of the garden model and storage.
export const TAU = Math.PI * 2;
export function pawStep(distance, offset = 0) {
  const phase = ((distance / 0.64 + offset) % 1 + 1) % 1;
  const stance = 0.68;
  if (phase < stance) return { z: 0.2176 - phase * 0.64, y: 0 };
  const swing = (phase - stance) / (1 - stance);
  return { z: -0.2176 + 0.4352 * (0.5 - 0.5 * Math.cos(swing * Math.PI)), y: Math.sin(swing * Math.PI) * 0.13 };
}
export function walkPose(distance) {
  const radius = 1.05;
  const angle = distance / radius;
  return { x: radius * Math.sin(angle), z: radius * (Math.cos(angle) - 1), yaw: Math.PI / 2 + angle };
}
export function damp(value, target, rate, dt) {
  return value + (target - value) * (1 - Math.exp(-rate * Math.max(0, dt)));
}
