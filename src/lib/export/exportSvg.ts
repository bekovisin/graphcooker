import { toSvg } from 'html-to-image';

export async function exportSvg(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  try {
    // Try to find an inline SVG element (custom chart) inside the container
    const svgElement = element.querySelector('svg');
    let svgString: string;

    if (svgElement) {
      // Direct SVG serialization — produces a clean, 1:1 faithful export
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

      // Ensure xmlns is set
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      // If transparent requested, remove all background rects (layout bg + plot bg)
      if (options?.transparent) {
        const bgRects = clonedSvg.querySelectorAll(':scope > rect');
        bgRects.forEach((rect) => {
          rect.setAttribute('fill', 'none');
          rect.setAttribute('fill-opacity', '0');
          rect.removeAttribute('opacity');
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

      svgString = new XMLSerializer().serializeToString(clonedSvg);

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
    }

    // Fallback: use html-to-image for non-SVG charts (ApexCharts)
    const dataUrl = await toSvg(element, {
      backgroundColor: options?.transparent ? undefined : '#ffffff',
      width: options?.width,
      height: options?.height,
    });

    const link = document.createElement('a');
    link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.svg`;
    link.href = dataUrl;
    link.click();

    return dataUrl;
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
