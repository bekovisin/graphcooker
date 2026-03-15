/**
 * Capture a JPEG thumbnail from the #chart-container SVG element.
 * Returns a data URL string or null if capture fails.
 */
export async function captureThumbnail(): Promise<string | null> {
  try {
    const container = document.getElementById('chart-container');
    if (!container) return null;
    const svgEl = container.querySelector('svg');
    if (!svgEl) return null;

    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Strip heavy embedded base64 images to keep serialization fast.
    // Thumbnails are small previews — individual row images aren't visible at this size.
    const TINY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    cloned.querySelectorAll('image').forEach((img) => {
      const href = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (href && href.startsWith('data:')) {
        img.setAttribute('href', TINY_GIF);
        if (img.hasAttributeNS('http://www.w3.org/1999/xlink', 'href')) {
          img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', TINY_GIF);
        }
      }
    });

    const w = parseFloat(cloned.getAttribute('width') || '400');
    const h = parseFloat(cloned.getAttribute('height') || '300');
    if (!cloned.getAttribute('viewBox')) {
      cloned.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    const thumbW = 200;
    const thumbH = Math.round((h / w) * thumbW);
    cloned.setAttribute('width', String(thumbW));
    cloned.setAttribute('height', String(thumbH));
    const svgStr = new XMLSerializer().serializeToString(cloned);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = thumbW;
        canvas.height = thumbH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, thumbW, thumbH);
        ctx.drawImage(img, 0, 0, thumbW, thumbH);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  } catch {
    return null;
  }
}
