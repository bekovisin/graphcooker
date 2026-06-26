/**
 * Bake clipped/cropped <image> elements into self-contained PNGs for export.
 *
 * Why: the result bar shows photos via preserveAspectRatio="xMidYMid slice"
 * (cover-crop) + a rounded clip-path. Browsers and Figma honor both, but
 * Microsoft Word/Office ignore clip-path (square corners) and don't apply the
 * `slice` crop (wrong part of the photo shows). There is no SVG attribute that
 * fixes this across viewers.
 *
 * So for export we pre-render each such image onto a canvas at the exact box
 * size — cover-cropped and with the rounded corners cut out as transparency —
 * and replace the <image> with that PNG placed plainly (no clip-path, no
 * preserveAspectRatio). The result renders pixel-identically everywhere,
 * including Word.
 */

const XLINK_NS = 'http://www.w3.org/1999/xlink';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(rad, 0);
  ctx.arcTo(w, 0, w, h, rad);
  ctx.arcTo(w, h, 0, h, rad);
  ctx.arcTo(0, h, 0, 0, rad);
  ctx.arcTo(0, 0, w, 0, rad);
  ctx.closePath();
}

export async function bakeImages(svg: SVGSVGElement): Promise<void> {
  const images = Array.from(svg.querySelectorAll('image'));
  for (const el of images) {
    const clipRef = el.getAttribute('clip-path') || '';
    const par = el.getAttribute('preserveAspectRatio') || '';
    // Only images that depend on clip-path or slice need baking; plain images are fine as-is.
    if (!clipRef && !par.includes('slice')) continue;

    const href = el.getAttributeNS(XLINK_NS, 'href') || el.getAttribute('href') || '';
    if (!href.startsWith('data:')) continue; // only self-contained images

    const w = parseFloat(el.getAttribute('width') || '0');
    const h = parseFloat(el.getAttribute('height') || '0');
    if (!w || !h) continue;

    // corner radius from the referenced clipPath's rect
    let radius = 0;
    const clipId = clipRef.match(/#([^)]+)\)/)?.[1];
    if (clipId) {
      const rect = svg.querySelector(`clipPath[id="${CSS.escape(clipId)}"] rect`);
      if (rect) radius = parseFloat(rect.getAttribute('rx') || rect.getAttribute('ry') || '0');
    }
    const cover = par.includes('slice');

    let img: HTMLImageElement;
    try { img = await loadImage(href); } catch { continue; }
    if (!img.naturalWidth || !img.naturalHeight) continue;

    // 2× the display box keeps it crisp; never upscale beyond the source.
    const srcScale = Math.min(2, Math.max(1, Math.min(img.naturalWidth / w, img.naturalHeight / h)));
    const cw = Math.round(w * srcScale);
    const ch = Math.round(h * srcScale);

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    if (radius > 0) { roundedRectPath(ctx, cw, ch, radius * srcScale); ctx.clip(); }

    // xMidYMid cover/contain
    const s = (cover ? Math.max(cw / img.naturalWidth, ch / img.naturalHeight) : Math.min(cw / img.naturalWidth, ch / img.naturalHeight));
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

    let baked: string;
    try { baked = canvas.toDataURL('image/png'); } catch { continue; }

    el.setAttributeNS(XLINK_NS, 'xlink:href', baked);
    el.removeAttribute('href');
    el.removeAttribute('clip-path');
    el.removeAttribute('preserveAspectRatio');
  }
}
