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
import { Settings2, ChevronDown, ChevronRight } from 'lucide-react';
import { LucideIconPicker, renderIconElements } from '@/components/shared/LucideIconPicker';
import { LUCIDE_ICONS } from '@/lib/chart/lucideIconData';
import type {
  InfoColumnSettings,
  InfoPosition,
  InfoVerticalAlignment,
  InfoDataType,
  FontWeight,
  BorderLineStyle,
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

function TwoWayPadding({
  vertical, horizontal,
  onVerticalChange, onHorizontalChange,
}: {
  vertical: number; horizontal: number;
  onVerticalChange: (v: number) => void;
  onHorizontalChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-500 font-medium">Padding (px)</span>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Vertical</label>
          <Input
            type="number"
            value={vertical}
            onChange={(e) => onVerticalChange(parseFloat(e.target.value) || 0)}
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
            value={horizontal}
            onChange={(e) => onHorizontalChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs w-full"
            min={-50}
            max={200}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
}

export function InfoColumnSection() {
  const settings = useEditorStore((s) => s.settings.infoColumn);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);

  const [showPerRowDialog, setShowPerRowDialog] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showPerRowIconDialog, setShowPerRowIconDialog] = useState(false);
  const [perRowIconPickerLabel, setPerRowIconPickerLabel] = useState<string | null>(null);
  const [borderLeftOpen, setBorderLeftOpen] = useState(false);
  const [borderRightOpen, setBorderRightOpen] = useState(false);

  const rowLabels = useMemo(() => {
    if (!data.length || !labelsColumn) return [];
    return data.map((row) => String(row[labelsColumn] ?? ''));
  }, [data, labelsColumn]);

  const update = (updates: Partial<InfoColumnSettings>) => {
    updateSettings('infoColumn', updates);
  };

  return (
    <AccordionSection id="info-column" title="Info column">
      <SettingRow label="Show info column" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
          <SettingRow label="Position">
            <Select
              value={settings.position}
              onValueChange={(v) => update({ position: v as InfoPosition })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left" className="text-xs">Left</SelectItem>
                <SelectItem value="right" className="text-xs">Right</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Vertical alignment">
            <Select
              value={settings.verticalAlignment ?? 'center'}
              onValueChange={(v) => update({ verticalAlignment: v as InfoVerticalAlignment })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top" className="text-xs">Top</SelectItem>
                <SelectItem value="center" className="text-xs">Center</SelectItem>
                <SelectItem value="bottom" className="text-xs">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Data type">
            <Select
              value={settings.dataType ?? 'number'}
              onValueChange={(v) => update({ dataType: v as InfoDataType })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number" className="text-xs">Number</SelectItem>
                <SelectItem value="text" className="text-xs">Text</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {/* ── Padding section ── */}
          <SettingRow label="Custom padding" variant="inline">
            <Switch
              checked={settings.customPadding ?? false}
              onCheckedChange={(checked) => update({ customPadding: checked })}
            />
          </SettingRow>

          {settings.customPadding ? (
            <TwoWayPadding
              vertical={settings.paddingVertical ?? 0}
              horizontal={settings.paddingHorizontal ?? 8}
              onVerticalChange={(v) => update({ paddingVertical: v })}
              onHorizontalChange={(v) => update({ paddingHorizontal: v })}
            />
          ) : (
            <NumberInput
              label="Padding"
              value={settings.padding}
              onChange={(v) => update({ padding: v })}
              min={-50}
              max={50}
              step={0.1}
              arrowStep={1}
              suffix="px"
            />
          )}

          {/* ── Default text styling ── */}
          <SubHeader>Default text styling</SubHeader>

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
                {fontFamilyOptions.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>
                    {f.split(',')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          {/* Font styling: weight+italic, size, color in grid */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600 font-medium">Font styling</span>
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-1.5 items-end">
              <Select
                value={String(settings.fontWeight)}
                onValueChange={(v) => update({ fontWeight: v as FontWeight })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300" className="text-xs">Light</SelectItem>
                  <SelectItem value="400" className="text-xs">Normal</SelectItem>
                  <SelectItem value="500" className="text-xs">Medium</SelectItem>
                  <SelectItem value="600" className="text-xs">Semibold</SelectItem>
                  <SelectItem value="700" className="text-xs">Bold</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => update({ fontStyle: (settings.fontStyle ?? 'normal') === 'normal' ? 'italic' : 'normal' })}
                className={`h-8 w-8 flex items-center justify-center rounded-md border text-xs font-serif italic shrink-0 ${
                  (settings.fontStyle ?? 'normal') === 'italic'
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
                  value={settings.fontSize}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) update({ fontSize: Math.max(6, Math.min(48, num)) });
                  }}
                  min={6}
                  max={48}
                  step={1}
                  className="h-8 text-xs w-full"
                />
                <span className="text-xs text-gray-400 shrink-0">px</span>
              </div>
              <ColorPicker
                value={settings.color}
                onChange={(color) => update({ color })}
              />
            </div>
          </div>

          {/* Letter spacing */}
          <NumberInput
            label="Letter spacing"
            value={settings.letterSpacing}
            onChange={(v) => update({ letterSpacing: v })}
            min={-10}
            max={20}
            step={0.01}
            arrowStep={0.1}
            suffix="px"
          />

          {/* Per-row overrides button */}
          <button
            onClick={() => setShowPerRowDialog(true)}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Per-row styling overrides
          </button>

          {/* Per-row dialog */}
          <Dialog open={showPerRowDialog} onOpenChange={setShowPerRowDialog}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Per-row info styling</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Override default styling for specific rows. Leave empty to use defaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {rowLabels.map((label, i) => (
                  <div key={label || i} className="space-y-1.5 p-2 rounded-md border border-gray-100">
                    <Label className="text-xs font-medium">{label || `Row ${i + 1}`}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
                        <ColorPicker
                          value={settings.perRowColors[label] || settings.color}
                          onChange={(color) =>
                            update({
                              perRowColors: { ...settings.perRowColors, [label]: color },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Font size</label>
                        <Input
                          type="number"
                          value={settings.perRowFontSizes[label] ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowFontSizes: { ...settings.perRowFontSizes, [label]: v },
                              });
                            }
                          }}
                          className="h-7 text-xs w-full"
                          placeholder={String(settings.fontSize)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Font weight</label>
                        <Select
                          value={settings.perRowFontWeights[label] || ''}
                          onValueChange={(v) =>
                            update({
                              perRowFontWeights: {
                                ...settings.perRowFontWeights,
                                [label]: v as FontWeight,
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300" className="text-xs">Light</SelectItem>
                            <SelectItem value="400" className="text-xs">Normal</SelectItem>
                            <SelectItem value="500" className="text-xs">Medium</SelectItem>
                            <SelectItem value="600" className="text-xs">Semibold</SelectItem>
                            <SelectItem value="700" className="text-xs">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Letter spacing</label>
                        <Input
                          type="number"
                          value={settings.perRowLetterSpacings[label] ?? ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowLetterSpacings: {
                                  ...settings.perRowLetterSpacings,
                                  [label]: v,
                                },
                              });
                            }
                          }}
                          className="h-7 text-xs w-full"
                          step="0.01"
                          placeholder={String(settings.letterSpacing)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Padding</label>
                        <Input
                          type="number"
                          value={settings.perRowPaddings[label] ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowPaddings: { ...settings.perRowPaddings, [label]: v },
                              });
                            }
                          }}
                          className="h-7 text-xs w-full"
                          placeholder={String(settings.padding)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {rowLabels.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No data rows. Add data to configure per-row overrides.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* ── Icon sub-section ── */}
          <SubHeader collapsible open={iconOpen} onToggle={() => setIconOpen(!iconOpen)}>
            Icon
          </SubHeader>
          {iconOpen && (
            <>
              <SettingRow label="Show icon" variant="inline">
                <Switch
                  checked={settings.icon.show}
                  onCheckedChange={(checked) =>
                    update({ icon: { ...settings.icon, show: checked } })
                  }
                />
              </SettingRow>

              {settings.icon.show && (
                <>
                  <SettingRow label="Icon">
                    <button
                      onClick={() => setShowIconPicker(true)}
                      className="flex items-center gap-2 h-7 px-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 w-full"
                    >
                      {LUCIDE_ICONS[settings.icon.iconName] && (
                        <span className="shrink-0">
                          {renderIconElements(LUCIDE_ICONS[settings.icon.iconName], 14, '#374151', 2)}
                        </span>
                      )}
                      <span className="truncate text-left flex-1">{settings.icon.iconName || 'Select icon...'}</span>
                    </button>
                  </SettingRow>
                  <LucideIconPicker
                    open={showIconPicker}
                    onOpenChange={setShowIconPicker}
                    value={settings.icon.iconName}
                    onSelect={(name) =>
                      update({ icon: { ...settings.icon, iconName: name } })
                    }
                  />

                  {/* Icon size + Border width side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Icon size"
                      value={settings.icon.size}
                      onChange={(v) =>
                        update({ icon: { ...settings.icon, size: v } })
                      }
                      min={4}
                      max={40}
                      step={1}
                      suffix="px"
                    />
                    <NumberInput
                      label="Border width"
                      value={settings.icon.borderWidth}
                      onChange={(v) =>
                        update({ icon: { ...settings.icon, borderWidth: v } })
                      }
                      min={0}
                      max={5}
                      step={0.5}
                      suffix="px"
                    />
                  </div>

                  <SettingRow label="Default color">
                    <ColorPicker
                      value={settings.icon.defaultColor}
                      onChange={(color) =>
                        update({ icon: { ...settings.icon, defaultColor: color } })
                      }
                    />
                  </SettingRow>

                  {/* Icon custom padding */}
                  <SettingRow label="Custom padding" variant="inline">
                    <Switch
                      checked={settings.icon.customPadding ?? false}
                      onCheckedChange={(checked) =>
                        update({ icon: { ...settings.icon, customPadding: checked } })
                      }
                    />
                  </SettingRow>

                  {settings.icon.customPadding && (
                    <TwoWayPadding
                      vertical={settings.icon.paddingVertical ?? 0}
                      horizontal={settings.icon.paddingHorizontal ?? 0}
                      onVerticalChange={(v) => update({ icon: { ...settings.icon, paddingVertical: v } })}
                      onHorizontalChange={(v) => update({ icon: { ...settings.icon, paddingHorizontal: v } })}
                    />
                  )}

                  {/* Per-row icon overrides button */}
                  {rowLabels.length > 0 && (
                    <button
                      onClick={() => setShowPerRowIconDialog(true)}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Per-row icon overrides
                    </button>
                  )}

                  {/* Per-row icon dialog */}
                  <Dialog open={showPerRowIconDialog} onOpenChange={setShowPerRowIconDialog}>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-sm">Per-row icon overrides</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                          Override the default icon and color for specific rows.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        {rowLabels.map((label, i) => (
                          <div key={label || i} className="space-y-1.5 p-2 rounded-md border border-gray-100">
                            <Label className="text-xs font-medium">{label || `Row ${i + 1}`}</Label>
                            <div className="flex items-center gap-2">
                              {/* Per-row icon picker */}
                              <button
                                onClick={() => setPerRowIconPickerLabel(label)}
                                className="flex items-center gap-1 h-7 px-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 shrink-0"
                                title="Change icon"
                              >
                                <span className="shrink-0">
                                  {renderIconElements(
                                    LUCIDE_ICONS[settings.icon.perRowIconNames?.[label] ?? settings.icon.iconName] || LUCIDE_ICONS['circle'],
                                    14, '#374151', 2
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                  {settings.icon.perRowIconNames?.[label] ?? settings.icon.iconName}
                                </span>
                              </button>
                              {/* Per-row icon color */}
                              <ColorPicker
                                value={
                                  settings.icon.perRowColors[label] ||
                                  settings.icon.defaultColor
                                }
                                onChange={(color) =>
                                  update({
                                    icon: {
                                      ...settings.icon,
                                      perRowColors: {
                                        ...settings.icon.perRowColors,
                                        [label]: color,
                                      },
                                    },
                                  })
                                }
                              />
                            </div>
                            <LucideIconPicker
                              open={perRowIconPickerLabel === label}
                              onOpenChange={(open) => { if (!open) setPerRowIconPickerLabel(null); }}
                              value={settings.icon.perRowIconNames?.[label] ?? settings.icon.iconName}
                              onSelect={(name) => {
                                update({
                                  icon: {
                                    ...settings.icon,
                                    perRowIconNames: {
                                      ...settings.icon.perRowIconNames,
                                      [label]: name,
                                    },
                                  },
                                });
                                setPerRowIconPickerLabel(null);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </>
          )}

          {/* ── Border Left sub-section ── */}
          <SubHeader
            collapsible
            open={borderLeftOpen}
            onToggle={() => setBorderLeftOpen(!borderLeftOpen)}
          >
            Border left
          </SubHeader>
          {borderLeftOpen && (
            <>
              <SettingRow label="Show border" variant="inline">
                <Switch
                  checked={settings.borderLeft.show}
                  onCheckedChange={(checked) =>
                    update({ borderLeft: { ...settings.borderLeft, show: checked } })
                  }
                />
              </SettingRow>
              {settings.borderLeft.show && (
                <>
                  <SettingRow label="Color">
                    <ColorPicker
                      value={settings.borderLeft.color}
                      onChange={(color) =>
                        update({ borderLeft: { ...settings.borderLeft, color } })
                      }
                    />
                  </SettingRow>
                  <NumberInput
                    label="Width"
                    value={settings.borderLeft.width}
                    onChange={(v) =>
                      update({ borderLeft: { ...settings.borderLeft, width: v } })
                    }
                    min={0.5}
                    max={5}
                    step={0.5}
                    suffix="px"
                  />
                  <SettingRow label="Manual length" variant="inline">
                    <Switch
                      checked={settings.borderLeft.manualLength ?? false}
                      onCheckedChange={(checked) =>
                        update({ borderLeft: { ...settings.borderLeft, manualLength: checked } })
                      }
                    />
                  </SettingRow>
                  {settings.borderLeft.manualLength && (
                    <NumberInput
                      label="Length"
                      value={settings.borderLeft.manualLengthValue ?? 20}
                      onChange={(v) =>
                        update({ borderLeft: { ...settings.borderLeft, manualLengthValue: v } })
                      }
                      min={1}
                      max={200}
                      step={1}
                      suffix="px"
                    />
                  )}
                  <NumberInput
                    label="Padding"
                    value={settings.borderLeft.padding ?? 0}
                    onChange={(v) =>
                      update({ borderLeft: { ...settings.borderLeft, padding: v } })
                    }
                    min={-50}
                    max={50}
                    step={0.1}
                    suffix="px"
                  />
                  <SettingRow label="Style">
                    <Select
                      value={settings.borderLeft.style}
                      onValueChange={(v) =>
                        update({
                          borderLeft: { ...settings.borderLeft, style: v as BorderLineStyle },
                        })
                      }
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
                </>
              )}
            </>
          )}

          {/* ── Border Right sub-section ── */}
          <SubHeader
            collapsible
            open={borderRightOpen}
            onToggle={() => setBorderRightOpen(!borderRightOpen)}
          >
            Border right
          </SubHeader>
          {borderRightOpen && (
            <>
              <SettingRow label="Show border" variant="inline">
                <Switch
                  checked={settings.borderRight.show}
                  onCheckedChange={(checked) =>
                    update({ borderRight: { ...settings.borderRight, show: checked } })
                  }
                />
              </SettingRow>
              {settings.borderRight.show && (
                <>
                  <SettingRow label="Color">
                    <ColorPicker
                      value={settings.borderRight.color}
                      onChange={(color) =>
                        update({ borderRight: { ...settings.borderRight, color } })
                      }
                    />
                  </SettingRow>
                  <NumberInput
                    label="Width"
                    value={settings.borderRight.width}
                    onChange={(v) =>
                      update({ borderRight: { ...settings.borderRight, width: v } })
                    }
                    min={0.5}
                    max={5}
                    step={0.5}
                    suffix="px"
                  />
                  <SettingRow label="Manual length" variant="inline">
                    <Switch
                      checked={settings.borderRight.manualLength ?? false}
                      onCheckedChange={(checked) =>
                        update({ borderRight: { ...settings.borderRight, manualLength: checked } })
                      }
                    />
                  </SettingRow>
                  {settings.borderRight.manualLength && (
                    <NumberInput
                      label="Length"
                      value={settings.borderRight.manualLengthValue ?? 20}
                      onChange={(v) =>
                        update({ borderRight: { ...settings.borderRight, manualLengthValue: v } })
                      }
                      min={1}
                      max={200}
                      step={1}
                      suffix="px"
                    />
                  )}
                  <NumberInput
                    label="Padding"
                    value={settings.borderRight.padding ?? 0}
                    onChange={(v) =>
                      update({ borderRight: { ...settings.borderRight, padding: v } })
                    }
                    min={-50}
                    max={50}
                    step={0.1}
                    suffix="px"
                  />
                  <SettingRow label="Style">
                    <Select
                      value={settings.borderRight.style}
                      onValueChange={(v) =>
                        update({
                          borderRight: { ...settings.borderRight, style: v as BorderLineStyle },
                        })
                      }
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
                </>
              )}
            </>
          )}
        </>
      )}
    </AccordionSection>
  );
}
