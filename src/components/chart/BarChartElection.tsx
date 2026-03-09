'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { ChartSettings, ColumnMapping, ElectionPerRowNumberFormat, ElectionPerRowTextStyle, ElectionPerRowPrefixSettings, ElectionRowImageSide } from '@/types/chart';
import type { DataRow } from '@/types/data';
import {
  resolveColors,
  formatElectionNumber,
  getContrastColor,
  fontWeightToCSS,
  measureTextWidth,
} from '@/lib/chart/utils';

// ─── Types ────────────────────────────────────────────────────────────
interface BarChartElectionProps {
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
function resolveTextStyle(
  cat: string,
  perRow: Record<string, Partial<ElectionPerRowTextStyle>>,
  defaults: ElectionPerRowTextStyle,
): ElectionPerRowTextStyle {
  const row = perRow[cat];
  if (!row) return defaults;
  return {
    fontSize: row.fontSize ?? defaults.fontSize,
    fontFamily: row.fontFamily ?? defaults.fontFamily,
    fontWeight: row.fontWeight ?? defaults.fontWeight,
    fontStyle: row.fontStyle ?? defaults.fontStyle,
    color: row.color ?? defaults.color,
    letterSpacing: row.letterSpacing ?? defaults.letterSpacing,
  };
}

function resolveNumberFormat(
  cat: string,
  perRow: Record<string, Partial<ElectionPerRowNumberFormat>>,
  defaults: ElectionPerRowNumberFormat,
): ElectionPerRowNumberFormat {
  const row = perRow[cat];
  if (!row) return defaults;
  return {
    decimalPlaces: row.decimalPlaces ?? defaults.decimalPlaces,
    thousandsSeparator: row.thousandsSeparator ?? defaults.thousandsSeparator,
    decimalSeparator: row.decimalSeparator ?? defaults.decimalSeparator,
    prefix: row.prefix ?? defaults.prefix,
    suffix: row.suffix ?? defaults.suffix,
    showTrailingZeros: row.showTrailingZeros ?? defaults.showTrailingZeros,
  };
}

function resolvePrefix(
  cat: string,
  perRow: Record<string, Partial<ElectionPerRowPrefixSettings>>,
  defaults: ElectionPerRowPrefixSettings,
): ElectionPerRowPrefixSettings {
  const row = perRow[cat];
  if (!row) return defaults;
  return {
    show: row.show ?? defaults.show,
    text: row.text ?? defaults.text,
    position: row.position ?? defaults.position,
    fontSize: row.fontSize ?? defaults.fontSize,
    fontWeight: row.fontWeight ?? defaults.fontWeight,
    color: row.color ?? defaults.color,
    padding: row.padding ?? defaults.padding,
    paddingTop: row.paddingTop ?? defaults.paddingTop,
    paddingBottom: row.paddingBottom ?? defaults.paddingBottom,
    verticalAlign: row.verticalAlign ?? defaults.verticalAlign,
  };
}

function resolveImageSide(
  cat: string,
  perRow: Record<string, Partial<ElectionRowImageSide>>,
  defaults: ElectionRowImageSide,
): ElectionRowImageSide {
  const row = perRow[cat];
  if (!row) return defaults;
  return {
    show: row.show ?? defaults.show,
    url: row.url ?? defaults.url,
    width: row.width ?? defaults.width,
    height: row.height ?? defaults.height,
    borderRadius: row.borderRadius ?? defaults.borderRadius,
    paddingTop: row.paddingTop ?? defaults.paddingTop,
    paddingRight: row.paddingRight ?? defaults.paddingRight,
    paddingBottom: row.paddingBottom ?? defaults.paddingBottom,
    paddingLeft: row.paddingLeft ?? defaults.paddingLeft,
  };
}

// ─── Component ────────────────────────────────────────────────────────
export function BarChartElection({
  data,
  columnMapping,
  settings,
  width,
  height: heightProp,
  skipAnimation,
}: BarChartElectionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
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

  const eb = settings.electionBar;
  const layout = settings.layout;

  // ─── Data Processing ────────────────────────────────────────────
  const { categories, values, colors } = useMemo(() => {
    const labelsCol = columnMapping.labels || '';
    const valueCol = columnMapping.values?.[0] || '';
    if (!labelsCol || !valueCol) return { categories: [], values: [], colors: [] };

    const cats: string[] = [];
    const vals: number[] = [];
    for (const row of data) {
      const label = String(row[labelsCol] ?? '');
      const val = Number(row[valueCol]) || 0;
      if (label) {
        cats.push(label);
        vals.push(val);
      }
    }

    const resolvedColors = resolveColors(settings.colors, cats);
    return { categories: cats, values: vals, colors: resolvedColors };
  }, [data, columnMapping, settings.colors]);

  const totalSum = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

  // ─── Padding ────────────────────────────────────────────────────
  const padding = useMemo(() => ({
    top: layout.paddingTop,
    right: layout.paddingRight,
    bottom: layout.paddingBottom,
    left: layout.paddingLeft,
  }), [layout]);

  // ─── Image Spaces ──────────────────────────────────────────────
  const leftImageSpace = useMemo(() => {
    if (!eb.leftImage.show) return 0;
    let maxW = 0;
    for (const cat of categories) {
      const img = resolveImageSide(cat, eb.leftImage.perRowSettings, eb.leftImage.defaultSettings);
      if (img.show && img.url) {
        const totalW = img.width + img.paddingLeft + img.paddingRight;
        if (totalW > maxW) maxW = totalW;
      }
    }
    return maxW;
  }, [eb.leftImage, categories]);

  const rightImageSpace = useMemo(() => {
    if (!eb.rightImage.show) return 0;
    let maxW = 0;
    for (const cat of categories) {
      const img = resolveImageSide(cat, eb.rightImage.perRowSettings, eb.rightImage.defaultSettings);
      if (img.show && img.url) {
        const totalW = img.width + img.paddingLeft + img.paddingRight;
        if (totalW > maxW) maxW = totalW;
      }
    }
    return maxW;
  }, [eb.rightImage, categories]);

  // ─── Plot Width ────────────────────────────────────────────────
  const plotWidth = useMemo(() => {
    if (eb.manualPlotWidth) return eb.manualPlotWidthValue;
    return width - padding.left - padding.right - leftImageSpace - rightImageSpace;
  }, [eb.manualPlotWidth, eb.manualPlotWidthValue, width, padding, leftImageSpace, rightImageSpace]);

  // ─── Label Heights ────────────────────────────────────────────
  const labelsAboveHeight = useMemo(() => {
    let maxH = 0;
    for (const cat of categories) {
      const pos = eb.perRowLabelPosition[cat] || eb.defaultLabelPosition;
      if (pos === 'above_bar') {
        const style = resolveTextStyle(cat, eb.perRowLabelStyles, eb.defaultLabelStyle);
        const h = style.fontSize + 4;
        if (h > maxH) maxH = h;
      }
    }
    return maxH;
  }, [categories, eb]);

  const labelsBelowHeight = useMemo(() => {
    let maxH = 0;
    for (const cat of categories) {
      const pos = eb.perRowLabelPosition[cat] || eb.defaultLabelPosition;
      if (pos === 'below_bar') {
        const style = resolveTextStyle(cat, eb.perRowLabelStyles, eb.defaultLabelStyle);
        const h = style.fontSize + 4;
        if (h > maxH) maxH = h;
      }
    }
    return maxH;
  }, [categories, eb]);

  // ─── Info Height ──────────────────────────────────────────────
  const infoHeight = useMemo(() => {
    if (!eb.showDataPointsInfo) return 0;
    let maxH = 0;
    for (const cat of categories) {
      const visible = eb.perRowInfoVisible[cat] !== false;
      if (visible) {
        const style = resolveTextStyle(cat, eb.perRowInfoStyles, eb.defaultInfoStyle);
        const h = style.fontSize + eb.infoPaddingTop + 2;
        if (h > maxH) maxH = h;
      }
    }
    return maxH;
  }, [categories, eb]);

  // ─── Legend Height ────────────────────────────────────────────
  const legendSettings = settings.legend;
  const legendIsOverlay = legendSettings.position === 'overlay';
  const legendIsAbove = legendSettings.position === 'above';

  const legendItems = useMemo(() => {
    return categories
      .map((cat, i) => ({ name: cat, color: colors[i] }))
      .filter((item) => eb.legendVisibleRows[item.name] !== false);
  }, [categories, colors, eb.legendVisibleRows]);

  const legendHeight = useMemo(() => {
    if (!legendSettings.show || legendIsOverlay) return 0;
    const marginTop = legendSettings.marginTop || 0;
    const fontSize = legendSettings.size;
    const gap = legendSettings.swatchPadding || 8;
    const rowGap = legendSettings.rowGap ?? 4;
    if (legendSettings.orientation === 'vertical') {
      return legendItems.length * (fontSize + gap) + marginTop + 10;
    }
    const swW = legendSettings.swatchWidth;
    const fontFamily = legendSettings.fontFamily || 'Inter, sans-serif';
    const textWeight = legendSettings.textWeight;
    const wrapMode = legendSettings.wrapMode || 'auto';
    if (wrapMode === 'fixed') {
      const perRow = legendSettings.fixedItemsPerRow ?? 3;
      const rowCount = Math.ceil(legendItems.length / perRow);
      return rowCount * (fontSize + rowGap) - rowGap + marginTop + 10;
    }
    const itemWidths = legendItems.map((item) => swW + 4 + measureTextWidth(item.name, fontSize, fontFamily, textWeight));
    const availW = plotWidth;
    let rows = 1;
    let rowW = 0;
    for (const w of itemWidths) {
      if (rowW + w + gap > availW && rowW > 0) { rows++; rowW = w + gap; }
      else { rowW += w + gap; }
    }
    return rows * (fontSize + rowGap) - rowGap + marginTop + 10;
  }, [legendSettings, legendItems, legendIsOverlay, plotWidth]);

  // ─── Total Height ─────────────────────────────────────────────
  const totalHeight = useMemo(() => {
    const legendAbove = legendIsAbove ? legendHeight : 0;
    const legendBelow = !legendIsAbove && !legendIsOverlay ? legendHeight : 0;
    return padding.top + legendAbove + labelsAboveHeight + eb.barHeight + labelsBelowHeight + infoHeight + legendBelow + padding.bottom;
  }, [padding, labelsAboveHeight, labelsBelowHeight, eb.barHeight, infoHeight, legendHeight, legendIsAbove, legendIsOverlay]);

  const chartHeight = heightProp || totalHeight;

  // ─── Bar Y Position ───────────────────────────────────────────
  const barY = useMemo(() => {
    const legendAbove = legendIsAbove ? legendHeight : 0;
    return padding.top + legendAbove + labelsAboveHeight;
  }, [padding.top, legendIsAbove, legendHeight, labelsAboveHeight]);

  // ─── Segment Positions ────────────────────────────────────────
  const segments = useMemo(() => {
    if (totalSum === 0 || categories.length === 0) return [];
    const totalSpacing = eb.spacingBetweenSegments * (categories.length - 1);
    const availW = plotWidth - totalSpacing;
    let currentX = padding.left + leftImageSpace;
    return categories.map((cat, i) => {
      const w = (values[i] / totalSum) * availW * animProgress;
      const x = currentX;
      currentX += w + eb.spacingBetweenSegments;
      return { cat, x, w, value: values[i], color: colors[i], index: i };
    });
  }, [categories, values, colors, totalSum, plotWidth, eb.spacingBetweenSegments, padding.left, leftImageSpace, animProgress]);

  // ─── Render ───────────────────────────────────────────────────
  if (categories.length === 0) {
    return (
      <svg width={width} height={100} ref={svgRef}>
        <text x={width / 2} y={50} textAnchor="middle" fill="#999" fontSize={14}>
          No data to display
        </text>
      </svg>
    );
  }

  const barLeft = padding.left + leftImageSpace;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={chartHeight}
      style={{ backgroundColor: `rgba(${parseInt(layout.backgroundColor.slice(1, 3), 16)}, ${parseInt(layout.backgroundColor.slice(3, 5), 16)}, ${parseInt(layout.backgroundColor.slice(5, 7), 16)}, ${layout.backgroundOpacity / 100})` }}
    >
      {/* ── Left Images ── */}
      {eb.leftImage.show && categories.map((cat, ci) => {
        const img = resolveImageSide(cat, eb.leftImage.perRowSettings, eb.leftImage.defaultSettings);
        if (!img.show || !img.url) return null;
        const imgX = padding.left + img.paddingLeft;
        const imgY = barY + (eb.barHeight - img.height) / 2 + img.paddingTop - img.paddingBottom;
        const br = img.borderRadius;
        const clipId = `left-img-clip-${ci}`;
        return (
          <g key={`left-img-${ci}`}>
            {br > 0 && (
              <defs>
                <clipPath id={clipId}>
                  <rect x={imgX} y={imgY} width={img.width} height={img.height} rx={br} ry={br} />
                </clipPath>
              </defs>
            )}
            <image
              href={img.url}
              x={imgX}
              y={imgY}
              width={img.width}
              height={img.height}
              clipPath={br > 0 ? `url(#${clipId})` : undefined}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        );
      })}

      {/* ── Right Images ── */}
      {eb.rightImage.show && categories.map((cat, ci) => {
        const img = resolveImageSide(cat, eb.rightImage.perRowSettings, eb.rightImage.defaultSettings);
        if (!img.show || !img.url) return null;
        const imgX = barLeft + plotWidth + img.paddingLeft;
        const imgY = barY + (eb.barHeight - img.height) / 2 + img.paddingTop - img.paddingBottom;
        const br = img.borderRadius;
        const clipId = `right-img-clip-${ci}`;
        return (
          <g key={`right-img-${ci}`}>
            {br > 0 && (
              <defs>
                <clipPath id={clipId}>
                  <rect x={imgX} y={imgY} width={img.width} height={img.height} rx={br} ry={br} />
                </clipPath>
              </defs>
            )}
            <image
              href={img.url}
              x={imgX}
              y={imgY}
              width={img.width}
              height={img.height}
              clipPath={br > 0 ? `url(#${clipId})` : undefined}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        );
      })}

      {/* ── Bar Segments ── */}
      {segments.map((seg) => (
        <rect
          key={`bar-${seg.index}`}
          x={seg.x}
          y={barY}
          width={Math.max(0, seg.w)}
          height={eb.barHeight}
          fill={seg.color}
          opacity={eb.barOpacity}
          stroke={eb.outline ? eb.outlineColor : undefined}
          strokeWidth={eb.outline ? eb.outlineWidth : undefined}
        />
      ))}

      {/* ── Labels Above/Below Bar ── */}
      {segments.map((seg) => {
        const pos = eb.perRowLabelPosition[seg.cat] || eb.defaultLabelPosition;
        if (pos === 'hidden') return null;
        const style = resolveTextStyle(seg.cat, eb.perRowLabelStyles, eb.defaultLabelStyle);
        const align = eb.perRowLabelAlign[seg.cat] || eb.defaultLabelAlign;
        let anchor: 'start' | 'middle' | 'end';
        let labelX: number;
        if (align === 'left') { anchor = 'start'; labelX = seg.x; }
        else if (align === 'right') { anchor = 'end'; labelX = seg.x + seg.w; }
        else { anchor = 'middle'; labelX = seg.x + seg.w / 2; }
        const labelY = pos === 'above_bar'
          ? barY - 4
          : barY + eb.barHeight + style.fontSize + 2;
        return (
          <text
            key={`label-${seg.index}`}
            x={labelX}
            y={labelY}
            textAnchor={anchor}
            style={{
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: fontWeightToCSS(style.fontWeight),
              fontStyle: style.fontStyle,
              fill: style.color,
              letterSpacing: style.letterSpacing,
            }}
          >
            {seg.cat}
          </text>
        );
      })}

      {/* ── Data Point Labels ── */}
      {eb.showDataPoints && segments.map((seg) => {
        const style = resolveTextStyle(seg.cat, eb.perRowDataPointStyles, eb.defaultDataPointStyle);
        const nf = resolveNumberFormat(seg.cat, eb.perRowNumberFormat, eb.defaultNumberFormat);
        const prefix = resolvePrefix(seg.cat, eb.perRowPrefixSettings, eb.defaultPrefix);
        const align = eb.perRowDataPointAlign[seg.cat] || 'center';
        const rowPad = eb.perRowDataPointPadding[seg.cat] || {
          top: eb.dataPointPaddingTop,
          right: eb.dataPointPaddingRight,
          bottom: eb.dataPointPaddingBottom,
          left: eb.dataPointPaddingLeft,
        };

        const valueStr = formatElectionNumber(seg.value, nf);
        const prefixStr = prefix.show ? prefix.text : '';

        // Calculate text anchor and position
        let dpAnchor: 'start' | 'middle' | 'end';
        let dpX: number;
        if (align === 'left') {
          dpAnchor = 'start';
          dpX = seg.x + rowPad.left;
        } else if (align === 'right') {
          dpAnchor = 'end';
          dpX = seg.x + seg.w - rowPad.right;
        } else {
          dpAnchor = 'middle';
          dpX = seg.x + seg.w / 2;
        }
        const dpY = barY + eb.barHeight / 2 + rowPad.top - rowPad.bottom;

        // Determine color: use auto-contrast if color is auto-like
        const dpColor = style.color === 'auto' ? getContrastColor(seg.color) : style.color;

        return (
          <g key={`dp-${seg.index}`}>
            {/* Value + prefix combined */}
            <text
              x={dpX}
              y={dpY}
              textAnchor={dpAnchor}
              dominantBaseline="central"
              style={{
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                fontWeight: fontWeightToCSS(style.fontWeight),
                fontStyle: style.fontStyle,
                fill: dpColor,
                letterSpacing: style.letterSpacing,
              }}
            >
              {prefix.show && prefix.position === 'left' && (
                <tspan
                  style={{
                    fontSize: prefix.fontSize,
                    fontWeight: fontWeightToCSS(prefix.fontWeight),
                    fill: prefix.color === 'auto' ? getContrastColor(seg.color) : prefix.color,
                  }}
                  dy={prefix.verticalAlign === 'top' ? -(style.fontSize - prefix.fontSize) * 0.5 : prefix.verticalAlign === 'bottom' ? (style.fontSize - prefix.fontSize) * 0.3 : 0}
                  dx={-prefix.padding}
                >
                  {prefixStr}
                </tspan>
              )}
              <tspan>{valueStr}</tspan>
              {prefix.show && prefix.position === 'right' && (
                <tspan
                  style={{
                    fontSize: prefix.fontSize,
                    fontWeight: fontWeightToCSS(prefix.fontWeight),
                    fill: prefix.color === 'auto' ? getContrastColor(seg.color) : prefix.color,
                  }}
                  dy={prefix.verticalAlign === 'top' ? -(style.fontSize - prefix.fontSize) * 0.5 : prefix.verticalAlign === 'bottom' ? (style.fontSize - prefix.fontSize) * 0.3 : 0}
                  dx={prefix.padding}
                >
                  {prefixStr}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {/* ── Data Points Info (below bar) ── */}
      {eb.showDataPointsInfo && segments.map((seg) => {
        const visible = eb.perRowInfoVisible[seg.cat] !== false;
        if (!visible) return null;
        const style = resolveTextStyle(seg.cat, eb.perRowInfoStyles, eb.defaultInfoStyle);
        const nf = resolveNumberFormat(seg.cat, eb.perRowInfoNumberFormat, eb.defaultInfoNumberFormat);
        const infoStr = formatElectionNumber(seg.value, nf);
        const infoY = barY + eb.barHeight + labelsBelowHeight + eb.infoPaddingTop + style.fontSize;
        const infoX = seg.x + seg.w / 2;
        return (
          <text
            key={`info-${seg.index}`}
            x={infoX}
            y={infoY}
            textAnchor="middle"
            style={{
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: fontWeightToCSS(style.fontWeight),
              fontStyle: style.fontStyle,
              fill: style.color,
              letterSpacing: style.letterSpacing,
            }}
          >
            {infoStr}
          </text>
        );
      })}

      {/* ── Legend ── */}
      {legendSettings.show && (() => {
        const lPadT = legendSettings.paddingTop || 0;
        const lPadR = legendSettings.paddingRight || 0;
        const lPadL = legendSettings.paddingLeft || 0;
        const fontSize = legendSettings.size;
        const swW = legendSettings.swatchWidth;
        const swH = legendSettings.swatchHeight;
        const gap = legendSettings.swatchPadding || 8;
        const rowGap = legendSettings.rowGap ?? 4;

        const legendY = legendIsOverlay
          ? barY + (legendSettings.overlayY ?? 10) + lPadT
          : legendIsAbove
            ? padding.top + (legendSettings.marginTop || 0) + lPadT
            : barY + eb.barHeight + labelsBelowHeight + infoHeight + (legendSettings.marginTop || 0) + lPadT;

        // Legend aligned to bar area
        const legendAreaLeft = barLeft + lPadL;
        const legendAreaWidth = plotWidth - lPadL - lPadR;

        const fontFamily = legendSettings.fontFamily || 'Inter, sans-serif';
        const textWeight = legendSettings.textWeight;

        const itemWidths = legendItems.map((item) => swW + 4 + measureTextWidth(item.name, fontSize, fontFamily, textWeight));
        const totalLegendW = itemWidths.reduce((s, w) => s + w, 0) + (legendItems.length - 1) * gap;

        let startX = legendAreaLeft;
        if (legendSettings.alignment === 'center') {
          startX = legendAreaLeft + (legendAreaWidth - totalLegendW) / 2;
        } else if (legendSettings.alignment === 'right') {
          startX = legendAreaLeft + legendAreaWidth - totalLegendW;
        }

        if (legendSettings.orientation === 'vertical') {
          return legendItems.map((item, idx) => {
            const itemY = legendY + idx * (fontSize + gap);
            return (
              <g key={`legend-${idx}`}>
                <rect
                  x={startX}
                  y={itemY}
                  width={swW}
                  height={swH}
                  fill={item.color}
                  rx={legendSettings.swatchRoundness}
                />
                <text
                  x={startX + swW + 4}
                  y={itemY + swH / 2}
                  dominantBaseline="central"
                  style={{
                    fontSize,
                    fontFamily,
                    fontWeight: fontWeightToCSS(textWeight),
                    fontStyle: legendSettings.textStyle || 'normal',
                    fill: legendSettings.color,
                  }}
                >
                  {item.name}
                </text>
              </g>
            );
          });
        }

        // Horizontal legend with wrap
        const wrapMode = legendSettings.wrapMode || 'auto';
        const fixedPerRow = legendSettings.fixedItemsPerRow ?? 3;
        const rows: number[][] = [];
        if (wrapMode === 'fixed') {
          for (let i = 0; i < legendItems.length; i += fixedPerRow) {
            rows.push(Array.from({ length: Math.min(fixedPerRow, legendItems.length - i) }, (_, j) => i + j));
          }
        } else {
          let currentRow: number[] = [];
          let rowW = 0;
          for (let i = 0; i < legendItems.length; i++) {
            const w = itemWidths[i] + gap;
            if (rowW + w > legendAreaWidth && currentRow.length > 0) {
              rows.push(currentRow);
              currentRow = [i];
              rowW = w;
            } else {
              currentRow.push(i);
              rowW += w;
            }
          }
          if (currentRow.length > 0) rows.push(currentRow);
        }

        return rows.flatMap((row, rowIdx) => {
          const rowItemWidths = row.map((i) => itemWidths[i]);
          const rowTotalW = rowItemWidths.reduce((s, w) => s + w, 0) + (row.length - 1) * gap;
          let rowX = legendAreaLeft;
          if (legendSettings.alignment === 'center') rowX = legendAreaLeft + (legendAreaWidth - rowTotalW) / 2;
          else if (legendSettings.alignment === 'right') rowX = legendAreaLeft + legendAreaWidth - rowTotalW;
          const rowY = legendY + rowIdx * (fontSize + rowGap);
          return row.map((itemIdx) => {
            const item = legendItems[itemIdx];
            const el = (
              <g key={`legend-${itemIdx}`}>
                <rect
                  x={rowX}
                  y={rowY}
                  width={swW}
                  height={swH}
                  fill={item.color}
                  rx={legendSettings.swatchRoundness}
                />
                <text
                  x={rowX + swW + 4}
                  y={rowY + swH / 2}
                  dominantBaseline="central"
                  style={{
                    fontSize,
                    fontFamily,
                    fontWeight: fontWeightToCSS(textWeight),
                    fontStyle: legendSettings.textStyle || 'normal',
                    fill: legendSettings.color,
                  }}
                >
                  {item.name}
                </text>
              </g>
            );
            rowX += itemWidths[itemIdx] + gap;
            return el;
          });
        });
      })()}
    </svg>
  );
}
