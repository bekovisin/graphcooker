'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { HeatmapSettings, HeatmapColorMode, HeatmapDensity, HeatmapAlign, FontWeight } from '@/types/chart';

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
  { value: '600', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

const alignOptions: { value: HeatmapAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{children}</h4>
    </div>
  );
}

function FontFamilySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {fontFamilyOptions.map((f) => (
          <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>
            {f.split(',')[0]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function WeightSelect({ value, onChange }: { value: FontWeight; onChange: (v: FontWeight) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(v as FontWeight)}>
      <SelectTrigger className="h-8 text-xs w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {weightOptions.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AlignSelect({ value, onChange }: { value: HeatmapAlign; onChange: (v: HeatmapAlign) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as HeatmapAlign)}>
      <SelectTrigger className="h-8 text-xs w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {alignOptions.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HeatmapSection() {
  const settings = useEditorStore((s) => s.settings.heatmap);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<HeatmapSettings>) => updateSettings('heatmap', updates);

  return (
    <AccordionSection id="heatmap" title="Heatmap">
      {/* ── Coloring ── */}
      <SubHeader>Coloring</SubHeader>
      <SettingRow label="Color mode">
        <Select value={settings.colorMode} onValueChange={(v) => update({ colorMode: v as HeatmapColorMode })}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single" className="text-xs">Single (gradient)</SelectItem>
            <SelectItem value="diverging" className="text-xs">Diverging (around mean)</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {settings.colorMode === 'single' ? (
        <SettingRow label="Base color">
          <ColorPicker value={settings.baseColor} onChange={(c) => update({ baseColor: c })} />
        </SettingRow>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <SettingRow label="Positive">
            <ColorPicker value={settings.positiveColor} onChange={(c) => update({ positiveColor: c })} />
          </SettingRow>
          <SettingRow label="Negative">
            <ColorPicker value={settings.negativeColor} onChange={(c) => update({ negativeColor: c })} />
          </SettingRow>
        </div>
      )}

      <NumberInput
        label="Intensity"
        value={settings.intensity}
        onChange={(v) => update({ intensity: Math.max(0, Math.min(1, v)) })}
        min={0}
        max={1}
        step={0.05}
        arrowStep={0.05}
      />

      <SettingRow label="Include totals in color scale" variant="inline">
        <Switch checked={settings.includeTotalInScale} onCheckedChange={(c) => update({ includeTotalInScale: c })} />
      </SettingRow>

      {/* ── Cells ── */}
      <SubHeader>Cells</SubHeader>
      <SettingRow label="Value alignment">
        <AlignSelect value={settings.valueAlign} onChange={(v) => update({ valueAlign: v })} />
      </SettingRow>
      <SettingRow label="Font family">
        <FontFamilySelect value={settings.cellFontFamily} onChange={(v) => update({ cellFontFamily: v })} />
      </SettingRow>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
        <NumberInput label="Size" value={settings.cellFontSize} onChange={(v) => update({ cellFontSize: v })} min={6} max={48} step={1} suffix="px" />
        <div>
          <span className="text-xs text-gray-600 font-medium block mb-1">Weight</span>
          <WeightSelect value={settings.cellFontWeight} onChange={(v) => update({ cellFontWeight: v })} />
        </div>
        <ColorPicker value={settings.cellColor} onChange={(c) => update({ cellColor: c })} />
      </div>
      <SettingRow label="Empty / dash color">
        <ColorPicker value={settings.dashColor} onChange={(c) => update({ dashColor: c })} />
      </SettingRow>
      <SettingRow label="Density">
        <Select value={settings.density} onValueChange={(v) => update({ density: v as HeatmapDensity })}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact" className="text-xs">Compact</SelectItem>
            <SelectItem value="normal" className="text-xs">Normal</SelectItem>
            <SelectItem value="comfortable" className="text-xs">Comfortable</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Zero as dash" variant="inline">
        <Switch checked={settings.zeroAsDash} onCheckedChange={(c) => update({ zeroAsDash: c })} />
      </SettingRow>
      <SettingRow label="Striped rows" variant="inline">
        <Switch checked={settings.striped} onCheckedChange={(c) => update({ striped: c })} />
      </SettingRow>
      {settings.striped && (
        <SettingRow label="Stripe color">
          <ColorPicker value={settings.stripedColor} onChange={(c) => update({ stripedColor: c })} />
        </SettingRow>
      )}

      {/* ── Column header ── */}
      <SubHeader>Column header</SubHeader>
      <SettingRow label="Background">
        <ColorPicker value={settings.headerBg} onChange={(c) => update({ headerBg: c })} />
      </SettingRow>
      <SettingRow label="Font family">
        <FontFamilySelect value={settings.headerFontFamily} onChange={(v) => update({ headerFontFamily: v })} />
      </SettingRow>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
        <NumberInput label="Size" value={settings.headerFontSize} onChange={(v) => update({ headerFontSize: v })} min={6} max={48} step={1} suffix="px" />
        <div>
          <span className="text-xs text-gray-600 font-medium block mb-1">Weight</span>
          <WeightSelect value={settings.headerFontWeight} onChange={(v) => update({ headerFontWeight: v })} />
        </div>
        <ColorPicker value={settings.headerColor} onChange={(c) => update({ headerColor: c })} />
      </div>
      <SettingRow label="Alignment">
        <AlignSelect value={settings.headerAlign} onChange={(v) => update({ headerAlign: v })} />
      </SettingRow>
      <NumberInput
        label="Letter spacing"
        value={settings.headerLetterSpacing}
        onChange={(v) => update({ headerLetterSpacing: v })}
        min={-2}
        max={10}
        step={0.1}
        arrowStep={0.1}
        suffix="px"
      />
      <SettingRow label="Uppercase" variant="inline">
        <Switch checked={settings.headerUppercase} onCheckedChange={(c) => update({ headerUppercase: c })} />
      </SettingRow>

      {/* ── Row labels ── */}
      <SubHeader>Row labels</SubHeader>
      <SettingRow label="Show color dots" variant="inline">
        <Switch checked={settings.showRowDots} onCheckedChange={(c) => update({ showRowDots: c })} />
      </SettingRow>
      <SettingRow label="Alignment">
        <AlignSelect value={settings.labelAlign} onChange={(v) => update({ labelAlign: v })} />
      </SettingRow>
      <SettingRow label="Font family">
        <FontFamilySelect value={settings.labelFontFamily} onChange={(v) => update({ labelFontFamily: v })} />
      </SettingRow>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
        <NumberInput label="Size" value={settings.labelFontSize} onChange={(v) => update({ labelFontSize: v })} min={6} max={48} step={1} suffix="px" />
        <div>
          <span className="text-xs text-gray-600 font-medium block mb-1">Weight</span>
          <WeightSelect value={settings.labelFontWeight} onChange={(v) => update({ labelFontWeight: v })} />
        </div>
        <ColorPicker value={settings.labelColor} onChange={(c) => update({ labelColor: c })} />
      </div>
      <NumberInput
        label="Label column width (0 = auto)"
        value={settings.labelColWidth}
        onChange={(v) => update({ labelColWidth: Math.max(0, v) })}
        min={0}
        max={600}
        step={5}
        suffix="px"
      />

      {/* ── Borders ── */}
      <SubHeader>Borders</SubHeader>
      <SettingRow label="Show borders" variant="inline">
        <Switch checked={settings.borderShow} onCheckedChange={(c) => update({ borderShow: c })} />
      </SettingRow>
      {settings.borderShow && (
        <>
          <SettingRow label="Color">
            <ColorPicker value={settings.borderColor} onChange={(c) => update({ borderColor: c })} />
          </SettingRow>
          <NumberInput label="Width" value={settings.borderWidth} onChange={(v) => update({ borderWidth: v })} min={0.5} max={5} step={0.5} suffix="px" />
          <SettingRow label="Style">
            <Select value={settings.borderStyle} onValueChange={(v) => update({ borderStyle: v as 'solid' | 'dashed' })}>
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </>
      )}

      {/* ── Totals ── */}
      <SubHeader>Totals</SubHeader>
      <SettingRow label="Show totals column" variant="inline">
        <Switch checked={settings.showTotals} onCheckedChange={(c) => update({ showTotals: c })} />
      </SettingRow>
      {settings.showTotals && (
        <SettingRow label="Total label">
          <Input value={settings.totalLabel} onChange={(e) => update({ totalLabel: e.target.value })} className="h-8 text-xs" />
        </SettingRow>
      )}

      {/* ── Outer ── */}
      <SubHeader>Container</SubHeader>
      <NumberInput label="Corner radius" value={settings.cornerRadius} onChange={(v) => update({ cornerRadius: v })} min={0} max={40} step={1} suffix="px" />
    </AccordionSection>
  );
}
