/**
 * Convert text that uses a non-standard font weight (anything but 400/700) into
 * vector outlines (<path>) for export.
 *
 * Why: design tools (Figma, Illustrator, Inkscape) resolve SVG fonts by their
 * own installed/available cuts and map the numeric font-weight coarsely — Figma,
 * for instance, rounds 600 (semibold) to Bold and ignores embedded @font-face.
 * There is no SVG attribute that forces "semibold" reliably across viewers. The
 * only viewer-independent fix is to bake the glyphs into geometry: a <path>
 * renders identically everywhere with no font or weight resolution involved.
 *
 * To keep files small and text mostly editable, ONLY non-400/700 text is
 * outlined (regular/bold stay as live <text>). The font file is fetched only to
 * read glyph outlines — it is NOT embedded, so output size only grows by the
 * (small) path data for the few affected strings.
 *
 * Must run AFTER inlineStyles (so font attrs and baseline y are explicit). All
 * result-bar text is text-anchor="start" with an explicit x/baseline-y, but
 * middle/end anchors are handled too for other chart types.
 */

// app/layout.tsx fonts → @expo-google-fonts package + filename base (static TTFs).
const FAMILY_FONT: Record<string, { pkg: string; file: string }> = {
  Montserrat: { pkg: 'montserrat', file: 'Montserrat' },
  Inter: { pkg: 'inter', file: 'Inter' },
  Roboto: { pkg: 'roboto', file: 'Roboto' },
  Outfit: { pkg: 'outfit', file: 'Outfit' },
};
const WEIGHT_NAME: Record<number, string> = {
  100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
  500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};
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

// Parsed-font cache, keyed family|weight (null = known-unavailable).
const fontCache = new Map<string, unknown>();

/* eslint-disable @typescript-eslint/no-explicit-any */
async function loadFont(family: string, weight: number, parse: (b: ArrayBuffer) => any): Promise<any> {
  const key = `${family}|${weight}`;
  if (fontCache.has(key)) return fontCache.get(key);
  const info = FAMILY_FONT[family];
  const name = WEIGHT_NAME[weight];
  if (!info || !name) { fontCache.set(key, null); return null; }
  const url = `https://cdn.jsdelivr.net/npm/@expo-google-fonts/${info.pkg}/${info.file}_${weight}${name}.ttf`;
  try {
    const res = await fetch(url);
    if (!res.ok) { fontCache.set(key, null); return null; }
    const font = parse(await res.arrayBuffer());
    fontCache.set(key, font);
    return font;
  } catch {
    fontCache.set(key, null);
    return null;
  }
}

export async function outlineNonStandardWeights(clonedSvg: SVGSVGElement): Promise<boolean> {
  // Candidate text: non-400/700 weight + an outlineable Google font family.
  const candidates = Array.from(clonedSvg.querySelectorAll('text')).filter((el) => {
    if (!(el.textContent || '').trim()) return false;
    if (SAFE_WEIGHTS.has(normalizeWeight(el.getAttribute('font-weight') || ''))) return false;
    return !!FAMILY_FONT[firstFamily(el.getAttribute('font-family') || '')];
  });
  if (candidates.length === 0) return false;

  const ot: any = await import('opentype.js');
  const parse: ((b: ArrayBuffer) => any) | undefined = ot.parse || ot.default?.parse;
  if (!parse) return false;

  const SVGNS = 'http://www.w3.org/2000/svg';
  let changed = false;

  for (const el of candidates) {
    const text = el.textContent || '';
    const weight = normalizeWeight(el.getAttribute('font-weight') || '');
    const family = firstFamily(el.getAttribute('font-family') || '');
    const font = await loadFont(family, weight, parse);
    if (!font) continue;

    const size = parseFloat(el.getAttribute('font-size') || '0') || 16;
    const x = parseFloat(el.getAttribute('x') || '0');
    const y = parseFloat(el.getAttribute('y') || '0');
    const anchor = el.getAttribute('text-anchor') || 'start';

    // Many charts shift text vertically with a `dy` (e.g. dy="0.35em" to center
    // on a row). getPath() ignores dy, so fold it into the baseline or the
    // glyphs land too high. em units are relative to the font size.
    const dyAttr = (el.getAttribute('dy') || '').trim();
    const dy = dyAttr.endsWith('em') ? parseFloat(dyAttr) * size : parseFloat(dyAttr) || 0;
    const baselineY = y + (Number.isFinite(dy) ? dy : 0);

    let startX = x;
    if (anchor === 'middle' || anchor === 'end') {
      const adv = font.getAdvanceWidth(text, size);
      startX = anchor === 'middle' ? x - adv / 2 : x - adv;
    }

    let d = '';
    try {
      // 1 decimal place keeps glyphs crisp at chart sizes while keeping path
      // data (and thus file size) small.
      d = font.getPath(text, startX, baselineY, size).toPathData(1);
    } catch {
      continue;
    }
    if (!d) continue;

    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', el.getAttribute('fill') || '#000');
    const transform = el.getAttribute('transform');
    if (transform) path.setAttribute('transform', transform);
    const fillOpacity = el.getAttribute('fill-opacity');
    if (fillOpacity) path.setAttribute('fill-opacity', fillOpacity);
    const opacity = el.getAttribute('opacity');
    if (opacity) path.setAttribute('opacity', opacity);

    el.parentNode?.replaceChild(path, el);
    changed = true;
  }

  return changed;
}
