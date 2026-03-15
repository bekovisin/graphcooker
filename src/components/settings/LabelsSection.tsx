'use client';

import { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';
import type {
  BarLabelStyle,
  DataPointLabelPosition,
  DataPointLabelColorMode,
  StackLabelMode,
  LabelsSettings,
  FontWeight,
  FontStyle,
  LineOverlapMode,
  ConnectorLineMode,
  ConnectorLineStyle,
  DataPointShowMode,
  DataPointLabelContent,
  LineDataPointPosition,
  LineLabelSeriesOverride,
} from '@/types/chart';
import { ChevronDown, ChevronRight } from 'lucide-react';

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {children}
      </h4>
    </div>
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

function CustomPrefixSubSection() {
  const customPrefix = useEditorStore((s) => s.settings.customPrefix);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const updateCP = (updates: Partial<typeof customPrefix>) => {
    updateSettings('customPrefix', updates);
  };

  return (
    <>
      <SettingRow label="Show custom prefix" variant="inline">
        <Switch
          checked={customPrefix.show}
          onCheckedChange={(checked) => updateCP({ show: checked })}
        />
      </SettingRow>

      {customPrefix.show && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <SettingRow label="Prefix text">
            <Input
              value={customPrefix.text}
              onChange={(e) => updateCP({ text: e.target.value })}
              className="h-7 text-xs w-full"
              placeholder="e.g. %"
            />
          </SettingRow>

          <SettingRow label="Position">
            <TabMenu
              value={customPrefix.position}
              onChange={(v) => updateCP({ position: v as 'left' | 'right' })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </SettingRow>

          <div className="space-y-1.5">
            <span className="text-xs text-gray-600 font-medium">Prefix styling</span>
            <div className="grid grid-cols-3 gap-1.5 items-end">
              <Select
                value={String(customPrefix.fontWeight)}
                onValueChange={(v) => updateCP({ fontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-8 text-xs">
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
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={customPrefix.fontSize}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) updateCP({ fontSize: Math.max(6, Math.min(100, num)) });
                  }}
                  min={6}
                  max={100}
                  step={1}
                  className="h-8 text-xs w-full"
                />
                <span className="text-xs text-gray-400 shrink-0">px</span>
              </div>
              <ColorPicker
                value={customPrefix.color}
                onChange={(color) => updateCP({ color })}
              />
            </div>
          </div>

          <SettingRow label="Vertical align">
            <TabMenu
              value={customPrefix.verticalAlign}
              onChange={(v) => updateCP({ verticalAlign: v as 'bottom' | 'center' | 'top' })}
              options={[
                { value: 'bottom', label: 'Bottom' },
                { value: 'center', label: 'Center' },
                { value: 'top', label: 'Top' },
              ]}
            />
          </SettingRow>

          <NumberInput
            label="Padding"
            value={customPrefix.padding}
            onChange={(v) => updateCP({ padding: v })}
            min={-20}
            max={50}
            step={1}
            suffix="px"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <NumberInput
              label="Padding top"
              value={customPrefix.paddingTop}
              onChange={(v) => updateCP({ paddingTop: v })}
              min={-30}
              max={30}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="Padding bottom"
              value={customPrefix.paddingBottom}
              onChange={(v) => updateCP({ paddingBottom: v })}
              min={-30}
              max={30}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function LabelsSection() {
  const settings = useEditorStore((s) => s.settings.labels);
  const chartType = useEditorStore((s) => s.settings.chartType.chartType);
  const seriesNames = useEditorStore((s) => s.columnMapping.values || []);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);
  const categoryNames = useMemo(() => {
    if (!labelsColumn || !data.length) return [];
    const seen = new Set<string>();
    return data.reduce<string[]>((acc, row) => {
      const name = String(row[labelsColumn] || '');
      if (name && !seen.has(name)) { seen.add(name); acc.push(name); }
      return acc;
    }, []);
  }, [data, labelsColumn]);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showLinePositionModal, setShowLinePositionModal] = useState(false);
  const [showLineColorModal, setShowLineColorModal] = useState(false);
  const [showLineLabelColorModal, setShowLineLabelColorModal] = useState(false);
  const [showLineRowColorModal, setShowLineRowColorModal] = useState(false);
  const [showDpLetterSpacingModal, setShowDpLetterSpacingModal] = useState(false);
  const [showLineLabelSeriesModal, setShowLineLabelSeriesModal] = useState(false);
  const [expandedLabelSeries, setExpandedLabelSeries] = useState<Record<string, boolean>>({});
  const [showRowSeriesPaddingModal, setShowRowSeriesPaddingModal] = useState(false);
  const [expandedPaddingRows, setExpandedPaddingRows] = useState<Record<string, boolean>>({});
  const [showDpColorModal, setShowDpColorModal] = useState(false);
  const [dataPointStylingOpen, setDataPointStylingOpen] = useState(true);
  const isLineChart = chartType === 'line_chart';
  const isRowMode = settings.dataPointCustomMode === 'row';
  const customNames = isRowMode ? categoryNames : seriesNames;
  const customPositions = isRowMode ? settings.dataPointRowPositions : settings.dataPointSeriesPositions;
  const customPositionKey = isRowMode ? 'dataPointRowPositions' : 'dataPointSeriesPositions';

  // Line chart custom position mode
  const isLineRowMode = (settings.lineDataPointCustomMode ?? 'column') === 'row';

  const update = (updates: Partial<LabelsSettings>) => {
    updateSettings('labels', updates);
  };

  if (isLineChart) {
    return (
      <AccordionSection id="labels" title="Labels">
        {/* ── LINE LABELS ── */}
        <SubHeader>Line Labels</SubHeader>

        <SettingRow label="Show line labels" variant="inline">
          <Switch
            checked={settings.showLineLabels ?? true}
            onCheckedChange={(checked) => update({ showLineLabels: checked })}
          />
        </SettingRow>

        {(settings.showLineLabels ?? true) && (
          <div className="space-y-3 pl-2 border-l-2 border-gray-100">
            {/* Space mode (auto/fixed) */}
            <SettingRow label="Space mode">
              <TabMenu
                value={settings.lineLabelSpaceMode ?? 'auto'}
                onChange={(v) => update({ lineLabelSpaceMode: v as 'auto' | 'fixed' })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'fixed', label: 'Fixed' },
                ]}
              />
            </SettingRow>

            {(settings.lineLabelSpaceMode ?? 'auto') === 'fixed' && (
              <NumberInput
                label="Label width"
                value={settings.lineLabelSpaceValue ?? 80}
                onChange={(v) => update({ lineLabelSpaceValue: v })}
                min={0}
                max={400}
                step={1}
                suffix="px"
              />
            )}

            {(settings.lineLabelSpaceMode ?? 'auto') === 'auto' && (
              <NumberInput
                label="Max width"
                value={settings.lineLabelMaxWidth ?? 4}
                onChange={(v) => update({ lineLabelMaxWidth: v })}
                min={1}
                max={20}
                step={0.5}
              />
            )}

            <NumberInput
              label="Max lines"
              value={settings.lineLabelMaxLines ?? 3}
              onChange={(v) => update({ lineLabelMaxLines: v })}
              min={1}
              max={10}
              step={1}
            />

            <SettingRow label="Overlaps">
              <Select
                value={settings.lineLabelOverlap ?? 'spread'}
                onValueChange={(v) => update({ lineLabelOverlap: v as LineOverlapMode })}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spread" className="text-xs">Spread to fit</SelectItem>
                  <SelectItem value="hide" className="text-xs">Hide on overlap</SelectItem>
                  <SelectItem value="nothing" className="text-xs">Do nothing</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <NumberInput
              label="Spacing"
              value={settings.lineLabelSpacing ?? 1.2}
              onChange={(v) => update({ lineLabelSpacing: v })}
              min={0}
              max={5}
              step={0.1}
            />

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Distance H"
                value={settings.lineLabelDistance ?? 0.9}
                onChange={(v) => update({ lineLabelDistance: v })}
                min={-5}
                max={5}
                step={0.1}
              />
              <NumberInput
                label="Distance V"
                value={settings.lineLabelDistanceV ?? 0}
                onChange={(v) => update({ lineLabelDistanceV: v })}
                min={-5}
                max={5}
                step={0.1}
              />
            </div>

            <SettingRow label="Show only">
              <Input
                value={settings.lineLabelShowOnly ?? ''}
                onChange={(e) => update({ lineLabelShowOnly: e.target.value })}
                placeholder="e.g. Series 1, Series 2"
                className="h-8 text-xs w-full"
              />
            </SettingRow>

            {/* Unified per-series line label settings */}
            <button
              onClick={() => setShowLineLabelSeriesModal(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configure per-series line labels...
            </button>

            <Dialog open={showLineLabelSeriesModal} onOpenChange={setShowLineLabelSeriesModal}>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm">Per-series line label settings</DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Customize font size, weight, style, letter spacing, color and padding for each series&apos; line label.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1 mt-2">
                  {seriesNames.map((seriesName) => {
                    const expanded = expandedLabelSeries[seriesName] ?? false;
                    const overrides = settings.lineLabelPerSeriesOverrides?.[seriesName] || {} as LineLabelSeriesOverride;
                    const updateOverride = (patch: Partial<LineLabelSeriesOverride>) => {
                      update({
                        lineLabelPerSeriesOverrides: {
                          ...settings.lineLabelPerSeriesOverrides,
                          [seriesName]: { ...overrides, ...patch },
                        },
                      });
                    };
                    return (
                      <div key={seriesName} className="border border-gray-200 rounded-md">
                        <button
                          onClick={() => setExpandedLabelSeries((prev) => ({ ...prev, [seriesName]: !expanded }))}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50"
                        >
                          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                          <span className="text-sm font-medium text-gray-800 truncate">{seriesName}</span>
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                            <NumberInput
                              label="Font size (px)"
                              value={overrides.fontSize ?? (settings.lineLabelSize ?? 12)}
                              onChange={(v) => updateOverride({ fontSize: v })}
                              min={1}
                              max={72}
                              step={1}
                            />
                            <SettingRow label="Font weight">
                              <Select
                                value={overrides.fontWeight ?? (settings.lineLabelWeight ?? 'bold')}
                                onValueChange={(v) => updateOverride({ fontWeight: v as FontWeight })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                                  <SelectItem value="300" className="text-xs">Light</SelectItem>
                                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                                  <SelectItem value="900" className="text-xs">Black</SelectItem>
                                </SelectContent>
                              </Select>
                            </SettingRow>
                            <SettingRow label="Font style">
                              <Select
                                value={overrides.fontStyle ?? (settings.lineLabelFontStyle || 'normal')}
                                onValueChange={(v) => updateOverride({ fontStyle: v as FontStyle })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                  <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                                </SelectContent>
                              </Select>
                            </SettingRow>
                            <NumberInput
                              label="Letter spacing"
                              value={overrides.letterSpacing ?? 0}
                              onChange={(v) => updateOverride({ letterSpacing: v })}
                              min={-10}
                              max={10}
                              step={0.01}
                            />
                            <ColorPicker
                              label="Color"
                              value={overrides.color ?? (settings.lineLabelColor ?? '#333333')}
                              onChange={(color) => updateOverride({ color })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <NumberInput
                                label="Padding H"
                                value={overrides.padding?.h ?? 0}
                                onChange={(v) => updateOverride({ padding: { h: v, v: overrides.padding?.v ?? 0 } })}
                                min={-999}
                                max={999}
                                step={1}
                              />
                              <NumberInput
                                label="Padding V"
                                value={overrides.padding?.v ?? 0}
                                onChange={(v) => updateOverride({ padding: { h: overrides.padding?.h ?? 0, v } })}
                                min={-999}
                                max={999}
                                step={1}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ── TEXT (line label text styling) ── */}
        {(settings.showLineLabels ?? true) && (
          <>
            <SubHeader>Text</SubHeader>
            <div className="space-y-3 pl-2 border-l-2 border-gray-100">
              {/* Font family */}
              <SettingRow label="Font family">
                <Select
                  value={settings.lineLabelFontFamily || 'Inter, sans-serif'}
                  onValueChange={(v) => update({ lineLabelFontFamily: v })}
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

              {/* Font styling grid: weight, style, size */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-600 font-medium">Font styling</span>
                <div className="grid grid-cols-3 gap-1.5 items-end">
                  <Select
                    value={settings.lineLabelWeight ?? 'bold'}
                    onValueChange={(v) => update({ lineLabelWeight: v as FontWeight })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                      <SelectItem value="300" className="text-xs">Light</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="500" className="text-xs">Medium</SelectItem>
                      <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      <SelectItem value="900" className="text-xs">Black</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={settings.lineLabelFontStyle || 'normal'}
                    onValueChange={(v) => update({ lineLabelFontStyle: v as FontStyle })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={settings.lineLabelSize ?? 12}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) update({ lineLabelSize: Math.max(1, Math.min(72, num)) });
                      }}
                      min={1}
                      max={72}
                      step={1}
                      className="h-8 text-xs w-full"
                    />
                    <span className="text-[10px] text-gray-400">px</span>
                  </div>
                </div>
              </div>

              {/* Color mode */}
              <SettingRow label="Color mode">
                <Select
                  value={settings.lineLabelColorMode ?? 'fixed'}
                  onValueChange={(v) => update({ lineLabelColorMode: v as 'auto' | 'fixed' | 'custom' })}
                >
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed" className="text-xs">Fixed</SelectItem>
                    <SelectItem value="custom" className="text-xs">Custom per-series</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              {(settings.lineLabelColorMode ?? 'fixed') === 'fixed' && (
                <ColorPicker
                  label="Color"
                  value={settings.lineLabelColor ?? '#333333'}
                  onChange={(color) => update({ lineLabelColor: color })}
                />
              )}

              {settings.lineLabelColorMode === 'custom' && (
                <>
                  <ColorPicker
                    label="Default color"
                    value={settings.lineLabelColor ?? '#333333'}
                    onChange={(color) => update({ lineLabelColor: color })}
                  />
                  <button
                    onClick={() => setShowLineLabelColorModal(true)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Configure per-series colors...
                  </button>
                  <Dialog open={showLineLabelColorModal} onOpenChange={setShowLineLabelColorModal}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Per-Series Line Label Colors</DialogTitle>
                        <DialogDescription>
                          Set the line label color for each series independently.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {seriesNames.map((name) => (
                          <div key={name} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-700 font-medium truncate min-w-0 flex-shrink">
                              {name}
                            </span>
                            <div className="flex-shrink-0">
                              <ColorPicker
                                value={settings.lineLabelSeriesColors?.[name] || settings.lineLabelColor || '#333333'}
                                onChange={(color) => {
                                  update({
                                    lineLabelSeriesColors: {
                                      ...settings.lineLabelSeriesColors,
                                      [name]: color,
                                    },
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <ColorPicker
                label="Outline"
                value={settings.lineLabelOutline ?? '#ffffff'}
                onChange={(color) => update({ lineLabelOutline: color })}
              />

              <NumberInput
                label="Outline width"
                value={settings.lineLabelOutlineWidth ?? 25}
                onChange={(v) => update({ lineLabelOutlineWidth: v })}
                min={0}
                max={100}
                step={1}
              />

              <NumberInput
                label="Line height"
                value={settings.lineLabelLineHeight ?? 1}
                onChange={(v) => update({ lineLabelLineHeight: v })}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>
          </>
        )}

        {/* ── CONNECTOR LINES ── */}
        <SubHeader>Lines</SubHeader>
        <div className="space-y-3">
          <SettingRow label="Mode">
            <TabMenu
              value={settings.connectorLineMode ?? 'auto'}
              onChange={(v) => update({ connectorLineMode: v as ConnectorLineMode })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </SettingRow>

          {(settings.connectorLineMode ?? 'auto') !== 'off' && (
            <div className="space-y-3 pl-2 border-l-2 border-gray-100">
              <SettingRow label="Style">
                <TabMenu
                  value={settings.connectorLineStyle ?? 'straight'}
                  onChange={(v) => update({ connectorLineStyle: v as ConnectorLineStyle })}
                  options={[
                    { value: 'straight', label: 'Straight' },
                    { value: 'step', label: 'Step' },
                  ]}
                />
              </SettingRow>

              <ColorPicker
                label="Color"
                value={settings.connectorLineColor ?? '#999999'}
                onChange={(color) => update({ connectorLineColor: color })}
              />

              <NumberInput
                label="Width"
                value={settings.connectorLineWidth ?? 0}
                onChange={(v) => update({ connectorLineWidth: v })}
                min={0}
                max={5}
                step={0.5}
              />

              <NumberInput
                label="Length"
                value={settings.connectorLineLength ?? 0}
                onChange={(v) => update({ connectorLineLength: v })}
                min={0}
                max={100}
                step={1}
              />

              <NumberInput
                label="Padding"
                value={settings.connectorLinePadding ?? 0.25}
                onChange={(v) => update({ connectorLinePadding: v })}
                min={0}
                max={5}
                step={0.05}
              />
            </div>
          )}
        </div>

        {/* ── DATA POINT LABELS ── */}
        <SubHeader>Data Point Labels</SubHeader>

        <SettingRow label="Show data point labels" variant="inline">
          <Switch
            checked={settings.showDataPointLabels}
            onCheckedChange={(checked) => update({ showDataPointLabels: checked })}
          />
        </SettingRow>

        {settings.showDataPointLabels && (
          <div className="space-y-3 pl-2 border-l-2 border-gray-100">
            {/* Show mode */}
            <SettingRow label="Show mode">
              <Select
                value={settings.dataPointShowMode ?? 'all'}
                onValueChange={(v) => update({ dataPointShowMode: v as DataPointShowMode })}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="last" className="text-xs">Last</SelectItem>
                  <SelectItem value="min_max" className="text-xs">Min & Max</SelectItem>
                  <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            {/* Hide overlapping */}
            <SettingRow label="Hide overlapping" variant="inline">
              <Switch
                checked={settings.dataPointHideOverlapping ?? false}
                onCheckedChange={(checked) => update({ dataPointHideOverlapping: checked })}
              />
            </SettingRow>

            {/* Center on dot */}
            <SettingRow label="Center on dot" variant="inline">
              <Switch
                checked={settings.dataPointCenterOnDot ?? false}
                onCheckedChange={(checked) => update({ dataPointCenterOnDot: checked })}
              />
            </SettingRow>

            {/* Label content */}
            <SettingRow label="Label content">
              <Select
                value={settings.dataPointLabelContent ?? 'auto'}
                onValueChange={(v) => update({ dataPointLabelContent: v as DataPointLabelContent })}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-xs">Auto</SelectItem>
                  <SelectItem value="value" className="text-xs">Value</SelectItem>
                  <SelectItem value="label" className="text-xs">Label</SelectItem>
                  <SelectItem value="both" className="text-xs">Both</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            {/* ── Collapsible Styling section ── */}
            <button
              onClick={() => setDataPointStylingOpen(!dataPointStylingOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold py-1 w-full hover:text-gray-900 transition-colors"
            >
              {dataPointStylingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Styling
            </button>

            {dataPointStylingOpen && (
              <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                {/* Font family */}
                <SettingRow label="Font family">
                  <Select
                    value={settings.dataPointFontFamily || 'Inter, sans-serif'}
                    onValueChange={(v) => update({ dataPointFontFamily: v })}
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

                {/* Font styling grid: weight, style, size */}
                <div className="space-y-1.5">
                  <span className="text-xs text-gray-600 font-medium">Font styling</span>
                  <div className="grid grid-cols-3 gap-1.5 items-end">
                    <Select
                      value={settings.dataPointFontWeight}
                      onValueChange={(v) => update({ dataPointFontWeight: v as FontWeight })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                        <SelectItem value="300" className="text-xs">Light</SelectItem>
                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        <SelectItem value="500" className="text-xs">Medium</SelectItem>
                        <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                        <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                        <SelectItem value="900" className="text-xs">Black</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={settings.dataPointFontStyle || 'normal'}
                      onValueChange={(v) => update({ dataPointFontStyle: v as 'normal' | 'italic' })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={settings.dataPointFontSize}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num)) update({ dataPointFontSize: Math.max(6, Math.min(100, num)) });
                        }}
                        min={6}
                        max={100}
                        step={1}
                        className="h-8 text-xs w-full"
                      />
                      <span className="text-xs text-gray-400 shrink-0">px</span>
                    </div>
                  </div>
                </div>

                {/* ── Color mode ── */}
                <SettingRow label="Color mode">
                  <Select
                    value={settings.lineDataPointColorMode ?? 'auto'}
                    onValueChange={(v) => update({ lineDataPointColorMode: v as 'auto' | 'match_data' | 'fixed' | 'custom' })}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto" className="text-xs">Auto</SelectItem>
                      <SelectItem value="match_data" className="text-xs">Match data</SelectItem>
                      <SelectItem value="fixed" className="text-xs">Fixed</SelectItem>
                      <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                {settings.lineDataPointColorMode === 'fixed' && (
                  <ColorPicker
                    label="Text color"
                    value={settings.lineDataPointColorFixed ?? '#333333'}
                    onChange={(color) => update({ lineDataPointColorFixed: color })}
                  />
                )}

                {settings.lineDataPointColorMode === 'custom' && (
                  <>
                    <ColorPicker
                      label="Default color"
                      value={settings.lineDataPointColorFixed ?? '#333333'}
                      onChange={(color) => update({ lineDataPointColorFixed: color })}
                    />

                    <SettingRow label="Custom by">
                      <Select
                        value={settings.lineDataPointColorCustomMode || 'column'}
                        onValueChange={(v) => update({ lineDataPointColorCustomMode: v as 'column' | 'row' })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="column">By Column (series)</SelectItem>
                          <SelectItem value="row">By Row</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    {(settings.lineDataPointColorCustomMode || 'column') === 'column' && (
                      <>
                        <button
                          onClick={() => setShowLineColorModal(true)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Configure per-series colors...
                        </button>
                        <Dialog open={showLineColorModal} onOpenChange={setShowLineColorModal}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Per-Series Label Colors</DialogTitle>
                              <DialogDescription>
                                Set the data point label color for each series independently.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                              {seriesNames.map((name) => (
                                <div key={name} className="flex items-center justify-between gap-3">
                                  <span className="text-sm text-gray-700 font-medium truncate min-w-0 flex-shrink">
                                    {name}
                                  </span>
                                  <div className="flex-shrink-0">
                                    <ColorPicker
                                      value={settings.lineDataPointSeriesColors?.[name] || settings.lineDataPointColorFixed || '#333333'}
                                      onChange={(color) => {
                                        update({
                                          lineDataPointSeriesColors: {
                                            ...settings.lineDataPointSeriesColors,
                                            [name]: color,
                                          },
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {settings.lineDataPointColorCustomMode === 'row' && (
                      <>
                        <button
                          onClick={() => setShowLineRowColorModal(true)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Configure per-row colors...
                        </button>
                        <Dialog open={showLineRowColorModal} onOpenChange={setShowLineRowColorModal}>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Per-Row Label Colors</DialogTitle>
                              <DialogDescription>
                                Set the data point label color for each series within each row.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                              {categoryNames.map((rowName) => (
                                <div key={rowName} className="space-y-2">
                                  <span className="text-sm font-semibold text-gray-800">{rowName}</span>
                                  <div className="space-y-1.5 pl-3 border-l-2 border-gray-200">
                                    {seriesNames.map((colName) => {
                                      const rowColors = settings.lineDataPointRowColors?.[rowName] || {};
                                      return (
                                        <div key={colName} className="flex items-center justify-between gap-3">
                                          <span className="text-xs text-gray-600 truncate min-w-0 flex-shrink">
                                            {colName}
                                          </span>
                                          <div className="flex-shrink-0">
                                            <ColorPicker
                                              value={rowColors[colName] || settings.lineDataPointColorFixed || '#333333'}
                                              onChange={(color) => {
                                                update({
                                                  lineDataPointRowColors: {
                                                    ...settings.lineDataPointRowColors,
                                                    [rowName]: {
                                                      ...(settings.lineDataPointRowColors?.[rowName] || {}),
                                                      [colName]: color,
                                                    },
                                                  },
                                                });
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </>
                )}

                {/* Outline */}
                <SettingRow label="Outline" variant="inline">
                  <Switch
                    checked={settings.dataPointOutlineOn ?? true}
                    onCheckedChange={(checked) => update({ dataPointOutlineOn: checked })}
                  />
                </SettingRow>

                {(settings.dataPointOutlineOn ?? true) && (
                  <NumberInput
                    label="Outline size"
                    value={settings.dataPointOutlineSize ?? 3}
                    onChange={(v) => update({ dataPointOutlineSize: v })}
                    min={0}
                    max={20}
                    step={1}
                  />
                )}
              </div>
            )}

            {/* Position (above/below/custom) */}
            <SettingRow label="Position">
              <TabMenu
                value={settings.lineDataPointPosition ?? 'above'}
                onChange={(v) => update({ lineDataPointPosition: v as LineDataPointPosition | 'custom' })}
                options={[
                  { value: 'above', label: 'Above' },
                  { value: 'below', label: 'Below' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </SettingRow>

            {/* Custom position: column/row dropdown + modal */}
            {settings.lineDataPointPosition === 'custom' && (
              <>
                <SettingRow label="Custom by">
                  <Select
                    value={settings.lineDataPointCustomMode || 'column'}
                    onValueChange={(v) => update({ lineDataPointCustomMode: v as 'column' | 'row' })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">By Column</SelectItem>
                      <SelectItem value="row">By Row</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <button
                  onClick={() => setShowLinePositionModal(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Configure per-{isLineRowMode ? 'row' : 'column'} positions...
                </button>

                {/* Per-column position dialog */}
                {!isLineRowMode && (
                  <Dialog open={showLinePositionModal} onOpenChange={setShowLinePositionModal}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Per-Column Label Positions</DialogTitle>
                        <DialogDescription>
                          Set the data point label position for each column (series) independently.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {seriesNames.map((name) => (
                          <div key={name} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-700 font-medium truncate min-w-0 flex-shrink">
                              {name}
                            </span>
                            <div className="flex-shrink-0 w-[180px]">
                              <TabMenu
                                value={settings.lineDataPointSeriesPositions?.[name] || 'above'}
                                onChange={(v) => {
                                  update({
                                    lineDataPointSeriesPositions: {
                                      ...settings.lineDataPointSeriesPositions,
                                      [name]: v as LineDataPointPosition,
                                    },
                                  });
                                }}
                                options={[
                                  { value: 'above', label: 'Above' },
                                  { value: 'below', label: 'Below' },
                                ]}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Per-row position dialog */}
                {isLineRowMode && (
                  <Dialog open={showLinePositionModal} onOpenChange={setShowLinePositionModal}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Per-Row Label Positions</DialogTitle>
                        <DialogDescription>
                          Set the data point label position for each series within each row.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {categoryNames.map((rowName) => (
                          <div key={rowName} className="space-y-2">
                            <span className="text-sm font-semibold text-gray-800">{rowName}</span>
                            <div className="space-y-1.5 pl-3 border-l-2 border-gray-200">
                              {seriesNames.map((colName) => {
                                const rowPositions = settings.lineDataPointRowPositions?.[rowName] || {};
                                const currentPos = (typeof rowPositions === 'object' && rowPositions !== null && typeof rowPositions !== 'string')
                                  ? (rowPositions as Record<string, LineDataPointPosition>)[colName] || 'above'
                                  : 'above';
                                return (
                                  <div key={colName} className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-gray-600 truncate min-w-0 flex-shrink">
                                      {colName}
                                    </span>
                                    <div className="flex-shrink-0 w-[140px]">
                                      <TabMenu
                                        value={currentPos}
                                        onChange={(v) => {
                                          const existingRow = settings.lineDataPointRowPositions?.[rowName] || {};
                                          const updatedRow = typeof existingRow === 'object' && existingRow !== null && typeof existingRow !== 'string'
                                            ? { ...(existingRow as Record<string, LineDataPointPosition>), [colName]: v as LineDataPointPosition }
                                            : { [colName]: v as LineDataPointPosition };
                                          update({
                                            lineDataPointRowPositions: {
                                              ...settings.lineDataPointRowPositions,
                                              [rowName]: updatedRow,
                                            },
                                          });
                                        }}
                                        options={[
                                          { value: 'above', label: 'Above' },
                                          { value: 'below', label: 'Below' },
                                        ]}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {/* Custom padding (no min limit) */}
            <SettingRow label="Custom padding" variant="inline">
              <Switch
                checked={settings.dataPointCustomPadding}
                onCheckedChange={(checked) => update({ dataPointCustomPadding: checked })}
              />
            </SettingRow>

            {settings.dataPointCustomPadding && (
              <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                <div className="grid grid-cols-4 gap-2">
                  <NumberInput
                    label="T"
                    value={settings.dataPointPaddingTop}
                    onChange={(v) => update({ dataPointPaddingTop: v })}
                    min={-999}
                    max={999}
                    step={1}
                  />
                  <NumberInput
                    label="R"
                    value={settings.dataPointPaddingRight}
                    onChange={(v) => update({ dataPointPaddingRight: v })}
                    min={-999}
                    max={999}
                    step={1}
                  />
                  <NumberInput
                    label="B"
                    value={settings.dataPointPaddingBottom}
                    onChange={(v) => update({ dataPointPaddingBottom: v })}
                    min={-999}
                    max={999}
                    step={1}
                  />
                  <NumberInput
                    label="L"
                    value={settings.dataPointPaddingLeft}
                    onChange={(v) => update({ dataPointPaddingLeft: v })}
                    min={-999}
                    max={999}
                    step={1}
                  />
                </div>
              </div>
            )}

            {/* Per-row per-series padding button & modal */}
            <button
              onClick={() => setShowRowSeriesPaddingModal(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configure per-row padding...
            </button>

            <Dialog open={showRowSeriesPaddingModal} onOpenChange={setShowRowSeriesPaddingModal}>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm">Per-Row Per-Series Padding</DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Adjust horizontal and vertical padding for each series within each row.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-2">
                  {categoryNames.map((rowName, ri) => {
                    const isEnabled = settings.dataPointRowSeriesPaddingEnabled?.[rowName] ?? false;
                    const isRowExpanded = expandedPaddingRows[rowName] ?? false;
                    const rowSeriesData = settings.dataPointRowSeriesPadding?.[rowName] || {};
                    return (
                      <div key={rowName || ri} className="rounded-md border border-gray-200">
                        {/* Row accordion header */}
                        <button
                          onClick={() => setExpandedPaddingRows((prev) => ({ ...prev, [rowName]: !isRowExpanded }))}
                          className="flex items-center justify-between w-full px-3 py-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            {isRowExpanded ? (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="text-xs font-medium">{rowName || `Row ${ri + 1}`}</span>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => {
                              update({
                                dataPointRowSeriesPaddingEnabled: {
                                  ...settings.dataPointRowSeriesPaddingEnabled,
                                  [rowName]: checked,
                                },
                              });
                            }}
                            className="scale-75"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </button>

                        {/* Row expanded content */}
                        {isRowExpanded && isEnabled && (
                          <div className="px-3 pb-3 space-y-2">
                            {seriesNames.map((seriesName) => {
                              const pad = rowSeriesData[seriesName] || { h: 0, v: 0 };
                              return (
                                <div key={seriesName} className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-medium">{seriesName}</label>
                                  <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-gray-100">
                                    <NumberInput
                                      label="H"
                                      value={pad.h}
                                      onChange={(v) => {
                                        update({
                                          dataPointRowSeriesPadding: {
                                            ...settings.dataPointRowSeriesPadding,
                                            [rowName]: {
                                              ...rowSeriesData,
                                              [seriesName]: { ...pad, h: v },
                                            },
                                          },
                                        });
                                      }}
                                      min={-999}
                                      max={999}
                                      step={1}
                                    />
                                    <NumberInput
                                      label="V"
                                      value={pad.v}
                                      onChange={(v) => {
                                        update({
                                          dataPointRowSeriesPadding: {
                                            ...settings.dataPointRowSeriesPadding,
                                            [rowName]: {
                                              ...rowSeriesData,
                                              [seriesName]: { ...pad, v: v },
                                            },
                                          },
                                        });
                                      }}
                                      min={-999}
                                      max={999}
                                      step={1}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {categoryNames.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No data rows. Add data to configure per-row padding.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </AccordionSection>
    );
  }

  return (
    <AccordionSection id="labels" title="Labels">
      {/* BAR LABELS */}
      <SubHeader>Bar Labels</SubHeader>

      {/* Label style - tab menu */}
      <SettingRow label="Label style">
        <TabMenu
          value={settings.barLabelStyle}
          onChange={(v) => update({ barLabelStyle: v as BarLabelStyle })}
          options={[
            { value: 'above_bars', label: 'Above bars' },
            { value: 'axis', label: 'Axis' },
          ]}
        />
      </SettingRow>

      {/* Above-bar label padding - 4 inputs side by side */}
      {settings.barLabelStyle === 'above_bars' && (
        <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium">Above-bar label padding</p>
          <div className="grid grid-cols-4 gap-1.5">
            <NumberInput
              label="T"
              value={settings.aboveBarPaddingTop || 0}
              onChange={(v) => update({ aboveBarPaddingTop: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="R"
              value={settings.aboveBarPaddingRight || 0}
              onChange={(v) => update({ aboveBarPaddingRight: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="B"
              value={settings.aboveBarPaddingBottom || 0}
              onChange={(v) => update({ aboveBarPaddingBottom: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
            <NumberInput
              label="L"
              value={settings.aboveBarPaddingLeft || 0}
              onChange={(v) => update({ aboveBarPaddingLeft: v })}
              min={-50}
              max={50}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      )}

      {/* Bar group vertical offset — only when above_bars */}
      {settings.barLabelStyle === 'above_bars' && (
        <NumberInput
          label="Bar group vertical offset"
          value={settings.barGroupVerticalOffset ?? 0}
          onChange={(v) => update({ barGroupVerticalOffset: v })}
          min={-50}
          max={50}
          step={1}
          suffix="px"
        />
      )}

      {/* DATA POINT LABELS */}
      <SubHeader>Data Point Labels</SubHeader>

      <SettingRow label="Show labels on data points" variant="inline">
        <Switch
          checked={settings.showDataPointLabels}
          onCheckedChange={(checked) => update({ showDataPointLabels: checked })}
        />
      </SettingRow>

      {settings.showDataPointLabels && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          {/* Position - tab menu */}
          <SettingRow label="Position">
            <TabMenu
              value={settings.dataPointPosition}
              onChange={(v) => update({ dataPointPosition: v as DataPointLabelPosition | 'custom' })}
              options={[
                { value: 'left', label: 'L' },
                { value: 'center', label: 'C' },
                { value: 'right', label: 'R' },
                { value: 'outside_right', label: 'Out' },
                ...(chartType === 'bar_chart_custom_2' ? [{ value: 'fixed' as const, label: 'Fix' }] : []),
                { value: 'custom', label: 'Cst' },
              ]}
            />
          </SettingRow>

          {/* Fixed label alignment */}
          {settings.dataPointPosition === 'fixed' && (
            <SettingRow label="Alignment">
              <TabMenu
                value={settings.fixedLabelAlignment || 'start'}
                onChange={(v) => update({ fixedLabelAlignment: v as 'start' | 'center' | 'end' })}
                options={[
                  { value: 'start', label: 'L' },
                  { value: 'center', label: 'C' },
                  { value: 'end', label: 'R' },
                ]}
              />
            </SettingRow>
          )}

          {/* Per-series/row position modal */}
          {settings.dataPointPosition === 'custom' && (
            <>
              <SettingRow label="Custom by">
                <Select
                  value={settings.dataPointCustomMode || 'column'}
                  onValueChange={(v) => update({ dataPointCustomMode: v as 'column' | 'row' })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">By Column</SelectItem>
                    <SelectItem value="row">By Row</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <button
                onClick={() => setShowPositionModal(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Configure per-{isRowMode ? 'row' : 'column'} positions...
              </button>

              <Dialog open={showPositionModal} onOpenChange={setShowPositionModal}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Per-{isRowMode ? 'Row' : 'Column'} Label Positions</DialogTitle>
                    <DialogDescription>
                      Set the data point label position for each {isRowMode ? 'row' : 'column'} independently.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {customNames.map((name) => (
                      <div key={name} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-700 font-medium truncate min-w-0 flex-shrink">
                          {name}
                        </span>
                        <div className="flex-shrink-0 w-[220px]">
                          <TabMenu
                            value={customPositions?.[name] || 'center'}
                            onChange={(v) => {
                              update({
                                [customPositionKey]: {
                                  ...customPositions,
                                  [name]: v as DataPointLabelPosition,
                                },
                              } as Partial<LabelsSettings>);
                            }}
                            options={[
                              { value: 'left', label: 'Left' },
                              { value: 'center', label: 'Center' },
                              { value: 'right', label: 'Right' },
                              { value: 'outside_right', label: 'Outside' },
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <SettingRow label="Custom padding" variant="inline">
            <Switch
              checked={settings.dataPointCustomPadding}
              onCheckedChange={(checked) => update({ dataPointCustomPadding: checked })}
            />
          </SettingRow>

          {/* Custom padding - 4 inputs side by side */}
          {settings.dataPointCustomPadding && (
            <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
              <div className="grid grid-cols-4 gap-2">
                <NumberInput
                  label="T"
                  value={settings.dataPointPaddingTop}
                  onChange={(v) => update({ dataPointPaddingTop: v })}
                  min={-50}
                  max={50}
                  step={1}
                />
                <NumberInput
                  label="R"
                  value={settings.dataPointPaddingRight}
                  onChange={(v) => update({ dataPointPaddingRight: v })}
                  min={-50}
                  max={50}
                  step={1}
                />
                <NumberInput
                  label="B"
                  value={settings.dataPointPaddingBottom}
                  onChange={(v) => update({ dataPointPaddingBottom: v })}
                  min={-50}
                  max={50}
                  step={1}
                />
                <NumberInput
                  label="L"
                  value={settings.dataPointPaddingLeft}
                  onChange={(v) => update({ dataPointPaddingLeft: v })}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
            </div>
          )}

          {/* Outside label padding (distance from bar) */}
          {(settings.dataPointPosition === 'outside_right' ||
            (settings.dataPointPosition === 'custom' &&
              (Object.values(settings.dataPointSeriesPositions || {}).includes('outside_right') ||
               Object.values(settings.dataPointRowPositions || {}).includes('outside_right')))) && (
            <NumberInput
              label="Outside label padding"
              value={settings.outsideLabelPadding ?? 6}
              onChange={(v) => update({ outsideLabelPadding: v })}
              min={-50}
              max={100}
              step={1}
              suffix="px"
            />
          )}

          <SettingRow label="Font family">
            <Select
              value={settings.dataPointFontFamily}
              onValueChange={(v) => update({ dataPointFontFamily: v })}
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

          {/* Font weight + Font style + Font size - single row */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600 font-medium">Font styling</span>
            <div className="grid grid-cols-3 gap-1.5 items-end">
              {/* Font weight */}
              <Select
                value={settings.dataPointFontWeight}
                onValueChange={(v) => update({ dataPointFontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                  <SelectItem value="300" className="text-xs">Light</SelectItem>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                  <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                  <SelectItem value="900" className="text-xs">Black</SelectItem>
                </SelectContent>
              </Select>
              {/* Font style */}
              <Select
                value={settings.dataPointFontStyle || 'normal'}
                onValueChange={(v) => update({ dataPointFontStyle: v as 'normal' | 'italic' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                </SelectContent>
              </Select>
              {/* Font size */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={settings.dataPointFontSize}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) update({ dataPointFontSize: Math.max(6, Math.min(100, num)) });
                  }}
                  min={6}
                  max={100}
                  step={1}
                  className="h-8 text-xs w-full"
                />
                <span className="text-xs text-gray-400 shrink-0">px</span>
              </div>
            </div>
          </div>

          {/* Letter spacing */}
          {chartType === 'bar_chart_custom_2' && (
            <>
              <NumberInput
                label="Letter spacing"
                value={settings.dataPointLetterSpacing ?? 0}
                onChange={(v) => update({ dataPointLetterSpacing: v })}
                min={-10}
                max={20}
                step={0.1}
                suffix="px"
              />
              {categoryNames.length > 0 && (
                <button
                  onClick={() => setShowDpLetterSpacingModal(true)}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Per-row letter spacing
                </button>
              )}
              <Dialog open={showDpLetterSpacingModal} onOpenChange={setShowDpLetterSpacingModal}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm">Per-row data point letter spacing</DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                      Override the default letter spacing for specific rows. Leave empty to use the default.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    {categoryNames.map((label) => (
                      <div key={label} className="flex items-center gap-2 p-2 rounded-md border border-gray-100">
                        <span className="text-xs font-medium min-w-[60px] truncate">{label}</span>
                        <Input
                          type="number"
                          value={settings.perRowDataPointLetterSpacings?.[label] ?? ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowDataPointLetterSpacings: {
                                  ...settings.perRowDataPointLetterSpacings,
                                  [label]: v,
                                },
                              });
                            }
                          }}
                          className="h-7 text-xs flex-1"
                          step="0.1"
                          placeholder={String(settings.dataPointLetterSpacing ?? 0)}
                        />
                        <span className="text-[10px] text-gray-400 shrink-0">px</span>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Color mode - 2-button tab menu */}
          <SettingRow label="Color mode">
            <TabMenu
              value={settings.dataPointColorMode}
              onChange={(v) => update({ dataPointColorMode: v as DataPointLabelColorMode })}
              options={[
                { value: 'auto', label: 'Auto (contrast)' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </SettingRow>

          {/* Custom color mode - modal based */}
          {settings.dataPointColorMode === 'custom' && (() => {
            const colorIsRowMode = settings.dataPointColorCustomMode === 'row';
            const colorCustomNames = colorIsRowMode ? categoryNames : seriesNames;
            const colorCustomValues = colorIsRowMode ? settings.dataPointRowColors : settings.dataPointSeriesColors;
            const colorCustomKey = colorIsRowMode ? 'dataPointRowColors' : 'dataPointSeriesColors';
            return (
              <div className="space-y-2">
                <ColorPicker
                  label="Default color"
                  value={settings.dataPointColor}
                  onChange={(color) => update({ dataPointColor: color })}
                />

                <SettingRow label="Custom by">
                  <Select
                    value={settings.dataPointColorCustomMode || 'column'}
                    onValueChange={(v) => update({ dataPointColorCustomMode: v as 'column' | 'row' })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">By Column</SelectItem>
                      <SelectItem value="row">By Row</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <button
                  onClick={() => setShowDpColorModal(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Configure per-{colorIsRowMode ? 'row' : 'column'} colors...
                </button>

                <Dialog open={showDpColorModal} onOpenChange={setShowDpColorModal}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Per-{colorIsRowMode ? 'Row' : 'Column'} Label Colors</DialogTitle>
                      <DialogDescription>
                        Set the data point label color for each {colorIsRowMode ? 'row' : 'column'} independently.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {colorCustomNames.map((name) => (
                        <div key={name} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-700 font-medium truncate min-w-0 flex-shrink">
                            {name}
                          </span>
                          <div className="flex-shrink-0">
                            <ColorPicker
                              value={colorCustomValues?.[name] || settings.dataPointColor}
                              onChange={(color) => {
                                update({
                                  [colorCustomKey]: {
                                    ...colorCustomValues,
                                    [name]: color,
                                  },
                                } as Partial<LabelsSettings>);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      {colorCustomNames.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No data {colorIsRowMode ? 'rows' : 'columns'}. Add data to configure colors.
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })()}

          {/* PERCENT PREFIX (not for bar_chart_custom_2) */}
          {chartType !== 'bar_chart_custom_2' && (
            <>
              <SettingRow label="Show % prefix" variant="inline">
                <Switch
                  checked={settings.showPercentPrefix ?? false}
                  onCheckedChange={(checked) => update({ showPercentPrefix: checked })}
                />
              </SettingRow>

              {settings.showPercentPrefix && (
                <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                  {/* Prefix position (left/right) */}
                  <SettingRow label="Position">
                    <TabMenu
                      value={settings.percentPrefixPosition ?? 'right'}
                      onChange={(v) => update({ percentPrefixPosition: v as 'left' | 'right' })}
                      options={[
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' },
                      ]}
                    />
                  </SettingRow>
                  <div className="space-y-1.5">
                    <span className="text-xs text-gray-600 font-medium">% styling</span>
                    <div className="grid grid-cols-3 gap-1.5 items-end">
                      <Select
                        value={settings.percentPrefixFontWeight ?? 'normal'}
                        onValueChange={(v) => update({ percentPrefixFontWeight: v as FontWeight })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200" className="text-xs">Extra Light</SelectItem>
                          <SelectItem value="300" className="text-xs">Light</SelectItem>
                          <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                          <SelectItem value="500" className="text-xs">Medium</SelectItem>
                          <SelectItem value="600" className="text-xs">Semi-bold</SelectItem>
                          <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                          <SelectItem value="900" className="text-xs">Black</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={settings.percentPrefixFontSize ?? 12}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num)) update({ percentPrefixFontSize: Math.max(6, Math.min(100, num)) });
                          }}
                          min={6}
                          max={100}
                          step={1}
                          className="h-8 text-xs w-full"
                        />
                        <span className="text-xs text-gray-400 shrink-0">px</span>
                      </div>
                      <ColorPicker
                        value={settings.percentPrefixColor ?? '#333333'}
                        onChange={(color) => update({ percentPrefixColor: color })}
                      />
                    </div>
                  </div>
                  {/* Prefix vertical alignment */}
                  <SettingRow label="Vertical align">
                    <TabMenu
                      value={settings.percentPrefixVerticalAlign ?? 'bottom'}
                      onChange={(v) => update({ percentPrefixVerticalAlign: v as 'bottom' | 'center' | 'top' })}
                      options={[
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'center', label: 'Center' },
                        { value: 'top', label: 'Top' },
                      ]}
                    />
                  </SettingRow>
                  <NumberInput
                    label="% padding"
                    value={settings.percentPrefixPadding ?? 0}
                    onChange={(v) => update({ percentPrefixPadding: v })}
                    min={-20}
                    max={50}
                    step={1}
                    suffix="px"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <NumberInput
                      label="Padding top"
                      value={settings.percentPrefixPaddingTop ?? 0}
                      onChange={(v) => update({ percentPrefixPaddingTop: v })}
                      min={-30}
                      max={30}
                      step={1}
                      suffix="px"
                    />
                    <NumberInput
                      label="Padding bottom"
                      value={settings.percentPrefixPaddingBottom ?? 0}
                      onChange={(v) => update({ percentPrefixPaddingBottom: v })}
                      min={-30}
                      max={30}
                      step={1}
                      suffix="px"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* CUSTOM PREFIX (bar_chart_custom_2 only) */}
          {chartType === 'bar_chart_custom_2' && (
            <CustomPrefixSubSection />
          )}
        </div>
      )}

      {/* STACK LABELS (not for bar_chart_custom_2) */}
      {chartType !== 'bar_chart_custom_2' && (
        <>
          <SubHeader>Stack Labels</SubHeader>

          {/* Stack labels - 3-button tab menu */}
          <SettingRow label="Stack labels">
            <TabMenu
              value={settings.stackLabelMode}
              onChange={(v) => update({ stackLabelMode: v as StackLabelMode })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'net_sum', label: 'Net sum' },
                { value: 'separate', label: 'Separate +/-' },
              ]}
            />
          </SettingRow>
        </>
      )}
    </AccordionSection>
  );
}
