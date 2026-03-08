'use client';

import { useMemo, useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import type {
  AxisPosition,
  ScaleType,
  AxisTitleType,
  TickPosition,
  AxisStyling,
  XAxisSettings,
  TicksToShowMode,
  TickMarkPosition,
  TickLabelCountMode,
  FontWeight,
  ChartSettings,
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

// ── Tick generation helpers ──
function generateNiceTicks(min: number, max: number, desiredCount = 5): number[] {
  if (max <= min) return [0];
  const range = max - min;
  const roughStep = range / desiredCount;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  let step: number;
  const normalized = roughStep / mag;
  if (normalized <= 1.5) step = 1 * mag;
  else if (normalized <= 3) step = 2 * mag;
  else if (normalized <= 7) step = 5 * mag;
  else step = 10 * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

function generateCustomStepTicks(min: number, max: number, step: number): number[] {
  if (step <= 0 || max <= min) return [0];
  const niceMin = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= max + step * 0.001; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

function formatNumberForLabel(value: number, nf: ChartSettings['numberFormatting']): string {
  const factor = Math.pow(10, nf.decimalPlaces);
  const rounded = Math.round(value * factor) / factor;
  let str = rounded.toFixed(nf.decimalPlaces);
  const [intPart, decPart] = str.split('.');
  let formattedInt = intPart;
  if (nf.thousandsSeparator !== 'none') {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, nf.thousandsSeparator);
  }
  str = decPart ? `${formattedInt}${nf.decimalSeparator}${decPart}` : formattedInt;
  return `${nf.prefix}${str}${nf.suffix}`;
}

// ── Inline Styling Row ──
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

// ── Label visibility multi-select ──
function LabelVisibilityDropdown({
  allLabels,
  hiddenLabels,
  onChange,
}: {
  allLabels: string[];
  hiddenLabels: string[];
  onChange: (hidden: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const hiddenSet = new Set(hiddenLabels);
  const visibleCount = allLabels.length - hiddenSet.size;

  const toggleLabel = (label: string) => {
    const newSet = new Set(hiddenSet);
    if (newSet.has(label)) newSet.delete(label);
    else newSet.add(label);
    onChange(Array.from(newSet));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-between w-full h-8 px-3 rounded-md border border-gray-300 bg-white text-xs hover:bg-gray-50 transition-colors">
          <span className="text-gray-700 truncate">
            {visibleCount === allLabels.length
              ? 'All visible'
              : visibleCount === 0
                ? 'All hidden'
                : `${visibleCount}/${allLabels.length} visible`}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start" side="bottom">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <button onClick={() => onChange([])} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">Show all</button>
          <button onClick={() => onChange([...allLabels])} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium">Hide all</button>
        </div>
        <div className="max-h-48 overflow-y-auto py-1">
          {allLabels.map((label) => {
            const isHidden = hiddenSet.has(label);
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-700'}`}
              >
                {isHidden ? <EyeOff className="w-3.5 h-3.5 text-gray-300 shrink-0" /> : <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                <span className={`truncate ${isHidden ? 'line-through' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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

export function XAxisSection() {
  const settings = useEditorStore((s) => s.settings.xAxis);
  const numberFormatting = useEditorStore((s) => s.settings.numberFormatting);
  const chartData = useEditorStore((s) => s.data);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const allTickLabels = useMemo(() => {
    if (!columnMapping.values || columnMapping.values.length === 0) return [];
    let maxV = 0;
    let minV = 0;
    for (let ci = 0; ci < chartData.length; ci++) {
      let posSum = 0;
      let negSum = 0;
      for (const col of columnMapping.values) {
        const raw = chartData[ci]?.[col];
        const v = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
        if (v >= 0) posSum += v;
        else negSum += v;
      }
      if (posSum > maxV) maxV = posSum;
      if (negSum < minV) minV = negSum;
    }
    const userMin = settings.min ? parseFloat(settings.min) : undefined;
    const userMax = settings.max ? parseFloat(settings.max) : undefined;
    const finalMax = userMax !== undefined ? userMax : maxV;
    const finalMin = userMin !== undefined ? userMin : Math.min(0, minV);

    let ticks: number[];
    if (settings.ticksToShowMode === 'custom') {
      ticks = generateCustomStepTicks(finalMin, finalMax, settings.tickStep || 10);
    } else if (settings.ticksToShowMode === 'number') {
      ticks = generateNiceTicks(finalMin, finalMax, settings.ticksToShowNumber);
    } else {
      ticks = generateNiceTicks(finalMin, finalMax);
    }
    return ticks.map((t) => formatNumberForLabel(t, numberFormatting));
  }, [chartData, columnMapping, settings.min, settings.max, settings.ticksToShowMode, settings.ticksToShowNumber, settings.tickStep, numberFormatting]);

  const update = (updates: Partial<XAxisSettings>) => {
    updateSettings('xAxis', updates);
  };

  const updateZeroLine = (updates: Partial<XAxisSettings['axisLine']>) => {
    update({ zeroLine: { ...(settings.zeroLine || { show: true, width: 1, color: '#666666' }), ...updates } });
  };

  const updateTitleStyling = (updates: Partial<AxisStyling>) => {
    update({ titleStyling: { ...settings.titleStyling, ...updates } });
  };

  const updateTickStyling = (updates: Partial<AxisStyling>) => {
    update({ tickStyling: { ...settings.tickStyling, ...updates } });
  };

  const updateGridlineStyling = (updates: Partial<XAxisSettings['gridlineStyling']>) => {
    update({ gridlineStyling: { ...settings.gridlineStyling, ...updates } });
  };

  const updateTickMarks = (updates: Partial<XAxisSettings['tickMarks']>) => {
    update({ tickMarks: { ...settings.tickMarks, ...updates } });
  };

  const updateAxisLine = (updates: Partial<XAxisSettings['axisLine']>) => {
    update({ axisLine: { ...settings.axisLine, ...updates } });
  };

  return (
    <AccordionSection id="x-axis" title="X axis">
      {/* Position — 5-button tab menu */}
      <SettingRow label="Position">
        <TabMenu
          value={settings.position}
          onChange={(v) => update({ position: v as AxisPosition })}
          options={[
            { value: 'bottom', label: 'Bottom' },
            { value: 'float_down', label: 'Float ↓' },
            { value: 'float_up', label: 'Float ↑' },
            { value: 'top', label: 'Top' },
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

      <SettingRow label="Flip axis" variant="inline">
        <Switch
          checked={settings.flipAxis}
          onCheckedChange={(checked) => update({ flipAxis: checked })}
        />
      </SettingRow>

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

      {/* TICKS & LABELS */}
      <SubHeader>Ticks &amp; Labels</SubHeader>

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
            min={-20}
            max={40}
          />
        </div>
      </div>

      {/* Space mode (2-tab) + Label width — single row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TabMenu
            value={'auto'}
            onChange={() => {}}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </div>
      </div>

      <NumberInput
        label="Angle"
        value={settings.tickAngle}
        onChange={(v) => update({ tickAngle: v })}
        min={-90}
        max={90}
        step={5}
        suffix="°"
      />

      {/* Styling toggle */}
      <SettingRow label="Styling" variant="inline">
        <Switch
          checked={settings.showTickStyling}
          onCheckedChange={(checked) => update({ showTickStyling: checked })}
        />
      </SettingRow>

      {settings.showTickStyling && (
        <InlineStylingPanel styling={settings.tickStyling} onChange={updateTickStyling} />
      )}

      {/* TICKS TO SHOW */}
      <SubHeader>Ticks to show</SubHeader>
      <SettingRow label="Mode">
        <TabMenu
          value={settings.ticksToShowMode === 'number' ? 'auto' : settings.ticksToShowMode}
          onChange={(v) => update({ ticksToShowMode: v as TicksToShowMode })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
      </SettingRow>

      {settings.ticksToShowMode === 'custom' && (
        <NumberInput
          label="Step interval"
          value={settings.tickStep ?? 10}
          onChange={(v) => update({ tickStep: v })}
          min={1}
          max={10000}
          step={1}
        />
      )}

      {/* TICK MARKS */}
      <SubHeader>Tick Marks</SubHeader>
      <SettingRow label="Show tick marks" variant="inline">
        <Switch
          checked={settings.tickMarks.show}
          onCheckedChange={(checked) => updateTickMarks({ show: checked })}
        />
      </SettingRow>

      {settings.tickMarks.show && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <TabMenu
            value={settings.tickMarks.position}
            onChange={(v) => updateTickMarks({ position: v as TickMarkPosition })}
            options={[
              { value: 'outside', label: 'Outside' },
              { value: 'inside', label: 'Inside' },
              { value: 'cross', label: 'Cross' },
            ]}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Length</label>
              <Input
                type="number"
                value={settings.tickMarks.length}
                onChange={(e) => updateTickMarks({ length: parseInt(e.target.value) || 6 })}
                className="h-7 text-xs w-full"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
              <Input
                type="number"
                value={settings.tickMarks.width}
                onChange={(e) => updateTickMarks({ width: parseFloat(e.target.value) || 1 })}
                className="h-7 text-xs w-full"
                min={0.5}
                max={5}
                step={0.5}
              />
            </div>
          </div>
          <ColorPicker
            label="Color"
            value={settings.tickMarks.color}
            onChange={(color) => updateTickMarks({ color })}
          />
        </div>
      )}

      {/* AXIS LINE — toggle, single row: width + color */}
      <SubHeader>Axis Line</SubHeader>
      <SettingRow label="Show axis line" variant="inline">
        <Switch
          checked={settings.axisLine.show}
          onCheckedChange={(checked) => updateAxisLine({ show: checked })}
        />
      </SettingRow>

      {settings.axisLine.show && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
            <Input
              type="number"
              value={settings.axisLine.width}
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
              value={settings.axisLine.color}
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
            onCheckedChange={(checked) => update({ gridlines: checked })}
          />
        </div>
        {settings.gridlines && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Styling</label>
            <Switch
              checked={settings.showGridlineStyling}
              onCheckedChange={(checked) => update({ showGridlineStyling: checked })}
            />
          </div>
        )}
      </div>

      {settings.gridlines && (
        <SettingRow label="Zero gridline" variant="inline">
          <Switch
            checked={settings.showZeroGridline !== false}
            onCheckedChange={(checked) => update({ showZeroGridline: checked })}
          />
        </SettingRow>
      )}

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

      {/* ZERO LINE */}
      <SubHeader>Zero Line</SubHeader>
      <SettingRow label="Show zero line" variant="inline">
        <Switch
          checked={settings.zeroLine?.show !== false}
          onCheckedChange={(checked) => updateZeroLine({ show: checked })}
        />
      </SettingRow>

      {settings.zeroLine?.show !== false && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
              <Input
                type="number"
                value={settings.zeroLine?.width || 1}
                onChange={(e) => updateZeroLine({ width: parseFloat(e.target.value) || 1 })}
                className="h-7 text-xs w-full"
                min={0.5}
                max={5}
                step={0.5}
              />
            </div>
            <div className="shrink-0">
              <ColorPicker
                label="Color"
                value={settings.zeroLine?.color || '#666666'}
                onChange={(color) => updateZeroLine({ color })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <NumberInput
              label="Extend top"
              value={settings.zeroLineExtendTop || 0}
              onChange={(v) => update({ zeroLineExtendTop: v })}
              min={-50}
              max={100}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="Extend bottom"
              value={settings.zeroLineExtendBottom || 0}
              onChange={(v) => update({ zeroLineExtendBottom: v })}
              min={-50}
              max={100}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      )}

      {/* LABEL VISIBILITY */}
      <SubHeader>Label Visibility</SubHeader>
      <SettingRow label="Mode">
        <TabMenu
          value={settings.tickLabelCountMode || 'all'}
          onChange={(v) => update({ tickLabelCountMode: v as TickLabelCountMode })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
      </SettingRow>

      {settings.tickLabelCountMode === 'custom' && (
        <NumberInput
          label="Label count"
          value={settings.tickLabelCount || 0}
          onChange={(v) => update({ tickLabelCount: v })}
          min={0}
          max={100}
          step={1}
        />
      )}

      {allTickLabels.length > 0 && (
        <SettingRow label="Toggle labels">
          <LabelVisibilityDropdown
            allLabels={allTickLabels}
            hiddenLabels={settings.hiddenTickLabels || []}
            onChange={(hidden) => update({ hiddenTickLabels: hidden })}
          />
        </SettingRow>
      )}

      {/* DATA AREA PADDING */}
      <SubHeader>Data area padding</SubHeader>
      <NumberInput
        label="Start (left)"
        value={settings.startPadding || 0}
        onChange={(v) => update({ startPadding: v })}
        min={0}
        max={200}
        step={1}
        suffix="px"
      />
      <NumberInput
        label="End (right)"
        value={settings.endPadding || 0}
        onChange={(v) => update({ endPadding: v })}
        min={0}
        max={200}
        step={1}
        suffix="px"
      />

      {/* FIRST LABEL */}
      <SubHeader>First Label</SubHeader>
      <NumberInput
        label="Inward padding"
        value={settings.firstLabelPadding || 0}
        onChange={(v) => update({ firstLabelPadding: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
      />

      <NumberInput
        label="First tick padding"
        value={settings.firstTickPadding || 0}
        onChange={(v) => update({ firstTickPadding: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
      />

      {/* LAST LABEL */}
      <SubHeader>Last Label</SubHeader>
      <NumberInput
        label="Inward padding"
        value={settings.lastLabelPadding || 0}
        onChange={(v) => update({ lastLabelPadding: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
      />

      <NumberInput
        label="Label-axis padding"
        value={settings.labelAxisPadding || 0}
        onChange={(v) => update({ labelAxisPadding: v })}
        min={-50}
        max={50}
        step={1}
        suffix="px"
      />

      <NumberInput
        label="Last tick padding"
        value={settings.lastTickPadding || 0}
        onChange={(v) => update({ lastTickPadding: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
      />
    </AccordionSection>
  );
}
