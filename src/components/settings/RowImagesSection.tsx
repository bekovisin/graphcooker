'use client';

import { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { SettingRow } from '@/components/shared/SettingRow';
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
import type { RowImagesSettings } from '@/types/chart';

function FourWayPadding({
  top, right, bottom, left,
  onTopChange, onRightChange, onBottomChange, onLeftChange,
}: {
  top: number; right: number; bottom: number; left: number;
  onTopChange: (v: number) => void;
  onRightChange: (v: number) => void;
  onBottomChange: (v: number) => void;
  onLeftChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-500 font-medium">Padding (px)</span>
      <div className="grid grid-cols-4 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Top</label>
          <Input
            type="number"
            value={top}
            onChange={(e) => onTopChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs w-full"
            min={-50}
            max={200}
            step={1}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Right</label>
          <Input
            type="number"
            value={right}
            onChange={(e) => onRightChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs w-full"
            min={-50}
            max={200}
            step={1}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Bottom</label>
          <Input
            type="number"
            value={bottom}
            onChange={(e) => onBottomChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs w-full"
            min={-50}
            max={200}
            step={1}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Left</label>
          <Input
            type="number"
            value={left}
            onChange={(e) => onLeftChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs w-full"
            min={-50}
            max={200}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}

export function RowImagesSection() {
  const settings = useEditorStore((s) => s.settings.rowImages);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const data = useEditorStore((s) => s.data);
  const labelsColumn = useEditorStore((s) => s.columnMapping.labels);

  const [showPerRowDialog, setShowPerRowDialog] = useState(false);

  const rowLabels = useMemo(() => {
    if (!data.length || !labelsColumn) return [];
    return data.map((row) => String(row[labelsColumn] ?? ''));
  }, [data, labelsColumn]);

  const update = (updates: Partial<RowImagesSettings>) => {
    updateSettings('rowImages', updates);
  };

  return (
    <AccordionSection id="row-images" title="Row images">
      <SettingRow label="Show row images" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
          {/* Default image URL */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Default image URL</label>
            <Input
              type="text"
              value={settings.defaultUrl}
              onChange={(e) => update({ defaultUrl: e.target.value })}
              placeholder="https://example.com/image.png"
              className="h-8 text-xs"
            />
          </div>

          {/* Default dimensions */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600 font-medium">Default dimensions</span>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={settings.defaultWidth}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) update({ defaultWidth: Math.max(1, num) });
                    }}
                    min={1}
                    max={500}
                    step={1}
                    className="h-7 text-xs w-full"
                  />
                  <span className="text-xs text-gray-400 shrink-0">px</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-0.5 block">Height</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={settings.defaultHeight}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) update({ defaultHeight: Math.max(1, num) });
                    }}
                    min={1}
                    max={500}
                    step={1}
                    className="h-7 text-xs w-full"
                  />
                  <span className="text-xs text-gray-400 shrink-0">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Border radius */}
          <NumberInput
            label="Border radius"
            value={settings.borderRadius}
            onChange={(v) => update({ borderRadius: v })}
            min={0}
            max={100}
            step={1}
            suffix="px"
          />

          {/* Custom padding toggle */}
          <SettingRow label="Custom padding" variant="inline">
            <Switch
              checked={settings.customPadding}
              onCheckedChange={(checked) => update({ customPadding: checked })}
            />
          </SettingRow>

          {settings.customPadding && (
            <FourWayPadding
              top={settings.paddingTop}
              right={settings.paddingRight}
              bottom={settings.paddingBottom}
              left={settings.paddingLeft}
              onTopChange={(v) => update({ paddingTop: v })}
              onRightChange={(v) => update({ paddingRight: v })}
              onBottomChange={(v) => update({ paddingBottom: v })}
              onLeftChange={(v) => update({ paddingLeft: v })}
            />
          )}

          {/* Per-row image overrides button */}
          <button
            onClick={() => setShowPerRowDialog(true)}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Per-row image overrides
          </button>

          {/* Per-row dialog */}
          <Dialog open={showPerRowDialog} onOpenChange={setShowPerRowDialog}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Per-row image overrides</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Set different images and dimensions for specific rows. Leave empty to use defaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {rowLabels.map((label) => (
                  <div key={label} className="space-y-1.5 p-2 rounded-md border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <div className="space-y-1.5">
                      <Input
                        type="text"
                        value={settings.perRowUrls[label] ?? ''}
                        onChange={(e) => {
                          const newUrls = { ...settings.perRowUrls };
                          if (e.target.value) {
                            newUrls[label] = e.target.value;
                          } else {
                            delete newUrls[label];
                          }
                          update({ perRowUrls: newUrls });
                        }}
                        placeholder="Image URL"
                        className="h-7 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
                          <Input
                            type="number"
                            value={settings.perRowWidths[label] ?? ''}
                            onChange={(e) => {
                              const newWidths = { ...settings.perRowWidths };
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num) && num > 0) {
                                newWidths[label] = num;
                              } else {
                                delete newWidths[label];
                              }
                              update({ perRowWidths: newWidths });
                            }}
                            placeholder={String(settings.defaultWidth)}
                            className="h-7 text-xs w-full"
                            min={1}
                            max={500}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-0.5 block">Height</label>
                          <Input
                            type="number"
                            value={settings.perRowHeights[label] ?? ''}
                            onChange={(e) => {
                              const newHeights = { ...settings.perRowHeights };
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num) && num > 0) {
                                newHeights[label] = num;
                              } else {
                                delete newHeights[label];
                              }
                              update({ perRowHeights: newHeights });
                            }}
                            placeholder={String(settings.defaultHeight)}
                            className="h-7 text-xs w-full"
                            min={1}
                            max={500}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {rowLabels.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No data rows available. Add data to configure per-row images.
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
