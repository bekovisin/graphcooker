'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  BarLabelStyle,
  DataPointLabelPosition,
  DataPointLabelColorMode,
  StackLabelMode,
  LabelsSettings,
  FontWeight,
} from '@/types/chart';

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

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

export function LabelsSection() {
  const settings = useEditorStore((s) => s.settings.labels);
  const seriesNames = useEditorStore((s) => s.columnMapping.values || []);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<LabelsSettings>) => {
    updateSettings('labels', updates);
  };

  return (
    <AccordionSection id="labels" title="Labels">
      {/* BAR LABELS */}
      <SubHeader>Bar Labels</SubHeader>

      {/* Label style - tab menu */}
      <SettingRow label="Label style">
        <TabMenu
          value={settings.barLabelStyle}
          onChange={(v) => update({ barLabelStyle: v as BarLabelStyle })}
          options={[
            { value: 'above_bars', label: 'Above bars' },
            { value: 'axis', label: 'Axis' },
          ]}
        />
      </SettingRow>

      {/* Above-bar label padding - 4 inputs side by side */}
      {settings.barLabelStyle === 'above_bars' && (
        <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium">Above-bar label padding</p>
          <div className="grid grid-cols-4 gap-1.5">
            <NumberInput
              label="T"
              value={settings.aboveBarPaddingTop || 0}
              onChange={(v) => update({ aboveBarPaddingTop: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="R"
              value={settings.aboveBarPaddingRight || 0}
              onChange={(v) => update({ aboveBarPaddingRight: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="B"
              value={settings.aboveBarPaddingBottom || 0}
              onChange={(v) => update({ aboveBarPaddingBottom: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="L"
              value={settings.aboveBarPaddingLeft || 0}
              onChange={(v) => update({ aboveBarPaddingLeft: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      )}

      {/* DATA POINT LABELS */}
      <SubHeader>Data Point Labels</SubHeader>

      <SettingRow label="Show labels on data points" variant="inline">
        <Switch
          checked={settings.showDataPointLabels}
          onCheckedChange={(checked) => update({ showDataPointLabels: checked })}
        />
      </SettingRow>

      {settings.showDataPointLabels && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          {/* Position - 3-button tab menu */}
          <SettingRow label="Position">
            <TabMenu
              value={settings.dataPointPosition}
              onChange={(v) => update({ dataPointPosition: v as DataPointLabelPosition })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
                { value: 'outside_right', label: 'Outside' },
              ]}
            />
          </SettingRow>

          <SettingRow label="Custom padding" variant="inline">
            <Switch
              checked={settings.dataPointCustomPadding}
              onCheckedChange={(checked) => update({ dataPointCustomPadding: checked })}
            />
          </SettingRow>

          {/* Custom padding - 4 inputs side by side */}
          {settings.dataPointCustomPadding && (
            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
              <div className="grid grid-cols-4 gap-1.5">
                <NumberInput
                  label="T"
                  value={settings.dataPointPaddingTop}
                  onChange={(v) => update({ dataPointPaddingTop: v })}
                  min={-50}
                  max={50}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="R"
                  value={settings.dataPointPaddingRight}
                  onChange={(v) => update({ dataPointPaddingRight: v })}
                  min={-50}
                  max={50}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="B"
                  value={settings.dataPointPaddingBottom}
                  onChange={(v) => update({ dataPointPaddingBottom: v })}
                  min={-50}
                  max={50}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="L"
                  value={settings.dataPointPaddingLeft}
                  onChange={(v) => update({ dataPointPaddingLeft: v })}
                  min={-50}
                  max={50}
                  step={1}
                  suffix="px"
                />
              </div>
            </div>
          )}

          <SettingRow label="Font family">
            <Select
              value={settings.dataPointFontFamily}
              onValueChange={(v) => update({ dataPointFontFamily: v })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilyOptions.map((font) => (
                  <SelectItem key={font} value={font} className="text-xs">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Font weight + Font style + Font size - single row */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600 font-medium">Font styling</span>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Font weight */}
              <Select
                value={settings.dataPointFontWeight}
                onValueChange={(v) => update({ dataPointFontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                </SelectContent>
              </Select>
              {/* Font style */}
              <Select
                value={settings.dataPointFontStyle || 'normal'}
                onValueChange={(v) => update({ dataPointFontStyle: v as 'normal' | 'italic' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                </SelectContent>
              </Select>
              {/* Font size */}
              <NumberInput
                label=""
                value={settings.dataPointFontSize}
                onChange={(v) => update({ dataPointFontSize: v })}
                min={6}
                max={48}
                step={1}
                suffix="px"
              />
            </div>
          </div>

          {/* Color mode - 2-button tab menu */}
          <SettingRow label="Color mode">
            <TabMenu
              value={settings.dataPointColorMode}
              onChange={(v) => update({ dataPointColorMode: v as DataPointLabelColorMode })}
              options={[
                { value: 'auto', label: 'Auto (contrast)' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </SettingRow>

          {/* Custom color mode - grid layout */}
          {settings.dataPointColorMode === 'custom' && (
            <div className="space-y-2">
              <ColorPicker
                label="Default color"
                value={settings.dataPointColor}
                onChange={(color) => update({ dataPointColor: color })}
              />
              {seriesNames.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">Per-series colors</span>
                  <div className="grid grid-cols-3 gap-2">
                    {seriesNames.map((name) => (
                      <div key={name} className="space-y-1">
                        <span className="text-[10px] text-gray-500 truncate block">{name}</span>
                        <ColorPicker
                          value={settings.dataPointSeriesColors?.[name] || settings.dataPointColor}
                          onChange={(color) => {
                            update({
                              dataPointSeriesColors: {
                                ...settings.dataPointSeriesColors,
                                [name]: color,
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STACK LABELS */}
      <SubHeader>Stack Labels</SubHeader>

      {/* Stack labels - 3-button tab menu */}
      <SettingRow label="Stack labels">
        <TabMenu
          value={settings.stackLabelMode}
          onChange={(v) => update({ stackLabelMode: v as StackLabelMode })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'net_sum', label: 'Net sum' },
            { value: 'separate', label: 'Separate +/-' },
          ]}
        />
      </SettingRow>
    </AccordionSection>
  );
}
