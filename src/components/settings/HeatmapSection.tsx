'use client';

import { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function HeatmapSection() {
  const settings = useEditorStore((s) => s.settings.heatmap);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const seriesNames = useEditorStore((s) => s.seriesNames);

  const update = (updates: Partial<HeatmapSettings>) => updateSettings('heatmap', updates);

  const [showPerColDialog, setShowPerColDialog] = useState(false);
  const [showPerRowDialog, setShowPerRowDialog] = useState(false);

  const columns = useMemo(() => {
    const nameMap = { ...(columnMapping.seriesNames || {}), ...(seriesNames || {}) };
    return (columnMapping.values || []).filter(Boolean).map((c) => ({ key: c, label: nameMap[c] ?? c }));
  }, [columnMapping.values, columnMapping.seriesNames, seriesNames]);

  const rowLabels = useMemo(() => {
    const labelCol = columnMapping.labels;
    if (!labelCol || !data.length) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of data) {
      const name = String(row[labelCol] ?? '');
      if (name && !seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    }
    return out;
  }, [data, columnMapping.labels]);

  /** Set or clear a numeric per-series override. */
  const setOverride = (mapKey: 'perColHeaderFontSizes' | 'perColWidths' | 'perRowLabelFontSizes' | 'perRowHeights', key: string, raw: string) => {
    const next = { ...settings[mapKey] };
    if (raw === '') {
      delete next[key];
      update({ [mapKey]: next });
      return;
    }
    const v = parseInt(raw);
    if (!Number.isNaN(v)) {
      next[key] = Math.max(0, v);
      update({ [mapKey]: next });
    }
  };

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
      <SettingRow label="Show as percentage" variant="inline">
        <Switch checked={settings.showPercent} onCheckedChange={(c) => update({ showPercent: c })} />
      </SettingRow>
      {settings.showPercent && (
        <SettingRow label="Percent position">
          <Select value={settings.percentPosition} onValueChange={(v) => update({ percentPosition: v as 'left' | 'right' })}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Left (%12.3)</SelectItem>
              <SelectItem value="right" className="text-xs">Right (12.3%)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      )}
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
      <SettingRow label="Corner label">
        <Input
          value={settings.cornerLabel}
          onChange={(e) => update({ cornerLabel: e.target.value })}
          placeholder="(label column name)"
          className="h-8 text-xs"
        />
      </SettingRow>
      {columns.length > 0 && (
        <button
          onClick={() => setShowPerColDialog(true)}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Per-column header size &amp; width
        </button>
      )}
      <Dialog open={showPerColDialog} onOpenChange={setShowPerColDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Per-column overrides</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set the header font size and column width for specific columns. Leave empty for the defaults.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center gap-2 p-2 rounded-md border border-gray-100">
                <Label className="text-xs font-medium min-w-[80px] truncate">{col.label}</Label>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.perColHeaderFontSizes[col.key] ?? ''}
                      onChange={(e) => setOverride('perColHeaderFontSizes', col.key, e.target.value)}
                      placeholder={String(settings.headerFontSize)}
                      className="h-7 text-xs"
                      min={6}
                      max={48}
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">font</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.perColWidths[col.key] ?? ''}
                      onChange={(e) => setOverride('perColWidths', col.key, e.target.value)}
                      placeholder="auto"
                      className="h-7 text-xs"
                      min={0}
                      max={600}
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">px&nbsp;w</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Row labels ── */}
      <SubHeader>Row labels</SubHeader>
      <SettingRow label="Show color dots" variant="inline">
        <Switch checked={settings.showRowDots} onCheckedChange={(c) => update({ showRowDots: c })} />
      </SettingRow>
      {settings.showRowDots && (
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Dot size" value={settings.dotSize} onChange={(v) => update({ dotSize: Math.max(0, v) })} min={0} max={40} step={1} suffix="px" />
          <NumberInput label="Dot radius" value={settings.dotRadius} onChange={(v) => update({ dotRadius: Math.max(0, v) })} min={0} max={20} step={1} suffix="px" />
        </div>
      )}
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
      {rowLabels.length > 0 && (
        <button
          onClick={() => setShowPerRowDialog(true)}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Per-row label size &amp; height
        </button>
      )}
      <Dialog open={showPerRowDialog} onOpenChange={setShowPerRowDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Per-row overrides</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set the label font size and row height for specific rows. Leave empty for the defaults.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {rowLabels.map((label) => (
              <div key={label} className="flex items-center gap-2 p-2 rounded-md border border-gray-100">
                <Label className="text-xs font-medium min-w-[80px] truncate">{label}</Label>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.perRowLabelFontSizes[label] ?? ''}
                      onChange={(e) => setOverride('perRowLabelFontSizes', label, e.target.value)}
                      placeholder={String(settings.labelFontSize)}
                      className="h-7 text-xs"
                      min={6}
                      max={48}
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">font</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.perRowHeights[label] ?? ''}
                      onChange={(e) => setOverride('perRowHeights', label, e.target.value)}
                      placeholder="auto"
                      className="h-7 text-xs"
                      min={0}
                      max={400}
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">px&nbsp;h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* ── Sizing ── */}
      <SubHeader>Sizing</SubHeader>
      <SettingRow label="Mode">
        <TabMenu
          value={settings.sizingMode}
          onChange={(v) => update({ sizingMode: v })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
      </SettingRow>
      <SettingRow label="Wrap text to fit box" variant="inline">
        <Switch checked={settings.wrapText} onCheckedChange={(c) => update({ wrapText: c })} />
      </SettingRow>
      {settings.sizingMode === 'custom' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Top label height" value={settings.headerHeight} onChange={(v) => update({ headerHeight: Math.max(0, v) })} min={0} max={400} step={1} suffix="px" />
            <NumberInput label="Row height" value={settings.rowHeight} onChange={(v) => update({ rowHeight: Math.max(0, v) })} min={0} max={400} step={1} suffix="px" />
            <NumberInput label="Left label width" value={settings.labelColWidth} onChange={(v) => update({ labelColWidth: Math.max(0, v) })} min={0} max={800} step={5} suffix="px" />
            <NumberInput label="Data box width" value={settings.dataColWidth} onChange={(v) => update({ dataColWidth: Math.max(0, v) })} min={0} max={600} step={5} suffix="px" />
          </div>
          <p className="text-[10px] text-gray-400">
            0 = auto for that box. The top label (header row), left label column, and data boxes are each sized separately — width and height.
          </p>
        </>
      )}

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
      <SettingRow label="Show totals" variant="inline">
        <Switch checked={settings.showTotals} onCheckedChange={(c) => update({ showTotals: c })} />
      </SettingRow>
      {settings.showTotals && (
        <>
          <SettingRow label="Totals in">
            <TabMenu
              value={settings.totalsMode}
              onChange={(v) => update({ totalsMode: v })}
              options={[
                { value: 'column', label: 'Column' },
                { value: 'row', label: 'Row' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Total label">
            <Input value={settings.totalLabel} onChange={(e) => update({ totalLabel: e.target.value })} className="h-8 text-xs" />
          </SettingRow>
        </>
      )}

      {/* ── Outer ── */}
      <SubHeader>Container</SubHeader>
      <NumberInput label="Corner radius" value={settings.cornerRadius} onChange={(v) => update({ cornerRadius: v })} min={0} max={40} step={1} suffix="px" />
    </AccordionSection>
  );
}
