'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { getPaletteColors, extendColors } from '@/lib/chart/palettes';

// ─── Types ────────────────────────────────────────────────────────────
interface SeriesData {
  name: string;
  data: number[];
  color: string;
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

interface CustomBarChartProps {
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

// ─── Helpers ──────────────────────────────────────────────────────────
function parseCustomOverrides(overrides: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!overrides.trim()) return map;
  overrides.split('\n').forEach((line) => {
    const [key, value] = line.split(':').map((s) => s.trim());
    if (key && value) map[key] = value;
  });
  return map;
}

function resolveColors(colorsSettings: ChartSettings['colors'], seriesNames: string[]): string[] {
  let colors = getPaletteColors(colorsSettings.palette, colorsSettings.customPaletteColors);
  if (colorsSettings.extend) {
    colors = extendColors(colors, Math.max(seriesNames.length, colors.length));
  }
  const overrides = parseCustomOverrides(colorsSettings.customOverrides);
  return seriesNames.map((name, i) => overrides[name] || colors[i % colors.length]);
}

function formatNumber(value: number, nf: ChartSettings['numberFormatting'], decimalOverride?: number): string {
  const decimals = decimalOverride !== undefined ? decimalOverride : nf.decimalPlaces;
  const factor = Math.pow(10, decimals);
  // Round or truncate based on setting
  const adjusted = nf.roundDecimal !== false
    ? Math.round(value * factor) / factor
    : Math.trunc(value * factor) / factor;
  let str = adjusted.toFixed(decimals);
  // Strip trailing zeros if showTrailingZeros is off
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

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
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
    const testWidth = measureTextWidth(testLine, fontSize, fontFamily, fontWeight);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  // Truncate each line individually
  for (let i = 0; i < lines.length; i++) {
    lines[i] = truncateText(lines[i], maxWidth, fontSize, fontFamily, fontWeight);
  }
  return lines.length > 0 ? lines : [truncateText(text, maxWidth, fontSize, fontFamily, fontWeight)];
}

function generateNiceTicks(min: number, max: number, desiredCount: number = 5): number[] {
  if (max <= min) return [0];
  const range = max - min;
  const roughStep = range / desiredCount;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  let step: number;
  const normalized = roughStep / mag;
  if (normalized <= 1.5) step = 1 * mag;
  else if (normalized <= 3) step = 2 * mag;
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
  if (step <= 0 || max <= min) return [0];
  const niceMin = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= max + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

// ─── Component ────────────────────────────────────────────────────────
export function CustomBarChart({ data, columnMapping, settings, width, height: heightProp, columnOrder: columnOrderProp, seriesNames: seriesNamesProp, skipAnimation }: CustomBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, category: '', series: '', value: 0, color: '' });
  const [animProgress, setAnimProgress] = useState(skipAnimation || !settings.animations.enabled ? 1 : 0);

