/**
 * Prepare a cloned SVG element for standalone export.
 *
 * This is the single source-of-truth for all SVG post-processing:
 *   1. Set xmlns, overflow, viewBox
 *   2. Handle transparent background (bg rects, cover circles, masks, white strokes)
 *   3. Apply custom dimensions
 *   4. Inline styles for cross-viewer compatibility (Illustrator, Inkscape, etc.)
 *
 * Used by both editor single-export (`exportSvg`) and dashboard/bulk export
 * (`captureAsSvgBlob`, `captureAsPdfBlob`), as well as PNG and PDF exports
 * (`exportPng`, `exportPdf`).
 */
export function prepareSvgForExport(
  svgElement: SVGSVGElement,
  options?: { width?: number; height?: number; transparent?: boolean }
): SVGSVGElement {
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Ensure xmlns is set
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Ensure overflow is hidden so content beyond the viewBox is clipped
  clonedSvg.setAttribute('overflow', 'hidden');

  // Ensure viewBox is set for proper standalone rendering
  if (!clonedSvg.getAttribute('viewBox')) {
    const w = clonedSvg.getAttribute('width') || '800';
    const h = clonedSvg.getAttribute('height') || '600';
    clonedSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  // If transparent requested, remove all background rects (layout bg + plot bg)
  if (options?.transparent) {
    const clearBgRect = (rect: Element) => {
      rect.setAttribute('fill', 'none');
      rect.setAttribute('fill-opacity', '0');
      rect.removeAttribute('opacity');
    };

    // Clear only background-like rects that are direct children of <svg>
    // (at position 0,0 and spanning ≥90% of SVG width — NOT data rects like bar segments)
    const svgW = parseFloat(clonedSvg.getAttribute('width') || '800');
    clonedSvg.querySelectorAll(':scope > rect').forEach((rect) => {
      const rx = parseFloat(rect.getAttribute('x') || '0');
      const ry = parseFloat(rect.getAttribute('y') || '0');
      const rw = parseFloat(rect.getAttribute('width') || '0');
      if (rx === 0 && ry === 0 && rw >= svgW * 0.9) {
        clearBgRect(rect);
      }
    });

    // First rect(s) inside the chart wrapper <g>
    const gWrap = clonedSvg.querySelector('g[transform]');
    if (gWrap) {
      for (const child of Array.from(gWrap.children)) {
        if (child.tagName !== 'rect') break;
        const rx = parseFloat(child.getAttribute('x') || '0');
        const ry = parseFloat(child.getAttribute('y') || '0');
        const rw = parseFloat(child.getAttribute('width') || '0');
        if (rx === 0 && ry === 0 && rw >= svgW * 0.9) {
          clearBgRect(child);
        } else {
          break;
        }
      }
    }

    // For transparent exports, swap cover circles for the SVG mask
    // Cover circles rely on a visible background color — they don't work when transparent.
    // The mask punches holes in lines under dots, which works correctly in static SVG.
    const coverCircles = clonedSvg.querySelector('[data-role="cover-circles"]');
    if (coverCircles) coverCircles.remove();

    const linesGroup = clonedSvg.querySelector('[data-role="chart-lines"]');
    if (linesGroup) {
      const maskId = linesGroup.getAttribute('data-mask-id');
      if (maskId) {
        linesGroup.setAttribute('mask', `url(#${maskId})`);
      }
    }

    // Remove white outline strokes from text labels when transparent.
    // paint-order stroke is designed for contrast against opaque backgrounds;
    // on transparent export the white stroke layer becomes visible.
    clonedSvg.querySelectorAll('text').forEach((textEl) => {
      const style = textEl.getAttribute('style') || '';
      if (/stroke\s*:\s*(#fff(?:fff)?|white|rgba?\(\s*255)/i.test(style)) {
        const cleaned = style
          .replace(/paint-order\s*:\s*[^;]+;?\s*/gi, '')
          .replace(/stroke\s*:\s*[^;]+;?\s*/gi, '')
          .replace(/stroke-width\s*:\s*[^;]+;?\s*/gi, '')
          .replace(/stroke-linejoin\s*:\s*[^;]+;?\s*/gi, '');
        if (cleaned.trim()) {
          textEl.setAttribute('style', cleaned);
        } else {
          textEl.removeAttribute('style');
        }
      }
    });
  }

  // Apply custom dimensions if provided
  if (options?.width) {
    clonedSvg.setAttribute('width', String(options.width));
  }
  if (options?.height) {
    clonedSvg.setAttribute('height', String(options.height));
  }

  // Inline all computed styles on SVG text/rect elements for cross-platform compatibility
  inlineStyles(clonedSvg);

  return clonedSvg;
}

export async function exportSvg(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  try {
    const { embedFontsInSvg } = await import('./embedFonts');
    const svgElement = element.querySelector('svg');

    if (!svgElement) {
      throw new Error('No SVG element found for SVG export');
    }

    const clonedSvg = prepareSvgForExport(svgElement, options);

    // Embed fonts for standalone SVG quality (renders correctly without external fonts)
    await embedFontsInSvg(clonedSvg);

    let svgString = new XMLSerializer().serializeToString(clonedSvg);

    // Wrap in proper XML header
    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
    return url;
  } catch (error) {
    console.error('SVG export failed:', error);
    throw error;
  }
}

/**
 * Inline computed CSS styles on SVG elements so the exported SVG looks
 * correct in any viewer (Illustrator, Inkscape, browsers) without
 * depending on external stylesheets.
 *
 * Key transformations:
 * 1. Convert `dominant-baseline` to explicit `y` offsets — many SVG viewers
 *    (Illustrator, Inkscape, and some embed contexts) don't support it.
 * 2. Extract inline `style` CSS properties (paint-order, stroke, etc.) and
 *    promote them to SVG presentation attributes for maximum compatibility.
 * 3. Normalise transparent fills to `fill="none"`.
 */
function inlineStyles(svgEl: SVGSVGElement) {
  // ── Process text elements ──
  svgEl.querySelectorAll('text').forEach((textEl) => {
    const el = textEl as SVGTextElement;
    const hasTransform = el.hasAttribute('transform');

    // Convert dominant-baseline to explicit y offset (skip rotated text where
    // modifying y would shift position along the wrong axis).
    const db = el.getAttribute('dominant-baseline');
    if (db && db !== 'auto' && db !== 'alphabetic' && !hasTransform) {
      // Always convert dominant-baseline to explicit y offset for standalone SVG
      // compatibility (Illustrator, Inkscape, and some embed contexts don't support it).
      let fontSize = parseFloat(el.getAttribute('font-size') || '0');
      if (!fontSize) {
        const styleStr = el.getAttribute('style') || '';
        const fsMatch = styleStr.match(/font-size\s*:\s*([\d.]+)/);
        if (fsMatch) fontSize = parseFloat(fsMatch[1]);
      }
      if (!fontSize) fontSize = 12;

      const currentY = parseFloat(el.getAttribute('y') || '0');
      const factor = db === 'central' ? 0.35 : db === 'hanging' ? 0.8 : 0;

      if (factor > 0) {
        el.setAttribute('y', String(+(currentY + fontSize * factor).toFixed(2)));
      }
      el.removeAttribute('dominant-baseline');

      // For mixed-size tspans, add corrective dy to each tspan to account for
      // the baseline shift difference at different font sizes.
      // SVG dy is cumulative across sibling tspans, so we track and apply deltas.
      const tspans = el.querySelectorAll('tspan');
      const hasMixedSizeTspans = Array.from(tspans).some((ts) => {
        const tsFs = parseFloat(ts.getAttribute('font-size') || '0');
        return tsFs > 0 && tsFs !== fontSize;
      });

      if (hasMixedSizeTspans && factor > 0) {
        const newParentY = parseFloat(el.getAttribute('y') || '0');
        let runningY = newParentY;

        tspans.forEach((ts) => {
          const existingDy = parseFloat(ts.getAttribute('dy') || '0');
          runningY += existingDy;

          const tsFontSize = parseFloat(ts.getAttribute('font-size') || '0') || fontSize;
          const correction = -(fontSize - tsFontSize) * factor;

          ts.setAttribute('y', String(+(runningY + correction).toFixed(2)));
          ts.removeAttribute('dy');
        });
      }
    }

    // Convert inline CSS `style` to SVG presentation attributes
    convertStyleToSvgAttrs(el);
  });

  // ── Process tspan elements (promote CSS styles to SVG attributes) ──
  svgEl.querySelectorAll('tspan').forEach((tspanEl) => {
    convertStyleToSvgAttrs(tspanEl as SVGElement);
  });

  // ── Split paint-order:stroke text into two layers for cross-viewer compatibility ──
  // Many SVG viewers (Illustrator, Inkscape, some embed contexts) don't support
  // paint-order. We split each affected <text> into:
  //   1. A stroke-only clone (behind) — fill="none", keeps stroke attrs
  //   2. The original fill-only element (on top) — stroke removed
  svgEl.querySelectorAll('text[paint-order]').forEach((textEl) => {
    const el = textEl as SVGTextElement;
    const paintOrder = el.getAttribute('paint-order');
    if (!paintOrder || !paintOrder.includes('stroke')) return;

    // Clone for stroke layer
    const strokeEl = el.cloneNode(true) as SVGTextElement;
    strokeEl.setAttribute('fill', 'none');
    strokeEl.removeAttribute('paint-order');

    // Original becomes fill layer — remove stroke attrs
    el.removeAttribute('paint-order');
    el.removeAttribute('stroke');
    el.removeAttribute('stroke-width');
    el.removeAttribute('stroke-linejoin');
    el.removeAttribute('stroke-linecap');

    // Insert stroke layer before fill layer (renders behind)
    el.parentNode?.insertBefore(strokeEl, el);
  });

  // ── Process circles ──
  svgEl.querySelectorAll('circle').forEach((circleEl) => {
    // Normalise transparent → fill="none"
    const fill = circleEl.getAttribute('fill');
    if (fill === 'transparent') {
      circleEl.setAttribute('fill', 'none');
      circleEl.setAttribute('fill-opacity', '0');
    }
    // Remove non-visual styles (e.g. cursor: pointer)
    if (circleEl.hasAttribute('style')) {
      circleEl.removeAttribute('style');
    }
  });

  // ── Remove leftover non-visual styles everywhere ──
  svgEl.querySelectorAll('[style*="cursor"]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const cleaned = style.replace(/cursor\s*:\s*[^;]+;?\s*/g, '').trim();
    if (cleaned) {
      el.setAttribute('style', cleaned);
    } else {
      el.removeAttribute('style');
    }
  });
}

/**
 * Parse a CSS style string and promote SVG-applicable properties to
 * presentation attributes on the element, removing them from `style`.
 */
function convertStyleToSvgAttrs(el: SVGElement) {
  const style = el.getAttribute('style');
  if (!style) return;

  const svgPropMap: Record<string, string> = {
    'paint-order': 'paint-order',
    'stroke': 'stroke',
    'stroke-width': 'stroke-width',
    'stroke-linejoin': 'stroke-linejoin',
    'stroke-linecap': 'stroke-linecap',
    'fill': 'fill',
    'fill-opacity': 'fill-opacity',
    'opacity': 'opacity',
    'font-size': 'font-size',
    'font-family': 'font-family',
    'font-weight': 'font-weight',
    'font-style': 'font-style',
    'letter-spacing': 'letter-spacing',
  };
  const skipProps = new Set(['cursor', 'pointer-events']);

  const remaining: string[] = [];

  style.split(';').forEach((part) => {
    const idx = part.indexOf(':');
    if (idx <= 0) return;
    const prop = part.substring(0, idx).trim().toLowerCase();
    const val = part.substring(idx + 1).trim();
    if (!prop || !val) return;

    if (svgPropMap[prop]) {
      el.setAttribute(svgPropMap[prop], val);
    } else if (!skipProps.has(prop)) {
      remaining.push(`${prop}: ${val}`);
    }
  });

  if (remaining.length > 0) {
    el.setAttribute('style', remaining.join('; '));
  } else {
    el.removeAttribute('style');
  }
}
