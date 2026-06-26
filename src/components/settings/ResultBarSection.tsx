'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
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
import { Settings2, X, ImageIcon } from 'lucide-react';
import type {
  ResultBarSettings,
  ResultBarNumberFormat,
  ResultSegmentOverride,
  ResultValuePosition,
  ResultNamePosition,
  FontWeight,
  ThousandsSeparator,
  DecimalSeparator,
} from '@/types/chart';

// ─── Shared options ──────────────────────────────────────────────────
const fontFamilyOptions = ['Inter, sans-serif', 'Roboto, sans-serif', 'Montserrat, sans-serif', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'system-ui'];
const fontWeightOptions: { value: FontWeight; label: string }[] = [
  { value: '300', label: 'Light' }, { value: 'normal', label: 'Normal' }, { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' }, { value: 'bold', label: 'Bold' }, { value: '800', label: 'Extra-bold' }, { value: '900', label: 'Black' },
];
const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';
const valuePosOptions: { value: ResultValuePosition; label: string }[] = [
  { value: 'auto', label: 'Auto' }, { value: 'inside', label: 'Inside' }, { value: 'below', label: 'Below' }, { value: 'both', label: 'Inside + below' }, { value: 'hidden', label: 'Off' },
];
const namePosOptions: { value: ResultNamePosition; label: string }[] = [
  { value: 'above', label: 'Above' }, { value: 'legend', label: 'Legend' }, { value: 'hidden', label: 'Off' },
];

// ─── Design-language primitives ──────────────────────────────────────
function TabMenu<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-md border border-gray-300 overflow-hidden w-full">
      {options.map((opt, i) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${value === opt.value ? 'bg-blue-500 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'} ${i > 0 ? 'border-l border-gray-300' : ''}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1 mt-1 border-t border-gray-100">{children}</div>;
}

function SliderWithInput({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-xs text-gray-600 shrink-0">{label}</Label>
        <div className="flex items-center gap-1">
          <Input type="number" value={value} onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n))); }} min={min} max={max} step={step} className="h-7 text-xs w-20" />
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}

function FontGrid({ family, size, weight, color, onFamily, onSize, onWeight, onColor }: {
  family: string; size: number; weight: FontWeight; color: string;
  onFamily: (v: string) => void; onSize: (v: number) => void; onWeight: (v: FontWeight) => void; onColor: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Select value={family} onValueChange={onFamily}>
        <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{fontFamilyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(',')[0]}</SelectItem>)}</SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
          <Input type="number" value={size} onChange={(e) => onSize(parseInt(e.target.value) || size)} className="h-8 text-xs w-full" min={6} max={140} />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
          <Select value={weight} onValueChange={(v) => onWeight(v as FontWeight)}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <ColorPicker label="Color" value={color} onChange={onColor} />
    </div>
  );
}

function NumberFormatRows({ fmt, onChange }: { fmt: ResultBarNumberFormat; onChange: (u: Partial<ResultBarNumberFormat>) => void }) {
  const round = fmt.rounding === true;
  return (
    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
      <SettingRow label="Round numbers" variant="inline">
        <Switch checked={round} onCheckedChange={(v) => onChange({ rounding: v })} />
      </SettingRow>
      <div className="grid grid-cols-2 gap-2">
        {round && <NumberInput label="Decimals" value={fmt.decimalPlaces} onChange={(v) => onChange({ decimalPlaces: v })} min={0} max={10} />}
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Thousands</label>
          <Select value={fmt.thousandsSeparator} onValueChange={(v) => onChange({ thousandsSeparator: v as ThousandsSeparator })}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="," className="text-xs">Comma</SelectItem><SelectItem value="." className="text-xs">Dot</SelectItem><SelectItem value=" " className="text-xs">Space</SelectItem><SelectItem value="none" className="text-xs">None</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <SettingRow label="Decimal separator">
        <Select value={fmt.decimalSeparator} onValueChange={(v) => onChange({ decimalSeparator: v as DecimalSeparator })}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="." className="text-xs">Dot (.)</SelectItem><SelectItem value="," className="text-xs">Comma (,)</SelectItem></SelectContent>
        </Select>
      </SettingRow>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Prefix</label>
          <Input value={fmt.prefix} onChange={(e) => onChange({ prefix: e.target.value })} className="h-8 text-xs w-full" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Suffix</label>
          <Input value={fmt.suffix} onChange={(e) => onChange({ suffix: e.target.value })} className="h-8 text-xs w-full" />
        </div>
      </div>
      {round && (
        <SettingRow label="Trailing zeros" variant="inline">
          <Switch checked={fmt.showTrailingZeros} onCheckedChange={(v) => onChange({ showTrailingZeros: v })} />
        </SettingRow>
      )}
    </div>
  );
}

