'use client';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/shared/NumberInput';
import type {
  FilterMode,
  LegendAlignment,
  LegendOrientation,
  LegendPosition,
  DataColorsHeader,
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

export function LegendSection() {
  const settings = useEditorStore((s) => s.settings.legend);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('legend', updates);
  };

  return (
    <AccordionSection id="legend" title="Legend">
      {/* Show legend toggle */}
      <SettingRow label="Show legend" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(v) => update({ show: v })}
        />
      </SettingRow>

      {settings.show && (
        <>
          {/* Click to filter — 3-button tab menu */}
          <SettingRow label="Click to filter">
            <TabMenu
              value={settings.clickToFilter}
              onChange={(v) => update({ clickToFilter: v as FilterMode })}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'single_select', label: 'Single' },
                { value: 'multi_select', label: 'Multi' },
              ]}
            />
          </SettingRow>

          {/* Alignment — 4-button tab menu */}
          <SettingRow label="Alignment">
            <TabMenu
              value={settings.alignment}
              onChange={(v) => update({ alignment: v as LegendAlignment })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
                { value: 'inline', label: 'Inline' },
              ]}
            />
          </SettingRow>

          {/* Font family (full width) */}
          <SettingRow label="Font family">
            <Select
              value={settings.fontFamily}
              onValueChange={(v) => update({ fontFamily: v })}
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

          {/* Title weight + Text weight + Font style — 3-column row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Title wt</label>
              <Select
                value={settings.titleWeight}
                onValueChange={(v) => update({ titleWeight: v as typeof settings.titleWeight })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Text wt</label>
              <Select
                value={settings.textWeight}
                onValueChange={(v) => update({ textWeight: v as typeof settings.textWeight })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Style</label>
              <Select
                value={settings.textStyle || 'normal'}
                onValueChange={(v) => update({ textStyle: v as 'normal' | 'italic' })}
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

          {/* Color */}
          <ColorPicker
            label="Color"
            value={settings.color}
            onChange={(v) => update({ color: v })}
          />

          {/* Size + Spacing from chart — 2-column row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Size (px)</label>
              <Input
                type="number"
                value={settings.size}
                onChange={(e) => update({ size: parseInt(e.target.value) || 12 })}
                className="h-7 text-xs w-full"
                min={6}
                max={48}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Spacing (px)</label>
              <Input
                type="number"
                value={settings.marginTop}
                onChange={(e) => update({ marginTop: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={-100}
                max={100}
              />
            </div>
          </div>

          {/* Title text */}
          <SettingRow label="Title text">
            <Input
              value={settings.titleText}
              onChange={(e) => update({ titleText: e.target.value })}
              className="h-8 text-xs w-full"
              placeholder="Legend title"
            />
          </SettingRow>

          {/* ---- SWATCHES ---- */}
          <div className="pt-2 border-t border-gray-100">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Swatches
            </Label>
          </div>

          {/* 4 swatch inputs side by side, (px) in label */}
          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">W (px)</label>
              <Input
                type="number"
                value={settings.swatchWidth}
                onChange={(e) => update({ swatchWidth: parseInt(e.target.value) || 12 })}
                className="h-7 text-xs w-full"
                min={4}
                max={40}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">H (px)</label>
              <Input
                type="number"
                value={settings.swatchHeight}
                onChange={(e) => update({ swatchHeight: parseInt(e.target.value) || 12 })}
                className="h-7 text-xs w-full"
                min={4}
                max={40}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Rnd (px)</label>
              <Input
                type="number"
                value={settings.swatchRoundness}
                onChange={(e) => update({ swatchRoundness: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={0}
                max={20}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Pad (px)</label>
              <Input
                type="number"
                value={settings.swatchPadding}
                onChange={(e) => update({ swatchPadding: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={0}
                max={20}
              />
            </div>
          </div>

          {/* Outline */}
          <SettingRow label="Outline" variant="inline">
            <Switch
              checked={settings.outline}
              onCheckedChange={(v) => update({ outline: v })}
            />
          </SettingRow>

          {/* Custom order */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Custom order</Label>
            <Textarea
              value={settings.customOrder}
              onChange={(e) => update({ customOrder: e.target.value })}
              className="text-xs min-h-[60px]"
              placeholder="Enter custom legend order, one item per line"
            />
          </div>

          {/* Orientation + Position — 2-column row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Orientation</label>
              <Select
                value={settings.orientation}
                onValueChange={(v: LegendOrientation) => update({ orientation: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Position</label>
              <Select
                value={settings.position || 'below'}
                onValueChange={(v: LegendPosition) => update({ position: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Below chart</SelectItem>
                  <SelectItem value="above">Above chart</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overlay position controls */}
          {(settings.position || 'below') === 'overlay' && (
            <div className="grid grid-cols-2 gap-1.5 pl-2 border-l-2 border-gray-100">
              <NumberInput
                label="X offset"
                value={settings.overlayX ?? 10}
                onChange={(v) => update({ overlayX: v })}
                min={0}
                max={500}
                step={5}
                suffix="px"
              />
              <NumberInput
                label="Y offset"
                value={settings.overlayY ?? 10}
                onChange={(v) => update({ overlayY: v })}
                min={0}
                max={500}
                step={5}
                suffix="px"
              />
            </div>
          )}

          {/* ---- PADDING ---- */}
          <div className="pt-2 border-t border-gray-100">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Padding
            </Label>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Top</label>
              <Input
                type="number"
                value={settings.paddingTop ?? 0}
                onChange={(e) => update({ paddingTop: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={-50}
                max={100}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Right</label>
              <Input
                type="number"
                value={settings.paddingRight ?? 0}
                onChange={(e) => update({ paddingRight: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={-50}
                max={100}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Bottom</label>
              <Input
                type="number"
                value={settings.paddingBottom ?? 0}
                onChange={(e) => update({ paddingBottom: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={-50}
                max={100}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Left</label>
              <Input
                type="number"
                value={settings.paddingLeft ?? 0}
                onChange={(e) => update({ paddingLeft: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={-50}
                max={100}
              />
            </div>
          </div>

          {/* Max width + Data colors in header — 2-column row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Max width (%)</label>
              <Input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => update({ maxWidth: parseInt(e.target.value) || 100 })}
                className="h-7 text-xs w-full"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Data colors</label>
              <Select
                value={settings.dataColorsHeader}
                onValueChange={(v: DataColorsHeader) => update({ dataColorsHeader: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </AccordionSection>
  );
}
