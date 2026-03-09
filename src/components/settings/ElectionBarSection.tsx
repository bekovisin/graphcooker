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
  ElectionBarSettings,
  ElectionPerRowTextStyle,
  ElectionPerRowNumberFormat,
  ElectionSegmentAlign,
  ElectionLabelPosition,
  FontWeight,
  ThousandsSeparator,
  DecimalSeparator,
} from '@/types/chart';

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

const fontWeightOptions: { value: FontWeight; label: string }[] = [
  { value: '100', label: '100' },
  { value: '200', label: '200' },
  { value: '300', label: '300' },
  { value: 'normal', label: 'Normal' },
  { value: '500', label: '500' },
  { value: '600', label: '600' },
  { value: 'bold', label: 'Bold' },
  { value: '800', label: '800' },
  { value: '900', label: '900' },
];

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';

// ─── Sub-components ──────────────────────────────────────────────────

function SubHeader({
  children,
  collapsible,
  open,
  onToggle,
}: {
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  if (!collapsible) {
    return <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1 border-b border-gray-200 pb-1">{children}</div>;
  }
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1 border-b border-gray-200 pb-1 w-full text-left"
      onClick={onToggle}
    >
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {children}
    </button>
  );
}

function ImageUploader({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  return (
    <div className="space-y-1">
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={compact ? 'h-8 rounded' : 'h-12 rounded'} />
          <button
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
            onClick={() => onChange('')}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          } ${compact ? 'p-1' : 'p-2'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <ImageIcon className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] text-gray-400">Upload</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <Input
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Image URL"
        className="h-7 text-xs"
      />
    </div>
  );
}

