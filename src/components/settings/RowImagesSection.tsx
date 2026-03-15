'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { SettingRow } from '@/components/shared/SettingRow';
import { ImageLibraryPicker } from '@/components/shared/ImageLibraryPicker';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings2, X, ImageIcon } from 'lucide-react';
import { parseCustomOverrides } from '@/lib/chart/utils';
import type { RowImagesSettings } from '@/types/chart';

interface LibraryImageEntry {
  id: number;
  name: string;
  dataUrl: string;
}

/* ── Image preview with remove + choose from library ── */
function ImageSelector({
  value,
  onRemove,
  onChoose,
  compact,
}: {
  value: string;
  onRemove: () => void;
  onChoose: () => void;
  compact?: boolean;
}) {
  if (value) {
    return (
      <div className={`relative group rounded-md border border-gray-200 bg-gray-50/50 ${compact ? 'p-1' : 'p-2'} flex items-center gap-2`}>
        <img
          src={value}
          alt="Selected"
          className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} object-contain rounded bg-white border border-gray-100`}
        />
        <button
          onClick={onChoose}
          className="text-[10px] text-blue-500 hover:text-blue-600 font-medium truncate flex-1 text-left"
        >
          Change
        </button>
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove image"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onChoose}
      className={`flex items-center justify-center gap-1.5 w-full rounded-md border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-colors ${
        compact ? 'py-2 px-2' : 'py-4 px-3'
      }`}
    >
      <ImageIcon className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} text-gray-300`} />
      <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-gray-400 font-medium`}>
        Choose from library
      </span>
    </button>
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
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageTarget, setImageTarget] = useState<'default' | string | null>(null);
  const [libraryImages, setLibraryImages] = useState<LibraryImageEntry[]>([]);
  const libraryFetched = useRef(false);

  const rowLabels = useMemo(() => {
    if (!data.length || !labelsColumn) return [];
    return data.map((row) => String(row[labelsColumn] ?? ''));
  }, [data, labelsColumn]);

  const update = useCallback(
    (updates: Partial<RowImagesSettings>) => {
      updateSettings('rowImages', updates);
    },
    [updateSettings],
  );

  // Fetch library images only when custom overrides exist (lazy — skip heavy fetch on editor open)
  useEffect(() => {
    if (libraryFetched.current || !settings.customImageOverrides) return;
    libraryFetched.current = true;
    fetch('/api/image-library')
      .then((res) => (res.ok ? res.json() : []))
      .then((imgs: LibraryImageEntry[]) => setLibraryImages(imgs))
      .catch(() => {});
  }, [settings.customImageOverrides]);

  // Resolve custom image overrides whenever text or library changes
  const resolveOverrides = useCallback(
    (text: string) => {
      const parsed = parseCustomOverrides(text);
      if (Object.keys(parsed).length === 0) {
        return {};
      }
      // Build case-insensitive lookup for library images: name → dataUrl
      const libByName: Record<string, string> = {};
      const libByNameLower: Record<string, string> = {};
      for (const img of libraryImages) {
        libByName[img.name] = img.dataUrl;
        libByNameLower[img.name.toLowerCase()] = img.dataUrl;
      }
      const resolved: Record<string, string> = {};
      for (const [rowName, imageName] of Object.entries(parsed)) {
        // Exact match first, then case-insensitive
        const url = libByName[imageName] || libByNameLower[imageName.toLowerCase()];
        if (url) {
          resolved[rowName] = url;
        }
      }
      return resolved;
    },
    [libraryImages],
  );

  // Re-resolve when library images load and there's existing override text
  useEffect(() => {
    if (libraryImages.length > 0 && settings.customImageOverrides) {
      const resolved = resolveOverrides(settings.customImageOverrides);
      update({ resolvedImageOverrides: resolved });
    }
  }, [libraryImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCustomOverridesChange = useCallback(
    (text: string) => {
      const resolved = resolveOverrides(text);
      update({ customImageOverrides: text, resolvedImageOverrides: resolved });
    },
    [resolveOverrides, update],
  );

  const openLibrary = (target: 'default' | string) => {
    setImageTarget(target);
    setShowImageLibrary(true);
  };

  const handleLibrarySelect = useCallback(
    (dataUrl: string) => {
      if (imageTarget === 'default') {
        update({ defaultUrl: dataUrl });
      } else if (imageTarget) {
        update({ perRowUrls: { ...settings.perRowUrls, [imageTarget]: dataUrl } });
      }
      setShowImageLibrary(false);
      setImageTarget(null);

      // Refresh library cache after selection (new images may have been added)
      fetch('/api/image-library')
        .then((res) => (res.ok ? res.json() : []))
        .then((imgs: LibraryImageEntry[]) => setLibraryImages(imgs))
        .catch(() => {});
    },
    [imageTarget, settings.perRowUrls, update],
  );

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

          {/* Default image — choose from library */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Default image</label>
            <ImageSelector
              value={settings.defaultUrl}
              onRemove={() => update({ defaultUrl: '' })}
              onChoose={() => openLibrary('default')}
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

          {/* Custom image overrides textarea */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Custom image overrides</label>
            <p className="text-[10px] text-gray-400">
              Map rows to library images by name. Format: RowName: ImageName (one per line).
            </p>
            <Textarea
              value={settings.customImageOverrides ?? ''}
              onChange={(e) => handleCustomOverridesChange(e.target.value)}
              placeholder={"CHP: CHP_1\nAKP: AKP_Logo\nMHP: mhp_icon"}
              className="text-xs font-mono min-h-[80px] resize-y"
              rows={4}
            />
          </div>

          {/* Per-row dialog */}
          <Dialog open={showPerRowDialog} onOpenChange={setShowPerRowDialog}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Per-row image overrides</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Choose different images and set dimensions for specific rows. Leave empty to use defaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {rowLabels.map((label) => (
                  <div key={label} className="space-y-1.5 p-2 rounded-md border border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <div className="space-y-1.5">
                      <ImageSelector
                        value={settings.perRowUrls[label] ?? ''}
                        onRemove={() => {
                          const newUrls = { ...settings.perRowUrls };
                          delete newUrls[label];
                          update({ perRowUrls: newUrls });
                        }}
                        onChoose={() => openLibrary(label)}
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

          {/* Image Library Picker */}
          <ImageLibraryPicker
            open={showImageLibrary}
            onOpenChange={(open) => {
              setShowImageLibrary(open);
              if (!open) setImageTarget(null);
            }}
            onSelect={handleLibrarySelect}
          />
        </>
      )}
    </AccordionSection>
  );
}