function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((file: File) => { const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(file); }, [onChange]);
  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 rounded" />
          <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5" onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = ''; }}><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer border-gray-300 py-3" onClick={() => inputRef.current?.click()}>
          <ImageIcon className="w-4 h-4 text-gray-400" /><span className="text-[10px] text-gray-400 mt-0.5">Upload image</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }} />
      <Input value={value.startsWith('data:') ? '' : value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste image URL" className="h-8 text-xs w-full" />
    </div>
  );
}

// Modal trigger button (matches "Configure per-series…" links in other charts)
function OverridesButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 mt-2">
      <Settings2 className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

// ─── Store hook helper ───────────────────────────────────────────────
function useRB() {
  const rb = useEditorStore((s) => s.settings.resultBar);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const seriesNames = useEditorStore((s) => s.seriesNames);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const update = (u: Partial<ResultBarSettings>) => updateSettings('resultBar', u);
  const segmentNames = useMemo(() => (columnMapping.values || []).map((c) => seriesNames?.[c] || c), [columnMapping.values, seriesNames]);
  const setSeg = (name: string, u: Partial<ResultSegmentOverride>) =>
    update({ perSegment: { ...rb.perSegment, [name]: { ...(rb.perSegment?.[name] || {}), ...u } } });
  return { rb, update, segmentNames, setSeg };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. BARS  (geometry only)
// ═══════════════════════════════════════════════════════════════════════
export function ResultBarSection() {
  const { rb, update } = useRB();
  return (
    <AccordionSection id="result-bar" title="Bars" defaultOpen>
      <SliderWithInput label="Bar height" value={rb.barHeight} onChange={(v) => update({ barHeight: v })} min={20} max={300} step={1} suffix="px" />
      <SliderWithInput label="Segment spacing" value={rb.segmentSpacing} onChange={(v) => update({ segmentSpacing: v })} min={0} max={20} step={1} suffix="px" />
      <SliderWithInput label="Corner radius" value={rb.cornerRadius} onChange={(v) => update({ cornerRadius: v })} min={0} max={60} step={1} suffix="px" />
      <SliderWithInput label="Bar opacity" value={rb.barOpacity} onChange={(v) => update({ barOpacity: v })} min={0} max={1} step={0.05} />
      <SettingRow label="Outline" variant="inline">
        <Switch checked={rb.outline} onCheckedChange={(v) => update({ outline: v })} />
      </SettingRow>
      {rb.outline && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <ColorPicker label="Outline color" value={rb.outlineColor} onChange={(c) => update({ outlineColor: c })} />
          <NumberInput label="Outline width" value={rb.outlineWidth} onChange={(v) => update({ outlineWidth: v })} min={0.5} max={10} step={0.5} suffix="px" />
        </div>
      )}
      <SettingRow label="Manual plot width" variant="inline">
        <Switch checked={rb.manualPlotWidth} onCheckedChange={(v) => update({ manualPlotWidth: v })} />
      </SettingRow>
      {rb.manualPlotWidth && (
        <div className="pl-2 border-l-2 border-gray-100">
          <SliderWithInput label="Plot width" value={rb.manualPlotWidthValue} onChange={(v) => update({ manualPlotWidthValue: v })} min={100} max={2000} step={1} suffix="px" />
        </div>
      )}
    </AccordionSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. IMAGES
// ═══════════════════════════════════════════════════════════════════════
export function ResultImagesSection() {
  const { rb, update } = useRB();
  const imgRow = (side: 'leftImage' | 'rightImage', label: string) => {
    const img = rb[side];
    const set = (u: Partial<typeof img>) => update({ [side]: { ...img, ...u } } as Partial<ResultBarSettings>);
    return (
      <>
        <SettingRow label={label} variant="inline"><Switch checked={img.show} onCheckedChange={(v) => set({ show: v })} /></SettingRow>
        {img.show && (
          <div className="space-y-3 pl-2 border-l-2 border-gray-100">
            <ImageUploader value={img.url} onChange={(u) => set({ url: u })} />
            <SettingRow label="Position"><TabMenu value={img.position} onChange={(v) => set({ position: v })} options={[{ value: 'side', label: 'Beside bar' }, { value: 'above', label: 'Above chart' }]} /></SettingRow>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Width" value={img.width} onChange={(v) => set({ width: v })} min={10} max={600} suffix="px" />
              <NumberInput label="Height" value={img.height} onChange={(v) => set({ height: v })} min={10} max={600} suffix="px" />
              <NumberInput label="Corner radius" value={img.borderRadius} onChange={(v) => set({ borderRadius: v })} min={0} max={300} suffix="px" />
              {img.position === 'side' && <NumberInput label="Gap to bar" value={img.gap} onChange={(v) => set({ gap: v })} min={0} max={300} suffix="px" />}
            </div>
            <div className="text-[10px] font-medium text-gray-500">Padding</div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Top" value={img.paddingTop} onChange={(v) => set({ paddingTop: v })} min={-400} max={600} suffix="px" />
              <NumberInput label="Right" value={img.paddingRight} onChange={(v) => set({ paddingRight: v })} min={-400} max={600} suffix="px" />
              <NumberInput label="Bottom" value={img.paddingBottom} onChange={(v) => set({ paddingBottom: v })} min={-400} max={600} suffix="px" />
              <NumberInput label="Left" value={img.paddingLeft} onChange={(v) => set({ paddingLeft: v })} min={-400} max={600} suffix="px" />
            </div>
          </div>
        )}
      </>
    );
  };
  return (
    <AccordionSection id="result-images" title="Images">
      {imgRow('leftImage', 'Left image')}
      {imgRow('rightImage', 'Right image')}
    </AccordionSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. LABELS  (value labels + overflow + names, per-segment via modal)
// ═══════════════════════════════════════════════════════════════════════
export function ResultLabelsSection() {
  const { rb, update, segmentNames, setSeg } = useRB();
  const [showModal, setShowModal] = useState(false);

  return (
    <AccordionSection id="result-labels" title="Labels">
      {/* VALUE LABELS (defaults) */}
      <SubHeader>Value labels</SubHeader>
      <SettingRow label="Position">
        <Select value={rb.valuePosition} onValueChange={(v) => update({ valuePosition: v as ResultValuePosition })}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{valuePosOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Align to edges" variant="inline"><Switch checked={rb.valueAlignEdges} onCheckedChange={(v) => update({ valueAlignEdges: v })} /></SettingRow>
      <SettingRow label="Color"><TabMenu value={rb.valueColorMode} onChange={(v) => update({ valueColorMode: v })} options={[{ value: 'auto', label: 'Auto (contrast)' }, { value: 'custom', label: 'Custom' }]} /></SettingRow>
      {rb.valueColorMode === 'auto' && (
        <SliderWithInput label="Contrast (white ↔ black)" value={rb.valueContrastThreshold} onChange={(v) => update({ valueContrastThreshold: v })} min={0} max={100} step={1} suffix="%" />
      )}
      <FontGrid family={rb.valueFontFamily} size={rb.valueFontSize} weight={rb.valueFontWeight} color={rb.valueColor}
        onFamily={(v) => update({ valueFontFamily: v })} onSize={(v) => update({ valueFontSize: v })} onWeight={(v) => update({ valueFontWeight: v })} onColor={(v) => update({ valueColor: v })} />
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Padding X" value={rb.valuePaddingX} onChange={(v) => update({ valuePaddingX: v })} min={0} max={80} suffix="px" />
        <NumberInput label="Letter spacing" value={rb.valueLetterSpacing} onChange={(v) => update({ valueLetterSpacing: v })} min={-10} max={30} step={0.1} />
      </div>
      <SettingRow label="Prefix (%)" variant="inline"><Switch checked={rb.prefixShow} onCheckedChange={(v) => update({ prefixShow: v })} /></SettingRow>
      {rb.prefixShow && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Text</label><Input value={rb.prefixText} onChange={(e) => update({ prefixText: e.target.value })} className="h-8 text-xs w-full" /></div>
            <NumberInput label="Size" value={rb.prefixFontSize} onChange={(v) => update({ prefixFontSize: v })} min={6} max={80} suffix="px" />
          </div>
          <SettingRow label="Position"><TabMenu value={rb.prefixPosition} onChange={(v) => update({ prefixPosition: v })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingRow>
          <SettingRow label="Vertical"><TabMenu value={rb.prefixVAlign} onChange={(v) => update({ prefixVAlign: v })} options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]} /></SettingRow>
          <NumberInput label="Padding" value={rb.prefixPadding} onChange={(v) => update({ prefixPadding: v })} min={-100} max={100} suffix="px" />
        </div>
      )}
      <SubHeader>Value number format</SubHeader>
      <NumberFormatRows fmt={rb.numberFormat} onChange={(u) => update({ numberFormat: { ...rb.numberFormat, ...u } })} />

      {/* OVERFLOW VALUE */}
      <SubHeader>Overflow value (below + line)</SubHeader>
      <SettingRow label="Line color"><ColorPicker value={rb.belowLineColor} onChange={(c) => update({ belowLineColor: c })} /></SettingRow>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Line width" value={rb.belowLineWidth} onChange={(v) => update({ belowLineWidth: v })} min={0.5} max={6} step={0.5} suffix="px" />
        <NumberInput label="Line length" value={rb.belowLineLength} onChange={(v) => update({ belowLineLength: v })} min={0} max={60} suffix="px" />
        <NumberInput label="Gap" value={rb.belowGap} onChange={(v) => update({ belowGap: v })} min={0} max={40} suffix="px" />
        <NumberInput label="Font size" value={rb.belowFontSize} onChange={(v) => update({ belowFontSize: v })} min={6} max={60} suffix="px" />
      </div>
      <SettingRow label="Weight"><Select value={rb.belowFontWeight} onValueChange={(v) => update({ belowFontWeight: v as FontWeight })}><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
      <SettingRow label="Color"><TabMenu value={rb.belowColorMode} onChange={(v) => update({ belowColorMode: v })} options={[{ value: 'match', label: 'Match segment' }, { value: 'custom', label: 'Custom' }]} /></SettingRow>
      {rb.belowColorMode === 'custom' && <div className="pl-2 border-l-2 border-gray-100"><ColorPicker label="Custom color" value={rb.belowColor} onChange={(c) => update({ belowColor: c })} /></div>}
      <SettingRow label="Prefix (%)" variant="inline"><Switch checked={rb.belowPrefixShow} onCheckedChange={(v) => update({ belowPrefixShow: v })} /></SettingRow>
      {rb.belowPrefixShow && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <NumberInput label="Prefix size (0 = match value)" value={rb.belowPrefixFontSize} onChange={(v) => update({ belowPrefixFontSize: v })} min={0} max={80} suffix="px" />
          <SettingRow label="Position"><TabMenu value={rb.belowPrefixPosition} onChange={(v) => update({ belowPrefixPosition: v })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingRow>
          <SettingRow label="Vertical"><TabMenu value={rb.belowPrefixVAlign} onChange={(v) => update({ belowPrefixVAlign: v })} options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]} /></SettingRow>
          <NumberInput label="Padding" value={rb.belowPrefixPadding} onChange={(v) => update({ belowPrefixPadding: v })} min={-100} max={100} suffix="px" />
        </div>
      )}
      <SubHeader>Overflow number format</SubHeader>
      <NumberFormatRows fmt={rb.belowNumberFormat} onChange={(u) => update({ belowNumberFormat: { ...rb.belowNumberFormat, ...u } })} />

      {/* NAMES */}
      <SubHeader>Names (above the bar)</SubHeader>
      <SettingRow label="Default position"><TabMenu value={rb.namePosition === 'auto' ? 'above' : rb.namePosition} onChange={(v) => update({ namePosition: v })} options={namePosOptions} /></SettingRow>
      <SettingRow label="Color"><TabMenu value={rb.nameColorMode} onChange={(v) => update({ nameColorMode: v })} options={[{ value: 'match', label: 'Match segment' }, { value: 'custom', label: 'Custom' }]} /></SettingRow>
      <FontGrid family={rb.nameFontFamily} size={rb.nameFontSize} weight={rb.nameFontWeight} color={rb.nameColor}
        onFamily={(v) => update({ nameFontFamily: v })} onSize={(v) => update({ nameFontSize: v })} onWeight={(v) => update({ nameFontWeight: v })} onColor={(v) => update({ nameColor: v })} />
      <SettingRow label="Bold weight"><Select value={rb.nameBoldWeight} onValueChange={(v) => update({ nameBoldWeight: v as FontWeight })}><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
      <p className="text-[10px] text-gray-400">Set a different weight per word in “Configure per-segment labels…” below.</p>
      <NumberInput label="Gap above" value={rb.nameGap} onChange={(v) => update({ nameGap: v })} min={0} max={40} suffix="px" />

      {/* PER-SEGMENT MODAL */}
      <OverridesButton onClick={() => setShowModal(true)}>Configure per-segment labels…</OverridesButton>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-segment label settings</DialogTitle>
            <DialogDescription>Override the name, value-label styling, prefix, padding and placement for each segment independently.</DialogDescription>
          </DialogHeader>
          {segmentNames.length === 0 && <div className="text-xs text-gray-400">Map value columns (series) first.</div>}
          {segmentNames.map((name) => {
            const o = rb.perSegment?.[name] || {};
            return (
              <div key={name} className="border rounded-md p-3 mb-2 space-y-2">
                <div className="text-xs font-semibold truncate">{name}</div>
                <SettingRow label="Display name"><Input value={o.name ?? ''} onChange={(e) => setSeg(name, { name: e.target.value || undefined })} placeholder={name} className="h-8 text-xs w-full" /></SettingRow>

                <div className="text-[10px] font-medium text-gray-500">Value label (inside)</div>
                <SettingRow label="Position">
                  <Select value={o.valuePosition || 'auto'} onValueChange={(v) => setSeg(name, { valuePosition: v as ResultValuePosition })}>
                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{valuePosOptions.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}</SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Inside prefix"><TabMenu value={o.prefixShow === undefined ? 'default' : o.prefixShow ? 'on' : 'off'} onChange={(v) => setSeg(name, { prefixShow: v === 'default' ? undefined : v === 'on' })} options={[{ value: 'default', label: 'Default' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} /></SettingRow>
                <SettingRow label="Below prefix"><TabMenu value={o.belowPrefixShow === undefined ? 'default' : o.belowPrefixShow ? 'on' : 'off'} onChange={(v) => setSeg(name, { belowPrefixShow: v === 'default' ? undefined : v === 'on' })} options={[{ value: 'default', label: 'Default' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} /></SettingRow>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Prefix size" value={o.prefixFontSize ?? rb.prefixFontSize} onChange={(v) => setSeg(name, { prefixFontSize: v })} min={6} max={120} suffix="px" />
                  <NumberInput label="Prefix padding" value={o.prefixPadding ?? rb.prefixPadding} onChange={(v) => setSeg(name, { prefixPadding: v })} min={-100} max={100} suffix="px" />
                </div>
                <SettingRow label="Prefix position"><TabMenu value={o.prefixPosition || 'default'} onChange={(v) => setSeg(name, { prefixPosition: v === 'default' ? undefined : (v as 'left' | 'right') })} options={[{ value: 'default', label: 'Default' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingRow>
                <SettingRow label="Prefix vertical"><TabMenu value={o.prefixVAlign || 'default'} onChange={(v) => setSeg(name, { prefixVAlign: v === 'default' ? undefined : (v as 'top' | 'center' | 'bottom') })} options={[{ value: 'default', label: 'Def' }, { value: 'top', label: 'Top' }, { value: 'center', label: 'Mid' }, { value: 'bottom', label: 'Bot' }]} /></SettingRow>
                <SettingRow label="Inside decimals" variant="inline"><Switch checked={o.valueDecimals !== undefined} onCheckedChange={(v) => setSeg(name, { valueDecimals: v ? rb.numberFormat.decimalPlaces : undefined })} /></SettingRow>
                {o.valueDecimals !== undefined && <div className="pl-2 border-l-2 border-gray-100"><NumberInput label="Inside value decimals" value={o.valueDecimals} onChange={(v) => setSeg(name, { valueDecimals: v })} min={0} max={10} /></div>}
                <SettingRow label="Below decimals" variant="inline"><Switch checked={o.belowValueDecimals !== undefined} onCheckedChange={(v) => setSeg(name, { belowValueDecimals: v ? rb.belowNumberFormat.decimalPlaces : undefined })} /></SettingRow>
                {o.belowValueDecimals !== undefined && <div className="pl-2 border-l-2 border-gray-100"><NumberInput label="Below value decimals" value={o.belowValueDecimals} onChange={(v) => setSeg(name, { belowValueDecimals: v })} min={0} max={10} /></div>}
                <SettingRow label="Align"><TabMenu value={o.valueAlign || 'default'} onChange={(v) => setSeg(name, { valueAlign: v === 'default' ? undefined : (v as 'left' | 'center' | 'right') })} options={[{ value: 'default', label: 'Auto' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /></SettingRow>
                <Select value={o.valueFontFamily || '__default__'} onValueChange={(v) => setSeg(name, { valueFontFamily: v === '__default__' ? undefined : v })}>
                  <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__default__" className="text-xs">Default font</SelectItem>{fontFamilyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(',')[0]}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Font size" value={o.valueFontSize ?? rb.valueFontSize} onChange={(v) => setSeg(name, { valueFontSize: v })} min={6} max={140} suffix="px" />
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
                    <Select value={o.valueFontWeight ?? rb.valueFontWeight} onValueChange={(v) => setSeg(name, { valueFontWeight: v as FontWeight })}>
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{fontWeightOptions.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <NumberInput label="Letter spacing" value={o.valueLetterSpacing ?? rb.valueLetterSpacing} onChange={(v) => setSeg(name, { valueLetterSpacing: v })} min={-10} max={30} step={0.1} />
                </div>
                <SettingRow label="Text color"><TabMenu value={o.valueColor ? 'custom' : 'auto'} onChange={(v) => setSeg(name, { valueColor: v === 'auto' ? undefined : (o.valueColor || rb.valueColor || '#ffffff') })} options={[{ value: 'auto', label: 'Auto' }, { value: 'custom', label: 'Custom' }]} /></SettingRow>
                {o.valueColor && <div className="pl-2 border-l-2 border-gray-100"><ColorPicker label="Color" value={o.valueColor} onChange={(c) => setSeg(name, { valueColor: c })} /></div>}
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Padding X" value={o.valuePadX ?? 0} onChange={(v) => setSeg(name, { valuePadX: v })} min={-300} max={300} suffix="px" />
                  <NumberInput label="Padding Y" value={o.valuePadY ?? 0} onChange={(v) => setSeg(name, { valuePadY: v })} min={-300} max={300} suffix="px" />
                </div>

                <div className="text-[10px] font-medium text-gray-500 pt-1">Name above</div>
                <SettingRow label="Placement"><TabMenu value={(o.namePosition && o.namePosition !== 'auto' ? o.namePosition : (rb.namePosition === 'auto' ? 'above' : rb.namePosition))} onChange={(v) => setSeg(name, { namePosition: v as ResultNamePosition })} options={namePosOptions} /></SettingRow>
                <SettingRow label="Name color"><ColorPicker value={o.nameColor || rb.nameColor} onChange={(c) => setSeg(name, { nameColor: c })} /></SettingRow>
                <SettingRow label="Name padding (X / Y)">
                  <div className="flex items-center gap-1">
                    <NumberInput value={o.namePadX ?? 0} onChange={(v) => setSeg(name, { namePadX: v })} min={-400} max={400} className="h-7 text-xs w-16" />
                    <NumberInput value={o.namePadY ?? 0} onChange={(v) => setSeg(name, { namePadY: v })} min={-400} max={400} className="h-7 text-xs w-16" />
                  </div>
                </SettingRow>
                {(() => {
                  const words = (o.name || name).split(/\s+/).filter(Boolean);
                  if (words.length === 0) return null;
                  const ww = o.nameWordWeights || [];
                  return (
                    <div className="space-y-1">
                      <div className="text-[10px] text-gray-500">Per-word weight</div>
                      {words.map((word, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 flex-1 truncate min-w-0">{word}</span>
                          <Select
                            value={(ww[i] as string) || '__base__'}
                            onValueChange={(v) => {
                              const next = [...(o.nameWordWeights || [])];
                              while (next.length < words.length) next.push(null);
                              next[i] = v === '__base__' ? null : (v as FontWeight);
                              setSeg(name, { nameWordWeights: next });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-28 shrink-0"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__base__" className="text-xs">Default</SelectItem>
                              {fontWeightOptions.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </DialogContent>
      </Dialog>
    </AccordionSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 4. LEGEND
// ═══════════════════════════════════════════════════════════════════════
export function ResultLegendSection() {
  const { rb, update, segmentNames } = useRB();
  const [showModal, setShowModal] = useState(false);
  return (
    <AccordionSection id="result-legend" title="Legend">
      <SettingRow label="Position"><TabMenu value={rb.legendPosition} onChange={(v) => update({ legendPosition: v })} options={[{ value: 'below', label: 'Below' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></SettingRow>
      <SettingRow label="Orientation"><TabMenu value={rb.legendOrientation} onChange={(v) => update({ legendOrientation: v })} options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} /></SettingRow>
      {rb.legendPosition === 'below' && <SettingRow label="Align"><TabMenu value={rb.legendAlign} onChange={(v) => update({ legendAlign: v })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /></SettingRow>}
      {rb.legendPosition !== 'below' && <NumberInput label="Column width" value={rb.legendWidth} onChange={(v) => update({ legendWidth: v })} min={40} max={500} suffix="px" />}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Dot size" value={rb.legendDotSize} onChange={(v) => update({ legendDotSize: v })} min={4} max={24} suffix="px" />
        <NumberInput label="Dot gap" value={rb.legendDotGap} onChange={(v) => update({ legendDotGap: v })} min={0} max={40} suffix="px" />
        <NumberInput label="Font size" value={rb.legendFontSize} onChange={(v) => update({ legendFontSize: v })} min={6} max={40} suffix="px" />
      </div>
      <SettingRow label="Weight"><Select value={rb.legendFontWeight} onValueChange={(v) => update({ legendFontWeight: v as FontWeight })}><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
      <SettingRow label="Color"><ColorPicker value={rb.legendColor} onChange={(c) => update({ legendColor: c })} /></SettingRow>
      <SubHeader>Spacing</SubHeader>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Gap from bar" value={rb.legendGap} onChange={(v) => update({ legendGap: v })} min={0} max={80} suffix="px" />
        <NumberInput label="Gap horizontal" value={rb.legendItemGapX} onChange={(v) => update({ legendItemGapX: v })} min={0} max={80} suffix="px" />
        <NumberInput label="Gap vertical" value={rb.legendItemGapY} onChange={(v) => update({ legendItemGapY: v })} min={0} max={40} suffix="px" />
      </div>

      <OverridesButton onClick={() => setShowModal(true)}>Configure segments in legend…</OverridesButton>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Segments in legend</DialogTitle>
            <DialogDescription>Auto = shown when its name is set to Legend. Show / Hide forces it.</DialogDescription>
          </DialogHeader>
          {segmentNames.length === 0 && <div className="text-xs text-gray-400">Map value columns (series) first.</div>}
          {segmentNames.map((name) => {
            const cur = rb.legendVisibleRows?.[name];
            const val = cur === undefined ? 'auto' : cur ? 'show' : 'hide';
            return (
              <SettingRow key={name} label={name}>
                <TabMenu value={val} onChange={(v) => { const next = { ...rb.legendVisibleRows }; if (v === 'auto') delete next[name]; else next[name] = v === 'show'; update({ legendVisibleRows: next }); }}
                  options={[{ value: 'auto', label: 'Auto' }, { value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }]} />
              </SettingRow>
            );
          })}
        </DialogContent>
      </Dialog>
    </AccordionSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 5. DIFFERENCE BAR
// ═══════════════════════════════════════════════════════════════════════
export function ResultDifferenceSection() {
  const { rb, update } = useRB();
  return (
    <AccordionSection id="result-difference" title="Difference bar">
      <SettingRow label="Show difference bar" variant="inline"><Switch checked={rb.diffShow} onCheckedChange={(v) => update({ diffShow: v })} /></SettingRow>
      {rb.diffShow && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          <SettingRow label="Value source"><TabMenu value={rb.diffSource} onChange={(v) => update({ diffSource: v })} options={[{ value: 'info', label: 'Info column' }, { value: 'auto', label: 'Auto' }]} /></SettingRow>
          <SettingRow label="Template"><Input value={rb.diffTemplate} onChange={(e) => update({ diffTemplate: e.target.value })} className="h-8 text-xs w-full" /></SettingRow>
          <p className="text-[10px] text-gray-400 -mt-1.5">Placeholders: {'{leader} {trailer} {value}'}</p>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Height" value={rb.diffHeight} onChange={(v) => update({ diffHeight: v })} min={10} max={120} suffix="px" />
            <NumberInput label="Margin top" value={rb.diffMarginTop} onChange={(v) => update({ diffMarginTop: v })} min={0} max={80} suffix="px" />
            <NumberInput label="Corner radius" value={rb.diffCornerRadius} onChange={(v) => update({ diffCornerRadius: v })} min={0} max={60} suffix="px" />
            <NumberInput label="Font size" value={rb.diffFontSize} onChange={(v) => update({ diffFontSize: v })} min={8} max={80} suffix="px" />
          </div>
          <ColorPicker label="Background" value={rb.diffBackgroundColor} onChange={(c) => update({ diffBackgroundColor: c })} />
          <SettingRow label="Align"><TabMenu value={rb.diffAlign} onChange={(v) => update({ diffAlign: v })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /></SettingRow>
          <SettingRow label="Font">
            <Select value={rb.diffFontFamily} onValueChange={(v) => update({ diffFontFamily: v })}>
              <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{fontFamilyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(',')[0]}</SelectItem>)}</SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Weight"><Select value={rb.diffFontWeight} onValueChange={(v) => update({ diffFontWeight: v as FontWeight })}><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
          <SettingRow label="Style"><TabMenu value={rb.diffFontStyle} onChange={(v) => update({ diffFontStyle: v })} options={[{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Italic' }]} /></SettingRow>
          <SettingRow label="Underline" variant="inline"><Switch checked={rb.diffUnderline} onCheckedChange={(v) => update({ diffUnderline: v })} /></SettingRow>
          <SettingRow label="Text color"><TabMenu value={rb.diffMatchLeaderColor ? 'leader' : 'custom'} onChange={(v) => update({ diffMatchLeaderColor: v === 'leader' })} options={[{ value: 'leader', label: 'Match leader' }, { value: 'custom', label: 'Custom' }]} /></SettingRow>
          {!rb.diffMatchLeaderColor && <ColorPicker label="Custom color" value={rb.diffColor} onChange={(c) => update({ diffColor: c })} />}
          <SubHeader>Value number format</SubHeader>
          <NumberFormatRows fmt={rb.diffNumberFormat} onChange={(u) => update({ diffNumberFormat: { ...rb.diffNumberFormat, ...u } })} />
        </div>
      )}
    </AccordionSection>
  );
}
