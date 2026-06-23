'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { ChartSettings, ColumnMapping, ResultBarNumberFormat, ResultSegmentOverride } from '@/types/chart';
import type { DataRow } from '@/types/data';
import {
  resolveColors,
  formatElectionNumber,
  getContrastColor,
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

// A word may carry its own weight as a "word|600" suffix.
function parseWeight(word: string, fallback: string): { t: string; w: string } {
  const m = word.match(WORD_WEIGHT);
  return m ? { t: word.slice(0, m.index), w: aliasWeight(m[1]) } : { t: word, w: fallback };
}

// Strip **markers** and |weight suffixes for width measurement
function stripMarks(s: string): string {
  return normW(s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(STRIP_WEIGHT, '');
}

// Render rich text where EACH WORD can have its own weight:
//   • "Ekrem|300 İMAMOĞLU|800"  → per-word weight, no markers needed
//   • "Ekrem **İMAMOĞLU**"      → wrapped part uses the bold weight
function renderRich(text: string, baseW: string, boldW: string): React.ReactNode {
  const parts = normW(text).split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  const out: React.ReactNode[] = [];
  let k = 0;
  parts.forEach((p) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      const { t, w } = parseWeight(p.slice(2, -2), boldW); // ** parts default to the bold weight
      out.push(<tspan key={k++} fontWeight={fontWeightToCSS(w)}>{t}</tspan>);
    } else {
      // keep whitespace; give each word its own weight (or the base weight)
      p.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { out.push(<tspan key={k++}>{tok}</tspan>); return; }
        const { t, w } = parseWeight(tok, baseW);
        out.push(<tspan key={k++} fontWeight={fontWeightToCSS(w)}>{t}</tspan>);
      });
    }
  });
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

  const fmt = (v: number, f: ResultBarNumberFormat) => formatElectionNumber(v, f);
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
  const leftImgSpace = rb.leftImage.show && rb.leftImage.url ? rb.leftImage.width + rb.leftImage.paddingX * 2 : 0;
  const rightImgSpace = rb.rightImage.show && rb.rightImage.url ? rb.rightImage.width + rb.rightImage.paddingX * 2 : 0;
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
      const fullText = (rb.prefixShow && rb.prefixPosition === 'left' ? rb.prefixText : '') + fmt(Math.abs(seg.rawValue), rb.numberFormat) + (rb.prefixShow && rb.prefixPosition === 'right' ? rb.prefixText : '');
      const fullW = measureTextWidth(fullText, rb.valueFontSize, rb.valueFontFamily, rb.valueFontWeight);
      const fitsValue = seg.w >= fullW + rb.valuePaddingX * 2;
      const nameW = measureTextWidth(stripMarks(seg.name), rb.nameFontSize, rb.nameFontFamily, rb.nameBoldWeight);
      const fitsName = seg.w >= nameW;

      const vPos = o.valuePosition || rb.valuePosition;
      let valueMode: 'inside' | 'below' | 'both' | 'hidden';
      if (vPos === 'hidden') valueMode = 'hidden';
      else if (vPos === 'inside') valueMode = 'inside';
      else if (vPos === 'below') valueMode = 'below';
      else if (vPos === 'both') valueMode = 'both';
      else valueMode = fitsValue ? 'inside' : 'below'; // auto

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

  const aboveHeight = anyAbove ? rb.nameFontSize + rb.nameGap : 0;
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
  const imgMaxH = Math.max(
    rb.leftImage.show && rb.leftImage.url ? rb.leftImage.height : 0,
    rb.rightImage.show && rb.rightImage.url ? rb.rightImage.height : 0,
  );
  const imgOverhang = Math.max(0, (imgMaxH - rb.barHeight) / 2);

  const topSpace = Math.max(aboveHeight, imgOverhang);
  const barY = pad.top + topSpace;
  const barBottom = barY + rb.barHeight;
  const contentBottom = barBottom + belowBandHeight + diffContribution;
  const imageBottom = barBottom + imgOverhang;
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

        {/* Left image (first segment) */}
        {rb.leftImage.show && rb.leftImage.url && (() => {
          const img = rb.leftImage;
          const x = pad.left + img.paddingX;
          const y = barY + (rb.barHeight - img.height) / 2;
          return (
            <g>
              <defs><clipPath id="rb-left-clip"><rect x={x} y={y} width={img.width} height={img.height} rx={img.borderRadius} ry={img.borderRadius} /></clipPath></defs>
              <image href={img.url} x={x} y={y} width={img.width} height={img.height} clipPath="url(#rb-left-clip)" preserveAspectRatio="xMidYMid slice" />
            </g>
          );
        })()}

        {/* Right image (last segment) */}
        {rb.rightImage.show && rb.rightImage.url && (() => {
          const img = rb.rightImage;
          const x = barLeft + plotWidth + img.paddingX;
          const y = barY + (rb.barHeight - img.height) / 2;
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
          return (
            <text key={`name-${seg.index}`} x={x} y={barY - rb.nameGap} textAnchor={anchor}
              fontSize={rb.nameFontSize} fontFamily={rb.nameFontFamily} fill={color}>
              {renderRich(seg.name, rb.nameFontWeight, rb.nameBoldWeight)}
            </text>
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
          const color = o.valueColor || (rb.valueColorMode === 'auto' ? getContrastColor(seg.color) : rb.valueColor);
          const vSize = o.valueFontSize ?? rb.valueFontSize;
          const vFamily = o.valueFontFamily || rb.valueFontFamily;
          const vWeight = o.valueFontWeight || rb.valueFontWeight;
          const vLetter = o.valueLetterSpacing ?? rb.valueLetterSpacing;
          const segPrefixSize = o.prefixFontSize ?? rb.prefixFontSize;
          const pxSize = segPrefixSize * (vSize / rb.valueFontSize);
          const prefixPad = o.prefixPadding ?? rb.prefixPadding;
          const prefixPos = o.prefixPosition || rb.prefixPosition;
          const prefixVAlign = o.prefixVAlign || rb.prefixVAlign;
          const vShift = prefixVAlign === 'top' ? -(vSize - pxSize) * 0.32 : prefixVAlign === 'bottom' ? (vSize - pxSize) * 0.32 : 0;
          const padX = o.valuePadX ?? 0;
          const padY = o.valuePadY ?? 0;
          const edgeAlign = rb.valueAlignEdges ? (seg.isFirst ? 'left' : seg.isLast ? 'right' : 'center') : 'center';
          const align = o.valueAlign || edgeAlign;
          let x: number; let anchor: 'start' | 'middle' | 'end';
          if (align === 'left') { x = seg.x + rb.valuePaddingX + padX; anchor = 'start'; }
          else if (align === 'right') { x = seg.x + seg.w - rb.valuePaddingX - padX; anchor = 'end'; }
          else { x = seg.x + seg.w / 2 + padX; anchor = 'middle'; }
          const y = barY + rb.barHeight / 2 + padY;
          const px = rb.prefixText;
          const hasLeft = segPrefixShow && prefixPos === 'left';
          const hasRight = segPrefixShow && prefixPos === 'right';
          return (
            <text key={`val-${seg.index}`} x={x} y={y} textAnchor={anchor} dominantBaseline="central"
              fontSize={vSize} fontFamily={vFamily} fontWeight={fontWeightToCSS(vWeight)} fill={color} letterSpacing={vLetter}>
              {hasLeft && <tspan fontSize={pxSize} dy={vShift}>{px}</tspan>}
              <tspan dy={hasLeft ? -vShift : 0} dx={hasLeft ? prefixPad : 0}>{numText}</tspan>
              {hasRight && <tspan fontSize={pxSize} dy={vShift} dx={prefixPad}>{px}</tspan>}
            </text>
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
          const text = (segPrefixShow && rb.prefixPosition === 'left' ? rb.prefixText : '') + fmt(Math.abs(seg.rawValue), rb.belowNumberFormat) + (segPrefixShow && rb.prefixPosition === 'right' ? rb.prefixText : '');
          return (
            <g key={`below-${seg.index}`}>
              <line x1={cx} y1={lineTop} x2={cx} y2={lineBottom} stroke={rb.belowLineColor} strokeWidth={rb.belowLineWidth} />
              <text x={cx} y={lineBottom + rb.belowFontSize} textAnchor="middle" fontSize={rb.belowFontSize} fontFamily={rb.nameFontFamily} fontWeight={fontWeightToCSS(rb.belowFontWeight)} fill={color}>
                {text}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {legendItems.length > 0 && (() => {
          const dot = rb.legendDotSize;
          const gap = 6;
          const itemGapX = rb.legendItemGapX;
          const itemGapY = rb.legendItemGapY;
          const isSide = rb.legendPosition !== 'below';
          const vertical = rb.legendOrientation === 'vertical' || isSide;
          const widths = legendItems.map((s) => dot + gap + measureTextWidth(stripMarks(s.name), rb.legendFontSize, rb.nameFontFamily, rb.legendFontWeight));
          const renderItem = (s: Seg, x: number, y: number, i: number) => (
            <g key={`leg-${i}`}>
              <circle cx={x + dot / 2} cy={y} r={dot / 2} fill={s.color} />
              <text x={x + dot + gap} y={y} dominantBaseline="central" fontSize={rb.legendFontSize} fontFamily={rb.nameFontFamily} fill={rb.legendColor}>{renderRich(s.name, rb.legendFontWeight, rb.nameBoldWeight)}</text>
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
          let tx: number; let anchor: 'start' | 'middle' | 'end';
          if (rb.diffAlign === 'left') { tx = barLeft + 12; anchor = 'start'; }
          else if (rb.diffAlign === 'right') { tx = barLeft + plotWidth - 12; anchor = 'end'; }
          else { tx = barLeft + plotWidth / 2; anchor = 'middle'; }
          return (
            <g>
              <path d={roundedRect(barLeft, top, plotWidth, rb.diffHeight, rb.diffCornerRadius)} fill={rb.diffBackgroundColor} />
              <text x={tx} y={top + rb.diffHeight / 2} textAnchor={anchor} dominantBaseline="central" fontSize={rb.diffFontSize} fontFamily={rb.diffFontFamily} fontWeight={fontWeightToCSS(rb.diffFontWeight)} fontStyle={rb.diffFontStyle} fill={color}>
                {text}
              </text>
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
