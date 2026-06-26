'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { ChartSettings, ColumnMapping, ResultBarNumberFormat, ResultSegmentOverride } from '@/types/chart';
import type { DataRow } from '@/types/data';
import {
  resolveColors,
  formatElectionNumber,
  fontWeightToCSS,
  measureTextWidth,
} from '@/lib/chart/utils';

interface ResultBarProps {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
  skipAnimation?: boolean;
}

// Rounded-rect path (all four corners)
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  if (radius <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return `M${x + radius},${y} h${w - 2 * radius} a${radius},${radius} 0 0 1 ${radius},${radius} v${h - 2 * radius} a${radius},${radius} 0 0 1 ${-radius},${radius} h${-(w - 2 * radius)} a${radius},${radius} 0 0 1 ${-radius},${-radius} v${-(h - 2 * radius)} a${radius},${radius} 0 0 1 ${radius},${-radius} Z`;
}

const WL = '100|200|300|400|500|600|700|800|900|normal|bold|light|medium|semibold|black';
const WORD_WEIGHT = new RegExp(`\\|(${WL})$`, 'i');             // a "|weight" suffix on a single word
const STRIP_WEIGHT = new RegExp(`\\|(${WL})(?=\\s|$)`, 'gi');    // for measurement
const NORM_WEIGHT = new RegExp(`\\s*\\|\\s*(${WL})\\b`, 'gi');   // tolerate "word |300" / "word | 300"
// Collapse any spaces around a "|weight" so the per-word parser always sees "word|weight"
function normW(s: string): string { return s.replace(NORM_WEIGHT, '|$1'); }

function aliasWeight(w: string): string {
  const l = w.toLowerCase();
  if (l === 'light') return '300';
  if (l === 'medium') return '500';
  if (l === 'semibold') return '600';
  if (l === 'black') return '900';
  if (l === '400') return 'normal';
  if (l === '700') return 'bold';
  return l;
}

// Auto black/white text color with an adjustable luminance cutoff (threshold 0–100).
function autoTextColor(hex: string, threshold: number): string {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return '#000000';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= (threshold / 100) * 255 ? '#000000' : '#ffffff';
}

// A word may carry its own weight as a "word|600" suffix.
function parseWeight(word: string, fallback: string): { t: string; w: string } {
  const m = word.match(WORD_WEIGHT);
  return m ? { t: word.slice(0, m.index), w: aliasWeight(m[1]) } : { t: word, w: fallback };
}

// Strip **markers** and |weight suffixes for width measurement
function stripMarks(s: string): string {
  return normW(s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(STRIP_WEIGHT, '');
}

// Text width including SVG letter-spacing (applied after each glyph).
function measureRun(text: string, size: number, family: string, weight: string, letter: number): number {
  return measureTextWidth(text, size, family, weight) + (letter ? text.length * letter : 0);
}

// Build word runs (text + weight) from a name, honoring UI per-word weights or inline markup
//   • per-word weights set in settings, or
//   • "Ekrem|300 İMAMOĞLU|800" / "Ekrem **İMAMOĞLU**" markup (fallback)
function nameRuns(text: string, baseW: string, boldW: string, wordWeights?: (string | null)[]): { text: string; weight: string }[] {
  if (wordWeights && wordWeights.length) {
    return text.split(/\s+/).filter(Boolean).map((word, i) => ({ text: word, weight: wordWeights[i] || baseW }));
  }
  const runs: { text: string; weight: string }[] = [];
  normW(text).split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0).forEach((p) => {
    const bold = p.startsWith('**') && p.endsWith('**');
    (bold ? p.slice(2, -2) : p).split(/\s+/).filter(Boolean).forEach((word) => {
      const { t, w } = parseWeight(word, bold ? boldW : baseW);
      runs.push({ text: t, weight: w });
    });
  });
  return runs.length ? runs : [{ text, weight: baseW }];
}

