/**
 * Offscreen chart renderer for export (dashboard bulk + editor).
 *
 * Renders a CustomBarChart into a hidden container, then injects
 * header / question / footer content directly into the SVG as native
 * SVG elements (text, rect, tspan). This means export functions can
 * extract a single SVG that contains everything — no foreignObject
 * needed, so PNG / SVG / PDF pipelines all work.
 *
 * Question text uses DOM-based line wrapping (browser-accurate) and
 * preserves inline formatting (bold, italic) via SVG <tspan> elements.
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

/* ── Formatted text types & helpers for question block ── */

interface TextSegment {
  text: string;
  fontWeight: number | string;
  fontStyle: string; // 'normal' | 'italic'
}

interface WrappedLine {
  segments: TextSegment[];
}

/** Parse HTML into separate paragraph HTML strings (inner content of each <p>) */
function parseHtmlParagraphs(html: string): string[] {
  if (!html) return [];

  // Match <p>...</p> blocks
  const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (pMatches && pMatches.length > 0) {
    return pMatches
      .map(p => p.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, ''))
      .filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
  }

  // No <p> tags — split by <br> or treat as single block
  const parts = html.split(/<br\s*\/?>/gi);
  return parts.filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
}

/**
 * DOM-based line wrapping that preserves inline formatting (bold, italic).
 *
 * Renders HTML in a hidden div at the exact width with the exact font settings,
 * then walks text nodes character-by-character using Range.getClientRects() to
 * determine where the browser breaks lines.  The result is an array of
 * WrappedLine objects, each containing TextSegments with formatting metadata.
 *
 * This matches the browser's text layout exactly — unlike canvas.measureText(),
 * which uses different kerning and shaping rules.
 */
function wrapHtmlToFormattedLines(
  html: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  lineHeight: number | string,
  baseFontWeight: number | string = 400
): WrappedLine[] {
  if (!html || !html.replace(/<[^>]*>/g, '').trim()) return [];

  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0', 'opacity:0', 'pointer-events:none',
    `width:${maxWidth}px`,
    `font-family:${fontFamily}`,
    `font-size:${fontSize}px`,
    `font-weight:${baseFontWeight}`,
    `line-height:${lineHeight}`,
    'white-space:normal',
    'word-wrap:break-word',
    'overflow-wrap:break-word',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  // Collect all text nodes with their formatting context
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  interface CharData {
    node: Text;
    offset: number;
    bold: boolean;
    italic: boolean;
  }

  const chars: CharData[] = [];
  let textNode: Text | null;

  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.textContent;
    if (!text) continue;

    // Determine formatting from ancestor elements
    let bold = false;
    let italic = false;
    let parent: Node | null = textNode.parentNode;
    while (parent && parent !== container) {
      if (parent instanceof HTMLElement) {
        const tag = parent.tagName.toLowerCase();
        if (tag === 'strong' || tag === 'b') bold = true;
        if (tag === 'em' || tag === 'i') italic = true;
      }
      parent = parent.parentNode;
    }

    for (let i = 0; i < text.length; i++) {
      chars.push({ node: textNode, offset: i, bold, italic });
    }
  }

  if (chars.length === 0) {
    document.body.removeChild(container);
    return [];
  }

  const range = document.createRange();
  const lines: WrappedLine[] = [];
  let currentY: number | null = null;
  let segText = '';
  let segBold = chars[0].bold;
  let segItalic = chars[0].italic;
  let lineSegments: TextSegment[] = [];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const nodeText = c.node.textContent || '';
    range.setStart(c.node, c.offset);
    range.setEnd(c.node, Math.min(c.offset + 1, nodeText.length));
    const rects = range.getClientRects();

    if (rects.length === 0) {
      // Collapsed whitespace — keep in current segment
      segText += nodeText[c.offset];
      continue;
    }

    const y = Math.round(rects[0].top);
    if (currentY === null) currentY = y;

    // Line break when Y position changes significantly
    if (Math.abs(y - currentY) > 2) {
      if (segText) {
        lineSegments.push({
          text: segText,
          fontWeight: segBold ? 700 : 400,
          fontStyle: segItalic ? 'italic' : 'normal',
        });
      }
      if (lineSegments.length > 0) {
        lines.push({ segments: trimLineSegments(lineSegments) });
      }
      lineSegments = [];
      segText = '';
      currentY = y;
      segBold = c.bold;
      segItalic = c.italic;
    }

    // Formatting change within the same line
    if (c.bold !== segBold || c.italic !== segItalic) {
      if (segText) {
        lineSegments.push({
          text: segText,
          fontWeight: segBold ? 700 : 400,
          fontStyle: segItalic ? 'italic' : 'normal',
        });
      }
      segText = '';
      segBold = c.bold;
      segItalic = c.italic;
    }

    segText += nodeText[c.offset];
  }

  // Flush remaining segment and line
  if (segText) {
    lineSegments.push({
      text: segText,
      fontWeight: segBold ? 700 : 400,
      fontStyle: segItalic ? 'italic' : 'normal',
    });
  }
  if (lineSegments.length > 0) {
    lines.push({ segments: trimLineSegments(lineSegments) });
  }

  document.body.removeChild(container);
  return lines;
}

