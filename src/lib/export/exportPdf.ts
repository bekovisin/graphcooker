import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

export async function exportPdf(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  try {
    const svgElement = element.querySelector('svg');

    if (!svgElement) {
      throw new Error('No SVG element found for PDF export');
    }

    await svgToVectorPdf(svgElement, filename, options);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

/**
 * Vectorial PDF export using svg2pdf.js
 * Renders the SVG directly as vector graphics in the PDF — crisp at any zoom level.
 */
async function svgToVectorPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  // Clone the SVG so we don't modify the original
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Ensure overflow is hidden so content beyond the viewBox is clipped
  clonedSvg.setAttribute('overflow', 'hidden');

  const svgWidth = parseFloat(clonedSvg.getAttribute('width') || '800');
  const svgHeight = parseFloat(clonedSvg.getAttribute('height') || '600');
  const targetW = options?.width || svgWidth;
  const targetH = options?.height || svgHeight;

  // Ensure viewBox exists
  if (!clonedSvg.getAttribute('viewBox')) {
    clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  }
  clonedSvg.setAttribute('width', String(targetW));
  clonedSvg.setAttribute('height', String(targetH));

  // Handle transparent background
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
        if (rx === 0 && ry === 0 && rw >= svgWidth * 0.9) {
          clearBgRect(child);
        } else {
          break;
        }
      }
    }

    // For transparent exports, swap cover circles for the SVG mask
    const coverCircles = clonedSvg.querySelector('[data-role="cover-circles"]');
    if (coverCircles) coverCircles.remove();

    const linesGroup = clonedSvg.querySelector('[data-role="chart-lines"]');
    if (linesGroup) {
      const maskId = linesGroup.getAttribute('data-mask-id');
      if (maskId) {
        linesGroup.setAttribute('mask', `url(#${maskId})`);
      }
    }
  }

  // Create PDF with exact dimensions
  const isLandscape = targetW > targetH;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [targetW, targetH],
  });

  // Render SVG as vector graphics into the PDF
  await pdf.svg(clonedSvg, {
    x: 0,
    y: 0,
    width: targetW,
    height: targetH,
  });

  pdf.save(`${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`);
}
