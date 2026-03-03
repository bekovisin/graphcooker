'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { Input } from '@/components/ui/input';
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
    </AccordionSection>
  );
}