// Render each word as a SEPARATE <text x y> element — the most universally-supported SVG text
// construct. No tspans, no dominantBaseline, no whitespace/dx/baseline-shift. Every renderer
// (browsers, Illustrator, Inkscape, PowerPoint, rasterizers…) draws this identically, so exported
// SVGs are pixel-exact: words never merge and nothing shifts. `baselineY` is the text baseline.
function renderWordTexts(runs: { text: string; weight: string }[], anchorX: number, baselineY: number, anchor: 'start' | 'middle' | 'end', family: string, size: number, fill: string, keyPrefix: string): React.ReactNode {
  const spaceW = measureTextWidth(' ', size, family, 'normal');
  const widths = runs.map((r) => measureTextWidth(r.text, size, family, r.weight));
  const total = widths.reduce((a, b) => a + b, 0) + Math.max(0, runs.length - 1) * spaceW;
  let cx = anchor === 'middle' ? anchorX - total / 2 : anchor === 'end' ? anchorX - total : anchorX;
  return runs.map((r, i) => {
    const el = <text key={`${keyPrefix}-${i}`} x={cx} y={baselineY} textAnchor="start" fontSize={size} fontFamily={family} fontWeight={fontWeightToCSS(r.weight)} fill={fill}>{r.text}</text>;
    cx += widths[i] + spaceW;
    return el;
  });
}

// Render a string with letter-spacing BAKED INTO x positions: one <text> per character spaced by
// (glyph width + letter). This makes letter-spacing survive export renderers that ignore the
// letter-spacing attribute. With letter === 0 it falls back to a single <text> (no extra nodes).
function renderSpacedChars(text: string, startX: number, baselineY: number, size: number, weight: string, family: string, fill: string, letter: number, keyPrefix: string): React.ReactNode[] {
  if (!letter) {
    return [<text key={keyPrefix} x={startX} y={baselineY} textAnchor="start" fontSize={size} fontFamily={family} fontWeight={fontWeightToCSS(weight)} fill={fill}>{text}</text>];
  }
  const out: React.ReactNode[] = [];
  let cx = startX;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out.push(<text key={`${keyPrefix}-${i}`} x={cx} y={baselineY} textAnchor="start" fontSize={size} fontFamily={family} fontWeight={fontWeightToCSS(weight)} fill={fill}>{ch}</text>);
    cx += measureTextWidth(ch, size, family, weight) + letter;
  }
  return out;
}

interface Seg {
  key: string;
  name: string;
  rawValue: number;
  color: string;
  x: number;
  w: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  value: number;
  color: string;
}

