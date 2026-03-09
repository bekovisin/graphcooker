'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';
import type { EmptyRowLineStyle, BarsSettings } from '@/types/chart';

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

function SliderWithInput({ label, value, onChange, min, max, step, suffix }: SliderWithInputProps) {
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
              if (!isNaN(num)) {
                onChange(Math.max(min, Math.min(max, num)));
              }
            }}
            min={min}
            max={max}
            step={step}
            className="h-7 text-xs w-20"
          />
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

export function BarsSection() {
  const settings = useEditorStore((s) => s.settings.bars);
  const seriesNames = useEditorStore((s) => s.columnMapping.values || []);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  const update = (updates: Partial<BarsSettings>) => {
    updateSettings('bars', updates);
  };

  return (
    <AccordionSection id="bars" title="Bars">
      {/* Bar Height (px) */}
      <SliderWithInput
        label="Bar height"
        value={settings.barHeight}
        onChange={(v) => update({ barHeight: v })}
        min={4}
        max={80}
        step={1}
        suffix="px"
      />

      {/* Spacing (main) - gap between bars in px */}
      <SliderWithInput
        label="Spacing (main)"
        value={settings.spacingMain}
        onChange={(v) => update({ spacingMain: v })}
        min={0}
        max={60}
        step={1}
        suffix="px"
      />

      {/* Spacing (in stack) */}
      <SliderWithInput
        label="Spacing (in stack)"
        value={settings.spacingInStack}
        onChange={(v) => update({ spacingInStack: v })}
        min={0}
        max={10}
        step={1}
        suffix="px"
      />

      {/* Empty row spacing */}
      <SliderWithInput
        label="Empty row spacing"
        value={settings.emptyRowSpacing}
        onChange={(v) => update({ emptyRowSpacing: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
      />

      {/* Bottom bar padding */}
      <SliderWithInput
        label="Bottom bar padding"
        value={settings.bottomBarPadding}
        onChange={(v) => update({ bottomBarPadding: v })}
        min={-50}
        max={100}
        step={1}
        suffix="px"
      />

      {/* Empty row separator line */}
      <SettingRow label="Empty row line" variant="inline">
        <Switch
          checked={settings.emptyRowLine?.show ?? false}
          onCheckedChange={(checked) => update({ emptyRowLine: { ...(settings.emptyRowLine || { show: false, color: '#cccccc', width: 1, style: 'solid' as EmptyRowLineStyle, dashLength: 4 }), show: checked } })}
        />
      </SettingRow>

      {settings.emptyRowLine?.show && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <ColorPicker
            label="Line color"
            value={settings.emptyRowLine.color}
            onChange={(color) => update({ emptyRowLine: { ...settings.emptyRowLine, color } })}
          />
          <NumberInput
            label="Line width"
            value={settings.emptyRowLine.width}
            onChange={(v) => update({ emptyRowLine: { ...settings.emptyRowLine, width: v } })}
            min={0.5}
            max={5}
            step={0.5}
            suffix="px"
          />
          <SettingRow label="Line style">
            <Select
              value={settings.emptyRowLine.style}
              onValueChange={(v) => update({ emptyRowLine: { ...settings.emptyRowLine, style: v as EmptyRowLineStyle } })}
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
          {settings.emptyRowLine.style === 'dashed' && (
            <NumberInput
              label="Dash length"
              value={settings.emptyRowLine.dashLength}
              onChange={(v) => update({ emptyRowLine: { ...settings.emptyRowLine, dashLength: v } })}
              min={1}
              max={20}
              step={1}
              suffix="px"
            />
          )}
        </div>
      )}

      {/* Manual plot width */}
      <SettingRow label="Manual plot width" variant="inline">
        <Switch
          checked={settings.manualPlotWidth ?? false}
          onCheckedChange={(checked) => update({ manualPlotWidth: checked })}
        />
      </SettingRow>

      {settings.manualPlotWidth && (
        <SliderWithInput
          label="Plot width"
          value={settings.manualPlotWidthValue ?? 100}
          onChange={(v) => update({ manualPlotWidthValue: v })}
          min={1}
          max={2000}
          step={1}
          suffix="px"
        />
      )}

      {/* Bar Opacity */}
      <SliderWithInput
        label="Bar opacity"
        value={settings.barOpacity}
        onChange={(v) => update({ barOpacity: v })}
        min={0}
        max={1}
        step={0.05}
      />

      {/* Outline */}
      <SettingRow label="Outline" variant="inline">
        <Switch
          checked={settings.outline}
          onCheckedChange={(checked) => update({ outline: checked })}
        />
      </SettingRow>

      {settings.outline && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <ColorPicker
            label="Outline color"
            value={settings.outlineColor}
            onChange={(color) => update({ outlineColor: color })}
          />
          <NumberInput
            label="Outline width"
            value={settings.outlineWidth}
            onChange={(v) => update({ outlineWidth: v })}
            min={1}
            max={5}
            step={1}
            suffix="px"
          />
        </div>
      )}

      {/* Border Radius */}
      {seriesNames.length > 0 && (
        <>
          <button
            onClick={() => setShowRadiusModal(true)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 mt-2"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configure per-series border radius...
          </button>

          <Dialog open={showRadiusModal} onOpenChange={setShowRadiusModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Per-Series Border Radius</DialogTitle>
                <DialogDescription>
                  Set the corner radius for each series independently (TL, TR, BR, BL).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {seriesNames.map((name) => {
                  const r = settings.borderRadius?.[name] || { tl: 0, tr: 0, bl: 0, br: 0 };
                  const updateRadius = (corner: 'tl' | 'tr' | 'bl' | 'br', val: number) => {
                    update({
                      borderRadius: {
                        ...settings.borderRadius,
                        [name]: { ...r, [corner]: val },
                      },
                    });
                  };
                  return (
                    <div key={name} className="space-y-1.5">
                      <span className="text-sm text-gray-700 font-medium truncate min-w-0 block">{name}</span>
                      <div className="grid grid-cols-4 gap-2">
                        <NumberInput label="TL" value={r.tl} onChange={(v) => updateRadius('tl', v)} min={0} max={50} step={1} />
                        <NumberInput label="TR" value={r.tr} onChange={(v) => updateRadius('tr', v)} min={0} max={50} step={1} />
                        <NumberInput label="BR" value={r.br} onChange={(v) => updateRadius('br', v)} min={0} max={50} step={1} />
                        <NumberInput label="BL" value={r.bl} onChange={(v) => updateRadius('bl', v)} min={0} max={50} step={1} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AccordionSection>
  );
}
