import { prepareSvgForExport } from './exportSvg';
import { embedFontsInSvg } from './embedFonts';

export async function exportPng(
  element: HTMLElement,
  filename: string,
  options?: { width?: number; height?: number; transparent?: boolean; pixelRatio?: number }
) {
  try {
    const svgElement = element.querySelector('svg');

    if (svgElement) {
      const pngDataUrl = await svgToCanvas(svgElement, options);
      if (pngDataUrl) {
        const link = document.createElement('a');
        link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
        link.href = pngDataUrl;
        link.click();
        return pngDataUrl;
      }
    }

    throw new Error('No SVG element found for PNG export');
  } catch (error) {
    console.error('PNG export failed:', error);
    throw error;
  }
}

/**
 * Convert an inline SVG to a high-quality PNG via Canvas.
 *
 * Uses the shared prepareSvgForExport() pipeline for consistent SVG
 * post-processing across all export formats, then embeds fonts as base64
 * so they render correctly in the isolated <img> context.
 */
async function svgToCanvas(
  svgElement: SVGSVGElement,
  options?: { width?: number; height?: number; transparent?: boolean; pixelRatio?: number }
): Promise<string | null> {
  try {
    // Use the shared SVG post-processing pipeline (single source of truth)
    const clonedSvg = prepareSvgForExport(svgElement, {
      width: options?.width,
      height: options?.height,
      transparent: options?.transparent,
    });

    // Embed fonts as base64 so they render in the isolated <img> context
    await embedFontsInSvg(clonedSvg);

    const svgWidth = parseFloat(clonedSvg.getAttribute('width') || '800');
    const svgHeight = parseFloat(clonedSvg.getAttribute('height') || '600');

    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const pixelRatio = options?.pixelRatio || 2;
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth * pixelRatio;
        canvas.height = svgHeight * pixelRatio;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 2d context unavailable')); return; }

        ctx.scale(pixelRatio, pixelRatio);

        if (!options?.transparent) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, svgWidth, svgHeight);
        }

        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', 1));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };
      img.src = url;
    });
  } catch {
    return null;
  }
}
