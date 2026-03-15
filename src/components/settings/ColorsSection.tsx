'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown, Search } from 'lucide-react';
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
  const [renamingThemeId, setRenamingThemeId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [themeSearch, setThemeSearch] = useState('');
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleRenameTheme = async () => {
    if (!renamingThemeId || !renameValue.trim()) {
      setRenamingThemeId(null);
      return;
    }
    try {
      const res = await fetch(`/api/themes/${renamingThemeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setThemes((prev) => prev.map((t) => t.id === renamingThemeId ? { ...t, name: renameValue.trim() } : t));
      }
    } catch (err) {
      console.error('Failed to rename theme:', err);
    }
    setRenamingThemeId(null);
  };

  const sortedFilteredThemes = useMemo(() => {
    let result = [...themes].sort((a, b) =>
      a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' })
    );
    if (themeSearch.trim()) {
      const q = themeSearch.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result;
  }, [themes, themeSearch]);

  const activeTheme = useMemo(() =>
    settings.themeId ? themes.find((t) => t.id === settings.themeId) : null
  , [settings.themeId, themes]);

  return (
    <AccordionSection id="colors" title="Colors">
      {/* Theme Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Theme</Label>
        <Popover open={themePopoverOpen} onOpenChange={(open) => { setThemePopoverOpen(open); if (!open) setThemeSearch(''); }}>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between h-8 w-full rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              {activeTheme ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex gap-0.5 shrink-0">
                    {(activeTheme.colors as string[]).slice(0, 5).map((color, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="truncate">{activeTheme.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">No theme</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
            {/* Search */}
            <div className="flex items-center border-b px-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={themeSearch}
                onChange={(e) => setThemeSearch(e.target.value)}
                placeholder="Search themes..."
                className="flex-1 h-8 px-2 text-xs bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
            {/* List */}
            <div className="max-h-[200px] overflow-y-auto py-1">
              <button
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${!settings.themeId ? 'bg-accent font-medium' : ''}`}
                onClick={() => { handleSelectTheme('__none__'); setThemePopoverOpen(false); }}
              >
                No theme
              </button>
              {sortedFilteredThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${settings.themeId === theme.id ? 'bg-accent font-medium' : ''}`}
                  onClick={() => { handleSelectTheme(String(theme.id)); setThemePopoverOpen(false); }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 shrink-0">
                      {(theme.colors as string[]).slice(0, 5).map((color, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="truncate">{theme.name}</span>
                  </div>
                </button>
              ))}
              {sortedFilteredThemes.length === 0 && themeSearch.trim() && (
                <div className="px-3 py-2 text-xs text-gray-400">No themes found</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {settings.themeId && !themes.find((t) => t.id === settings.themeId)?.isBuiltIn && (
          <div className="flex items-center gap-1">
            {renamingThemeId === settings.themeId ? (
              <form onSubmit={(e) => { e.preventDefault(); handleRenameTheme(); }} className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="text-xs border rounded px-2 h-8 flex-1 min-w-0"
                  autoFocus
                  onBlur={handleRenameTheme}
                  onKeyDown={(e) => { if (e.key === 'Escape') setRenamingThemeId(null); }}
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  setRenamingThemeId(settings.themeId!);
                  const theme = themes.find((t) => t.id === settings.themeId);
                  setRenameValue(theme?.name || '');
                }}
                className="text-[10px] text-blue-500 hover:text-blue-700"
              >
                Rename
              </button>
            )}
            <button
              onClick={() => handleDeleteTheme(settings.themeId!)}
              className="text-[10px] text-red-500 hover:text-red-700 shrink-0"
            >
              Delete
            </button>
          </div>
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