/** Trim leading/trailing whitespace from a line's segments */
function trimLineSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length === 0) return segments;
  const out = segments.map(s => ({ ...s }));
  out[0].text = out[0].text.replace(/^\s+/, '');
  out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '');
  return out.filter(s => s.text.length > 0);
}

/** Create SVG <text> element with formatted <tspan> children for bold/italic */
function createFormattedSvgText(
  line: WrappedLine,
  x: number,
  y: number,
  opts: { fontSize: number; fontFamily: string; color: string; textAnchor?: string }
): SVGTextElement {
  const el = document.createElementNS(NS, 'text');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('font-size', String(opts.fontSize));
  el.setAttribute('font-family', opts.fontFamily);
  el.setAttribute('fill', opts.color);
  if (opts.textAnchor) el.setAttribute('text-anchor', opts.textAnchor);
  el.setAttribute('dominant-baseline', 'hanging');

  for (const seg of line.segments) {
    const needsTspan =
      (seg.fontWeight && seg.fontWeight !== 400) ||
      (seg.fontStyle && seg.fontStyle !== 'normal');

    if (needsTspan) {
      const tspan = document.createElementNS(NS, 'tspan');
      if (seg.fontWeight && seg.fontWeight !== 400) {
        tspan.setAttribute('font-weight', String(seg.fontWeight));
      }
      if (seg.fontStyle && seg.fontStyle !== 'normal') {
        tspan.setAttribute('font-style', seg.fontStyle);
      }
      tspan.textContent = seg.text;
      el.appendChild(tspan);
    } else {
      el.appendChild(document.createTextNode(seg.text));
    }
  }

  return el;
}

