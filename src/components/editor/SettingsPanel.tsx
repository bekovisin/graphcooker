'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { SearchSettings } from '@/components/shared/SearchSettings';
import { useEditorStore } from '@/store/editorStore';
import { useSettingsPresetStore } from '@/store/settingsPresetStore';

// Settings sections
import { ChartTypeSection } from '@/components/settings/ChartTypeSection';
import { ControlsFiltersSection } from '@/components/settings/ControlsFiltersSection';
import { ColorsSection } from '@/components/settings/ColorsSection';
import { BarsSection } from '@/components/settings/BarsSection';
import { LineDotsAreasSection } from '@/components/settings/LineDotsAreasSection';
import { LabelsSection } from '@/components/settings/LabelsSection';
import { XAxisSection } from '@/components/settings/XAxisSection';
import { YAxisSection } from '@/components/settings/YAxisSection';
import { PlotBackgroundSection } from '@/components/settings/PlotBackgroundSection';
import { NumberFormattingSection } from '@/components/settings/NumberFormattingSection';
import { LegendSection } from '@/components/settings/LegendSection';
import { PopupsPanelsSection } from '@/components/settings/PopupsPanelsSection';
import { AnnotationsSection } from '@/components/settings/AnnotationsSection';
import { AnimationsSection } from '@/components/settings/AnimationsSection';
import { LayoutSection } from '@/components/settings/LayoutSection';
import { QuestionSection } from '@/components/settings/QuestionSection';
import { HeaderSection } from '@/components/settings/HeaderSection';
import { FooterSection } from '@/components/settings/FooterSection';
import { AccessibilitySection } from '@/components/settings/AccessibilitySection';
import { BarBackgroundSection } from '@/components/settings/BarBackgroundSection';
import { BarRowBordersSection } from '@/components/settings/BarRowBordersSection';
import { ConnectorBorderSection } from '@/components/settings/ConnectorBorderSection';
import { InfoColumnSection } from '@/components/settings/InfoColumnSection';
import { RowImagesSection } from '@/components/settings/RowImagesSection';

const barSections = [
  { id: 'chart-type', title: 'Chart type', Component: ChartTypeSection },
  { id: 'controls-filters', title: 'Controls & filters', Component: ControlsFiltersSection },
  { id: 'colors', title: 'Colors', Component: ColorsSection },
  { id: 'bars', title: 'Bars', Component: BarsSection },
  { id: 'labels', title: 'Labels', Component: LabelsSection },
  { id: 'x-axis', title: 'X axis', Component: XAxisSection },
  { id: 'y-axis', title: 'Y axis', Component: YAxisSection },
  { id: 'plot-background', title: 'Plot background', Component: PlotBackgroundSection },
  { id: 'number-formatting', title: 'Number formatting', Component: NumberFormattingSection },
  { id: 'legend', title: 'Legend', Component: LegendSection },
  { id: 'popups-panels', title: 'Popups & panels', Component: PopupsPanelsSection },
  { id: 'annotations', title: 'Annotations', Component: AnnotationsSection },
  { id: 'animations', title: 'Animations', Component: AnimationsSection },
  { id: 'layout', title: 'Layout', Component: LayoutSection },
  { id: 'question', title: 'Question', Component: QuestionSection },
  { id: 'header', title: 'Header', Component: HeaderSection },
  { id: 'footer', title: 'Footer', Component: FooterSection },
  { id: 'accessibility', title: 'Accessibility', Component: AccessibilitySection },
];

const barCustom2Sections = [
  { id: 'chart-type', title: 'Chart type', Component: ChartTypeSection },
  { id: 'controls-filters', title: 'Controls & filters', Component: ControlsFiltersSection },
  { id: 'colors', title: 'Colors', Component: ColorsSection },
  { id: 'bars', title: 'Bars', Component: BarsSection },
  { id: 'bar-background', title: 'Bar background', Component: BarBackgroundSection },
  { id: 'bar-row-borders', title: 'Bar row borders', Component: BarRowBordersSection },
  { id: 'connector-border', title: 'Connector border', Component: ConnectorBorderSection },
  { id: 'info-column', title: 'Info column', Component: InfoColumnSection },
  { id: 'row-images', title: 'Row images', Component: RowImagesSection },
  { id: 'labels', title: 'Labels', Component: LabelsSection },
  { id: 'x-axis', title: 'X axis', Component: XAxisSection },
  { id: 'y-axis', title: 'Y axis', Component: YAxisSection },
  { id: 'plot-background', title: 'Plot background', Component: PlotBackgroundSection },
  { id: 'number-formatting', title: 'Number formatting', Component: NumberFormattingSection },
  { id: 'legend', title: 'Legend', Component: LegendSection },
  { id: 'popups-panels', title: 'Popups & panels', Component: PopupsPanelsSection },
  { id: 'annotations', title: 'Annotations', Component: AnnotationsSection },
  { id: 'animations', title: 'Animations', Component: AnimationsSection },
  { id: 'layout', title: 'Layout', Component: LayoutSection },
  { id: 'question', title: 'Question', Component: QuestionSection },
  { id: 'header', title: 'Header', Component: HeaderSection },
  { id: 'footer', title: 'Footer', Component: FooterSection },
  { id: 'accessibility', title: 'Accessibility', Component: AccessibilitySection },
];

