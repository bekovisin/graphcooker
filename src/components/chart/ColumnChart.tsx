'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import {
  resolveColors,
  formatNumber,
  getContrastColor,
  fontWeightToCSS,
  measureTextWidth,
} from '@/lib/chart/utils';

// ─── Helpers ──────────────────────────────────────────────────────────

/** Path for a rect with only the TWO TOP corners rounded (columns growing up). */
function roundedTopRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  if (radius <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return [
    `M${x},${y + h}`,
    `V${y + radius}`,
    `A${radius},${radius},0,0,1,${x + radius},${y}`,
    `H${x + w - radius}`,
    `A${radius},${radius},0,0,1,${x + w},${y + radius}`,
    `V${y + h}`,
    'Z',
  ].join(' ');
}

/** Path for a rect with only the TWO BOTTOM corners rounded (negative columns growing down). */
function roundedBottomRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  if (radius <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return [
    `M${x},${y}`,
    `H${x + w}`,
    `V${y + h - radius}`,
    `A${radius},${radius},0,0,1,${x + w - radius},${y + h}`,
    `H${x + radius}`,
    `A${radius},${radius},0,0,1,${x},${y + h - radius}`,
    'Z',
  ].join(' ');
}

function generateNiceTicks(min: number, max: number, desiredCount = 5): number[] {
  if (!isFinite(min) || !isFinite(max) || max <= min) return [min || 0];
  const range = max - min;
  const roughStep = range / Math.max(1, desiredCount);
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v * 1e8) / 1e8);
  }
  return ticks;
}

