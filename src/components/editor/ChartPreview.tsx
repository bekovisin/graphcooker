'use client';

import { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ResponsiveToolbar } from './ResponsiveToolbar';
import { CustomBarChart } from '@/components/chart/CustomBarChart';
import { GroupedBarChart } from '@/components/chart/GroupedBarChart';
import { LineChart } from '@/components/chart/LineChart';
import { BarChartCustom2 } from '@/components/chart/BarChartCustom2';
import { BarChartElection } from '@/components/chart/BarChartElection';
import type { QuestionSettings } from '@/types/chart';

const deviceWidths: Record<string, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
  fullscreen: '100%',
};

/** Check if HTML content has meaningful text (not just empty tags) */
function hasContent(html: string): boolean {
  if (!html) return false;
  // Strip HTML tags and check for non-whitespace content
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length > 0;
}

function QuestionBlock({ question }: { question: QuestionSettings }) {
  const hasText = hasContent(question.text);
  const hasSubtext = hasContent(question.subtext);
  if (!hasText && !hasSubtext) return null;

  const textDefaults = question.textDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#333333', lineHeight: 1.3 };
  const subtextDefaults = question.subtextDefaults || { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#666666', lineHeight: 1.4 };
  const accentLine = question.accentLine;
  const showAccent = accentLine?.show;

  const content = (
    <div style={{ textAlign: question.alignment, flex: 1 }}>
      {hasText && (
        <div
          style={{
            fontFamily: textDefaults.fontFamily,
            fontSize: textDefaults.fontSize,
            color: textDefaults.color,
            lineHeight: textDefaults.lineHeight,
            paddingTop: question.paddingTop,
            paddingRight: question.paddingRight,
            paddingBottom: question.paddingBottom,
            paddingLeft: question.paddingLeft,
          }}
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      )}
      {hasSubtext && (
        <div
          style={{
            fontFamily: subtextDefaults.fontFamily,
            fontSize: subtextDefaults.fontSize,
            color: subtextDefaults.color,
            lineHeight: subtextDefaults.lineHeight,
            paddingTop: question.subtextPaddingTop,
            paddingRight: question.subtextPaddingRight,
            paddingBottom: question.subtextPaddingBottom,
            paddingLeft: question.subtextPaddingLeft,
          }}
          dangerouslySetInnerHTML={{ __html: question.subtext }}
        />
      )}
    </div>
  );

  if (!showAccent) return content;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      {/* Accent Line */}
      <div
        style={{
          width: accentLine.width,
          minWidth: accentLine.width,
          backgroundColor: accentLine.color,
          borderRadius: accentLine.borderRadius,
          marginTop: accentLine.paddingTop,
          marginRight: accentLine.paddingRight,
          marginBottom: accentLine.paddingBottom,
          marginLeft: accentLine.paddingLeft,
          flexShrink: 0,
        }}
      />
      {content}
    </div>
  );
}

export function ChartPreview() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState(600);
  const { settings, data, columnMapping, columnOrder, seriesNames, previewDevice, customPreviewWidth, activeTab, canvasBackgroundColor } = useEditorStore();

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

  const isAutoHeight = settings.chartType.heightMode === 'auto';
  const hasFixedHeight = !isAutoHeight && previewDevice === 'custom';

  if (activeTab !== 'preview') return null;

  const hasQuestion = hasContent(settings.question?.text || '') || hasContent(settings.question?.subtext || '');
  const questionPosition = settings.question?.position || 'above';
  const isQuestionHorizontal = questionPosition === 'left' || questionPosition === 'right';

  const chartContent = (
    <div
      ref={chartAreaRef}
      className={hasFixedHeight ? 'flex-1 min-h-0' : ''}
      style={{
        overflow: 'hidden',
        flex: isQuestionHorizontal ? '1 1 0%' : undefined,
        minWidth: 0,
      }}
    >
      <div style={{ width: '100%', height: hasFixedHeight ? '100%' : undefined }}>
        {data.length > 0 ? (
          settings.chartType.chartType === 'line_chart' ? (
            <LineChart
              data={data}
              columnMapping={columnMapping}
              settings={settings}
              width={chartAreaWidth}
              height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
              columnOrder={columnOrder}
              seriesNames={seriesNames}
            />
          ) : settings.chartType.chartType === 'bar_grouped' ? (
            <GroupedBarChart
              data={data}
              columnMapping={columnMapping}
              settings={settings}
              width={chartAreaWidth}
              height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
              columnOrder={columnOrder}
              seriesNames={seriesNames}
            />
          ) : settings.chartType.chartType === 'bar_chart_custom_2' ? (
            <BarChartCustom2
              data={data}
              columnMapping={columnMapping}
              settings={settings}
              width={chartAreaWidth}
              height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
              columnOrder={columnOrder}
              seriesNames={seriesNames}
            />
          ) : settings.chartType.chartType === 'bar_stacked_2' ? (
            <BarChartElection
              data={data}
              columnMapping={columnMapping}
              settings={settings}
              width={chartAreaWidth}
              height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
              columnOrder={columnOrder}
              seriesNames={seriesNames}
            />
          ) : (
            <CustomBarChart
              data={data}
              columnMapping={columnMapping}
              settings={settings}
              width={chartAreaWidth}
              height={hasFixedHeight ? settings.chartType.standardHeight : undefined}
              columnOrder={columnOrder}
              seriesNames={seriesNames}
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
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: canvasBackgroundColor }}>
      {/* Toolbar */}
      <div className="flex items-center justify-start py-2 px-4 border-b bg-white">
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

          {/* Question — above */}
          {hasQuestion && questionPosition === 'above' && (
            <div className="shrink-0">
              <QuestionBlock question={settings.question} />
            </div>
          )}

          {/* Chart area — with optional left/right question */}
          {isQuestionHorizontal && hasQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'row', flex: hasFixedHeight ? '1 1 0%' : undefined, minHeight: 0 }}>
              {questionPosition === 'left' && (
                <div className="shrink-0" style={{ maxWidth: '40%' }}>
                  <QuestionBlock question={settings.question} />
                </div>
              )}
              {chartContent}
              {questionPosition === 'right' && (
                <div className="shrink-0" style={{ maxWidth: '40%' }}>
                  <QuestionBlock question={settings.question} />
                </div>
              )}
            </div>
          ) : (
            chartContent
          )}

          {/* Question — below */}
          {hasQuestion && questionPosition === 'below' && (
            <div className="shrink-0">
              <QuestionBlock question={settings.question} />
            </div>
          )}

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
