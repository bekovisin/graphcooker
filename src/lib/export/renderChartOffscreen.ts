/**
 * Offscreen chart renderer for export (dashboard bulk + editor).
 *
 * Renders a CustomBarChart into a hidden container, then injects
 * header / question / footer content directly into the SVG as native
 * SVG elements (text, rect). This means export functions can extract
 * a single SVG that contains everything — no foreignObject needed,
 * so PNG / SVG / PDF pipelines all work.
 */

import { ChartSettings, ColumnMapping, QuestionSettings } from '@/types/chart';
import { DataRow } from '@/types/data';

interface RenderResult {
  container: HTMLElement;
  cleanup: () => void;
}

interface RenderOptions {
  width: number;
  height?: number;
  transparent?: boolean;
  /** Original canvas width — used for question measurement so its layout
   *  stays identical to the canvas regardless of the export dimensions. */
  canvasWidth?: number;
}

/* ── helpers ── */

function hasContent(html: string): boolean {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

/** Strip HTML tags → plain text, preserving paragraph breaks as \n */
function stripHtml(html: string): string {
  if (!html) return '';
  // Insert newlines before block-level closing tags so paragraphs are preserved
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  // Strip remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = text;
  text = div.textContent || div.innerText || text;
  // Collapse 3+ consecutive newlines → 2, and trim trailing whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

/** Measure text width using a canvas context */
function measureText(text: string, fontSize: number, fontFamily: string, fontWeight: number | string = 400): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

/** Word-wrap text to fit within maxWidth, returning lines */
function wrapTextToLines(text: string, maxWidth: number, fontSize: number, fontFamily: string, fontWeight: number | string = 400): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = measureText(testLine, fontSize, fontFamily, fontWeight);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

const NS = 'http://www.w3.org/2000/svg';

function createSvgText(
  text: string,
  x: number,
  y: number,
  opts: { fontSize: number; fontFamily: string; fontWeight: number | string; color: string; textAnchor?: string }
): SVGTextElement {
  const el = document.createElementNS(NS, 'text');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('font-size', String(opts.fontSize));
  el.setAttribute('font-family', opts.fontFamily);
  el.setAttribute('font-weight', String(opts.fontWeight));
  el.setAttribute('fill', opts.color);
  if (opts.textAnchor) el.setAttribute('text-anchor', opts.textAnchor);
  el.setAttribute('dominant-baseline', 'hanging');
  el.textContent = text;
  return el;
}

function createSvgRect(
  x: number, y: number, w: number, h: number, fill: string, rx = 0
): SVGRectElement {
  const el = document.createElementNS(NS, 'rect');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('width', String(w));
  el.setAttribute('height', String(h));
  el.setAttribute('fill', fill);
  if (rx) el.setAttribute('rx', String(rx));
  return el;
}

/** Alignment → SVG text-anchor */
function alignToAnchor(align: string): string {
  if (align === 'center') return 'middle';
  if (align === 'right') return 'end';
  return 'start';
}

/** Alignment → x position */
function alignToX(align: string, width: number, padL: number, padR: number): number {
  if (align === 'center') return width / 2;
  if (align === 'right') return width - padR;
  return padL;
}

/* ── Build question SVG group ── */

interface BlockMeasure {
  height: number;
  render: (g: SVGGElement, yStart: number) => void;
}

/**
 * Measure the question block height by rendering it as HTML in a hidden div,
 * exactly mirroring ChartPreview's QuestionBlock.  This gives the *true* pixel
 * height so the SVG layout matches the canvas 1-to-1.
 *
 * Returns { totalHeight, textHeight } where textHeight is the height of the
 * text section alone (used to position the subtext correctly).
 */
function measureQuestionHeightDOM(
  question: QuestionSettings,
  containerWidth: number
): { totalHeight: number; textHeight: number } {
  const hasText_ = hasContent(question.text);
  const hasSubtext_ = hasContent(question.subtext);
  if (!hasText_ && !hasSubtext_) return { totalHeight: 0, textHeight: 0 };

  const td = question.textDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#333333', lineHeight: 1.3 };
  const sd = question.subtextDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666666', lineHeight: 1.4 };
  const accentLine = question.accentLine;
  const showAccent = accentLine?.show;

  // Hidden container at the exact canvas width
  const outer = document.createElement('div');
  outer.style.cssText = `position:fixed;left:-9999px;top:0;width:${containerWidth}px;opacity:0;pointer-events:none;`;

  // Build content div (same as ChartPreview's QuestionBlock "content" variable)
  const contentDiv = document.createElement('div');
  contentDiv.style.textAlign = question.alignment || 'left';
  contentDiv.style.flex = '1';

  let textDivEl: HTMLElement | null = null;
  if (hasText_) {
    textDivEl = document.createElement('div');
    textDivEl.style.cssText = [
      `font-family:${td.fontFamily}`,
      `font-size:${td.fontSize}px`,
      `color:${td.color}`,
      `line-height:${td.lineHeight}`,
      `padding-top:${question.paddingTop || 0}px`,
      `padding-right:${question.paddingRight || 0}px`,
      `padding-bottom:${question.paddingBottom || 0}px`,
      `padding-left:${question.paddingLeft || 0}px`,
    ].join(';');
    textDivEl.innerHTML = question.text;
    contentDiv.appendChild(textDivEl);
  }

  if (hasSubtext_) {
    const subtextDiv = document.createElement('div');
    subtextDiv.style.cssText = [
      `font-family:${sd.fontFamily}`,
      `font-size:${sd.fontSize}px`,
      `color:${sd.color}`,
      `line-height:${sd.lineHeight}`,
      `padding-top:${question.subtextPaddingTop || 0}px`,
      `padding-right:${question.subtextPaddingRight || 0}px`,
      `padding-bottom:${question.subtextPaddingBottom || 0}px`,
      `padding-left:${question.subtextPaddingLeft || 0}px`,
    ].join(';');
    subtextDiv.innerHTML = question.subtext;
    contentDiv.appendChild(subtextDiv);
  }

  if (showAccent) {
    const flexDiv = document.createElement('div');
    flexDiv.style.cssText = 'display:flex;align-items:stretch;';
    const accentDiv = document.createElement('div');
    accentDiv.style.cssText = [
      `width:${accentLine.width}px`,
      `min-width:${accentLine.width}px`,
      `background-color:${accentLine.color}`,
      `border-radius:${accentLine.borderRadius || 0}px`,
      `margin-top:${accentLine.paddingTop || 0}px`,
      `margin-right:${accentLine.paddingRight || 0}px`,
      `margin-bottom:${accentLine.paddingBottom || 0}px`,
      `margin-left:${accentLine.paddingLeft || 0}px`,
      'flex-shrink:0',
    ].join(';');
    flexDiv.appendChild(accentDiv);
    flexDiv.appendChild(contentDiv);
    outer.appendChild(flexDiv);
  } else {
    outer.appendChild(contentDiv);
  }

  document.body.appendChild(outer);
  const totalHeight = outer.offsetHeight;
  const textHeight = textDivEl ? textDivEl.offsetHeight : 0;
  document.body.removeChild(outer);

  return { totalHeight, textHeight };
}

/**
 * Measure and prepare question block for SVG rendering.
 *
 * @param question   – question settings
 * @param questionW  – width to use for text wrapping & positioning (canvas width)
 */
function measureQuestionBlock(question: QuestionSettings, questionW: number): BlockMeasure | null {
  const hasText = hasContent(question.text);
  const hasSubtext = hasContent(question.subtext);
  if (!hasText && !hasSubtext) return null;

  const td = question.textDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#333333', lineHeight: 1.3 };
  const sd = question.subtextDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666666', lineHeight: 1.4 };
  const accentLine = question.accentLine;
  const showAccent = accentLine?.show;
  const align = question.alignment || 'left';

  const accentW = showAccent ? (accentLine.width + (accentLine.paddingLeft || 0) + (accentLine.paddingRight || 0)) : 0;
  const contentW = questionW - accentW;

  const padT = question.paddingTop || 0;
  const padR = question.paddingRight || 0;
  const padB = question.paddingBottom || 0;
  const padL = question.paddingLeft || 0;

  // Wrap text into paragraph groups (each paragraph wrapped independently)
  const textParagraphs: string[][] = [];
  if (hasText) {
    const plainText = stripHtml(question.text);
    const availW = contentW - padL - padR;
    const wrapW = availW > 0 ? availW : questionW;
    for (const para of plainText.split('\n')) {
      const trimmed = para.trim();
      if (trimmed) textParagraphs.push(wrapTextToLines(trimmed, wrapW, td.fontSize, td.fontFamily));
    }
  }

  const spadT = question.subtextPaddingTop || 0;
  const spadR = question.subtextPaddingRight || 0;
  const spadB = question.subtextPaddingBottom || 0;
  const spadL = question.subtextPaddingLeft || 0;

  const subtextParagraphs: string[][] = [];
  if (hasSubtext) {
    const plainSubtext = stripHtml(question.subtext);
    const availW = contentW - spadL - spadR;
    const wrapW = availW > 0 ? availW : questionW;
    for (const para of plainSubtext.split('\n')) {
      const trimmed = para.trim();
      if (trimmed) subtextParagraphs.push(wrapTextToLines(trimmed, wrapW, sd.fontSize, sd.fontFamily));
    }
  }

  // Use DOM measurement for accurate height (matches ChartPreview exactly)
  const domMeasure = measureQuestionHeightDOM(question, questionW);
  const totalH = domMeasure.totalHeight;

  // Calculate paragraph gap for SVG text by comparing DOM height vs flat line height.
  // The browser adds ~1em of collapsed margin between <p> tags which SVG doesn't have.
  const textLineCount = textParagraphs.reduce((sum, p) => sum + p.length, 0);
  const totalTextLineLH = textLineCount * (td.fontSize * td.lineHeight);
  const domTextContentH = Math.max(0, domMeasure.textHeight - padT - padB);
  const textParaGap = textParagraphs.length > 1 && domTextContentH > totalTextLineLH
    ? (domTextContentH - totalTextLineLH) / (textParagraphs.length - 1)
    : 0;

  const subtextLineCount = subtextParagraphs.reduce((sum, p) => sum + p.length, 0);
  const totalSubtextLineLH = subtextLineCount * (sd.fontSize * sd.lineHeight);
  const domSubtextH = Math.max(0, totalH - domMeasure.textHeight);
  const domSubtextContentH = Math.max(0, domSubtextH - spadT - spadB);
  const subtextParaGap = subtextParagraphs.length > 1 && domSubtextContentH > totalSubtextLineLH
    ? (domSubtextContentH - totalSubtextLineLH) / (subtextParagraphs.length - 1)
    : 0;

  return {
    height: totalH,
    render: (g, yStart) => {
      const contentX = accentW;

      // Accent line
      if (showAccent && totalH > 0) {
        const aTop = accentLine.paddingTop || 0;
        const aBottom = accentLine.paddingBottom || 0;
        const aLeft = accentLine.paddingLeft || 0;
        g.appendChild(createSvgRect(
          aLeft, yStart + aTop,
          accentLine.width,
          totalH - aTop - aBottom,
          accentLine.color,
          accentLine.borderRadius
        ));
      }

      // Text
      if (hasText && textParagraphs.length > 0) {
        const anchor = alignToAnchor(align);
        const baseX = contentX + alignToX(align, contentW, padL, padR);
        let cy = yStart + padT;
        for (let pi = 0; pi < textParagraphs.length; pi++) {
          if (pi > 0) cy += textParaGap;
          for (const line of textParagraphs[pi]) {
            g.appendChild(createSvgText(line, baseX, cy, {
              fontSize: td.fontSize,
              fontFamily: td.fontFamily,
              fontWeight: 400,
              color: td.color,
              textAnchor: anchor,
            }));
            cy += td.fontSize * td.lineHeight;
          }
        }
      }

      // Subtext — positioned after the DOM-measured text height
      if (hasSubtext && subtextParagraphs.length > 0) {
        const anchor = alignToAnchor(align);
        const baseX = contentX + alignToX(align, contentW, spadL, spadR);
        let cy = yStart + domMeasure.textHeight + spadT;
        for (let pi = 0; pi < subtextParagraphs.length; pi++) {
          if (pi > 0) cy += subtextParaGap;
          for (const line of subtextParagraphs[pi]) {
            g.appendChild(createSvgText(line, baseX, cy, {
              fontSize: sd.fontSize,
              fontFamily: sd.fontFamily,
              fontWeight: 400,
              color: sd.color,
              textAnchor: anchor,
            }));
            cy += sd.fontSize * sd.lineHeight;
          }
        }
      }
    },
  };
}

/* ── Build header SVG ── */

function measureHeaderBlock(settings: ChartSettings, svgW: number): BlockMeasure | null {
  if (!settings.header.title && !settings.header.subtitle && !settings.header.text) return null;

  const padX = 24;
  const padTop = 20;
  const availW = svgW - padX * 2;
  const align = settings.header.alignment || 'left';

  let h = padTop;
  const items: { lines: string[]; style: { fontSize: number; fontFamily: string; fontWeight: number; color: string; lineHeight: number } }[] = [];

  if (settings.header.title) {
    const s = settings.header.titleStyling;
    const fw = s.fontWeight === 'bold' ? 700 : 400;
    const lines = wrapTextToLines(settings.header.title, availW, s.fontSize, s.fontFamily, fw);
    items.push({ lines, style: { fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: fw, color: s.color, lineHeight: s.lineHeight } });
    h += lines.length * (s.fontSize * s.lineHeight) + 4;
  }
  if (settings.header.subtitle) {
    const s = settings.header.subtitleStyling;
    const fw = s.fontWeight === 'bold' ? 700 : 400;
    const lines = wrapTextToLines(settings.header.subtitle, availW, s.fontSize, s.fontFamily, fw);
    items.push({ lines, style: { fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: fw, color: s.color, lineHeight: s.lineHeight } });
    h += lines.length * (s.fontSize * s.lineHeight) + 4;
  }
  if (settings.header.text) {
    const s = settings.header.textStyling;
    const fw = s.fontWeight === 'bold' ? 700 : 400;
    const lines = wrapTextToLines(settings.header.text, availW, s.fontSize, s.fontFamily, fw);
    items.push({ lines, style: { fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: fw, color: s.color, lineHeight: s.lineHeight } });
    h += lines.length * (s.fontSize * s.lineHeight);
  }

  return {
    height: h,
    render: (g, yStart) => {
      // Header border
      const border = settings.header.border;
      if (border === 'top' || border === 'both') {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('y1', String(yStart));
        line.setAttribute('x2', String(svgW)); line.setAttribute('y2', String(yStart));
        line.setAttribute('stroke', '#e5e7eb'); line.setAttribute('stroke-width', '2');
        g.appendChild(line);
      }

      const anchor = alignToAnchor(align);
      const baseX = alignToX(align, svgW, padX, padX);
      let cy = yStart + padTop;

      for (const item of items) {
        for (const line of item.lines) {
          g.appendChild(createSvgText(line, baseX, cy, {
            fontSize: item.style.fontSize,
            fontFamily: item.style.fontFamily,
            fontWeight: item.style.fontWeight,
            color: item.style.color,
            textAnchor: anchor,
          }));
          cy += item.style.fontSize * item.style.lineHeight;
        }
        cy += 4; // gap between header items
      }

      if (border === 'bottom' || border === 'both') {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('y1', String(yStart + h));
        line.setAttribute('x2', String(svgW)); line.setAttribute('y2', String(yStart + h));
        line.setAttribute('stroke', '#e5e7eb'); line.setAttribute('stroke-width', '2');
        g.appendChild(line);
      }
    },
  };
}

/* ── Build footer SVG ── */

function measureFooterBlock(settings: ChartSettings, svgW: number): BlockMeasure | null {
  if (!settings.footer.sourceName && !settings.footer.notePrimary) return null;

  const padX = 24;
  const padTop = 8;
  const padBottom = 16;
  const align = settings.footer.alignment || 'left';
  const availW = svgW - padX * 2;

  let h = padTop;
  const items: { lines: string[]; fontSize: number; color: string; opacity: number }[] = [];

  if (settings.footer.sourceName) {
    const text = `${settings.footer.sourceLabel}: ${settings.footer.sourceName}`;
    const lines = wrapTextToLines(text, availW, settings.footer.size, 'Inter, sans-serif');
    items.push({ lines, fontSize: settings.footer.size, color: settings.footer.color, opacity: 1 });
    h += lines.length * (settings.footer.size * 1.4);
  }
  if (settings.footer.notePrimary) {
    const fs = settings.footer.size - 1;
    const lines = wrapTextToLines(settings.footer.notePrimary, availW, fs, 'Inter, sans-serif');
    items.push({ lines, fontSize: fs, color: settings.footer.color, opacity: 0.8 });
    h += 4 + lines.length * (fs * 1.4);
  }

  h += padBottom;

  return {
    height: h,
    render: (g, yStart) => {
      const border = settings.footer.border;
      if (border === 'top' || border === 'both') {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('y1', String(yStart));
        line.setAttribute('x2', String(svgW)); line.setAttribute('y2', String(yStart));
        line.setAttribute('stroke', '#e5e7eb'); line.setAttribute('stroke-width', '1');
        g.appendChild(line);
      }

      const anchor = alignToAnchor(align);
      const baseX = alignToX(align, svgW, padX, padX);
      let cy = yStart + padTop;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (i > 0) cy += 4;
        for (const line of item.lines) {
          const txt = createSvgText(line, baseX, cy, {
            fontSize: item.fontSize,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            color: item.color,
            textAnchor: anchor,
          });
          if (item.opacity < 1) txt.setAttribute('opacity', String(item.opacity));
          g.appendChild(txt);
          cy += item.fontSize * 1.4;
        }
      }

      if (border === 'bottom' || border === 'both') {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', '0'); line.setAttribute('y1', String(yStart + h));
        line.setAttribute('x2', String(svgW)); line.setAttribute('y2', String(yStart + h));
        line.setAttribute('stroke', '#e5e7eb'); line.setAttribute('stroke-width', '1');
        g.appendChild(line);
      }
    },
  };
}

/* ── Main offscreen renderer ── */

export async function renderChartOffscreen(
  settings: ChartSettings,
  data: DataRow[],
  columnMapping: ColumnMapping,
  options: RenderOptions,
  columnOrder?: string[],
  seriesNames?: Record<string, string>
): Promise<RenderResult> {
  const width = options.width || 800;

  // Pre-measure header, question, footer so we know how much extra SVG space
  const headerBlock = measureHeaderBlock(settings, width);
  const footerBlock = measureFooterBlock(settings, width);

  const question = settings.question;
  const hasQuestion = question && (hasContent(question.text) || hasContent(question.subtext));
  const questionPosition = question?.position || 'above';
  const isQuestionVertical = questionPosition === 'above' || questionPosition === 'below';

  // Measure question at the original canvas width so its layout stays
  // identical to the canvas — extra width/height goes only to the chart.
  const questionW = options.canvasWidth || width;
  let questionBlock: BlockMeasure | null = null;
  if (hasQuestion && isQuestionVertical) {
    questionBlock = measureQuestionBlock(question, questionW);
  }

  const topExtra = (headerBlock?.height || 0) + (questionPosition === 'above' ? (questionBlock?.height || 0) : 0);
  const bottomExtra = (footerBlock?.height || 0) + (questionPosition === 'below' ? (questionBlock?.height || 0) : 0);

  // Chart-only height
  const requestedHeight =
    options.height ||
    (settings.chartType.heightMode === 'auto'
      ? Math.max(300, data.length * 45 + 100)
      : settings.chartType.standardHeight) ||
    500;
  const chartHeight = requestedHeight - topExtra - bottomExtra;

  // Create off-screen wrapper
  const totalHeight = requestedHeight;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; left: 0; top: 0;
    width: ${width}px; height: ${totalHeight}px;
    opacity: 0; z-index: -9999; pointer-events: none; overflow: hidden;
  `;
  document.body.appendChild(wrapper);

  // Chart container — just holds the chart SVG
  const container = document.createElement('div');
  container.id = 'offscreen-chart-container';
  const bgColor = options.transparent ? 'transparent' : (settings.layout.backgroundColor || '#ffffff');
  container.style.cssText = `
    width: ${width}px; height: ${totalHeight}px;
    background-color: ${bgColor};
    overflow: hidden;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  wrapper.appendChild(container);

  // When transparent, force all backgrounds off so the chart renders without any bg rects
  const renderSettings = options.transparent
    ? {
        ...settings,
        layout: { ...settings.layout, backgroundColor: 'transparent', backgroundOpacity: 0 },
        plotBackground: { ...settings.plotBackground, backgroundColor: 'transparent', backgroundOpacity: 0 },
      }
    : settings;

  // Render CustomBarChart via React
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { CustomBarChart } = await import('@/components/chart/CustomBarChart');

  const reactRoot = createRoot(container);
  reactRoot.render(
    React.createElement(CustomBarChart, {
      data,
      columnMapping,
      settings: renderSettings,
      width: width > 0 ? width : 800,
      height: chartHeight > 0 ? chartHeight : undefined,
      columnOrder,
      seriesNames,
      skipAnimation: true,
    })
  );
  await new Promise((r) => setTimeout(r, 200));

  // ── Inject header / question / footer into the SVG ──
  const svgEl = container.querySelector('svg');

  // Explicitly set overflow hidden so serialised SVG clips content outside
  // the viewport (e.g. x-axis ticks that extend beyond the chart area).
  if (svgEl) {
    svgEl.setAttribute('overflow', 'hidden');
  }

  if (svgEl && (topExtra > 0 || bottomExtra > 0)) {
    const svgW = parseFloat(svgEl.getAttribute('width') || String(width));
    const svgH = parseFloat(svgEl.getAttribute('height') || String(chartHeight));
    const newH = svgH + topExtra + bottomExtra;

    // Expand SVG dimensions
    svgEl.setAttribute('viewBox', `0 0 ${svgW} ${newH}`);
    svgEl.setAttribute('width', String(svgW));
    svgEl.setAttribute('height', String(newH));

    // Move existing chart content down by topExtra
    const gWrap = document.createElementNS(NS, 'g');
    gWrap.setAttribute('transform', `translate(0, ${topExtra})`);
    while (svgEl.firstChild) gWrap.appendChild(svgEl.firstChild);
    svgEl.appendChild(gWrap);

    // Clip the chart group so nothing spills outside its allocated rectangle
    const clipId = 'chart-clip-' + Date.now();
    const clipPath = document.createElementNS(NS, 'clipPath');
    clipPath.setAttribute('id', clipId);
    clipPath.appendChild(createSvgRect(0, 0, svgW, svgH, 'black'));
    const defs = document.createElementNS(NS, 'defs');
    defs.appendChild(clipPath);
    svgEl.insertBefore(defs, svgEl.firstChild);
    gWrap.setAttribute('clip-path', `url(#${clipId})`);

    // Add background rect at full size (behind everything)
    if (!options.transparent) {
      const bgRect = createSvgRect(0, 0, svgW, newH, bgColor);
      svgEl.insertBefore(bgRect, gWrap);
    }

    // Create a group for header/question/footer
    const overlayG = document.createElementNS(NS, 'g');
    overlayG.setAttribute('class', 'export-overlay');

    // Render top blocks
    let y = 0;
    if (headerBlock) {
      headerBlock.render(overlayG, y);
      y += headerBlock.height;
    }
    if (questionPosition === 'above' && questionBlock) {
      questionBlock.render(overlayG, y);
      y += questionBlock.height;
    }

    // Render bottom blocks
    let bottomY = topExtra + svgH;
    if (questionPosition === 'below' && questionBlock) {
      questionBlock.render(overlayG, bottomY);
      bottomY += questionBlock.height;
    }
    if (footerBlock) {
      footerBlock.render(overlayG, bottomY);
    }

    svgEl.insertBefore(overlayG, gWrap);
  }

  // When transparent, ensure no background rects remain anywhere in the SVG.
  // The renderSettings already forces transparent bg on the React chart, but
  // as a safety net we also clear any full-size rects at the root or in the
  // first-level wrapper group (these are layout/plot backgrounds, not data bars).
  if (svgEl && options.transparent) {
    const svgW = parseFloat(svgEl.getAttribute('width') || String(width));

    const clearBackgroundRect = (rect: Element) => {
      rect.setAttribute('fill', 'none');
      rect.setAttribute('fill-opacity', '0');
      rect.removeAttribute('opacity');
    };

    // Clear any direct-child rects of the SVG root
    svgEl.querySelectorAll(':scope > rect').forEach(clearBackgroundRect);

    // Clear full-size rects at the top of the chart wrapper group (bg rects
    // are always the first children at x=0/y=0 covering the chart area)
    const gWrap = svgEl.querySelector('g[transform]');
    if (gWrap) {
      for (const child of Array.from(gWrap.children)) {
        if (child.tagName !== 'rect') break; // stop at first non-rect
        const rx = parseFloat(child.getAttribute('x') || '0');
        const ry = parseFloat(child.getAttribute('y') || '0');
        const rw = parseFloat(child.getAttribute('width') || '0');
        // Only clear if it's a full-width background rect (not a data bar)
        if (rx === 0 && ry === 0 && rw >= svgW * 0.9) {
          clearBackgroundRect(child);
        } else {
          break; // stop once we pass the background rects
        }
      }
    }
  }

  const cleanup = () => {
    try { reactRoot.unmount(); } catch { /* ignore */ }
    try { wrapper.remove(); } catch { /* ignore */ }
  };

  return { container, cleanup };
}
