/**
 * Offscreen chart renderer for dashboard bulk export.
 *
 * Renders a chart into a hidden off-screen container at the requested
 * export dimensions, waits for it to fully paint, and then returns the
 * container element so that the export functions (exportPng, exportSvg, etc.)
 * can capture the rendered output.
 */

import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { buildChartData } from '@/lib/chart/mapSettingsToApex';

interface RenderResult {
  /** The off-screen container DOM node (contains the full chart with header/footer). */
  container: HTMLElement;
  /** Call this after you're done capturing to clean up the DOM + React root. */
  cleanup: () => void;
}

interface RenderOptions {
  width: number;
  height?: number;
  transparent?: boolean;
}

/**
 * Render a chart into a hidden container at the requested dimensions.
 * Works for both ApexCharts and CustomBarChart (SVG).
 */
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

  // Create off-screen wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    left: -20000px;
    top: 0;
    z-index: -9999;
    pointer-events: none;
    opacity: 1;
  `;
  document.body.appendChild(wrapper);

  // Create chart container (mirrors ChartPreview's #chart-container structure)
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
  `;
  wrapper.appendChild(container);

  // ── Header ──
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
  }

  // ── Chart area ──
  const chartArea = document.createElement('div');
  chartArea.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow: hidden;
    ${isCustomChart ? '' : `
      padding: ${settings.layout.paddingTop}px ${settings.layout.paddingRight}px ${settings.layout.paddingBottom}px ${settings.layout.paddingLeft}px;
      background-color: ${isCustomChart ? 'transparent' : settings.plotBackground.backgroundColor};
    `}
    ${settings.plotBackground.border ? `border: ${settings.plotBackground.borderWidth}px solid ${settings.plotBackground.borderColor};` : ''}
  `;
  container.appendChild(chartArea);

  // ── Footer ──
  if (settings.footer.sourceName || settings.footer.notePrimary) {
    const footer = document.createElement('div');
    footer.style.cssText = `
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
      footer.appendChild(p);
    }
    if (settings.footer.notePrimary) {
      const p = document.createElement('p');
      p.textContent = settings.footer.notePrimary;
      p.style.cssText = `font-size: ${settings.footer.size - 1}px; color: ${settings.footer.color}; opacity: 0.8; margin: 4px 0 0 0;`;
      footer.appendChild(p);
    }
    container.appendChild(footer);
  }

  // ── Render chart content ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reactRoot: any = null;

  if (isCustomChart) {
    // CustomBarChart is a React component — render it into the chart area
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { CustomBarChart } = await import('@/components/chart/CustomBarChart');

    const chartAreaHeight = chartArea.clientHeight || (height - 80);
    reactRoot = createRoot(chartArea);
    reactRoot.render(
      React.createElement(CustomBarChart, {
        data,
        columnMapping,
        settings,
        width,
        height: chartAreaHeight > 0 ? chartAreaHeight : undefined,
        columnOrder,
        seriesNames,
      })
    );

    // Wait for React to paint
    await new Promise((r) => setTimeout(r, 300));
  } else {
    // ApexCharts — use the library directly (not the React wrapper)
    const { series, options: chartOptions } = buildChartData(
      data,
      columnMapping,
      settings,
      columnOrder,
      seriesNames
    );

    if (series.length > 0) {
      const ApexChartsLib = (await import('apexcharts')).default;

      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'width: 100%; height: 100%;';
      chartArea.appendChild(chartDiv);

      // Compute chart height: use the remaining space after header/footer
      const headerH = container.querySelector('h2')?.parentElement?.offsetHeight || 0;
      const footerH = container.querySelector('div:last-child') !== chartArea
        ? (container.lastElementChild as HTMLElement)?.offsetHeight || 0
        : 0;
      const availableHeight = height - headerH - footerH -
        settings.layout.paddingTop - settings.layout.paddingBottom;

      const mergedOptions: ApexCharts.ApexOptions = {
        ...chartOptions,
        series,
        chart: {
          ...chartOptions.chart,
          type: 'bar',
          height: Math.max(100, availableHeight),
          width: width - settings.layout.paddingLeft - settings.layout.paddingRight,
          animations: { enabled: false },
          toolbar: { show: false },
        },
      };

      const chart = new ApexChartsLib(chartDiv, mergedOptions);
      await chart.render();

      // Wait for ApexCharts to fully render
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const cleanup = () => {
    try {
      if (reactRoot) reactRoot.unmount();
    } catch {
      // ignore
    }
    try {
      wrapper.remove();
    } catch {
      // ignore
    }
  };

  return { container, cleanup };
}
