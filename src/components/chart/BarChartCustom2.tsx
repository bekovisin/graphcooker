'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { getPaletteColors, extendColors } from '@/lib/chart/palettes';

// ─── Types ────────────────────────────────────────────────────────────
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  category: string;
  value: number;
  color: string;
  info?: string;
}

interface BarChartCustom2Props {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
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

function resolveColors(colorsSettings: ChartSettings['colors'], names: string[]): string[] {
  let colors = getPaletteColors(colorsSettings.palette, colorsSettings.customPaletteColors);
  if (colorsSettings.extend) {
    colors = extendColors(colors, Math.max(names.length, colors.length));
  }
  const overrides = parseCustomOverrides(colorsSettings.customOverrides);
  return names.map((name, i) => overrides[name] || colors[i % colors.length]);
}

function formatNumber(value: number, nf: ChartSettings['numberFormatting'], decimalOverride?: number): string {
  const decimals = decimalOverride !== undefined ? decimalOverride : nf.decimalPlaces;
  const factor = Math.pow(10, decimals);
  const adjusted = nf.roundDecimal !== false
    ? Math.round(value * factor) / factor
    : Math.trunc(value * factor) / factor;
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

// Common Lucide icon SVG paths (pre-extracted for inline SVG rendering)
const LUCIDE_ICON_PATHS: Record<string, string> = {
  'circle': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  'arrow-up': 'M12 19V5M5 12l7-7 7 7',
  'arrow-down': 'M12 5v14M19 12l-7 7-7-7',
  'triangle': 'M12 2l10 18H2z',
  'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'check': 'M20 6L9 17l-5-5',
  'x': 'M18 6L6 18M6 6l12 12',
  'minus': 'M5 12h14',
  'plus': 'M12 5v14M5 12h14',
  'chevron-up': 'M18 15l-6-6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'trending-up': 'M22 7l-8.5 8.5-5-5L2 17',
  'trending-down': 'M22 17l-8.5-8.5-5 5L2 7',
  'info': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01',
  'alert-circle': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01',
  'dot': 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0 -4 0',
};

function getDashArray(style: string, dashLength: number, width: number): string | undefined {
  if (style === 'dashed') return `${dashLength} ${dashLength}`;
  if (style === 'dotted') return `${width} ${width * 2}`;
  return undefined;
}

// ─── Component ────────────────────────────────────────────────────────
export function BarChartCustom2({ data, columnMapping, settings, width, height: heightProp, skipAnimation }: BarChartCustom2Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, category: '', value: 0, color: '' });
  const [animProgress, setAnimProgress] = useState(skipAnimation || !settings.animations.enabled ? 1 : 0);

