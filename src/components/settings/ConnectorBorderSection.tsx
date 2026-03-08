'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  ConnectorBorderSettings,
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

export function ConnectorBorderSection() {
  const settings = useEditorStore((s) => s.settings.connectorBorder);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<ConnectorBorderSettings>) => {
    updateSettings('connectorBorder', updates);
  };

  return (
    <AccordionSection id="connector-border" title="Connector border">
      <SettingRow label="Show connector" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
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
            max={5}
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

          <NumberInput
            label="Length"
            value={settings.length}
            onChange={(v) => update({ length: v })}
            min={0}
            max={100}
            step={1}
            suffix="px"
          />

          <NumberInput
            label="Padding (bar side)"
            value={settings.paddingBar}
            onChange={(v) => update({ paddingBar: v })}
            min={0}
            max={50}
            step={1}
            suffix="px"
          />

          <NumberInput
            label="Padding (label side)"
            value={settings.paddingLabel}
            onChange={(v) => update({ paddingLabel: v })}
            min={0}
            max={50}
            step={1}
            suffix="px"
          />

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
