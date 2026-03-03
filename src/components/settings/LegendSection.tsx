'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { NumberInput } from '@/components/shared/NumberInput';
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
import type {
  FilterMode,
  LegendAlignment,
  LegendOrientation,
  LegendPosition,
  DataColorsHeader,
} from '@/types/chart';

const alignmentOptions: { value: LegendAlignment; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'inline', label: 'Inline' },
];

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
          {/* Click legend to filter */}
          <SettingRow label="Click to filter">
            <Select
              value={settings.clickToFilter}
              onValueChange={(v: FilterMode) => update({ clickToFilter: v })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="single_select">Single select</SelectItem>
                <SelectItem value="multi_select">Multi select</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Alignment - button group */}
          <SettingRow label="Alignment">
            <div className="flex rounded-md border border-gray-200 overflow-hidden">
              {alignmentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ alignment: opt.value })}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    settings.alignment === opt.value
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  } ${opt.value !== 'left' ? 'border-l border-gray-200' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Font family */}
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

          {/* Title weight */}
          <SettingRow label="Title weight">
            <Select
              value={settings.titleWeight}
              onValueChange={(v) => update({ titleWeight: v as typeof settings.titleWeight })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="500" className="text-xs">Medium</SelectItem>
                <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                <SelectItem value="bold" className="text-xs">Bold</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Text weight */}
          <SettingRow label="Text weight">
            <Select
              value={settings.textWeight}
              onValueChange={(v) => update({ textWeight: v as typeof settings.textWeight })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="500" className="text-xs">Medium</SelectItem>
                <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                <SelectItem value="bold" className="text-xs">Bold</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Text style */}
          <SettingRow label="Text style">
            <Select
              value={settings.textStyle || 'normal'}
              onValueChange={(v) => update({ textStyle: v as 'normal' | 'italic' })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                <SelectItem value="italic" className="text-xs">Italic</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Color */}
          <ColorPicker
            label="Color"
            value={settings.color}
            onChange={(v) => update({ color: v })}
          />

          {/* Size */}
          <NumberInput
            label="Size"
            value={settings.size}
            onChange={(v) => update({ size: v })}
            min={6}
            max={48}
            suffix="px"
          />

          {/* Margin top (spacing between chart and legend) */}
          <NumberInput
            label="Spacing from chart"
            value={settings.marginTop}
            onChange={(v) => update({ marginTop: v })}
            min={-20}
            max={60}
            step={1}
            suffix="px"
          />

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

          <NumberInput
            label="Width"
            value={settings.swatchWidth}
            onChange={(v) => update({ swatchWidth: v })}
            min={4}
            max={40}
            suffix="px"
          />

          <NumberInput
            label="Height"
            value={settings.swatchHeight}
            onChange={(v) => update({ swatchHeight: v })}
            min={4}
            max={40}
            suffix="px"
          />

          <NumberInput
            label="Roundness"
            value={settings.swatchRoundness}
            onChange={(v) => update({ swatchRoundness: v })}
            min={0}
            max={20}
            suffix="px"
          />

          <NumberInput
            label="Padding"
            value={settings.swatchPadding}
            onChange={(v) => update({ swatchPadding: v })}
            min={0}
            max={20}
            suffix="px"
          />

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

          {/* Max width */}
          <NumberInput
            label="Max width"
            value={settings.maxWidth}
            onChange={(v) => update({ maxWidth: v })}
            min={0}
            max={100}
            suffix="%"
          />

          {/* Orientation */}
          <SettingRow label="Orientation">
            <Select
              value={settings.orientation}
              onValueChange={(v: LegendOrientation) => update({ orientation: v })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Position */}
          <SettingRow label="Position">
            <Select
              value={settings.position || 'below'}
              onValueChange={(v: LegendPosition) => update({ position: v })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below">Below chart</SelectItem>
                <SelectItem value="overlay">Overlay on chart</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Overlay position controls */}
          {(settings.position || 'below') === 'overlay' && (
            <div className="space-y-3 pl-2 border-l-2 border-gray-100">
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

          {/* Add data colors to header */}
          <SettingRow label="Data colors in header">
            <Select
              value={settings.dataColorsHeader}
              onValueChange={(v: DataColorsHeader) =>
                update({ dataColorsHeader: v })
              }
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </>
      )}
    </AccordionSection>
  );
}
