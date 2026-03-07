/**
 * Offscreen chart renderer for export (dashboard bulk + editor).
 *
 * Renders a chart into a hidden container at the requested export dimensions,
 * waits for it to fully paint, then returns the container so export/capture
 * functions can extract the rendered output.
 *
 * Uses opacity:0 (not visibility:hidden) so ApexCharts can correctly measure
 * text metrics for axis labels, legend, etc.
 */

import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { buildChartData } from '@/lib/chart/mapSettingsToApex';

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
  const isCustomChart = settings.chartType.chartType === 'bar_stacked_custom';
  const width = options.width || 800;
  const height =
    options.height ||
    (settings.chartType.heightMode === 'auto'
      ? Math.max(300, data.length * 45 + 100)
      : settings.chartType.standardHeight) ||
    500;

  // Create off-screen wrapper — use opacity:0 so the browser fully paints
  // the element (including text metrics). visibility:hidden can cause
  // ApexCharts to mis-measure y-axis label widths.
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
  const padT = isCustomChart ? 0 : settings.layout.paddingTop;
  const padR = isCustomChart ? 0 : settings.layout.paddingRight;
  const padB = isCustomChart ? 0 : settings.layout.paddingBottom;
  const padL = isCustomChart ? 0 : settings.layout.paddingLeft;

  const chartArea = document.createElement('div');
  chartArea.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: ${padT}px ${padR}px ${padB}px ${padL}px;
    background-color: ${isCustomChart ? 'transparent' : settings.plotBackground.backgroundColor};
    ${settings.plotBackground.border ? `border: ${settings.plotBackground.borderWidth}px solid ${settings.plotBackground.borderColor};` : ''}
    box-sizing: border-box;
  `;
  container.appendChild(chartArea);

  // Re-append footer after chart area
  if (footerEl) {
    container.appendChild(footerEl);
  }

  // Compute exact pixel dimensions for the chart
  const chartWidth = width - padL - padR;
  const chartHeight = height - headerH - footerH - padT - padB;

  // ── Render chart content ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reactRoot: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apexChart: any = null;

  if (isCustomChart) {
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { CustomBarChart } = await import('@/components/chart/CustomBarChart');

    reactRoot = createRoot(chartArea);
    reactRoot.render(
      React.createElement(CustomBarChart, {
        data,
        columnMapping,
        settings,
        width: chartWidth > 0 ? chartWidth : width,
        height: chartHeight > 0 ? chartHeight : undefined,
        columnOrder,
        seriesNames,
      })
    );
    await new Promise((r) => setTimeout(r, 400));
  } else {
    const { series, options: chartOptions } = buildChartData(
      data, columnMapping, settings, columnOrder, seriesNames
    );

    if (series.length > 0) {
      const ApexChartsLib = (await import('apexcharts')).default;

      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = `
        width: ${chartWidth}px;
        height: ${Math.max(100, chartHeight)}px;
      `;
      chartArea.appendChild(chartDiv);

      const targetH = Math.max(100, chartHeight);

      const mergedOptions: ApexCharts.ApexOptions = {
        ...chartOptions,
        series,
        chart: {
          ...chartOptions.chart,
          type: 'bar',
          height: targetH,
          width: chartWidth,
          animations: { enabled: false },
          toolbar: { show: false },
          redrawOnParentResize: false,
          redrawOnWindowResize: false,
        },
      };

      apexChart = new ApexChartsLib(chartDiv, mergedOptions);
      await apexChart.render();

      // Wait for initial render pass
      await new Promise((r) => setTimeout(r, 300));

      // Force ApexCharts to recalculate all internal dimensions (label widths,
      // plot area, bar widths) by updating with the same width/height.
      // This fixes the issue where the initial render may mis-compute
      // text metrics in the offscreen container.
      try {
        await apexChart.updateOptions(
          {
            chart: {
              width: chartWidth,
              height: targetH,
            },
          },
          false, // redrawPaths
          false, // animate
          false  // updateSyncedCharts
        );
      } catch {
        // Some ApexCharts versions don't support 4th arg — retry with 3
        try {
          await apexChart.updateOptions(
            { chart: { width: chartWidth, height: targetH } },
            false,
            false
          );
        } catch { /* ignore */ }
      }

      // Wait for the recalculated render to finish
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const cleanup = () => {
    try { if (apexChart) apexChart.destroy(); } catch { /* ignore */ }
    try { if (reactRoot) reactRoot.unmount(); } catch { /* ignore */ }
    try { wrapper.remove(); } catch { /* ignore */ }
  };

  return { container, cleanup };
}
