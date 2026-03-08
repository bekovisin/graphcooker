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
import type {
  InfoColumnSettings,
  InfoPosition,
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

export function InfoColumnSection() {
  const settings = useEditorStore((s) => s.settings.infoColumn);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);

  const [showPerRowDialog, setShowPerRowDialog] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
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

          {/* Default text styling */}
          <SubHeader>Default text styling</SubHeader>

          <NumberInput
            label="Font size"
            value={settings.fontSize}
            onChange={(v) => update({ fontSize: v })}
            min={6}
            max={32}
            step={1}
            suffix="px"
          />

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

          <SettingRow label="Font weight">
            <Select
              value={String(settings.fontWeight)}
              onValueChange={(v) => update({ fontWeight: v as FontWeight })}
            >
              <SelectTrigger className="h-8 text-xs w-full">
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
          </SettingRow>

          <SettingRow label="Color">
            <ColorPicker
              value={settings.color}
              onChange={(color) => update({ color })}
            />
          </SettingRow>

          <NumberInput
            label="Letter spacing"
            value={settings.letterSpacing}
            onChange={(v) => update({ letterSpacing: v })}
            min={-2}
            max={10}
            step={0.5}
            suffix="px"
          />

          <NumberInput
            label="Padding"
            value={settings.padding}
            onChange={(v) => update({ padding: v })}
            min={0}
            max={50}
            step={1}
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
                  <div key={i} className="space-y-1.5 p-2 rounded-md border border-gray-100">
                    <Label className="text-xs font-medium">{label || `Row ${i + 1}`}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Color</label>
                        <ColorPicker
                          value={settings.perRowColors[String(i)] || settings.color}
                          onChange={(color) =>
                            update({
                              perRowColors: { ...settings.perRowColors, [String(i)]: color },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Font size</label>
                        <Input
                          type="number"
                          value={settings.perRowFontSizes[String(i)] ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowFontSizes: { ...settings.perRowFontSizes, [String(i)]: v },
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
                          value={settings.perRowFontWeights[String(i)] || ''}
                          onValueChange={(v) =>
                            update({
                              perRowFontWeights: {
                                ...settings.perRowFontWeights,
                                [String(i)]: v as FontWeight,
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
                          value={settings.perRowLetterSpacings[String(i)] ?? ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowLetterSpacings: {
                                  ...settings.perRowLetterSpacings,
                                  [String(i)]: v,
                                },
                              });
                            }
                          }}
                          className="h-7 text-xs w-full"
                          placeholder={String(settings.letterSpacing)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Padding</label>
                        <Input
                          type="number"
                          value={settings.perRowPaddings[String(i)] ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) {
                              update({
                                perRowPaddings: { ...settings.perRowPaddings, [String(i)]: v },
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

          {/* Icon sub-section */}
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
                  <SettingRow label="Icon name">
                    <Input
                      value={settings.icon.iconName}
                      onChange={(e) =>
                        update({ icon: { ...settings.icon, iconName: e.target.value } })
                      }
                      className="h-7 text-xs w-full"
                      placeholder="e.g. circle, arrow-up"
                    />
                  </SettingRow>

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

                  <SettingRow label="Default color">
                    <ColorPicker
                      value={settings.icon.defaultColor}
                      onChange={(color) =>
                        update({ icon: { ...settings.icon, defaultColor: color } })
                      }
                    />
                  </SettingRow>

                  {/* Per-row icon colors */}
                  {rowLabels.length > 0 && (
                    <div className="space-y-1 mt-1">
                      <Label className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Per-row icon colors
                      </Label>
                      {rowLabels.map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0">
                            {label || `Row ${i + 1}`}
                          </span>
                          <ColorPicker
                            value={
                              settings.icon.perRowColors[String(i)] ||
                              settings.icon.defaultColor
                            }
                            onChange={(color) =>
                              update({
                                icon: {
                                  ...settings.icon,
                                  perRowColors: {
                                    ...settings.icon.perRowColors,
                                    [String(i)]: color,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Border Left sub-section */}
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

          {/* Border Right sub-section */}
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
