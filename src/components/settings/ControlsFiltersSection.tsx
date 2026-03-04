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
import { Switch } from '@/components/ui/switch';
import type { FilterMode, ControlPosition } from '@/types/chart';

const controlPositionLabels: Record<ControlPosition, string> = {
  top_left: 'Top left',
  top_right: 'Top right',
  bottom_left: 'Bottom left',
  bottom_right: 'Bottom right',
};

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

export function ControlsFiltersSection() {
  const settings = useEditorStore((s) => s.settings.controlsFilters);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('controlsFilters', updates);
  };

  return (
    <AccordionSection id="controls-filters" title="Controls & filters">
      {/* Series Filter - 3-button tab menu */}
      <SettingRow label="Series filter">
        <TabMenu
          value={settings.seriesFilter}
          onChange={(v) => update({ seriesFilter: v as FilterMode })}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'single_select', label: 'Single' },
            { value: 'multi_select', label: 'Multi' },
          ]}
        />
      </SettingRow>

      {/* Max Series to Show - smaller input */}
      <NumberInput
        label="Max series to show"
        value={settings.maxSeriesToShow}
        onChange={(v) => update({ maxSeriesToShow: v })}
        min={1}
        max={99999}
      />

      {/* Filter Rows with No Data */}
      <SettingRow label="Filter rows with no data" variant="inline">
        <Switch
          checked={settings.filterRowsNoData}
          onCheckedChange={(checked) => update({ filterRowsNoData: checked })}
        />
      </SettingRow>

      {/* Control Position */}
      <SettingRow label="Control position">
        <Select
          value={settings.controlPosition}
          onValueChange={(v) => update({ controlPosition: v as ControlPosition })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(controlPositionLabels) as [ControlPosition, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </SettingRow>
    </AccordionSection>
  );
}
