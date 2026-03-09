'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
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
import { Settings2, Upload, X, ImageIcon } from 'lucide-react';
import type { RowImagesSettings } from '@/types/chart';

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';

/* ── Reusable image uploader (drag & drop + browse) ── */
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
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(png|jpe?g|svg\+xml|webp)$/)) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') onChange(reader.result);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  if (value) {
    return (
      <div className={`relative group rounded-md border border-gray-200 bg-gray-50/50 ${compact ? 'p-1' : 'p-2'} flex items-center gap-2`}>
        <img
          src={value}
          alt="Uploaded"
          className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} object-contain rounded bg-white border border-gray-100`}
        />
        <span className="text-[10px] text-gray-400 truncate flex-1">Image uploaded</span>
        <button
          onClick={() => onChange('')}
          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove image"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed cursor-pointer transition-colors ${
        dragging
          ? 'border-blue-400 bg-blue-50/50'
          : 'border-gray-200 hover:border-gray-300 bg-gray-50/30 hover:bg-gray-50'
      } ${compact ? 'py-2 px-2' : 'py-4 px-3'}`}
    >
      {compact ? (
        <div className="flex items-center gap-1.5">
          <Upload className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">Drop or click</span>
        </div>
      ) : (
        <>
          <ImageIcon className="w-5 h-5 text-gray-300" />
          <span className="text-[10px] text-gray-400 text-center">
            Drag & drop or click to browse
          </span>
          <span className="text-[9px] text-gray-300">PNG, JPG, SVG, WEBP</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}

/* ── 4-way padding helper ── */
function FourWayPadding({
  top,
  right,
  bottom,
  left,
  onTopChange,
  onRightChange,
  onBottomChange,
  onLeftChange,
}: {
  top: number;
  right: number;
  bottom: number;
  left: number;
  onTopChange: (v: number) => void;
  onRightChange: (v: number) => void;
  onBottomChange: (v: number) => void;
  onLeftChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-500 font-medium">Padding (px)</span>
      <div className="grid grid-cols-4 gap-1.5">
        {([
          ['Top', top, onTopChange],
          ['Right', right, onRightChange],
          ['Bottom', bottom, onBottomChange],
          ['Left', left, onLeftChange],
        ] as const).map(([lbl, val, cb]) => (
          <div key={lbl}>
            <label className="text-[10px] text-gray-400 mb-0.5 block">{lbl}</label>
            <Input
              type="number"
              value={val}
              onChange={(e) => cb(parseFloat(e.target.value) || 0)}
              className="h-7 text-xs w-full"
              min={-50}
              max={200}
              step={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main section ── */
export function RowImagesSection() {
  const settings = useEditorStore((s) => s.settings.rowImages);
  const barLabelStyle = useEditorStore((s) => s.settings.labels.barLabelStyle);
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

  const isAxisMode = barLabelStyle !== 'above_bars';

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
          {/* Image position — only when axis labels visible */}
          {isAxisMode && (
            <div className="space-y-1">
              <label className="text-xs text-gray-600 font-medium">Image position</label>
              <div className="grid grid-cols-2 gap-0 rounded-lg border border-gray-200 overflow-hidden">
                {(['left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => update({ imagePosition: pos })}
                    className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                      settings.imagePosition === pos
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pos === 'left' ? 'Left of label' : 'Right of label'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default image upload */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Default image</label>
            <ImageUploader
              value={settings.defaultUrl}
              onChange={(dataUrl) => update({ defaultUrl: dataUrl })}
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
                  Upload different images and set dimensions for specific rows. Leave empty to use defaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {rowLabels.map((label) => (
                  <div key={label} className="space-y-1.5 p-2 rounded-md border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <div className="space-y-1.5">
                      <ImageUploader
                        value={settings.perRowUrls[label] ?? ''}
                        onChange={(dataUrl) => {
                          const newUrls = { ...settings.perRowUrls };
                          if (dataUrl) {
                            newUrls[label] = dataUrl;
                          } else {
                            delete newUrls[label];
                          }
                          update({ perRowUrls: newUrls });
                        }}
                        compact
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
