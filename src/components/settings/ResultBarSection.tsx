'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings2, X, ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  ResultBarSettings,
  ResultBarNumberFormat,
  ResultValuePosition,
  ResultNamePosition,
  FontWeight,
  ThousandsSeparator,
  DecimalSeparator,
} from '@/types/chart';

const fontFamilyOptions = ['Inter, sans-serif', 'Roboto, sans-serif', 'Montserrat, sans-serif', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'system-ui'];
const fontWeightOptions: { value: FontWeight; label: string }[] = [
  { value: '300', label: 'Light' }, { value: 'normal', label: 'Normal' }, { value: '500', label: '500' },
  { value: '600', label: '600' }, { value: 'bold', label: 'Bold' }, { value: '800', label: '800' }, { value: '900', label: '900' },
];
const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';

// ── helpers ──
function SubHeader({ children, open, onToggle }: { children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1 border-b border-gray-200 pb-1 w-full text-left" onClick={onToggle}>
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}{children}
    </button>
  );
}

function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((file: File) => { const r = new FileReader(); r.onload = () => onChange(r.result as string); r.readAsDataURL(file); }, [onChange]);
  return (
    <div className="space-y-1">
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 rounded" />
          <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5" onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = ''; }}><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer border-gray-300 p-2" onClick={() => inputRef.current?.click()}>
          <ImageIcon className="w-4 h-4 text-gray-400" /><span className="text-[10px] text-gray-400">Upload</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }} />
      <Input value={value.startsWith('data:') ? '' : value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className="h-7 text-xs" />
    </div>
  );
}

function FontRow({ family, weight, size, color, onChange }: { family: string; weight: FontWeight; size: number; color: string; onChange: (u: { family?: string; weight?: FontWeight; size?: number; color?: string }) => void }) {
  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
      <Select value={family} onValueChange={(v) => onChange({ family: v })}>
        <SelectTrigger className="h-7 text-[10px] w-full"><SelectValue placeholder="Font" /></SelectTrigger>
        <SelectContent>{fontFamilyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(',')[0]}</SelectItem>)}</SelectContent>
      </Select>
      <div className="grid grid-cols-3 gap-1 items-center">
        <Select value={weight} onValueChange={(v) => onChange({ weight: v as FontWeight })}>
          <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Wt" /></SelectTrigger>
          <SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-0.5"><NumberInput value={size} onChange={(v) => onChange({ size: v })} min={6} max={140} className="h-7 text-[10px] w-full" /><span className="text-[9px] text-gray-400">px</span></div>
        <ColorPicker value={color} onChange={(c) => onChange({ color: c })} />
      </div>
    </div>
  );
}

function NumberFormatEditor({ fmt, onChange }: { fmt: ResultBarNumberFormat; onChange: (u: Partial<ResultBarNumberFormat>) => void }) {
  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
      <SettingRow label="Decimals"><NumberInput value={fmt.decimalPlaces} onChange={(v) => onChange({ decimalPlaces: v })} min={0} max={10} className="h-7 text-xs w-16" /></SettingRow>
      <SettingRow label="Thousands"><Select value={fmt.thousandsSeparator} onValueChange={(v) => onChange({ thousandsSeparator: v as ThousandsSeparator })}><SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="," className="text-xs">,</SelectItem><SelectItem value="." className="text-xs">.</SelectItem><SelectItem value=" " className="text-xs">Space</SelectItem><SelectItem value="none" className="text-xs">None</SelectItem></SelectContent></Select></SettingRow>
      <SettingRow label="Decimal sep."><Select value={fmt.decimalSeparator} onValueChange={(v) => onChange({ decimalSeparator: v as DecimalSeparator })}><SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="." className="text-xs">.</SelectItem><SelectItem value="," className="text-xs">,</SelectItem></SelectContent></Select></SettingRow>
      <SettingRow label="Trailing zeros"><Switch checked={fmt.showTrailingZeros} onCheckedChange={(v) => onChange({ showTrailingZeros: v })} /></SettingRow>
    </div>
  );
}

const valuePosOptions: { value: ResultValuePosition; label: string }[] = [
  { value: 'auto', label: 'Auto (overflow → below)' }, { value: 'inside', label: 'Inside' }, { value: 'below', label: 'Below + line' }, { value: 'hidden', label: 'Hidden' },
];
const namePosOptions: { value: ResultNamePosition; label: string }[] = [
  { value: 'auto', label: 'Auto (overflow → legend)' }, { value: 'above', label: 'Above' }, { value: 'legend', label: 'Legend' }, { value: 'hidden', label: 'Hidden' },
];