function toNum(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.eE+-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── Types ────────────────────────────────────────────────────────────

interface SeriesData {
  key: string;
  name: string;
  data: number[];
  color: string;
}

interface Segment {
  x: number;
  w: number;
  yTop: number;     // pixel y of the column top edge
  yBot: number;     // pixel y of the column bottom edge (baseline side)
  positive: boolean;
  rawValue: number; // original data value (for tooltip / labels)
  pctValue: number; // value in axis space (== raw unless 100% mode)
  color: string;
  seriesName: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  category: string;
  series: string;
  value: number;
  color: string;
}

interface ColumnChartProps {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
  /** Skip animation and render at full values immediately (used for export) */
  skipAnimation?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export const ColumnChart = React.memo(function ColumnChart({
  data,
  columnMapping,
  settings,
  width,
  height: heightProp,
  seriesNames: seriesNamesProp,
  skipAnimation,
}: ColumnChartProps) {
  const col = settings.columns;
  const mode = col.mode;
  const isStacked = mode === 'stacked' || mode === 'stacked_100';
  const is100 = mode === 'stacked_100';

  // ── Animation ──
  const [progress, setProgress] = useState(skipAnimation || !settings.animations.enabled ? 1 : 0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (skipAnimation || !settings.animations.enabled) {
      setProgress(1);
      return;
    }
    setProgress(0);
    const duration = settings.animations.duration || 800;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - t, 3)); // easeOutCubic
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [skipAnimation, settings.animations.enabled, settings.animations.duration, mode, data.length]);

  // ── Tooltip ──
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, category: '', series: '', value: 0, color: '',
  });

  // ── Extract categories + series ──
  const labelKey = columnMapping.labels;
  const valueKeys = useMemo(() => columnMapping.values || [], [columnMapping.values]);
  const displayNames = useMemo(
    () => seriesNamesProp || columnMapping.seriesNames || {},
    [seriesNamesProp, columnMapping.seriesNames]
  );

  const categories = useMemo(
    () => data.map((row) => String(row[labelKey] ?? '')),
    [data, labelKey]
  );

  const seriesColors = useMemo(() => {
    if (settings.colors.colorMode === 'by_row') {
      return resolveColors(settings.colors, categories);
    }
    return resolveColors(settings.colors, valueKeys, displayNames);
  }, [settings.colors, valueKeys, categories, displayNames]);

  const series: SeriesData[] = useMemo(
    () =>
      valueKeys.map((key, i) => ({
        key,
        name: displayNames[key] || key,
        data: data.map((row) => toNum(row[key])),
        color: settings.colors.colorMode === 'by_row' ? '#888888' : seriesColors[i],
      })),
    [valueKeys, data, displayNames, seriesColors, settings.colors.colorMode]
  );

  // ── Value domain + ticks ──
  const { minVal, maxVal, ticks } = useMemo(() => {
    let lo = 0;
    let hi = 0;
    if (is100) {
      lo = 0;
      hi = 100;
    } else if (isStacked) {
      categories.forEach((_, ci) => {
        let pos = 0;
        let neg = 0;
        series.forEach((s) => {
          const v = s.data[ci];
          if (v >= 0) pos += v; else neg += v;
        });
        hi = Math.max(hi, pos);
        lo = Math.min(lo, neg);
      });
    } else {
      series.forEach((s) =>
        s.data.forEach((v) => {
          hi = Math.max(hi, v);
          lo = Math.min(lo, v);
        })
      );
    }
    const userMin = settings.xAxis.min !== '' ? parseFloat(settings.xAxis.min) : NaN;
    const userMax = settings.xAxis.max !== '' ? parseFloat(settings.xAxis.max) : NaN;
    if (!isNaN(userMin)) lo = userMin;
    if (!isNaN(userMax)) hi = userMax;
    if (hi === lo) hi = lo + 1;

    const desired = settings.xAxis.ticksToShowMode === 'number' ? settings.xAxis.ticksToShowNumber : 5;
    const t = is100 ? [0, 20, 40, 60, 80, 100] : generateNiceTicks(lo, hi, desired);
    const finalLo = isNaN(userMin) ? Math.min(lo, t[0]) : lo;
    const finalHi = isNaN(userMax) ? Math.max(hi, t[t.length - 1]) : hi;
    return { minVal: finalLo, maxVal: finalHi, ticks: t };
  }, [series, categories, isStacked, is100, settings.xAxis.min, settings.xAxis.max, settings.xAxis.ticksToShowMode, settings.xAxis.ticksToShowNumber]);

  const nf = settings.numberFormatting;
  const formatValueTick = useCallback(
    (v: number) =>
      formatNumber(v, nf, nf.xAxisCustomDecimals ? nf.xAxisDecimalPlaces : undefined) + (is100 ? '%' : ''),
    [nf, is100]
  );

  // ── Axis styling (value axis ← xAxis settings, category axis ← yAxis settings) ──
  const valTick = settings.xAxis.tickStyling;
  const catTick = settings.yAxis.tickStyling;
  const valAxisHidden = settings.xAxis.position === 'hidden';
  const catAxisHidden = settings.yAxis.position === 'hidden';

  // ── Insets ──
  const valueAxisWidth = useMemo(() => {
    if (valAxisHidden) return 0;
    let maxW = 0;
    ticks.forEach((t) => {
      const w = measureTextWidth(formatValueTick(t), valTick.fontSize, valTick.fontFamily, valTick.fontWeight);
      if (w > maxW) maxW = w;
    });
    const tickMarkLen = settings.xAxis.tickMarks.show ? settings.xAxis.tickMarks.length : 0;
    return maxW + 8 + tickMarkLen + (settings.xAxis.tickPadding || 0);
  }, [ticks, valTick, valAxisHidden, formatValueTick, settings.xAxis.tickMarks, settings.xAxis.tickPadding]);

  const valueTitle = settings.xAxis.titleType === 'custom' ? settings.xAxis.titleText : '';
  const valueTitleWidth = valueTitle ? settings.xAxis.titleStyling.fontSize + 6 : 0;

  const catTitle =
    settings.yAxis.titleType === 'custom'
      ? settings.yAxis.titleText
      : settings.yAxis.titleType === 'auto'
        ? labelKey
        : '';
  const catTitleHeight = catTitle ? settings.yAxis.titleStyling.fontSize + 8 : 0;

  const approxBand =
    (width - valueAxisWidth - valueTitleWidth - settings.layout.paddingLeft - settings.layout.paddingRight) /
    Math.max(1, categories.length);
  const maxCatLabelW = useMemo(() => {
    let m = 0;
    categories.forEach((c) => {
      const w = measureTextWidth(c, catTick.fontSize, catTick.fontFamily, catTick.fontWeight);
      if (w > m) m = w;
    });
    return m;
  }, [categories, catTick]);
  const rotateCatLabels = !catAxisHidden && maxCatLabelW > approxBand - 6 && categories.length > 1;
  const catLabelHeight = catAxisHidden
    ? 0
    : rotateCatLabels
      ? Math.min(maxCatLabelW, 130) * 0.72 + 10
      : catTick.fontSize * 1.2 + 10;

  // ── Legend geometry ──
  const legendItems = series;
  const legendIsOverlay = settings.legend.position === 'overlay';
  const legendIsAbove = settings.legend.position === 'above';
  const legendFontSize = settings.legend.size;
  const legendGap = settings.legend.swatchPadding || 8;
  const legendRowGap = settings.legend.rowGap ?? 4;
  const legendHeight = useMemo(() => {
    if (!settings.legend.show || legendIsOverlay || legendItems.length === 0) return 0;
    const marginTop = settings.legend.marginTop || 0;
    if (settings.legend.orientation === 'vertical') {
      return legendItems.length * (legendFontSize + legendGap) + marginTop + 10;
    }
    const swW = settings.legend.swatchWidth;
    const fontFamily = settings.legend.fontFamily || 'Inter, sans-serif';
    const textWeight = settings.legend.textWeight;
    if ((settings.legend.wrapMode || 'auto') === 'fixed') {
      const perRow = settings.legend.fixedItemsPerRow ?? 3;
      const rowCount = Math.ceil(legendItems.length / perRow);
      return rowCount * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
    }
    const itemWidths = legendItems.map((s) => swW + 4 + measureTextWidth(s.name, legendFontSize, fontFamily, textWeight));
    const availW = width - (settings.legend.paddingLeft || 0) - (settings.legend.paddingRight || 0);
    let rowCount = 1;
    let curW = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      const iw = itemWidths[i] + (curW > 0 ? legendGap : 0);
      if (curW > 0 && curW + iw > availW) { rowCount++; curW = itemWidths[i]; } else { curW += iw; }
    }
    return rowCount * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
  }, [settings.legend, legendItems, legendIsOverlay, legendFontSize, legendGap, legendRowGap, width]);

  const legendAboveOffset = legendIsAbove && !legendIsOverlay ? legendHeight : 0;
  const legendBelowOffset = !legendIsAbove && !legendIsOverlay ? legendHeight : 0;

  // ── Dimensions ──
  const topLabelSpace = col.showValues && col.valuePosition === 'above' ? col.valueFontSize + 8 : 6;
  const svgHeight = heightProp ?? Math.max(280, Math.min(540, Math.round(width * 0.62)));

  const padLeft = settings.layout.paddingLeft + valueTitleWidth + valueAxisWidth;
  const padRight = settings.layout.paddingRight + 8;
  const padTop = settings.layout.paddingTop + legendAboveOffset + topLabelSpace;
  const padBottom = settings.layout.paddingBottom + legendBelowOffset + catLabelHeight + catTitleHeight;

  const plotLeft = padLeft;
  const plotRight = width - padRight;
  const plotWidth = Math.max(10, plotRight - plotLeft);
  const plotTop = padTop;
  const plotBottom = svgHeight - padBottom;
  const plotHeight = Math.max(10, plotBottom - plotTop);

  // ── Scales ──
  const flip = settings.xAxis.flipAxis;
  const yScale = useCallback(
    (v: number) => {
      const ratio = (v - minVal) / (maxVal - minVal);
      return flip ? plotTop + plotHeight * ratio : plotBottom - plotHeight * ratio;
    },
    [minVal, maxVal, plotTop, plotBottom, plotHeight, flip]
  );

  const bandWidth = plotWidth / Math.max(1, categories.length);
  const groupWidth = bandWidth * col.columnWidth;
  const groupOffset = (bandWidth - groupWidth) / 2;

  // ── Per-category segment geometry (shared by columns + value labels) ──
  const columnGroups: Segment[][] = useMemo(() => {
    const y0 = Math.max(plotTop, Math.min(plotBottom, yScale(0)));
    return categories.map((_, ci) => {
      const groupX = plotLeft + ci * bandWidth + groupOffset;
      const rawVals = series.map((s) => s.data[ci]);
      const absTotal = rawVals.reduce((a, v) => a + Math.abs(v), 0) || 1;
      const axisVals = rawVals.map((v) => (is100 ? (v / absTotal) * 100 : v));

      if (isStacked) {
        let posCum = 0;
        let negCum = 0;
        return series.map((s, si): Segment => {
          const v = axisVals[si];
          let base: number;
          if (v >= 0) { base = posCum; posCum += v; } else { base = negCum; negCum += v; }
          const top = base + v;
          const yBase = yScale(base);
          const yT = yScale(top);
          let w = groupWidth;
          if (col.maxColumnWidth > 0) w = Math.min(w, col.maxColumnWidth);
          return {
            x: groupX + (groupWidth - w) / 2,
            w,
            yTop: Math.min(yBase, yT),
            yBot: Math.max(yBase, yT),
            positive: v >= 0,
            rawValue: rawVals[si],
            pctValue: v,
            color: settings.colors.colorMode === 'by_row' ? seriesColors[ci] : s.color,
            seriesName: s.name,
          };
        });
      }

      // Grouped
      const n = Math.max(1, series.length);
      const innerGap = groupWidth * col.groupSpacing;
      const slot = (groupWidth - innerGap * (n - 1)) / n;
      let w = slot;
      if (col.maxColumnWidth > 0) w = Math.min(w, col.maxColumnWidth);
      return series.map((s, si): Segment => {
        const v = axisVals[si];
        const yv = yScale(v);
        return {
          x: groupX + si * (slot + innerGap) + (slot - w) / 2,
          w,
          yTop: v >= 0 ? yv : y0,
          yBot: v >= 0 ? y0 : yv,
          positive: v >= 0,
          rawValue: rawVals[si],
          pctValue: v,
          color: settings.colors.colorMode === 'by_row' ? seriesColors[ci] : s.color,
          seriesName: s.name,
        };
      });
    });
  }, [categories, series, seriesColors, isStacked, is100, plotLeft, plotTop, plotBottom, bandWidth, groupWidth, groupOffset, col.groupSpacing, col.maxColumnWidth, settings.colors.colorMode, yScale]);

  const y0 = Math.max(plotTop, Math.min(plotBottom, yScale(0)));

  // ── Empty state ──
  if (data.length === 0 || valueKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Add data to see your column chart
      </div>
    );
  }

  const fontFor = (s: { fontFamily: string; fontSize: number; fontWeight: string; fontStyle?: string; color: string }) => ({
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: fontWeightToCSS(s.fontWeight),
    fontStyle: s.fontStyle || 'normal',
    fill: s.color,
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        width={width}
        height={svgHeight}
        viewBox={`0 0 ${width} ${svgHeight}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
      >
        {/* Plot background */}
        {settings.plotBackground.backgroundColor &&
          settings.plotBackground.backgroundColor !== 'transparent' &&
          settings.plotBackground.backgroundOpacity > 0 && (
            <rect
              x={plotLeft}
              y={plotTop}
              width={plotWidth}
              height={plotHeight}
              fill={settings.plotBackground.backgroundColor}
              opacity={settings.plotBackground.backgroundOpacity / 100}
              stroke={settings.plotBackground.border ? settings.plotBackground.borderColor : 'none'}
              strokeWidth={settings.plotBackground.border ? settings.plotBackground.borderWidth : 0}
            />
          )}

        {/* Gridlines + value-axis tick labels */}
        {ticks.map((t, i) => {
          const y = yScale(t);
          if (y < plotTop - 0.5 || y > plotBottom + 0.5) return null;
          const isZero = Math.abs(t) < 1e-9;
          const showGrid = settings.xAxis.gridlines && (!isZero || settings.xAxis.showZeroGridline);
          return (
            <g key={`grid-${i}`}>
              {showGrid && (
                <line
                  x1={plotLeft}
                  y1={y}
                  x2={plotRight}
                  y2={y}
                  stroke={settings.xAxis.gridlineStyling.color}
                  strokeWidth={settings.xAxis.gridlineStyling.width}
                  strokeDasharray={settings.xAxis.gridlineStyling.dashArray ? settings.xAxis.gridlineStyling.dashArray : undefined}
                />
              )}
              {!valAxisHidden && settings.xAxis.tickMarks.show && (
                <line
                  x1={plotLeft - settings.xAxis.tickMarks.length}
                  y1={y}
                  x2={plotLeft}
                  y2={y}
                  stroke={settings.xAxis.tickMarks.color}
                  strokeWidth={settings.xAxis.tickMarks.width}
                />
              )}
              {!valAxisHidden && (
                <text
                  x={plotLeft - 8 - (settings.xAxis.tickMarks.show ? settings.xAxis.tickMarks.length : 0)}
                  y={y}
                  dy="0.32em"
                  textAnchor="end"
                  style={fontFor(valTick)}
                >
                  {formatValueTick(t)}
                </text>
              )}
            </g>
          );
        })}

        {/* Value axis line */}
        {!valAxisHidden && settings.xAxis.axisLine.show && (
          <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke={settings.xAxis.axisLine.color} strokeWidth={settings.xAxis.axisLine.width} />
        )}

        {/* Zero baseline (only when data crosses zero) */}
        {settings.xAxis.zeroLine.show && minVal < 0 && maxVal > 0 && (
          <line x1={plotLeft} y1={y0} x2={plotRight} y2={y0} stroke={settings.xAxis.zeroLine.color} strokeWidth={settings.xAxis.zeroLine.width} />
        )}

        {/* Category axis line (bottom) */}
        {!catAxisHidden && settings.yAxis.axisLine.show && (
          <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke={settings.yAxis.axisLine.color} strokeWidth={settings.yAxis.axisLine.width} />
        )}

        {/* Columns + value labels */}
        {categories.map((cat, ci) => {
          const groupX = plotLeft + ci * bandWidth + groupOffset;
          const segs = columnGroups[ci];
          return (
            <g key={`cat-${ci}`}>
              {segs.map((seg, si) => {
                if (seg.rawValue === 0) return null;
                let fullH = seg.yBot - seg.yTop;
                if (col.minColumnHeight > 0 && fullH < col.minColumnHeight) fullH = col.minColumnHeight;
                const animH = fullH * progress;
                // Positive columns anchor at their bottom; negative at their top.
                const drawY = seg.positive ? seg.yBot - animH : seg.yTop;
                const path = seg.positive
                  ? roundedTopRectPath(seg.x, drawY, seg.w, animH, col.cornerRadius)
                  : roundedBottomRectPath(seg.x, drawY, seg.w, animH, col.cornerRadius);
                return (
                  <path
                    key={`col-${ci}-${si}`}
                    d={path}
                    fill={seg.color}
                    opacity={col.opacity}
                    stroke={col.outline ? col.outlineColor : 'none'}
                    strokeWidth={col.outline ? col.outlineWidth : 0}
                    onMouseMove={(e) => {
                      const svg = (e.target as SVGElement).ownerSVGElement;
                      if (!svg) return;
                      const r = svg.getBoundingClientRect();
                      setTooltip({
                        visible: true,
                        x: e.clientX - r.left,
                        y: seg.positive ? drawY : seg.yTop,
                        category: cat,
                        series: seg.seriesName,
                        value: seg.rawValue,
                        color: seg.color,
                      });
                    }}
                    onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                  />
                );
              })}

              {/* Value labels */}
              {col.showValues && progress > 0.995 && segs.map((seg, si) => {
                if (seg.rawValue === 0) return null;
                const displayVal = is100 ? seg.pctValue : seg.rawValue;
                const cx = seg.x + seg.w / 2;
                let cy: number;
                const inside = col.valuePosition !== 'above';
                if (isStacked || inside) {
                  if (col.valuePosition === 'inside_top') cy = seg.yTop + col.valueFontSize;
                  else if (col.valuePosition === 'inside_bottom') cy = seg.yBot - 5;
                  else cy = (seg.yTop + seg.yBot) / 2 + col.valueFontSize / 2 - 1;
                } else {
                  cy = (seg.positive ? seg.yTop : seg.yBot) - 5;
                }
                const labelColor =
                  col.valueColorMode === 'custom'
                    ? col.valueColor
                    : inside || isStacked
                      ? getContrastColor(seg.color)
                      : col.valueColor;
                return (
                  <text
                    key={`vl-${ci}-${si}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    style={{
                      fontFamily: col.valueFontFamily,
                      fontSize: col.valueFontSize,
                      fontWeight: fontWeightToCSS(col.valueFontWeight),
                      fill: labelColor,
                      pointerEvents: 'none',
                    }}
                  >
                    {formatNumber(displayVal, nf)}{is100 ? '%' : ''}
                  </text>
                );
              })}

              {/* Category label */}
              {!catAxisHidden && (
                rotateCatLabels ? (
                  <text
                    x={groupX + groupWidth / 2}
                    y={plotBottom + 10}
                    transform={`rotate(-45, ${groupX + groupWidth / 2}, ${plotBottom + 10})`}
                    textAnchor="end"
                    style={fontFor(catTick)}
                  >
                    {cat}
                  </text>
                ) : (
                  <text x={groupX + groupWidth / 2} y={plotBottom + catTick.fontSize + 6} textAnchor="middle" style={fontFor(catTick)}>
                    {cat}
                  </text>
                )
              )}
            </g>
          );
        })}

        {/* Value axis title (rotated, left) */}
        {valueTitle && (
          <text
            x={settings.layout.paddingLeft + settings.xAxis.titleStyling.fontSize}
            y={plotTop + plotHeight / 2}
            transform={`rotate(-90, ${settings.layout.paddingLeft + settings.xAxis.titleStyling.fontSize}, ${plotTop + plotHeight / 2})`}
            textAnchor="middle"
            style={fontFor(settings.xAxis.titleStyling)}
          >
            {valueTitle}
          </text>
        )}

        {/* Category axis title (bottom, centered) */}
        {catTitle && (
          <text
            x={plotLeft + plotWidth / 2}
            y={svgHeight - settings.layout.paddingBottom - legendBelowOffset - 2}
            textAnchor="middle"
            style={fontFor(settings.yAxis.titleStyling)}
          >
            {catTitle}
          </text>
        )}

        {/* Legend (inside SVG for export fidelity) */}
        {settings.legend.show && legendItems.length > 0 && !legendIsOverlay && (() => {
          const lPadL = settings.legend.paddingLeft || 0;
          const lPadR = settings.legend.paddingRight || 0;
          const swW = settings.legend.swatchWidth;
          const swH = settings.legend.swatchHeight;
          const gap = legendGap;
          const fontSize = legendFontSize;
          const fontFamily = settings.legend.fontFamily || 'Inter, sans-serif';
          const baselineY = legendIsAbove
            ? (settings.legend.marginTop || 0) + (settings.legend.paddingTop || 0) + swH
            : plotBottom + catLabelHeight + catTitleHeight + (settings.legend.marginTop || 0) + (settings.legend.paddingTop || 0) + swH;

          const itemWidths = legendItems.map(
            (item) => swW + 4 + measureTextWidth(item.name, fontSize, fontFamily, settings.legend.textWeight)
          );

          const wrapMode = settings.legend.wrapMode || 'auto';
          const availW = width - lPadL - lPadR;
          const rows: number[][] = [];
          if (wrapMode === 'fixed') {
            const perRow = settings.legend.fixedItemsPerRow ?? 3;
            for (let i = 0; i < legendItems.length; i += perRow) {
              rows.push(Array.from({ length: Math.min(perRow, legendItems.length - i) }, (_, j) => i + j));
            }
          } else if (settings.legend.orientation === 'vertical') {
            legendItems.forEach((_, i) => rows.push([i]));
          } else {
            let cur: number[] = [];
            let curW = 0;
            for (let i = 0; i < legendItems.length; i++) {
              const iw = itemWidths[i] + (cur.length > 0 ? gap : 0);
              if (cur.length > 0 && curW + iw > availW) { rows.push(cur); cur = [i]; curW = itemWidths[i]; }
              else { cur.push(i); curW += iw; }
            }
            if (cur.length) rows.push(cur);
          }

          return rows.flatMap((row, rowIdx) => {
            const rowTotalW = row.reduce((s, i) => s + itemWidths[i], 0) + (row.length - 1) * gap;
            let rowX = lPadL;
            if (settings.legend.alignment === 'center') rowX = (width - rowTotalW) / 2;
            else if (settings.legend.alignment === 'right') rowX = width - rowTotalW - lPadR;
            const rowY = baselineY + rowIdx * (fontSize + legendRowGap);
            return row.map((itemIdx) => {
              const item = legendItems[itemIdx];
              const x = rowX;
              rowX += itemWidths[itemIdx] + gap;
              return (
                <g key={`legend-${itemIdx}`}>
                  <rect x={x} y={rowY - swH} width={swW} height={swH} fill={item.color} rx={settings.legend.swatchRoundness} />
                  <text
                    x={x + swW + 4}
                    y={rowY - swH / 2}
                    dy="0.32em"
                    style={{
                      fontSize,
                      fontFamily,
                      fontWeight: fontWeightToCSS(settings.legend.textWeight),
                      fontStyle: settings.legend.textStyle || 'normal',
                      fill: settings.legend.color,
                    }}
                  >
                    {item.name}
                  </text>
                </g>
              );
            });
          });
        })()}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && settings.popupsPanels.showPopup && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: settings.popupsPanels.popupStyle === 'dark' ? '#333' : '#fff',
            color: settings.popupsPanels.popupStyle === 'dark' ? '#fff' : '#333',
            border: `1px solid ${settings.popupsPanels.popupStyle === 'dark' ? '#555' : '#ddd'}`,
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            marginTop: -8,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.category}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: tooltip.color }} />
            <span>{tooltip.series}: {formatNumber(tooltip.value, nf)}</span>
          </div>
        </div>
      )}
    </div>
  );
});
