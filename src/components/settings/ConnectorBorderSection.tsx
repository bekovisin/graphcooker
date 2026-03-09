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
} from '@/types/chart';

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

          {/* Length is kept for backward compatibility but hidden since connector is now vertical */}

          <NumberInput
            label="Padding (bar side)"
            value={settings.paddingBar}
            onChange={(v) => update({ paddingBar: v })}
            min={-50}
            max={50}
            step={0.01}
            suffix="px"
          />

          <NumberInput
            label="Padding (label side)"
            value={settings.paddingLabel}
            onChange={(v) => update({ paddingLabel: v })}
            min={-50}
            max={50}
            step={0.01}
            suffix="px"
          />

          {/* Alignment hidden — vertical connector always spans full bar height */}
        </>
      )}
    </AccordionSection>
  );
}
