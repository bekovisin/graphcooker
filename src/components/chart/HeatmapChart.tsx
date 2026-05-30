'use client';

import React, { useMemo } from 'react';
import { ChartSettings, ColumnMapping, HeatmapAlign } from '@/types/chart';
import { DataRow } from '@/types/data';
import { measureTextWidth, fontWeightToCSS, formatNumber, resolveColors } from '@/lib/chart/utils';

interface HeatmapChartProps {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
  skipAnimation?: boolean;
}

const DASH = '–';

/** Turkish-aware uppercase (i → İ, ı → I) so labels like "İYİ Parti" render correctly. */
const upperTr = (t: string): string => t.toLocaleUpperCase('tr-TR');

/** Parse a cell value into a number (handles "32,72%", "1.234,5", numbers). */
function toNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isNaN(v) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  let t = s.replace(/%/g, '').replace(/\s/g, '');
  if (t.includes(',') && t.includes('.')) {
    // assume thousands ',' + decimal '.'  → strip commas
    t = t.replace(/,/g, '');
  } else {
    t = t.replace(',', '.');
  }
  t = t.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(t);
  return Number.isNaN(n) ? null : n;
}

/** Hex (#rrggbb) → rgba(r,g,b,a). */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const densityPad = (d: string): { x: number; y: number } =>
  d === 'compact' ? { x: 10, y: 5 } : d === 'comfortable' ? { x: 16, y: 12 } : { x: 12, y: 8 };

/** Rounded-rect path with independent corner radii. */
function roundedRectPath(x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number): string {
  return [
    `M${x + tl},${y}`,
    `H${x + w - tr}`,
    tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : '',
    `V${y + h - br}`,
    br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : '',
    `H${x + bl}`,
    bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : '',
    `V${y + tl}`,
    tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : '',
    'Z',
  ].join(' ');
}

function anchorFor(align: HeatmapAlign): 'start' | 'middle' | 'end' {
  return align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
}

