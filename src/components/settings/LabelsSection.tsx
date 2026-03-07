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
import { Input } from '@/components/ui/input';
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

          {/* Outside label padding (distance from bar) */}
          {settings.dataPointPosition === 'outside_right' && (
            <NumberInput
              label="Outside label padding"
              value={settings.outsideLabelPadding ?? 6}
              onChange={(v) => update({ outsideLabelPadding: v })}
              min={-50}
              max={100}
              step={1}
              suffix="px"
            />
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
            <div className="grid grid-cols-3 gap-1.5 items-end">
              {/* Font weight */}
              <Select
                value={settings.dataPointFontWeight}
                onValueChange={(v) => update({ dataPointFontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                  <SelectItem value="300" className="text-xs">Light</SelectItem>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                  <SelectItem value="900" className="text-xs">Black</SelectItem>
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
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={settings.dataPointFontSize}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) update({ dataPointFontSize: Math.max(6, Math.min(48, num)) });
                  }}
                  min={6}
                  max={48}
                  step={1}
                  className="h-8 text-xs w-full"
                />
                <span className="text-xs text-gray-400 shrink-0">px</span>
              </div>
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

          {/* PERCENT PREFIX */}
          <SettingRow label="Show % prefix" variant="inline">
            <Switch
              checked={settings.showPercentPrefix ?? false}
              onCheckedChange={(checked) => update({ showPercentPrefix: checked })}
            />
          </SettingRow>

          {settings.showPercentPrefix && (
            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
              {/* Prefix position (left/right) */}
              <SettingRow label="Position">
                <TabMenu
                  value={settings.percentPrefixPosition ?? 'right'}
                  onChange={(v) => update({ percentPrefixPosition: v as 'left' | 'right' })}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                  ]}
                />
              </SettingRow>
              <div className="space-y-1.5">
                <span className="text-xs text-gray-600 font-medium">% styling</span>
                <div className="grid grid-cols-3 gap-1.5 items-end">
                  <Select
                    value={settings.percentPrefixFontWeight ?? 'normal'}
                    onValueChange={(v) => update({ percentPrefixFontWeight: v as FontWeight })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                      <SelectItem value="300" className="text-xs">Light</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="500" className="text-xs">Medium</SelectItem>
                      <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      <SelectItem value="900" className="text-xs">Black</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.percentPrefixFontSize ?? 12}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) update({ percentPrefixFontSize: Math.max(6, Math.min(48, num)) });
                      }}
                      min={6}
                      max={48}
                      step={1}
                      className="h-8 text-xs w-full"
                    />
                    <span className="text-xs text-gray-400 shrink-0">px</span>
                  </div>
                  <ColorPicker
                    value={settings.percentPrefixColor ?? '#333333'}
                    onChange={(color) => update({ percentPrefixColor: color })}
                  />
                </div>
              </div>
              {/* Prefix vertical alignment */}
              <SettingRow label="Vertical align">
                <TabMenu
                  value={settings.percentPrefixVerticalAlign ?? 'bottom'}
                  onChange={(v) => update({ percentPrefixVerticalAlign: v as 'bottom' | 'center' | 'top' })}
                  options={[
                    { value: 'bottom', label: 'Bottom' },
                    { value: 'center', label: 'Center' },
                    { value: 'top', label: 'Top' },
                  ]}
                />
              </SettingRow>
              <NumberInput
                label="% padding"
                value={settings.percentPrefixPadding ?? 0}
                onChange={(v) => update({ percentPrefixPadding: v })}
                min={-20}
                max={50}
                step={1}
                suffix="px"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Padding top"
                  value={settings.percentPrefixPaddingTop ?? 0}
                  onChange={(v) => update({ percentPrefixPaddingTop: v })}
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="Padding bottom"
                  value={settings.percentPrefixPaddingBottom ?? 0}
                  onChange={(v) => update({ percentPrefixPaddingBottom: v })}
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
              </div>
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
