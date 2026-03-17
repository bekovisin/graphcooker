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

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
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
  },
): string {
  const factor = Math.pow(10, fmt.decimalPlaces);
  const adjusted = Math.round(value * factor) / factor;
  let str = adjusted.toFixed(fmt.decimalPlaces);
  if (!fmt.showTrailingZeros && str.includes('.')) {
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
