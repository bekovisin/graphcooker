'use client';

import React, { useMemo } from 'react';
import { ChartSettings, ColumnMapping, HeatmapAlign } from '@/types/chart';
import { DataRow } from '@/types/data';
import { measureTextWidth, fontWeightToCSS, formatNumber, resolveColors, wrapText } from '@/lib/chart/utils';

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

    // Row totals (sum of each row) and column totals (sum of each column)
    const totals = rows.map((r) => {
      const nums = r.values.filter((v): v is number => v != null);
      return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    });
    const colSums = headers.map((_, ci) => {
      let sum = 0;
      let any = false;
      for (const r of rows) {
        const v = r.values[ci];
        if (v != null) {
          sum += v;
          any = true;
        }
      }
      return any ? sum : null;
    });
    const validRowTotals = totals.filter((t): t is number => t != null);
    const grandTotal = validRowTotals.length ? validRowTotals.reduce((a, b) => a + b, 0) : null;

    const all: number[] = [];
    for (const r of rows) for (const v of r.values) if (v != null) all.push(v);
    if (hm.includeTotalInScale && hm.showTotals) {
      for (const t of totals) if (t != null) all.push(t);
      for (const t of colSums) if (t != null) all.push(t);
      if (grandTotal != null) all.push(grandTotal);
    }
    const stats =
      all.length === 0
        ? null
        : {
            min: Math.min(...all),
            max: Math.max(...all),
            mean: all.reduce((a, b) => a + b, 0) / all.length,
          };

    const rowColors = resolveColors(settings.colors, rows.map((r) => r.label), nameMap);
    const labelHeader = nameMap[labelCol] ?? labelCol ?? '';

    return { valueCols, rows, headers, totals, colSums, grandTotal, stats, rowColors, labelHeader };
  }, [data, columnMapping, seriesNames, settings.colors, hm.includeTotalInScale, hm.showTotals]);

  const { rows, headers, totals, colSums, grandTotal, stats, rowColors, labelHeader } = model;
  const cornerText = hm.cornerLabel && hm.cornerLabel.trim() ? hm.cornerLabel : labelHeader;
  const hasColTotal = hm.showTotals && (hm.totalsMode === 'column' || hm.totalsMode === 'both');
  const hasRowTotal = hm.showTotals && (hm.totalsMode === 'row' || hm.totalsMode === 'both');

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

  // ── Sizing mode: manual sizes are only honoured in custom mode ──
  const custom = hm.sizingMode === 'custom';
  const mHeaderH = custom ? hm.headerHeight : 0;
  const mRowH = custom ? hm.rowHeight : 0;
  const mLabelColW = custom ? hm.labelColWidth : 0;
  const mDataColW = custom ? hm.dataColWidth : 0;

  // ── Column widths ──
  const pad = densityPad(hm.density);
  const dotSize = hm.dotSize;
  const dotGap = 8;
  const dotSpace = hm.showRowDots ? dotSize + dotGap : 0;

  const labelColW = useMemo(() => {
    if (mLabelColW > 0) return mLabelColW;
    let maxW = measureTextWidth(upperTr(cornerText), hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);
    for (const r of rows) {
      const w = measureTextWidth(r.label, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight);
      if (w > maxW) maxW = w;
    }
    const total = maxW + dotSpace + pad.x * 2;
    return Math.min(Math.max(total, 80), Math.max(120, width * 0.4));
  }, [mLabelColW, cornerText, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight, rows, dotSpace, pad.x, width]);

  const dataCols = headers.length + (hasColTotal ? 1 : 0);
  const autoDataColW = dataCols > 0 ? (width - labelColW) / dataCols : 0;
  const dataColW = mDataColW > 0 ? mDataColW : autoDataColW;
  const svgW = mDataColW > 0 ? labelColW + dataCols * dataColW : width;
  const radius = hm.cornerRadius;

  if (width <= 0) return null;
  if (rows.length === 0 || headers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Map a label column and at least one value column to see the heatmap.
      </div>
    );
  }

  // ── Text wrapping + box heights ──
  const wrap = (text: string, maxW: number, fs: number, ff: string, fw: string): string[] => {
    if (!hm.wrapText || maxW <= 4) return [text];
    return wrapText(text, maxW, fs, ff, fw);
  };
  const headerLineH = hm.headerFontSize * 1.3;
  const cellLineH = hm.cellFontSize * 1.3;
  const labelLineH = hm.labelFontSize * 1.3;

  const cornerDisplay = hm.headerUppercase ? upperTr(cornerText) : cornerText;
  const cornerLines = wrap(cornerDisplay, labelColW - pad.x * 2, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);
  const headerDisplays = headers.map((h) => (hm.headerUppercase ? upperTr(h) : h));
  const headerLines = headerDisplays.map((h) => wrap(h, dataColW - pad.x * 2, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight));
  const totalHeaderDisplay = hm.headerUppercase ? upperTr(hm.totalLabel) : hm.totalLabel;
  const totalHeaderLines = wrap(totalHeaderDisplay, dataColW - pad.x * 2, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);

  const headerContentLines = Math.max(
    cornerLines.length,
    ...headerLines.map((l) => l.length),
    hasColTotal ? totalHeaderLines.length : 1,
  );
  const headerH = mHeaderH > 0 ? mHeaderH : headerContentLines * headerLineH + pad.y * 2;

  const labelLinesByRow = rows.map((r) => wrap(r.label, labelColW - dotSpace - pad.x * 2, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight));
  const cellTextByRow = rows.map((r) => r.values.map((v) => fmt(v)));
  const cellLinesByRow = cellTextByRow.map((vals) => vals.map((t) => wrap(t, dataColW - pad.x * 2, hm.cellFontSize, hm.cellFontFamily, hm.cellFontWeight)));
  const totalCellText = rows.map((_, ri) => (totals[ri] == null ? DASH : fmtVal(totals[ri] as number)));
  const totalCellLines = totalCellText.map((t) => wrap(t, dataColW - pad.x * 2, hm.cellFontSize, hm.cellFontFamily, hm.cellFontWeight));

  let rowContentH = 0;
  rows.forEach((_, ri) => {
    const lblH = labelLinesByRow[ri].length * labelLineH;
    let cH = 0;
    cellLinesByRow[ri].forEach((lines) => {
      cH = Math.max(cH, lines.length * cellLineH);
    });
    if (hasColTotal) cH = Math.max(cH, totalCellLines[ri].length * cellLineH);
    rowContentH = Math.max(rowContentH, lblH, cH);
  });

  // Totals row content (when row totals are shown)
  const trLabelLines = hasRowTotal ? wrap(hm.totalLabel, labelColW - dotSpace - pad.x * 2, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight) : [];
  const colSumText = colSums.map((cs) => (cs == null ? DASH : fmtVal(cs)));
  const colSumLines = colSumText.map((t) => wrap(t, dataColW - pad.x * 2, hm.cellFontSize, hm.cellFontFamily, hm.cellFontWeight));
  const grandText = grandTotal == null ? DASH : fmtVal(grandTotal);
  const grandLines = wrap(grandText, dataColW - pad.x * 2, hm.cellFontSize, hm.cellFontFamily, hm.cellFontWeight);
  if (hasRowTotal) {
    rowContentH = Math.max(rowContentH, trLabelLines.length * labelLineH);
    colSumLines.forEach((lines) => {
      rowContentH = Math.max(rowContentH, lines.length * cellLineH);
    });
    if (hasColTotal) rowContentH = Math.max(rowContentH, grandLines.length * cellLineH);
  }

  const rowH = mRowH > 0 ? mRowH : rowContentH + pad.y * 2;
  const totalGridRows = rows.length + (hasRowTotal ? 1 : 0);
  const svgH = headerH + totalGridRows * rowH;

  const clipId = 'hm-clip';
  const borderStroke = hm.borderShow ? hm.borderColor : 'none';
  const dashArray = hm.borderStyle === 'dashed' ? `${hm.borderWidth * 3} ${hm.borderWidth * 2}` : undefined;

  const colX = (i: number) => labelColW + i * dataColW;
  const textX = (boxX: number, boxW: number, align: HeatmapAlign) =>
    align === 'left' ? boxX + pad.x : align === 'right' ? boxX + boxW - pad.x : boxX + boxW / 2;

  // Render one (possibly multi-line) text block, vertically centred in its box.
  const renderLines = (
    lines: string[],
    cx: number,
    cyc: number,
    lineH: number,
    anchor: 'start' | 'middle' | 'end',
    style: React.CSSProperties,
    keyP: string,
  ): React.ReactNode[] => {
    const startY = cyc - ((lines.length - 1) * lineH) / 2;
    return lines.map((ln, i) => (
      <text key={`${keyP}-${i}`} x={cx} y={startY + i * lineH} dy="0.35em" textAnchor={anchor} style={style}>
        {ln}
      </text>
    ));
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: hm.headerFontFamily,
    fontSize: hm.headerFontSize,
    fontWeight: fontWeightToCSS(hm.headerFontWeight),
    fill: hm.headerColor,
    letterSpacing: hm.headerLetterSpacing ? `${hm.headerLetterSpacing}px` : undefined,
  };
  const headerStyleBold: React.CSSProperties = { ...headerStyle, fontWeight: 700 };
  const labelStyle: React.CSSProperties = {
    fontFamily: hm.labelFontFamily,
    fontSize: hm.labelFontSize,
    fontWeight: fontWeightToCSS(hm.labelFontWeight),
    fill: hm.labelColor,
  };
  const labelStyleBold: React.CSSProperties = { ...labelStyle, fontWeight: 700 };
  const cellStyle = (isDash: boolean): React.CSSProperties => ({
    fontFamily: hm.cellFontFamily,
    fontSize: hm.cellFontSize,
    fontWeight: fontWeightToCSS(hm.cellFontWeight),
    fill: isDash ? hm.dashColor : hm.cellColor,
    fontVariantNumeric: 'tabular-nums',
  });
  const totalStyle = (isDash: boolean): React.CSSProperties => ({
    fontFamily: hm.cellFontFamily,
    fontSize: hm.cellFontSize,
    fontWeight: 700,
    fill: isDash ? hm.dashColor : hm.cellColor,
    fontVariantNumeric: 'tabular-nums',
  });

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
              return <rect key={`bg-${ri}-${ci}`} x={colX(ci)} y={headerH + ri * rowH} width={dataColW} height={rowH} fill={bg} />;
            }),
          )}

          {/* Grid lines */}
          {hm.borderShow && (
            <g stroke={hm.borderColor} strokeWidth={hm.borderWidth} strokeDasharray={dashArray}>
              {Array.from({ length: totalGridRows + 1 }).map((_, i) => {
                const y = headerH + i * rowH;
                return <line key={`h-${i}`} x1={0} y1={y} x2={svgW} y2={y} />;
              })}
              {Array.from({ length: dataCols + 1 }).map((_, i) => {
                const x = i === 0 ? labelColW : colX(i);
                return <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={svgH} />;
              })}
            </g>
          )}

          {/* ── Header texts ── */}
          {renderLines(cornerLines, textX(0, labelColW, hm.labelAlign), headerH / 2, headerLineH, anchorFor(hm.labelAlign), headerStyle, 'corner')}
          {headerLines.map((lines, ci) =>
            renderLines(lines, textX(colX(ci), dataColW, hm.headerAlign), headerH / 2, headerLineH, anchorFor(hm.headerAlign), headerStyle, `hdr-${ci}`),
          )}
          {hasColTotal &&
            renderLines(totalHeaderLines, textX(colX(headers.length), dataColW, hm.headerAlign), headerH / 2, headerLineH, anchorFor(hm.headerAlign), headerStyleBold, 'thdr')}

          {/* ── Body rows ── */}
          {rows.map((r, ri) => {
            const cy = headerH + ri * rowH + rowH / 2;
            const labelStartX = pad.x + dotSpace;
            const labelAnchorX =
              hm.labelAlign === 'left' ? labelStartX : hm.labelAlign === 'right' ? labelColW - pad.x : (labelStartX + labelColW - pad.x) / 2;
            return (
              <g key={`row-${ri}`}>
                {hm.showRowDots && (
                  <rect x={pad.x} y={cy - dotSize / 2} width={dotSize} height={dotSize} rx={hm.dotRadius} ry={hm.dotRadius} fill={rowColors[ri]} />
                )}
                {renderLines(labelLinesByRow[ri], labelAnchorX, cy, labelLineH, anchorFor(hm.labelAlign), labelStyle, `lbl-${ri}`)}
                {r.values.map((v, ci) => {
                  const isDash = cellTextByRow[ri][ci] === DASH;
                  return renderLines(
                    cellLinesByRow[ri][ci],
                    textX(colX(ci), dataColW, hm.valueAlign),
                    cy,
                    cellLineH,
                    anchorFor(hm.valueAlign),
                    cellStyle(isDash),
                    `v-${ri}-${ci}`,
                  );
                })}
                {hasColTotal &&
                  renderLines(
                    totalCellLines[ri],
                    textX(colX(headers.length), dataColW, hm.valueAlign),
                    cy,
                    cellLineH,
                    anchorFor(hm.valueAlign),
                    totalStyle(totals[ri] == null),
                    `tc-${ri}`,
                  )}
              </g>
            );
          })}

          {/* ── Totals row (column sums) ── */}
          {hasRowTotal && (() => {
            const tri = rows.length;
            const cy = headerH + tri * rowH + rowH / 2;
            const labelStartX = pad.x + dotSpace;
            const labelAnchorX =
              hm.labelAlign === 'left' ? labelStartX : hm.labelAlign === 'right' ? labelColW - pad.x : (labelStartX + labelColW - pad.x) / 2;
            return (
              <g key="totals-row">
                {/* no dot on the totals row */}
                {renderLines(trLabelLines, labelAnchorX, cy, labelLineH, anchorFor(hm.labelAlign), labelStyleBold, 'trow-lbl')}
                {colSumLines.map((lines, ci) =>
                  renderLines(
                    lines,
                    textX(colX(ci), dataColW, hm.valueAlign),
                    cy,
                    cellLineH,
                    anchorFor(hm.valueAlign),
                    totalStyle(colSums[ci] == null),
                    `trow-c-${ci}`,
                  ),
                )}
                {hasColTotal &&
                  renderLines(
                    grandLines,
                    textX(colX(headers.length), dataColW, hm.valueAlign),
                    cy,
                    cellLineH,
                    anchorFor(hm.valueAlign),
                    totalStyle(grandTotal == null),
                    'trow-grand',
                  )}
              </g>
            );
          })()}
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
