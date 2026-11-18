/** Signed, with a real minus (U+2212); zero unsigned. */
export function signedDelta(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

/** Norwegian digit grouping and a real minus (3 821 420, −11). */
export function formatScore(n: number): string {
  return n.toLocaleString('nb-NO');
}
