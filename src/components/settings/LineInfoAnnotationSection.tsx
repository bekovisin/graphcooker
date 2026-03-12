'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Settings2, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  LineInfoAnnotationSettings,
  LineInfoVerticalLineSettings,
  LineInfoHorizontalLineSettings,
  LineInfoTextSettings,
  LineInfoPerRowOverrides,
  AnnotationEndpointType,
  AnnotationEndpointSettings,
  AnnotationLineStyle,
  AnnotationDirection,
  AnnotationTextAlign,
  FontWeight,
  InfoDataType,
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

const endpointTypes: { value: AnnotationEndpointType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'line_arrow', label: 'Line arrow' },
  { value: 'triangle_arrow', label: 'Triangle arrow' },
  { value: 'reversed_triangle', label: 'Reversed triangle' },
  { value: 'circle_arrow', label: 'Circle arrow' },
  { value: 'diamond_arrow', label: 'Diamond arrow' },
];

/* ── Reusable sub-components ── */

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
    return (
      <div className="pt-2 pb-1">
        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {children}
        </h4>
      </div>
    );
  }
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 pt-2 pb-1 w-full text-left"
    >
      {open ? (
        <ChevronDown className="w-3 h-3 text-gray-400" />
      ) : (
        <ChevronRight className="w-3 h-3 text-gray-400" />
      )}
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
    </button>
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
    <div className="flex rounded-md border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1 text-[11px] font-medium transition-colors ${
            value === opt.value
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EndpointSettings({
  label,
  settings,
  onChange,
}: {
  label: string;
  settings: AnnotationEndpointSettings;
  onChange: (s: AnnotationEndpointSettings) => void;
}) {
  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
      <span className="text-[10px] text-gray-400 font-medium uppercase">{label}</span>
      <SettingRow label="Type">
        <Select
          value={settings.type}
          onValueChange={(v) => onChange({ ...settings, type: v as AnnotationEndpointType })}
        >
          <SelectTrigger className="h-7 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {endpointTypes.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      {settings.type !== 'none' && (
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput
            label="Size"
            value={settings.size}
            onChange={(v) => onChange({ ...settings, size: v })}
            min={2}
            max={30}
            step={1}
            suffix="px"
          />
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
            <ColorPicker
              value={settings.color}
              onChange={(color) => onChange({ ...settings, color })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LineStyleSettings({
  style,
  dotCount,
  thickness,
  color,
  onStyleChange,
  onDotCountChange,
  onThicknessChange,
  onColorChange,
}: {
  style: AnnotationLineStyle;
  dotCount: number;
  thickness: number;
  color: string;
  onStyleChange: (v: AnnotationLineStyle) => void;
  onDotCountChange: (v: number) => void;
  onThicknessChange: (v: number) => void;
  onColorChange: (v: string) => void;
}) {
  return (
    <>
      <SettingRow label="Style">
        <Select value={style} onValueChange={(v) => onStyleChange(v as AnnotationLineStyle)}>
          <SelectTrigger className="h-7 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid" className="text-xs">Solid</SelectItem>
            <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      {style === 'dotted' && (
        <NumberInput
          label="Dot count"
          value={dotCount}
          onChange={onDotCountChange}
          min={2}
          max={30}
          step={1}
        />
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <NumberInput
          label="Thickness"
          value={thickness}
          onChange={onThicknessChange}
          min={0.5}
          max={5}
          step={0.5}
          suffix="px"
        />
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
          <ColorPicker value={color} onChange={onColorChange} />
        </div>
      </div>
    </>
  );
}

/* ── Main component ── */

export function LineInfoAnnotationSection() {
  const settings = useEditorStore((s) => s.settings.lineInfoAnnotation);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);
  const valueColumns = useEditorStore((s) => s.columnMapping.values);

  const [verticalLineOpen, setVerticalLineOpen] = useState(false);
  const [horizontalLineOpen, setHorizontalLineOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [showPerRowDialog, setShowPerRowDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedRowSections, setExpandedRowSections] = useState<Record<string, Record<string, boolean>>>({});

  const rowLabels = useMemo(() => {
    if (!data.length || !labelsColumn) return [];
    return data.map((row) => String(row[labelsColumn] ?? ''));
  }, [data, labelsColumn]);

  const update = (updates: Partial<LineInfoAnnotationSettings>) => {
    updateSettings('lineInfoAnnotation', updates);
  };

  const updateVerticalLine = (updates: Partial<LineInfoVerticalLineSettings>) => {
    update({ verticalLine: { ...settings.verticalLine, ...updates } });
  };

  const updateHorizontalLine = (updates: Partial<LineInfoHorizontalLineSettings>) => {
    update({ horizontalLine: { ...settings.horizontalLine, ...updates } });
  };

  const updateText = (updates: Partial<LineInfoTextSettings>) => {
    update({ text: { ...settings.text, ...updates } });
  };

  const updatePerRow = (label: string, updates: Partial<LineInfoPerRowOverrides>) => {
    update({
      perRowOverrides: {
        ...settings.perRowOverrides,
        [label]: { ...(settings.perRowOverrides[label] || {}), ...updates },
      },
    });
  };

  // Auto-select first two series on initial enable
  useEffect(() => {
    if (settings.show && !settings.seriesA && !settings.seriesB && valueColumns.length >= 2) {
      update({ seriesA: valueColumns[0], seriesB: valueColumns[1] });
    }
  }, [settings.show, settings.seriesA, settings.seriesB, valueColumns]);

  const toggleRowSection = (label: string, section: string) => {
    setExpandedRowSections((prev) => ({
      ...prev,
      [label]: { ...(prev[label] || {}), [section]: !(prev[label]?.[section]) },
    }));
  };

  return (
    <AccordionSection id="line-info-annotation" title="Info annotation">
      <SettingRow label="Show info annotation" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
          {/* ── Series pair ── */}
          <SubHeader>Series pair</SubHeader>
          <div className="grid grid-cols-2 gap-1.5">
            <SettingRow label="Series A">
              <Select
                value={settings.seriesA}
                onValueChange={(v) => update({ seriesA: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {valueColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Series B">
              <Select
                value={settings.seriesB}
                onValueChange={(v) => update({ seriesB: v })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {valueColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>

          {/* ── Direction ── */}
          <SettingRow label="Direction">
            <TabMenu<AnnotationDirection>
              value={settings.direction}
              onChange={(v) => update({ direction: v })}
              options={[
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' },
              ]}
            />
          </SettingRow>

          {/* ── Vertical line ── */}
          <SubHeader collapsible open={verticalLineOpen} onToggle={() => setVerticalLineOpen(!verticalLineOpen)}>
            Vertical line
          </SubHeader>
          {verticalLineOpen && (
            <div className="space-y-1.5">
              <LineStyleSettings
                style={settings.verticalLine.style}
                dotCount={settings.verticalLine.dotCount}
                thickness={settings.verticalLine.thickness}
                color={settings.verticalLine.color}
                onStyleChange={(v) => updateVerticalLine({ style: v })}
                onDotCountChange={(v) => updateVerticalLine({ dotCount: v })}
                onThicknessChange={(v) => updateVerticalLine({ thickness: v })}
                onColorChange={(v) => updateVerticalLine({ color: v })}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Top padding"
                  value={settings.verticalLine.paddingTop}
                  onChange={(v) => updateVerticalLine({ paddingTop: v })}
                  min={0}
                  max={100}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="Bottom padding"
                  value={settings.verticalLine.paddingBottom}
                  onChange={(v) => updateVerticalLine({ paddingBottom: v })}
                  min={0}
                  max={100}
                  step={1}
                  suffix="px"
                />
              </div>
              <EndpointSettings
                label="Top endpoint"
                settings={settings.verticalLine.topEndpoint}
                onChange={(s) => updateVerticalLine({ topEndpoint: s })}
              />
              <EndpointSettings
                label="Bottom endpoint"
                settings={settings.verticalLine.bottomEndpoint}
                onChange={(s) => updateVerticalLine({ bottomEndpoint: s })}
              />
            </div>
          )}

          {/* ── Horizontal line ── */}
          <SubHeader collapsible open={horizontalLineOpen} onToggle={() => setHorizontalLineOpen(!horizontalLineOpen)}>
            Horizontal line
          </SubHeader>
          {horizontalLineOpen && (
            <div className="space-y-1.5">
              <SettingRow label="Show horizontal line" variant="inline">
                <Switch
                  checked={settings.horizontalLine.show}
                  onCheckedChange={(checked) => updateHorizontalLine({ show: checked })}
                />
              </SettingRow>
              {settings.horizontalLine.show && (
                <>
                  <LineStyleSettings
                    style={settings.horizontalLine.style}
                    dotCount={settings.horizontalLine.dotCount}
                    thickness={settings.horizontalLine.thickness}
                    color={settings.horizontalLine.color}
                    onStyleChange={(v) => updateHorizontalLine({ style: v })}
                    onDotCountChange={(v) => updateHorizontalLine({ dotCount: v })}
                    onThicknessChange={(v) => updateHorizontalLine({ thickness: v })}
                    onColorChange={(v) => updateHorizontalLine({ color: v })}
                  />
                  <EndpointSettings
                    label="Endpoint"
                    settings={settings.horizontalLine.endpoint}
                    onChange={(s) => updateHorizontalLine({ endpoint: s })}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Info text ── */}
          <SubHeader collapsible open={textOpen} onToggle={() => setTextOpen(!textOpen)}>
            Info text
          </SubHeader>
          {textOpen && (
            <div className="space-y-1.5">
              <SettingRow label="Data type">
                <TabMenu<InfoDataType>
                  value={settings.text.dataType}
                  onChange={(v) => updateText({ dataType: v })}
                  options={[
                    { value: 'number', label: 'Number' },
                    { value: 'text', label: 'Text' },
                  ]}
                />
              </SettingRow>

              <SettingRow label="Text alignment">
                <TabMenu<AnnotationTextAlign>
                  value={settings.text.textAlign}
                  onChange={(v) => updateText({ textAlign: v })}
                  options={[
                    { value: 'left', label: 'L' },
                    { value: 'center', label: 'C' },
                    { value: 'right', label: 'R' },
                  ]}
                />
              </SettingRow>

              <SettingRow label="Font family">
                <Select
                  value={settings.text.fontFamily}
                  onValueChange={(v) => updateText({ fontFamily: v })}
                >
                  <SelectTrigger className="h-7 text-xs w-full">
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
              </SettingRow>

              {/* Font styling: weight+italic, size, color */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-600 font-medium">Font styling</span>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-1.5 items-end">
                  <Select
                    value={String(settings.text.fontWeight)}
                    onValueChange={(v) => updateText({ fontWeight: v as FontWeight })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300" className="text-xs">Light</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="500" className="text-xs">Medium</SelectItem>
                      <SelectItem value="600" className="text-xs">Semibold</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => updateText({ fontStyle: settings.text.fontStyle === 'normal' ? 'italic' : 'normal' })}
                    className={`h-7 w-7 flex items-center justify-center rounded-md border text-xs font-serif italic shrink-0 ${
                      settings.text.fontStyle === 'italic'
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                    title="Italic"
                  >
                    I
                  </button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.text.fontSize}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) updateText({ fontSize: Math.max(6, Math.min(48, num)) });
                      }}
                      min={6}
                      max={48}
                      step={1}
                      className="h-7 text-xs w-full"
                    />
                    <span className="text-xs text-gray-400 shrink-0">px</span>
                  </div>
                  <ColorPicker
                    value={settings.text.color}
                    onChange={(color) => updateText({ color })}
                  />
                </div>
              </div>

              <NumberInput
                label="Letter spacing"
                value={settings.text.letterSpacing}
                onChange={(v) => updateText({ letterSpacing: v })}
                min={-10}
                max={20}
                step={0.01}
                arrowStep={0.1}
                suffix="px"
              />

              {/* Padding */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-500 font-medium">Padding (px)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Vertical</label>
                    <Input
                      type="number"
                      value={settings.text.paddingVertical}
                      onChange={(e) => updateText({ paddingVertical: parseFloat(e.target.value) || 0 })}
                      className="h-7 text-xs w-full"
                      min={-50}
                      max={200}
                      step={0.1}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-0.5 block">Horizontal</label>
                    <Input
                      type="number"
                      value={settings.text.paddingHorizontal}
                      onChange={(e) => updateText({ paddingHorizontal: parseFloat(e.target.value) || 0 })}
                      className="h-7 text-xs w-full"
                      min={-50}
                      max={200}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Per-row overrides ── */}
          <button
            onClick={() => setShowPerRowDialog(true)}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors mt-2"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Per-row overrides
          </button>

          <Dialog open={showPerRowDialog} onOpenChange={setShowPerRowDialog}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Per-row annotation overrides</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Override default styling for specific rows. Leave empty to use defaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-2">
                {rowLabels.map((label, i) => {
                  const rowOverrides = settings.perRowOverrides[label] || {};
                  const isExpanded = expandedRows[label] ?? false;
                  const sections = expandedRowSections[label] || {};

                  return (
                    <div key={label || i} className="rounded-md border border-gray-200">
                      {/* Row header */}
                      <button
                        onClick={() => setExpandedRows((prev) => ({ ...prev, [label]: !isExpanded }))}
                        className="flex items-center justify-between w-full px-3 py-2 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                          <Label className="text-xs font-medium cursor-pointer">{label || `Row ${i + 1}`}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">
                            {rowOverrides.show === false ? 'Hidden' : 'Visible'}
                          </span>
                          <Switch
                            checked={rowOverrides.show !== false}
                            onCheckedChange={(checked) => updatePerRow(label, { show: checked })}
                            className="scale-75"
                          />
                        </div>
                      </button>

                      {/* Row content */}
                      {isExpanded && rowOverrides.show !== false && (
                        <div className="px-3 pb-3 space-y-2">
                          {/* Text overrides */}
                          <SubHeader
                            collapsible
                            open={sections.text}
                            onToggle={() => toggleRowSection(label, 'text')}
                          >
                            Text styling
                          </SubHeader>
                          {sections.text && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
                                  <ColorPicker
                                    value={rowOverrides.color || settings.text.color}
                                    onChange={(color) => updatePerRow(label, { color })}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Font size</label>
                                  <Input
                                    type="number"
                                    value={rowOverrides.fontSize ?? ''}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value);
                                      if (!isNaN(v)) updatePerRow(label, { fontSize: v });
                                    }}
                                    className="h-7 text-xs w-full"
                                    placeholder={String(settings.text.fontSize)}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Font weight</label>
                                  <Select
                                    value={rowOverrides.fontWeight || ''}
                                    onValueChange={(v) => updatePerRow(label, { fontWeight: v as FontWeight })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="300" className="text-xs">Light</SelectItem>
                                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                      <SelectItem value="500" className="text-xs">Medium</SelectItem>
                                      <SelectItem value="600" className="text-xs">Semibold</SelectItem>
                                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Letter spacing</label>
                                  <Input
                                    type="number"
                                    value={rowOverrides.letterSpacing ?? ''}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) updatePerRow(label, { letterSpacing: v });
                                    }}
                                    className="h-7 text-xs w-full"
                                    step="0.01"
                                    placeholder={String(settings.text.letterSpacing)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Vertical line overrides */}
                          <SubHeader
                            collapsible
                            open={sections.verticalLine}
                            onToggle={() => toggleRowSection(label, 'verticalLine')}
                          >
                            Vertical line
                          </SubHeader>
                          {sections.verticalLine && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
                                  <ColorPicker
                                    value={rowOverrides.verticalLineColor || settings.verticalLine.color}
                                    onChange={(color) => updatePerRow(label, { verticalLineColor: color })}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Thickness</label>
                                  <Input
                                    type="number"
                                    value={rowOverrides.verticalLineThickness ?? ''}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) updatePerRow(label, { verticalLineThickness: v });
                                    }}
                                    className="h-7 text-xs w-full"
                                    step="0.5"
                                    placeholder={String(settings.verticalLine.thickness)}
                                  />
                                </div>
                              </div>
                              <SettingRow label="Style">
                                <Select
                                  value={rowOverrides.verticalLineStyle || ''}
                                  onValueChange={(v) => updatePerRow(label, { verticalLineStyle: v as AnnotationLineStyle })}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="Default" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                                    <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
                                  </SelectContent>
                                </Select>
                              </SettingRow>
                            </div>
                          )}

                          {/* Horizontal line overrides */}
                          <SubHeader
                            collapsible
                            open={sections.horizontalLine}
                            onToggle={() => toggleRowSection(label, 'horizontalLine')}
                          >
                            Horizontal line
                          </SubHeader>
                          {sections.horizontalLine && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                              <SettingRow label="Show" variant="inline">
                                <Switch
                                  checked={rowOverrides.horizontalLineShow !== false}
                                  onCheckedChange={(checked) => updatePerRow(label, { horizontalLineShow: checked })}
                                  className="scale-75"
                                />
                              </SettingRow>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
                                  <ColorPicker
                                    value={rowOverrides.horizontalLineColor || settings.horizontalLine.color}
                                    onChange={(color) => updatePerRow(label, { horizontalLineColor: color })}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 block mb-0.5">Thickness</label>
                                  <Input
                                    type="number"
                                    value={rowOverrides.horizontalLineThickness ?? ''}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v)) updatePerRow(label, { horizontalLineThickness: v });
                                    }}
                                    className="h-7 text-xs w-full"
                                    step="0.5"
                                    placeholder={String(settings.horizontalLine.thickness)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {rowLabels.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No data rows. Add data to configure per-row overrides.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AccordionSection>
  );
}
