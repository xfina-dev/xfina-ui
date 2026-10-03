// "#2a78d6" -> "212.6 67.3% 50.2%". One decimal keeps every channel within one
// step of 255 of the source, which test/tokens.test.js holds it to.
export function triplet(value) {
  if (!value.startsWith("#")) return value;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const n = (x) => Number(x.toFixed(1));
  return `${n(h)} ${n(s * 100)}% ${n(l * 100)}%`;
}
