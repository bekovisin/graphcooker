import type { ChartSettings } from '@/types/chart';
import { getPaletteColors, extendColors } from '@/lib/chart/palettes';

// ─── Color Helpers ──────────────────────────────────────────────────

export function parseCustomOverrides(overrides: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!overrides || !overrides.trim()) return map;
  overrides.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key && value) map[key] = value;
  });
  return map;
}

/**
 * Resolve colors for a list of names, applying palette + optional extend + custom overrides.
 * @param colorsSettings - The colors section from chart settings
 * @param names - Raw identifiers (column keys or category labels) used for override matching
 * @param displayNames - Optional map of raw key → display name. Overrides also match display names.
 */
export function resolveColors(
  colorsSettings: ChartSettings['colors'],
  names: string[],
  displayNames?: Record<string, string>,
): string[] {
  let colors = getPaletteColors(colorsSettings.palette, colorsSettings.customPaletteColors);
  if (colorsSettings.extend) {
    colors = extendColors(colors, Math.max(names.length, colors.length));
  }
  const overrides = parseCustomOverrides(colorsSettings.customOverrides);
  if (Object.keys(overrides).length === 0) {
    return names.map((_, i) => colors[i % colors.length]);
  }
  // Build a case-insensitive lookup for overrides
  const overridesLower: Record<string, string> = {};
  for (const [k, v] of Object.entries(overrides)) {
    overridesLower[k.toLowerCase()] = v;
  }
  return names.map((name, i) => {
    // Try exact match first, then case-insensitive
    if (overrides[name]) return overrides[name];
    // Try display name (if a rename was set)
    const display = displayNames?.[name];
    if (display && overrides[display]) return overrides[display];
    // Case-insensitive fallback
    const lower = name.toLowerCase();
    if (overridesLower[lower]) return overridesLower[lower];
    if (display) {
      const displayLower = display.toLowerCase();
      if (overridesLower[displayLower]) return overridesLower[displayLower];
    }
    return colors[i % colors.length];
  });
}

/** Parse a hex color (#rgb, #rrggbb, or #rrggbbaa — alpha ignored) into 0–255 channels. */
function parseHexColor(hexColor: string): { r: number; g: number; b: number } {
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((ch) => ch + ch).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return {
    r: Number.isNaN(r) ? 0 : r,
    g: Number.isNaN(g) ? 0 : g,
    b: Number.isNaN(b) ? 0 : b,
  };
}

/**
 * WCAG 2.x relative luminance of an sRGB color (0 = black … 1 = white).
 * Matches the formula used by axe-core / Google Lighthouse for contrast audits.
 */
