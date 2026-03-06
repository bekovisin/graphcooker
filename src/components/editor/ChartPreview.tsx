'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editorStore';
import { buildChartData } from '@/lib/chart/mapSettingsToApex';
import { ResponsiveToolbar } from './ResponsiveToolbar';
import { CustomBarChart } from '@/components/chart/CustomBarChart';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const deviceWidths: Record<string, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
  fullscreen: '100%',
};

export function ChartPreview() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState(600);
  const { settings, data, columnMapping, columnOrder, previewDevice, customPreviewWidth, activeTab, canvasBackgroundColor } = useEditorStore();

  const isCustomChart = settings.chartType.chartType === 'bar_stacked_custom';

  // Measure chart area width — always observe so width is ready when switching tabs/chart types
  useEffect(() => {
    if (!chartAreaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setChartAreaWidth(w);
      }
    });
    observer.observe(chartAreaRef.current);
    const w = chartAreaRef.current.clientWidth;
    if (w > 0) setChartAreaWidth(w);
    return () => observer.disconnect();
  }, [activeTab]); // re-attach when tab changes (component remounts)

  const { series, options, autoHeight, isAboveBars, categories } = useMemo(
    () => buildChartData(data, columnMapping, settings, columnOrder),
    [data, columnMapping, settings, columnOrder]
  );

  // Force ApexCharts remount when formatter-dependent settings change
  const chartKey = useMemo(() => {
    const nf = settings.numberFormatting;
    const ab = isAboveBars ? 'ab' : 'ax';
    return `${nf.decimalPlaces}-${nf.thousandsSeparator}-${nf.decimalSeparator}-${nf.prefix}-${nf.suffix}-${ab}`;
  }, [settings.numberFormatting, isAboveBars]);

  const isAutoHeight = settings.chartType.heightMode === 'auto';
  const hasFixedHeight = !isAutoHeight && previewDevice === 'custom';

  const chartHeight = (() => {
    if (isAutoHeight) return autoHeight;
    if (previewDevice === 'custom') return '100%';
    return settings.chartType.standardHeight;
  })();

  if (activeTab !== 'preview') return null;

  const yAxisStyle = settings.yAxis.tickStyling;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: canvasBackgroundColor }}>
      {/* Toolbar */}
      <div className="flex items-center justify-center py-2 px-4 border-b bg-white">
        <ResponsiveToolbar />
      </div>

      {/* Chart container */}
      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div
          ref={chartRef}
          id="chart-container"
          className="rounded-lg shadow-sm border transition-all duration-300"
          style={{
            width: previewDevice === 'custom' ? `${customPreviewWidth}px` : deviceWidths[previewDevice],
            height: hasFixedHeight ? `${settings.chartType.standardHeight}px` : 'fit-content',
            maxWidth: settings.layout.maxWidth > 0 ? settings.layout.maxWidth : undefined,
            backgroundColor: (() => {
              const bg = settings.layout.backgroundColor;
              const opacity = settings.layout.backgroundOpacity ?? 100;
              if (bg === 'transparent' || opacity === 0) return 'transparent';
              if (opacity < 100 && bg && bg.startsWith('#')) {
                // Convert hex + opacity to rgba
                const r = parseInt(bg.slice(1, 3), 16);
                const g = parseInt(bg.slice(3, 5), 16);
                const b = parseInt(bg.slice(5, 7), 16);
                return `rgba(${r},${g},${b},${opacity / 100})`;
              }
              return bg;
            })(),
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          {(settings.header.title || settings.header.subtitle || settings.header.text) && (
            <div
              className="px-6 pt-5 shrink-0"
              style={{
                textAlign: settings.header.alignment,
                borderTop:
                  settings.header.border === 'top' || settings.header.border === 'both'
                    ? '2px solid #e5e7eb'
                    : undefined,
                borderBottom:
                  settings.header.border === 'bottom' || settings.header.border === 'both'
                    ? '2px solid #e5e7eb'
                    : undefined,
              }}
            >
              {settings.header.title && (
                <h2
                  style={{
                    fontFamily: settings.header.titleStyling.fontFamily,
                    fontSize: settings.header.titleStyling.fontSize,
                    fontWeight: settings.header.titleStyling.fontWeight === 'bold' ? 700 : 400,
                    color: settings.header.titleStyling.color,
                    lineHeight: settings.header.titleStyling.lineHeight,
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {settings.header.title}
                </h2>
              )}
              {settings.header.subtitle && (
                <p
                  style={{
                    fontFamily: settings.header.subtitleStyling.fontFamily,
                    fontSize: settings.header.subtitleStyling.fontSize,
                    fontWeight: settings.header.subtitleStyling.fontWeight === 'bold' ? 700 : 400,
                    color: settings.header.subtitleStyling.color,
                    lineHeight: settings.header.subtitleStyling.lineHeight,
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {settings.header.subtitle}
                </p>
              )}
              {settings.header.text && (
                <p
                  style={{
                    fontFamily: settings.header.textStyling.fontFamily,
                    fontSize: settings.header.textStyling.fontSize,
                    fontWeight: settings.header.textStyling.fontWeight === 'bold' ? 700 : 400,
                    color: settings.header.textStyling.color,
                    lineHeight: settings.header.textStyling.lineHeight,
                    margin: 0,
                  }}
                >
                  {settings.header.text}
                </p>
              )}
            </div>
          )}

          {/* Chart area with layout padding */}
          <div
            ref={chartAreaRef}
            className={hasFixedHeight ? 'flex-1 min-h-0' : ''}
            style={{
              paddingTop: isCustomChart ? 0 : settings.layout.paddingTop,
              paddingRight: isCustomChart ? 0 : settings.layout.paddingRight,
              paddingBottom: isCustomChart ? 0 : settings.layout.paddingBottom,
              paddingLeft: isCustomChart ? 0 : settings.layout.paddingLeft,
              backgroundColor: isCustomChart ? 'transparent' : settings.plotBackground.backgroundColor,
              border: settings.plotBackground.border
                ? `${settings.plotBackground.borderWidth}px solid ${settings.plotBackground.borderColor}`
                : undefined,
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', height: hasFixedHeight ? '100%' : undefined }}>
              {isCustomChart ? (
                /* ── Custom SVG Bar Chart ── */
                <CustomBarChart
                  data={data}
                  columnMapping={columnMapping}
                  settings={settings}
                  width={chartAreaWidth}
                  height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
                  columnOrder={columnOrder}
                />
              ) : series.length > 0 ? (
                isAboveBars ? (
                  <div>
                    {categories.map((cat, i) => {
                      // Build per-category series (single bar per series)
                      const catSeries = series.map((s) => ({
                        name: s.name,
                        data: [(s.data as number[])[i] || 0],
                      }));
                      // Clone options for single-category chart
                      const isLast = i === categories.length - 1;
                      const catXaxis = isLast
                        ? { ...options.xaxis, categories: [cat] }
                        : {
                            ...options.xaxis,
                            categories: [cat],
                            labels: { ...options.xaxis?.labels, show: false },
                            axisBorder: { show: false },
                            axisTicks: { show: false },
                          };
                      const catOptions: ApexCharts.ApexOptions = {
                        ...options,
                        xaxis: catXaxis,
                        legend: { ...options.legend, show: false },
                        grid: {
                          ...options.grid,
                          padding: { top: 0, right: 10, bottom: 0, left: 0 },
                          xaxis: { lines: { show: isLast && (options.grid?.xaxis?.lines?.show || false) } },
                        },
                        chart: {
                          ...options.chart,
                          animations: { enabled: false },
                        },
                      };
                      const barH = settings.bars.barHeight;
                      const xAxisH = i === categories.length - 1 ? 30 : 0;
                      return (
                        <div key={`${chartKey}-${i}`}>
                          <div
                            style={{
                              fontFamily: yAxisStyle.fontFamily,
                              fontSize: `${yAxisStyle.fontSize}px`,
                              fontWeight: yAxisStyle.fontWeight === 'bold' ? 700 : 400,
                              color: yAxisStyle.color,
                              padding: '4px 0 2px 4px',
                              lineHeight: 1.2,
                            }}
                          >
                            {cat}
                          </div>
                          <ReactApexChart
                            options={catOptions}
                            series={catSeries}
                            type="bar"
                            height={barH + xAxisH + 8}
                          />
                        </div>
                      );
                    })}
                    {/* Show legend at bottom */}
                    {settings.legend.show && (
                      <div style={{ marginTop: settings.legend.marginTop || 0 }}>
                        <ReactApexChart
                          options={{
                            ...options,
                            chart: { ...options.chart, height: 40, animations: { enabled: false } },
                            xaxis: { ...options.xaxis, labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                            yaxis: { show: false, labels: { show: false } },
                            grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                            legend: { ...options.legend, show: true },
                          }}
                          series={series.map((s) => ({ ...s, data: [0] }))}
                          type="bar"
                          height={50}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <ReactApexChart
                    key={chartKey}
                    options={options}
                    series={series}
                    type="bar"
                    height={chartHeight}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
                      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                      <path d="M18 17V9" />
                      <path d="M13 17V5" />
                      <path d="M8 17v-3" />
                    </svg>
                    <p>Add data in the Data tab to see your chart</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {(settings.footer.sourceName || settings.footer.notePrimary) && (
            <div
              className="px-6 pb-4 pt-2 shrink-0"
              style={{
                textAlign: settings.footer.alignment,
                borderTop:
                  settings.footer.border === 'top' || settings.footer.border === 'both'
                    ? '1px solid #e5e7eb'
                    : undefined,
                borderBottom:
                  settings.footer.border === 'bottom' || settings.footer.border === 'both'
                    ? '1px solid #e5e7eb'
                    : undefined,
              }}
            >
              {settings.footer.sourceName && (
                <p
                  style={{
                    fontSize: settings.footer.size,
                    color: settings.footer.color,
                    margin: 0,
                  }}
                >
                  {settings.footer.sourceLabel}:{' '}
                  {settings.footer.sourceUrl ? (
                    <a
                      href={settings.footer.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {settings.footer.sourceName}
                    </a>
                  ) : (
                    settings.footer.sourceName
                  )}
                </p>
              )}
              {settings.footer.notePrimary && (
                <p
                  style={{
                    fontSize: settings.footer.size - 1,
                    color: settings.footer.color,
                    margin: '4px 0 0 0',
                    opacity: 0.8,
                  }}
                >
                  {settings.footer.notePrimary}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
