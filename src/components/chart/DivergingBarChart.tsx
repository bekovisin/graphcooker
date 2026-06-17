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
    const um = settings.xAxis.max ? Math.abs(parseFloat(settings.xAxis.max)) : NaN;
    const hasUserMax = !Number.isNaN(um);
    // When a manual max is set it's a HARD cap: the axis ends exactly at it and
    // ticks are filtered to <= it (so e.g. max 65 never renders a 70 tick).
    const buildSide = (dataMax: number) => {
      if (hasUserMax) return { axisMax: um, ticks: sideTicks(um, settings).filter((t) => t <= um + 1e-9) };
      const ticks = sideTicks(dataMax, settings);
      return { axisMax: ticks[ticks.length - 1] || dataMax || 1, ticks };
    };
    let L = buildSide(lMax);
    let R = buildSide(rMax);
    if (div.scaleMode === 'symmetric') {
      const shared = hasUserMax ? um : Math.max(L.axisMax, R.axisMax);
      const ticks = sideTicks(shared, settings).filter((t) => !hasUserMax || t <= shared + 1e-9);
      L = { axisMax: shared, ticks };
      R = { axisMax: shared, ticks: [...ticks] };
    }
    return { leftAxisMax: L.axisMax, rightAxisMax: R.axisMax, leftTickList: L.ticks, rightTickList: R.ticks };
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
  const legendItems = useMemo(() => series.map((s) => ({ name: s.name, color: s.color, side: s.side })), [series]);
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

  // Edge padding so the extreme tick labels (left-max / right-max) aren't clipped at the SVG edges.
  // Based purely on label width so the chart layout stays FIXED — the first/last label/tick
  // padding settings only nudge those individual ticks (applied below), never the whole chart.
  const xEdgePad = (() => {
    if (xAxisHidden) return { left: 0, right: 0 };
    const lTick = leftTickList.length ? leftTickList[leftTickList.length - 1] : 0;
    const rTick = rightTickList.length ? rightTickList[rightTickList.length - 1] : 0;
    const lW = measureTextWidth(formatNumber(Math.abs(lTick), settings.numberFormatting, xAxisDecimals), xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    const rW = measureTextWidth(formatNumber(Math.abs(rTick), settings.numberFormatting, xAxisDecimals), xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    return { left: Math.ceil(lW / 2), right: Math.ceil(rW / 2) };
  })();

  // Padding (plot insets)
  const yLabelSpace = yAxisHidden ? 0 : yAxisLabelWidth + tickPadding;
  const padding = {
    top: settings.layout.paddingTop + legendAboveOffset + (xAxisOnTop ? xAxisHeight : 0),
    right: settings.layout.paddingRight + (yAxisRight ? yLabelSpace : 0) + xEdgePad.right,
    bottom: settings.layout.paddingBottom + (!xAxisOnTop ? xAxisHeight : 0) + (legendIsAbove || legendIsOverlay ? 0 : legendHeight),
    left: settings.layout.paddingLeft + (!yAxisRight ? yLabelSpace : 0) + xEdgePad.left,
  };

  const chartTop = settings.layout.paddingTop + legendAboveOffset + (xAxisOnTop ? xAxisHeight : 0);
  const chartBottom = chartTop + totalBarsHeight;
  const svgHeight = heightProp || (chartBottom + (xAxisOnTop ? 0 : xAxisHeight) + settings.layout.paddingBottom + (legendIsAbove || legendIsOverlay ? 0 : legendHeight));
  const xAxisYPos = xAxisOnTop ? chartTop : chartBottom;

  const plotWidth = Math.max(1, width - padding.left - padding.right);
  // X-axis "Data area padding": inset the plotted region from the left/right edges
  const startPad = settings.xAxis.startPadding || 0;
  const endPad = settings.xAxis.endPadding || 0;
  const plotLeftX = padding.left + startPad;
  const plotRightX = padding.left + plotWidth - endPad;
  const effPlotW = Math.max(1, plotRightX - plotLeftX);

  // ── Diverging geometry ──
  const centerGap = Math.max(0, div.centerGap || 0);
  const ppu = (Math.max(1, effPlotW - centerGap)) / Math.max(1e-9, leftAxisMax + rightAxisMax);
  const leftBaseX = plotLeftX + leftAxisMax * ppu;   // the "0" line for the left side
  const rightBaseX = leftBaseX + centerGap;          // the "0" line for the right side

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
          <rect x={plotLeftX} y={chartTop} width={effPlotW} height={totalBarsHeight} fill={settings.plotBackground.backgroundColor} fillOpacity={(settings.plotBackground.backgroundOpacity ?? 100) / 100} />
        )}
        {settings.plotBackground.border && (
          <rect x={plotLeftX} y={chartTop} width={effPlotW} height={totalBarsHeight} fill="none" stroke={settings.plotBackground.borderColor || '#cccccc'} strokeWidth={settings.plotBackground.borderWidth || 1} />
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
            <line key={`ygrid-${ci}`} x1={plotLeftX} y1={y} x2={plotRightX} y2={y}
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
            const areaLeft = yAxisRight ? plotRightX + tickPadding + 4 : settings.layout.paddingLeft;
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

        {/* Zero line — the center baseline where the two sides meet */}
        {settings.xAxis.zeroLine?.show !== false && (() => {
          const zx = (leftBaseX + rightBaseX) / 2;
          return (
            <line
              x1={zx} y1={chartTop - (settings.xAxis.zeroLineExtendTop || 0)}
              x2={zx} y2={chartBottom + (settings.xAxis.zeroLineExtendBottom || 0)}
              stroke={settings.xAxis.zeroLine?.color || '#666666'}
              strokeWidth={settings.xAxis.zeroLine?.width ?? 1}
            />
          );
        })()}

        {/* X axis (two-sided) */}
        {!xAxisHidden && (
          <g>
            {settings.xAxis.axisLine.show && (
              <line x1={plotLeftX} y1={xAxisYPos} x2={plotRightX} y2={xAxisYPos} stroke={settings.xAxis.axisLine.color} strokeWidth={settings.xAxis.axisLine.width} />
            )}
            {(() => {
              // The leftmost tick is the left side's max; the rightmost is the right side's max.
              const leftMostT = leftTickList.length ? leftTickList[leftTickList.length - 1] : null;
              const rightMostT = rightTickList.length ? rightTickList[rightTickList.length - 1] : null;
              const ticks = [
                ...leftTickList.map((t) => ({ t, x: leftBaseX - t * ppu, key: `xt-l-${t}`, side: 'left' as const })),
                ...rightTickList.filter((t) => t > 0 || centerGap > 0).map((t) => ({ t, x: rightBaseX + t * ppu, key: `xt-r-${t}`, side: 'right' as const })),
              ];
              return ticks.map(({ t, x, key, side }) => {
                const labelY = xAxisOnTop ? xAxisYPos - tickLen - 6 : xAxisYPos + tickLen + xTickStyle.fontSize + 4;
                const isFirst = side === 'left' && t === leftMostT;
                const isLast = side === 'right' && t === rightMostT;
                // Per-tick inward offsets — only the extreme ticks move; the chart stays fixed.
                // Leftmost moves right (+), rightmost moves left (−).
                const labelOff = isFirst ? (settings.xAxis.firstLabelPadding || 0) : isLast ? -(settings.xAxis.lastLabelPadding || 0) : 0;
                const tickOff = isFirst ? (settings.xAxis.firstTickPadding || 0) : isLast ? -(settings.xAxis.lastTickPadding || 0) : 0;
                return (
                  <g key={key}>
                    {tickMarksShow && (
                      <line x1={x + tickOff} y1={xAxisYPos} x2={x + tickOff} y2={xAxisOnTop ? xAxisYPos - tickLen : xAxisYPos + tickLen} stroke={settings.xAxis.tickMarks.color} strokeWidth={settings.xAxis.tickMarks.width} />
                    )}
                    <text x={x + labelOff} y={labelY} textAnchor="middle" style={{ fontSize: xTickStyle.fontSize, fontFamily: xTickStyle.fontFamily, fontWeight: fontWeightToCSS(xTickStyle.fontWeight), fill: xTickStyle.color }}>
                      {formatNumber(Math.abs(t), settings.numberFormatting, xAxisDecimals)}
                    </text>
                  </g>
                );
              });
            })()}
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
              : div.legendCenterOnPlot ? plotLeftX + (effPlotW - maxItemW) / 2
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

          // Diverging "center over plot": the left-side legend item(s) END where the left bars end
          // (the left baseline), the right-side item(s) START where the right bars start (the right
          // baseline). A center gap therefore pushes the two groups apart.
          if (div.legendCenterOnPlot && !legendIsOverlay) {
            const itemW = (it: { name: string }) => swW + 4 + measureTextWidth(it.name, fontSize, fontFamily, settings.legend.textWeight);
            const groupW = (items: typeof legendItems) => items.reduce((s, it) => s + itemW(it), 0) + Math.max(0, items.length - 1) * gap;
            const renderItem = (it: typeof legendItems[number], x: number, key: string) => (
              <g key={key}>
                <rect x={x} y={legendY} width={swW} height={swH} fill={it.color} rx={settings.legend.swatchRoundness} />
                <text x={x + swW + 4} y={legendY + swH / 2} dy="0.35em" style={textStyle(settings.legend.color)}>{it.name}</text>
              </g>
            );
            const leftItems = legendItems.filter((it) => it.side === 'left');
            const rightItems = legendItems.filter((it) => it.side === 'right');
            const nodes: React.ReactNode[] = [];
            let lx = leftBaseX - groupW(leftItems); // left group ends at the left baseline
            leftItems.forEach((it, i) => { nodes.push(renderItem(it, lx, `lg-l-${i}`)); lx += itemW(it) + gap; });
            let rx = rightBaseX; // right group starts at the right baseline
            rightItems.forEach((it, i) => { nodes.push(renderItem(it, rx, `lg-r-${i}`)); rx += itemW(it) + gap; });
            return nodes;
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
              if (div.legendCenterOnPlot) rowX = plotLeftX + (effPlotW - rowTotalW) / 2;
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