export function relativeLuminance(hexColor: string): number {
  const { r, g, b } = parseHexColor(hexColor);
  const lin = (channel: number): number => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG black/white crossover: below this relative luminance, white gives the
// higher contrast ratio; above it, black does. This is the Google/Lighthouse choice.
const WCAG_CONTRAST_CROSSOVER = 0.1791;
// "Prefer white" strength=100 raises the crossover up to this luminance, so even
// fairly light mid-tones get white. (#16a34a≈0.269, #0ea5e9≈0.329 sit below ~0.34.)
const WHITE_PREFERENCE_MAX_LUMINANCE = 0.45;

/**
 * Pick black or white text for `hexColor`, using the WCAG 2.x relative-luminance
 * model (the same Google Lighthouse uses).
 *
 * - Without `whitePreference` (or when `enabled` is false) it returns the
 *   WCAG-optimal choice — whichever of black/white yields the higher contrast
 *   ratio (crossover luminance ≈ 0.179).
 * - With `whitePreference.enabled`, the black/white crossover is raised toward
 *   lighter colors by `strength` (0–100), so more saturated mid-tones get white
 *   (which reads sharper there). strength 0 ≈ WCAG; strength 100 ≈ luminance 0.45.
 */
export function getContrastColor(
  hexColor: string,
  whitePreference?: { enabled: boolean; strength: number },
): string {
  const L = relativeLuminance(hexColor);
  if (whitePreference?.enabled) {
    const t = Math.max(0, Math.min(100, whitePreference.strength)) / 100;
    const crossover = WCAG_CONTRAST_CROSSOVER + t * (WHITE_PREFERENCE_MAX_LUMINANCE - WCAG_CONTRAST_CROSSOVER);
    return L <= crossover ? '#ffffff' : '#000000';
  }
  const contrastWithWhite = 1.05 / (L + 0.05); // (1.0 + 0.05) / (L + 0.05)
  const contrastWithBlack = (L + 0.05) / 0.05; // (L + 0.05) / (0.0 + 0.05)
  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';
}

// ─── Number Formatting ──────────────────────────────────────────────

export function formatNumber(
  value: number,
  nf: ChartSettings['numberFormatting'],
  decimalOverride?: number,
  thousandsOverride?: string,
  decimalSepOverride?: string,
  prefixOverride?: string,
  suffixOverride?: string,
): string {
  const decimals = decimalOverride !== undefined ? decimalOverride : nf.decimalPlaces;
  const factor = Math.pow(10, decimals);
  const adjusted = nf.roundDecimal !== false
    ? Math.round(value * factor) / factor
    : value;
  let str = adjusted.toFixed(decimals);
  if (!nf.showTrailingZeros && str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  const [intPart, decPart] = str.split('.');
  let formattedInt = intPart;
  const tSep = thousandsOverride !== undefined ? thousandsOverride : nf.thousandsSeparator;
  if (tSep !== 'none') {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, tSep);
  }
  const dSep = decimalSepOverride !== undefined ? decimalSepOverride : nf.decimalSeparator;
  str = decPart ? `${formattedInt}${dSep}${decPart}` : formattedInt;
  const px = prefixOverride !== undefined ? prefixOverride : nf.prefix;
  const sx = suffixOverride !== undefined ? suffixOverride : nf.suffix;
  return `${px}${str}${sx}`;
}

/** Simplified number formatter using ElectionPerRowNumberFormat-style settings */
export function formatElectionNumber(
  value: number,
  fmt: {
    decimalPlaces: number;
    thousandsSeparator: string;
    decimalSeparator: string;
    prefix: string;
    suffix: string;
    showTrailingZeros: boolean;
    rounding?: boolean;
  },
): string {
  // rounding === false → show the value as entered (no rounding to decimalPlaces).
  // A 6-decimal cap kills floating-point noise while preserving real precision,
  // and trailing zeros are always trimmed in this mode.
  const doRound = fmt.rounding !== false;
  const dp = doRound ? fmt.decimalPlaces : 6;
  const factor = Math.pow(10, dp);
  const adjusted = Math.round(value * factor) / factor;
  let str = adjusted.toFixed(dp);
  if ((!doRound || !fmt.showTrailingZeros) && str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  const [intPart, decPart] = str.split('.');
  let formattedInt = intPart;
  if (fmt.thousandsSeparator !== 'none') {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousandsSeparator);
  }
  str = decPart ? `${formattedInt}${fmt.decimalSeparator}${decPart}` : formattedInt;
  return `${fmt.prefix}${str}${fmt.suffix}`;
}

// ─── Font / Text Helpers ────────────────────────────────────────────

export function fontWeightToCSS(fw: string): number {
  if (fw === 'bold') return 700;
  if (fw === '900') return 900;
  if (fw === '800') return 800;
  if (fw === '600') return 600;
  if (fw === '500') return 500;
  if (fw === '300') return 300;
  if (fw === '200') return 200;
  if (fw === '100') return 100;
  return 400;
}

let _measureCanvas: HTMLCanvasElement | null = null;
export function measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight: string): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontWeightToCSS(fontWeight)} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

export function truncateText(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: string): string {
  const fullWidth = measureTextWidth(text, fontSize, fontFamily, fontWeight);
  if (fullWidth <= maxWidth) return text;
  const ellipsis = '...';
  const ellipsisW = measureTextWidth(ellipsis, fontSize, fontFamily, fontWeight);
  let truncated = text;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    if (measureTextWidth(truncated, fontSize, fontFamily, fontWeight) + ellipsisW <= maxWidth) {
      return truncated + ellipsis;
    }
  }
  return ellipsis;
}

export function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: string): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = measureTextWidth(testLine, fontSize, fontFamily, fontWeight);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = truncateText(lines[i], maxWidth, fontSize, fontFamily, fontWeight);
  }
  return lines.length > 0 ? lines : [truncateText(text, maxWidth, fontSize, fontFamily, fontWeight)];
}

/**
 * Widest rendered line width across `labels` when each is wrapped at `cap` px.
 * Labels that fit on one line contribute their full width; longer ones are wrapped
 * (each wrapped line is already ≤ cap), so the result is always ≤ cap. Used by the
 * Y-axis "Auto" (ratio) space mode to collapse the unused label-column slack.
 */
export function measureWrappedMaxWidth(
  labels: string[],
  cap: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
): number {
  let maxW = 0;
  for (const label of labels) {
    if (!label) continue;
    const fullW = measureTextWidth(label, fontSize, fontFamily, fontWeight);
    if (fullW <= cap) {
      if (fullW > maxW) maxW = fullW;
      continue;
    }
    const lines = wrapText(label, cap, fontSize, fontFamily, fontWeight);
    for (const ln of lines) {
      const w = measureTextWidth(ln, fontSize, fontFamily, fontWeight);
      if (w > maxW) maxW = w;
    }
  }
  return maxW;
}
