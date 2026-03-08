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
import type { LineCurve, MissingDataMode, DotMode, LineDotsAreasSettings } from '@/types/chart';

// ── TabMenu ──
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

// ── SliderWithInput ──
function SliderWithInput({ label, value, onChange, min, max, step, suffix }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
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

// ── SubHeader ──
function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

export function LineDotsAreasSection() {
  const settings = useEditorStore((s) => s.settings.lineDotsAreas);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<LineDotsAreasSettings>) => {
    updateSettings('lineDotsAreas', updates);
  };

  return (
    <AccordionSection id="line-dots-areas" title="Lines, dots and areas">
      {/* ── LINES ── */}
      <SubHeader>Lines</SubHeader>

      {/* Line width */}
      <SliderWithInput
        label="Line width"
        value={settings.lineWidth}
        onChange={(v) => update({ lineWidth: v })}
        min={0}
        max={10}
        step={0.1}
      />

      {/* Line opacity */}
      <SliderWithInput
        label="Line opacity"
        value={settings.lineOpacity}
        onChange={(v) => update({ lineOpacity: v })}
        min={0}
        max={1}
        step={0.05}
      />

      {/* Outline */}
      <SettingRow label="Outline" variant="inline">
        <Switch
          checked={settings.lineOutline}
          onCheckedChange={(checked) => update({ lineOutline: checked })}
        />
      </SettingRow>

      {/* Line curve */}
      <SettingRow label="Line curve">
        <Select
          value={settings.lineCurve}
          onValueChange={(v) => update({ lineCurve: v as LineCurve })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear" className="text-xs">Straight</SelectItem>
            <SelectItem value="catmullRom" className="text-xs">Curve X</SelectItem>
            <SelectItem value="natural" className="text-xs">Natural</SelectItem>
            <SelectItem value="step" className="text-xs">Step</SelectItem>
            <SelectItem value="stepBefore" className="text-xs">Step Before</SelectItem>
            <SelectItem value="stepAfter" className="text-xs">Step After</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Dashed lines */}
      <SettingRow label="Dashed lines" variant="inline">
        <Switch
          checked={settings.dashedLines}
          onCheckedChange={(checked) => update({ dashedLines: checked })}
        />
      </SettingRow>

      {settings.dashedLines && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <NumberInput
            label="Dash width"
            value={settings.dashWidth}
            onChange={(v) => update({ dashWidth: v })}
            min={1}
            max={20}
            step={1}
            suffix="px"
          />
          <NumberInput
            label="Space width"
            value={settings.dashSpaceWidth}
            onChange={(v) => update({ dashSpaceWidth: v })}
            min={1}
            max={20}
            step={1}
            suffix="px"
          />
        </div>
      )}

      {/* Missing data */}
      <SettingRow label="Missing data">
        <TabMenu
          value={settings.missingDataMode}
          onChange={(v) => update({ missingDataMode: v as MissingDataMode })}
          options={[
            { value: 'continue', label: 'Continue' },
            { value: 'gaps', label: 'Gaps' },
          ]}
        />
      </SettingRow>

      {/* ── SHADE BETWEEN LINES ── */}
      <SubHeader>Shade between lines</SubHeader>
      <SettingRow label="Shade between lines" variant="inline">
        <Switch
          checked={settings.shadeBetweenLines}
          onCheckedChange={(checked) => update({ shadeBetweenLines: checked })}
        />
      </SettingRow>

      {/* ── DOTS ── */}
      <SubHeader>Dots</SubHeader>

      {/* Dot mode */}
      <SettingRow label="Mode">
        <Select
          value={settings.dotMode}
          onValueChange={(v) => update({ dotMode: v as DotMode })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto" className="text-xs">Auto</SelectItem>
            <SelectItem value="final_only" className="text-xs">Final dot only</SelectItem>
            <SelectItem value="on" className="text-xs">On</SelectItem>
            <SelectItem value="off" className="text-xs">Off</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {settings.dotMode !== 'off' && (
        <>
          {/* Dot opacity */}
          <SliderWithInput
            label="Dot opacity"
            value={settings.dotOpacity}
            onChange={(v) => update({ dotOpacity: v })}
            min={0}
            max={1}
            step={0.05}
          />

          {/* Dot radius */}
          <SliderWithInput
            label="Dot radius"
            value={settings.dotRadius}
            onChange={(v) => update({ dotRadius: v })}
            min={0}
            max={10}
            step={0.25}
          />

          {/* Final dot scale */}
          <SliderWithInput
            label="Final dot scale"
            value={settings.finalDotScale}
            onChange={(v) => update({ finalDotScale: v })}
            min={0}
            max={500}
            step={10}
            suffix="%"
          />

          {/* Hollow */}
          <SettingRow label="Hollow" variant="inline">
            <Switch
              checked={settings.dotHollow}
              onCheckedChange={(checked) => update({ dotHollow: checked })}
            />
          </SettingRow>

          {settings.dotHollow && (
            <div className="space-y-3 pl-2 border-l-2 border-gray-100">
              <ColorPicker
                label="Dot inner color"
                value={settings.dotInnerColor || '#ffffff'}
                onChange={(color) => update({ dotInnerColor: color })}
                allowTransparent
              />
              <SliderWithInput
                label="Inner opacity"
                value={settings.dotInnerOpacity ?? 100}
                onChange={(v) => update({ dotInnerOpacity: v })}
                min={0}
                max={100}
                step={1}
                suffix="%"
              />
            </div>
          )}
        </>
      )}
    </AccordionSection>
  );
}