export function HeatmapChart({ data, columnMapping, settings, width, seriesNames }: HeatmapChartProps) {
  const hm = settings.heatmap;
  const nf = settings.numberFormatting;

  const model = useMemo(() => {
    const labelCol = columnMapping.labels;
    const valueCols = (columnMapping.values || []).filter(Boolean);

    const rows = data.map((row) => ({
      label: String(row[labelCol] ?? ''),
      values: valueCols.map((c) => toNum(row[c])),
    }));

    const nameMap = { ...(columnMapping.seriesNames || {}), ...(seriesNames || {}) };
    const headers = valueCols.map((c) => nameMap[c] ?? c);

    // Per-row totals (sum of value columns)
    const totals = rows.map((r) => {
      const nums = r.values.filter((v): v is number => v != null);
      return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    });

    // Color scale stats over body cells (+ optionally totals)
    const all: number[] = [];
    for (const r of rows) for (const v of r.values) if (v != null) all.push(v);
    if (hm.includeTotalInScale && hm.showTotals) for (const t of totals) if (t != null) all.push(t);
    const stats =
      all.length === 0
        ? null
        : {
            min: Math.min(...all),
            max: Math.max(...all),
            mean: all.reduce((a, b) => a + b, 0) / all.length,
          };

    // Row dot colors from the shared palette/override system
    const rowColors = resolveColors(settings.colors, rows.map((r) => r.label), nameMap);

    const labelHeader = nameMap[labelCol] ?? labelCol ?? '';

    return { valueCols, rows, headers, totals, stats, rowColors, labelHeader };
  }, [data, columnMapping, seriesNames, settings.colors, hm.includeTotalInScale, hm.showTotals]);

  const { rows, headers, totals, stats, rowColors, labelHeader } = model;

  // Heatmap background for a value
  const heatBg = (v: number | null): string | null => {
    if (v == null || !stats) return null;
    if (hm.colorMode === 'single') {
      const range = stats.max - stats.min;
      const t = range > 0 ? (v - stats.min) / range : 0;
      return hexToRgba(hm.baseColor, t * hm.intensity);
    }
    const above = stats.max - stats.mean;
    const below = stats.mean - stats.min;
    const span = Math.max(above, below);
    if (span <= 0) return null;
    const t = (v - stats.mean) / span;
    if (t > 0) return hexToRgba(hm.positiveColor, t * hm.intensity);
    if (t < 0) return hexToRgba(hm.negativeColor, -t * hm.intensity);
    return null;
  };

  const fmtVal = (v: number): string => {
    if (hm.showPercent) {
      const base = formatNumber(v, nf, undefined, undefined, undefined, '', '');
      return hm.percentPosition === 'left' ? `%${base}` : `${base}%`;
    }
    return formatNumber(v, nf);
  };

  const fmt = (v: number | null): string => {
    if (v == null) return DASH;
    if (hm.zeroAsDash && Math.abs(v) < 1e-9) return DASH;
    return fmtVal(v);
  };

  // ── Geometry ──
  const pad = densityPad(hm.density);
  const dotSize = hm.dotSize;
  const dotGap = 8;
  const dotSpace = hm.showRowDots ? dotSize + dotGap : 0;
  const rowH = hm.rowHeight > 0 ? hm.rowHeight : Math.max(hm.cellFontSize, hm.labelFontSize) + pad.y * 2;
  const headerH = hm.headerHeight > 0 ? hm.headerHeight : hm.headerFontSize + pad.y * 2;

  const labelColW = useMemo(() => {
    if (hm.labelColWidth > 0) return hm.labelColWidth;
    const cornerText = hm.cornerLabel && hm.cornerLabel.trim() ? hm.cornerLabel : labelHeader;
    let maxW = measureTextWidth(upperTr(cornerText), hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);
    for (const r of rows) {
      const w = measureTextWidth(r.label, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight);
      if (w > maxW) maxW = w;
    }
    const total = maxW + dotSpace + pad.x * 2;
    return Math.min(Math.max(total, 80), Math.max(120, width * 0.4));
  }, [hm.labelColWidth, hm.cornerLabel, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight, labelHeader, rows, dotSpace, pad.x, width]);

  const dataCols = headers.length + (hm.showTotals ? 1 : 0);
  const autoDataColW = dataCols > 0 ? (width - labelColW) / dataCols : 0;
  const dataColW = hm.dataColWidth > 0 ? hm.dataColWidth : autoDataColW;
  const svgW = hm.dataColWidth > 0 ? labelColW + dataCols * dataColW : width;
  const svgH = headerH + rows.length * rowH;
  const radius = hm.cornerRadius;

  if (width <= 0) return null;
  if (rows.length === 0 || headers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Map a label column and at least one value column to see the heatmap.
      </div>
    );
  }

  const clipId = 'hm-clip';
  const borderStroke = hm.borderShow ? hm.borderColor : 'none';
  const dashArray = hm.borderStyle === 'dashed' ? `${hm.borderWidth * 3} ${hm.borderWidth * 2}` : undefined;

  // x position for a data column index (0..dataCols-1)
  const colX = (i: number) => labelColW + i * dataColW;

  // Text x + anchor within a cell box
  const textX = (boxX: number, boxW: number, align: HeatmapAlign) =>
    align === 'left' ? boxX + pad.x : align === 'right' ? boxX + boxW - pad.x : boxX + boxW / 2;

  const cornerText = hm.cornerLabel && hm.cornerLabel.trim() ? hm.cornerLabel : labelHeader;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={svgW} height={svgH} rx={radius} ry={radius} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* Header row background (rounded top corners) */}
          <path d={roundedRectPath(0, 0, svgW, headerH, radius, radius, 0, 0)} fill={hm.headerBg} />

          {/* Striped row backgrounds */}
          {hm.striped &&
            rows.map((_, ri) =>
              ri % 2 === 1 ? (
                <rect key={`stripe-${ri}`} x={0} y={headerH + ri * rowH} width={svgW} height={rowH} fill={hm.stripedColor} />
              ) : null,
            )}

          {/* Heatmap cell backgrounds */}
          {rows.map((r, ri) =>
            r.values.map((v, ci) => {
              const bg = heatBg(v);
              if (!bg) return null;
              return (
                <rect
                  key={`bg-${ri}-${ci}`}
                  x={colX(ci)}
                  y={headerH + ri * rowH}
                  width={dataColW}
                  height={rowH}
                  fill={bg}
                />
              );
            }),
          )}

          {/* Grid lines */}
          {hm.borderShow && (
            <g stroke={hm.borderColor} strokeWidth={hm.borderWidth} strokeDasharray={dashArray}>
              {/* horizontal: under header + between rows */}
              {Array.from({ length: rows.length + 1 }).map((_, i) => {
                const y = headerH + i * rowH;
                return <line key={`h-${i}`} x1={0} y1={y} x2={svgW} y2={y} />;
              })}
              {/* vertical: after label col + between data cols */}
              {Array.from({ length: dataCols + 1 }).map((_, i) => {
                const x = i === 0 ? labelColW : colX(i);
                return <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={svgH} />;
              })}
            </g>
          )}

          {/* ── Header texts ── */}
          {/* Corner (label column header) */}
          <text
            x={textX(0, labelColW, hm.labelAlign)}
            y={headerH / 2}
            dy="0.35em"
            textAnchor={anchorFor(hm.labelAlign)}
            style={{
              fontFamily: hm.headerFontFamily,
              fontSize: hm.headerFontSize,
              fontWeight: fontWeightToCSS(hm.headerFontWeight),
              fill: hm.headerColor,
              letterSpacing: hm.headerLetterSpacing ? `${hm.headerLetterSpacing}px` : undefined,
            }}
          >
            {hm.headerUppercase ? upperTr(cornerText) : cornerText}
          </text>
          {/* Value column headers */}
          {headers.map((h, ci) => (
            <text
              key={`hdr-${ci}`}
              x={textX(colX(ci), dataColW, hm.headerAlign)}
              y={headerH / 2}
              dy="0.35em"
              textAnchor={anchorFor(hm.headerAlign)}
              style={{
                fontFamily: hm.headerFontFamily,
                fontSize: hm.headerFontSize,
                fontWeight: fontWeightToCSS(hm.headerFontWeight),
                fill: hm.headerColor,
                letterSpacing: hm.headerLetterSpacing ? `${hm.headerLetterSpacing}px` : undefined,
              }}
            >
              {hm.headerUppercase ? upperTr(h) : h}
            </text>
          ))}
          {/* Totals header */}
          {hm.showTotals && (
            <text
              x={textX(colX(headers.length), dataColW, hm.headerAlign)}
              y={headerH / 2}
              dy="0.35em"
              textAnchor={anchorFor(hm.headerAlign)}
              style={{
                fontFamily: hm.headerFontFamily,
                fontSize: hm.headerFontSize,
                fontWeight: 700,
                fill: hm.headerColor,
                letterSpacing: hm.headerLetterSpacing ? `${hm.headerLetterSpacing}px` : undefined,
              }}
            >
              {hm.headerUppercase ? upperTr(hm.totalLabel) : hm.totalLabel}
            </text>
          )}

          {/* ── Body rows ── */}
          {rows.map((r, ri) => {
            const cy = headerH + ri * rowH + rowH / 2;
            const labelStartX = pad.x + dotSpace;
            const labelAnchorX =
              hm.labelAlign === 'left' ? labelStartX : hm.labelAlign === 'right' ? labelColW - pad.x : (labelStartX + labelColW - pad.x) / 2;
            return (
              <g key={`row-${ri}`}>
                {/* Row dot */}
                {hm.showRowDots && (
                  <rect x={pad.x} y={cy - dotSize / 2} width={dotSize} height={dotSize} rx={hm.dotRadius} ry={hm.dotRadius} fill={rowColors[ri]} />
                )}
                {/* Row label */}
                <text
                  x={labelAnchorX}
                  y={cy}
                  dy="0.35em"
                  textAnchor={anchorFor(hm.labelAlign)}
                  style={{
                    fontFamily: hm.labelFontFamily,
                    fontSize: hm.labelFontSize,
                    fontWeight: fontWeightToCSS(hm.labelFontWeight),
                    fill: hm.labelColor,
                  }}
                >
                  {r.label}
                </text>
                {/* Value cells */}
                {r.values.map((v, ci) => {
                  const txt = fmt(v);
                  const isDash = txt === DASH;
                  return (
                    <text
                      key={`v-${ri}-${ci}`}
                      x={textX(colX(ci), dataColW, hm.valueAlign)}
                      y={cy}
                      dy="0.35em"
                      textAnchor={anchorFor(hm.valueAlign)}
                      style={{
                        fontFamily: hm.cellFontFamily,
                        fontSize: hm.cellFontSize,
                        fontWeight: fontWeightToCSS(hm.cellFontWeight),
                        fill: isDash ? hm.dashColor : hm.cellColor,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {txt}
                    </text>
                  );
                })}
                {/* Total cell (bold, no heatmap) */}
                {hm.showTotals && (
                  <text
                    x={textX(colX(headers.length), dataColW, hm.valueAlign)}
                    y={cy}
                    dy="0.35em"
                    textAnchor={anchorFor(hm.valueAlign)}
                    style={{
                      fontFamily: hm.cellFontFamily,
                      fontSize: hm.cellFontSize,
                      fontWeight: 700,
                      fill: totals[ri] == null ? hm.dashColor : hm.cellColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {totals[ri] == null ? DASH : fmtVal(totals[ri] as number)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Outer rounded border */}
        {hm.borderShow && (
          <path
            d={roundedRectPath(hm.borderWidth / 2, hm.borderWidth / 2, svgW - hm.borderWidth, svgH - hm.borderWidth, radius, radius, radius, radius)}
            fill="none"
            stroke={borderStroke}
            strokeWidth={hm.borderWidth}
            strokeDasharray={dashArray}
          />
        )}
      </svg>
    </div>
  );
}
