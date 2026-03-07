/**
 * Offscreen chart renderer for export (dashboard bulk + editor).
 *
 * Renders a CustomBarChart into a hidden container at the requested export
 * dimensions, waits for it to fully paint, then returns the container so
 * export/capture functions can extract the rendered output.
 *
 * Uses opacity:0 (not visibility:hidden) so the browser fully paints the
 * element including text metrics.
 */

import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';

interface RenderResult {
  container: HTMLElement;
  cleanup: () => void;
}

interface RenderOptions {
  width: number;
  height?: number;
  transparent?: boolean;
}

export async function renderChartOffscreen(
  settings: ChartSettings,
  data: DataRow[],
  columnMapping: ColumnMapping,
  options: RenderOptions,
  columnOrder?: string[],
  seriesNames?: Record<string, string>
): Promise<RenderResult> {
  const width = options.width || 800;
  const height =
    options.height ||
    (settings.chartType.heightMode === 'auto'
      ? Math.max(300, data.length * 45 + 100)
      : settings.chartType.standardHeight) ||
    500;

  // Create off-screen wrapper — use opacity:0 so the browser fully paints
  // the element (including text metrics). visibility:hidden can cause
  // mis-measurements.
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    opacity: 0;
    z-index: -9999;
    pointer-events: none;
    overflow: hidden;
  `;
  document.body.appendChild(wrapper);

  // Create chart container (mirrors ChartPreview's #chart-container)
  const container = document.createElement('div');
  container.id = 'offscreen-chart-container';
  const bgColor = options.transparent ? 'transparent' : (settings.layout.backgroundColor || '#ffffff');
  container.style.cssText = `
    width: ${width}px;
    height: ${height}px;
    background-color: ${bgColor};
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-sizing: border-box;
  `;
  wrapper.appendChild(container);

  // ── Header ──
  let headerH = 0;
  if (settings.header.title || settings.header.subtitle || settings.header.text) {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px 0;
      text-align: ${settings.header.alignment};
      flex-shrink: 0;
      ${settings.header.border === 'top' || settings.header.border === 'both' ? 'border-top: 2px solid #e5e7eb;' : ''}
      ${settings.header.border === 'bottom' || settings.header.border === 'both' ? 'border-bottom: 2px solid #e5e7eb;' : ''}
    `;
    if (settings.header.title) {
      const h = document.createElement('h2');
      h.textContent = settings.header.title;
      h.style.cssText = `
        font-family: ${settings.header.titleStyling.fontFamily};
        font-size: ${settings.header.titleStyling.fontSize}px;
        font-weight: ${settings.header.titleStyling.fontWeight === 'bold' ? 700 : 400};
        color: ${settings.header.titleStyling.color};
        line-height: ${settings.header.titleStyling.lineHeight};
        margin: 0 0 4px 0;
      `;
      header.appendChild(h);
    }
    if (settings.header.subtitle) {
      const p = document.createElement('p');
      p.textContent = settings.header.subtitle;
      p.style.cssText = `
        font-family: ${settings.header.subtitleStyling.fontFamily};
        font-size: ${settings.header.subtitleStyling.fontSize}px;
        font-weight: ${settings.header.subtitleStyling.fontWeight === 'bold' ? 700 : 400};
        color: ${settings.header.subtitleStyling.color};
        line-height: ${settings.header.subtitleStyling.lineHeight};
        margin: 0 0 4px 0;
      `;
      header.appendChild(p);
    }
    if (settings.header.text) {
      const p = document.createElement('p');
      p.textContent = settings.header.text;
      p.style.cssText = `
        font-family: ${settings.header.textStyling.fontFamily};
        font-size: ${settings.header.textStyling.fontSize}px;
        font-weight: ${settings.header.textStyling.fontWeight === 'bold' ? 700 : 400};
        color: ${settings.header.textStyling.color};
        line-height: ${settings.header.textStyling.lineHeight};
        margin: 0;
      `;
      header.appendChild(p);
    }
    container.appendChild(header);
    // Force layout so we can measure header height
    headerH = header.offsetHeight;
  }

  // ── Footer (build early to measure height) ──
  let footerH = 0;
  let footerEl: HTMLElement | null = null;
  if (settings.footer.sourceName || settings.footer.notePrimary) {
    footerEl = document.createElement('div');
    footerEl.style.cssText = `
      padding: 8px 24px 16px;
      text-align: ${settings.footer.alignment};
      flex-shrink: 0;
      ${settings.footer.border === 'top' || settings.footer.border === 'both' ? 'border-top: 1px solid #e5e7eb;' : ''}
      ${settings.footer.border === 'bottom' || settings.footer.border === 'both' ? 'border-bottom: 1px solid #e5e7eb;' : ''}
    `;
    if (settings.footer.sourceName) {
      const p = document.createElement('p');
      p.textContent = `${settings.footer.sourceLabel}: ${settings.footer.sourceName}`;
      p.style.cssText = `font-size: ${settings.footer.size}px; color: ${settings.footer.color}; margin: 0;`;
      footerEl.appendChild(p);
    }
    if (settings.footer.notePrimary) {
      const p = document.createElement('p');
      p.textContent = settings.footer.notePrimary;
      p.style.cssText = `font-size: ${settings.footer.size - 1}px; color: ${settings.footer.color}; opacity: 0.8; margin: 4px 0 0 0;`;
      footerEl.appendChild(p);
    }
    // Temporarily append to measure, then reorder
    container.appendChild(footerEl);
    footerH = footerEl.offsetHeight;
    container.removeChild(footerEl);
  }

  // ── Chart area ──
  const chartArea = document.createElement('div');
  chartArea.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  `;
  container.appendChild(chartArea);

  // Re-append footer after chart area
  if (footerEl) {
    container.appendChild(footerEl);
  }

  // Compute exact pixel dimensions for the chart
  const chartWidth = width;
  const chartHeight = height - headerH - footerH;

  // ── Render CustomBarChart via React ──
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { CustomBarChart } = await import('@/components/chart/CustomBarChart');

  const reactRoot = createRoot(chartArea);
  reactRoot.render(
    React.createElement(CustomBarChart, {
      data,
      columnMapping,
      settings,
      width: chartWidth > 0 ? chartWidth : width,
      height: chartHeight > 0 ? chartHeight : undefined,
      columnOrder,
      seriesNames,
      skipAnimation: true,
    })
  );
  // Wait for React to flush render — no animation needed since skipAnimation=true
  await new Promise((r) => setTimeout(r, 200));

  const cleanup = () => {
    try { reactRoot.unmount(); } catch { /* ignore */ }
    try { wrapper.remove(); } catch { /* ignore */ }
  };

  return { container, cleanup };
}
