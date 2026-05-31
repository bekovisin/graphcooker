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
        : { min: Math.min(...all), max: Math.max(...all), mean: all.reduce((a, b) => a + b, 0) / all.length };

    const rowColors = resolveColors(settings.colors, rows.map((r) => r.label), nameMap);
    const labelHeader = nameMap[labelCol] ?? labelCol ?? '';

    return { valueCols, rows, headers, totals, colSums, grandTotal, stats, rowColors, labelHeader };
  }, [data, columnMapping, seriesNames, settings.colors, hm.includeTotalInScale, hm.showTotals]);

  const { valueCols, rows, headers, totals, colSums, grandTotal, stats, rowColors, labelHeader } = model;
  const cornerText = hm.cornerLabel && hm.cornerLabel.trim() ? hm.cornerLabel : labelHeader;
  const hasColTotal = hm.showTotals && (hm.totalsMode === 'column' || hm.totalsMode === 'both');
  const hasRowTotal = hm.showTotals && (hm.totalsMode === 'row' || hm.totalsMode === 'both');

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

  // Number without the % sign (the % is rendered as its own sized tspan)
  const fmtNum = (v: number): string => formatNumber(v, nf, undefined, undefined, undefined, '', '');
  const fmtVal = (v: number): string => {
    if (hm.showPercent) {
      const base = fmtNum(v);
      return hm.percentPosition === 'left' ? `%${base}` : `${base}%`;
    }
    return formatNumber(v, nf);
  };
  const fmt = (v: number | null): string => {
    if (v == null) return DASH;
    if (hm.zeroAsDash && Math.abs(v) < 1e-9) return DASH;
    return fmtVal(v);
  };
  const isDashVal = (v: number | null): boolean => v == null || (hm.zeroAsDash && Math.abs(v) < 1e-9);

  // Per-series font sizes (overrides fall back to the defaults)
  const colHeaderFS = (ci: number) => {
    const ov = hm.perColHeaderFontSizes?.[valueCols[ci]];
    return ov && ov > 0 ? ov : hm.headerFontSize;
  };
  const rowLabelFS = (ri: number) => {
    const ov = hm.perRowLabelFontSizes?.[rows[ri].label];
    return ov && ov > 0 ? ov : hm.labelFontSize;
  };

  // ── Sizing mode ──
  const custom = hm.sizingMode === 'custom';
  const mHeaderH = custom ? hm.headerHeight : 0;
  const mRowH = custom ? hm.rowHeight : 0;
  const mLabelColW = custom ? hm.labelColWidth : 0;
  const mDataColW = custom ? hm.dataColWidth : 0;

  const pad = densityPad(hm.density);
  const dotSize = hm.dotSize;
  const dotGap = 8;
  const dotSpace = hm.showRowDots ? dotSize + dotGap : 0;
  const cellLineH = hm.cellFontSize * 1.3;
  const totalLineH = hm.totalFontSize * 1.3;
  // Per-series horizontal padding inside the header / label boxes (override → fit tighter text)
  const colHeaderPad = (ci: number) => {
    const ov = hm.perColHeaderPadding?.[valueCols[ci]];
    return ov != null ? ov : pad.x;
  };
  const rowLabelPad = (ri: number) => {
    const ov = hm.perRowLabelPadding?.[rows[ri].label];
    return ov != null ? ov : pad.x;
  };

  const labelColW = useMemo(() => {
    if (mLabelColW > 0) return mLabelColW;
    let maxW = measureTextWidth(upperTr(cornerText), hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);
    for (const r of rows) {
      const w = measureTextWidth(r.label, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight);
      if (w > maxW) maxW = w;
    }
    return Math.min(Math.max(maxW + dotSpace + pad.x * 2, 80), Math.max(120, width * 0.4));
  }, [mLabelColW, cornerText, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight, hm.labelFontSize, hm.labelFontFamily, hm.labelFontWeight, rows, dotSpace, pad.x, width]);

  const dataCols = headers.length + (hasColTotal ? 1 : 0);
  const baseColW = mDataColW > 0 ? mDataColW : dataCols > 0 ? (width - labelColW) / dataCols : 0;
  const radius = hm.cornerRadius;

  if (width <= 0) return null;
  if (rows.length === 0 || headers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Map a label column and at least one value column to see the heatmap.
      </div>
    );
  }

  // ── Variable column widths (per-column overrides + base) ──
  const colWidths: number[] = [];
  for (let ci = 0; ci < headers.length; ci++) {
    const ov = hm.perColWidths?.[valueCols[ci]];
    colWidths.push(ov && ov > 0 ? ov : baseColW);
  }
  if (hasColTotal) colWidths.push(baseColW);
  const colXOffsets: number[] = [];
  {
    let x = labelColW;
    for (const w of colWidths) {
      colXOffsets.push(x);
      x += w;
    }
  }
  const colX = (i: number) => colXOffsets[i];
  const colW = (i: number) => colWidths[i];
  const svgW = labelColW + colWidths.reduce((a, b) => a + b, 0);

  // ── Wrapping ──
  const wrap = (text: string, maxW: number, fs: number, ff: string, fw: string): string[] => {
    if (!hm.wrapText || maxW <= 4) return [text];
    return wrapText(text, maxW, fs, ff, fw);
  };

  const cornerDisplay = hm.headerUppercase ? upperTr(cornerText) : cornerText;
  const cornerLines = wrap(cornerDisplay, labelColW - pad.x * 2, hm.headerFontSize, hm.headerFontFamily, hm.headerFontWeight);
  const headerDisplays = headers.map((h) => (hm.headerUppercase ? upperTr(h) : h));
  const headerLines = headerDisplays.map((h, ci) => wrap(h, colW(ci) - colHeaderPad(ci) * 2, colHeaderFS(ci), hm.headerFontFamily, hm.headerFontWeight));
  const totalHeaderDisplay = hm.headerUppercase ? upperTr(hm.totalLabel) : hm.totalLabel;
  const totalHeaderLines = hasColTotal ? wrap(totalHeaderDisplay, colW(headers.length) - pad.x * 2, hm.totalFontSize, hm.headerFontFamily, hm.headerFontWeight) : [];

  // Header height
  const cornerLineH = hm.headerFontSize * 1.3;
  let headerContentH = cornerLines.length * cornerLineH;
  headerLines.forEach((lines, ci) => {
    headerContentH = Math.max(headerContentH, lines.length * colHeaderFS(ci) * 1.3);
  });
  if (hasColTotal) headerContentH = Math.max(headerContentH, totalHeaderLines.length * totalLineH);
  const headerH = mHeaderH > 0 ? mHeaderH : headerContentH + pad.y * 2;

  // Per-row label + cell lines
  const labelLinesByRow = rows.map((r, ri) => wrap(r.label, labelColW - dotSpace - rowLabelPad(ri) * 2, rowLabelFS(ri), hm.labelFontFamily, hm.labelFontWeight));
  const cellTextByRow = rows.map((r) => r.values.map((v) => fmt(v)));
  const cellLinesByRow = cellTextByRow.map((vals) => vals.map((t, ci) => wrap(t, colW(ci) - pad.x * 2, hm.cellFontSize, hm.cellFontFamily, hm.cellFontWeight)));
  const totalCellLines = rows.map((_, ri) =>
    hasColTotal ? wrap(totals[ri] == null ? DASH : fmtVal(totals[ri] as number), colW(headers.length) - pad.x * 2, hm.totalFontSize, hm.cellFontFamily, hm.cellFontWeight) : [],
  );

  // Per-row heights (overrides + auto-fit-content + custom)
  const dataRowHeights = rows.map((_, ri) => {
    const ov = hm.perRowHeights?.[rows[ri].label];
    if (ov && ov > 0) return ov;
    if (mRowH > 0) return mRowH;
    const lblH = labelLinesByRow[ri].length * rowLabelFS(ri) * 1.3;
    let cH = 0;
    cellLinesByRow[ri].forEach((lines) => {
      cH = Math.max(cH, lines.length * cellLineH);
    });
    if (hasColTotal) cH = Math.max(cH, totalCellLines[ri].length * totalLineH);
    return Math.max(lblH, cH) + pad.y * 2;
  });

  // Totals row
  const trLabelLines = hasRowTotal ? wrap(hm.totalLabel, labelColW - dotSpace - pad.x * 2, hm.totalFontSize, hm.labelFontFamily, hm.labelFontWeight) : [];
  const colSumLines = colSums.map((cs, ci) => wrap(cs == null ? DASH : fmtVal(cs), colW(ci) - pad.x * 2, hm.totalFontSize, hm.cellFontFamily, hm.cellFontWeight));
  const grandLines = hasColTotal ? wrap(grandTotal == null ? DASH : fmtVal(grandTotal), colW(headers.length) - pad.x * 2, hm.totalFontSize, hm.cellFontFamily, hm.cellFontWeight) : [];
  let trHeight = 0;
  if (hasRowTotal) {
    if (mRowH > 0) {
      trHeight = mRowH;
    } else {
      let h = trLabelLines.length * totalLineH;
      colSumLines.forEach((lines) => {
        h = Math.max(h, lines.length * totalLineH);
      });
      if (hasColTotal) h = Math.max(h, grandLines.length * totalLineH);
      trHeight = h + pad.y * 2;
    }
  }

  const rowHeights = [...dataRowHeights];
  if (hasRowTotal) rowHeights.push(trHeight);
  const rowYOffsets: number[] = [];
  {
    let y = headerH;
    for (const h of rowHeights) {
      rowYOffsets.push(y);
      y += h;
    }
  }
  const rowY = (ri: number) => rowYOffsets[ri];
  const rowH = (ri: number) => rowHeights[ri];
  const svgH = headerH + rowHeights.reduce((a, b) => a + b, 0);

  const clipId = 'hm-clip';
  const borderStroke = hm.borderShow ? hm.borderColor : 'none';
  const dashArray = hm.borderStyle === 'dashed' ? `${hm.borderWidth * 3} ${hm.borderWidth * 2}` : undefined;

  const textX = (boxX: number, boxW: number, align: HeatmapAlign, padding: number = pad.x) =>
    align === 'left' ? boxX + padding : align === 'right' ? boxX + boxW - padding : boxX + boxW / 2;

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

  // Render a numeric value; in percent mode the % sign is its own (sized) tspan.
  const renderValueLines = (
    v: number | null,
    lines: string[],
    cx: number,
    cyc: number,
    lineH: number,
    anchor: 'start' | 'middle' | 'end',
    style: React.CSSProperties,
    percentFS: number,
    keyP: string,
  ): React.ReactNode[] => {
    if (hm.showPercent && v != null && !isDashVal(v)) {
      const numStr = fmtNum(v);
      const pct = <tspan style={{ fontSize: percentFS }}>%</tspan>;
      return [
        <text key={keyP} x={cx} y={cyc} dy="0.35em" textAnchor={anchor} style={style}>
          {hm.percentPosition === 'left' ? (
            <>
              {pct}
              {numStr}
            </>
          ) : (
            <>
              {numStr}
              {pct}
            </>
          )}
        </text>,
      ];
    }
    return renderLines(lines, cx, cyc, lineH, anchor, style, keyP);
  };

  const headerStyleBase: React.CSSProperties = {
    fontFamily: hm.headerFontFamily,
    fontWeight: fontWeightToCSS(hm.headerFontWeight),
    fill: hm.headerColor,
    letterSpacing: hm.headerLetterSpacing ? `${hm.headerLetterSpacing}px` : undefined,
  };
  const labelStyleBase: React.CSSProperties = {
    fontFamily: hm.labelFontFamily,
    fontWeight: fontWeightToCSS(hm.labelFontWeight),
    fill: hm.labelColor,
  };
  const cellStyle = (isDash: boolean): React.CSSProperties => ({
    fontFamily: hm.cellFontFamily,
    fontSize: hm.cellFontSize,
    fontWeight: fontWeightToCSS(hm.cellFontWeight),
    fill: isDash ? hm.dashColor : hm.cellColor,
    fontVariantNumeric: 'tabular-nums',
  });
  // Total section uses its own colour + font size (bold)
  const totalTextStyle = (isDash: boolean): React.CSSProperties => ({
    fontFamily: hm.cellFontFamily,
    fontSize: hm.totalFontSize,
    fontWeight: 700,
    fill: isDash ? hm.dashColor : hm.totalColor,
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
              ri % 2 === 1 ? <rect key={`stripe-${ri}`} x={0} y={rowY(ri)} width={svgW} height={rowH(ri)} fill={hm.stripedColor} /> : null,
            )}

          {/* Heatmap cell backgrounds */}
          {rows.map((r, ri) =>
            r.values.map((v, ci) => {
              const bg = heatBg(v);
              if (!bg) return null;
              return <rect key={`bg-${ri}-${ci}`} x={colX(ci)} y={rowY(ri)} width={colW(ci)} height={rowH(ri)} fill={bg} />;
            }),
          )}

          {/* Grid lines */}
          {hm.borderShow && (
            <g stroke={hm.borderColor} strokeWidth={hm.borderWidth} strokeDasharray={dashArray}>
              {[headerH, ...rowYOffsets.map((y, i) => y + rowHeights[i])].map((y, i) => (
                <line key={`h-${i}`} x1={0} y1={y} x2={svgW} y2={y} />
              ))}
              {[labelColW, ...colXOffsets.map((x, i) => x + colWidths[i])].map((x, i) => (
                <line key={`v-${i}`} x1={x} y1={0} x2={x} y2={svgH} />
              ))}
            </g>
          )}

          {/* ── Header texts ── */}
          {renderLines(cornerLines, textX(0, labelColW, hm.labelAlign), headerH / 2, cornerLineH, anchorFor(hm.labelAlign), { ...headerStyleBase, fontSize: hm.headerFontSize }, 'corner')}
          {headerLines.map((lines, ci) =>
            renderLines(lines, textX(colX(ci), colW(ci), hm.headerAlign, colHeaderPad(ci)), headerH / 2, colHeaderFS(ci) * 1.3, anchorFor(hm.headerAlign), { ...headerStyleBase, fontSize: colHeaderFS(ci) }, `hdr-${ci}`),
          )}
          {hasColTotal &&
            renderLines(totalHeaderLines, textX(colX(headers.length), colW(headers.length), hm.headerAlign), headerH / 2, totalLineH, anchorFor(hm.headerAlign), { ...headerStyleBase, fontSize: hm.totalFontSize, fill: hm.totalColor, fontWeight: 700 }, 'thdr')}

          {/* ── Body rows ── */}
          {rows.map((r, ri) => {
            const cy = rowY(ri) + rowH(ri) / 2;
            const lp = rowLabelPad(ri);
            const labelStartX = lp + dotSpace;
            const labelAnchorX =
              hm.labelAlign === 'left' ? labelStartX : hm.labelAlign === 'right' ? labelColW - lp : (labelStartX + labelColW - lp) / 2;
            const labelStyle = { ...labelStyleBase, fontSize: rowLabelFS(ri) };
            return (
              <g key={`row-${ri}`}>
                {hm.showRowDots && <rect x={pad.x} y={cy - dotSize / 2} width={dotSize} height={dotSize} rx={hm.dotRadius} ry={hm.dotRadius} fill={rowColors[ri]} />}
                {renderLines(labelLinesByRow[ri], labelAnchorX, cy, rowLabelFS(ri) * 1.3, anchorFor(hm.labelAlign), labelStyle, `lbl-${ri}`)}
                {r.values.map((v, ci) =>
                  renderValueLines(v, cellLinesByRow[ri][ci], textX(colX(ci), colW(ci), hm.valueAlign), cy, cellLineH, anchorFor(hm.valueAlign), cellStyle(cellTextByRow[ri][ci] === DASH), hm.percentFontSize, `v-${ri}-${ci}`),
                )}
                {hasColTotal &&
                  renderValueLines(totals[ri], totalCellLines[ri], textX(colX(headers.length), colW(headers.length), hm.valueAlign), cy, totalLineH, anchorFor(hm.valueAlign), totalTextStyle(totals[ri] == null), hm.totalPercentFontSize, `tc-${ri}`)}
              </g>
            );
          })}

          {/* ── Totals row (column sums, no dot) ── */}
          {hasRowTotal && (() => {
            const tri = rows.length;
            const cy = rowY(tri) + rowH(tri) / 2;
            const labelStartX = pad.x + dotSpace;
            const labelAnchorX =
              hm.labelAlign === 'left' ? labelStartX : hm.labelAlign === 'right' ? labelColW - pad.x : (labelStartX + labelColW - pad.x) / 2;
            return (
              <g key="totals-row">
                {renderLines(trLabelLines, labelAnchorX, cy, totalLineH, anchorFor(hm.labelAlign), { ...labelStyleBase, fontSize: hm.totalFontSize, fill: hm.totalColor, fontWeight: 700 }, 'trow-lbl')}
                {colSumLines.map((lines, ci) =>
                  renderValueLines(colSums[ci], lines, textX(colX(ci), colW(ci), hm.valueAlign), cy, totalLineH, anchorFor(hm.valueAlign), totalTextStyle(colSums[ci] == null), hm.totalPercentFontSize, `trow-c-${ci}`),
                )}
                {hasColTotal &&
                  renderValueLines(grandTotal, grandLines, textX(colX(headers.length), colW(headers.length), hm.valueAlign), cy, totalLineH, anchorFor(hm.valueAlign), totalTextStyle(grandTotal == null), hm.totalPercentFontSize, 'trow-grand')}
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
