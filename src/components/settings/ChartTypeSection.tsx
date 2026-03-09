'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { SettingRow } from '@/components/shared/SettingRow';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  ChartType,
  StackSortMode,
  GridMode,
  HeightMode,
  AggregationMode,
  SortMode,
} from '@/types/chart';

const chartTypeOptions: { value: ChartType; label: string }[] = [
  { value: 'bar_stacked_custom', label: 'Bar chart stacked (custom)' },
  { value: 'bar_grouped', label: 'Bar chart grouped' },
  { value: 'bar_chart_custom_2', label: 'Bar chart custom 2' },
  { value: 'bar_stacked_2', label: 'Bar chart stacked 2 (Election)' },
  { value: 'line_chart', label: 'Line chart' },
];

function TabMenu<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border border-gray-300 overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
            value === opt.value
              ? 'bg-blue-500 text-white font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          } ${i > 0 ? 'border-l border-gray-300' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ChartTypeSection() {
  const settings = useEditorStore((s) => s.settings.chartType);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('chartType', updates);
  };

  return (
    <AccordionSection id="chart-type" title="Chart type" defaultOpen>
      {/* Chart Type */}
      <SettingRow label="Chart type">
        <Select
          value={settings.chartType}
          onValueChange={(v) => update({ chartType: v as ChartType })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chartTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Stack Sort Mode - 3-button tab menu */}
      <SettingRow label="Stack sort mode">
        <TabMenu
          value={settings.stackSortMode}
          onChange={(v) => update({ stackSortMode: v as StackSortMode })}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'ascending', label: 'Ascending' },
            { value: 'descending', label: 'Descending' },
          ]}
        />
      </SettingRow>

      {/* Grid Mode - 2-button tab menu */}
      <SettingRow label="Grid mode">
        <TabMenu
          value={settings.gridMode}
          onChange={(v) => update({ gridMode: v as GridMode })}
          options={[
            { value: 'single', label: 'Single chart' },
            { value: 'grid', label: 'Grid of charts' },
          ]}
        />
      </SettingRow>

      {/* Height Mode - 3-button tab menu */}
      <SettingRow label="Height mode">
        <TabMenu
          value={settings.heightMode}
          onChange={(v) => update({ heightMode: v as HeightMode })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'standard', label: 'Standard' },
            { value: 'aspect_ratio', label: 'Aspect ratio' },
          ]}
        />
      </SettingRow>

      {settings.heightMode === 'standard' && (
        <NumberInput
          label="Height (px)"
          value={settings.standardHeight}
          onChange={(v) => update({ standardHeight: v })}
          min={100}
          max={2000}
          step={10}
          suffix="px"
        />
      )}

      {settings.heightMode === 'aspect_ratio' && (
        <NumberInput
          label="Aspect ratio"
          value={settings.aspectRatio}
          onChange={(v) => update({ aspectRatio: v })}
          min={0.1}
          max={5}
          step={0.1}
        />
      )}

      {/* Aggregation Mode */}
      <SettingRow label="Aggregation mode">
        <Select
          value={settings.aggregationMode}
          onValueChange={(v) => update({ aggregationMode: v as AggregationMode })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">None</SelectItem>
            <SelectItem value="sum" className="text-xs">Sum</SelectItem>
            <SelectItem value="average" className="text-xs">Average</SelectItem>
            <SelectItem value="count" className="text-xs">Count</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Sort Mode - 3-button tab menu */}
      <SettingRow label="Sort mode">
        <TabMenu
          value={settings.sortMode}
          onChange={(v) => update({ sortMode: v as SortMode })}
          options={[
            { value: 'data_sheet', label: 'Data sheet' },
            { value: 'value', label: 'Value' },
            { value: 'label', label: 'Label' },
          ]}
        />
      </SettingRow>
    </AccordionSection>
  );
}
