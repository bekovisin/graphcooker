'use client';

import { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
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
import { NumberInput } from '@/components/shared/NumberInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';
import type {
  YAxisPosition,
  ScaleType,
  AxisTitleType,
  TickPosition,
  YAxisSpaceMode,
  AxisStyling,
  YAxisSettings,
  FontWeight,
  TicksToShowMode,
} from '@/types/chart';

// ── Reusable TabMenu ──
function TabMenu<T extends string>({ value, onChange, options }: {
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
            value === opt.value ? 'bg-blue-500 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'
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

// ── Inline Styling Panel ──
function InlineStylingPanel({ styling, onChange }: {
  styling: AxisStyling;
  onChange: (updates: Partial<AxisStyling>) => void;
}) {
  return (
    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
      {/* Row 1: Font family (full width) */}
      <Select
        value={styling.fontFamily}
        onValueChange={(v) => onChange({ fontFamily: v })}
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
      {/* Row 2: Size + Weight + Style (3-column) */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
          <Input
            type="number"
            value={styling.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 11 })}
            className="h-7 text-xs w-full"
            min={6}
            max={48}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
          <Select
            value={styling.fontWeight}
            onValueChange={(v) => onChange({ fontWeight: v as FontWeight })}
          >
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100" className="text-xs">Thin</SelectItem>
              <SelectItem value="200" className="text-xs">Extra-light</SelectItem>
              <SelectItem value="300" className="text-xs">Light</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="500" className="text-xs">Medium</SelectItem>
              <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
              <SelectItem value="bold" className="text-xs">Bold</SelectItem>
              <SelectItem value="800" className="text-xs">Extra-bold</SelectItem>
              <SelectItem value="900" className="text-xs">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Style</label>
          <Select
            value={styling.fontStyle || 'normal'}
            onValueChange={(v) => onChange({ fontStyle: v as 'normal' | 'italic' })}
          >
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="italic" className="text-xs">Italic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Row 3: Color */}
      <ColorPicker
        label="Color"
        value={styling.color}
        onChange={(color) => onChange({ color })}
      />
    </div>
  );
}

// ── Sub Header ──
function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

export function YAxisSection() {
  const settings = useEditorStore((s) => s.settings.yAxis);
  const chartType = useEditorStore((s) => s.settings.chartType.chartType);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);
  const isLineChart = chartType === 'line_chart';
  const [showYLsModal, setShowYLsModal] = useState(false);

  const categoryNames = useMemo(() => {
    if (!labelsColumn || !data.length) return [];
    const seen = new Set<string>();
    return data.reduce<string[]>((acc, row) => {
      const name = String(row[labelsColumn] || '');
      if (name && !seen.has(name)) { seen.add(name); acc.push(name); }
      return acc;
    }, []);
  }, [data, labelsColumn]);

  const update = (updates: Partial<YAxisSettings>) => {
    updateSettings('yAxis', updates);
  };

  const updateTitleStyling = (updates: Partial<AxisStyling>) => {
    update({ titleStyling: { ...settings.titleStyling, ...updates } });
  };

  const updateTickStyling = (updates: Partial<AxisStyling>) => {
    update({ tickStyling: { ...settings.tickStyling, ...updates } });
  };

  const updateAxisLine = (updates: Partial<YAxisSettings['axisLine']>) => {
    update({ axisLine: { ...settings.axisLine, ...updates } });
  };

  const updateGridlineStyling = (updates: Partial<YAxisSettings['gridlineStyling']>) => {
    update({ gridlineStyling: { ...settings.gridlineStyling, ...updates } });
  };

  if (isLineChart) {
    return (
      <AccordionSection id="y-axis" title="Y axis">
        {/* Axis visible/hidden */}
        <SettingRow label="Position">
          <TabMenu
            value={settings.position}
            onChange={(v) => update({ position: v as YAxisPosition })}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
              { value: 'hidden', label: 'Hidden' },
            ]}
          />
        </SettingRow>

        {/* SCALE */}
        <SubHeader>Scale</SubHeader>
        <div className="flex items-center gap-2">
          <div className="w-[120px] shrink-0">
            <TabMenu
              value={settings.scaleType}
              onChange={(v) => update({ scaleType: v as ScaleType })}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'log', label: 'Log' },
              ]}
            />
          </div>
          <Input
            value={settings.min}
            onChange={(e) => update({ min: e.target.value })}
            placeholder="Min"
            className="h-8 text-xs flex-1"
          />
          <Input
            value={settings.max}
            onChange={(e) => update({ max: e.target.value })}
            placeholder="Max"
            className="h-8 text-xs flex-1"
          />
        </div>

        <SettingRow label="Flip axis" variant="inline">
          <Switch
            checked={settings.flipAxis ?? false}
            onCheckedChange={(checked) => update({ flipAxis: checked })}
          />
        </SettingRow>

        <SettingRow label="Configure default min/max" variant="inline">
          <Switch
            checked={settings.configureDefaultMinMax ?? false}
            onCheckedChange={(checked) => update({ configureDefaultMinMax: checked })}
          />
        </SettingRow>

        {/* AXIS TITLE */}
        <SubHeader>Axis Title</SubHeader>
        <SettingRow label="Show title" variant="inline">
          <Switch
            checked={settings.titleType !== 'auto' || !!settings.titleText}
            onCheckedChange={(checked) => {
              if (checked) update({ titleType: 'custom' });
              else update({ titleType: 'auto', titleText: '' });
            }}
          />
        </SettingRow>

        {settings.titleType === 'custom' && (
          <>
            <Input
              value={settings.titleText}
              onChange={(e) => update({ titleText: e.target.value })}
              placeholder="Enter title..."
              className="h-8 text-xs w-full"
            />

            <SettingRow label="Position">
              <TabMenu
                value={settings.axisTitlePosition ?? 'side'}
                onChange={(v) => update({ axisTitlePosition: v as 'side' | 'top_bottom' })}
                options={[
                  { value: 'side', label: 'Side' },
                  { value: 'top_bottom', label: 'Top/Bottom' },
                ]}
              />
            </SettingRow>

            <SettingRow label="Styling" variant="inline">
              <Switch
                checked={settings.showTitleStyling}
                onCheckedChange={(checked) => update({ showTitleStyling: checked })}
              />
            </SettingRow>

            {settings.showTitleStyling && (
              <InlineStylingPanel styling={settings.titleStyling} onChange={updateTitleStyling} />
            )}
          </>
        )}

        {/* LABELS */}
        <SubHeader>Labels</SubHeader>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <TabMenu
              value={settings.tickPosition}
              onChange={(v) => update({ tickPosition: v as TickPosition })}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'left', label: 'Above' },
                { value: 'right', label: 'Below' },
              ]}
            />
          </div>
          <div className="w-[72px] shrink-0">
            <Input
              type="number"
              value={settings.tickPadding}
              onChange={(e) => update({ tickPadding: parseInt(e.target.value) || 0 })}
              className="h-8 text-xs w-full"
              min={0}
              max={40}
            />
          </div>
        </div>

        <SettingRow label="Styling" variant="inline">
          <Switch
            checked={settings.showTickStyling}
            onCheckedChange={(checked) => update({ showTickStyling: checked })}
          />
        </SettingRow>

        {settings.showTickStyling && (
          <InlineStylingPanel styling={settings.tickStyling} onChange={updateTickStyling} />
        )}

        <SettingRow label="Weight">
          <TabMenu
            value={settings.labelWeight ?? 'normal'}
            onChange={(v) => update({ labelWeight: v as 'bold' | 'normal' })}
            options={[
              { value: 'normal', label: 'Regular' },
              { value: 'bold', label: 'Bold' },
            ]}
          />
        </SettingRow>

        <NumberInput
          label="Max lines"
          value={settings.labelMaxLines ?? 1}
          onChange={(v) => update({ labelMaxLines: v })}
          min={1}
          max={5}
          step={1}
        />

        <NumberInput
          label="Line height"
          value={settings.labelLineHeight ?? 0.5}
          onChange={(v) => update({ labelLineHeight: v })}
          min={0.5}
          max={3}
          step={0.1}
        />

        {/* Space mode */}
        <SettingRow label="Space mode">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <TabMenu
                value={settings.spaceMode}
                onChange={(v) => update({ spaceMode: v as YAxisSpaceMode })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'fixed', label: 'Fixed' },
                ]}
              />
            </div>
            {settings.spaceMode === 'fixed' && (
              <div className="w-[72px] shrink-0">
                <Input
                  type="number"
                  value={settings.spaceModeValue}
                  onChange={(e) => update({ spaceModeValue: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs w-full"
                  min={0}
                  max={400}
                />
              </div>
            )}
          </div>
        </SettingRow>

        {/* TICKS TO SHOW */}
        <SubHeader>Ticks to show</SubHeader>
        <SettingRow label="Mode">
          <TabMenu
            value={settings.ticksToShowMode ?? 'auto'}
            onChange={(v) => update({ ticksToShowMode: v as TicksToShowMode })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'number', label: 'Number' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </SettingRow>

        {(settings.ticksToShowMode === 'number') && (
          <NumberInput
            label="Number of ticks"
            value={settings.ticksToShowNumber ?? 6}
            onChange={(v) => update({ ticksToShowNumber: v })}
            min={2}
            max={20}
            step={1}
          />
        )}

        {(settings.ticksToShowMode === 'custom') && (
          <>
            <NumberInput
              label="Tick interval"
              value={settings.ticksToShowNumber ?? 10}
              onChange={(v) => update({ ticksToShowNumber: v })}
              min={1}
              max={1000}
              step={1}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 mb-0.5 block">Start value</label>
                <Input
                  type="number"
                  value={settings.customTickStart ?? 0}
                  onChange={(e) => update({ customTickStart: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-0.5 block">End value</label>
                <Input
                  type="number"
                  value={settings.customTickEnd ?? 0}
                  onChange={(e) => update({ customTickEnd: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs w-full"
                />
              </div>
            </div>
          </>
        )}

        {/* TICK MARKS & AXIS LINE */}
        <SubHeader>Axis Line</SubHeader>
        <SettingRow label="Show axis line" variant="inline">
          <Switch
            checked={settings.axisLine?.show ?? true}
            onCheckedChange={(checked) => updateAxisLine({ show: checked })}
          />
        </SettingRow>

        {settings.axisLine?.show !== false && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
              <Input
                type="number"
                value={settings.axisLine?.width || 1}
                onChange={(e) => updateAxisLine({ width: parseFloat(e.target.value) || 1 })}
                className="h-7 text-xs w-full"
                min={0.5}
                max={5}
                step={0.5}
              />
            </div>
            <div className="shrink-0">
              <ColorPicker
                label="Color"
                value={settings.axisLine?.color || '#666666'}
                onChange={(color) => updateAxisLine({ color })}
              />
            </div>
          </div>
        )}

        <NumberInput
          label="Edge padding"
          value={settings.edgePadding ?? 10}
          onChange={(v) => update({ edgePadding: v })}
          min={0}
          max={100}
          step={1}
          suffix="%"
        />

        {/* GRIDLINES */}
        <SubHeader>Gridlines</SubHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">Show gridlines</label>
            <Switch
              checked={settings.gridlines}
              onCheckedChange={(v) => update({ gridlines: v })}
            />
          </div>
          {settings.gridlines && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Styling</label>
              <Switch
                checked={settings.showGridlineStyling}
                onCheckedChange={(v) => update({ showGridlineStyling: v })}
              />
            </div>
          )}
        </div>

        {settings.gridlines && settings.showGridlineStyling && (
          <div className="space-y-3 pl-2 border-l-2 border-gray-100">
            <ColorPicker
              label="Color"
              value={settings.gridlineStyling.color}
              onChange={(color) => updateGridlineStyling({ color })}
            />

            <SettingRow label="Style">
              <TabMenu
                value={settings.gridlineStyle ?? 'solid'}
                onChange={(v) => update({ gridlineStyle: v as 'solid' | 'dashed' | 'dotted' })}
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'dashed', label: 'Dashed' },
                  { value: 'dotted', label: 'Dotted' },
                ]}
              />
            </SettingRow>

            <NumberInput
              label="Width"
              value={settings.gridlineStyling.width}
              onChange={(v) => updateGridlineStyling({ width: v })}
              min={0.5}
              max={5}
              step={0.5}
            />

            <SettingRow label="Between categories" variant="inline">
              <Switch
                checked={settings.gridlineBetweenCategories ?? false}
                onCheckedChange={(checked) => update({ gridlineBetweenCategories: checked })}
              />
            </SettingRow>
          </div>
        )}
      </AccordionSection>
    );
  }

  return (
    <AccordionSection id="y-axis" title="Y axis">
      {/* Position — 3-button tab menu */}
      <SettingRow label="Position">
        <TabMenu
          value={settings.position}
          onChange={(v) => update({ position: v as YAxisPosition })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
      </SettingRow>

      {/* SCALE — 2-button tab + Min/Max in single row */}
      <SubHeader>Scale</SubHeader>
      <div className="flex items-center gap-2">
        <div className="w-[120px] shrink-0">
          <TabMenu
            value={settings.scaleType}
            onChange={(v) => update({ scaleType: v as ScaleType })}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'log', label: 'Log' },
            ]}
          />
        </div>
        <Input
          value={settings.min}
          onChange={(e) => update({ min: e.target.value })}
          placeholder="Min"
          className="h-8 text-xs flex-1"
        />
        <Input
          value={settings.max}
          onChange={(e) => update({ max: e.target.value })}
          placeholder="Max"
          className="h-8 text-xs flex-1"
        />
      </div>

      {/* AXIS TITLE — toggle to open */}
      <SubHeader>Axis Title</SubHeader>
      <SettingRow label="Show title" variant="inline">
        <Switch
          checked={settings.titleType !== 'auto' || !!settings.titleText}
          onCheckedChange={(checked) => {
            if (checked) update({ titleType: 'custom' });
            else update({ titleType: 'auto', titleText: '' });
          }}
        />
      </SettingRow>

      {settings.titleType === 'custom' && (
        <>
          <Input
            value={settings.titleText}
            onChange={(e) => update({ titleText: e.target.value })}
            placeholder="Enter title..."
            className="h-8 text-xs w-full"
          />

          {/* Type — 2-button tab */}
          <TabMenu
            value={settings.titleType}
            onChange={(v) => update({ titleType: v as AxisTitleType })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'custom', label: 'Custom' },
            ]}
          />

          <SettingRow label="Styling" variant="inline">
            <Switch
              checked={settings.showTitleStyling}
              onCheckedChange={(checked) => update({ showTitleStyling: checked })}
            />
          </SettingRow>

          {settings.showTitleStyling && (
            <InlineStylingPanel styling={settings.titleStyling} onChange={updateTitleStyling} />
          )}
        </>
      )}

      {/* LABELS — styling moved here */}
      <SubHeader>Labels</SubHeader>

      {/* Tick position (3-tab) + Label padding — single row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TabMenu
            value={settings.tickPosition}
            onChange={(v) => update({ tickPosition: v as TickPosition })}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </div>
        <div className="w-[72px] shrink-0">
          <Input
            type="number"
            value={settings.tickPadding}
            onChange={(e) => update({ tickPadding: parseInt(e.target.value) || 0 })}
            className="h-8 text-xs w-full"
            min={0}
            max={40}
          />
        </div>
      </div>

      {/* Space mode (2-tab) + Label width — single row */}
      <SettingRow label="Space mode">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1">
            <TabMenu
              value={settings.spaceMode}
              onChange={(v) => update({ spaceMode: v as YAxisSpaceMode })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'fixed', label: 'Fixed' },
              ]}
            />
          </div>
          {settings.spaceMode === 'fixed' && (
            <div className="w-[72px] shrink-0">
              <Input
                type="number"
                value={settings.spaceModeValue}
                onChange={(e) => update({ spaceModeValue: parseInt(e.target.value) || 80 })}
                className="h-8 text-xs w-full"
                min={20}
                max={400}
              />
            </div>
          )}
        </div>
      </SettingRow>

      {/* Fixed mode: max lines + ellipsis */}
      {settings.spaceMode === 'fixed' && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <SettingRow label="Max lines">
            <Input
              type="number"
              value={settings.fixedMaxLines ?? 0}
              onChange={(e) => update({ fixedMaxLines: parseInt(e.target.value) || 0 })}
              className="h-8 text-xs w-full"
              min={0}
              max={10}
            />
          </SettingRow>
          {(settings.fixedMaxLines ?? 0) > 0 && (
            <SettingRow label="Ellipsis truncation" variant="inline">
              <Switch
                checked={settings.fixedEllipsis ?? true}
                onCheckedChange={(checked) => update({ fixedEllipsis: checked })}
              />
            </SettingRow>
          )}
        </div>
      )}

      {/* Styling toggle — under Labels */}
      <SettingRow label="Styling" variant="inline">
        <Switch
          checked={settings.showTickStyling}
          onCheckedChange={(checked) => update({ showTickStyling: checked })}
        />
      </SettingRow>

      {settings.showTickStyling && (
        <InlineStylingPanel styling={settings.tickStyling} onChange={updateTickStyling} />
      )}

      {/* Label text alignment — bar_chart_custom_2 only */}
      {chartType === 'bar_chart_custom_2' && (
        <>
          <SettingRow label="Label alignment">
            <TabMenu
              value={settings.labelTextAlign ?? 'end'}
              onChange={(v) => update({ labelTextAlign: v as 'start' | 'center' | 'end' })}
              options={[
                { value: 'start', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'end', label: 'Right' },
              ]}
            />
          </SettingRow>
          <NumberInput
            label="Letter spacing"
            value={settings.labelLetterSpacing ?? 0}
            onChange={(v) => update({ labelLetterSpacing: v })}
            min={-10}
            max={20}
            step={0.1}
            suffix="px"
          />
          {categoryNames.length > 0 && (
            <button
              onClick={() => setShowYLsModal(true)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Per-row letter spacing
            </button>
          )}
          <Dialog open={showYLsModal} onOpenChange={setShowYLsModal}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Per-row Y-axis letter spacing</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Override the default letter spacing for specific rows. Leave empty to use the default.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {categoryNames.map((label) => (
                  <div key={label} className="flex items-center gap-2 p-2 rounded-md border border-gray-100">
                    <span className="text-xs font-medium min-w-[60px] truncate">{label}</span>
                    <Input
                      type="number"
                      value={settings.perRowLabelLetterSpacings?.[label] ?? ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) {
                          update({
                            perRowLabelLetterSpacings: {
                              ...settings.perRowLabelLetterSpacings,
                              [label]: v,
                            },
                          });
                        }
                      }}
                      className="h-7 text-xs flex-1"
                      step="0.1"
                      placeholder={String(settings.labelLetterSpacing ?? 0)}
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">px</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <NumberInput
            label="Label margin"
            value={settings.labelMargin ?? 0}
            onChange={(v) => update({ labelMargin: v })}
            min={-20}
            max={50}
            step={0.1}
            suffix="px"
          />
        </>
      )}

      {/* AXIS LINE — toggle, single row: width + color */}
      <SubHeader>Axis Line</SubHeader>
      <SettingRow label="Show axis line" variant="inline">
        <Switch
          checked={settings.axisLine?.show ?? true}
          onCheckedChange={(checked) => updateAxisLine({ show: checked })}
        />
      </SettingRow>

      {settings.axisLine?.show !== false && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
            <Input
              type="number"
              value={settings.axisLine?.width || 1}
              onChange={(e) => updateAxisLine({ width: parseFloat(e.target.value) || 1 })}
              className="h-7 text-xs w-full"
              min={0.5}
              max={5}
              step={0.5}
            />
          </div>
          <div className="shrink-0">
            <ColorPicker
              label="Color"
              value={settings.axisLine?.color || '#666666'}
              onChange={(color) => updateAxisLine({ color })}
            />
          </div>
        </div>
      )}

      {/* GRIDLINES — toggle + styling toggle inline */}
      <SubHeader>Gridlines</SubHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">Show gridlines</label>
          <Switch
            checked={settings.gridlines}
            onCheckedChange={(v) => update({ gridlines: v })}
          />
        </div>
        {settings.gridlines && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Styling</label>
            <Switch
              checked={settings.showGridlineStyling}
              onCheckedChange={(v) => update({ showGridlineStyling: v })}
            />
          </div>
        )}
      </div>

      {settings.gridlines && settings.showGridlineStyling && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
            <Input
              type="number"
              value={settings.gridlineStyling.width}
              onChange={(e) => updateGridlineStyling({ width: parseFloat(e.target.value) || 1 })}
              className="h-7 text-xs w-full"
              min={0.5}
              max={5}
              step={0.5}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 mb-0.5 block">Dash</label>
            <Input
              type="number"
              value={settings.gridlineStyling.dashArray}
              onChange={(e) => updateGridlineStyling({ dashArray: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={0}
              max={20}
            />
          </div>
          <div className="shrink-0">
            <ColorPicker
              label="Color"
              value={settings.gridlineStyling.color}
              onChange={(color) => updateGridlineStyling({ color })}
            />
          </div>
        </div>
      )}
    </AccordionSection>
  );
}