  // Animation — skipped entirely for export (skipAnimation=true)
  useEffect(() => {
    if (skipAnimation) {
      setAnimProgress(1);
      return;
    }
    if (!settings.animations.enabled) {
      setAnimProgress(1);
      return;
    }
    setAnimProgress(0);
    const start = performance.now();
    const duration = settings.animations.duration;
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setAnimProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [skipAnimation, settings.animations.enabled, settings.animations.duration, data, columnMapping]);

  // ── Build series & categories ──
  const { series, categories, maxVal, minVal } = useMemo(() => {
    if (!columnMapping.values || columnMapping.values.length === 0 || !columnMapping.labels) {
      return { series: [] as SeriesData[], categories: [] as string[], maxVal: 0, minVal: 0 };
    }

    // Order values by their position in columnOrder (spreadsheet column order)
    const valuesSet = new Set(columnMapping.values);
    const seriesNames = columnOrderProp
      ? columnOrderProp.filter((col) => valuesSet.has(col))
      : columnMapping.values;
    const colors = resolveColors(settings.colors, seriesNames);

    let cats = data.map((row) => String(row[columnMapping.labels] || ''));

    let rawSeries: SeriesData[] = seriesNames.map((key, i) => ({
      name: (seriesNamesProp && seriesNamesProp[key]) || key,
      data: data.map((row) => {
        const val = row[key];
        return typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
      }),
      color: colors[i],
    }));

    // Sort by value
    if (settings.chartType.sortMode === 'value' && rawSeries.length > 0) {
      const totals = data.map((_, i) =>
        rawSeries.reduce((sum, s) => sum + (s.data[i] || 0), 0)
      );
      const indices = totals.map((_, i) => i).sort((a, b) => totals[b] - totals[a]);
      rawSeries = rawSeries.map((s) => ({
        ...s,
        data: indices.map((i) => s.data[i]),
      }));
      cats = indices.map((i) => cats[i]);
    }

    // Stack sort
    if (settings.chartType.stackSortMode !== 'normal') {
      const sortAsc = settings.chartType.stackSortMode === 'ascending';
      rawSeries.sort((a, b) => {
        const sumA = a.data.reduce((s, v) => s + (v || 0), 0);
        const sumB = b.data.reduce((s, v) => s + (v || 0), 0);
        return sortAsc ? sumA - sumB : sumB - sumA;
      });
    }

    // Compute stacked totals to find max
    let maxV = 0;
    let minV = 0;
    const numCats = cats.length;
    for (let ci = 0; ci < numCats; ci++) {
      let posSum = 0;
      let negSum = 0;
      for (const s of rawSeries) {
        const v = s.data[ci] || 0;
        if (v >= 0) posSum += v;
        else negSum += v;
      }
      if (posSum > maxV) maxV = posSum;
      if (negSum < minV) minV = negSum;
    }

    const userMin = settings.xAxis.min ? parseFloat(settings.xAxis.min) : undefined;
    const userMax = settings.xAxis.max ? parseFloat(settings.xAxis.max) : undefined;

    return {
      series: rawSeries,
      categories: cats,
      maxVal: userMax !== undefined ? userMax : maxV,
      minVal: userMin !== undefined ? userMin : Math.min(0, minV),
    };
  }, [data, columnMapping, columnOrderProp, seriesNamesProp, settings.colors, settings.chartType.sortMode, settings.chartType.stackSortMode, settings.xAxis.min, settings.xAxis.max]);

  // ── Layout calculations ──
  const isAboveBars = settings.labels.barLabelStyle === 'above_bars';
  const yAxisRight = settings.yAxis.position === 'right';
  const yAxisHidden = settings.yAxis.position === 'hidden' || isAboveBars;
  const xAxisHidden = settings.xAxis.position === 'hidden';
  const xAxisOnTop = settings.xAxis.position === 'top' || settings.xAxis.position === 'float_up';
  const flipAxis = settings.xAxis.flipAxis;

  const yTickStyle = settings.yAxis.tickStyling;
  const xTickStyle = settings.xAxis.tickStyling;
  const xAxisDecimals = settings.numberFormatting.xAxisCustomDecimals ? settings.numberFormatting.xAxisDecimalPlaces : undefined;

  // Y-axis label width
  const yAxisLabelWidth = useMemo(() => {
    if (yAxisHidden) return 0;
    if (settings.yAxis.spaceMode === 'fixed') return settings.yAxis.spaceModeValue;
    // Auto: measure longest label
    let maxW = 0;
    for (const cat of categories) {
      const w = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
      if (w > maxW) maxW = w;
    }
    return maxW + 10;
  }, [categories, yAxisHidden, settings.yAxis.spaceMode, settings.yAxis.spaceModeValue, yTickStyle]);

  // X-axis tick generation with custom step support
  const xTicksAll = useMemo(() => {
    let ticks: number[];
    if (settings.xAxis.ticksToShowMode === 'custom') {
      const step = settings.xAxis.tickStep || 10;
      ticks = generateCustomStepTicks(minVal, maxVal, step);
    } else if (settings.xAxis.ticksToShowMode === 'number') {
      ticks = generateNiceTicks(minVal, maxVal, settings.xAxis.ticksToShowNumber);
    } else {
      ticks = generateNiceTicks(minVal, maxVal);
    }
    // Filter ticks to data range so chart doesn't extend beyond actual max/min
    return ticks.filter((t) => t >= minVal - 1e-9 && t <= maxVal + 1e-9);
  }, [minVal, maxVal, settings.xAxis.ticksToShowMode, settings.xAxis.ticksToShowNumber, settings.xAxis.tickStep]);

  // Filter ticks based on label count mode + hidden labels
  const xTicks = useMemo(() => {
    let ticks = [...xTicksAll];
    const hiddenSet = new Set(settings.xAxis.hiddenTickLabels || []);

    // Custom label count: evenly space-reduce visible labels
    if (settings.xAxis.tickLabelCountMode === 'custom' && settings.xAxis.tickLabelCount > 0 && settings.xAxis.tickLabelCount < ticks.length) {
      const count = settings.xAxis.tickLabelCount;
      const step = (ticks.length - 1) / (count - 1);
      const visibleIndices = new Set<number>();
      for (let i = 0; i < count; i++) {
        visibleIndices.add(Math.round(i * step));
      }
      ticks = ticks.filter((_, i) => visibleIndices.has(i));
    }

    // Filter out individually hidden labels
    if (hiddenSet.size > 0) {
      ticks = ticks.filter((tick) => {
        const label = formatNumber(tick, settings.numberFormatting, xAxisDecimals);
        return !hiddenSet.has(label);
      });
    }

    return ticks;
  }, [xTicksAll, settings.xAxis.tickLabelCountMode, settings.xAxis.tickLabelCount, settings.xAxis.hiddenTickLabels, settings.numberFormatting]);

  // X axis tick angle computations
  const tickAngle = settings.xAxis.tickAngle || 0;
  const hasAngle = tickAngle !== 0;

  // Measure first and last tick labels to compute edge padding
  const xTickEdgePadding = useMemo(() => {
    if (xAxisHidden || xTicks.length === 0) return { left: 0, right: 0 };
    const firstLabel = formatNumber(xTicks[0], settings.numberFormatting, xAxisDecimals);
    const lastLabel = formatNumber(xTicks[xTicks.length - 1], settings.numberFormatting, xAxisDecimals);
    const firstW = measureTextWidth(firstLabel, xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    const lastW = measureTextWidth(lastLabel, xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);

    const firstLabelPad = settings.xAxis.firstLabelPadding || 0;
    const lastLabelPad = settings.xAxis.lastLabelPadding || 0;

    if (hasAngle) {
      // With angled labels, we need more padding based on text width and angle
      const rad = Math.abs(tickAngle) * (Math.PI / 180);
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      const h = xTickStyle.fontSize;
      const effectiveFirst = firstW * cosA + h * sinA;
      const effectiveLast = lastW * cosA + h * sinA;
      return {
        left: Math.max(0, Math.ceil(effectiveFirst / 2) + 2 - firstLabelPad),
        right: Math.max(0, Math.ceil(effectiveLast / 2) + 2 - lastLabelPad),
      };
    }

    return {
      left: Math.max(0, Math.ceil(firstW / 2) - firstLabelPad),
      right: Math.max(0, Math.ceil(lastW / 2) - lastLabelPad),
    };
  }, [xTicks, xAxisHidden, xTickStyle, settings.numberFormatting, hasAngle, tickAngle, settings.xAxis.firstLabelPadding, settings.xAxis.lastLabelPadding]);

  // X axis height depends on angle
  const labelAxisPad = settings.xAxis.labelAxisPadding || 0;
  const xAxisHeight = useMemo(() => {
    if (xAxisHidden) return 0;
    if (!hasAngle) return xTickStyle.fontSize + 10 + labelAxisPad;
    // Angled: compute height based on longest tick label and angle
    const maxLabel = xTicks.reduce((longest, tick) => {
      const label = formatNumber(tick, settings.numberFormatting, xAxisDecimals);
      return label.length > longest.length ? label : longest;
    }, '');
    const maxW = measureTextWidth(maxLabel, xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    const rad = Math.abs(tickAngle) * (Math.PI / 180);
    return Math.ceil(maxW * Math.sin(rad) + xTickStyle.fontSize * Math.cos(rad)) + 10 + labelAxisPad;
  }, [xAxisHidden, hasAngle, tickAngle, xTicks, xTickStyle, settings.numberFormatting, labelAxisPad]);

  const xAxisTitleHeight = settings.xAxis.titleType === 'custom' && settings.xAxis.titleText ? settings.xAxis.titleStyling.fontSize + 10 : 0;
  const yAxisTitleWidth = settings.yAxis.titleType === 'custom' && settings.yAxis.titleText ? settings.yAxis.titleStyling.fontSize + 10 : 0;
  const tickPadding = settings.yAxis.tickPadding || 0;

  const padding = useMemo(() => {
    const yLabelSpace = yAxisLabelWidth + tickPadding + yAxisTitleWidth;
    return {
      top: settings.layout.paddingTop + (xAxisOnTop ? xAxisHeight + xAxisTitleHeight : 0),
      right: settings.layout.paddingRight + (yAxisRight && !yAxisHidden ? yLabelSpace : 0) + xTickEdgePadding.right,
      bottom: settings.layout.paddingBottom + (!xAxisOnTop ? xAxisHeight + xAxisTitleHeight : 0),
      left: settings.layout.paddingLeft + (!yAxisRight && !yAxisHidden ? yLabelSpace : 0) + xTickEdgePadding.left,
    };
  }, [settings.layout, yAxisLabelWidth, tickPadding, yAxisTitleWidth, xAxisHeight, xAxisTitleHeight, yAxisRight, yAxisHidden, xAxisOnTop, xTickEdgePadding]);

  // Early legend height calculation (needed for 'above' positioning)
  const legendIsOverlay = settings.legend.position === 'overlay';
  const legendIsAbove = settings.legend.position === 'above';
  const legendFontSize = settings.legend.size;
  const legendGapEarly = settings.legend.swatchPadding || 8;
  const legendRowGap = settings.legend.rowGap ?? 4;
  const legendHeight = (() => {
    if (!settings.legend.show || legendIsOverlay) return 0;
    const marginTop = settings.legend.marginTop || 0;
    if (settings.legend.orientation === 'vertical') {
      return series.length * (legendFontSize + legendGapEarly) + marginTop + 10;
    }
    // Estimate number of rows for horizontal wrapping
    const wrapMode = settings.legend.wrapMode || 'auto';
    const swW = settings.legend.swatchWidth;
    const gap = settings.legend.swatchPadding || 8;
    const fontFamily = settings.legend.fontFamily || 'Inter, sans-serif';
    const textWeight = settings.legend.textWeight;
    if (wrapMode === 'fixed') {
      const perRow = settings.legend.fixedItemsPerRow ?? 3;
      const rowCount = Math.ceil(series.length / perRow);
      return rowCount * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
    }
    // Auto: estimate rows based on width
    const itemWidths = series.map((s) => swW + 4 + measureTextWidth(s.name, legendFontSize, fontFamily, textWeight));
    const availW = width - (settings.legend.paddingLeft || 0) - (settings.legend.paddingRight || 0);
    let rowCount = 1;
    let curW = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      const iw = itemWidths[i] + (curW > 0 ? gap : 0);
      if (curW > 0 && curW + iw > availW) { rowCount++; curW = itemWidths[i]; } else { curW += iw; }
    }
    return rowCount * (legendFontSize + legendRowGap) - legendRowGap + marginTop + 10;
  })();
  const legendAboveOffset = legendIsAbove ? legendHeight : 0;

  // Bar sizing: when heightProp is provided, compute bar height to fill the space
  const spacingMain = settings.bars.spacingMain;
  const emptyRowSpacing = settings.bars.emptyRowSpacing;
  const bottomBarPadding = settings.bars.bottomBarPadding;
  // Above-bars label row height: per-category to avoid blank space under single-line labels
  const labelRowHeights = useMemo(() => {
    if (!isAboveBars) return categories.map(() => 0);
    const baseHeight = yTickStyle.fontSize + 8;
    if (settings.yAxis.spaceMode !== 'fixed' || !settings.yAxis.spaceModeValue) {
      return categories.map(() => baseHeight);
    }
    const maxW = settings.yAxis.spaceModeValue;
    return categories.map((cat) => {
      const fullW = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
      if (fullW > maxW && cat.includes(' ')) {
        const lines = wrapText(cat, maxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
        return lines.length > 1 ? yTickStyle.fontSize * 1.2 * lines.length + 4 : baseHeight;
      }
      return baseHeight;
    });
  }, [isAboveBars, yTickStyle, settings.yAxis.spaceMode, settings.yAxis.spaceModeValue, categories]);

  // Determine which categories are "empty" (blank label AND all series values are 0/null)
  const isEmptyCategory = useMemo(() =>
    categories.map((cat, ci) => {
      const hasLabel = cat && cat.trim().length > 0;
      const hasValues = series.some(s => s.data[ci] !== 0 && s.data[ci] != null);
      return !hasLabel && !hasValues;
    }),
    [categories, series]
  );

  const nonEmptyCount = isEmptyCategory.filter(e => !e).length;
  const emptyCount = isEmptyCategory.filter(e => e).length;

  // Sum of per-category label heights for non-empty categories (used in height calculations)
  const totalLabelRowHeight = labelRowHeights.reduce((sum, h, ci) => sum + (isEmptyCategory[ci] ? 0 : h), 0);

  const barHeight = (() => {
    if (heightProp && categories.length > 0 && nonEmptyCount > 0) {
      const nonBarSpace = padding.top + padding.bottom + legendAboveOffset + (legendIsAbove ? 0 : legendHeight) + bottomBarPadding;
      const availableForBars = heightProp - nonBarSpace - emptyCount * emptyRowSpacing - totalLabelRowHeight;
      const perCategory = availableForBars / nonEmptyCount;
      return Math.max(4, perCategory - spacingMain);
    }
    return settings.bars.barHeight;
  })();

  // Build cumulative Y offsets for each category (per-category heights)
  const catYOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cumY = 0;
    for (let ci = 0; ci < categories.length; ci++) {
      offsets.push(cumY);
      cumY += isEmptyCategory[ci] ? emptyRowSpacing : (barHeight + spacingMain + labelRowHeights[ci]);
    }
    return offsets;
  }, [categories.length, isEmptyCategory, emptyRowSpacing, barHeight, spacingMain, labelRowHeights]);

  const totalBarsHeight = catYOffsets.length > 0
    ? catYOffsets[catYOffsets.length - 1] + (isEmptyCategory[categories.length - 1] ? emptyRowSpacing : (barHeight + spacingMain + labelRowHeights[categories.length - 1])) + bottomBarPadding
    : bottomBarPadding;

  const computedChartHeight = totalBarsHeight + padding.top + padding.bottom + legendAboveOffset + (legendIsAbove ? 0 : legendHeight);
  const svgHeight = heightProp || computedChartHeight;

  const plotWidth = Math.max(1, width - padding.left - padding.right);

  // Scale: value -> x position
  const xScale = useCallback((val: number) => {
    if (maxVal <= minVal) return 0;
    const ratio = (val - minVal) / (maxVal - minVal);
    return flipAxis ? plotWidth * (1 - ratio) : plotWidth * ratio;
  }, [minVal, maxVal, plotWidth, flipAxis]);

  // ── Tooltip handlers ──
  const handleBarHover = useCallback((e: React.MouseEvent, cat: string, seriesName: string, value: number, color: string) => {
    if (!settings.popupsPanels.showPopup) return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      visible: true,
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top - 10,
      category: cat,
      series: seriesName,
      value,
      color,
    });
  }, [settings.popupsPanels.showPopup]);

  const handleBarLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Render ──
  if (width <= 0) return null;

  if (series.length === 0 || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <p>Add data in the Data tab to see your chart</p>
        </div>
      </div>
    );
  }

  // Gridline style
  const gridStroke = settings.xAxis.gridlineStyling.color;
  const gridStrokeWidth = settings.xAxis.gridlineStyling.width;
  const gridDashArray = settings.xAxis.gridlineStyling.dashArray > 0
    ? `${settings.xAxis.gridlineStyling.dashArray} ${settings.xAxis.gridlineStyling.dashArray}`
    : undefined;

  // X axis line & tick marks
  const axisLineShow = settings.xAxis.axisLine.show && !xAxisHidden;
  const tickMarksShow = settings.xAxis.tickMarks.show && !xAxisHidden;
  const tickMarkPosition = settings.xAxis.tickMarks.position;

  // Legend data
  const legendItems = series.map((s) => ({ name: s.name, color: s.color }));

  // Y axis title
  const yAxisTitle = settings.yAxis.titleType === 'custom' ? settings.yAxis.titleText : '';
  const xAxisTitle = settings.xAxis.titleType === 'custom' ? settings.xAxis.titleText : '';

  // X axis Y position based on position setting (includes legendAboveOffset)
  const chartTop = padding.top + legendAboveOffset;
  const chartBottom = chartTop + totalBarsHeight;
  const xAxisYPos = xAxisOnTop ? chartTop : chartBottom;
  const xAxisTickDir = xAxisOnTop ? -1 : 1; // ticks go up when on top

  // Y-axis label max width for truncation/wrapping
  const yLabelMaxWidth = yAxisLabelWidth - 4;

  const totalSvgHeight = svgHeight;

  // Background color - use layout bg with opacity support
  const bgOpacity = (settings.layout.backgroundOpacity ?? 100) / 100;
  const bgColor = settings.layout.backgroundColor || 'transparent';

  // Tick mark positioning helpers
  const getTickMarkY1Y2 = (baseY: number, dir: number, length: number) => {
    if (tickMarkPosition === 'outside') {
      return { y1: baseY, y2: baseY + dir * length };
    } else if (tickMarkPosition === 'inside') {
      return { y1: baseY, y2: baseY - dir * length };
    } else {
      // cross
      return { y1: baseY - dir * (length / 2), y2: baseY + dir * (length / 2) };
    }
  };

  // Zero-value Y line position
  const zeroX = xScale(0);
  const hasZeroInRange = minVal <= 0 && maxVal >= 0;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={totalSvgHeight}
        viewBox={`0 0 ${width} ${totalSvgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Background for export - uses layout background color with opacity */}
        <rect x="0" y="0" width={width} height={totalSvgHeight} fill={bgColor === 'transparent' ? 'none' : bgColor} fillOpacity={bgOpacity} />

        {/* Plot background */}
        {settings.plotBackground.backgroundColor && settings.plotBackground.backgroundColor !== 'transparent' && (
          <rect
            x={padding.left}
            y={chartTop}
            width={plotWidth}
            height={totalBarsHeight}
            fill={settings.plotBackground.backgroundColor}
            fillOpacity={(settings.plotBackground.backgroundOpacity ?? 100) / 100}
          />
        )}

        {/* Plot border */}
        {settings.plotBackground.border && (
          <rect
            x={padding.left}
            y={chartTop}
            width={plotWidth}
            height={totalBarsHeight}
            fill="none"
            stroke={settings.plotBackground.borderColor || '#cccccc'}
            strokeWidth={settings.plotBackground.borderWidth || 1}
          />
        )}

        {/* ── Empty row separator lines ── */}
        {settings.bars.emptyRowLine.show && categories.map((_, ci) => {
          if (!isEmptyCategory[ci]) return null;
          const lineY = chartTop + catYOffsets[ci] + emptyRowSpacing / 2;
          const lineStyle = settings.bars.emptyRowLine.style;
          const lineDash = lineStyle === 'dashed'
            ? `${settings.bars.emptyRowLine.dashLength} ${settings.bars.emptyRowLine.dashLength}`
            : lineStyle === 'dotted'
              ? `${settings.bars.emptyRowLine.width} ${settings.bars.emptyRowLine.width * 2}`
              : undefined;
          return (
            <line
              key={`empty-line-${ci}`}
              x1={padding.left}
              y1={lineY}
              x2={padding.left + plotWidth}
              y2={lineY}
              stroke={settings.bars.emptyRowLine.color}
              strokeWidth={settings.bars.emptyRowLine.width}
              strokeDasharray={lineDash}
            />
          );
        })}

        {/* ── Gridlines ── */}
        {settings.xAxis.gridlines && xTicksAll.map((tick) => {
          // Skip the zero-position gridline based on showZeroGridline toggle (independent of zero line)
          if (tick === 0 && hasZeroInRange && settings.xAxis.showZeroGridline === false) return null;
          const x = padding.left + xScale(tick);
          return (
            <line
              key={`grid-${tick}`}
              x1={x}
              y1={chartTop}
              x2={x}
              y2={chartTop + totalBarsHeight}
              stroke={gridStroke}
              strokeWidth={gridStrokeWidth}
              strokeDasharray={gridDashArray}
            />
          );
        })}

        {/* ── Y axis gridlines ── */}
        {settings.yAxis.gridlines && categories.map((_, ci) => {
          if (isEmptyCategory[ci]) return null;
          const y = chartTop + catYOffsets[ci] + (isAboveBars ? labelRowHeights[ci] : 0) + barHeight / 2;
          return (
            <line
              key={`ygrid-${ci}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + plotWidth}
              y2={y}
              stroke={settings.yAxis.gridlineStyling.color}
              strokeWidth={settings.yAxis.gridlineStyling.width}
              strokeDasharray={settings.yAxis.gridlineStyling.dashArray > 0 ? `${settings.yAxis.gridlineStyling.dashArray} ${settings.yAxis.gridlineStyling.dashArray}` : undefined}
            />
          );
        })}

        {/* ── Y axis line ── */}
        {settings.yAxis.axisLine?.show && (() => {
          // Y axis line at the plot left/right edge (or at zero if 0 is in range)
          const yLineX = yAxisRight
            ? padding.left + plotWidth
            : padding.left;
          return (
            <line
              x1={yLineX}
              y1={chartTop - (settings.xAxis.zeroLineExtendTop || 0)}
              x2={yLineX}
              y2={chartTop + totalBarsHeight + (settings.xAxis.zeroLineExtendBottom || 0)}
              stroke={settings.yAxis.axisLine.color}
              strokeWidth={settings.yAxis.axisLine.width}
            />
          );
        })()}

        {/* ── Zero-value line (at value=0 on x axis) ── */}
        {hasZeroInRange && settings.xAxis.zeroLine?.show === true && zeroX >= 0 && zeroX <= plotWidth && (
          <line
            x1={padding.left + zeroX}
            y1={chartTop - (settings.xAxis.zeroLineExtendTop || 0)}
            x2={padding.left + zeroX}
            y2={chartTop + totalBarsHeight + (settings.xAxis.zeroLineExtendBottom || 0)}
            stroke={settings.xAxis.zeroLine?.color || '#666666'}
            strokeWidth={settings.xAxis.zeroLine?.width || 1}
          />
        )}

        {/* ── X axis line ── */}
        {axisLineShow && (
          <line
            x1={padding.left}
            y1={xAxisYPos}
            x2={padding.left + plotWidth}
            y2={xAxisYPos}
            stroke={settings.xAxis.axisLine.color}
            strokeWidth={settings.xAxis.axisLine.width}
          />
        )}

        {/* ── X axis ticks & labels ── */}
        {!xAxisHidden && xTicks.map((tick, tickIdx) => {
          const x = padding.left + xScale(tick);
          const tickLen = settings.xAxis.tickMarks.length;
          const { y1: tmY1, y2: tmY2 } = getTickMarkY1Y2(xAxisYPos, xAxisTickDir, tickLen);

          // Label-to-axis padding
          const labelAxisPad = settings.xAxis.labelAxisPadding || 0;

          // Label position: for angled labels, adjust anchor and position
          const labelText = formatNumber(tick, settings.numberFormatting, xAxisDecimals);
          const labelY = xAxisOnTop
            ? xAxisYPos - (tickMarksShow ? tickLen : 0) - 6 - labelAxisPad
            : xAxisYPos + (tickMarksShow ? tickLen : 0) + xTickStyle.fontSize + 4 + labelAxisPad;

          // First / Last label padding: push labels inward
          const isFirstTick = tickIdx === 0;
          const isLastTick = tickIdx === xTicks.length - 1;
          const firstPad = isFirstTick ? (settings.xAxis.firstLabelPadding || 0) : 0;
          const lastPad = isLastTick ? -(settings.xAxis.lastLabelPadding || 0) : 0;
          const labelPad = firstPad + lastPad; // only one will be non-zero
          // First / Last tick padding: push tick marks inward (separate controls)
          const firstTickPad = isFirstTick ? (settings.xAxis.firstTickPadding || 0) : 0;
          const lastTickPad = isLastTick ? -(settings.xAxis.lastTickPadding || 0) : 0;
          const tickPadOffset = firstTickPad + lastTickPad;

          return (
            <g key={`xtick-${tick}`}>
              {/* Tick mark moves with tickPadOffset for inward adjustment */}
              {tickMarksShow && (
                <line
                  x1={x + tickPadOffset}
                  y1={tmY1}
                  x2={x + tickPadOffset}
                  y2={tmY2}
                  stroke={settings.xAxis.tickMarks.color}
                  strokeWidth={settings.xAxis.tickMarks.width}
                />
              )}
              {/* Label moves with labelPad for inward adjustment — always middle anchor */}
              <text
                x={x + labelPad}
                y={hasAngle ? xAxisYPos + (xAxisOnTop ? -1 : 1) * ((tickMarksShow ? tickLen : 0) + 4 + labelAxisPad) : labelY}
                textAnchor={hasAngle ? (tickAngle > 0 ? 'start' : 'end') : 'middle'}
                dominantBaseline={hasAngle ? (xAxisOnTop ? 'auto' : 'hanging') : 'auto'}
                transform={hasAngle ? `rotate(${tickAngle}, ${x + labelPad}, ${xAxisYPos + (xAxisOnTop ? -1 : 1) * ((tickMarksShow ? tickLen : 0) + 4 + labelAxisPad)})` : undefined}
                style={{
                  fontSize: xTickStyle.fontSize,
                  fontFamily: xTickStyle.fontFamily,
                  fontWeight: fontWeightToCSS(xTickStyle.fontWeight),
                  fontStyle: xTickStyle.fontStyle || 'normal',
                  fill: xTickStyle.color,
                }}
              >
                {labelText}
              </text>
            </g>
          );
        })}

        {/* ── X axis title ── */}
        {xAxisTitle && (
          <text
            x={padding.left + plotWidth / 2}
            y={xAxisOnTop
              ? chartTop - xAxisHeight - 4
              : chartBottom + xAxisHeight + xAxisTitleHeight - 4
            }
            textAnchor="middle"
            style={{
              fontSize: settings.xAxis.titleStyling.fontSize,
              fontFamily: settings.xAxis.titleStyling.fontFamily,
              fontWeight: fontWeightToCSS(settings.xAxis.titleStyling.fontWeight),
              fontStyle: settings.xAxis.titleStyling.fontStyle || 'normal',
              fill: settings.xAxis.titleStyling.color,
            }}
          >
            {xAxisTitle}
          </text>
        )}

        {/* ── Y axis title (rotated) ── */}
        {yAxisTitle && (() => {
          const titleX = yAxisRight
            ? width - 12
            : 12;
          const titleY = chartTop + totalBarsHeight / 2;
          return (
            <text
              x={titleX}
              y={titleY}
              textAnchor="middle"
              transform={`rotate(-90, ${titleX}, ${titleY})`}
              style={{
                fontSize: settings.yAxis.titleStyling.fontSize,
                fontFamily: settings.yAxis.titleStyling.fontFamily,
                fontWeight: fontWeightToCSS(settings.yAxis.titleStyling.fontWeight),
                fontStyle: settings.yAxis.titleStyling.fontStyle || 'normal',
                fill: settings.yAxis.titleStyling.color,
              }}
            >
              {yAxisTitle}
            </text>
          );
        })()}

        {/* ── Bars & Labels ── */}
        {categories.map((cat, ci) => {
          // Skip rendering for empty categories (spacer rows)
          if (isEmptyCategory[ci]) return null;
          const catY = chartTop + catYOffsets[ci];
          const barY = catY + (isAboveBars ? labelRowHeights[ci] : 0);

          // Stacked bars
          let stackX = xScale(Math.max(0, minVal));
          const barElements: React.ReactNode[] = [];
          const labelElements: React.ReactNode[] = [];

          series.forEach((s, si) => {
            const rawValue = s.data[ci] || 0;
            const value = rawValue * animProgress;
            const barW = Math.abs(xScale(Math.max(0, minVal) + Math.abs(value)) - xScale(Math.max(0, minVal)));

            const barX = value >= 0 ? stackX : stackX - barW;

            const inStackSpacing = settings.bars.spacingInStack;
            const actualBarH = barHeight;

            const renderedW = Math.max(0, barW - (inStackSpacing > 0 && !settings.bars.outline ? inStackSpacing : 0));
            barElements.push(
              <rect
                key={`bar-${ci}-${si}`}
                x={padding.left + barX}
                y={barY}
                width={renderedW}
                height={actualBarH}
                fill={s.color}
                fillOpacity={settings.bars.barOpacity}
                stroke={settings.bars.outline ? settings.bars.outlineColor : 'none'}
                strokeWidth={settings.bars.outline ? settings.bars.outlineWidth : 0}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
                onMouseMove={(e) => handleBarHover(e, cat, s.name, rawValue, s.color)}
                onMouseLeave={handleBarLeave}
              />
            );

            // Data point labels
            if (settings.labels.showDataPointLabels && rawValue !== 0) {
              const labelText = formatNumber(rawValue, settings.numberFormatting);
              const labelPos = settings.labels.dataPointPosition === 'custom'
                ? (settings.labels.dataPointCustomMode === 'row'
                  ? (settings.labels.dataPointRowPositions?.[cat] || 'center')
                  : (settings.labels.dataPointSeriesPositions?.[s.name] || 'center'))
                : settings.labels.dataPointPosition;
              let labelX: number;
              let anchor: 'start' | 'middle' | 'end';

              if (labelPos === 'left') {
                labelX = padding.left + barX + 4;
                anchor = 'start';
              } else if (labelPos === 'right') {
                labelX = padding.left + barX + renderedW - 4;
                anchor = 'end';
              } else if (labelPos === 'outside_right') {
                labelX = padding.left + barX + renderedW + (settings.labels.outsideLabelPadding ?? 6);
                anchor = 'start';
              } else {
                labelX = padding.left + barX + renderedW / 2;
                anchor = 'middle';
              }

              const labelColor = settings.labels.dataPointColorMode === 'auto'
                ? (labelPos === 'outside_right' ? '#333333' : getContrastColor(s.color))
                : (settings.labels.dataPointSeriesColors[s.name] || settings.labels.dataPointColor);

              const offsetX = settings.labels.dataPointCustomPadding
                ? settings.labels.dataPointPaddingLeft - settings.labels.dataPointPaddingRight
                : 0;
              const offsetY = settings.labels.dataPointCustomPadding
                ? settings.labels.dataPointPaddingTop - settings.labels.dataPointPaddingBottom
                : 0;

              const showPercent = settings.labels.showPercentPrefix;
              const prefixPos = settings.labels.percentPrefixPosition ?? 'right';
              const prefixPad = settings.labels.percentPrefixPadding ?? 0;
              // In auto-contrast mode, prefix inherits label color
              const prefixColor = settings.labels.dataPointColorMode === 'auto'
                ? labelColor
                : (settings.labels.percentPrefixColor ?? labelColor);
              const prefixStyle = {
                fontSize: settings.labels.percentPrefixFontSize ?? settings.labels.dataPointFontSize,
                fontWeight: fontWeightToCSS(settings.labels.percentPrefixFontWeight ?? 'normal'),
                fill: prefixColor,
              };

              const labelFontSize = settings.labels.dataPointFontSize;
              const labelCenterY = barY + actualBarH / 2 + offsetY;

              // Render label text (without prefix)
              labelElements.push(
                <text
                  key={`label-${ci}-${si}`}
                  x={labelX + offsetX}
                  y={labelCenterY}
                  dy="0.35em"
                  textAnchor={anchor}
                  style={{
                    fontSize: labelFontSize,
                    fontFamily: settings.labels.dataPointFontFamily,
                    fontWeight: fontWeightToCSS(settings.labels.dataPointFontWeight),
                    fontStyle: settings.labels.dataPointFontStyle || 'normal',
                    fill: labelColor,
                    pointerEvents: 'none',
                  }}
                >
                  {labelText}
                </text>
              );

              // Render prefix as separate text element for independent positioning
              if (showPercent) {
                const labelW = measureTextWidth(labelText, labelFontSize, settings.labels.dataPointFontFamily, String(fontWeightToCSS(settings.labels.dataPointFontWeight)));
                const prefixText = '%';
                const prefixFs = prefixStyle.fontSize as number;
                const prefixW = measureTextWidth(prefixText, prefixFs, settings.labels.dataPointFontFamily, String(prefixStyle.fontWeight));
                let prefixX: number;

                if (prefixPos === 'left') {
                  if (anchor === 'start') {
                    prefixX = labelX + offsetX - prefixPad - prefixW;
                  } else if (anchor === 'end') {
                    prefixX = labelX + offsetX - labelW - prefixPad - prefixW;
                  } else {
                    prefixX = labelX + offsetX - labelW / 2 - prefixPad - prefixW;
                  }
                } else {
                  if (anchor === 'start') {
                    prefixX = labelX + offsetX + labelW + prefixPad;
                  } else if (anchor === 'end') {
                    prefixX = labelX + offsetX + prefixPad;
                  } else {
                    prefixX = labelX + offsetX + labelW / 2 + prefixPad;
                  }
                }

                // Vertical alignment: bottom (baseline-align with label), center, or top
                const vAlign = settings.labels.percentPrefixVerticalAlign ?? 'bottom';
                let prefixDy: string;
                if (vAlign === 'center') {
                  prefixDy = '0.35em';
                } else if (vAlign === 'top') {
                  // Align prefix top with label top
                  const sizeDiff = labelFontSize - prefixFs;
                  prefixDy = `${0.35 - sizeDiff / (2 * prefixFs)}em`;
                } else {
                  // bottom: align prefix baseline with label baseline
                  const sizeDiff = labelFontSize - prefixFs;
                  prefixDy = `${0.35 + sizeDiff / (2 * prefixFs)}em`;
                }

                const prefixVerticalOffset = (settings.labels.percentPrefixPaddingBottom ?? 0) - (settings.labels.percentPrefixPaddingTop ?? 0);

                labelElements.push(
                  <text
                    key={`prefix-${ci}-${si}`}
                    x={prefixX}
                    y={labelCenterY + prefixVerticalOffset}
                    dy={prefixDy}
                    textAnchor="start"
                    style={{
                      ...prefixStyle,
                      fontFamily: settings.labels.dataPointFontFamily,
                      fontStyle: settings.labels.dataPointFontStyle || 'normal',
                      pointerEvents: 'none',
                    }}
                  >
                    {prefixText}
                  </text>
                );
              }
            }

            if (value >= 0) stackX += barW;
            else stackX -= barW;
          });

          // Stack labels
          if (settings.labels.stackLabelMode !== 'none') {
            const total = series.reduce((sum, s) => sum + (s.data[ci] || 0), 0);
            const labelText = formatNumber(total, settings.numberFormatting);
            const totalBarW = xScale(Math.max(0, minVal) + Math.abs(total * animProgress)) - xScale(Math.max(0, minVal));

            labelElements.push(
              <text
                key={`stack-label-${ci}`}
                x={padding.left + xScale(Math.max(0, minVal)) + totalBarW + 6}
                y={barY + barHeight / 2}
                dy="0.35em"
                textAnchor="start"
                style={{
                  fontSize: settings.labels.dataPointFontSize,
                  fontFamily: settings.labels.dataPointFontFamily,
                  fontWeight: fontWeightToCSS(settings.labels.dataPointFontWeight),
                  fontStyle: settings.labels.dataPointFontStyle || 'normal',
                  fill: settings.labels.dataPointColor || '#333',
                  pointerEvents: 'none',
                }}
              >
                {labelText}
              </text>
            );
          }

          // Y-axis label rendering with truncation/wrapping
          const renderYAxisLabel = () => {
            if (yAxisHidden || isAboveBars) return null;

            const useFixedWidth = settings.yAxis.spaceMode === 'fixed';
            const maxLabelW = useFixedWidth ? settings.yAxis.spaceModeValue - 4 : yLabelMaxWidth;
            const maxLines = useFixedWidth ? (settings.yAxis.fixedMaxLines ?? 0) : 0;
            const useEllipsis = settings.yAxis.fixedEllipsis ?? true;

            const fullWidth = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
            const needsTruncation = fullWidth > maxLabelW && maxLabelW > 0;

            // Check if label has spaces (can wrap)
            const hasSpaces = cat.includes(' ');

            const renderLines = (labelX: number, anchor: 'start' | 'end') => {
              let lines = wrapText(cat, maxLabelW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
              // Apply max lines limit
              if (maxLines > 0 && lines.length > maxLines) {
                lines = lines.slice(0, maxLines);
                if (useEllipsis) {
                  const lastLine = lines[maxLines - 1];
                  const ellipsisText = truncateText(lastLine + '...', maxLabelW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                  lines[maxLines - 1] = ellipsisText.endsWith('...') ? ellipsisText : lastLine.slice(0, -1) + '...';
                }
              }
              const lineHeight = yTickStyle.fontSize * 1.2;
              const totalH = lines.length * lineHeight;
              const centerY = barY + barHeight / 2;
              const startY = centerY - totalH / 2;
              return lines.map((line, li) => (
                <text
                  key={`ylabel-${ci}-${li}`}
                  x={labelX}
                  y={startY + lineHeight * li + lineHeight / 2}
                  dy="0.35em"
                  textAnchor={anchor}
                  style={{
                    fontSize: yTickStyle.fontSize,
                    fontFamily: yTickStyle.fontFamily,
                    fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                    fontStyle: yTickStyle.fontStyle || 'normal',
                    fill: yTickStyle.color,
                  }}
                >
                  {line}
                </text>
              ));
            };

            const renderSingleLine = (labelX: number, anchor: 'start' | 'end') => {
              const displayText = needsTruncation
                ? truncateText(cat, maxLabelW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight)
                : cat;
              return (
                <text
                  x={labelX}
                  y={barY + barHeight / 2}
                  dy="0.35em"
                  textAnchor={anchor}
                  style={{
                    fontSize: yTickStyle.fontSize,
                    fontFamily: yTickStyle.fontFamily,
                    fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                    fontStyle: yTickStyle.fontStyle || 'normal',
                    fill: yTickStyle.color,
                  }}
                >
                  {displayText}
                </text>
              );
            };

            if (yAxisRight) {
              const labelX = padding.left + plotWidth + tickPadding + 6;
              if (needsTruncation && hasSpaces && (maxLines === 0 || maxLines > 1)) {
                return renderLines(labelX, 'start');
              } else {
                return renderSingleLine(labelX, 'start');
              }
            } else {
              const labelX = padding.left - tickPadding - 6;
              if (needsTruncation && hasSpaces && (maxLines === 0 || maxLines > 1)) {
                return renderLines(labelX, 'end');
              } else {
                return renderSingleLine(labelX, 'end');
              }
            }
          };

          return (
            <g key={`cat-${ci}`}>
              {/* Above-bars category label */}
              {isAboveBars && (() => {
                // When zero line is hidden, align with bar left edge (padding.left)
                // When zero line is visible, align at zero position
                const zeroLineVisible = hasZeroInRange && settings.xAxis.zeroLine?.show === true;
                const aboveLabelX = zeroLineVisible
                  ? padding.left + xScale(0)
                  : padding.left;
                const abPad = settings.labels;
                const aboveX = aboveLabelX + (abPad.aboveBarPaddingLeft || 0) - (abPad.aboveBarPaddingRight || 0);
                const aboveY = catY + yTickStyle.fontSize + (abPad.aboveBarPaddingTop || 0) - (abPad.aboveBarPaddingBottom || 0);

                // When space mode is fixed, wrap/truncate above-bars labels
                const useAboveFixedWidth = settings.yAxis.spaceMode === 'fixed';
                const aboveMaxW = useAboveFixedWidth ? settings.yAxis.spaceModeValue : 0;

                if (useAboveFixedWidth && aboveMaxW > 0) {
                  const fullW = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                  const needsWrap = fullW > aboveMaxW;
                  if (needsWrap && cat.includes(' ')) {
                    const lines = wrapText(cat, aboveMaxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                    const lineHeight = yTickStyle.fontSize * 1.2;
                    return lines.map((line, li) => (
                      <text
                        key={`above-${ci}-${li}`}
                        x={aboveX}
                        y={aboveY + li * lineHeight}
                        textAnchor="start"
                        style={{
                          fontSize: yTickStyle.fontSize,
                          fontFamily: yTickStyle.fontFamily,
                          fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                          fontStyle: yTickStyle.fontStyle || 'normal',
                          fill: yTickStyle.color,
                        }}
                      >
                        {line}
                      </text>
                    ));
                  } else if (needsWrap) {
                    const displayText = truncateText(cat, aboveMaxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                    return (
                      <text
                        x={aboveX}
                        y={aboveY}
                        textAnchor="start"
                        style={{
                          fontSize: yTickStyle.fontSize,
                          fontFamily: yTickStyle.fontFamily,
                          fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                          fontStyle: yTickStyle.fontStyle || 'normal',
                          fill: yTickStyle.color,
                        }}
                      >
                        {displayText}
                      </text>
                    );
                  }
                }

                return (
                  <text
                    x={aboveX}
                    y={aboveY}
                    textAnchor="start"
                    style={{
                      fontSize: yTickStyle.fontSize,
                      fontFamily: yTickStyle.fontFamily,
                      fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                      fontStyle: yTickStyle.fontStyle || 'normal',
                      fill: yTickStyle.color,
                    }}
                  >
                    {cat}
                  </text>
                );
              })()}
              {/* Y axis label */}
              {renderYAxisLabel()}
              {barElements}
              {labelElements}
            </g>
          );
        })}

        {/* ── Legend (rendered inside SVG for proper export) ── */}
        {settings.legend.show && (() => {
          // Legend padding offsets
          const lPadT = settings.legend.paddingTop || 0;
          const lPadR = settings.legend.paddingRight || 0;
          const lPadB = settings.legend.paddingBottom || 0;
          const lPadL = settings.legend.paddingLeft || 0;
          // xAxisSpaceBelow: the space taken by x-axis elements (ticks, labels, title) — excludes layout padding
          const xAxisSpaceBelow = !xAxisOnTop ? xAxisHeight + xAxisTitleHeight : 0;
          // Legend Y: independent of layout padding — uses chart area + xAxis space only
          const legendY = legendIsOverlay
            ? chartTop + (settings.legend.overlayY ?? 10) + lPadT
            : legendIsAbove
              ? (settings.legend.marginTop || 0) + lPadT
              : chartBottom + xAxisSpaceBelow + (settings.legend.marginTop || 0) + lPadT;
          // Legend X: NOT affected by layout padding (uses full width for alignment)
          let curX = legendIsOverlay
            ? padding.left + (settings.legend.overlayX ?? 10) + lPadL
            : 0 + lPadL;
          const swW = settings.legend.swatchWidth;
          const swH = settings.legend.swatchHeight;
          const gap = settings.legend.swatchPadding || 8;
          const fontSize = settings.legend.size;

          // Compute total width for alignment
          const itemWidths = legendItems.map((item) => {
            const textW = measureTextWidth(item.name, fontSize, settings.legend.fontFamily || 'Inter, sans-serif', settings.legend.textWeight);
            return swW + 4 + textW;
          });
          const totalWidth = itemWidths.reduce((s, w) => s + w, 0) + (legendItems.length - 1) * gap;

          if (!legendIsOverlay) {
            if (settings.legend.alignment === 'center') {
              curX = (width - totalWidth) / 2 + lPadL - lPadR;
            } else if (settings.legend.alignment === 'right') {
              curX = width - totalWidth - lPadR;
            }
          }
          // lPadB is applied to total height calculation via legendHeight (reserved for future adjustments)
          void lPadB;

          if (settings.legend.orientation === 'vertical') {
            // Find the widest legend item to align swatches consistently
            const maxItemW = Math.max(...legendItems.map((item) =>
              swW + 4 + measureTextWidth(item.name, fontSize, settings.legend.fontFamily || 'Inter, sans-serif', settings.legend.textWeight)
            ));
            // Group-level startX: all swatches share the same x position
            const groupStartX = legendIsOverlay
              ? curX
              : settings.legend.alignment === 'center'
                ? lPadL + (width - lPadL - lPadR - maxItemW) / 2
                : settings.legend.alignment === 'right'
                  ? width - maxItemW - lPadR
                  : 0 + lPadL;
            return legendItems.map((item, idx) => {
              const itemY = legendY + idx * (fontSize + gap);
              return (
                <g key={`legend-${idx}`}>
                  <rect
                    x={groupStartX}
                    y={itemY}
                    width={swW}
                    height={swH}
                    fill={item.color}
                    rx={settings.legend.swatchRoundness}
                  />
                  <text
                    x={groupStartX + swW + 4}
                    y={itemY + swH / 2}
                    dy="0.35em"
                    style={{
                      fontSize,
                      fontFamily: settings.legend.fontFamily || 'Inter, sans-serif',
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
          }

          // Build wrapped rows
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
            let currentRow: number[] = [];
            let currentWidth = 0;
            for (let i = 0; i < legendItems.length; i++) {
              const iw = itemWidths[i] + (currentRow.length > 0 ? gap : 0);
              if (currentRow.length > 0 && currentWidth + iw > availW) {
                rows.push(currentRow);
                currentRow = [i];
                currentWidth = itemWidths[i];
              } else {
                currentRow.push(i);
                currentWidth += iw;
              }
            }
            if (currentRow.length > 0) rows.push(currentRow);
          }

          return rows.flatMap((row, rowIdx) => {
            const rowTotalW = row.reduce((s, i) => s + itemWidths[i], 0) + (row.length - 1) * gap;
            let rowX = legendIsOverlay
              ? padding.left + (settings.legend.overlayX ?? 10) + lPadL
              : 0 + lPadL;
            if (!legendIsOverlay) {
              if (settings.legend.alignment === 'center') {
                rowX = (width - rowTotalW) / 2 + lPadL - lPadR;
              } else if (settings.legend.alignment === 'right') {
                rowX = width - rowTotalW - lPadR;
              }
            }
            const rowY = legendY + rowIdx * (fontSize + rowGapPx);
            return row.map((itemIdx) => {
              const item = legendItems[itemIdx];
              const x = rowX;
              rowX += itemWidths[itemIdx] + gap;
              return (
                <g key={`legend-${itemIdx}`}>
                  <rect
                    x={x}
                    y={rowY}
                    width={swW}
                    height={swH}
                    fill={item.color}
                    rx={settings.legend.swatchRoundness}
                  />
                  <text
                    x={x + swW + 4}
                    y={rowY + swH / 2}
                    dy="0.35em"
                    style={{
                      fontSize,
                      fontFamily: settings.legend.fontFamily || 'Inter, sans-serif',
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

      {/* ── Tooltip ── */}
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
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.category}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: tooltip.color,
              }}
            />
            <span>{tooltip.series}: {formatNumber(tooltip.value, settings.numberFormatting)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