function TextStyleEditor({
  style,
  onChange,
  label,
}: {
  style: Partial<ElectionPerRowTextStyle>;
  onChange: (updates: Partial<ElectionPerRowTextStyle>) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
      <div className="text-[10px] font-medium text-gray-500">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        <Select value={style.fontFamily || ''} onValueChange={(v) => onChange({ fontFamily: v })}>
          <SelectTrigger className="h-7 text-[10px] col-span-3"><SelectValue placeholder="Font" /></SelectTrigger>
          <SelectContent>
            {fontFamilyOptions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(',')[0]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={style.fontWeight || ''} onValueChange={(v) => onChange({ fontWeight: v as FontWeight })}>
          <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Wt" /></SelectTrigger>
          <SelectContent>
            {fontWeightOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-0.5">
          <NumberInput value={style.fontSize ?? 12} onChange={(v) => onChange({ fontSize: v })} min={6} max={120} className="h-7 text-[10px] w-full" />
          <span className="text-[9px] text-gray-400">px</span>
        </div>
        <ColorPicker value={style.color || '#333333'} onChange={(c) => onChange({ color: c })} />
      </div>
      <SettingRow label="Letter spacing">
        <NumberInput value={style.letterSpacing ?? 0} onChange={(v) => onChange({ letterSpacing: v })} min={-10} max={30} step={0.1} className="h-7 text-xs w-20" />
      </SettingRow>
    </div>
  );
}

function NumberFormatEditor({
  fmt,
  onChange,
}: {
  fmt: Partial<ElectionPerRowNumberFormat>;
  onChange: (updates: Partial<ElectionPerRowNumberFormat>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <SettingRow label="Decimals">
        <NumberInput value={fmt.decimalPlaces ?? 0} onChange={(v) => onChange({ decimalPlaces: v })} min={0} max={10} className="h-7 text-xs w-16" />
      </SettingRow>
      <SettingRow label="Thousands sep.">
        <Select value={fmt.thousandsSeparator || ','} onValueChange={(v) => onChange({ thousandsSeparator: v as ThousandsSeparator })}>
          <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="," className="text-xs">Comma (,)</SelectItem>
            <SelectItem value="." className="text-xs">Dot (.)</SelectItem>
            <SelectItem value=" " className="text-xs">Space</SelectItem>
            <SelectItem value="none" className="text-xs">None</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Decimal sep.">
        <Select value={fmt.decimalSeparator || '.'} onValueChange={(v) => onChange({ decimalSeparator: v as DecimalSeparator })}>
          <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="." className="text-xs">Dot (.)</SelectItem>
            <SelectItem value="," className="text-xs">Comma (,)</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Prefix">
        <Input value={fmt.prefix || ''} onChange={(e) => onChange({ prefix: e.target.value })} className="h-7 text-xs w-16" />
      </SettingRow>
      <SettingRow label="Suffix">
        <Input value={fmt.suffix || ''} onChange={(e) => onChange({ suffix: e.target.value })} className="h-7 text-xs w-16" />
      </SettingRow>
      <SettingRow label="Trailing zeros">
        <Switch checked={fmt.showTrailingZeros ?? true} onCheckedChange={(v) => onChange({ showTrailingZeros: v })} />
      </SettingRow>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function ElectionBarSection() {
  const eb = useEditorStore((s) => s.settings.electionBar);
  const data = useEditorStore((s) => s.data);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const [showDpDialog, setShowDpDialog] = useState(false);
  const [showPrefixDialog, setShowPrefixDialog] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showNfDialog, setShowNfDialog] = useState(false);
  const [showInfoNfDialog, setShowInfoNfDialog] = useState(false);
  const [showLeftImgDialog, setShowLeftImgDialog] = useState(false);
  const [showRightImgDialog, setShowRightImgDialog] = useState(false);
  // Legend dialog not needed — toggles are inline

  // Collapsible sub-sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bar: true,
    dataPoints: true,
    prefix: false,
    labels: false,
    info: false,
    nf: false,
    images: false,
    legend: false,
  });
  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const update = (updates: Partial<ElectionBarSettings>) => {
    updateSettings('electionBar', updates);
  };

  // Row labels from data
  const rowLabels = useMemo(() => {
    const col = columnMapping.labels || '';
    if (!col) return [];
    return data.map((r) => String(r[col] ?? '')).filter(Boolean);
  }, [data, columnMapping]);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <AccordionSection id="election-bar" title="Election bar" defaultOpen>

      {/* ── Bar Layout ── */}
      <SubHeader collapsible open={openSections.bar} onToggle={() => toggleSection('bar')}>Bar Layout</SubHeader>
      {openSections.bar && (
        <>
          <SettingRow label="Bar height">
            <NumberInput value={eb.barHeight} onChange={(v) => update({ barHeight: v })} min={10} max={200} className="h-7 text-xs w-20" />
          </SettingRow>
          <SettingRow label="Segment spacing">
            <NumberInput value={eb.spacingBetweenSegments} onChange={(v) => update({ spacingBetweenSegments: v })} min={0} max={20} className="h-7 text-xs w-20" />
          </SettingRow>
          <SettingRow label="Bar opacity">
            <NumberInput value={eb.barOpacity} onChange={(v) => update({ barOpacity: v })} min={0} max={1} step={0.05} className="h-7 text-xs w-20" />
          </SettingRow>
          <SettingRow label="Outline">
            <Switch checked={eb.outline} onCheckedChange={(v) => update({ outline: v })} />
          </SettingRow>
          {eb.outline && (
            <>
              <SettingRow label="Outline color">
                <ColorPicker value={eb.outlineColor} onChange={(c) => update({ outlineColor: c })} />
              </SettingRow>
              <SettingRow label="Outline width">
                <NumberInput value={eb.outlineWidth} onChange={(v) => update({ outlineWidth: v })} min={0.5} max={10} step={0.5} className="h-7 text-xs w-20" />
              </SettingRow>
            </>
          )}
          <SettingRow label="Manual plot width">
            <Switch checked={eb.manualPlotWidth} onCheckedChange={(v) => update({ manualPlotWidth: v })} />
          </SettingRow>
          {eb.manualPlotWidth && (
            <SettingRow label="Plot width (px)">
              <NumberInput value={eb.manualPlotWidthValue} onChange={(v) => update({ manualPlotWidthValue: v })} min={100} max={2000} className="h-7 text-xs w-20" />
            </SettingRow>
          )}
        </>
      )}

      {/* ── Data Points ── */}
      <SubHeader collapsible open={openSections.dataPoints} onToggle={() => toggleSection('dataPoints')}>Data Points</SubHeader>
      {openSections.dataPoints && (
        <>
          <SettingRow label="Show data points">
            <Switch checked={eb.showDataPoints} onCheckedChange={(v) => update({ showDataPoints: v })} />
          </SettingRow>
          {eb.showDataPoints && (
            <>
              <TextStyleEditor
                label="Default style"
                style={eb.defaultDataPointStyle}
                onChange={(updates) => update({ defaultDataPointStyle: { ...eb.defaultDataPointStyle, ...updates } })}
              />
              <div className="grid grid-cols-2 gap-1 mt-1">
                <SettingRow label="Pad T"><NumberInput value={eb.dataPointPaddingTop} onChange={(v) => update({ dataPointPaddingTop: v })} min={0} max={50} className="h-7 text-xs w-14" /></SettingRow>
                <SettingRow label="Pad R"><NumberInput value={eb.dataPointPaddingRight} onChange={(v) => update({ dataPointPaddingRight: v })} min={0} max={50} className="h-7 text-xs w-14" /></SettingRow>
                <SettingRow label="Pad B"><NumberInput value={eb.dataPointPaddingBottom} onChange={(v) => update({ dataPointPaddingBottom: v })} min={0} max={50} className="h-7 text-xs w-14" /></SettingRow>
                <SettingRow label="Pad L"><NumberInput value={eb.dataPointPaddingLeft} onChange={(v) => update({ dataPointPaddingLeft: v })} min={0} max={50} className="h-7 text-xs w-14" /></SettingRow>
              </div>
              <button
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                onClick={() => setShowDpDialog(true)}
              >
                <Settings2 className="w-3 h-3" /> Per-row data point settings
              </button>
            </>
          )}
        </>
      )}

      {/* ── Prefix ── */}
      <SubHeader collapsible open={openSections.prefix} onToggle={() => toggleSection('prefix')}>Prefix</SubHeader>
      {openSections.prefix && (
        <>
          <SettingRow label="Show prefix">
            <Switch checked={eb.defaultPrefix.show} onCheckedChange={(v) => update({ defaultPrefix: { ...eb.defaultPrefix, show: v } })} />
          </SettingRow>
          {eb.defaultPrefix.show && (
            <>
              <SettingRow label="Text">
                <Input value={eb.defaultPrefix.text} onChange={(e) => update({ defaultPrefix: { ...eb.defaultPrefix, text: e.target.value } })} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Position">
                <Select value={eb.defaultPrefix.position} onValueChange={(v) => update({ defaultPrefix: { ...eb.defaultPrefix, position: v as 'left' | 'right' } })}>
                  <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left" className="text-xs">Left</SelectItem>
                    <SelectItem value="right" className="text-xs">Right</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Font size">
                <NumberInput value={eb.defaultPrefix.fontSize} onChange={(v) => update({ defaultPrefix: { ...eb.defaultPrefix, fontSize: v } })} min={6} max={60} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Color">
                <ColorPicker value={eb.defaultPrefix.color} onChange={(c) => update({ defaultPrefix: { ...eb.defaultPrefix, color: c } })} />
              </SettingRow>
              <SettingRow label="Vertical align">
                <Select value={eb.defaultPrefix.verticalAlign} onValueChange={(v) => update({ defaultPrefix: { ...eb.defaultPrefix, verticalAlign: v as 'top' | 'center' | 'bottom' } })}>
                  <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top" className="text-xs">Top</SelectItem>
                    <SelectItem value="center" className="text-xs">Center</SelectItem>
                    <SelectItem value="bottom" className="text-xs">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowPrefixDialog(true)}>
                <Settings2 className="w-3 h-3" /> Per-row prefix settings
              </button>
            </>
          )}
        </>
      )}

      {/* ── Segment Labels ── */}
      <SubHeader collapsible open={openSections.labels} onToggle={() => toggleSection('labels')}>Segment Labels</SubHeader>
      {openSections.labels && (
        <>
          <SettingRow label="Default position">
            <Select value={eb.defaultLabelPosition} onValueChange={(v) => update({ defaultLabelPosition: v as ElectionLabelPosition })}>
              <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above_bar" className="text-xs">Above bar</SelectItem>
                <SelectItem value="below_bar" className="text-xs">Below bar</SelectItem>
                <SelectItem value="hidden" className="text-xs">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Default align">
            <Select value={eb.defaultLabelAlign} onValueChange={(v) => update({ defaultLabelAlign: v as 'left' | 'center' | 'right' })}>
              <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left" className="text-xs">Left</SelectItem>
                <SelectItem value="center" className="text-xs">Center</SelectItem>
                <SelectItem value="right" className="text-xs">Right</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <TextStyleEditor
            label="Default label style"
            style={eb.defaultLabelStyle}
            onChange={(updates) => update({ defaultLabelStyle: { ...eb.defaultLabelStyle, ...updates } })}
          />
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowLabelDialog(true)}>
            <Settings2 className="w-3 h-3" /> Per-row label settings
          </button>
        </>
      )}

      {/* ── Data Points Info ── */}
      <SubHeader collapsible open={openSections.info} onToggle={() => toggleSection('info')}>Data Points Info</SubHeader>
      {openSections.info && (
        <>
          <SettingRow label="Show info">
            <Switch checked={eb.showDataPointsInfo} onCheckedChange={(v) => update({ showDataPointsInfo: v })} />
          </SettingRow>
          {eb.showDataPointsInfo && (
            <>
              <SettingRow label="Info padding top">
                <NumberInput value={eb.infoPaddingTop} onChange={(v) => update({ infoPaddingTop: v })} min={0} max={30} className="h-7 text-xs w-16" />
              </SettingRow>
              <TextStyleEditor
                label="Default info style"
                style={eb.defaultInfoStyle}
                onChange={(updates) => update({ defaultInfoStyle: { ...eb.defaultInfoStyle, ...updates } })}
              />
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowInfoDialog(true)}>
                <Settings2 className="w-3 h-3" /> Per-row info visibility & style
              </button>
            </>
          )}
        </>
      )}

      {/* ── Number Formatting ── */}
      <SubHeader collapsible open={openSections.nf} onToggle={() => toggleSection('nf')}>Number Formatting</SubHeader>
      {openSections.nf && (
        <>
          <div className="text-[10px] font-medium text-gray-500 mt-1">Data Points</div>
          <NumberFormatEditor
            fmt={eb.defaultNumberFormat}
            onChange={(updates) => update({ defaultNumberFormat: { ...eb.defaultNumberFormat, ...updates } })}
          />
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowNfDialog(true)}>
            <Settings2 className="w-3 h-3" /> Per-row data point number format
          </button>
          {eb.showDataPointsInfo && (
            <>
              <div className="text-[10px] font-medium text-gray-500 mt-2">Info Number Format</div>
              <NumberFormatEditor
                fmt={eb.defaultInfoNumberFormat}
                onChange={(updates) => update({ defaultInfoNumberFormat: { ...eb.defaultInfoNumberFormat, ...updates } })}
              />
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowInfoNfDialog(true)}>
                <Settings2 className="w-3 h-3" /> Per-row info number format
              </button>
            </>
          )}
        </>
      )}

      {/* ── Images ── */}
      <SubHeader collapsible open={openSections.images} onToggle={() => toggleSection('images')}>Images</SubHeader>
      {openSections.images && (
        <>
          <SettingRow label="Show left images">
            <Switch checked={eb.leftImage.show} onCheckedChange={(v) => update({ leftImage: { ...eb.leftImage, show: v } })} />
          </SettingRow>
          {eb.leftImage.show && (
            <>
              <SettingRow label="Default width">
                <NumberInput value={eb.leftImage.defaultSettings.width} onChange={(v) => update({ leftImage: { ...eb.leftImage, defaultSettings: { ...eb.leftImage.defaultSettings, width: v } } })} min={10} max={200} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Default height">
                <NumberInput value={eb.leftImage.defaultSettings.height} onChange={(v) => update({ leftImage: { ...eb.leftImage, defaultSettings: { ...eb.leftImage.defaultSettings, height: v } } })} min={10} max={200} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Border radius">
                <NumberInput value={eb.leftImage.defaultSettings.borderRadius} onChange={(v) => update({ leftImage: { ...eb.leftImage, defaultSettings: { ...eb.leftImage.defaultSettings, borderRadius: v } } })} min={0} max={100} className="h-7 text-xs w-16" />
              </SettingRow>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowLeftImgDialog(true)}>
                <Settings2 className="w-3 h-3" /> Per-row left image settings
              </button>
            </>
          )}
          <SettingRow label="Show right images">
            <Switch checked={eb.rightImage.show} onCheckedChange={(v) => update({ rightImage: { ...eb.rightImage, show: v } })} />
          </SettingRow>
          {eb.rightImage.show && (
            <>
              <SettingRow label="Default width">
                <NumberInput value={eb.rightImage.defaultSettings.width} onChange={(v) => update({ rightImage: { ...eb.rightImage, defaultSettings: { ...eb.rightImage.defaultSettings, width: v } } })} min={10} max={200} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Default height">
                <NumberInput value={eb.rightImage.defaultSettings.height} onChange={(v) => update({ rightImage: { ...eb.rightImage, defaultSettings: { ...eb.rightImage.defaultSettings, height: v } } })} min={10} max={200} className="h-7 text-xs w-16" />
              </SettingRow>
              <SettingRow label="Border radius">
                <NumberInput value={eb.rightImage.defaultSettings.borderRadius} onChange={(v) => update({ rightImage: { ...eb.rightImage, defaultSettings: { ...eb.rightImage.defaultSettings, borderRadius: v } } })} min={0} max={100} className="h-7 text-xs w-16" />
              </SettingRow>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1" onClick={() => setShowRightImgDialog(true)}>
                <Settings2 className="w-3 h-3" /> Per-row right image settings
              </button>
            </>
          )}
        </>
      )}

      {/* ── Legend Rows ── */}
      <SubHeader collapsible open={openSections.legend} onToggle={() => toggleSection('legend')}>Legend Rows</SubHeader>
      {openSections.legend && (
        <>
          <div className="text-[10px] text-gray-500 mb-1">Toggle which rows appear in legend</div>
          {rowLabels.map((label) => (
            <SettingRow key={label} label={label}>
              <Switch
                checked={eb.legendVisibleRows[label] !== false}
                onCheckedChange={(v) => update({ legendVisibleRows: { ...eb.legendVisibleRows, [label]: v } })}
              />
            </SettingRow>
          ))}
        </>
      )}

      {/* ─────────────────────────────────── DIALOGS ──────────────────────────────── */}

      {/* Data Points Per-Row Dialog */}
      <Dialog open={showDpDialog} onOpenChange={setShowDpDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Data Point Settings</DialogTitle>
            <DialogDescription>Configure data point style and alignment for each row.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const rowStyle = eb.perRowDataPointStyles[label] || {};
            const rowAlign = eb.perRowDataPointAlign[label] || 'center';
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Alignment">
                  <Select
                    value={rowAlign}
                    onValueChange={(v) => update({ perRowDataPointAlign: { ...eb.perRowDataPointAlign, [label]: v as ElectionSegmentAlign } })}
                  >
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left" className="text-xs">Left</SelectItem>
                      <SelectItem value="center" className="text-xs">Center</SelectItem>
                      <SelectItem value="right" className="text-xs">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <TextStyleEditor
                  label="Style override"
                  style={rowStyle}
                  onChange={(updates) => update({ perRowDataPointStyles: { ...eb.perRowDataPointStyles, [label]: { ...rowStyle, ...updates } } })}
                />
                <SettingRow label="Custom padding">
                  <div className="grid grid-cols-4 gap-1">
                    {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                      <NumberInput
                        key={side}
                        value={eb.perRowDataPointPadding[label]?.[side] ?? (side === 'top' ? eb.dataPointPaddingTop : side === 'right' ? eb.dataPointPaddingRight : side === 'bottom' ? eb.dataPointPaddingBottom : eb.dataPointPaddingLeft)}
                        onChange={(v) => {
                          const cur = eb.perRowDataPointPadding[label] || { top: eb.dataPointPaddingTop, right: eb.dataPointPaddingRight, bottom: eb.dataPointPaddingBottom, left: eb.dataPointPaddingLeft };
                          update({ perRowDataPointPadding: { ...eb.perRowDataPointPadding, [label]: { ...cur, [side]: v } } });
                        }}
                        min={0}
                        max={50}
                        className="h-6 text-[10px] w-full"
                      />
                    ))}
                  </div>
                </SettingRow>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Prefix Per-Row Dialog */}
      <Dialog open={showPrefixDialog} onOpenChange={setShowPrefixDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Prefix Settings</DialogTitle>
            <DialogDescription>Configure prefix for each row independently.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const rowPfx = eb.perRowPrefixSettings[label] || {};
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Show">
                  <Switch checked={rowPfx.show ?? eb.defaultPrefix.show} onCheckedChange={(v) => update({ perRowPrefixSettings: { ...eb.perRowPrefixSettings, [label]: { ...rowPfx, show: v } } })} />
                </SettingRow>
                <SettingRow label="Text">
                  <Input value={rowPfx.text ?? eb.defaultPrefix.text} onChange={(e) => update({ perRowPrefixSettings: { ...eb.perRowPrefixSettings, [label]: { ...rowPfx, text: e.target.value } } })} className="h-7 text-xs w-16" />
                </SettingRow>
                <SettingRow label="Position">
                  <Select value={rowPfx.position ?? eb.defaultPrefix.position} onValueChange={(v) => update({ perRowPrefixSettings: { ...eb.perRowPrefixSettings, [label]: { ...rowPfx, position: v as 'left' | 'right' } } })}>
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left" className="text-xs">Left</SelectItem>
                      <SelectItem value="right" className="text-xs">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Font size">
                  <NumberInput value={rowPfx.fontSize ?? eb.defaultPrefix.fontSize} onChange={(v) => update({ perRowPrefixSettings: { ...eb.perRowPrefixSettings, [label]: { ...rowPfx, fontSize: v } } })} min={6} max={60} className="h-7 text-xs w-16" />
                </SettingRow>
                <SettingRow label="Color">
                  <ColorPicker value={rowPfx.color ?? eb.defaultPrefix.color} onChange={(c) => update({ perRowPrefixSettings: { ...eb.perRowPrefixSettings, [label]: { ...rowPfx, color: c } } })} />
                </SettingRow>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Label Per-Row Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Label Settings</DialogTitle>
            <DialogDescription>Configure label position, alignment and style for each row.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const rowPos = eb.perRowLabelPosition[label] || eb.defaultLabelPosition;
            const rowAlign = eb.perRowLabelAlign[label] || eb.defaultLabelAlign;
            const rowStyle = eb.perRowLabelStyles[label] || {};
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Position">
                  <Select value={rowPos} onValueChange={(v) => update({ perRowLabelPosition: { ...eb.perRowLabelPosition, [label]: v as ElectionLabelPosition } })}>
                    <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above_bar" className="text-xs">Above bar</SelectItem>
                      <SelectItem value="below_bar" className="text-xs">Below bar</SelectItem>
                      <SelectItem value="hidden" className="text-xs">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Alignment">
                  <Select value={rowAlign} onValueChange={(v) => update({ perRowLabelAlign: { ...eb.perRowLabelAlign, [label]: v as 'left' | 'center' | 'right' } })}>
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left" className="text-xs">Left</SelectItem>
                      <SelectItem value="center" className="text-xs">Center</SelectItem>
                      <SelectItem value="right" className="text-xs">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <TextStyleEditor
                  label="Style override"
                  style={rowStyle}
                  onChange={(updates) => update({ perRowLabelStyles: { ...eb.perRowLabelStyles, [label]: { ...rowStyle, ...updates } } })}
                />
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Info Per-Row Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Info Settings</DialogTitle>
            <DialogDescription>Toggle visibility and style for each row&apos;s info text.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const visible = eb.perRowInfoVisible[label] !== false;
            const rowStyle = eb.perRowInfoStyles[label] || {};
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Visible">
                  <Switch checked={visible} onCheckedChange={(v) => update({ perRowInfoVisible: { ...eb.perRowInfoVisible, [label]: v } })} />
                </SettingRow>
                {visible && (
                  <TextStyleEditor
                    label="Style override"
                    style={rowStyle}
                    onChange={(updates) => update({ perRowInfoStyles: { ...eb.perRowInfoStyles, [label]: { ...rowStyle, ...updates } } })}
                  />
                )}
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Number Format Per-Row Dialog (Data Points) */}
      <Dialog open={showNfDialog} onOpenChange={setShowNfDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Number Format (Data Points)</DialogTitle>
            <DialogDescription>Configure number formatting for each row&apos;s data point.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const rowNf = eb.perRowNumberFormat[label] || {};
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <NumberFormatEditor
                  fmt={{ ...eb.defaultNumberFormat, ...rowNf }}
                  onChange={(updates) => update({ perRowNumberFormat: { ...eb.perRowNumberFormat, [label]: { ...rowNf, ...updates } } })}
                />
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Number Format Per-Row Dialog (Info) */}
      <Dialog open={showInfoNfDialog} onOpenChange={setShowInfoNfDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Number Format (Info)</DialogTitle>
            <DialogDescription>Configure info number formatting for each row.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const rowNf = eb.perRowInfoNumberFormat[label] || {};
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <NumberFormatEditor
                  fmt={{ ...eb.defaultInfoNumberFormat, ...rowNf }}
                  onChange={(updates) => update({ perRowInfoNumberFormat: { ...eb.perRowInfoNumberFormat, [label]: { ...rowNf, ...updates } } })}
                />
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Left Image Per-Row Dialog */}
      <Dialog open={showLeftImgDialog} onOpenChange={setShowLeftImgDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Left Image</DialogTitle>
            <DialogDescription>Configure left image for each row.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const row = eb.leftImage.perRowSettings[label] || {};
            const defaults = eb.leftImage.defaultSettings;
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Show">
                  <Switch checked={row.show ?? defaults.show} onCheckedChange={(v) => update({ leftImage: { ...eb.leftImage, perRowSettings: { ...eb.leftImage.perRowSettings, [label]: { ...row, show: v } } } })} />
                </SettingRow>
                <ImageUploader
                  value={row.url ?? defaults.url}
                  onChange={(url) => update({ leftImage: { ...eb.leftImage, perRowSettings: { ...eb.leftImage.perRowSettings, [label]: { ...row, url } } } })}
                  compact
                />
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <SettingRow label="Width"><NumberInput value={row.width ?? defaults.width} onChange={(v) => update({ leftImage: { ...eb.leftImage, perRowSettings: { ...eb.leftImage.perRowSettings, [label]: { ...row, width: v } } } })} min={10} max={200} className="h-6 text-[10px] w-full" /></SettingRow>
                  <SettingRow label="Height"><NumberInput value={row.height ?? defaults.height} onChange={(v) => update({ leftImage: { ...eb.leftImage, perRowSettings: { ...eb.leftImage.perRowSettings, [label]: { ...row, height: v } } } })} min={10} max={200} className="h-6 text-[10px] w-full" /></SettingRow>
                </div>
                <SettingRow label="Border radius">
                  <NumberInput value={row.borderRadius ?? defaults.borderRadius} onChange={(v) => update({ leftImage: { ...eb.leftImage, perRowSettings: { ...eb.leftImage.perRowSettings, [label]: { ...row, borderRadius: v } } } })} min={0} max={100} className="h-7 text-xs w-16" />
                </SettingRow>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Right Image Per-Row Dialog */}
      <Dialog open={showRightImgDialog} onOpenChange={setShowRightImgDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Per-row Right Image</DialogTitle>
            <DialogDescription>Configure right image for each row.</DialogDescription>
          </DialogHeader>
          {rowLabels.map((label) => {
            const row = eb.rightImage.perRowSettings[label] || {};
            const defaults = eb.rightImage.defaultSettings;
            return (
              <div key={label} className="border rounded p-2 mb-2">
                <div className="text-xs font-semibold mb-1">{label}</div>
                <SettingRow label="Show">
                  <Switch checked={row.show ?? defaults.show} onCheckedChange={(v) => update({ rightImage: { ...eb.rightImage, perRowSettings: { ...eb.rightImage.perRowSettings, [label]: { ...row, show: v } } } })} />
                </SettingRow>
                <ImageUploader
                  value={row.url ?? defaults.url}
                  onChange={(url) => update({ rightImage: { ...eb.rightImage, perRowSettings: { ...eb.rightImage.perRowSettings, [label]: { ...row, url } } } })}
                  compact
                />
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <SettingRow label="Width"><NumberInput value={row.width ?? defaults.width} onChange={(v) => update({ rightImage: { ...eb.rightImage, perRowSettings: { ...eb.rightImage.perRowSettings, [label]: { ...row, width: v } } } })} min={10} max={200} className="h-6 text-[10px] w-full" /></SettingRow>
                  <SettingRow label="Height"><NumberInput value={row.height ?? defaults.height} onChange={(v) => update({ rightImage: { ...eb.rightImage, perRowSettings: { ...eb.rightImage.perRowSettings, [label]: { ...row, height: v } } } })} min={10} max={200} className="h-6 text-[10px] w-full" /></SettingRow>
                </div>
                <SettingRow label="Border radius">
                  <NumberInput value={row.borderRadius ?? defaults.borderRadius} onChange={(v) => update({ rightImage: { ...eb.rightImage, perRowSettings: { ...eb.rightImage.perRowSettings, [label]: { ...row, borderRadius: v } } } })} min={0} max={100} className="h-7 text-xs w-16" />
                </SettingRow>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>

    </AccordionSection>
  );
}
