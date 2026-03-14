/**
 * Font embedding utility for SVG exports.
 *
 * When an SVG is serialized and loaded as an <img> blob URL (for PNG export),
 * the browser renders it in an isolated security context with NO access to
 * externally loaded fonts. This utility embeds @font-face rules with base64-
 * encoded WOFF2 data directly into the SVG so fonts travel with it.
 *
 * Used by all export paths (PNG, SVG, PDF) to ensure consistent font rendering
 * across desktop and mobile devices.
 */

const NS = 'http://www.w3.org/2000/svg';

/** Module-level cache: font URL → base64 data URI */
const fontDataCache = new Map<string, string>();

/** System fonts that don't need embedding (available natively) */
const SYSTEM_FONTS = new Set([
  'arial', 'helvetica', 'georgia', 'times new roman', 'courier new',
  'verdana', 'system-ui', 'sans-serif', 'serif', 'monospace',
  '-apple-system', 'blinkmacsystemfont', 'segoe ui',
]);

/**
 * Collect all unique font-family base names referenced by SVG text elements.
 * Returns cleaned names like "Inter", "Montserrat", "Roboto" (without fallbacks).
 */
function collectFontFamilies(svg: SVGSVGElement): Set<string> {
  const families = new Set<string>();

  const extractFamily = (raw: string | null) => {
    if (!raw) return;
    // font-family can be "Inter, sans-serif" or "'Montserrat', sans-serif"
    // Take each comma-separated part, strip quotes/whitespace
    const parts = raw.split(',');
    for (let i = 0; i < parts.length; i++) {
      const clean = parts[i].trim().replace(/^['"]|['"]$/g, '').trim();
      if (clean && !SYSTEM_FONTS.has(clean.toLowerCase())) {
        families.add(clean);
      }
    }
  };

  svg.querySelectorAll('text, tspan').forEach((el) => {
    // Check attribute
    extractFamily(el.getAttribute('font-family'));
    // Check inline style
    const style = el.getAttribute('style');
    if (style) {
      const match = style.match(/font-family\s*:\s*([^;]+)/i);
      if (match) extractFamily(match[1]);
    }
  });

  return families;
}

interface FontFaceInfo {
  /** Human-readable name to use in the embedded @font-face (e.g., "Inter") */
  familyName: string;
  /** Font weight (e.g., "400", "100 900" for variable fonts) */
  weight: string;
  /** Font style (e.g., "normal", "italic") */
  style: string;
  /** URL to the WOFF2 font file */
  url: string;
}

/**
 * Scan document.styleSheets for @font-face rules matching the needed font families.
 * next/font generates mangled names like "__Inter_abcdef" — we match by checking
 * if the @font-face family contains the base name.
 */
function findMatchingFontFaces(neededFamilies: Set<string>): FontFaceInfo[] {
  const results: FontFaceInfo[] = [];
  const seenUrls = new Set<string>();

  // Build lowercase lookup map
  const familyLookup = new Map<string, string>(); // lowercase → original
  neededFamilies.forEach((f) => {
    familyLookup.set(f.toLowerCase(), f);
  });

  try {
    const sheets = Array.from(document.styleSheets);
    for (let si = 0; si < sheets.length; si++) {
      const sheet = sheets[si];
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        // Cross-origin stylesheet — skip
        continue;
      }

      for (let ri = 0; ri < rules.length; ri++) {
        const rule = rules[ri];
        if (!(rule instanceof CSSFontFaceRule)) continue;

        const ffStyle = rule.style;
        const rawFamily = ffStyle.getPropertyValue('font-family').trim();
        const rawSrc = ffStyle.getPropertyValue('src');
        const weight = ffStyle.getPropertyValue('font-weight') || '400';
        const style = ffStyle.getPropertyValue('font-style') || 'normal';

        if (!rawFamily || !rawSrc) continue;

        // Match: check if this @font-face family relates to any needed family.
        // next/font names: "__Inter_abcdef", "'__Inter_abcdef'"
        const cleanFamily = rawFamily.replace(/^['"]|['"]$/g, '').trim();
        let matchedName: string | null = null;

        familyLookup.forEach((original, lower) => {
          if (!matchedName && cleanFamily.toLowerCase().includes(lower)) {
            matchedName = original;
          }
        });

        if (!matchedName) continue;

        // Extract URL from src (e.g., url(/path/to/font.woff2) format('woff2'))
        const urlMatch = rawSrc.match(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/);
        if (!urlMatch) continue;

        const url = urlMatch[1];
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        results.push({
          familyName: matchedName,
          weight,
          style,
          url,
        });
      }
    }
  } catch {
    // Stylesheet access failed — return whatever we found
  }

  return results;
}

/**
 * Fetch a font file and return it as a base64 data URI.
 * Results are cached module-wide so repeated exports don't re-fetch.
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const cached = fontDataCache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${url}`);

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Convert to base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const dataUri = `data:font/woff2;base64,${base64}`;

  fontDataCache.set(url, dataUri);
  return dataUri;
}

/**
 * Embed @font-face rules with base64-encoded font data into an SVG element.
 *
 * Call this on an already-cloned SVG (after prepareSvgForExport) before
 * serialization. Mutates the SVG in place by inserting a <defs><style> block.
 *
 * Gracefully handles failures — if a font can't be fetched, it's skipped
 * and the SVG will fall back to the browser's default font for that family.
 */
export async function embedFontsInSvg(svg: SVGSVGElement): Promise<void> {
  const neededFamilies = collectFontFamilies(svg);
  if (neededFamilies.size === 0) return;

  const fontFaces = findMatchingFontFaces(neededFamilies);
  if (fontFaces.length === 0) return;

  // Fetch all fonts in parallel
  const fontRules: string[] = [];
  const fetchPromises = fontFaces.map(async (ff) => {
    try {
      const dataUri = await fetchFontAsBase64(ff.url);
      return `@font-face {
  font-family: '${ff.familyName}';
  font-weight: ${ff.weight};
  font-style: ${ff.style};
  src: url('${dataUri}') format('woff2');
}`;
    } catch {
      // Skip fonts that fail to fetch
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((rule) => {
    if (rule) fontRules.push(rule);
  });

  if (fontRules.length === 0) return;

  // Create <defs><style> and inject as first child of SVG
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  const styleEl = document.createElementNS(NS, 'style');
  styleEl.setAttribute('type', 'text/css');
  styleEl.textContent = fontRules.join('\n');
  defs.insertBefore(styleEl, defs.firstChild);
}
