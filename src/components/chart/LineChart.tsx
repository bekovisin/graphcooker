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

    // User overrides
    const userMin = settings.yAxis.min ? Number(settings.yAxis.min) : undefined;
    const userMax = settings.yAxis.max ? Number(settings.yAxis.max) : undefined;
    if (userMin !== undefined && !isNaN(userMin)) min = userMin;
    if (userMax !== undefined && !isNaN(userMax)) max = userMax;

    // Edge padding
    const edgePad = (settings.yAxis.edgePadding ?? 10) / 100;
    const range = max - min;
    if (userMin === undefined) min -= range * edgePad;
    if (userMax === undefined) max += range * edgePad;

    // Flip
    if (settings.yAxis.flipAxis) {
      return { yMin: max, yMax: min };
    }
    return { yMin: min, yMax: max };
  }, [series, settings.yAxis]);

  // Settings aliases
  const lineSettings = settings.lineDotsAreas;
  const labelSettings = settings.labels;
  const nf = settings.numberFormatting;
  const plotBg = settings.plotBackground;
  const legendSettings = settings.legend;
  const xAxisSettings = settings.xAxis;
  const yAxisSettings = settings.yAxis;

  // Layout
  const padding = {
    top: (settings.layout.paddingTop || 0) + 10,
    right: (settings.layout.paddingRight || 0) + 10,
    bottom: (settings.layout.paddingBottom || 0) + 10,
    left: (settings.layout.paddingLeft || 0) + 10,
  };

  // Y axis label width
  const yAxisVisible = yAxisSettings.position !== 'hidden';
  const yTickFont = yAxisSettings.tickStyling || { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 'normal', color: '#666666' };
  const tickCount = yAxisSettings.ticksToShowNumber ?? 6;

  const yTickValues = useMemo(() => {
    const count = tickCount;
    const ticks: number[] = [];
    const range = yMax - yMin;
    for (let i = 0; i < count; i++) {
      ticks.push(yMin + (range * i) / (count - 1));
    }
    return ticks;
  }, [yMin, yMax, tickCount]);

  const yAxisWidth = useMemo(() => {
    if (!yAxisVisible) return 0;
    if (yAxisSettings.spaceMode === 'fixed') return yAxisSettings.spaceModeValue;
    let maxW = 0;
    for (const v of yTickValues) {
      const txt = formatNumber(v, nf);
      const w = measureTextWidth(txt, yTickFont.fontSize, yTickFont.fontFamily, yTickFont.fontWeight);
      if (w > maxW) maxW = w;
    }
    return maxW + 12;
  }, [yAxisVisible, yAxisSettings.spaceMode, yAxisSettings.spaceModeValue, yTickValues, nf, yTickFont]);

  // X axis
  const xAxisHeight = xAxisSettings.position === 'hidden' ? 0 : 30;

  // Legend
  const legendHeight = legendSettings.show && legendSettings.position !== 'overlay' ? 30 + legendSettings.marginTop : 0;

  // Chart area
  const marginLeft = padding.left + (yAxisSettings.position === 'left' ? yAxisWidth : 0);
  const marginRight = padding.right + (yAxisSettings.position === 'right' ? yAxisWidth : 0) +
    ((labelSettings.showLineLabels ?? true) ? (labelSettings.lineLabelMaxWidth ?? 4) * 12 : 0);
  const marginTop = padding.top + (legendSettings.position === 'above' ? legendHeight : 0);
  const marginBottom = padding.bottom + xAxisHeight + (legendSettings.position === 'below' ? legendHeight : 0);

  const chartWidth = Math.max(100, width - marginLeft - marginRight);
  const computedHeight = propHeight || Math.max(200, chartWidth * 0.5);
  const chartHeight = Math.max(100, computedHeight - marginTop - marginBottom);
  const svgHeight = computedHeight;

  // Scale functions
  const xScale = useCallback((i: number) => {
    if (categories.length <= 1) return chartWidth / 2;
    return (i / (categories.length - 1)) * chartWidth;
  }, [categories.length, chartWidth]);

  const yScale = useCallback((v: number) => {
    const range = yMax - yMin;
    if (range === 0) return chartHeight / 2;
    return chartHeight - ((v - yMin) / range) * chartHeight;
  }, [yMin, yMax, chartHeight]);

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
          // 'continue' mode: skip null points
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
    // auto: show all if few points, final only if many
    return categories.length <= 15 ? 'all' as const : 'final' as const;
  }, [lineSettings.dotMode, categories.length]);

  // Gridlines
  const showGridlines = yAxisSettings.gridlines;
  const gridlineStyle = yAxisSettings.gridlineStyle ?? 'solid';

  // Render
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={svgHeight}
        style={{ overflow: 'visible' }}
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

        {/* Y axis gridlines */}
        {showGridlines && yTickValues.map((v, i) => {
          const y = marginTop + yScale(v);
          return (
            <line
              key={`grid-${i}`}
              x1={marginLeft}
              y1={y}
              x2={marginLeft + chartWidth}
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
              const txt = formatNumber(v, nf);
              const xPos = yAxisSettings.position === 'right'
                ? marginLeft + chartWidth + 8
                : marginLeft - 8;
              const anchor = yAxisSettings.position === 'right' ? 'start' : 'end';
              return (
                <text
                  key={`ytick-${i}`}
                  x={xPos}
                  y={y}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fill={yTickFont.color}
                  fontSize={yTickFont.fontSize}
                  fontFamily={yTickFont.fontFamily}
                  fontWeight={yTickFont.fontWeight}
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
        {xAxisSettings.position !== 'hidden' && (
          <g>
            {/* Axis line */}
            {xAxisSettings.axisLine?.show !== false && (
              <line
                x1={marginLeft}
                y1={marginTop + chartHeight}
                x2={marginLeft + chartWidth}
                y2={marginTop + chartHeight}
                stroke={xAxisSettings.axisLine?.color || '#666666'}
                strokeWidth={xAxisSettings.axisLine?.width || 1}
              />
            )}
            {/* Category labels */}
            {categories.map((cat, i) => {
              const x = marginLeft + xScale(i);
              return (
                <text
                  key={`xcat-${i}`}
                  x={x}
                  y={marginTop + chartHeight + 16}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fill={xAxisSettings.tickStyling?.color || '#666666'}
                  fontSize={xAxisSettings.tickStyling?.fontSize || 11}
                  fontFamily={xAxisSettings.tickStyling?.fontFamily || 'Inter, sans-serif'}
                  fontWeight={xAxisSettings.tickStyling?.fontWeight || 'normal'}
                  transform={xAxisSettings.tickAngle ? `rotate(${xAxisSettings.tickAngle}, ${x}, ${marginTop + chartHeight + 16})` : undefined}
                >
                  {cat}
                </text>
              );
            })}
          </g>
        )}

        {/* X axis title */}
        {xAxisSettings.titleType === 'custom' && xAxisSettings.titleText && (
          <text
            x={marginLeft + chartWidth / 2}
            y={marginTop + chartHeight + xAxisHeight - 2}
            textAnchor="middle"
            fill={xAxisSettings.titleStyling.color}
            fontSize={xAxisSettings.titleStyling.fontSize}
            fontFamily={xAxisSettings.titleStyling.fontFamily}
            fontWeight={xAxisSettings.titleStyling.fontWeight}
          >
            {xAxisSettings.titleText}
          </text>
        )}

        {/* Chart area clip */}
        <defs>
          <clipPath id="line-chart-clip">
            <rect x={0} y={0} width={chartWidth} height={chartHeight} />
          </clipPath>
        </defs>

        {/* Main chart group */}
        <g transform={`translate(${marginLeft}, ${marginTop})`} clipPath="url(#line-chart-clip)">
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

              {/* Line outline */}
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
            </g>
          ))}

          {/* Dots */}
          {showDots !== 'none' && series.map((s, si) => (
            <g key={`dots-${si}`}>
              {s.points.map((val, pi) => {
                if (val === null) return null;
                if (showDots === 'final' && pi !== s.points.length - 1) {
                  // Check if this is the last non-null point
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

                // Show mode filter
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

                // Determine position (above/below)
                let position: 'above' | 'below' = (labelSettings.lineDataPointPosition as 'above' | 'below') ?? 'above';
                if (labelSettings.lineDataPointPosition === 'custom') {
                  const customMode = labelSettings.lineDataPointCustomMode || 'column';
                  if (customMode === 'column') {
                    const colName = valueColumns[si];
                    position = labelSettings.lineDataPointSeriesPositions?.[colName] ?? 'above';
                  } else {
                    const rowName = categories[pi];
                    position = labelSettings.lineDataPointRowPositions?.[rowName] ?? 'above';
                  }
                }

                const labelText = formatNumber(val, nf);
                const offset = position === 'above' ? -8 : 12;

                const customPadding = labelSettings.dataPointCustomPadding;
                const padTop = customPadding ? (labelSettings.dataPointPaddingTop || 0) : 0;
                const padLeft = customPadding ? (labelSettings.dataPointPaddingLeft || 0) : 0;

                return (
                  <text
                    key={`dp-${si}-${pi}`}
                    x={cx + padLeft}
                    y={cy + offset + padTop}
                    textAnchor="middle"
                    dominantBaseline={position === 'above' ? 'auto' : 'hanging'}
                    fill={
                      (labelSettings.dataPointTextColorMode === 'match_data') ? s.color :
                      (labelSettings.dataPointTextColorMode === 'fixed') ? (labelSettings.dataPointTextColorFixed || '#333333') :
                      '#333333'
                    }
                    fontSize={(labelSettings.dataPointSizeFixed ?? 1.2) * 10}
                    fontWeight={labelSettings.dataPointFontWeight || 'normal'}
                    fontFamily={labelSettings.dataPointFontFamily || 'Inter, sans-serif'}
                    opacity={animProgress}
                  >
                    {labelText}
                  </text>
                );
              })}
            </g>
          ))}
        </g>

        {/* Line labels (at end of each series) */}
        {(labelSettings.showLineLabels ?? true) && series.map((s, si) => {
          // Find last non-null point
          let lastIdx = -1;
          let lastVal: number | null = null;
          for (let i = s.points.length - 1; i >= 0; i--) {
            if (s.points[i] !== null) { lastIdx = i; lastVal = s.points[i]; break; }
          }
          if (lastIdx === -1 || lastVal === null) return null;

          const cx = marginLeft + xScale(lastIdx);
          const cy = marginTop + yScale(lastVal * animProgress);
          const labelX = cx + (labelSettings.lineLabelDistance ?? 0.9) * 10;

          return (
            <text
              key={`ll-${si}`}
              x={labelX}
              y={cy}
              textAnchor="start"
              dominantBaseline="central"
              fill={labelSettings.lineLabelColor ?? '#333333'}
              fontSize={(labelSettings.lineLabelSize ?? 0.7) * 14}
              fontWeight={labelSettings.lineLabelWeight ?? 'bold'}
              opacity={animProgress}
              style={{
                paintOrder: 'stroke',
                stroke: labelSettings.lineLabelOutline ?? '#ffffff',
                strokeWidth: (labelSettings.lineLabelOutlineWidth ?? 25) / 10,
                strokeLinejoin: 'round',
              }}
            >
              {s.name}
            </text>
          );
        })}

        {/* Legend */}
        {legendSettings.show && (
          <g transform={`translate(${marginLeft}, ${
            legendSettings.position === 'above'
              ? padding.top + legendSettings.marginTop
              : marginTop + chartHeight + xAxisHeight + 8 + legendSettings.marginTop
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
