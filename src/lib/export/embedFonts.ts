/**
 * Embed non-standard font weights into an export-bound SVG so they render
 * pixel-perfectly even where the font isn't installed.
 *
 * Why: the exported SVG references fonts by name (e.g. "Montserrat"). A viewer
 * without Montserrat installed falls back to a system sans-serif that only has
 * regular (400) and bold (700), so medium (500) → regular and semibold (600) →
 * bold. To fix that without bloating every file, we embed ONLY the weights the
 * chart actually uses that aren't universally available (anything except 400 and
 * 700), and only the unicode-range subsets that cover the characters present.
 * Charts that use only regular/bold get zero embedded bytes.
 *
 * To avoid a CSS font-matching pitfall — if we declared the embedded weight under
 * the real family name "Montserrat", a 400 text in the same SVG could match the
 * only available face (e.g. 600) — each embedded weight gets a UNIQUE synthetic
 * family name (e.g. "Montserratw600"). We rewrite the font-family of only the
 * matching text/tspan elements to that synthetic name (keeping the original stack
 * as a fallback). 400/700 elements are never touched.
 *
 * The font data is inlined as a base64 data: URI, so the exported SVG is fully
 * self-contained (works offline, in any viewer, with no external requests).
 */

// The app's Google fonts (see app/layout.tsx). Only these are fetched/embedded.
const GOOGLE_FONTS = new Set(['Inter', 'Roboto', 'Montserrat', 'Outfit', 'Shantell Sans']);

// Weights a generic fallback (Arial/Helvetica/system sans) already provides.
const SAFE_WEIGHTS = new Set([400, 700]);

function normalizeWeight(w: string): number {
  const s = (w || '').trim().toLowerCase();
  if (s === 'bold') return 700;
  if (s === 'normal' || s === '') return 400;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 400 : n;
}

function firstFamily(stack: string): string {
  return (stack.split(',')[0] || '').trim().replace(/["']/g, '');
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

// Fetch a single (family, weight) from Google Fonts, subset to exactly the
// glyphs used (the `text=` param → Google returns a minimal woff2), and build
// one @font-face block under the synthetic family name. This keeps the embedded
// data to just the characters that appear in the chart (a few KB).
async function buildFaces(family: string, weight: number, synthetic: string, cps: Set<number>): Promise<string[]> {
  const text = Array.from(cps).map((c) => String.fromCodePoint(c)).join('');
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const css = await res.text();

  const faces: string[] = [];
  const blockRe = /@font-face\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(css))) {
    // `text=` subset URLs look like .../l/font?kit=...&v=v31 (no .woff2 suffix),
    // so match by the format('woff2') marker rather than the extension.
    const srcM = m[1].match(/src:\s*url\(([^)]+)\)\s*format\(['"]?woff2['"]?\)/);
    if (!srcM) continue;
    const b64 = await urlToBase64(srcM[1].replace(/["']/g, ''));
    if (!b64) continue;
    faces.push(
      `@font-face{font-family:'${synthetic}';font-style:normal;font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${b64}) format('woff2');}`
    );
  }
  return faces;
}

interface Group {
  family: string;
  weight: number;
  cps: Set<number>;
  els: Element[];
}

/**
 * Embed used non-400/700 font weights into `clonedSvg` (mutated in place).
 * Safe no-op (returns false, zero bytes) when the chart uses only regular/bold,
 * or when no embeddable Google font is involved, or if fetching fails.
 * Must be called AFTER inlineStyles so text elements carry explicit attributes.
 */
export async function embedFontWeights(clonedSvg: SVGSVGElement): Promise<boolean> {
  // Group matching elements by synthetic family (family + weight).
  const groups = new Map<string, Group>();
  clonedSvg.querySelectorAll('text, tspan').forEach((el) => {
    const txt = el.textContent || '';
    if (!txt.trim()) return;
    const weight = normalizeWeight(el.getAttribute('font-weight') || '');
    if (SAFE_WEIGHTS.has(weight)) return;
    const family = firstFamily(el.getAttribute('font-family') || '');
    if (!GOOGLE_FONTS.has(family)) return;

    const synthetic = `${family.replace(/\s+/g, '')}w${weight}`;
    let g = groups.get(synthetic);
    if (!g) { g = { family, weight, cps: new Set(), els: [] }; groups.set(synthetic, g); }
    g.els.push(el);
    for (const ch of txt) { const c = ch.codePointAt(0); if (c) g.cps.add(c); }
  });

  if (groups.size === 0) return false;

  const allFaces: string[] = [];
  for (const [synthetic, g] of Array.from(groups.entries())) {
    let faces: string[] = [];
    try {
      faces = await buildFaces(g.family, g.weight, synthetic, g.cps);
    } catch {
      faces = [];
    }
    if (!faces.length) continue;
    allFaces.push(...faces);
    // Insert the embedded synthetic family AFTER the real family, not before it.
    // Design tools (Figma, Illustrator, Inkscape) resolve fonts by installed/
    // available name and mostly ignore the embedded @font-face — keeping the real
    // family ("Montserrat") first lets them match it. Browsers/viewers that lack
    // the font fall through to the embedded synthetic. So the synthetic is a
    // fallback, never the primary, which prevents a default-font substitution
    // (e.g. Figma → Inter) when the first name is unknown.
    for (const el of g.els) {
      const orig = el.getAttribute('font-family') || g.family;
      const parts = orig.split(',').map((p) => p.trim()).filter(Boolean);
      const rebuilt = parts.length
        ? [parts[0], `'${synthetic}'`, ...parts.slice(1)].join(', ')
        : `${g.family}, '${synthetic}'`;
      el.setAttribute('font-family', rebuilt);
    }
  }

  if (allFaces.length === 0) return false;

  const SVGNS = 'http://www.w3.org/2000/svg';
  let defs = clonedSvg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVGNS, 'defs');
    clonedSvg.insertBefore(defs, clonedSvg.firstChild);
  }
  const styleEl = document.createElementNS(SVGNS, 'style');
  styleEl.setAttribute('type', 'text/css');
  styleEl.textContent = allFaces.join('');
  defs.appendChild(styleEl);
  return true;
}
