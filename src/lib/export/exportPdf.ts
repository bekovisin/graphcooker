import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { prepareSvgForExport } from './exportSvg';
import { embedFontsInSvg } from './embedFonts';

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
 *
 * Uses the shared prepareSvgForExport() pipeline for consistent SVG
 * post-processing across all export formats, then renders as vector
 * graphics in the PDF — crisp at any zoom level.
 */
async function svgToVectorPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean }
) {
  // Use the shared SVG post-processing pipeline (single source of truth)
  const clonedSvg = prepareSvgForExport(svgElement, options);

  // Embed fonts for consistent rendering
  await embedFontsInSvg(clonedSvg);

  const targetW = parseFloat(clonedSvg.getAttribute('width') || '800');
  const targetH = parseFloat(clonedSvg.getAttribute('height') || '600');

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