export function ResultBarSection() {
  const rb = useEditorStore((s) => s.settings.resultBar);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const seriesNames = useEditorStore((s) => s.seriesNames);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const update = (u: Partial<ResultBarSettings>) => updateSettings('resultBar', u);

  const [open, setOpen] = useState<Record<string, boolean>>({ bar: true, images: false, names: false, values: false, below: false, legend: false, diff: false });
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const [showOverrides, setShowOverrides] = useState(false);

  const segmentNames = useMemo(() => {
    const vals = columnMapping.values || [];
    return vals.map((c) => seriesNames?.[c] || c);
  }, [columnMapping.values, seriesNames]);

  return (
    <AccordionSection id="result-bar" title="Result bar" defaultOpen>
      {/* ── Bar Layout ── */}
      <SubHeader open={open.bar} onToggle={() => toggle('bar')}>Bar Layout</SubHeader>
      {open.bar && (
        <>
          <SettingRow label="Bar height"><NumberInput value={rb.barHeight} onChange={(v) => update({ barHeight: v })} min={20} max={300} className="h-7 text-xs w-20" /></SettingRow>
          <SettingRow label="Segment spacing"><NumberInput value={rb.segmentSpacing} onChange={(v) => update({ segmentSpacing: v })} min={0} max={20} className="h-7 text-xs w-20" /></SettingRow>
          <SettingRow label="Corner radius"><NumberInput value={rb.cornerRadius} onChange={(v) => update({ cornerRadius: v })} min={0} max={60} className="h-7 text-xs w-20" /></SettingRow>
          <SettingRow label="Opacity"><NumberInput value={rb.barOpacity} onChange={(v) => update({ barOpacity: v })} min={0} max={1} step={0.05} className="h-7 text-xs w-20" /></SettingRow>
          <SettingRow label="Outline"><Switch checked={rb.outline} onCheckedChange={(v) => update({ outline: v })} /></SettingRow>
          {rb.outline && (
            <>
              <SettingRow label="Outline color"><ColorPicker value={rb.outlineColor} onChange={(c) => update({ outlineColor: c })} /></SettingRow>
              <SettingRow label="Outline width"><NumberInput value={rb.outlineWidth} onChange={(v) => update({ outlineWidth: v })} min={0.5} max={10} step={0.5} className="h-7 text-xs w-20" /></SettingRow>
            </>
          )}
          <SettingRow label="Manual plot width"><Switch checked={rb.manualPlotWidth} onCheckedChange={(v) => update({ manualPlotWidth: v })} /></SettingRow>
          {rb.manualPlotWidth && <SettingRow label="Plot width"><NumberInput value={rb.manualPlotWidthValue} onChange={(v) => update({ manualPlotWidthValue: v })} min={100} max={2000} className="h-7 text-xs w-20" /></SettingRow>}
          <button onClick={() => setShowOverrides(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 mt-1"><Settings2 className="w-3.5 h-3.5" />Per-segment overrides…</button>
        </>
      )}

      {/* ── Images ── */}
      <SubHeader open={open.images} onToggle={() => toggle('images')}>Images</SubHeader>
      {open.images && (
        <>
          <SettingRow label="Left image"><Switch checked={rb.leftImage.show} onCheckedChange={(v) => update({ leftImage: { ...rb.leftImage, show: v } })} /></SettingRow>
          {rb.leftImage.show && (
            <div className="pl-2 border-l-2 border-gray-100 space-y-1.5">
              <ImageUploader value={rb.leftImage.url} onChange={(u) => update({ leftImage: { ...rb.leftImage, url: u } })} />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Width" value={rb.leftImage.width} onChange={(v) => update({ leftImage: { ...rb.leftImage, width: v } })} min={10} max={300} suffix="px" />
                <NumberInput label="Height" value={rb.leftImage.height} onChange={(v) => update({ leftImage: { ...rb.leftImage, height: v } })} min={10} max={300} suffix="px" />
                <NumberInput label="Radius" value={rb.leftImage.borderRadius} onChange={(v) => update({ leftImage: { ...rb.leftImage, borderRadius: v } })} min={0} max={150} suffix="px" />
                <NumberInput label="Padding X" value={rb.leftImage.paddingX} onChange={(v) => update({ leftImage: { ...rb.leftImage, paddingX: v } })} min={0} max={100} suffix="px" />
              </div>
            </div>
          )}
          <SettingRow label="Right image"><Switch checked={rb.rightImage.show} onCheckedChange={(v) => update({ rightImage: { ...rb.rightImage, show: v } })} /></SettingRow>
          {rb.rightImage.show && (
            <div className="pl-2 border-l-2 border-gray-100 space-y-1.5">
              <ImageUploader value={rb.rightImage.url} onChange={(u) => update({ rightImage: { ...rb.rightImage, url: u } })} />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Width" value={rb.rightImage.width} onChange={(v) => update({ rightImage: { ...rb.rightImage, width: v } })} min={10} max={300} suffix="px" />
                <NumberInput label="Height" value={rb.rightImage.height} onChange={(v) => update({ rightImage: { ...rb.rightImage, height: v } })} min={10} max={300} suffix="px" />
                <NumberInput label="Radius" value={rb.rightImage.borderRadius} onChange={(v) => update({ rightImage: { ...rb.rightImage, borderRadius: v } })} min={0} max={150} suffix="px" />
                <NumberInput label="Padding X" value={rb.rightImage.paddingX} onChange={(v) => update({ rightImage: { ...rb.rightImage, paddingX: v } })} min={0} max={100} suffix="px" />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Names ── */}
      <SubHeader open={open.names} onToggle={() => toggle('names')}>Names</SubHeader>
      {open.names && (
        <>
          <SettingRow label="Position"><Select value={rb.namePosition} onValueChange={(v) => update({ namePosition: v as ResultNamePosition })}><SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{namePosOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
          <SettingRow label="Color"><Select value={rb.nameColorMode} onValueChange={(v) => update({ nameColorMode: v as 'match' | 'custom' })}><SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="match" className="text-xs">Match segment</SelectItem><SelectItem value="custom" className="text-xs">Custom</SelectItem></SelectContent></Select></SettingRow>
          <FontRow family={rb.nameFontFamily} weight={rb.nameFontWeight} size={rb.nameFontSize} color={rb.nameColor} onChange={(u) => update({ nameFontFamily: u.family ?? rb.nameFontFamily, nameFontWeight: u.weight ?? rb.nameFontWeight, nameFontSize: u.size ?? rb.nameFontSize, nameColor: u.color ?? rb.nameColor })} />
          <SettingRow label="Gap above"><NumberInput value={rb.nameGap} onChange={(v) => update({ nameGap: v })} min={0} max={40} className="h-7 text-xs w-20" /></SettingRow>
        </>
      )}

      {/* ── Values ── */}
      <SubHeader open={open.values} onToggle={() => toggle('values')}>Values</SubHeader>
      {open.values && (
        <>
          <SettingRow label="Position"><Select value={rb.valuePosition} onValueChange={(v) => update({ valuePosition: v as ResultValuePosition })}><SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{valuePosOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
          <SettingRow label="Align to edges"><Switch checked={rb.valueAlignEdges} onCheckedChange={(v) => update({ valueAlignEdges: v })} /></SettingRow>
          <SettingRow label="Color"><Select value={rb.valueColorMode} onValueChange={(v) => update({ valueColorMode: v as 'auto' | 'custom' })}><SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto" className="text-xs">Auto (contrast)</SelectItem><SelectItem value="custom" className="text-xs">Custom</SelectItem></SelectContent></Select></SettingRow>
          <FontRow family={rb.valueFontFamily} weight={rb.valueFontWeight} size={rb.valueFontSize} color={rb.valueColor} onChange={(u) => update({ valueFontFamily: u.family ?? rb.valueFontFamily, valueFontWeight: u.weight ?? rb.valueFontWeight, valueFontSize: u.size ?? rb.valueFontSize, valueColor: u.color ?? rb.valueColor })} />
          <SettingRow label="Padding X"><NumberInput value={rb.valuePaddingX} onChange={(v) => update({ valuePaddingX: v })} min={0} max={80} className="h-7 text-xs w-20" /></SettingRow>
          <SettingRow label="Prefix"><Switch checked={rb.prefixShow} onCheckedChange={(v) => update({ prefixShow: v })} /></SettingRow>
          {rb.prefixShow && (
            <div className="grid grid-cols-3 gap-1 pl-2 border-l-2 border-gray-100">
              <Input value={rb.prefixText} onChange={(e) => update({ prefixText: e.target.value })} className="h-7 text-xs" />
              <Select value={rb.prefixPosition} onValueChange={(v) => update({ prefixPosition: v as 'left' | 'right' })}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left" className="text-xs">Left</SelectItem><SelectItem value="right" className="text-xs">Right</SelectItem></SelectContent></Select>
              <div className="flex items-center gap-0.5"><NumberInput value={rb.prefixFontSize} onChange={(v) => update({ prefixFontSize: v })} min={6} max={80} className="h-7 text-[10px] w-full" /><span className="text-[9px] text-gray-400">px</span></div>
            </div>
          )}
          <div className="text-[10px] font-medium text-gray-500 mt-1">Number format</div>
          <NumberFormatEditor fmt={rb.numberFormat} onChange={(u) => update({ numberFormat: { ...rb.numberFormat, ...u } })} />
        </>
      )}

      {/* ── Below values ── */}
      <SubHeader open={open.below} onToggle={() => toggle('below')}>Below values (overflow)</SubHeader>
      {open.below && (
        <>
          <SettingRow label="Line color"><ColorPicker value={rb.belowLineColor} onChange={(c) => update({ belowLineColor: c })} /></SettingRow>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Line width" value={rb.belowLineWidth} onChange={(v) => update({ belowLineWidth: v })} min={0.5} max={6} step={0.5} suffix="px" />
            <NumberInput label="Line length" value={rb.belowLineLength} onChange={(v) => update({ belowLineLength: v })} min={0} max={60} suffix="px" />
            <NumberInput label="Gap" value={rb.belowGap} onChange={(v) => update({ belowGap: v })} min={0} max={40} suffix="px" />
            <NumberInput label="Font size" value={rb.belowFontSize} onChange={(v) => update({ belowFontSize: v })} min={6} max={60} suffix="px" />
          </div>
          <SettingRow label="Font weight"><Select value={rb.belowFontWeight} onValueChange={(v) => update({ belowFontWeight: v as FontWeight })}><SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
          <SettingRow label="Color"><Select value={rb.belowColorMode} onValueChange={(v) => update({ belowColorMode: v as 'match' | 'custom' })}><SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="match" className="text-xs">Match segment</SelectItem><SelectItem value="custom" className="text-xs">Custom</SelectItem></SelectContent></Select></SettingRow>
          {rb.belowColorMode === 'custom' && <SettingRow label="Custom color"><ColorPicker value={rb.belowColor} onChange={(c) => update({ belowColor: c })} /></SettingRow>}
          <div className="text-[10px] font-medium text-gray-500 mt-1">Number format</div>
          <NumberFormatEditor fmt={rb.belowNumberFormat} onChange={(u) => update({ belowNumberFormat: { ...rb.belowNumberFormat, ...u } })} />
        </>
      )}

      {/* ── Legend ── */}
      <SubHeader open={open.legend} onToggle={() => toggle('legend')}>Legend (overflow names)</SubHeader>
      {open.legend && (
        <>
          <SettingRow label="Align"><Select value={rb.legendAlign} onValueChange={(v) => update({ legendAlign: v as 'left' | 'center' | 'right' })}><SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left" className="text-xs">Left</SelectItem><SelectItem value="center" className="text-xs">Center</SelectItem><SelectItem value="right" className="text-xs">Right</SelectItem></SelectContent></Select></SettingRow>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Dot size" value={rb.legendDotSize} onChange={(v) => update({ legendDotSize: v })} min={4} max={24} suffix="px" />
            <NumberInput label="Font size" value={rb.legendFontSize} onChange={(v) => update({ legendFontSize: v })} min={6} max={40} suffix="px" />
            <NumberInput label="Gap" value={rb.legendGap} onChange={(v) => update({ legendGap: v })} min={0} max={40} suffix="px" />
          </div>
          <SettingRow label="Font weight"><Select value={rb.legendFontWeight} onValueChange={(v) => update({ legendFontWeight: v as FontWeight })}><SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
          <SettingRow label="Color"><ColorPicker value={rb.legendColor} onChange={(c) => update({ legendColor: c })} /></SettingRow>
        </>
      )}

      {/* ── Difference bar ── */}
      <SubHeader open={open.diff} onToggle={() => toggle('diff')}>Difference Bar</SubHeader>
      {open.diff && (
        <>
          <SettingRow label="Show"><Switch checked={rb.diffShow} onCheckedChange={(v) => update({ diffShow: v })} /></SettingRow>
          {rb.diffShow && (
            <>
              <SettingRow label="Value source"><Select value={rb.diffSource} onValueChange={(v) => update({ diffSource: v as 'info' | 'auto' })}><SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info" className="text-xs">Info column</SelectItem><SelectItem value="auto" className="text-xs">Auto (leader − next)</SelectItem></SelectContent></Select></SettingRow>
              <SettingRow label="Template"><Input value={rb.diffTemplate} onChange={(e) => update({ diffTemplate: e.target.value })} className="h-7 text-xs w-full" /></SettingRow>
              <div className="text-[10px] text-gray-400 -mt-1">Placeholders: {'{leader} {trailer} {value}'}</div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Height" value={rb.diffHeight} onChange={(v) => update({ diffHeight: v })} min={10} max={120} suffix="px" />
                <NumberInput label="Margin top" value={rb.diffMarginTop} onChange={(v) => update({ diffMarginTop: v })} min={0} max={80} suffix="px" />
                <NumberInput label="Corner radius" value={rb.diffCornerRadius} onChange={(v) => update({ diffCornerRadius: v })} min={0} max={60} suffix="px" />
                <NumberInput label="Font size" value={rb.diffFontSize} onChange={(v) => update({ diffFontSize: v })} min={8} max={80} suffix="px" />
              </div>
              <SettingRow label="Background"><ColorPicker value={rb.diffBackgroundColor} onChange={(c) => update({ diffBackgroundColor: c })} /></SettingRow>
              <SettingRow label="Align"><Select value={rb.diffAlign} onValueChange={(v) => update({ diffAlign: v as 'left' | 'center' | 'right' })}><SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left" className="text-xs">Left</SelectItem><SelectItem value="center" className="text-xs">Center</SelectItem><SelectItem value="right" className="text-xs">Right</SelectItem></SelectContent></Select></SettingRow>
              <SettingRow label="Match leader color"><Switch checked={rb.diffMatchLeaderColor} onCheckedChange={(v) => update({ diffMatchLeaderColor: v })} /></SettingRow>
              {!rb.diffMatchLeaderColor && <SettingRow label="Text color"><ColorPicker value={rb.diffColor} onChange={(c) => update({ diffColor: c })} /></SettingRow>}
              <SettingRow label="Font weight"><Select value={rb.diffFontWeight} onValueChange={(v) => update({ diffFontWeight: v as FontWeight })}><SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger><SelectContent>{fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent></Select></SettingRow>
              <div className="text-[10px] font-medium text-gray-500 mt-1">Number format</div>
              <NumberFormatEditor fmt={rb.diffNumberFormat} onChange={(u) => update({ diffNumberFormat: { ...rb.diffNumberFormat, ...u } })} />
            </>
          )}
        </>
      )}

      {/* ── Per-segment overrides modal ── */}
      <Dialog open={showOverrides} onOpenChange={setShowOverrides}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-segment overrides</DialogTitle>
            <DialogDescription>Override the name, color and label positions for each segment.</DialogDescription>
          </DialogHeader>
          {segmentNames.length === 0 && <div className="text-xs text-gray-400">Map value columns (series) first.</div>}
          {segmentNames.map((name) => {
            const o = rb.perSegment?.[name] || {};
            const setO = (u: Partial<typeof o>) => update({ perSegment: { ...rb.perSegment, [name]: { ...o, ...u } } });
            return (
              <div key={name} className="border rounded p-2 mb-2 space-y-1.5">
                <div className="text-xs font-semibold truncate">{name}</div>
                <SettingRow label="Display name"><Input value={o.name ?? ''} onChange={(e) => setO({ name: e.target.value || undefined })} placeholder={name} className="h-7 text-xs w-40" /></SettingRow>
                <SettingRow label="Color"><ColorPicker value={o.color || '#cccccc'} onChange={(c) => setO({ color: c })} /></SettingRow>
                <SettingRow label="Value position"><Select value={o.valuePosition || 'auto'} onValueChange={(v) => setO({ valuePosition: v as ResultValuePosition })}><SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger><SelectContent>{valuePosOptions.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}</SelectContent></Select></SettingRow>
                <SettingRow label="Name position"><Select value={o.namePosition || 'auto'} onValueChange={(v) => setO({ namePosition: v as ResultNamePosition })}><SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger><SelectContent>{namePosOptions.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}</SelectContent></Select></SettingRow>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>
    </AccordionSection>
  );
}
