'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { resolveColors, measureWrappedMaxWidth, getContrastColor } from '@/lib/chart/utils';

// ─── Local helpers (mirror GroupedBarChart) ───────────────────────────
function formatNumber(value: number, nf: ChartSettings['numberFormatting'], decimalOverride?: number): string {
  const decimals = decimalOverride !== undefined ? decimalOverride : nf.decimalPlaces;
  const factor = Math.pow(10, decimals);
  const adjusted = nf.roundDecimal !== false ? Math.round(value * factor) / factor : value;
  let str = adjusted.toFixed(decimals);
  if (!nf.showTrailingZeros && str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  const [intPart, decPart] = str.split('.');
  let formattedInt = intPart;
  if (nf.thousandsSeparator !== 'none') {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, nf.thousandsSeparator);
  }
  str = decPart ? `${formattedInt}${nf.decimalSeparator}${decPart}` : formattedInt;
  return `${nf.prefix}${str}${nf.suffix}`;
}

function fontWeightToCSS(fw: string): number {
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
function measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight: string): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontWeightToCSS(fontWeight)} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

function truncateText(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: string): string {
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

function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: string): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (measureTextWidth(testLine, fontSize, fontFamily, fontWeight) > maxWidth && currentLine) {
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

function generateNiceTicks(min: number, max: number, desiredCount: number = 5): number[] {
  if (max <= min) return [min];
  const range = max - min;
  const roughStep = range / desiredCount;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / mag;
  let step: number;
  if (normalized <= 1.5) step = 1 * mag;
  else if (normalized <= 2.25) step = 2 * mag;
  else if (normalized <= 3.5) step = 2.5 * mag;
  else if (normalized <= 7) step = 5 * mag;
  else step = 10 * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

function generateCustomStepTicks(min: number, max: number, step: number): number[] {
  if (step <= 0 || max <= min) return [min];
  const niceMin = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= max + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

// Ticks for one side of the diverging axis (0 → max), honoring x-axis tick settings.
function sideTicks(max: number, settings: ChartSettings): number[] {
  if (max <= 0) return [0];
  if (settings.xAxis.ticksToShowMode === 'custom') {
    return generateCustomStepTicks(0, max, settings.xAxis.tickStep || 10);
  }
  if (settings.xAxis.ticksToShowMode === 'number') {
    return generateNiceTicks(0, max, settings.xAxis.ticksToShowNumber);
  }
  return generateNiceTicks(0, max);
}

// ─── Types ────────────────────────────────────────────────────────────
interface DivSeries {
  key: string;
  name: string;
  data: number[];
  color: string;
  side: 'left' | 'right';
}

interface DivergingBarChartProps {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
  skipAnimation?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────
export const DivergingBarChart = React.memo(function DivergingBarChart({
  data, columnMapping, settings, width, height: heightProp, columnOrder: columnOrderProp, seriesNames: seriesNamesProp, skipAnimation,
}: DivergingBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animProgress, setAnimProgress] = useState(skipAnimation || !settings.animations.enabled ? 1 : 0);

  useEffect(() => {
    if (skipAnimation || !settings.animations.enabled) { setAnimProgress(1); return; }
    setAnimProgress(0);
    const start = performance.now();
    const duration = settings.animations.duration;
    let raf: number;
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setAnimProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [skipAnimation, settings.animations.enabled, settings.animations.duration, data, columnMapping]);

  const div = settings.divergingBar;

  // ── Build series & categories (with side assignment) ──
  const { series, categories } = useMemo(() => {
    if (!columnMapping.values || columnMapping.values.length === 0 || !columnMapping.labels) {
      return { series: [] as DivSeries[], categories: [] as string[] };
    }
    const valuesSet = new Set(columnMapping.values);
    const keys = columnOrderProp ? columnOrderProp.filter((c) => valuesSet.has(c)) : columnMapping.values;
    const colors = resolveColors(settings.colors, keys, seriesNamesProp);
    const cats = data.map((row) => String(row[columnMapping.labels] || ''));
    const built: DivSeries[] = keys.map((key, i) => ({
      key,
      name: (seriesNamesProp && seriesNamesProp[key]) || key,
      data: data.map((row) => {
        const v = row[key];
        return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
      }),
      color: colors[i],
      // default: first series → left, the rest → right; per-series override wins
      side: div.seriesSides[key] ?? (i === 0 ? 'left' : 'right'),
    }));
    return { series: built, categories: cats };
  }, [data, columnMapping, columnOrderProp, seriesNamesProp, settings.colors, div.seriesSides]);

  const leftSeries = useMemo(() => series.filter((s) => s.side === 'left'), [series]);
  const rightSeries = useMemo(() => series.filter((s) => s.side === 'right'), [series]);

  // ── Per-side maxima → "nice" axis maxima ──
  const { leftAxisMax, rightAxisMax, leftTickList, rightTickList } = useMemo(() => {
    let lMax = 0, rMax = 0;
    for (let ci = 0; ci < categories.length; ci++) {
      let lSum = 0, rSum = 0;
      for (const s of leftSeries) lSum += Math.abs(s.data[ci] || 0);
      for (const s of rightSeries) rSum += Math.abs(s.data[ci] || 0);
      if (lSum > lMax) lMax = lSum;
      if (rSum > rMax) rMax = rSum;
    }
    const userMax = settings.xAxis.max ? Math.abs(parseFloat(settings.xAxis.max)) : undefined;
    if (userMax !== undefined && !Number.isNaN(userMax)) { lMax = userMax; rMax = userMax; }
    let lTicks = sideTicks(lMax, settings);
    let rTicks = sideTicks(rMax, settings);
    let lAxisMax = lTicks[lTicks.length - 1] || lMax || 1;
    let rAxisMax = rTicks[rTicks.length - 1] || rMax || 1;
    if (div.scaleMode === 'symmetric') {
      const shared = Math.max(lAxisMax, rAxisMax);
      lTicks = sideTicks(shared, settings);
      rTicks = sideTicks(shared, settings);
      lAxisMax = lTicks[lTicks.length - 1] || shared;
      rAxisMax = rTicks[rTicks.length - 1] || shared;
    }
    return { leftAxisMax: lAxisMax, rightAxisMax: rAxisMax, leftTickList: lTicks, rightTickList: rTicks };
  }, [categories, leftSeries, rightSeries, settings, div.scaleMode]);

  // ── Layout pieces ──
  const yAxisRight = settings.yAxis.position === 'right';
  const yAxisHidden = settings.yAxis.position === 'hidden';
  const xAxisHidden = settings.xAxis.position === 'hidden';
  const xAxisOnTop = settings.xAxis.position === 'top' || settings.xAxis.position === 'float_up';
  const yTickStyle = settings.yAxis.tickStyling;
  const xTickStyle = settings.xAxis.tickStyling;
  const xAxisDecimals = settings.numberFormatting.xAxisCustomDecimals ? settings.numberFormatting.xAxisDecimalPlaces : undefined;
  const tickPadding = settings.yAxis.tickPadding || 0;

  // Y-axis label column width (reuses the shared space-mode logic)
  const yRatioLabelW = Math.max(1, Math.round(width * (100 - (settings.yAxis.spaceModeRatio ?? 50)) / 100));
  const yLabelWraps = settings.yAxis.spaceMode === 'fixed' || settings.yAxis.spaceMode === 'ratio';
  const yLabelWrapW = settings.yAxis.spaceMode === 'ratio' ? yRatioLabelW : settings.yAxis.spaceModeValue;
  const yAxisLabelWidth = useMemo(() => {
    if (yAxisHidden) return 0;
    if (settings.yAxis.spaceMode === 'fixed') return settings.yAxis.spaceModeValue;
    if (settings.yAxis.spaceMode === 'ratio') {
      const cap = yRatioLabelW;
      if (!(settings.yAxis.spaceModeCollapse ?? true)) return cap;
      return Math.min(cap, measureWrappedMaxWidth(categories, cap, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight) + 10);
    }
    let maxW = 0;
    for (const cat of categories) {
      const w = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
      if (w > maxW) maxW = w;
    }
    return maxW + 10;
  }, [categories, yAxisHidden, settings.yAxis.spaceMode, settings.yAxis.spaceModeValue, settings.yAxis.spaceModeCollapse, yRatioLabelW, yTickStyle]);

  const tickMarksShow = settings.xAxis.tickMarks.show && !xAxisHidden;
  const tickLen = tickMarksShow ? (settings.xAxis.tickMarks.length || 0) : 0;
  const xAxisHeight = xAxisHidden ? 0 : (xTickStyle.fontSize + 8 + tickLen);

  // Legend height (above/below)
  const legendIsOverlay = settings.legend.position === 'overlay';
  const legendIsAbove = settings.legend.position === 'above';
  const legendFontSize = settings.legend.size;
  const legendRowGap = settings.legend.rowGap ?? 4;
  const legendItems = useMemo(() => series.map((s) => ({ name: s.name, color: s.color })), [series]);
  const legendHeight = (() => {
    if (!settings.legend.show || legendIsOverlay) return 0;
    const marginTop = settings.legend.marginTop || 0;
    const gap = settings.legend.swatchPadding || 8;
    const fontFamily = settings.legend.fontFamily || 'Inter, sans-serif';
    if (settings.legend.orientation === 'vertical') {
      return series.length * (legendFontSize + gap) + marginTop + 10;
    }
    const swW = settings.legend.swatchWidth;
    if ((settings.legend.wrapMode || 'auto') === 'fixed') {
      const perRow = settings.legend.fixedItemsPerRow ?? 3;
      return Math.ceil(series.length / perRow) * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
    }
    const itemWidths = legendItems.map((it) => swW + 4 + measureTextWidth(it.name, legendFontSize, fontFamily, settings.legend.textWeight));
    const availW = width - (settings.legend.paddingLeft || 0) - (settings.legend.paddingRight || 0);
    let rowCount = 1, curW = 0;
    for (const iw0 of itemWidths) {
      const iw = iw0 + (curW > 0 ? gap : 0);
      if (curW > 0 && curW + iw > availW) { rowCount++; curW = iw0; } else { curW += iw; }
    }
    return rowCount * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
  })();
  const legendAboveOffset = legendIsAbove ? legendHeight : 0;

  // Bar sizing
  const spacingMain = settings.bars.spacingMain;
  const barHeight = (() => {
    if (heightProp && categories.length > 0) {
      const nonBar = settings.layout.paddingTop + settings.layout.paddingBottom + xAxisHeight + legendAboveOffset + (legendIsAbove ? 0 : legendHeight) + settings.bars.bottomBarPadding;
      const per = (heightProp - nonBar) / categories.length;
      return Math.max(4, per - spacingMain);
    }
    return settings.bars.barHeight;
  })();

  const totalBarsHeight = categories.length * (barHeight + spacingMain) + settings.bars.bottomBarPadding;

  // Padding (plot insets)
  const yLabelSpace = yAxisHidden ? 0 : yAxisLabelWidth + tickPadding;
  const padding = {
    top: settings.layout.paddingTop + legendAboveOffset + (xAxisOnTop ? xAxisHeight : 0),
    right: settings.layout.paddingRight + (yAxisRight ? yLabelSpace : 0),
    bottom: settings.layout.paddingBottom + (!xAxisOnTop ? xAxisHeight : 0) + (legendIsAbove || legendIsOverlay ? 0 : legendHeight),
    left: settings.layout.paddingLeft + (!yAxisRight ? yLabelSpace : 0),
  };

  const chartTop = settings.layout.paddingTop + legendAboveOffset + (xAxisOnTop ? xAxisHeight : 0);
  const chartBottom = chartTop + totalBarsHeight;
  const svgHeight = heightProp || (chartBottom + (xAxisOnTop ? 0 : xAxisHeight) + settings.layout.paddingBottom + (legendIsAbove || legendIsOverlay ? 0 : legendHeight));
  const xAxisYPos = xAxisOnTop ? chartTop : chartBottom;

  const plotWidth = Math.max(1, width - padding.left - padding.right);

  // ── Diverging geometry ──
  const centerGap = Math.max(0, div.centerGap || 0);
  const ppu = (Math.max(1, plotWidth - centerGap)) / Math.max(1e-9, leftAxisMax + rightAxisMax);
  const leftBaseX = padding.left + leftAxisMax * ppu;   // the "0" line for the left side
  const rightBaseX = leftBaseX + centerGap;             // the "0" line for the right side

  if (width <= 0) return null;
  if (series.length === 0 || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
          </svg>
          <p>Add data in the Data tab to see your chart</p>
        </div>
      </div>
    );
  }

  // Style shortcuts
  const gridDash = settings.xAxis.gridlineStyling.dashArray > 0 ? `${settings.xAxis.gridlineStyling.dashArray} ${settings.xAxis.gridlineStyling.dashArray}` : undefined;
  const labelFs = settings.labels.dataPointFontSize;
  const labelFf = settings.labels.dataPointFontFamily;
  const labelFwCss = fontWeightToCSS(settings.labels.dataPointFontWeight);
  const bgOpacity = (settings.layout.backgroundOpacity ?? 100) / 100;
  const bgColor = settings.layout.backgroundColor || 'transparent';

  // Y-axis category-label x anchor
  const yLabelAlign = settings.yAxis.labelTextAlign ?? 'end';
  const labelMaxW = yAxisLabelWidth;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg ref={svgRef} width={width} height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <rect x="0" y="0" width={width} height={svgHeight} fill={bgColor === 'transparent' ? 'none' : bgColor} fillOpacity={bgOpacity} />

        {/* Plot background */}
        {settings.plotBackground.backgroundColor && settings.plotBackground.backgroundColor !== 'transparent' && (
          <rect x={padding.left} y={chartTop} width={plotWidth} height={totalBarsHeight} fill={settings.plotBackground.backgroundColor} fillOpacity={(settings.plotBackground.backgroundOpacity ?? 100) / 100} />
        )}
        {settings.plotBackground.border && (
          <rect x={padding.left} y={chartTop} width={plotWidth} height={totalBarsHeight} fill="none" stroke={settings.plotBackground.borderColor || '#cccccc'} strokeWidth={settings.plotBackground.borderWidth || 1} />
        )}

        {/* Gridlines (both sides) */}
        {settings.xAxis.gridlines && (
          <g>
            {leftTickList.map((t) => (
              <line key={`gl-l-${t}`} x1={leftBaseX - t * ppu} y1={chartTop} x2={leftBaseX - t * ppu} y2={chartTop + totalBarsHeight} stroke={settings.xAxis.gridlineStyling.color} strokeWidth={settings.xAxis.gridlineStyling.width} strokeDasharray={gridDash} />
            ))}
            {rightTickList.filter((t) => t > 0 || centerGap > 0).map((t) => (
              <line key={`gl-r-${t}`} x1={rightBaseX + t * ppu} y1={chartTop} x2={rightBaseX + t * ppu} y2={chartTop + totalBarsHeight} stroke={settings.xAxis.gridlineStyling.color} strokeWidth={settings.xAxis.gridlineStyling.width} strokeDasharray={gridDash} />
            ))}
          </g>
        )}

        {/* Y-axis gridlines (one horizontal line per category row) */}
        {settings.yAxis.gridlines && categories.map((_, ci) => {
          const y = chartTop + ci * (barHeight + spacingMain) + barHeight / 2;
          return (
            <line key={`ygrid-${ci}`} x1={padding.left} y1={y} x2={padding.left + plotWidth} y2={y}
              stroke={settings.yAxis.gridlineStyling.color} strokeWidth={settings.yAxis.gridlineStyling.width}
              strokeDasharray={settings.yAxis.gridlineStyling.dashArray > 0 ? `${settings.yAxis.gridlineStyling.dashArray} ${settings.yAxis.gridlineStyling.dashArray}` : undefined} />
          );
        })}

        {/* Bars + value labels */}
        {categories.map((cat, ci) => {
          const rowY = chartTop + ci * (barHeight + spacingMain);
          const cy = rowY + barHeight / 2;

          const renderSeg = (s: DivSeries, x: number, len: number) => {
            const raw = s.data[ci] || 0;
            const nodes: React.ReactNode[] = [];
            nodes.push(
              <rect key={`bar-${s.key}-${ci}`} x={x} y={rowY} width={len} height={barHeight} fill={s.color} fillOpacity={settings.bars.barOpacity}
                stroke={settings.bars.outline ? settings.bars.outlineColor : 'none'} strokeWidth={settings.bars.outline ? settings.bars.outlineWidth : 0} />
            );
            if (settings.labels.showDataPointLabels && raw !== 0) {
              const labelText = formatNumber(div.absoluteValues ? Math.abs(raw) : raw, settings.numberFormatting);
              const labelColor = settings.labels.dataPointColorMode === 'auto'
                ? getContrastColor(s.color, { enabled: settings.labels.dataPointAutoWhitePref ?? true, strength: settings.labels.dataPointAutoWhiteStrength ?? 60 })
                : (settings.labels.dataPointColorCustomMode === 'row'
                  ? (settings.labels.dataPointRowColors?.[String(ci)] || settings.labels.dataPointColor)
                  : (settings.labels.dataPointSeriesColors[s.key] || settings.labels.dataPointColor));
              // Diverging-specific label placement: center / inner (meet at center) / outer (opposite corners)
              const lblPad = 4;
              let lx = x + len / 2;
              let lAnchor: 'start' | 'middle' | 'end' = 'middle';
              if (div.labelPosition === 'inner') {
                if (s.side === 'left') { lx = x + len - lblPad; lAnchor = 'end'; }
                else { lx = x + lblPad; lAnchor = 'start'; }
              } else if (div.labelPosition === 'outer') {
                if (s.side === 'left') { lx = x + lblPad; lAnchor = 'start'; }
                else { lx = x + len - lblPad; lAnchor = 'end'; }
              }
              nodes.push(
                <text key={`lbl-${s.key}-${ci}`} x={lx} y={cy} dy="0.35em" textAnchor={lAnchor}
                  style={{ fontSize: labelFs, fontFamily: labelFf, fontWeight: labelFwCss, fontStyle: settings.labels.dataPointFontStyle || 'normal', fill: labelColor, pointerEvents: 'none' }}>
                  {labelText}
                </text>
              );
            }
            return nodes;
          };

          const segs: React.ReactNode[] = [];
          let cumL = 0;
          for (const s of leftSeries) {
            const len = Math.abs(s.data[ci] || 0) * ppu * animProgress;
            if (len > 0) segs.push(...renderSeg(s, leftBaseX - cumL - len, len));
            cumL += len;
          }
          let cumR = 0;
          for (const s of rightSeries) {
            const len = Math.abs(s.data[ci] || 0) * ppu * animProgress;
            if (len > 0) segs.push(...renderSeg(s, rightBaseX + cumR, len));
            cumR += len;
          }

          // Y-axis category label
          let yLabel: React.ReactNode = null;
          if (!yAxisHidden) {
            const areaRight = yAxisRight ? width - settings.layout.paddingRight : padding.left - tickPadding - 4;
            const areaLeft = yAxisRight ? padding.left + plotWidth + tickPadding + 4 : settings.layout.paddingLeft;
            const anchorX = yLabelAlign === 'start' ? areaLeft : yLabelAlign === 'center' ? (areaLeft + areaRight) / 2 : areaRight;
            const anchor: 'start' | 'middle' | 'end' = yLabelAlign === 'start' ? 'start' : yLabelAlign === 'center' ? 'middle' : 'end';
            const lblStyle = { fontSize: yTickStyle.fontSize, fontFamily: yTickStyle.fontFamily, fontWeight: fontWeightToCSS(yTickStyle.fontWeight), fill: yTickStyle.color } as React.CSSProperties;
            const fullW = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
            if (yLabelWraps && yLabelWrapW > 0 && fullW > yLabelWrapW && cat.includes(' ')) {
              const lines = wrapText(cat, yLabelWrapW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
              const lineH = yTickStyle.fontSize * 1.2;
              const startY = cy - ((lines.length - 1) * lineH) / 2;
              yLabel = lines.map((ln, li) => (
                <text key={`yl-${ci}-${li}`} x={anchorX} y={startY + li * lineH} dy="0.35em" textAnchor={anchor} style={lblStyle}>{ln}</text>
              ));
            } else {
              const display = yLabelWraps && yLabelWrapW > 0 ? truncateText(cat, yLabelWrapW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight) : (labelMaxW > 0 ? truncateText(cat, labelMaxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight) : cat);
              yLabel = <text x={anchorX} y={cy} dy="0.35em" textAnchor={anchor} style={lblStyle}>{display}</text>;
            }
          }

          return <g key={`row-${ci}`}>{segs}{yLabel}</g>;
        })}

        {/* X axis (two-sided) */}
        {!xAxisHidden && (
          <g>
            {settings.xAxis.axisLine.show && (
              <line x1={padding.left} y1={xAxisYPos} x2={padding.left + plotWidth} y2={xAxisYPos} stroke={settings.xAxis.axisLine.color} strokeWidth={settings.xAxis.axisLine.width} />
            )}
            {[
              ...leftTickList.map((t) => ({ t, x: leftBaseX - t * ppu, key: `xt-l-${t}` })),
              ...rightTickList.filter((t) => t > 0 || centerGap > 0).map((t) => ({ t, x: rightBaseX + t * ppu, key: `xt-r-${t}` })),
            ].map(({ t, x, key }) => {
              const labelY = xAxisOnTop ? xAxisYPos - tickLen - 6 : xAxisYPos + tickLen + xTickStyle.fontSize + 4;
              return (
                <g key={key}>
                  {tickMarksShow && (
                    <line x1={x} y1={xAxisYPos} x2={x} y2={xAxisOnTop ? xAxisYPos - tickLen : xAxisYPos + tickLen} stroke={settings.xAxis.tickMarks.color} strokeWidth={settings.xAxis.tickMarks.width} />
                  )}
                  <text x={x} y={labelY} textAnchor="middle" style={{ fontSize: xTickStyle.fontSize, fontFamily: xTickStyle.fontFamily, fontWeight: fontWeightToCSS(xTickStyle.fontWeight), fill: xTickStyle.color }}>
                    {formatNumber(Math.abs(t), settings.numberFormatting, xAxisDecimals)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Legend */}
        {settings.legend.show && (() => {
          const lPadL = settings.legend.paddingLeft || 0;
          const lPadR = settings.legend.paddingRight || 0;
          const lPadT = settings.legend.paddingTop || 0;
          const xAxisSpaceBelow = !xAxisOnTop ? xAxisHeight : 0;
          const legendY = legendIsOverlay
            ? chartTop + (settings.legend.overlayY ?? 10) + lPadT
            : legendIsAbove
              ? (settings.legend.marginTop || 0) + lPadT
              : chartBottom + xAxisSpaceBelow + (settings.legend.marginTop || 0) + lPadT;
          const swW = settings.legend.swatchWidth;
          const swH = settings.legend.swatchHeight;
          const gap = settings.legend.swatchPadding || 8;
          const fontSize = settings.legend.size;
          const fontFamily = settings.legend.fontFamily || 'Inter, sans-serif';
          const itemWidths = legendItems.map((it) => swW + 4 + measureTextWidth(it.name, fontSize, fontFamily, settings.legend.textWeight));
          const textStyle = (color: string): React.CSSProperties => ({ fontSize, fontFamily, fontWeight: fontWeightToCSS(settings.legend.textWeight), fontStyle: settings.legend.textStyle || 'normal', fill: color });

          if (settings.legend.orientation === 'vertical') {
            const maxItemW = Math.max(...itemWidths);
            const startX = legendIsOverlay ? padding.left + (settings.legend.overlayX ?? 10) + lPadL
              : div.legendCenterOnPlot ? padding.left + (plotWidth - maxItemW) / 2
              : settings.legend.alignment === 'center' ? lPadL + (width - lPadL - lPadR - maxItemW) / 2
              : settings.legend.alignment === 'right' ? width - maxItemW - lPadR : lPadL;
            return legendItems.map((it, idx) => {
              const itemY = legendY + idx * (fontSize + gap);
              return (
                <g key={`lg-${idx}`}>
                  <rect x={startX} y={itemY} width={swW} height={swH} fill={it.color} rx={settings.legend.swatchRoundness} />
                  <text x={startX + swW + 4} y={itemY + swH / 2} dy="0.35em" style={textStyle(settings.legend.color)}>{it.name}</text>
                </g>
              );
            });
          }

          // Horizontal with wrapping
          const wrapMode = settings.legend.wrapMode || 'auto';
          const fixedPerRow = settings.legend.fixedItemsPerRow ?? 3;
          const rowGapPx = settings.legend.rowGap ?? 4;
          const availW = width - lPadL - lPadR;
          const rows: number[][] = [];
          if (wrapMode === 'fixed') {
            for (let i = 0; i < legendItems.length; i += fixedPerRow) {
              rows.push(Array.from({ length: Math.min(fixedPerRow, legendItems.length - i) }, (_, j) => i + j));
            }
          } else {
            let cur: number[] = []; let curW = 0;
            for (let i = 0; i < legendItems.length; i++) {
              const iw = itemWidths[i] + (cur.length > 0 ? gap : 0);
              if (cur.length > 0 && curW + iw > availW) { rows.push(cur); cur = [i]; curW = itemWidths[i]; } else { cur.push(i); curW += iw; }
            }
            if (cur.length > 0) rows.push(cur);
          }
          return rows.flatMap((row, rowIdx) => {
            const rowTotalW = row.reduce((s, i) => s + itemWidths[i], 0) + (row.length - 1) * gap;
            let rowX = legendIsOverlay ? padding.left + (settings.legend.overlayX ?? 10) + lPadL : lPadL;
            if (!legendIsOverlay) {
              if (div.legendCenterOnPlot) rowX = padding.left + (plotWidth - rowTotalW) / 2;
              else if (settings.legend.alignment === 'center') rowX = (width - rowTotalW) / 2 + lPadL - lPadR;
              else if (settings.legend.alignment === 'right') rowX = width - rowTotalW - lPadR;
            }
            const rowY = legendY + rowIdx * (fontSize + rowGapPx);
            return row.map((itemIdx) => {
              const it = legendItems[itemIdx];
              const x = rowX;
              rowX += itemWidths[itemIdx] + gap;
              return (
                <g key={`lg-${itemIdx}`}>
                  <rect x={x} y={rowY} width={swW} height={swH} fill={it.color} rx={settings.legend.swatchRoundness} />
                  <text x={x + swW + 4} y={rowY + swH / 2} dy="0.35em" style={textStyle(settings.legend.color)}>{it.name}</text>
                </g>
              );
            });
          });
        })()}
      </svg>
    </div>
  );
});
