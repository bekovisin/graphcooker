/**
 * Capture chart as Blob data — used for ZIP-based bulk export.
 * These functions mirror the export functions but return Blobs
 * instead of triggering browser downloads.
 */

import { toPng, toSvg } from 'html-to-image';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';

/** Helper: data-URL → Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

// ── PNG ──
export async function captureAsPngBlob(
  element: HTMLElement,
  options?: { transparent?: boolean; pixelRatio?: number }
): Promise<Blob> {
  const svgElement = element.querySelector('svg');

  if (svgElement) {
    const dataUrl = await svgToCanvasDataUrl(svgElement, options);
    if (dataUrl) return dataUrlToBlob(dataUrl);
  }

  // Fallback: html-to-image for ApexCharts
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: options?.pixelRatio || 2,
    backgroundColor: options?.transparent ? undefined : '#ffffff',
  });
  return dataUrlToBlob(dataUrl);
}

async function svgToCanvasDataUrl(
  svgElement: SVGSVGElement,
  options?: { transparent?: boolean; pixelRatio?: number }
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

    if (!clonedSvg.getAttribute('viewBox')) {
      clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    }

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

// ── SVG ──
export async function captureAsSvgBlob(
  element: HTMLElement,
  options?: { transparent?: boolean }
): Promise<Blob> {
  const svgElement = element.querySelector('svg');

  if (svgElement) {
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

    let svgString = new XMLSerializer().serializeToString(clonedSvg);
    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }
    return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  }

  // Fallback: html-to-image
  const dataUrl = await toSvg(element, {
    backgroundColor: options?.transparent ? undefined : '#ffffff',
  });
  return dataUrlToBlob(dataUrl);
}

// ── PDF ──
export async function captureAsPdfBlob(
  element: HTMLElement,
  options?: { transparent?: boolean }
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  await import('svg2pdf.js');

  const svgElement = element.querySelector('svg');

  if (svgElement) {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const svgWidth = parseFloat(clonedSvg.getAttribute('width') || '800');
    const svgHeight = parseFloat(clonedSvg.getAttribute('height') || '600');

    if (!clonedSvg.getAttribute('viewBox')) {
      clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    }

    if (options?.transparent) {
      const bgRect = clonedSvg.querySelector('rect:first-child');
      if (bgRect) {
        bgRect.setAttribute('fill', 'none');
        bgRect.setAttribute('fill-opacity', '0');
        bgRect.removeAttribute('opacity');
      }
    }

    const isLandscape = svgWidth > svgHeight;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [svgWidth, svgHeight],
    });
    await pdf.svg(clonedSvg, { x: 0, y: 0, width: svgWidth, height: svgHeight });
    return pdf.output('blob');
  }

  // Fallback: raster
  const pngDataUrl = await toPng(element, { quality: 1, pixelRatio: 3, backgroundColor: '#ffffff' });
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  const isLandscape = w > h;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [w, h],
  });
  pdf.addImage(pngDataUrl, 'PNG', 0, 0, w, h);
  return pdf.output('blob');
}

// ── HTML ──
export async function captureAsHtmlBlob(
  settings: ChartSettings,
  data: DataRow[],
  columnMapping: ColumnMapping,
  options?: { width?: number; height?: number; transparent?: boolean }
): Promise<Blob> {
  const isCustomChart = settings.chartType.chartType === 'bar_stacked_custom';

  if (isCustomChart) {
    return buildCustomSvgHtmlBlob(settings, data, columnMapping, options);
  }
  return buildApexHtmlBlob(settings, data, columnMapping, options);
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function buildApexHtmlBlob(
  settings: ChartSettings,
  data: DataRow[],
  columnMapping: ColumnMapping,
  options?: { width?: number; height?: number; transparent?: boolean }
): Promise<Blob> {
  const { buildChartData } = await import('@/lib/chart/mapSettingsToApex');
  const { series, options: chartOptions } = buildChartData(data, columnMapping, settings);
  const chartHeight = settings.chartType.heightMode === 'auto'
    ? Math.max(300, data.length * 45 + 100)
    : settings.chartType.standardHeight;
  const bgColor = options?.transparent ? 'transparent' : settings.layout.backgroundColor;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Chart</title>
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,-apple-system,sans-serif}
#chart-wrapper{max-width:${settings.layout.maxWidth > 0 ? settings.layout.maxWidth + 'px' : '100%'};${options?.width ? `width:${options.width}px;` : ''}margin:0 auto;background:${bgColor};padding:${settings.layout.paddingTop}px ${settings.layout.paddingRight}px ${settings.layout.paddingBottom}px ${settings.layout.paddingLeft}px}
.header{padding:20px 24px 0;text-align:${settings.header.alignment}}
.header h2{font-size:${settings.header.titleStyling.fontSize}px;font-weight:${settings.header.titleStyling.fontWeight === 'bold' ? 700 : 400};color:${settings.header.titleStyling.color};margin-bottom:4px}
.header .subtitle{font-size:${settings.header.subtitleStyling.fontSize}px;color:${settings.header.subtitleStyling.color};margin-bottom:4px}
.footer{padding:8px 24px 16px;text-align:${settings.footer.alignment}}.footer p{font-size:${settings.footer.size}px;color:${settings.footer.color}}
#chart{background:${settings.plotBackground.backgroundColor}}</style></head><body>
<div id="chart-wrapper">
${settings.header.title || settings.header.subtitle ? `<div class="header">${settings.header.title ? `<h2>${escHtml(settings.header.title)}</h2>` : ''}${settings.header.subtitle ? `<p class="subtitle">${escHtml(settings.header.subtitle)}</p>` : ''}</div>` : ''}
<div id="chart"></div>
${settings.footer.sourceName ? `<div class="footer"><p>${escHtml(settings.footer.sourceLabel)}: ${escHtml(settings.footer.sourceName)}</p></div>` : ''}
</div>
<script>var options=${JSON.stringify(chartOptions)};options.chart.height=${chartHeight};var chart=new ApexCharts(document.querySelector("#chart"),{...options,series:${JSON.stringify(series)}});chart.render();</script>
</body></html>`;

  return new Blob([html], { type: 'text/html' });
}

function buildCustomSvgHtmlBlob(
  settings: ChartSettings,
  _data: DataRow[],
  _columnMapping: ColumnMapping,
  options?: { width?: number; height?: number; transparent?: boolean }
): Blob {
  const svgElement = document.querySelector('#offscreen-chart-container svg') ||
    document.querySelector('#chart-container svg');
  let svgMarkup = '';

  if (svgElement) {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (options?.transparent) {
      const bgRect = clonedSvg.querySelector('rect:first-child');
      if (bgRect) { bgRect.setAttribute('fill', 'none'); bgRect.setAttribute('fill-opacity', '0'); }
    }
    clonedSvg.setAttribute('width', '100%');
    clonedSvg.style.maxWidth = options?.width ? `${options.width}px` : '100%';
    clonedSvg.style.height = 'auto';
    svgMarkup = new XMLSerializer().serializeToString(clonedSvg);
  }

  const bgColor = options?.transparent ? 'transparent' : settings.layout.backgroundColor;
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Chart</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,-apple-system,sans-serif}
#chart-wrapper{max-width:${options?.width ? options.width + 'px' : '100%'};margin:0 auto;background:${bgColor}}
.chart-area svg{display:block;width:100%;height:auto}</style></head><body>
<div id="chart-wrapper">
${settings.header.title ? `<div class="header" style="padding:20px 24px 0;text-align:${settings.header.alignment}"><h2 style="font-size:${settings.header.titleStyling.fontSize}px;color:${settings.header.titleStyling.color};margin:0 0 4px">${escHtml(settings.header.title)}</h2></div>` : ''}
<div class="chart-area">${svgMarkup}</div>
${settings.footer.sourceName ? `<div style="padding:8px 24px 16px;text-align:${settings.footer.alignment}"><p style="font-size:${settings.footer.size}px;color:${settings.footer.color};margin:0">${escHtml(settings.footer.sourceLabel)}: ${escHtml(settings.footer.sourceName)}</p></div>` : ''}
</div></body></html>`;

  return new Blob([html], { type: 'text/html' });
}
