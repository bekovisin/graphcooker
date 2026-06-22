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

    // series mode when 2+ columns, or a single column with a single row
    if (valueCols.length >= 2 || data.length <= 1) {
      const row = data[0] || {};
      const dn = valueCols.map((c) => nameMap[c] || c);
      const vals = valueCols.map((c) => Number(row[c]) || 0);
      const cols = resolveColors(settings.colors, dn);
      return { keys: dn, names: dn, rawVals: vals, colors: cols };
    }
    // rows mode (single value column, multiple rows)
    const labelsCol = columnMapping.labels || '';
    const vc = valueCols[0];
    const ks: string[] = []; const vals: number[] = [];
    for (const row of data) {
      const label = String(row[labelsCol] ?? '');
      if (label) { ks.push(label); vals.push(Number(row[vc]) || 0); }
    }
    return { keys: ks, names: ks, rawVals: vals, colors: resolveColors(settings.colors, ks) };
  }, [data, columnMapping, settings.colors, seriesNamesProp]);

  const total = useMemo(() => rawVals.reduce((a, b) => a + Math.abs(b), 0), [rawVals]);

  // ── Layout sizes ──
  const pad = { top: settings.layout.paddingTop, right: settings.layout.paddingRight, bottom: settings.layout.paddingBottom, left: settings.layout.paddingLeft };
  const leftImgSpace = rb.leftImage.show && rb.leftImage.url ? rb.leftImage.width + rb.leftImage.paddingX * 2 : 0;
  const rightImgSpace = rb.rightImage.show && rb.rightImage.url ? rb.rightImage.width + rb.rightImage.paddingX * 2 : 0;
  const plotWidth = rb.manualPlotWidth ? rb.manualPlotWidthValue : Math.max(10, width - pad.left - pad.right - leftImgSpace - rightImgSpace);
  const barLeft = pad.left + leftImgSpace;

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
      const nameW = measureTextWidth(seg.name, rb.nameFontSize, rb.nameFontFamily, rb.nameFontWeight);
      const fitsName = seg.w >= nameW;

      const vPos = o.valuePosition || rb.valuePosition;
      let valueMode: 'inside_full' | 'inside_compact_below' | 'hidden';
      if (vPos === 'hidden') valueMode = 'hidden';
      else if (vPos === 'inside') valueMode = 'inside_full';
      else if (vPos === 'below') valueMode = 'inside_compact_below';
      else valueMode = fitsValue ? 'inside_full' : 'inside_compact_below'; // auto

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
  const anyBelow = resolved.some((r) => r.valueMode === 'inside_compact_below');
  const anyLegend = resolved.some((r) => r.nameMode === 'legend');

  const aboveHeight = anyAbove ? rb.nameFontSize + rb.nameGap : 0;
  const belowValHeight = anyBelow ? rb.belowGap + rb.belowLineLength + rb.belowFontSize + 4 : 0;
  const legendHeight = anyLegend ? rb.legendGap + rb.legendFontSize + 4 : 0;
  const belowBandHeight = Math.max(belowValHeight, legendHeight);

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

  const barY = pad.top + aboveHeight;
  const barBottom = barY + rb.barHeight;
  const totalHeight = pad.top + aboveHeight + rb.barHeight + belowBandHeight + diffContribution + pad.bottom;
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
              fontSize={rb.nameFontSize} fontFamily={rb.nameFontFamily} fontWeight={fontWeightToCSS(rb.nameFontWeight)} fill={color}>
              {seg.name}
            </text>
          );
        })}

        {/* Inside values */}
        {resolved.map(({ seg, valueMode }) => {
          if (valueMode === 'hidden') return null;
          const o = ov(seg.key);
          const compact = valueMode === 'inside_compact_below';
          const numText = fmt(Math.abs(seg.rawValue), compact ? { ...rb.numberFormat, decimalPlaces: 0, showTrailingZeros: false } : rb.numberFormat);
          const color = o.valueColor || (rb.valueColorMode === 'auto' ? getContrastColor(seg.color) : rb.valueColor);
          // Shrink the value to fit a narrow (overflow) segment so it never spills over neighbours
          let vSize = rb.valueFontSize;
          if (compact) {
            const tW = measureTextWidth((rb.prefixShow ? rb.prefixText : '') + numText, rb.valueFontSize, rb.valueFontFamily, rb.valueFontWeight);
            const avail = seg.w - 6;
            if (tW > avail && tW > 0) vSize = Math.max(11, rb.valueFontSize * (avail / tW));
          }
          const pxSize = rb.prefixFontSize * (vSize / rb.valueFontSize);
          let x: number; let anchor: 'start' | 'middle' | 'end';
          if (!compact && rb.valueAlignEdges && seg.isFirst) { x = seg.x + rb.valuePaddingX; anchor = 'start'; }
          else if (!compact && rb.valueAlignEdges && seg.isLast) { x = seg.x + seg.w - rb.valuePaddingX; anchor = 'end'; }
          else { x = seg.x + seg.w / 2; anchor = 'middle'; }
          const y = barY + rb.barHeight / 2;
          const px = rb.prefixShow ? rb.prefixText : '';
          return (
            <text key={`val-${seg.index}`} x={x} y={y} textAnchor={anchor} dominantBaseline="central"
              fontSize={vSize} fontFamily={rb.valueFontFamily} fontWeight={fontWeightToCSS(rb.valueFontWeight)} fill={color}>
              {rb.prefixShow && rb.prefixPosition === 'left' && <tspan fontSize={pxSize}>{px}</tspan>}
              <tspan>{numText}</tspan>
              {rb.prefixShow && rb.prefixPosition === 'right' && <tspan fontSize={pxSize}>{px}</tspan>}
            </text>
          );
        })}

        {/* Below values (connector line + precise value) */}
        {resolved.map(({ seg, valueMode }) => {
          if (valueMode !== 'inside_compact_below') return null;
          const o = ov(seg.key);
          const color = o.belowColor || fontStyleFor(rb.belowColorMode, rb.belowColor, seg.color);
          const cx = seg.x + seg.w / 2;
          const lineTop = barBottom + rb.belowGap;
          const lineBottom = lineTop + rb.belowLineLength;
          const text = (rb.prefixShow && rb.prefixPosition === 'left' ? rb.prefixText : '') + fmt(Math.abs(seg.rawValue), rb.belowNumberFormat) + (rb.prefixShow && rb.prefixPosition === 'right' ? rb.prefixText : '');
          return (
            <g key={`below-${seg.index}`}>
              <line x1={cx} y1={lineTop} x2={cx} y2={lineBottom} stroke={rb.belowLineColor} strokeWidth={rb.belowLineWidth} />
              <text x={cx} y={lineBottom + rb.belowFontSize} textAnchor="middle" fontSize={rb.belowFontSize} fontFamily={rb.nameFontFamily} fontWeight={fontWeightToCSS(rb.belowFontWeight)} fill={color}>
                {text}
              </text>
            </g>
          );
        })}

        {/* Legend (overflow names) */}
        {anyLegend && (() => {
          const items = resolved.filter((r) => r.nameMode === 'legend').map((r) => r.seg);
          const dot = rb.legendDotSize;
          const gap = 6;
          const itemGap = 16;
          const widths = items.map((s) => dot + gap + measureTextWidth(s.name, rb.legendFontSize, rb.nameFontFamily, rb.legendFontWeight));
          const totalW = widths.reduce((a, b) => a + b, 0) + (items.length - 1) * itemGap;
          let startX = barLeft;
          if (rb.legendAlign === 'center') startX = barLeft + (plotWidth - totalW) / 2;
          else if (rb.legendAlign === 'right') startX = barLeft + plotWidth - totalW;
          const y = barBottom + rb.legendGap + rb.legendFontSize / 2;
          let cx = startX;
          return items.map((s, i) => {
            const el = (
              <g key={`leg-${i}`}>
                <circle cx={cx + dot / 2} cy={y} r={dot / 2} fill={s.color} />
                <text x={cx + dot + gap} y={y} dominantBaseline="central" fontSize={rb.legendFontSize} fontFamily={rb.nameFontFamily} fontWeight={fontWeightToCSS(rb.legendFontWeight)} fill={rb.legendColor}>{s.name}</text>
              </g>
            );
            cx += widths[i] + itemGap;
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