export const ResultBar = React.memo(function ResultBar({
  data,
  columnMapping,
  settings,
  width,
  height: heightProp,
  seriesNames: seriesNamesProp,
  skipAnimation,
}: ResultBarProps) {
  const rb = settings.resultBar;
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(skipAnimation || !settings.animations.enabled ? 1 : 0);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, name: '', value: 0, color: '' });

  useEffect(() => {
    if (skipAnimation || !settings.animations.enabled) { setProgress(1); return; }
    setProgress(0);
    const start = performance.now();
    const dur = settings.animations.duration || 800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [skipAnimation, settings.animations.enabled, settings.animations.duration, data, columnMapping]);

  // Result bar defaults to NO rounding (full precision) — opt into rounding via
  // each number format's "Round numbers" toggle. (BarChartElection keeps rounding.)
  const fmt = (v: number, f: ResultBarNumberFormat) => formatElectionNumber(v, { ...f, rounding: f.rounding ?? false });
  const ov = (key: string): ResultSegmentOverride => rb.perSegment?.[key] || {};

  // ── Build segments (series mode: value columns = segments, from the first row) ──
  const { keys, names, rawVals, colors } = useMemo(() => {
    const valueCols = columnMapping.values || [];
    const nameMap = seriesNamesProp || columnMapping.seriesNames || {};
    if (valueCols.length === 0) return { keys: [] as string[], names: [] as string[], rawVals: [] as number[], colors: [] as string[] };

    // A cell counts as data only if it is present and non-zero (empty / 0 cells are skipped
    // entirely so no phantom "0,0" segments or labels appear).
    const hasData = (cell: unknown) => {
      if (cell === '' || cell == null) return false;
      const v = Number(cell);
      return !isNaN(v) && v !== 0;
    };

    // series mode when 2+ columns, or a single column with a single row
    if (valueCols.length >= 2 || data.length <= 1) {
      const row = data[0] || {};
      const kept = valueCols.filter((c) => hasData(row[c]));
      const dn = kept.map((c) => nameMap[c] || c);
      const vals = kept.map((c) => Number(row[c]));
      const cols = resolveColors(settings.colors, dn);
      return { keys: dn, names: dn, rawVals: vals, colors: cols };
    }
    // rows mode (single value column, multiple rows)
    const labelsCol = columnMapping.labels || '';
    const vc = valueCols[0];
    const ks: string[] = []; const vals: number[] = [];
    for (const row of data) {
      const label = String(row[labelsCol] ?? '');
      if (label && hasData(row[vc])) { ks.push(label); vals.push(Number(row[vc])); }
    }
    return { keys: ks, names: ks, rawVals: vals, colors: resolveColors(settings.colors, ks) };
  }, [data, columnMapping, settings.colors, seriesNamesProp]);

  const total = useMemo(() => rawVals.reduce((a, b) => a + Math.abs(b), 0), [rawVals]);

  // ── Layout sizes ──
  const pad = { top: settings.layout.paddingTop, right: settings.layout.paddingRight, bottom: settings.layout.paddingBottom, left: settings.layout.paddingLeft };
  const leftShown = rb.leftImage.show && !!rb.leftImage.url;
  const rightShown = rb.rightImage.show && !!rb.rightImage.url;
  const leftAbove = rb.leftImage.position === 'above';
  const rightAbove = rb.rightImage.position === 'above';
  // Only side images reserve horizontal space (above images sit over the bar at full width).
  const leftImgSpace = (leftShown && !leftAbove) ? rb.leftImage.paddingLeft + rb.leftImage.width + rb.leftImage.paddingRight + (rb.leftImage.gap || 0) : 0;
  const rightImgSpace = (rightShown && !rightAbove) ? rb.rightImage.paddingLeft + rb.rightImage.width + rb.rightImage.paddingRight + (rb.rightImage.gap || 0) : 0;
  const legendSideBlock = rb.legendPosition === 'left' || rb.legendPosition === 'right' ? rb.legendWidth : 0;
  const plotWidth = rb.manualPlotWidth ? rb.manualPlotWidthValue : Math.max(10, width - pad.left - pad.right - leftImgSpace - rightImgSpace - legendSideBlock);
  const barLeft = pad.left + leftImgSpace + (rb.legendPosition === 'left' ? legendSideBlock : 0);

  // ── Resolve per-segment label placement ──
  const segs: Seg[] = useMemo(() => {
    if (total === 0 || keys.length === 0) return [];
    const spacingTotal = rb.segmentSpacing * Math.max(0, keys.length - 1);
    const availW = plotWidth - spacingTotal;
    let cx = barLeft;
    return keys.map((key, i) => {
      const o = rb.perSegment?.[key] || {};
      const color = o.color || colors[i];
      const w = (Math.abs(rawVals[i]) / total) * availW;
      const seg: Seg = {
        key, name: o.name || names[i], rawValue: rawVals[i], color,
        x: cx, w, index: i, isFirst: i === 0, isLast: i === keys.length - 1,
      };
      cx += w + rb.segmentSpacing;
      return seg;
    });
  }, [keys, names, rawVals, colors, total, plotWidth, barLeft, rb.segmentSpacing, rb.perSegment]);

  // Resolve value / name placement per segment
  const resolved = useMemo(() => {
    return segs.map((seg) => {
      const o = rb.perSegment?.[seg.key] || {};
      const nameW = measureTextWidth(stripMarks(seg.name), rb.nameFontSize, rb.nameFontFamily, rb.nameBoldWeight);
      const fitsName = seg.w >= nameW;

      const vPos = o.valuePosition || rb.valuePosition;
      let valueMode: 'inside' | 'below' | 'both' | 'hidden';
      if (vPos === 'hidden') valueMode = 'hidden';
      else if (vPos === 'below') valueMode = 'below';
      else if (vPos === 'both') valueMode = 'both';
      else valueMode = 'inside'; // 'auto' / 'inside' → always drawn inside, even if it overflows the segment

      const nPos = o.namePosition || rb.namePosition;
      let nameMode: 'above' | 'legend' | 'hidden';
      if (nPos === 'hidden') nameMode = 'hidden';
      else if (nPos === 'above') nameMode = 'above';
      else if (nPos === 'legend') nameMode = 'legend';
      else nameMode = fitsName ? 'above' : 'legend'; // auto

      return { seg, valueMode, nameMode };
    });
  }, [segs, rb]);

  const anyAbove = resolved.some((r) => r.nameMode === 'above');
  const anyBelow = resolved.some((r) => r.valueMode === 'below' || r.valueMode === 'both');

  // Legend membership: auto = nameMode 'legend'; per-segment legendVisibleRows forces in/out.
  const legendItems = resolved
    .filter((r) => {
      const v = rb.legendVisibleRows?.[r.seg.key];
      return v === undefined ? r.nameMode === 'legend' : v;
    })
    .map((r) => r.seg);
  const legendBelow = rb.legendPosition === 'below' && legendItems.length > 0;

  // Reserve extra top space when a name is nudged upward (negative namePadY) so it isn't clipped.
  const nameUpPad = anyAbove ? Math.max(0, ...resolved.filter((r) => r.nameMode === 'above').map((r) => -((rb.perSegment?.[r.seg.key]?.namePadY) ?? 0))) : 0;
  const aboveHeight = anyAbove ? rb.nameFontSize + rb.nameGap + nameUpPad : 0;
  const belowValHeight = anyBelow ? rb.belowGap + rb.belowLineLength + rb.belowFontSize + 4 : 0;
  const legendBelowHeight = legendBelow
    ? rb.legendGap + (rb.legendOrientation === 'vertical' ? legendItems.length * (rb.legendFontSize + rb.legendItemGapY) : rb.legendFontSize) + 4
    : 0;
  const belowBandHeight = Math.max(belowValHeight, legendBelowHeight);

  // ── Difference info ──
  const diffInfo = useMemo(() => {
    if (!rb.diffShow || rawVals.length === 0) return null;
    let leaderIdx = 0;
    for (let i = 1; i < rawVals.length; i++) if (rawVals[i] > rawVals[leaderIdx]) leaderIdx = i;
    let trailerIdx = -1;
    for (let i = 0; i < rawVals.length; i++) { if (i === leaderIdx) continue; if (trailerIdx === -1 || rawVals[i] > rawVals[trailerIdx]) trailerIdx = i; }
    let value: number;
    if (rb.diffSource === 'info' && columnMapping.info) {
      const row = data[0] || {};
      value = Math.abs(Number(row[columnMapping.info]) || 0);
    } else {
      value = Math.abs((rawVals[leaderIdx] ?? 0) - (trailerIdx >= 0 ? rawVals[trailerIdx] : 0));
    }
    return {
      value,
      leaderLabel: names[leaderIdx] ?? '',
      trailerLabel: trailerIdx >= 0 ? names[trailerIdx] ?? '' : '',
      leaderColor: (rb.perSegment?.[keys[leaderIdx]]?.color) || colors[leaderIdx] || rb.diffColor,
    };
  }, [rb, rawVals, names, keys, colors, data, columnMapping.info]);

  const diffContribution = rb.diffShow && diffInfo ? rb.diffMarginTop + rb.diffHeight : 0;

  // Images may be taller than the bar — reserve the overhang above/below so they aren't clipped.
  // Above-positioned images sit over the chart at the very top (height + their top/bottom padding).
  const aboveImgBlock = Math.max(
    (leftShown && leftAbove) ? rb.leftImage.height + rb.leftImage.paddingTop + rb.leftImage.paddingBottom : 0,
    (rightShown && rightAbove) ? rb.rightImage.height + rb.rightImage.paddingTop + rb.rightImage.paddingBottom : 0,
  );
  // Only side images can overhang the bar vertically.
  const sideImgMaxH = Math.max(
    (leftShown && !leftAbove) ? rb.leftImage.height : 0,
    (rightShown && !rightAbove) ? rb.rightImage.height : 0,
  );
  const sideImgOverhang = Math.max(0, (sideImgMaxH - rb.barHeight) / 2);

  const topSpace = aboveImgBlock + Math.max(aboveHeight, sideImgOverhang);
  const barY = pad.top + topSpace;
  const barBottom = barY + rb.barHeight;
  const contentBottom = barBottom + belowBandHeight + diffContribution;
  const imageBottom = barBottom + sideImgOverhang;
  const totalHeight = Math.max(contentBottom, imageBottom) + pad.bottom;
  const chartHeight = heightProp || totalHeight;

  if (keys.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Map segment columns to see the result bar
      </div>
    );
  }

  const fontStyleFor = (mode: 'match' | 'custom', custom: string, segColor: string) => (mode === 'match' ? segColor : custom);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg ref={svgRef} width={width} height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} style={{ display: 'block' }}
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}>
        <rect x={0} y={0} width={width} height={chartHeight} fill={settings.layout.backgroundColor === 'transparent' ? 'none' : settings.layout.backgroundColor} fillOpacity={(settings.layout.backgroundOpacity ?? 100) / 100} />

        {/* Left image — beside the bar (side) or above the chart */}
        {leftShown && (() => {
          const img = rb.leftImage;
          const x = leftAbove ? barLeft + img.paddingLeft : pad.left + img.paddingLeft;
          const y = leftAbove ? pad.top + img.paddingTop : barY + (rb.barHeight - img.height) / 2 + img.paddingTop - img.paddingBottom;
          return (
            <g>
              <defs><clipPath id="rb-left-clip"><rect x={x} y={y} width={img.width} height={img.height} rx={img.borderRadius} ry={img.borderRadius} /></clipPath></defs>
              <image href={img.url} x={x} y={y} width={img.width} height={img.height} clipPath="url(#rb-left-clip)" preserveAspectRatio="xMidYMid slice" />
            </g>
          );
        })()}

        {/* Right image — beside the bar (side) or above the chart */}
        {rightShown && (() => {
          const img = rb.rightImage;
          const x = rightAbove ? barLeft + plotWidth - img.width - img.paddingRight : barLeft + plotWidth + (img.gap || 0) + img.paddingLeft;
          const y = rightAbove ? pad.top + img.paddingTop : barY + (rb.barHeight - img.height) / 2 + img.paddingTop - img.paddingBottom;
          return (
            <g>
              <defs><clipPath id="rb-right-clip"><rect x={x} y={y} width={img.width} height={img.height} rx={img.borderRadius} ry={img.borderRadius} /></clipPath></defs>
              <image href={img.url} x={x} y={y} width={img.width} height={img.height} clipPath="url(#rb-right-clip)" preserveAspectRatio="xMidYMid slice" />
            </g>
          );
        })()}

        {/* Segments */}
        {segs.map((seg) => {
          const w = Math.max(0, seg.w * progress);
          return (
            <path key={`seg-${seg.index}`} d={roundedRect(seg.x, barY, w, rb.barHeight, rb.cornerRadius)} fill={seg.color} opacity={rb.barOpacity}
              stroke={rb.outline ? rb.outlineColor : undefined} strokeWidth={rb.outline ? rb.outlineWidth : undefined}
              onMouseMove={(e) => {
                const r = svgRef.current?.getBoundingClientRect(); if (!r) return;
                setTooltip({ visible: true, x: e.clientX - r.left, y: e.clientY - r.top - 12, name: seg.name, value: seg.rawValue, color: seg.color });
              }}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            />
          );
        })}

        {/* Names above */}
        {resolved.map(({ seg, nameMode }) => {
          if (nameMode !== 'above') return null;
          const o = ov(seg.key);
          const color = o.nameColor || fontStyleFor(rb.nameColorMode, rb.nameColor, seg.color);
          let x: number; let anchor: 'start' | 'middle' | 'end';
          if (rb.valueAlignEdges && seg.isFirst) { x = seg.x; anchor = 'start'; }
          else if (rb.valueAlignEdges && seg.isLast) { x = seg.x + seg.w; anchor = 'end'; }
          else { x = seg.x + seg.w / 2; anchor = 'middle'; }
          const baseY = barY - rb.nameGap + (o.namePadY ?? 0);
          return (
            <g key={`name-${seg.index}`}>
              {renderWordTexts(nameRuns(seg.name, rb.nameFontWeight, rb.nameBoldWeight, o.nameWordWeights), x + (o.namePadX ?? 0), baseY, anchor, rb.nameFontFamily, rb.nameFontSize, color, `name-${seg.index}`)}
            </g>
          );
        })}

        {/* Inside values */}
        {resolved.map(({ seg, valueMode }) => {
          // Inside value: drawn for 'inside' / 'both' (auto resolves narrow segments to 'below').
          if (valueMode !== 'inside' && valueMode !== 'both') return null;
          const o = ov(seg.key);
          const segPrefixShow = o.prefixShow !== undefined ? o.prefixShow : rb.prefixShow;
          const segNf = o.valueDecimals !== undefined ? { ...rb.numberFormat, decimalPlaces: o.valueDecimals } : rb.numberFormat;
          const numText = fmt(Math.abs(seg.rawValue), segNf);
          const color = o.valueColor || (rb.valueColorMode === 'auto' ? autoTextColor(seg.color, rb.valueContrastThreshold) : rb.valueColor);
          const vSize = o.valueFontSize ?? rb.valueFontSize;
          const vFamily = o.valueFontFamily || rb.valueFontFamily;
          const vWeight = o.valueFontWeight || rb.valueFontWeight;
          const vLetter = o.valueLetterSpacing ?? rb.valueLetterSpacing;
          const segPrefixSize = o.prefixFontSize ?? rb.prefixFontSize;
          const pxSize = segPrefixSize * (vSize / rb.valueFontSize);
          const prefixPad = o.prefixPadding ?? rb.prefixPadding;
          const prefixPos = o.prefixPosition || rb.prefixPosition;
          const prefixVAlign = o.prefixVAlign || rb.prefixVAlign;
          const padX = o.valuePadX ?? 0;
          const padY = o.valuePadY ?? 0;
          const edgeAlign = rb.valueAlignEdges ? (seg.isFirst ? 'left' : seg.isLast ? 'right' : 'center') : 'center';
          const align = o.valueAlign || edgeAlign;
          let anchorX: number; let anchor: 'start' | 'middle' | 'end';
          if (align === 'left') { anchorX = seg.x + rb.valuePaddingX + padX; anchor = 'start'; }
          else if (align === 'right') { anchorX = seg.x + seg.w - rb.valuePaddingX - padX; anchor = 'end'; }
          else { anchorX = seg.x + seg.w / 2 + padX; anchor = 'middle'; }
          const cy = barY + rb.barHeight / 2 + padY;
          const px = rb.prefixText;
          const hasLeft = segPrefixShow && prefixPos === 'left';
          const hasRight = segPrefixShow && prefixPos === 'right';
          // Separate <text x y> per part — no tspans / dominantBaseline, so export is pixel-exact.
          const numW = measureRun(numText, vSize, vFamily, vWeight, vLetter);
          const pxW = (hasLeft || hasRight) ? measureRun(px, pxSize, vFamily, vWeight, vLetter) : 0;
          const totalW = numW + ((hasLeft || hasRight) ? pxW + prefixPad : 0);
          let sx = anchor === 'middle' ? anchorX - totalW / 2 : anchor === 'end' ? anchorX - totalW : anchorX;
          const numBaseY = cy + vSize * 0.35;        // baseline that visually centers the number
          const pBaseY = numBaseY + (prefixVAlign === 'top' ? -0.7 * (vSize - pxSize) : prefixVAlign === 'center' ? -0.35 * (vSize - pxSize) : 0);
          const tprops = { fontFamily: vFamily, fontWeight: fontWeightToCSS(vWeight), fill: color, textAnchor: 'start' as const };
          const parts: React.ReactNode[] = [];
          if (hasLeft) { parts.push(<text key="p" x={sx} y={pBaseY} fontSize={pxSize} {...tprops}>{px}</text>); sx += pxW + prefixPad; }
          // Number with letter-spacing baked into per-character x positions (export-safe).
          parts.push(...renderSpacedChars(numText, sx, numBaseY, vSize, vWeight, vFamily, color, vLetter, `valn-${seg.index}`)); sx += numW;
          if (hasRight) { sx += prefixPad; parts.push(<text key="p" x={sx} y={pBaseY} fontSize={pxSize} {...tprops}>{px}</text>); }
          return (
            <g key={`val-${seg.index}`}>
              {parts}
            </g>
          );
        })}

        {/* Below values (connector line + precise value) */}
        {resolved.map(({ seg, valueMode }) => {
          if (valueMode !== 'below' && valueMode !== 'both') return null;
          const o = ov(seg.key);
          const segPrefixShow = o.belowPrefixShow !== undefined ? o.belowPrefixShow : rb.belowPrefixShow;
          const color = o.belowColor || fontStyleFor(rb.belowColorMode, rb.belowColor, seg.color);
          const cx = seg.x + seg.w / 2;
          const lineTop = barBottom + rb.belowGap;
          const lineBottom = lineTop + rb.belowLineLength;
          const numText = fmt(Math.abs(seg.rawValue), rb.belowNumberFormat);
          const bSize = rb.belowFontSize;
          const bpxSize = rb.belowPrefixFontSize > 0 ? rb.belowPrefixFontSize : bSize;
          const bpPad = rb.belowPrefixPadding;
          const bWeight = String(rb.belowFontWeight);
          const bHasLeft = segPrefixShow && rb.belowPrefixPosition === 'left';
          const bHasRight = segPrefixShow && rb.belowPrefixPosition === 'right';
          const bNumBaseY = lineBottom + bSize;     // baseline just below the connector line
          const bpBaseY = bNumBaseY + (rb.belowPrefixVAlign === 'top' ? -0.7 * (bSize - bpxSize) : rb.belowPrefixVAlign === 'center' ? -0.35 * (bSize - bpxSize) : 0);
          const bNumW = measureRun(numText, bSize, rb.nameFontFamily, bWeight, 0);
          const bPxW = (bHasLeft || bHasRight) ? measureRun(rb.prefixText, bpxSize, rb.nameFontFamily, bWeight, 0) : 0;
          const bTotal = bNumW + ((bHasLeft || bHasRight) ? bPxW + bpPad : 0);
          let bsx = cx - bTotal / 2;
          const btprops = { fontFamily: rb.nameFontFamily, fontWeight: fontWeightToCSS(rb.belowFontWeight), fill: color, textAnchor: 'start' as const };
          const bParts: React.ReactNode[] = [];
          if (bHasLeft) { bParts.push(<text key="p" x={bsx} y={bpBaseY} fontSize={bpxSize} {...btprops}>{rb.prefixText}</text>); bsx += bPxW + bpPad; }
          bParts.push(<text key="n" x={bsx} y={bNumBaseY} fontSize={bSize} {...btprops}>{numText}</text>); bsx += bNumW;
          if (bHasRight) { bsx += bpPad; bParts.push(<text key="p" x={bsx} y={bpBaseY} fontSize={bpxSize} {...btprops}>{rb.prefixText}</text>); }
          return (
            <g key={`below-${seg.index}`}>
              <line x1={cx} y1={lineTop} x2={cx} y2={lineBottom} stroke={rb.belowLineColor} strokeWidth={rb.belowLineWidth} />
              {bParts}
            </g>
          );
        })}

        {/* Legend */}
        {legendItems.length > 0 && (() => {
          const dot = rb.legendDotSize;
          const gap = rb.legendDotGap;
          const itemGapX = rb.legendItemGapX;
          const itemGapY = rb.legendItemGapY;
          const isSide = rb.legendPosition !== 'below';
          const vertical = rb.legendOrientation === 'vertical' || isSide;
          const widths = legendItems.map((s) => dot + gap + measureTextWidth(stripMarks(s.name), rb.legendFontSize, rb.nameFontFamily, rb.legendFontWeight));
          const renderItem = (s: Seg, x: number, y: number, i: number) => (
            <g key={`leg-${i}`}>
              <circle cx={x + dot / 2} cy={y} r={dot / 2} fill={s.color} />
              {renderWordTexts(nameRuns(s.name, rb.legendFontWeight, rb.nameBoldWeight, ov(s.key).nameWordWeights), x + dot + gap, y + rb.legendFontSize * 0.35, 'start', rb.nameFontFamily, rb.legendFontSize, rb.legendColor, `legw-${i}`)}
            </g>
          );

          // Origin of the legend block
          let originX: number;
          if (rb.legendPosition === 'left') originX = pad.left + leftImgSpace;
          else if (rb.legendPosition === 'right') originX = barLeft + plotWidth + rightImgSpace + 8;
          else {
            const totalW = vertical ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + (legendItems.length - 1) * itemGapX;
            originX = barLeft;
            if (rb.legendAlign === 'center') originX = barLeft + (plotWidth - totalW) / 2;
            else if (rb.legendAlign === 'right') originX = barLeft + plotWidth - totalW;
          }

          if (vertical) {
            const baseY = isSide ? barY + rb.legendFontSize / 2 : barBottom + rb.legendGap + rb.legendFontSize / 2;
            return legendItems.map((s, i) => renderItem(s, originX, baseY + i * (rb.legendFontSize + itemGapY), i));
          }
          const y = barBottom + rb.legendGap + rb.legendFontSize / 2;
          let cx = originX;
          return legendItems.map((s, i) => {
            const el = renderItem(s, cx, y, i);
            cx += widths[i] + itemGapX;
            return el;
          });
        })()}

        {/* Difference bar */}
        {rb.diffShow && diffInfo && (() => {
          const top = barBottom + belowBandHeight + rb.diffMarginTop;
          const valueStr = fmt(diffInfo.value, rb.diffNumberFormat);
          const text = (rb.diffTemplate || '{leader} +{value}').replace(/\{leader\}/g, diffInfo.leaderLabel).replace(/\{trailer\}/g, diffInfo.trailerLabel).replace(/\{value\}/g, valueStr);
          const color = rb.diffMatchLeaderColor ? diffInfo.leaderColor : rb.diffColor;
          const size = rb.diffFontSize;
          const fam = rb.diffFontFamily;
          const wt = String(rb.diffFontWeight);
          const w = measureRun(text, size, fam, wt, 0);
          // left edge from alignment (explicit x + baseline → export-safe, no dominant-baseline)
          const startX = rb.diffAlign === 'left' ? barLeft + 12 : rb.diffAlign === 'right' ? barLeft + plotWidth - 12 - w : barLeft + plotWidth / 2 - w / 2;
          const by = top + rb.diffHeight / 2 + size * 0.35;
          // Italic as a baseline-compensated skew (oblique) — slants in EVERY renderer regardless of
          // whether the font's italic variant is available, with no embedded font (tiny file size).
          const SK = 0.2126; // tan(12°)
          const transform = rb.diffFontStyle === 'italic' ? `translate(${(SK * by).toFixed(2)} 0) skewX(-12)` : undefined;
          return (
            <g>
              <path d={roundedRect(barLeft, top, plotWidth, rb.diffHeight, rb.diffCornerRadius)} fill={rb.diffBackgroundColor} />
              <text x={startX} y={by} textAnchor="start" fontSize={size} fontFamily={fam} fontWeight={fontWeightToCSS(rb.diffFontWeight)} fill={color} transform={transform}>
                {text}
              </text>
              {rb.diffUnderline && <line x1={startX} y1={by + size * 0.16} x2={startX + w} y2={by + size * 0.16} stroke={color} strokeWidth={Math.max(1, size / 16)} />}
            </g>
          );
        })()}
      </svg>

      {tooltip.visible && settings.popupsPanels.showPopup && (
        <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)', backgroundColor: settings.popupsPanels.popupStyle === 'dark' ? '#333' : '#fff', color: settings.popupsPanels.popupStyle === 'dark' ? '#fff' : '#333', border: `1px solid ${settings.popupsPanels.popupStyle === 'dark' ? '#555' : '#ddd'}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: 'Inter, sans-serif', pointerEvents: 'none', zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: tooltip.color }} />
            <span>{tooltip.name}: {fmt(tooltip.value, rb.numberFormat)}</span>
          </div>
        </div>
      )}
    </div>
  );
});
