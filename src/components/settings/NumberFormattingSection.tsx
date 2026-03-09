'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SettingRow } from '@/components/shared/SettingRow';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { ThousandsSeparator, DecimalSeparator } from '@/types/chart';

export function NumberFormattingSection() {
  const settings = useEditorStore((s) => s.settings.numberFormatting);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('numberFormatting', updates);
  };

  return (
    <AccordionSection id="number-formatting" title="Number formatting">
      {/* Decimal places + Thousands sep + Decimal sep — 3-column row */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Decimals</label>
          <Input
            type="number"
            value={settings.decimalPlaces}
            onChange={(e) => update({ decimalPlaces: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs w-full"
            min={0}
            max={10}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Thousands</label>
          <Select
            value={settings.thousandsSeparator}
            onValueChange={(v: ThousandsSeparator) => update({ thousandsSeparator: v })}
          >
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=",">, (comma)</SelectItem>
              <SelectItem value=".">. (dot)</SelectItem>
              <SelectItem value=" ">(space)</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Decimal</label>
          <Select
            value={settings.decimalSeparator}
            onValueChange={(v: DecimalSeparator) => update({ decimalSeparator: v })}
          >
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=".">. (dot)</SelectItem>
              <SelectItem value=",">, (comma)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show trailing zeros */}
      <SettingRow label="Show trailing zeros" variant="inline">
        <Switch
          checked={settings.showTrailingZeros ?? true}
          onCheckedChange={(checked) => update({ showTrailingZeros: checked })}
        />
      </SettingRow>

      {/* Round values */}
      <SettingRow label="Round values" variant="inline">
        <Switch
          checked={settings.roundDecimal ?? true}
          onCheckedChange={(checked) => update({ roundDecimal: checked })}
        />
      </SettingRow>

      {/* Prefix + Suffix — 2-column row */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Prefix</label>
          <Input
            value={settings.prefix}
            onChange={(e) => update({ prefix: e.target.value })}
            className="h-7 text-xs w-full"
            placeholder="e.g. $"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Suffix</label>
          <Input
            value={settings.suffix}
            onChange={(e) => update({ suffix: e.target.value })}
            className="h-7 text-xs w-full"
            placeholder="e.g. %"
          />
        </div>
      </div>

      {/* X Axis custom decimals */}
      <SettingRow label="X axis custom decimals" variant="inline">
        <Switch
          checked={settings.xAxisCustomDecimals ?? false}
          onCheckedChange={(checked) => update({ xAxisCustomDecimals: checked })}
        />
      </SettingRow>

      {settings.xAxisCustomDecimals && (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">X axis decimals</label>
            <Input
              type="number"
              value={settings.xAxisDecimalPlaces ?? 0}
              onChange={(e) => update({ xAxisDecimalPlaces: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={0}
              max={10}
            />
          </div>
        </div>
      )}

      {/* Y Axis custom decimals */}
      <SettingRow label="Y axis custom decimals" variant="inline">
        <Switch
          checked={settings.yAxisCustomDecimals ?? false}
          onCheckedChange={(checked) => update({ yAxisCustomDecimals: checked })}
        />
      </SettingRow>

      {settings.yAxisCustomDecimals && (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Y axis decimals</label>
            <Input
              type="number"
              value={settings.yAxisDecimalPlaces ?? 0}
              onChange={(e) => update({ yAxisDecimalPlaces: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={0}
              max={10}
            />
          </div>
        </div>
      )}
      {/* Info custom formatting */}
      <SettingRow label="Info custom formatting" variant="inline">
        <Switch
          checked={settings.infoCustomDecimals ?? false}
          onCheckedChange={(checked) => update({ infoCustomDecimals: checked })}
        />
      </SettingRow>

      {settings.infoCustomDecimals && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Info decimals</label>
              <Input
                type="number"
                value={settings.infoDecimalPlaces ?? 2}
                onChange={(e) => update({ infoDecimalPlaces: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={0}
                max={10}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Info thousands</label>
              <Select
                value={settings.infoThousandsSeparator ?? settings.thousandsSeparator}
                onValueChange={(v: ThousandsSeparator) => update({ infoThousandsSeparator: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">, (comma)</SelectItem>
                  <SelectItem value=".">. (dot)</SelectItem>
                  <SelectItem value=" ">(space)</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Info decimal</label>
              <Select
                value={settings.infoDecimalSeparator ?? settings.decimalSeparator}
                onValueChange={(v: DecimalSeparator) => update({ infoDecimalSeparator: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".">. (dot)</SelectItem>
                  <SelectItem value=",">, (comma)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Info prefix</label>
              <Input
                value={settings.infoPrefix ?? ''}
                onChange={(e) => update({ infoPrefix: e.target.value })}
                className="h-7 text-xs w-full"
                placeholder="e.g. +"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Info suffix</label>
              <Input
                value={settings.infoSuffix ?? ''}
                onChange={(e) => update({ infoSuffix: e.target.value })}
                className="h-7 text-xs w-full"
                placeholder="e.g. %"
              />
            </div>
          </div>
        </>
      )}
    </AccordionSection>
  );
}
