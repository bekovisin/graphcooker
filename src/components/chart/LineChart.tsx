'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { getPaletteColors, extendColors } from '@/lib/chart/palettes';
import {
  line as d3Line,
  area as d3Area,
  curveLinear,
  curveCatmullRom,
  curveNatural,
  curveStep,
  curveStepBefore,
  curveStepAfter,
  CurveFactory,
} from 'd3-shape';

// ─── Types ────────────────────────────────────────────────────────────
interface SeriesData {
  name: string;
  points: (number | null)[];
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

interface LineChartProps {
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

function measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight: string): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

/** Word-wrap text into lines that fit within maxWidth px */
function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: string, maxLines: number): string[] {
  const words = text.split(/\s+/);
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const testWidth = measureTextWidth(testLine, fontSize, fontFamily, fontWeight);
    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }
  if (lines.length < maxLines) {
    lines.push(currentLine);
  }
  // Truncate last line with ellipsis if needed
  if (lines.length === maxLines && lines.length < words.length) {
    const lastLine = lines[maxLines - 1];
    const ellipsis = lastLine + '…';
    if (measureTextWidth(ellipsis, fontSize, fontFamily, fontWeight) > maxWidth) {
      lines[maxLines - 1] = lastLine.slice(0, -2) + '…';
    }
  }
  return lines.slice(0, maxLines);
}

function getCurveFactory(curve: string): CurveFactory {
  switch (curve) {
    case 'linear': return curveLinear;
    case 'catmullRom': return curveCatmullRom;
    case 'natural': return curveNatural;
    case 'step': return curveStep;
    case 'stepBefore': return curveStepBefore;
    case 'stepAfter': return curveStepAfter;
    default: return curveCatmullRom;
  }
}