const lineSections = [
  { id: 'chart-type', title: 'Chart type', Component: ChartTypeSection },
  { id: 'controls-filters', title: 'Controls & filters', Component: ControlsFiltersSection },
  { id: 'colors', title: 'Colors', Component: ColorsSection },
  { id: 'line-dots-areas', title: 'Lines, dots and areas', Component: LineDotsAreasSection },
  { id: 'labels', title: 'Labels', Component: LabelsSection },
  { id: 'x-axis', title: 'X axis', Component: XAxisSection },
  { id: 'y-axis', title: 'Y axis', Component: YAxisSection },
  { id: 'plot-background', title: 'Plot background', Component: PlotBackgroundSection },
  { id: 'number-formatting', title: 'Number formatting', Component: NumberFormattingSection },
  { id: 'legend', title: 'Legend', Component: LegendSection },
  { id: 'popups-panels', title: 'Popups & panels', Component: PopupsPanelsSection },
  { id: 'annotations', title: 'Annotations', Component: AnnotationsSection },
  { id: 'animations', title: 'Animations', Component: AnimationsSection },
  { id: 'layout', title: 'Layout', Component: LayoutSection },
  { id: 'question', title: 'Question', Component: QuestionSection },
  { id: 'header', title: 'Header', Component: HeaderSection },
  { id: 'footer', title: 'Footer', Component: FooterSection },
  { id: 'accessibility', title: 'Accessibility', Component: AccessibilitySection },
];

export function SettingsPanel() {
  const { settingsSearchQuery } = useEditorStore();
  const chartType = useEditorStore((s) => s.settings.chartType.chartType);
  const { presets, activePresetId, setActivePreset } = useSettingsPresetStore();
  const [mode, setMode] = useState<'advanced' | 'custom'>('advanced');

  const sections = chartType === 'line_chart'
    ? lineSections
    : chartType === 'bar_chart_custom_2'
      ? barCustom2Sections
      : barSections;
  const activePreset = presets.find((p) => p.id === activePresetId);

  // Filter by search query first
  let filteredSections = settingsSearchQuery
    ? sections.filter((s) => s.title.toLowerCase().includes(settingsSearchQuery.toLowerCase()))
    : sections;

  // Then filter by preset if in custom mode
  if (mode === 'custom' && activePreset) {
    // Use granular visibleSettings if available, otherwise fall back to visibleSections
    if (activePreset.visibleSettings && activePreset.visibleSettings.length > 0) {
      filteredSections = filteredSections.filter((s) =>
        activePreset.visibleSettings.some((vs) => vs.startsWith(`${s.id}.`))
      );
    } else {
      filteredSections = filteredSections.filter((s) =>
        activePreset.visibleSections.includes(s.id)
      );
    }
  }

  return (
    <div className="w-[340px] border-l flex flex-col shrink-0" style={{ backgroundColor: '#f7f7f7' }}>
      {/* Mode toggle */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center bg-gray-200/60 rounded-lg p-0.5">
          <button
            onClick={() => setMode('advanced')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'advanced'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advanced
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'custom'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Preset picker (only in custom mode) */}
        {mode === 'custom' && (
          <div className="mt-2">
            {presets.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                No presets saved. Go to General Settings to create one.
              </p>
            ) : (
              <select
                value={activePresetId || ''}
                onChange={(e) => setActivePreset(e.target.value || null)}
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Select a preset...</option>
                {presets.map((p) => {
                  const count = p.visibleSettings?.length || p.visibleSections.length;
                  const label = p.visibleSettings?.length ? 'settings' : 'sections';
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count} {label})
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}
      </div>

      <SearchSettings />
      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible className="pb-8">
          {filteredSections.map((section) => (
            <section.Component key={section.id} />
          ))}
          {filteredSections.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {mode === 'custom' && !activePreset
                ? 'Select a preset to customize visible sections.'
                : `No settings match "${settingsSearchQuery}"`}
            </div>
          )}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
