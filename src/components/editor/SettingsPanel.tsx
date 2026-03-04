'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { SearchSettings } from '@/components/shared/SearchSettings';
import { useEditorStore } from '@/store/editorStore';

// Settings sections
import { ChartTypeSection } from '@/components/settings/ChartTypeSection';
import { ControlsFiltersSection } from '@/components/settings/ControlsFiltersSection';
import { ColorsSection } from '@/components/settings/ColorsSection';
import { BarsSection } from '@/components/settings/BarsSection';
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
import { HeaderSection } from '@/components/settings/HeaderSection';
import { FooterSection } from '@/components/settings/FooterSection';
import { AccessibilitySection } from '@/components/settings/AccessibilitySection';

const sections = [
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
  { id: 'header', title: 'Header', Component: HeaderSection },
  { id: 'footer', title: 'Footer', Component: FooterSection },
  { id: 'accessibility', title: 'Accessibility', Component: AccessibilitySection },
];

export function SettingsPanel() {
  const { settingsSearchQuery } = useEditorStore();

  const filteredSections = settingsSearchQuery
    ? sections.filter((s) => s.title.toLowerCase().includes(settingsSearchQuery.toLowerCase()))
    : sections;

  return (
    <div className="w-[340px] border-l bg-gray-50/40 flex flex-col shrink-0">
      <SearchSettings />
      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible className="pb-8">
          {filteredSections.map((section) => (
            <section.Component key={section.id} />
          ))}
          {filteredSections.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No settings match &ldquo;{settingsSearchQuery}&rdquo;
            </div>
          )}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