/** Generate nice tick values for Y axis */
function generateNiceTicks(min: number, max: number, desiredCount = 5): number[] {
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
export function LineChart({
  data,
  columnMapping,
  settings,
  width,
  height: propHeight,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  columnOrder,
  seriesNames: seriesNameMap,
  skipAnimation,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, category: '', series: '', value: 0, color: '',
  });
  const [animProgress, setAnimProgress] = useState(skipAnimation ? 1 : 0);

  // Animation
  useEffect(() => {
    if (skipAnimation) { setAnimProgress(1); return; }
    if (!settings.animations.enabled) { setAnimProgress(1); return; }
    setAnimProgress(0);
    const duration = settings.animations.duration || 800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setAnimProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [skipAnimation, settings.animations.enabled, settings.animations.duration, data]);

  // Extract categories and series
  const categories = useMemo(() => {
    const labelCol = columnMapping.labels;
    if (!labelCol) return [];
    return data.map((row) => String(row[labelCol] ?? ''));
  }, [data, columnMapping.labels]);

  const valueColumns = useMemo(() => {
    return columnMapping.values || [];
  }, [columnMapping.values]);

  const colors = useMemo(() => resolveColors(settings.colors, valueColumns), [settings.colors, valueColumns]);

  const series: SeriesData[] = useMemo(() => {
    return valueColumns.map((col, i) => ({
      name: seriesNameMap?.[col] || col,
      points: data.map((row) => {
        const v = row[col];
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      }),
      color: colors[i],
    }));
  }, [valueColumns, data, colors, seriesNameMap]);

  // Settings aliases
  const lineSettings = settings.lineDotsAreas;
  const labelSettings = settings.labels;
  const nf = settings.numberFormatting;
  const plotBg = settings.plotBackground;
  const legendSettings = settings.legend;
  const xAxisSettings = settings.xAxis;
  const yAxisSettings = settings.yAxis;

  // Y axis custom decimals
  const yAxisDecimals = nf.yAxisCustomDecimals ? nf.yAxisDecimalPlaces : undefined;

  // Compute Y range
  const { yMin, yMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
      for (const v of s.points) {
        if (v !== null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (min === Infinity) { min = 0; max = 100; }
    if (min === max) { min -= 1; max += 1; }

    // User overrides from Scale section (min/max inputs)
    const userMin = yAxisSettings.min ? Number(yAxisSettings.min) : undefined;
    const userMax = yAxisSettings.max ? Number(yAxisSettings.max) : undefined;
    if (userMin !== undefined && !isNaN(userMin)) min = userMin;
    if (userMax !== undefined && !isNaN(userMax)) max = userMax;

    // Custom ticks mode: use start/end as the Y range
    const tickMode = yAxisSettings.ticksToShowMode ?? 'auto';
    if (tickMode === 'custom') {
      const hasCustomStart = yAxisSettings.customTickStart !== undefined && yAxisSettings.customTickStart !== 0;
      const hasCustomEnd = yAxisSettings.customTickEnd !== undefined && yAxisSettings.customTickEnd !== 0;
      if (hasCustomStart) min = yAxisSettings.customTickStart!;
      if (hasCustomEnd) max = yAxisSettings.customTickEnd!;
    }

    // Edge padding (only apply when range is not fully user-defined)
    const edgePad = (yAxisSettings.edgePadding ?? 10) / 100;
    const range = max - min;
    const hasAnyUserMin = (userMin !== undefined && !isNaN(userMin)) || (tickMode === 'custom' && yAxisSettings.customTickStart);
    const hasAnyUserMax = (userMax !== undefined && !isNaN(userMax)) || (tickMode === 'custom' && yAxisSettings.customTickEnd);
    if (!hasAnyUserMin) min -= range * edgePad;
    if (!hasAnyUserMax) max += range * edgePad;

    return { yMin: min, yMax: max };
  }, [series, yAxisSettings.min, yAxisSettings.max, yAxisSettings.edgePadding, yAxisSettings.ticksToShowMode, yAxisSettings.customTickStart, yAxisSettings.customTickEnd]);

  // Y tick values — support auto/number/custom modes
  const yAxisVisible = yAxisSettings.position !== 'hidden';
  const yTickFontMemo = useMemo(() => {
    return yAxisSettings.tickStyling || { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 'normal', color: '#666666' };
  }, [yAxisSettings.tickStyling]);

  const yTickValues = useMemo(() => {
    const tickMode = yAxisSettings.ticksToShowMode ?? 'auto';
    const realMin = yAxisSettings.flipAxis ? yMax : yMin;
    const realMax = yAxisSettings.flipAxis ? yMin : yMax;
    const lo = Math.min(realMin, realMax);
    const hi = Math.max(realMin, realMax);

    let ticks: number[];
    if (tickMode === 'number') {
      ticks = generateNiceTicks(lo, hi, yAxisSettings.ticksToShowNumber ?? 6);
    } else if (tickMode === 'custom') {
      // Custom mode: user-defined interval with optional start/end values
      const step = yAxisSettings.ticksToShowNumber ?? 10;
      const hasCustomStart = yAxisSettings.customTickStart !== undefined && yAxisSettings.customTickStart !== 0;
      const hasCustomEnd = yAxisSettings.customTickEnd !== undefined && yAxisSettings.customTickEnd !== 0;
      const customLo = hasCustomStart ? yAxisSettings.customTickStart! : lo;
      const customHi = hasCustomEnd ? yAxisSettings.customTickEnd! : hi;
      ticks = generateCustomStepTicks(
        Math.min(customLo, customHi),
        Math.max(customLo, customHi),
        step,
      );
    } else {
      ticks = generateNiceTicks(lo, hi, 6);
    }
    // Filter to actual visible range (use custom range if set in custom mode)
    const filterLo = tickMode === 'custom' && yAxisSettings.customTickStart
      ? Math.min(yAxisSettings.customTickStart, yAxisSettings.customTickEnd ?? hi)
      : lo;
    const filterHi = tickMode === 'custom' && yAxisSettings.customTickEnd
      ? Math.max(yAxisSettings.customTickStart ?? lo, yAxisSettings.customTickEnd)
      : hi;
    return ticks.filter((t) => t >= filterLo - 1e-9 && t <= filterHi + 1e-9);
  }, [yMin, yMax, yAxisSettings.flipAxis, yAxisSettings.ticksToShowMode, yAxisSettings.ticksToShowNumber, yAxisSettings.customTickStart, yAxisSettings.customTickEnd]);

  const yAxisWidth = useMemo(() => {
    if (!yAxisVisible) return 0;
    if (yAxisSettings.spaceMode === 'fixed') return yAxisSettings.spaceModeValue;
    let maxW = 0;
    for (const v of yTickValues) {
      const txt = formatNumber(v, nf, yAxisDecimals);
      const w = measureTextWidth(txt, yTickFontMemo.fontSize, yTickFontMemo.fontFamily, yTickFontMemo.fontWeight);
      if (w > maxW) maxW = w;
    }
    return maxW + 12;
  }, [yAxisVisible, yAxisSettings.spaceMode, yAxisSettings.spaceModeValue, yTickValues, nf, yAxisDecimals, yTickFontMemo]);

  // X axis
  const xAxisHidden = xAxisSettings.position === 'hidden';
  const xTickStyle = useMemo(() => {
    return xAxisSettings.tickStyling || { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 'normal', color: '#666666' };
  }, [xAxisSettings.tickStyling]);

  // X axis label visibility (tick label count mode + hidden labels)
  const visibleCategories = useMemo(() => {
    const hiddenSet = new Set(xAxisSettings.hiddenTickLabels || []);
    let indices = categories.map((_, i) => i);

    // Custom label count: evenly reduce visible labels
    if (xAxisSettings.tickLabelCountMode === 'custom' && xAxisSettings.tickLabelCount > 0 && xAxisSettings.tickLabelCount < categories.length) {
      const count = xAxisSettings.tickLabelCount;
      const step = (categories.length - 1) / (count - 1);
      const visibleIndicesSet = new Set<number>();
      for (let i = 0; i < count; i++) {
        visibleIndicesSet.add(Math.round(i * step));
      }
      indices = indices.filter((i) => visibleIndicesSet.has(i));
    }

    // Filter out individually hidden labels
    if (hiddenSet.size > 0) {
      indices = indices.filter((i) => !hiddenSet.has(categories[i]));
    }

    return indices;
  }, [categories, xAxisSettings.tickLabelCountMode, xAxisSettings.tickLabelCount, xAxisSettings.hiddenTickLabels]);

  // X axis ticks to show
  const xTicksToShow = useMemo(() => {
    if (xAxisSettings.ticksToShowMode === 'custom' && xAxisSettings.tickStep > 0) {
      const step = xAxisSettings.tickStep;
      return categories.map((_, i) => i).filter((i) => i % step === 0);
    }
    return visibleCategories;
  }, [xAxisSettings.ticksToShowMode, xAxisSettings.tickStep, visibleCategories, categories]);

  // X axis tick angle and height computation
  const tickAngle = xAxisSettings.tickAngle || 0;
  const hasAngle = tickAngle !== 0;
  const labelAxisPad = xAxisSettings.labelAxisPadding || 0;

  const xAxisHeight = useMemo(() => {
    if (xAxisHidden) return 0;
    if (!hasAngle) return xTickStyle.fontSize + 10 + labelAxisPad;
    const maxLabel = categories.reduce((longest, cat) => cat.length > longest.length ? cat : longest, '');
    const maxW = measureTextWidth(maxLabel, xTickStyle.fontSize, xTickStyle.fontFamily, xTickStyle.fontWeight);
    const rad = Math.abs(tickAngle) * (Math.PI / 180);
    return Math.ceil(maxW * Math.sin(rad) + xTickStyle.fontSize * Math.cos(rad)) + 10 + labelAxisPad;
  }, [xAxisHidden, hasAngle, tickAngle, categories, xTickStyle, labelAxisPad]);

  // X axis title height
  const xAxisTitleHeight = xAxisSettings.titleType === 'custom' && xAxisSettings.titleText ? xAxisSettings.titleStyling.fontSize + 10 : 0;

  // Legend
  const legendHeight = legendSettings.show && legendSettings.position !== 'overlay' ? 30 + legendSettings.marginTop : 0;

  // Layout padding
  const padding = {
    top: (settings.layout.paddingTop || 0) + 10,
    right: (settings.layout.paddingRight || 0) + 10,
    bottom: (settings.layout.paddingBottom || 0) + 10,
    left: (settings.layout.paddingLeft || 0) + 10,
  };

  // Extra padding for first/last data points to prevent clipping
  const dotRadius = lineSettings.dotRadius * 10;
  const finalDotRadius = dotRadius * (lineSettings.finalDotScale / 100);
  const maxDotR = Math.max(dotRadius, finalDotRadius, 4);
  // Line label right margin
  const lineLabelSpaceMode = labelSettings.lineLabelSpaceMode ?? 'auto';
  const lineLabelRightMargin = (labelSettings.showLineLabels ?? true)
    ? (lineLabelSpaceMode === 'fixed' ? (labelSettings.lineLabelSpaceValue ?? 80) : (labelSettings.lineLabelMaxWidth ?? 4) * 12)
    : 0;

  // Chart area margins
  const marginLeft = padding.left + (yAxisSettings.position === 'left' ? yAxisWidth : 0) + maxDotR;
  const marginRight = padding.right + (yAxisSettings.position === 'right' ? yAxisWidth : 0) + lineLabelRightMargin + maxDotR;
  const marginTop = padding.top + (legendSettings.position === 'above' ? legendHeight : 0) + maxDotR;
  const marginBottom = padding.bottom + xAxisHeight + xAxisTitleHeight + (legendSettings.position === 'below' ? legendHeight : 0) + maxDotR;

  const chartWidth = Math.max(100, width - marginLeft - marginRight);
  const computedHeight = propHeight || Math.max(200, chartWidth * 0.5);
  const chartHeight = Math.max(100, computedHeight - marginTop - marginBottom);
  const svgHeight = computedHeight;

  // X axis data area start/end padding
  const xStartPad = xAxisSettings.startPadding || 0;
  const xEndPad = xAxisSettings.endPadding || 0;

  // Scale functions — apply start/end padding to compress data range
  const xScale = useCallback((i: number) => {
    const usableWidth = chartWidth - xStartPad - xEndPad;
    if (categories.length <= 1) return xStartPad + usableWidth / 2;
    return xStartPad + (i / (categories.length - 1)) * usableWidth;
  }, [categories.length, chartWidth, xStartPad, xEndPad]);

  const yScale = useCallback((v: number) => {
    const min = yAxisSettings.flipAxis ? yMax : yMin;
    const max = yAxisSettings.flipAxis ? yMin : yMax;
    const range = max - min;
    if (range === 0) return chartHeight / 2;
    return chartHeight - ((v - min) / range) * chartHeight;
  }, [yMin, yMax, yAxisSettings.flipAxis, chartHeight]);

  // Build line paths
  const curveFactory = getCurveFactory(lineSettings.lineCurve);

  const linePaths = useMemo(() => {
    return series.map((s) => {
      const segments: [number, number][][] = [];
      let current: [number, number][] = [];

      s.points.forEach((val, i) => {
        if (val === null) {
          if (lineSettings.missingDataMode === 'gaps') {
            if (current.length > 0) { segments.push(current); current = []; }
          }
        } else {
          current.push([xScale(i), yScale(val * animProgress)]);
        }
      });
      if (current.length > 0) segments.push(current);

      const lineGen = d3Line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(curveFactory);

      return segments.map((seg) => lineGen(seg) || '');
    });
  }, [series, xScale, yScale, curveFactory, lineSettings.missingDataMode, animProgress]);

  // Shade between lines (area fills)
  const shadePaths = useMemo(() => {
    if (!lineSettings.shadeBetweenLines || series.length < 2) return [];
    const areas: { path: string; color: string }[] = [];
    for (let i = 0; i < series.length - 1; i++) {
      const s0 = series[i];
      const s1 = series[i + 1];
      const areaGen = d3Area<number>()
        .x((_, idx) => xScale(idx))
        .y0((_, idx) => {
          const v = s0.points[idx];
          return v !== null ? yScale(v * animProgress) : yScale(0);
        })
        .y1((_, idx) => {
          const v = s1.points[idx];
          return v !== null ? yScale(v * animProgress) : yScale(0);
        })
        .curve(curveFactory);

      const indices = Array.from({ length: categories.length }, (_, i) => i);
      const p = areaGen(indices) || '';
      areas.push({ path: p, color: s0.color });
    }
    return areas;
  }, [lineSettings.shadeBetweenLines, series, xScale, yScale, curveFactory, categories.length, animProgress]);

  // Tooltip handlers
  const handleDotEnter = useCallback((e: React.MouseEvent, cat: string, ser: string, val: number, col: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      category: cat,
      series: ser,
      value: val,
      color: col,
    });
  }, []);

  const handleDotLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Determine which dots to show
  const showDots = useMemo(() => {
    const mode = lineSettings.dotMode;
    if (mode === 'off') return 'none' as const;
    if (mode === 'on') return 'all' as const;
    if (mode === 'final_only') return 'final' as const;
    return categories.length <= 15 ? 'all' as const : 'final' as const;
  }, [lineSettings.dotMode, categories.length]);

  // Gridlines
  const showGridlines = yAxisSettings.gridlines;
  const gridlineStyle = yAxisSettings.gridlineStyle ?? 'solid';

  // X axis tick marks
  const tickMarksShow = xAxisSettings.tickMarks.show && !xAxisHidden;

  // Unique clip ID per instance
  const clipId = useMemo(() => `line-chart-clip-${Math.random().toString(36).slice(2, 9)}`, []);

  // Render
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={svgHeight}
        style={{ overflow: 'hidden' }}
      >
        {/* Plot background */}
        <rect
          x={marginLeft}
          y={marginTop}
          width={chartWidth}
          height={chartHeight}
          fill={plotBg.backgroundColor}
          fillOpacity={plotBg.backgroundOpacity / 100}
        />
        {plotBg.border && (
          <rect
            x={marginLeft}
            y={marginTop}
            width={chartWidth}
            height={chartHeight}
            fill="none"
            stroke={plotBg.borderColor}
            strokeWidth={plotBg.borderWidth}
          />
        )}

        {/* Y axis gridlines — extend into Y label area when above/below position */}
        {showGridlines && yTickValues.map((v, i) => {
          const y = marginTop + yScale(v);
          const tickPos = yAxisSettings.tickPosition || 'default';
          const extendsLeft = (tickPos === 'left' || tickPos === 'right') && yAxisSettings.position === 'left';
          const extendsRight = (tickPos === 'left' || tickPos === 'right') && yAxisSettings.position === 'right';
          const gridX1 = extendsLeft ? marginLeft - yAxisWidth : marginLeft;
          const gridX2 = extendsRight ? marginLeft + chartWidth + yAxisWidth : marginLeft + chartWidth;
          return (
            <line
              key={`grid-${i}`}
              x1={gridX1}
              y1={y}
              x2={gridX2}
              y2={y}
              stroke={yAxisSettings.gridlineStyling.color}
              strokeWidth={yAxisSettings.gridlineStyling.width}
              strokeDasharray={
                gridlineStyle === 'dashed' ? '6 3' :
                gridlineStyle === 'dotted' ? '2 2' : undefined
              }
            />
          );
        })}

        {/* Y axis */}
        {yAxisVisible && (
          <g>
            {/* Axis line */}
            {yAxisSettings.axisLine?.show !== false && (
              <line
                x1={yAxisSettings.position === 'right' ? marginLeft + chartWidth : marginLeft}
                y1={marginTop}
                x2={yAxisSettings.position === 'right' ? marginLeft + chartWidth : marginLeft}
                y2={marginTop + chartHeight}
                stroke={yAxisSettings.axisLine?.color || '#666666'}
                strokeWidth={yAxisSettings.axisLine?.width || 1}
              />
            )}
            {/* Tick labels */}
            {yTickValues.map((v, i) => {
              const y = marginTop + yScale(v);
              const txt = formatNumber(v, nf, yAxisDecimals);

              // tickPosition: 'left' = above the gridline, 'right' = below the gridline, 'default' = centered
              const tickPos = yAxisSettings.tickPosition || 'default';
              const tickPad = yAxisSettings.tickPadding || 0;
              let labelY = y;
              let baseline: 'auto' | 'central' | 'hanging' = 'central';
              if (tickPos === 'left') {
                // Above: text bottom edge sits at gridline level, shifted up by padding
                labelY = y - (tickPad + 2);
                baseline = 'auto';
              } else if (tickPos === 'right') {
                // Below: text top edge sits at gridline level, shifted down by padding
                labelY = y + (tickPad + 2);
                baseline = 'hanging';
              } else {
                // Default centered, apply tickPadding as vertical offset
                labelY = y + tickPad;
              }

              const xPos = yAxisSettings.position === 'right'
                ? marginLeft + chartWidth + 8
                : marginLeft - 8;
              const anchor = yAxisSettings.position === 'right' ? 'start' : 'end';

              return (
                <text
                  key={`ytick-${i}`}
                  x={xPos}
                  y={labelY}
                  textAnchor={anchor}
                  dominantBaseline={baseline}
                  fill={yTickFontMemo.color}
                  fontSize={yTickFontMemo.fontSize}
                  fontFamily={yTickFontMemo.fontFamily}
                  fontWeight={yAxisSettings.labelWeight === 'bold' ? 'bold' : yTickFontMemo.fontWeight}
                >
                  {txt}
                </text>
              );
            })}
          </g>
        )}

        {/* Y axis title */}
        {yAxisSettings.titleType === 'custom' && yAxisSettings.titleText && (
          <text
            x={yAxisSettings.position === 'right'
              ? marginLeft + chartWidth + yAxisWidth - 4
              : marginLeft - yAxisWidth + 4}
            y={marginTop + chartHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(-90, ${
              yAxisSettings.position === 'right'
                ? marginLeft + chartWidth + yAxisWidth - 4
                : marginLeft - yAxisWidth + 4
            }, ${marginTop + chartHeight / 2})`}
            fill={yAxisSettings.titleStyling.color}
            fontSize={yAxisSettings.titleStyling.fontSize}
            fontFamily={yAxisSettings.titleStyling.fontFamily}
            fontWeight={yAxisSettings.titleStyling.fontWeight}
          >
            {yAxisSettings.titleText}
          </text>
        )}

        {/* X axis */}
        {!xAxisHidden && (
          <g>
            {/* Axis line — extend into Y label area when above/below position */}
            {xAxisSettings.axisLine?.show !== false && (() => {
              const tickPos = yAxisSettings.tickPosition || 'default';
              const extendsLeft = (tickPos === 'left' || tickPos === 'right') && yAxisSettings.position === 'left';
              const extendsRight = (tickPos === 'left' || tickPos === 'right') && yAxisSettings.position === 'right';
              const axisX1 = extendsLeft ? marginLeft - yAxisWidth : marginLeft;
              const axisX2 = extendsRight ? marginLeft + chartWidth + yAxisWidth : marginLeft + chartWidth;
              return (
                <line
                  x1={axisX1}
                  y1={marginTop + chartHeight}
                  x2={axisX2}
                  y2={marginTop + chartHeight}
                  stroke={xAxisSettings.axisLine?.color || '#666666'}
                  strokeWidth={xAxisSettings.axisLine?.width || 1}
                />
              );
            })()}
            {/* Category labels + tick marks */}
            {xTicksToShow.map((catIdx) => {
              const x = marginLeft + xScale(catIdx);
              const cat = categories[catIdx];
              const isFirst = catIdx === 0;
              const isLast = catIdx === categories.length - 1;

              // First/last label padding
              const firstPad = isFirst ? (xAxisSettings.firstLabelPadding || 0) : 0;
              const lastPad = isLast ? -(xAxisSettings.lastLabelPadding || 0) : 0;
              const labelPad = firstPad + lastPad;

              // First/last tick padding
              const firstTickPad = isFirst ? (xAxisSettings.firstTickPadding || 0) : 0;
              const lastTickPad = isLast ? -(xAxisSettings.lastTickPadding || 0) : 0;
              const tickPadOffset = firstTickPad + lastTickPad;

              // Tick mark positions
              const tickLen = xAxisSettings.tickMarks.length;
              const tickMarkPos = xAxisSettings.tickMarks.position || 'outside';
              const baseY = marginTop + chartHeight;
              let tmY1 = baseY;
              let tmY2 = baseY + tickLen;
              if (tickMarkPos === 'inside') {
                tmY1 = baseY - tickLen;
                tmY2 = baseY;
              } else if (tickMarkPos === 'cross') {
                tmY1 = baseY - tickLen / 2;
                tmY2 = baseY + tickLen / 2;
              }

              // Label position
              const labelY = baseY + (tickMarksShow ? tickLen : 0) + xTickStyle.fontSize + 4 + labelAxisPad;

              return (
                <g key={`xcat-${catIdx}`}>
                  {/* Tick mark */}
                  {tickMarksShow && (
                    <line
                      x1={x + tickPadOffset}
                      y1={tmY1}
                      x2={x + tickPadOffset}
                      y2={tmY2}
                      stroke={xAxisSettings.tickMarks.color}
                      strokeWidth={xAxisSettings.tickMarks.width}
                    />
                  )}
                  {/* Label */}
                  <text
                    x={x + labelPad}
                    y={hasAngle
                      ? baseY + (tickMarksShow ? tickLen : 0) + 4 + labelAxisPad
                      : labelY
                    }
                    textAnchor={hasAngle ? (tickAngle > 0 ? 'start' : 'end') : 'middle'}
                    dominantBaseline={hasAngle ? 'hanging' : 'auto'}
                    transform={hasAngle
                      ? `rotate(${tickAngle}, ${x + labelPad}, ${baseY + (tickMarksShow ? tickLen : 0) + 4 + labelAxisPad})`
                      : undefined
                    }
                    fill={xTickStyle.color}
                    fontSize={xTickStyle.fontSize}
                    fontFamily={xTickStyle.fontFamily}
                    fontWeight={xTickStyle.fontWeight}
                  >
                    {cat}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* X axis title */}
        {xAxisSettings.titleType === 'custom' && xAxisSettings.titleText && (
          <text
            x={marginLeft + chartWidth / 2}
            y={marginTop + chartHeight + xAxisHeight + xAxisTitleHeight - 2}
            textAnchor="middle"
            fill={xAxisSettings.titleStyling.color}
            fontSize={xAxisSettings.titleStyling.fontSize}
            fontFamily={xAxisSettings.titleStyling.fontFamily}
            fontWeight={xAxisSettings.titleStyling.fontWeight}
          >
            {xAxisSettings.titleText}
          </text>
        )}

        {/* Chart area clip — expanded by dot radius to prevent clipping at edges */}
        <defs>
          <clipPath id={clipId}>
            <rect
              x={-maxDotR - 2}
              y={-maxDotR - 2}
              width={chartWidth + maxDotR * 2 + 4}
              height={chartHeight + maxDotR * 2 + 4}
            />
          </clipPath>
        </defs>

        {/* Main chart group */}
        <g transform={`translate(${marginLeft}, ${marginTop})`} clipPath={`url(#${clipId})`}>
          {/* Shade between lines */}
          {shadePaths.map((area, i) => (
            <path
              key={`shade-${i}`}
              d={area.path}
              fill={area.color}
              fillOpacity={0.15}
            />
          ))}

          {/* Lines */}
          {series.map((s, si) => (
            <g key={`line-${si}`}>
              {/* Line outline (behind) */}
              {lineSettings.lineOutline && linePaths[si].map((pathD, pi) => (
                <path
                  key={`outline-${si}-${pi}`}
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={lineSettings.lineWidth * 10 + 3}
                  strokeOpacity={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'none' }}
                />
              ))}
              {/* Main line */}
              {linePaths[si].map((pathD, pi) => (
                <path
                  key={`line-${si}-${pi}`}
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={lineSettings.lineWidth * 10}
                  strokeOpacity={lineSettings.lineOpacity * animProgress}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={lineSettings.dashedLines ? `${lineSettings.dashWidth} ${lineSettings.dashSpaceWidth}` : undefined}
                />
              ))}
            </g>
          ))}

          {/* Dots */}
          {showDots !== 'none' && series.map((s, si) => (
            <g key={`dots-${si}`}>
              {s.points.map((val, pi) => {
                if (val === null) return null;
                if (showDots === 'final' && pi !== s.points.length - 1) {
                  const isLastNonNull = s.points.slice(pi + 1).every((v) => v === null);
                  if (!isLastNonNull) return null;
                }

                const cx = xScale(pi);
                const cy = yScale(val * animProgress);
                const baseRadius = lineSettings.dotRadius * 10;
                const isFinalDot = pi === s.points.length - 1 || s.points.slice(pi + 1).every((v) => v === null);
                const radius = isFinalDot ? baseRadius * (lineSettings.finalDotScale / 100) : baseRadius;

                return (
                  <circle
                    key={`dot-${si}-${pi}`}
                    cx={cx}
                    cy={cy}
                    r={Math.max(0.5, radius)}
                    fill={lineSettings.dotHollow ? 'white' : s.color}
                    stroke={s.color}
                    strokeWidth={lineSettings.dotHollow ? 2 : 0}
                    fillOpacity={lineSettings.dotOpacity}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => handleDotEnter(e, categories[pi], s.name, val, s.color)}
                    onMouseLeave={handleDotLeave}
                  />
                );
              })}
            </g>
          ))}

          {/* Data point labels */}
          {labelSettings.showDataPointLabels && series.map((s, si) => (
            <g key={`dp-label-${si}`}>
              {s.points.map((val, pi) => {
                if (val === null) return null;

                const showMode = labelSettings.dataPointShowMode ?? 'all';
                if (showMode === 'last') {
                  const isLast = pi === s.points.length - 1 || s.points.slice(pi + 1).every((v) => v === null);
                  if (!isLast) return null;
                }
                if (showMode === 'min_max') {
                  const validVals = s.points.filter((v): v is number => v !== null);
                  const minVal = Math.min(...validVals);
                  const maxVal = Math.max(...validVals);
                  if (val !== minVal && val !== maxVal) return null;
                }

                const cx = xScale(pi);
                const cy = yScale(val * animProgress);

                let position: 'above' | 'below' = (labelSettings.lineDataPointPosition as 'above' | 'below') ?? 'above';
                if (labelSettings.lineDataPointPosition === 'custom') {
                  const customMode = labelSettings.lineDataPointCustomMode ?? 'column';
                  if (customMode === 'row') {
                    // Row mode: each row has per-series positions
                    const rowName = categories[pi];
                    const rowMap = labelSettings.lineDataPointRowPositions?.[rowName];
                    if (rowMap && typeof rowMap === 'object' && typeof rowMap !== 'string') {
                      const colName = valueColumns[si];
                      position = (rowMap as Record<string, 'above' | 'below'>)[colName] ?? 'above';
                    }
                  } else {
                    // Column mode: per-series positions
                    const colName = valueColumns[si];
                    const colPos = labelSettings.lineDataPointSeriesPositions?.[colName];
                    position = colPos ?? 'above';
                  }
                }

                const labelText = formatNumber(val, nf);

                // Compute actual dot radius for this point to offset the label
                const baseR = lineSettings.dotRadius * 10;
                const isFinal = pi === s.points.length - 1 || s.points.slice(pi + 1).every((v) => v === null);
                const actualDotR = showDots !== 'none'
                  ? (isFinal ? baseR * (lineSettings.finalDotScale / 100) : baseR)
                  : 0;
                const labelGap = 4; // px gap between dot edge and label
                const offset = position === 'above'
                  ? -(actualDotR + labelGap)
                  : (actualDotR + labelGap);

                const customPadding = labelSettings.dataPointCustomPadding;
                const padTop = customPadding ? (labelSettings.dataPointPaddingTop || 0) : 0;
                const padLeft = customPadding ? (labelSettings.dataPointPaddingLeft || 0) : 0;

                // Resolve color based on lineDataPointColorMode
                const colorMode = labelSettings.lineDataPointColorMode ?? 'auto';
                let labelColor = '#333333';
                if (colorMode === 'match_data') {
                  labelColor = s.color;
                } else if (colorMode === 'fixed') {
                  labelColor = labelSettings.lineDataPointColorFixed || '#333333';
                } else if (colorMode === 'custom') {
                  const colName = valueColumns[si];
                  labelColor = labelSettings.lineDataPointSeriesColors?.[colName] || labelSettings.lineDataPointColorFixed || '#333333';
                }

                return (
                  <text
                    key={`dp-${si}-${pi}`}
                    x={cx + padLeft}
                    y={cy + offset + padTop}
                    textAnchor="middle"
                    dominantBaseline={position === 'above' ? 'auto' : 'hanging'}
                    fill={labelColor}
                    fontSize={(labelSettings.dataPointSizeFixed ?? 1.2) * 10}
                    fontWeight={labelSettings.dataPointFontWeight || 'normal'}
                    fontFamily={labelSettings.dataPointFontFamily || 'Inter, sans-serif'}
                    fontStyle={labelSettings.dataPointFontStyle || 'normal'}
                    opacity={animProgress}
                  >
                    {labelText}
                  </text>
                );
              })}
            </g>
          ))}
        </g>

        {/* Line labels (at end of each series) — outside clip */}
        {(labelSettings.showLineLabels ?? true) && series.map((s, si) => {
          let lastIdx = -1;
          let lastVal: number | null = null;
          for (let i = s.points.length - 1; i >= 0; i--) {
            if (s.points[i] !== null) { lastIdx = i; lastVal = s.points[i]; break; }
          }
          if (lastIdx === -1 || lastVal === null) return null;

          const cx = marginLeft + xScale(lastIdx);
          const cy = marginTop + yScale(lastVal * animProgress);
          const labelX = cx + (labelSettings.lineLabelDistance ?? 0.9) * 10;
          const llFontSize = (labelSettings.lineLabelSize ?? 0.7) * 14;
          const llFontWeight = labelSettings.lineLabelWeight ?? 'bold';
          const llFontFamily = 'Inter, sans-serif';
          const llMaxLines = labelSettings.lineLabelMaxLines ?? 3;
          const llLineHeight = (labelSettings.lineLabelLineHeight ?? 1) * llFontSize;
          const llMaxWidth = lineLabelSpaceMode === 'fixed'
            ? (labelSettings.lineLabelSpaceValue ?? 80)
            : (labelSettings.lineLabelMaxWidth ?? 4) * 12;

          const lines = wrapText(s.name, llMaxWidth, llFontSize, llFontFamily, llFontWeight, llMaxLines);
          const totalHeight = lines.length * llLineHeight;
          const startY = cy - totalHeight / 2 + llFontSize / 2;

          return (
            <text
              key={`ll-${si}`}
              x={labelX}
              textAnchor="start"
              fill={labelSettings.lineLabelColor ?? '#333333'}
              fontSize={llFontSize}
              fontWeight={llFontWeight}
              opacity={animProgress}
              style={{
                paintOrder: 'stroke',
                stroke: labelSettings.lineLabelOutline ?? '#ffffff',
                strokeWidth: (labelSettings.lineLabelOutlineWidth ?? 25) / 10,
                strokeLinejoin: 'round',
              }}
            >
              {lines.map((line, li) => (
                <tspan
                  key={li}
                  x={labelX}
                  y={startY + li * llLineHeight}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}

        {/* Legend */}
        {legendSettings.show && (
          <g transform={`translate(${marginLeft}, ${
            legendSettings.position === 'above'
              ? padding.top + legendSettings.marginTop
              : marginTop + chartHeight + xAxisHeight + xAxisTitleHeight + 8 + legendSettings.marginTop
          })`}>
            {series.map((s, i) => {
              const xOff = i * (measureTextWidth(s.name, legendSettings.size, legendSettings.fontFamily, legendSettings.textWeight) + legendSettings.swatchWidth + legendSettings.swatchPadding + 16);
              return (
                <g key={`legend-${i}`} transform={`translate(${xOff}, 0)`}>
                  <rect
                    x={0}
                    y={-legendSettings.swatchHeight / 2}
                    width={legendSettings.swatchWidth}
                    height={legendSettings.swatchHeight}
                    rx={legendSettings.swatchRoundness}
                    fill={s.color}
                    stroke={legendSettings.outline ? '#666666' : 'none'}
                    strokeWidth={0.5}
                  />
                  <text
                    x={legendSettings.swatchWidth + legendSettings.swatchPadding}
                    y={0}
                    dominantBaseline="central"
                    fill={legendSettings.color}
                    fontSize={legendSettings.size}
                    fontFamily={legendSettings.fontFamily}
                    fontWeight={legendSettings.textWeight}
                    fontStyle={legendSettings.textStyle}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {settings.popupsPanels.showPopup && tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            background: settings.popupsPanels.popupStyle === 'dark' ? '#1f2937' : '#ffffff',
            color: settings.popupsPanels.popupStyle === 'dark' ? '#ffffff' : '#333333',
            border: `1px solid ${settings.popupsPanels.popupStyle === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: tooltip.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600 }}>{tooltip.series}</span>
          </div>
          <div style={{ marginTop: 2 }}>
            {tooltip.category}: {formatNumber(tooltip.value, nf)}
          </div>
        </div>
      )}
    </div>
  );
}
