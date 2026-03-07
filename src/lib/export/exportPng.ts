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
 */
async function svgToCanvas(
  svgElement: SVGSVGElement,
  options?: { width?: number; height?: number; transparent?: boolean; pixelRatio?: number }
): Promise<string | null> {
  try {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    if (options?.transparent) {
      const bgRects = clonedSvg.querySelectorAll(':scope > rect');
      bgRects.forEach((rect) => {
        rect.setAttribute('fill', 'none');
        rect.setAttribute('fill-opacity', '0');
        rect.removeAttribute('opacity');
      });
    }

    const svgWidth = parseFloat(clonedSvg.getAttribute('width') || '800');
    const svgHeight = parseFloat(clonedSvg.getAttribute('height') || '600');

    const targetW = options?.width || svgWidth;
    const targetH = options?.height || svgHeight;

    // Set viewBox if not present
    if (!clonedSvg.getAttribute('viewBox')) {
      clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    }
    clonedSvg.setAttribute('width', String(targetW));
    clonedSvg.setAttribute('height', String(targetH));

    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const pixelRatio = options?.pixelRatio || 2;
        const canvas = document.createElement('canvas');
        canvas.width = targetW * pixelRatio;
        canvas.height = targetH * pixelRatio;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 2d context unavailable')); return; }

        ctx.scale(pixelRatio, pixelRatio);

        if (!options?.transparent) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
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