/**
 * Measure and prepare question block for SVG export.
 *
 * Uses DOM-based line wrapping (browser-accurate) and preserves inline
 * formatting (bold, italic) via SVG <tspan> elements.  Height is measured
 * by rendering the question as real HTML in a hidden div — identical to
 * ChartPreview's QuestionBlock — so the export layout matches the canvas.
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

  // DOM-based line wrapping with formatting support
  const textLines: WrappedLine[][] = []; // array of paragraphs, each is array of WrappedLines
  if (hasText) {
    const paragraphs = parseHtmlParagraphs(question.text);
    const availW = contentW - padL - padR;
    const wrapW = availW > 0 ? availW : questionW;
    for (const paraHtml of paragraphs) {
      const lines = wrapHtmlToFormattedLines(paraHtml, wrapW, td.fontSize, td.fontFamily, td.lineHeight);
      if (lines.length > 0) textLines.push(lines);
    }
  }

  const spadT = question.subtextPaddingTop || 0;
  const spadR = question.subtextPaddingRight || 0;
  const spadB = question.subtextPaddingBottom || 0;
  const spadL = question.subtextPaddingLeft || 0;

  const subtextLines: WrappedLine[][] = [];
  if (hasSubtext) {
    const paragraphs = parseHtmlParagraphs(question.subtext);
    const availW = contentW - spadL - spadR;
    const wrapW = availW > 0 ? availW : questionW;
    for (const paraHtml of paragraphs) {
      const lines = wrapHtmlToFormattedLines(paraHtml, wrapW, sd.fontSize, sd.fontFamily, sd.lineHeight);
      if (lines.length > 0) subtextLines.push(lines);
    }
  }

  // Accurate height from DOM measurement (matches ChartPreview exactly)
  const domMeasure = measureQuestionHeightDOM(question, questionW);
  const totalH = domMeasure.totalHeight;
  if (totalH <= 0) return null;

  // Calculate paragraph gap: DOM height vs. sum-of-line-heights tells us how
  // much extra space the browser adds between <p> blocks.
  const tdLH = typeof td.lineHeight === 'number' ? td.lineHeight : parseFloat(String(td.lineHeight));
  const textLineCount = textLines.reduce((sum, p) => sum + p.length, 0);
  const totalTextLineLH = textLineCount * (td.fontSize * tdLH);
  const domTextContentH = Math.max(0, domMeasure.textHeight - padT - padB);
  const textParaGap = textLines.length > 1 && domTextContentH > totalTextLineLH
    ? (domTextContentH - totalTextLineLH) / (textLines.length - 1)
    : 0;

  const sdLH = typeof sd.lineHeight === 'number' ? sd.lineHeight : parseFloat(String(sd.lineHeight));
  const subtextLineCount = subtextLines.reduce((sum, p) => sum + p.length, 0);
  const totalSubtextLineLH = subtextLineCount * (sd.fontSize * sdLH);
  const domSubtextH = Math.max(0, totalH - domMeasure.textHeight);
  const domSubtextContentH = Math.max(0, domSubtextH - spadT - spadB);
  const subtextParaGap = subtextLines.length > 1 && domSubtextContentH > totalSubtextLineLH
    ? (domSubtextContentH - totalSubtextLineLH) / (subtextLines.length - 1)
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

      // Main text
      if (hasText && textLines.length > 0) {
        const anchor = alignToAnchor(align);
        const baseX = contentX + alignToX(align, contentW, padL, padR);
        let cy = yStart + padT;
        for (let pi = 0; pi < textLines.length; pi++) {
          if (pi > 0) cy += textParaGap;
          for (const line of textLines[pi]) {
            g.appendChild(createFormattedSvgText(line, baseX, cy, {
              fontSize: td.fontSize,
              fontFamily: td.fontFamily,
              color: td.color,
              textAnchor: anchor,
            }));
            cy += td.fontSize * tdLH;
          }
        }
      }

      // Subtext — positioned after the DOM-measured text height
      if (hasSubtext && subtextLines.length > 0) {
        const anchor = alignToAnchor(align);
        const baseX = contentX + alignToX(align, contentW, spadL, spadR);
        let cy = yStart + domMeasure.textHeight + spadT;
        for (let pi = 0; pi < subtextLines.length; pi++) {
          if (pi > 0) cy += subtextParaGap;
          for (const line of subtextLines[pi]) {
            g.appendChild(createFormattedSvgText(line, baseX, cy, {
              fontSize: sd.fontSize,
              fontFamily: sd.fontFamily,
              color: sd.color,
              textAnchor: anchor,
            }));
            cy += sd.fontSize * sdLH;
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
  // Also set dot inner color to transparent so hollow dots don't have white fill
  const renderSettings = options.transparent
    ? {
        ...settings,
        layout: { ...settings.layout, backgroundColor: 'transparent', backgroundOpacity: 0 },
        plotBackground: { ...settings.plotBackground, backgroundColor: 'transparent', backgroundOpacity: 0 },
        lineDotsAreas: {
          ...settings.lineDotsAreas,
          dotInnerColor: settings.lineDotsAreas.dotInnerColor === '#ffffff' || settings.lineDotsAreas.dotInnerColor === 'white'
            ? 'transparent'
            : settings.lineDotsAreas.dotInnerColor,
        },
      }
    : settings;

  // Render chart via React — pick component based on chart type
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');

  const chartType = renderSettings.chartType.chartType;
  const ChartComponent = chartType === 'line_chart'
    ? (await import('@/components/chart/LineChart')).LineChart
    : chartType === 'bar_grouped'
      ? (await import('@/components/chart/GroupedBarChart')).GroupedBarChart
      : (await import('@/components/chart/CustomBarChart')).CustomBarChart;

  const reactRoot = createRoot(container);
  reactRoot.render(
    React.createElement(ChartComponent, {
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
