'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  ColumnsSettings,
  ColumnMode,
  ColumnValuePosition,
  FontWeight,
} from '@/types/chart';

// ── Reusable segmented tab menu (matches design language) ──
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

// ── Slider paired with a number input (matches BarsSection) ──
function SliderWithInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-xs text-gray-600 shrink-0">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) onChange(Math.max(min, Math.min(max, num)));
            }}
            min={min}
            max={max}
            step={step}
            className="h-7 text-xs w-20"
          />
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
      {children}
    </div>
  );
}

const fontFamilyOptions = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Montserrat, sans-serif',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'system-ui',
];

const weightOptions: { value: FontWeight; label: string }[] = [
  { value: '300', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' },
  { value: 'bold', label: 'Bold' },
  { value: '800', label: 'Extra-bold' },
];

export function ColumnsSection() {
  const settings = useEditorStore((s) => s.settings.columns);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<ColumnsSettings>) => {
    updateSettings('columns', updates);
  };

  return (
    <AccordionSection id="columns" title="Columns">
      {/* Stacking mode */}
      <SettingRow label="Mode">
        <TabMenu
          value={settings.mode}
          onChange={(v) => update({ mode: v as ColumnMode })}
          options={[
            { value: 'grouped', label: 'Grouped' },
            { value: 'stacked', label: 'Stacked' },
            { value: 'stacked_100', label: '100%' },
          ]}
        />
      </SettingRow>

      {/* Geometry */}
      <SliderWithInput
        label="Column width"
        value={settings.columnWidth}
        onChange={(v) => update({ columnWidth: v })}
        min={0.1}
        max={1}
        step={0.05}
      />

      {settings.mode === 'grouped' && (
        <SliderWithInput
          label="Space between columns"
          value={settings.groupSpacing}
          onChange={(v) => update({ groupSpacing: v })}
          min={0}
          max={0.5}
          step={0.01}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Max width"
          value={settings.maxColumnWidth}
          onChange={(v) => update({ maxColumnWidth: v })}
          min={0}
          max={400}
          step={1}
          suffix="px"
        />
        <NumberInput
          label="Min height"
          value={settings.minColumnHeight}
          onChange={(v) => update({ minColumnHeight: v })}
          min={0}
          max={100}
          step={1}
          suffix="px"
        />
      </div>

      <SliderWithInput
        label="Corner radius"
        value={settings.cornerRadius}
        onChange={(v) => update({ cornerRadius: v })}
        min={0}
        max={40}
        step={1}
        suffix="px"
      />

      <SliderWithInput
        label="Opacity"
        value={settings.opacity}
        onChange={(v) => update({ opacity: v })}
        min={0}
        max={1}
        step={0.05}
      />

      {/* Outline */}
      <SettingRow label="Outline" variant="inline">
        <Switch checked={settings.outline} onCheckedChange={(checked) => update({ outline: checked })} />
      </SettingRow>
      {settings.outline && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <ColorPicker label="Color" value={settings.outlineColor} onChange={(c) => update({ outlineColor: c })} />
          <NumberInput
            label="Width"
            value={settings.outlineWidth}
            onChange={(v) => update({ outlineWidth: v })}
            min={0.5}
            max={8}
            step={0.5}
            suffix="px"
          />
        </div>
      )}

      {/* ── Value labels ── */}
      <SubHeader>Value labels</SubHeader>
      <SettingRow label="Show values" variant="inline">
        <Switch checked={settings.showValues} onCheckedChange={(checked) => update({ showValues: checked })} />
      </SettingRow>

      {settings.showValues && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <SettingRow label="Position">
            <Select
              value={settings.valuePosition}
              onValueChange={(v) => update({ valuePosition: v as ColumnValuePosition })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above" className="text-xs">Above column</SelectItem>
                <SelectItem value="inside_top" className="text-xs">Inside — top</SelectItem>
                <SelectItem value="inside_center" className="text-xs">Inside — center</SelectItem>
                <SelectItem value="inside_bottom" className="text-xs">Inside — bottom</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Font family */}
          <Select value={settings.valueFontFamily} onValueChange={(v) => update({ valueFontFamily: v })}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilyOptions.map((font) => (
                <SelectItem key={font} value={font} className="text-xs">{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size + Weight */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
              <Input
                type="number"
                value={settings.valueFontSize}
                onChange={(e) => update({ valueFontSize: parseInt(e.target.value) || 12 })}
                className="h-7 text-xs w-full"
                min={6}
                max={48}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
              <Select
                value={settings.valueFontWeight}
                onValueChange={(v) => update({ valueFontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weightOptions.map((w) => (
                    <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color mode */}
          <SettingRow label="Color">
            <TabMenu
              value={settings.valueColorMode}
              onChange={(v) => update({ valueColorMode: v as 'auto' | 'custom' })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </SettingRow>
          {settings.valueColorMode === 'custom' && (
            <ColorPicker label="Label color" value={settings.valueColor} onChange={(c) => update({ valueColor: c })} />
          )}
        </div>
      )}
    </AccordionSection>
  );
}
