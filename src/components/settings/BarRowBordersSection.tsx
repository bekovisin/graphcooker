'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  BarRowBordersSettings,
  BarRowBordersMode,
  BorderLineStyle,
  BorderAlignment,
} from '@/types/chart';

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

export function BarRowBordersSection() {
  const settings = useEditorStore((s) => s.settings.barRowBorders);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<BarRowBordersSettings>) => {
    updateSettings('barRowBorders', updates);
  };

  return (
    <AccordionSection id="bar-row-borders" title="Bar row borders">
      <SettingRow label="Show row borders" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
          <SettingRow label="Mode">
            <TabMenu
              value={settings.mode}
              onChange={(v) => update({ mode: v as BarRowBordersMode })}
              options={[
                { value: 'all', label: 'All rows' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </SettingRow>

          {settings.mode === 'custom' && (
            <SettingRow label="Custom rows">
              <Input
                value={settings.customRows.join(', ')}
                onChange={(e) => {
                  const rows = e.target.value
                    .split(/[,\s]+/)
                    .map((s) => parseInt(s.trim()))
                    .filter((n) => !isNaN(n) && n >= 0);
                  update({ customRows: rows });
                }}
                className="h-7 text-xs w-full"
                placeholder="e.g. 1, 3, 5"
              />
            </SettingRow>
          )}

          <SettingRow label="Color">
            <ColorPicker
              value={settings.color}
              onChange={(color) => update({ color })}
            />
          </SettingRow>

          <NumberInput
            label="Width"
            value={settings.width}
            onChange={(v) => update({ width: v })}
            min={0.5}
            max={10}
            step={0.5}
            suffix="px"
          />

          <SettingRow label="Style">
            <Select
              value={settings.style}
              onValueChange={(v) => update({ style: v as BorderLineStyle })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
                <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {settings.style === 'dashed' && (
            <NumberInput
              label="Dash length"
              value={settings.dashLength}
              onChange={(v) => update({ dashLength: v })}
              min={1}
              max={20}
              step={1}
              suffix="px"
            />
          )}

          <SettingRow label="Alignment">
            <TabMenu
              value={settings.alignment}
              onChange={(v) => update({ alignment: v as BorderAlignment })}
              options={[
                { value: 'top', label: 'Top' },
                { value: 'center', label: 'Center' },
                { value: 'bottom', label: 'Bottom' },
              ]}
            />
          </SettingRow>
        </>
      )}
    </AccordionSection>
  );
}