  // Animation
  useEffect(() => {
    if (skipAnimation) { setAnimProgress(1); return; }
    if (!settings.animations.enabled) { setAnimProgress(1); return; }
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

  // ── Build categories & values (single value per row) ──
  const { categories, values, colors, infoValues, maxVal, minVal } = useMemo(() => {
    if (!columnMapping.values || columnMapping.values.length === 0 || !columnMapping.labels) {
      return { categories: [] as string[], values: [] as number[], colors: [] as string[], infoValues: [] as string[], maxVal: 0, minVal: 0 };
    }

    const valueCol = columnMapping.values[0];
    let cats = data.map((row) => String(row[columnMapping.labels] || ''));
    let vals = data.map((row) => {
      const v = row[valueCol];
      return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
    });

    // Info column
    const infoCol = columnMapping.info;
    let infos = infoCol ? data.map((row) => String(row[infoCol] ?? '')) : data.map(() => '');

    // Sort by value
    if (settings.chartType.sortMode === 'value') {
      const indices = vals.map((_, i) => i).sort((a, b) => vals[b] - vals[a]);
      cats = indices.map((i) => cats[i]);
      vals = indices.map((i) => vals[i]);
      infos = indices.map((i) => infos[i]);
    } else if (settings.chartType.sortMode === 'label') {
      const indices = cats.map((_, i) => i).sort((a, b) => cats[a].localeCompare(cats[b]));
      cats = indices.map((i) => cats[i]);
      vals = indices.map((i) => vals[i]);
      infos = indices.map((i) => infos[i]);
    }

    // Color per row (by_row mode uses row labels, by_column uses single series)
    const colorNames = settings.colors.colorMode === 'by_row' ? cats : [valueCol];
    const resolvedColors = resolveColors(settings.colors, colorNames);
    const rowColors = settings.colors.colorMode === 'by_row'
      ? resolvedColors
      : cats.map(() => resolvedColors[0] || '#6366f1');

    const maxV = Math.max(0, ...vals);
    const minV = Math.min(0, ...vals);

    const userMin = settings.xAxis.min ? parseFloat(settings.xAxis.min) : undefined;
    const userMax = settings.xAxis.max ? parseFloat(settings.xAxis.max) : undefined;

    return {
      categories: cats,
      values: vals,
      colors: rowColors,
      infoValues: infos,
      maxVal: userMax !== undefined ? userMax : maxV,
      minVal: userMin !== undefined ? userMin : minV,
    };
  }, [data, columnMapping, settings.colors, settings.chartType.sortMode, settings.xAxis.min, settings.xAxis.max]);

  // ── Settings shortcuts ──
  const yAxisHidden = settings.yAxis.position === 'hidden';
  const yAxisRight = settings.yAxis.position === 'right';
  const xAxisHidden = settings.xAxis.position === 'hidden';
  const xAxisOnTop = settings.xAxis.position === 'top' || settings.xAxis.position === 'float_up';
  const flipAxis = settings.xAxis.flipAxis;

  const yTickStyle = settings.yAxis.tickStyling;
  const xTickStyle = settings.xAxis.tickStyling;
  const nf = settings.numberFormatting;
  const xAxisDecimals = nf.xAxisCustomDecimals ? nf.xAxisDecimalPlaces : undefined;

  const barBg = settings.barBackground;
  const rowBorders = settings.barRowBorders;
  const connector = settings.connectorBorder;
  const prefix = settings.customPrefix;
  const info = settings.infoColumn;

  // ── Y-axis label width ──
  const yAxisLabelWidth = useMemo(() => {
    if (yAxisHidden) return 0;
    if (settings.yAxis.spaceMode === 'fixed') return settings.yAxis.spaceModeValue;
    let maxW = 0;
    for (const cat of categories) {
      const w = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
      if (w > maxW) maxW = w;
    }
    return maxW + 10;
  }, [categories, yAxisHidden, settings.yAxis.spaceMode, settings.yAxis.spaceModeValue, yTickStyle]);

  // ── Info column width ──
  const infoColumnWidth = useMemo(() => {
    if (!info.show) return 0;
    let maxW = 0;
    for (let i = 0; i < infoValues.length; i++) {
      const text = infoValues[i];
      if (!text) continue;
      const cat = categories[i];
      const fs = info.perRowFontSizes[cat] ?? info.fontSize;
      const ff = info.perRowFontFamilies[cat] ?? info.fontFamily;
      const fw = info.perRowFontWeights[cat] ?? info.fontWeight;
      const w = measureTextWidth(text, fs, ff, fw);
      if (w > maxW) maxW = w;
    }
    const iconSpace = info.icon.show ? info.icon.size + 4 : 0;
    return maxW + iconSpace + info.padding * 2;
  }, [info, infoValues, categories]);

  // ── Outside label width (when labels are outside_right) ──
  const outsideLabelWidth = useMemo(() => {
    if (!settings.labels.showDataPointLabels) return 0;
    const pos = settings.labels.dataPointPosition;
    if (pos !== 'outside_right') return 0;
    let maxW = 0;
    for (const v of values) {
      const text = formatNumber(v, nf);
      const w = measureTextWidth(text, settings.labels.dataPointFontSize, settings.labels.dataPointFontFamily, settings.labels.dataPointFontWeight);
      if (w > maxW) maxW = w;
    }
    // Add prefix width if enabled
    if (prefix.show) {
      const prefW = measureTextWidth(prefix.text, prefix.fontSize, settings.labels.dataPointFontFamily, prefix.fontWeight);
      maxW += prefW + (prefix.padding || 0);
    }
    // Add connector width
    if (connector.show) {
      maxW += connector.paddingBar + connector.length + connector.paddingLabel;
    }
    return maxW + (settings.labels.outsideLabelPadding ?? 6);
  }, [settings.labels, values, nf, prefix, connector]);

  // ── X-axis ticks ──
  const xTicksAll = useMemo(() => {
    let ticks: number[];
    if (settings.xAxis.ticksToShowMode === 'custom') {
      ticks = generateCustomStepTicks(minVal, maxVal, settings.xAxis.tickStep || 10);
    } else if (settings.xAxis.ticksToShowMode === 'number') {
      ticks = generateNiceTicks(minVal, maxVal, settings.xAxis.ticksToShowNumber);
    } else {
      ticks = generateNiceTicks(minVal, maxVal);
    }
    return ticks.filter((t) => t >= minVal - 1e-9 && t <= maxVal + 1e-9);
  }, [minVal, maxVal, settings.xAxis.ticksToShowMode, settings.xAxis.ticksToShowNumber, settings.xAxis.tickStep]);

  const xTicks = useMemo(() => {
    let ticks = [...xTicksAll];
    const hiddenSet = new Set(settings.xAxis.hiddenTickLabels || []);
    if (settings.xAxis.tickLabelCountMode === 'custom' && settings.xAxis.tickLabelCount > 0 && settings.xAxis.tickLabelCount < ticks.length) {
      const count = settings.xAxis.tickLabelCount;
      const step = (ticks.length - 1) / (count - 1);
      const visibleIndices = new Set<number>();
      for (let i = 0; i < count; i++) visibleIndices.add(Math.round(i * step));
      ticks = ticks.filter((_, i) => visibleIndices.has(i));
    }
    if (hiddenSet.size > 0) {
      ticks = ticks.filter((tick) => !hiddenSet.has(formatNumber(tick, nf, xAxisDecimals)));
    }
    return ticks;
  }, [xTicksAll, settings.xAxis.tickLabelCountMode, settings.xAxis.tickLabelCount, settings.xAxis.hiddenTickLabels, nf, xAxisDecimals]);

  // ── X-axis height ──
  const tickAngle = settings.xAxis.tickAngle || 0;
  const hasAngle = tickAngle !== 0;
  const labelAxisPad = settings.xAxis.labelAxisPadding || 0;
  const xAxisHeight = useMemo(() => {
    if (xAxisHidden) return 0;
    if (!hasAngle) return xTickStyle.fontSize + 10 + labelAxisPad;
    const maxLabel = xTicks.reduce((longest, tick) => {
      const label = formatNumber(tick, nf, xAxisDecimals);
      return label.length > longest.length ? label : longest;
    }, '');
    const maxW = measureTextWidth(maxLabel, xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    const rad = Math.abs(tickAngle) * (Math.PI / 180);
    return Math.ceil(maxW * Math.sin(rad) + xTickStyle.fontSize * Math.cos(rad)) + 10 + labelAxisPad;
  }, [xAxisHidden, hasAngle, tickAngle, xTicks, xTickStyle, nf, labelAxisPad, xAxisDecimals]);

  const xAxisTitleHeight = settings.xAxis.titleType === 'custom' && settings.xAxis.titleText ? settings.xAxis.titleStyling.fontSize + 10 : 0;
  const yAxisTitleWidth = settings.yAxis.titleType === 'custom' && settings.yAxis.titleText ? settings.yAxis.titleStyling.fontSize + 10 : 0;
  const tickPadding = settings.yAxis.tickPadding || 0;

  // ── Padding ──
  const padding = useMemo(() => {
    const yLabelSpace = yAxisLabelWidth + tickPadding + yAxisTitleWidth;
    const infoLeft = info.show && info.position === 'left' ? infoColumnWidth : 0;
    const infoRight = info.show && info.position === 'right' ? infoColumnWidth : 0;
    return {
      top: settings.layout.paddingTop + (xAxisOnTop ? xAxisHeight + xAxisTitleHeight : 0),
      right: settings.layout.paddingRight + (yAxisRight && !yAxisHidden ? yLabelSpace : 0) + outsideLabelWidth + infoRight,
      bottom: settings.layout.paddingBottom + (!xAxisOnTop ? xAxisHeight + xAxisTitleHeight : 0),
      left: settings.layout.paddingLeft + (!yAxisRight && !yAxisHidden ? yLabelSpace : 0) + infoLeft,
    };
  }, [settings.layout, yAxisLabelWidth, tickPadding, yAxisTitleWidth, xAxisHeight, xAxisTitleHeight, yAxisRight, yAxisHidden, xAxisOnTop, outsideLabelWidth, infoColumnWidth, info.show, info.position]);

  // ── Bar sizing ──
  const spacingMain = settings.bars.spacingMain;
  const barHeight = (() => {
    if (heightProp && categories.length > 0) {
      const nonBarSpace = padding.top + padding.bottom;
      const availableForBars = heightProp - nonBarSpace;
      const perCategory = availableForBars / categories.length;
      return Math.max(4, perCategory - spacingMain);
    }
    return settings.bars.barHeight;
  })();

  // Category Y offsets
  const catYOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cumY = 0;
    for (let ci = 0; ci < categories.length; ci++) {
      offsets.push(cumY);
      cumY += barHeight + spacingMain;
    }
    return offsets;
  }, [categories.length, barHeight, spacingMain]);

  const totalBarsHeight = catYOffsets.length > 0
    ? catYOffsets[catYOffsets.length - 1] + barHeight + spacingMain
    : 0;

  const computedChartHeight = totalBarsHeight + padding.top + padding.bottom;
  const svgHeight = heightProp || computedChartHeight;
  const plotWidth = Math.max(1, width - padding.left - padding.right);

  // Scale
  const xScale = useCallback((val: number) => {
    if (maxVal <= minVal) return 0;
    const ratio = (val - minVal) / (maxVal - minVal);
    return flipAxis ? plotWidth * (1 - ratio) : plotWidth * ratio;
  }, [minVal, maxVal, plotWidth, flipAxis]);

  // Tooltip
  const handleBarHover = useCallback((e: React.MouseEvent, cat: string, value: number, color: string, infoText?: string) => {
    if (!settings.popupsPanels.showPopup) return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({ visible: true, x: e.clientX - svgRect.left, y: e.clientY - svgRect.top - 10, category: cat, value, color, info: infoText });
  }, [settings.popupsPanels.showPopup]);

  const handleBarLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Render ──
  if (width <= 0) return null;

  if (categories.length === 0 || values.length === 0) {
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

  const axisLineShow = settings.xAxis.axisLine.show && !xAxisHidden;
  const tickMarksShow = settings.xAxis.tickMarks.show && !xAxisHidden;
  const tickMarkPosition = settings.xAxis.tickMarks.position;

  const chartTop = padding.top;
  const chartBottom = chartTop + totalBarsHeight;
  const xAxisYPos = xAxisOnTop ? chartTop : chartBottom;
  const xAxisTickDir = xAxisOnTop ? -1 : 1;

  const bgOpacity = (settings.layout.backgroundOpacity ?? 100) / 100;
  const bgColor = settings.layout.backgroundColor || 'transparent';

  const getTickMarkY1Y2 = (baseY: number, dir: number, length: number) => {
    if (tickMarkPosition === 'outside') return { y1: baseY, y2: baseY + dir * length };
    if (tickMarkPosition === 'inside') return { y1: baseY, y2: baseY - dir * length };
    return { y1: baseY - dir * (length / 2), y2: baseY + dir * (length / 2) };
  };

  const zeroX = xScale(0);
  const hasZeroInRange = minVal <= 0 && maxVal >= 0;

  // Full chart width for row borders (spans from SVG left to right)
  const fullLeft = 0;
  const fullRight = width;

  // Y axis title
  const yAxisTitle = settings.yAxis.titleType === 'custom' ? settings.yAxis.titleText : '';
  const xAxisTitle = settings.xAxis.titleType === 'custom' ? settings.xAxis.titleText : '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={svgHeight}
        viewBox={`0 0 ${width} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Layout background */}
        <rect x="0" y="0" width={width} height={svgHeight} fill={bgColor === 'transparent' ? 'none' : bgColor} fillOpacity={bgOpacity} />

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

        {/* ── Gridlines ── */}
        {settings.xAxis.gridlines && xTicksAll.map((tick) => {
          if (tick === 0 && hasZeroInRange && settings.xAxis.showZeroGridline === false) return null;
          const x = padding.left + xScale(tick);
          return (
            <line key={`grid-${tick}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke={gridStroke} strokeWidth={gridStrokeWidth} strokeDasharray={gridDashArray} />
          );
        })}

        {/* ── Y axis line ── */}
        {settings.yAxis.axisLine?.show && (() => {
          const yLineX = yAxisRight ? padding.left + plotWidth : padding.left;
          return (
            <line x1={yLineX} y1={chartTop} x2={yLineX} y2={chartBottom} stroke={settings.yAxis.axisLine.color} strokeWidth={settings.yAxis.axisLine.width} />
          );
        })()}

        {/* ── Zero line ── */}
        {hasZeroInRange && settings.xAxis.zeroLine?.show === true && zeroX >= 0 && zeroX <= plotWidth && (
          <line
            x1={padding.left + zeroX}
            y1={chartTop - (settings.xAxis.zeroLineExtendTop || 0)}
            x2={padding.left + zeroX}
            y2={chartBottom + (settings.xAxis.zeroLineExtendBottom || 0)}
            stroke={settings.xAxis.zeroLine?.color || '#666666'}
            strokeWidth={settings.xAxis.zeroLine?.width || 1}
          />
        )}

        {/* ── X axis line ── */}
        {axisLineShow && (
          <line x1={padding.left} y1={xAxisYPos} x2={padding.left + plotWidth} y2={xAxisYPos} stroke={settings.xAxis.axisLine.color} strokeWidth={settings.xAxis.axisLine.width} />
        )}

        {/* ── X axis ticks & labels ── */}
        {!xAxisHidden && xTicks.map((tick) => {
          const x = padding.left + xScale(tick);
          const tickLen = settings.xAxis.tickMarks.length;
          const { y1: tmY1, y2: tmY2 } = getTickMarkY1Y2(xAxisYPos, xAxisTickDir, tickLen);
          const labelText = formatNumber(tick, nf, xAxisDecimals);
          const labelY = xAxisOnTop
            ? xAxisYPos - (tickMarksShow ? tickLen : 0) - 6 - labelAxisPad
            : xAxisYPos + (tickMarksShow ? tickLen : 0) + xTickStyle.fontSize + 4 + labelAxisPad;

          return (
            <g key={`xtick-${tick}`}>
              {tickMarksShow && (
                <line x1={x} y1={tmY1} x2={x} y2={tmY2} stroke={settings.xAxis.tickMarks.color} strokeWidth={settings.xAxis.tickMarks.width} />
              )}
              <text
                x={x}
                y={hasAngle ? xAxisYPos + (xAxisOnTop ? -1 : 1) * ((tickMarksShow ? tickLen : 0) + 4 + labelAxisPad) : labelY}
                textAnchor={hasAngle ? (tickAngle > 0 ? 'start' : 'end') : 'middle'}
                dominantBaseline={hasAngle ? (xAxisOnTop ? 'auto' : 'hanging') : 'auto'}
                transform={hasAngle ? `rotate(${tickAngle}, ${x}, ${xAxisYPos + (xAxisOnTop ? -1 : 1) * ((tickMarksShow ? tickLen : 0) + 4 + labelAxisPad)})` : undefined}
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
            y={xAxisOnTop ? chartTop - xAxisHeight - 4 : chartBottom + xAxisHeight + xAxisTitleHeight - 4}
            textAnchor="middle"
            style={{
              fontSize: settings.xAxis.titleStyling.fontSize,
              fontFamily: settings.xAxis.titleStyling.fontFamily,
              fontWeight: fontWeightToCSS(settings.xAxis.titleStyling.fontWeight),
              fill: settings.xAxis.titleStyling.color,
            }}
          >
            {xAxisTitle}
          </text>
        )}

        {/* ── Y axis title ── */}
        {yAxisTitle && (() => {
          const titleX = yAxisRight ? width - 12 : 12;
          const titleY = chartTop + totalBarsHeight / 2;
          return (
            <text x={titleX} y={titleY} textAnchor="middle" transform={`rotate(-90, ${titleX}, ${titleY})`}
              style={{
                fontSize: settings.yAxis.titleStyling.fontSize,
                fontFamily: settings.yAxis.titleStyling.fontFamily,
                fontWeight: fontWeightToCSS(settings.yAxis.titleStyling.fontWeight),
                fill: settings.yAxis.titleStyling.color,
              }}
            >
              {yAxisTitle}
            </text>
          );
        })()}

        {/* ── Bars, Labels, Info, Borders ── */}
        {categories.map((cat, ci) => {
          const catY = chartTop + catYOffsets[ci];
          const barY = catY;
          const rawValue = values[ci];
          const value = rawValue * animProgress;
          const barW = Math.abs(xScale(Math.max(0, minVal) + Math.abs(value)) - xScale(Math.max(0, minVal)));
          const barStartX = value >= 0 ? xScale(Math.max(0, minVal)) : xScale(Math.max(0, minVal)) - barW;
          const barColor = colors[ci];
          const infoText = infoValues[ci];

          // Border radius
          const br = settings.bars.borderRadius[cat] || { tl: 0, tr: 0, bl: 0, br: 0 };

          // Data label
          const labelPos = settings.labels.dataPointPosition === 'custom'
            ? (settings.labels.dataPointCustomMode === 'row'
              ? (settings.labels.dataPointRowPositions?.[cat] || 'center')
              : (settings.labels.dataPointSeriesPositions?.[columnMapping.values[0]] || 'center'))
            : settings.labels.dataPointPosition;

          return (
            <g key={`row-${ci}`}>
              {/* ── Bar background ── */}
              {barBg.show && (
                <rect
                  x={padding.left}
                  y={barY}
                  width={plotWidth}
                  height={barHeight}
                  fill={barBg.color}
                  fillOpacity={barBg.opacity}
                  rx={2}
                />
              )}

              {/* ── Actual bar ── */}
              <rect
                x={padding.left + barStartX}
                y={barY}
                width={Math.max(0, barW)}
                height={barHeight}
                fill={barColor}
                fillOpacity={settings.bars.barOpacity}
                stroke={settings.bars.outline ? settings.bars.outlineColor : 'none'}
                strokeWidth={settings.bars.outline ? settings.bars.outlineWidth : 0}
                rx={br.tr || 0}
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => handleBarHover(e, cat, rawValue, barColor, infoText)}
                onMouseLeave={handleBarLeave}
              />

              {/* ── Y-axis labels ── */}
              {!yAxisHidden && (() => {
                const labelX = yAxisRight
                  ? padding.left + plotWidth + tickPadding + 4
                  : padding.left - tickPadding - 4;
                const anchor = yAxisRight ? 'start' : 'end';

                // Wrap or truncate
                if (settings.yAxis.spaceMode === 'fixed' && settings.yAxis.spaceModeValue > 0) {
                  const maxW = settings.yAxis.spaceModeValue;
                  const fullW = measureTextWidth(cat, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                  if (fullW > maxW && cat.includes(' ')) {
                    const lines = wrapText(cat, maxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                    const maxLines = settings.yAxis.fixedMaxLines > 0 ? settings.yAxis.fixedMaxLines : lines.length;
                    const displayLines = lines.slice(0, maxLines);
                    if (settings.yAxis.fixedEllipsis && lines.length > maxLines) {
                      const last = displayLines[displayLines.length - 1];
                      displayLines[displayLines.length - 1] = truncateText(last + '...', maxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight);
                    }
                    const lineH = yTickStyle.fontSize * 1.2;
                    const totalH = displayLines.length * lineH;
                    const startY = barY + barHeight / 2 - totalH / 2 + yTickStyle.fontSize * 0.35;
                    return displayLines.map((line, li) => (
                      <text
                        key={`ylabel-${ci}-${li}`}
                        x={labelX}
                        y={startY + li * lineH}
                        textAnchor={anchor}
                        style={{
                          fontSize: yTickStyle.fontSize,
                          fontFamily: yTickStyle.fontFamily,
                          fontWeight: fontWeightToCSS(yTickStyle.fontWeight),
                          fill: yTickStyle.color,
                        }}
                      >
                        {line}
                      </text>
                    ));
                  }
                  const display = settings.yAxis.fixedEllipsis ? truncateText(cat, maxW, yTickStyle.fontSize, yTickStyle.fontFamily, yTickStyle.fontWeight) : cat;
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
                        fill: yTickStyle.color,
                      }}
                    >
                      {display}
                    </text>
                  );
                }

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
                      fill: yTickStyle.color,
                    }}
                  >
                    {cat}
                  </text>
                );
              })()}

              {/* ── Data point labels ── */}
              {settings.labels.showDataPointLabels && rawValue !== 0 && (() => {
                const labelText = formatNumber(rawValue, nf);
                const barEndX = padding.left + barStartX + barW;

                let labelX: number;
                let anchor: 'start' | 'middle' | 'end';

                if (labelPos === 'left') {
                  labelX = padding.left + barStartX + 4;
                  anchor = 'start';
                } else if (labelPos === 'right') {
                  labelX = barEndX - 4;
                  anchor = 'end';
                } else if (labelPos === 'outside_right') {
                  // Connector + padding
                  const connectorSpace = connector.show
                    ? connector.paddingBar + connector.length + connector.paddingLabel
                    : 0;
                  labelX = barEndX + (settings.labels.outsideLabelPadding ?? 6) + connectorSpace;
                  anchor = 'start';
                } else {
                  labelX = padding.left + barStartX + barW / 2;
                  anchor = 'middle';
                }

                const labelColor = settings.labels.dataPointColorMode === 'auto'
                  ? (labelPos === 'outside_right' ? '#333333' : getContrastColor(barColor))
                  : (settings.labels.dataPointSeriesColors[columnMapping.values[0]] || settings.labels.dataPointColor);

                const labelCenterY = barY + barHeight / 2;

                return (
                  <>
                    {/* Connector border */}
                    {connector.show && labelPos === 'outside_right' && (() => {
                      const connStartX = barEndX + connector.paddingBar;
                      const connEndX = connStartX + connector.length;
                      let connY = labelCenterY;
                      if (connector.alignment === 'top') connY = barY + 2;
                      else if (connector.alignment === 'bottom') connY = barY + barHeight - 2;
                      return (
                        <line
                          x1={connStartX} y1={connY} x2={connEndX} y2={connY}
                          stroke={connector.color}
                          strokeWidth={connector.width}
                          strokeDasharray={getDashArray(connector.style, 4, connector.width)}
                        />
                      );
                    })()}

                    {/* Label text */}
                    <text
                      x={labelX}
                      y={labelCenterY}
                      dy="0.35em"
                      textAnchor={anchor}
                      style={{
                        fontSize: settings.labels.dataPointFontSize,
                        fontFamily: settings.labels.dataPointFontFamily,
                        fontWeight: fontWeightToCSS(settings.labels.dataPointFontWeight),
                        fontStyle: settings.labels.dataPointFontStyle || 'normal',
                        fill: labelColor,
                        pointerEvents: 'none',
                      }}
                    >
                      {labelText}
                    </text>

                    {/* Custom prefix */}
                    {prefix.show && (() => {
                      const labelW = measureTextWidth(labelText, settings.labels.dataPointFontSize, settings.labels.dataPointFontFamily, String(fontWeightToCSS(settings.labels.dataPointFontWeight)));
                      const prefixText = prefix.text;
                      const prefixFs = prefix.fontSize;
                      const prefixW = measureTextWidth(prefixText, prefixFs, settings.labels.dataPointFontFamily, prefix.fontWeight);
                      let prefixX: number;

                      if (prefix.position === 'left') {
                        if (anchor === 'start') prefixX = labelX - prefix.padding - prefixW;
                        else if (anchor === 'end') prefixX = labelX - labelW - prefix.padding - prefixW;
                        else prefixX = labelX - labelW / 2 - prefix.padding - prefixW;
                      } else {
                        if (anchor === 'start') prefixX = labelX + labelW + prefix.padding;
                        else if (anchor === 'end') prefixX = labelX + prefix.padding;
                        else prefixX = labelX + labelW / 2 + prefix.padding;
                      }

                      const vAlign = prefix.verticalAlign;
                      let prefixY = labelCenterY;
                      const paddingTopVal = prefix.paddingTop || 0;
                      const paddingBottomVal = prefix.paddingBottom || 0;
                      if (vAlign === 'top') {
                        prefixY = barY + prefixFs / 2 + paddingTopVal;
                      } else if (vAlign === 'bottom') {
                        prefixY = barY + barHeight - prefixFs / 2 - paddingBottomVal;
                      }

                      return (
                        <text
                          x={prefixX}
                          y={prefixY}
                          dy="0.35em"
                          textAnchor="start"
                          style={{
                            fontSize: prefixFs,
                            fontFamily: settings.labels.dataPointFontFamily,
                            fontWeight: fontWeightToCSS(prefix.fontWeight),
                            fill: prefix.color,
                            pointerEvents: 'none',
                          }}
                        >
                          {prefixText}
                        </text>
                      );
                    })()}
                  </>
                );
              })()}

              {/* ── Info column ── */}
              {info.show && infoText && (() => {
                const rowFs = info.perRowFontSizes[cat] ?? info.fontSize;
                const rowFf = info.perRowFontFamilies[cat] ?? info.fontFamily;
                const rowFw = info.perRowFontWeights[cat] ?? info.fontWeight;
                const rowColor = info.perRowColors[cat] ?? info.color;
                const rowLs = info.perRowLetterSpacings[cat] ?? info.letterSpacing;
                const rowPad = info.perRowPaddings[cat] ?? info.padding;

                let infoX: number;
                let infoAnchor: 'start' | 'end';

                if (info.position === 'left') {
                  infoX = padding.left - yAxisLabelWidth - tickPadding - rowPad;
                  infoAnchor = 'end';
                } else {
                  // Right side: after outside labels
                  infoX = padding.left + plotWidth + outsideLabelWidth + rowPad;
                  infoAnchor = 'start';
                }

                const infoCenterY = barY + barHeight / 2;
                const iconSize = info.icon.size;
                const iconSpace = info.icon.show ? iconSize + 4 : 0;
                const iconColor = info.icon.perRowColors[cat] ?? info.icon.defaultColor;
                const iconPath = LUCIDE_ICON_PATHS[info.icon.iconName] || LUCIDE_ICON_PATHS['circle'];

                return (
                  <>
                    {/* Info icon */}
                    {info.icon.show && (
                      <g transform={`translate(${infoAnchor === 'start' ? infoX : infoX - iconSize}, ${infoCenterY - iconSize / 2})`}>
                        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={info.icon.borderWidth} strokeLinecap="round" strokeLinejoin="round">
                          <path d={iconPath} />
                        </svg>
                      </g>
                    )}

                    {/* Info text */}
                    <text
                      x={infoAnchor === 'start' ? infoX + iconSpace : infoX - iconSpace}
                      y={infoCenterY}
                      dy="0.35em"
                      textAnchor={infoAnchor}
                      style={{
                        fontSize: rowFs,
                        fontFamily: rowFf,
                        fontWeight: fontWeightToCSS(rowFw),
                        fill: rowColor,
                        letterSpacing: rowLs > 0 ? `${rowLs}px` : undefined,
                        pointerEvents: 'none',
                      }}
                    >
                      {infoText}
                    </text>

                    {/* Info border (left side - between info and label) */}
                    {info.position === 'left' && info.borderLeft.show && (
                      <line
                        x1={padding.left - yAxisLabelWidth - tickPadding - 2}
                        y1={barY}
                        x2={padding.left - yAxisLabelWidth - tickPadding - 2}
                        y2={barY + barHeight}
                        stroke={info.borderLeft.color}
                        strokeWidth={info.borderLeft.width}
                        strokeDasharray={getDashArray(info.borderLeft.style, 4, info.borderLeft.width)}
                      />
                    )}

                    {/* Info border (right side - between data and info) */}
                    {info.position === 'right' && info.borderRight.show && (
                      <line
                        x1={padding.left + plotWidth + outsideLabelWidth + 2}
                        y1={barY}
                        x2={padding.left + plotWidth + outsideLabelWidth + 2}
                        y2={barY + barHeight}
                        stroke={info.borderRight.color}
                        strokeWidth={info.borderRight.width}
                        strokeDasharray={getDashArray(info.borderRight.style, 4, info.borderRight.width)}
                      />
                    )}
                  </>
                );
              })()}

              {/* ── Bar row border (divider below this row) ── */}
              {rowBorders.show && ci < categories.length - 1 && (() => {
                // Check if this row should have a border
                const shouldShow = rowBorders.mode === 'all' || rowBorders.customRows.includes(ci + 1);
                if (!shouldShow) return null;

                const gapStart = barY + barHeight;
                const gapEnd = chartTop + catYOffsets[ci + 1];
                let borderY: number;
                if (rowBorders.alignment === 'top') borderY = gapStart + 1;
                else if (rowBorders.alignment === 'bottom') borderY = gapEnd - 1;
                else borderY = (gapStart + gapEnd) / 2;

                return (
                  <line
                    x1={fullLeft}
                    y1={borderY}
                    x2={fullRight}
                    y2={borderY}
                    stroke={rowBorders.color}
                    strokeWidth={rowBorders.width}
                    strokeDasharray={getDashArray(rowBorders.style, rowBorders.dashLength, rowBorders.width)}
                  />
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: settings.popupsPanels.popupStyle === 'dark' ? '#333' : '#fff',
            color: settings.popupsPanels.popupStyle === 'dark' ? '#fff' : '#333',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.category}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: tooltip.color, flexShrink: 0 }} />
            <span>{formatNumber(tooltip.value, nf)}</span>
          </div>
          {tooltip.info && (
            <div style={{ marginTop: 2, opacity: 0.8 }}>{tooltip.info}</div>
          )}
        </div>
      )}
    </div>
  );
}
