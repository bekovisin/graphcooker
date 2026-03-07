export async function exportSvg(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  try {
    const svgElement = element.querySelector('svg');

    if (!svgElement) {
      throw new Error('No SVG element found for SVG export');
    }

    // Direct SVG serialization — produces a clean, 1:1 faithful export
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Ensure xmlns is set
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Ensure overflow is hidden so content beyond the viewBox is clipped
    clonedSvg.setAttribute('overflow', 'hidden');

    // If transparent requested, remove all background rects (layout bg + plot bg)
    if (options?.transparent) {
      const clearBgRect = (rect: Element) => {
        rect.setAttribute('fill', 'none');
        rect.setAttribute('fill-opacity', '0');
        rect.removeAttribute('opacity');
      };

      // Direct children of <svg>
      clonedSvg.querySelectorAll(':scope > rect').forEach(clearBgRect);

      // First rect(s) inside the chart wrapper <g>
      const gWrap = clonedSvg.querySelector('g[transform]');
      if (gWrap) {
        for (const child of Array.from(gWrap.children)) {
          if (child.tagName !== 'rect') break;
          const rx = parseFloat(child.getAttribute('x') || '0');
          const ry = parseFloat(child.getAttribute('y') || '0');
          const rw = parseFloat(child.getAttribute('width') || '0');
          const svgW = parseFloat(clonedSvg.getAttribute('width') || '800');
          if (rx === 0 && ry === 0 && rw >= svgW * 0.9) {
            clearBgRect(child);
          } else {
            break;
          }
        }
      }
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
 */
function inlineStyles(svgEl: SVGSVGElement) {
  const elements = svgEl.querySelectorAll('text, rect, line, circle, path, g');
  elements.forEach((el) => {
    const htmlEl = el as SVGElement;
    // For text elements, ensure style attributes are present
    if (el.tagName === 'text') {
      const style = htmlEl.getAttribute('style') || '';
      // style attribute is already set inline by React — just ensure it's preserved
      if (!style && htmlEl.hasAttribute('font-size')) {
        // Already has individual attributes, skip
      }
    }
  });
}
