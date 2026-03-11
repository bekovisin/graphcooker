'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { SettingRow } from '@/components/shared/SettingRow';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PaletteDropdown } from './PaletteDropdown';
import { PaletteEditor } from './PaletteEditor';
import { getPaletteColors } from '@/lib/chart/palettes';
import type { ColorMode, ColorsSettings } from '@/types/chart';

interface SavedTheme {
  id: number;
  name: string;
  colors: string[];
  isBuiltIn: boolean;
}

export function ColorsSection() {
  const settings = useEditorStore((s) => s.settings.colors);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const [editorOpen, setEditorOpen] = useState(false);
  const [themes, setThemes] = useState<SavedTheme[]>([]);
  const [, setLoadingThemes] = useState(false);

  const update = (updates: Partial<ColorsSettings>) => {
    updateSettings('colors', updates);
  };

  // Fetch themes from API
  const fetchThemes = useCallback(async () => {
    setLoadingThemes(true);
    try {
      const res = await fetch('/api/themes');
      if (res.ok) {
        const data = await res.json();
        setThemes(data);
      }
    } catch (err) {
      console.error('Failed to fetch themes:', err);
    } finally {
      setLoadingThemes(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Get current colors for the palette editor
  const currentColors = getPaletteColors(settings.palette, settings.customPaletteColors);

  const handleSelectPalette = (paletteId: string) => {
    update({
      palette: paletteId,
      customPaletteColors: undefined,
      themeId: undefined,
    });
  };

  const handleApplyCustomColors = (colors: string[]) => {
    update({
      customPaletteColors: colors,
      themeId: undefined,
    });
  };

  const handleSaveAsTheme = async (name: string, colors: string[]) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colors }),
      });

      if (res.ok) {
        const theme = await res.json();
        // Apply the theme
        update({
          customPaletteColors: colors,
          themeId: theme.id,
        });
        // Refresh themes list
        fetchThemes();
      }
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  const handleUpdateTheme = async (themeId: number, colors: string[]) => {
    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors }),
      });
      if (res.ok) {
        update({ customPaletteColors: colors });
        fetchThemes();
      }
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    if (themeId === '__none__') {
      update({ themeId: undefined, customPaletteColors: undefined });
      return;
    }
    const theme = themes.find((t) => t.id === parseInt(themeId));
    if (theme) {
      update({
        themeId: theme.id,
        customPaletteColors: theme.colors as string[],
      });
    }
  };

  const handleDeleteTheme = async (themeId: number) => {
    try {
      const res = await fetch(`/api/themes/${themeId}`, { method: 'DELETE' });
      if (res.ok) {
        // Clear theme if it was the active one
        if (settings.themeId === themeId) {
          update({ themeId: undefined, customPaletteColors: undefined });
        }
        fetchThemes();
      }
    } catch (err) {
      console.error('Failed to delete theme:', err);
    }
  };

  return (
    <AccordionSection id="colors" title="Colors">
      {/* Theme Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Theme</Label>
        <Select
          value={settings.themeId ? String(settings.themeId) : '__none__'}
          onValueChange={handleSelectTheme}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue placeholder="No theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs">
              No theme
            </SelectItem>
            {themes.map((theme) => (
              <SelectItem key={theme.id} value={String(theme.id)} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 shrink-0">
                    {(theme.colors as string[]).slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-[1px]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {settings.themeId && (
          <button
            onClick={() => handleDeleteTheme(settings.themeId!)}
            className="text-[10px] text-red-500 hover:text-red-700"
          >
            Delete this theme
          </button>
        )}
      </div>

      {/* Color Mode */}
      <SettingRow label="Color mode">
        <Select
          value={settings.colorMode}
          onValueChange={(v) => update({ colorMode: v as ColorMode })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="by_column" className="text-xs">By column</SelectItem>
            <SelectItem value="by_row" className="text-xs">By row</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Palette Dropdown */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Palette</Label>
        <PaletteDropdown
          selectedPaletteId={settings.palette}
          customPaletteColors={settings.customPaletteColors}
          onSelectPalette={handleSelectPalette}
          onEditPalette={() => setEditorOpen(true)}
        />
      </div>

      {/* Extend */}
      <SettingRow label="Extend" variant="inline">
        <Switch
          checked={settings.extend}
          onCheckedChange={(checked) => update({ extend: checked })}
        />
      </SettingRow>

      {/* Custom Overrides */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600 font-medium">Custom overrides</Label>
        <Textarea
          value={settings.customOverrides}
          onChange={(e) => update({ customOverrides: e.target.value })}
          placeholder={"SeriesName: #hexcolor\nAnother Series: #ff0000"}
          className="text-xs font-mono min-h-[80px] resize-y"
          rows={4}
        />
        <p className="text-[10px] text-gray-400">
          Override colors by name. Format: Name: #hex (one per line).
          Use column headers or row labels depending on color mode.
        </p>
      </div>

      {/* Palette Editor Dialog */}
      <PaletteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        colors={currentColors}
        onApply={handleApplyCustomColors}
        onSaveAsTheme={handleSaveAsTheme}
        onUpdateTheme={handleUpdateTheme}
        activeThemeId={settings.themeId ? themes.find((t) => t.id === settings.themeId)?.id : undefined}
        activeThemeIsBuiltIn={settings.themeId ? themes.find((t) => t.id === settings.themeId)?.isBuiltIn ?? true : true}
      />
    </AccordionSection>
  );
}
