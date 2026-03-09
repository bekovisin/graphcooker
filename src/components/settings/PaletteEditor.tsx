'use client';

import { useState, useEffect, useRef } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GripVertical, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface PaletteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: string[];
  onApply: (colors: string[]) => void;
  onSaveAsTheme: (name: string, colors: string[]) => void;
  onUpdateTheme?: (themeId: number, colors: string[]) => void;
  activeThemeId?: number;
  activeThemeIsBuiltIn?: boolean;
}

export function PaletteEditor({
  open,
  onOpenChange,
  colors: initialColors,
  onApply,
  onSaveAsTheme,
  onUpdateTheme,
  activeThemeId,
  activeThemeIsBuiltIn,
}: PaletteEditorProps) {
  const [colors, setColors] = useState<string[]>(initialColors);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [themeName, setThemeName] = useState('');

  // Sync colors whenever the dialog opens (covers both prop-driven and user-driven open)
  useEffect(() => {
    if (open) {
      setColors(initialColors);
    }
  }, [open, initialColors]);

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const removeColor = (index: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, i) => i !== index));
  };

  const addColor = () => {
    setColors([...colors, '#888888']);
  };

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const newColors = [...colors];
    const [dragged] = newColors.splice(dragIndex, 1);
    newColors.splice(dropIndex, 0, dragged);
    setColors(newColors);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleApply = () => {
    onApply(colors);
    onOpenChange(false);
  };

  const handleSaveAsTheme = () => {
    if (!themeName.trim()) return;
    onSaveAsTheme(themeName.trim(), colors);
    setThemeName('');
    setShowSaveDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Color Palette</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {colors.map((color, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 group rounded-md transition-colors ${
                  dragOverIndex === index
                    ? 'bg-blue-50 border border-blue-200 border-dashed'
                    : 'border border-transparent'
                } ${dragIndexRef.current === index ? 'opacity-40' : ''}`}
              >
                {/* Drag handle */}
                <div className="shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Color swatch with picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-md border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start" side="right">
                    <div className="space-y-3">
                      <HexColorPicker color={color} onChange={(c) => updateColor(index, c)} />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#</span>
                        <HexColorInput
                          color={color}
                          onChange={(c) => updateColor(index, c)}
                          className="flex h-8 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          prefixed={false}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Hex value display */}
                <span className="text-xs font-mono text-gray-500 flex-1">{color}</span>

                {/* Delete button */}
                <button
                  onClick={() => removeColor(index)}
                  disabled={colors.length <= 1}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-opacity p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add color */}
          <button
            onClick={addColor}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add color
          </button>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save as theme
              </Button>
              {activeThemeId && !activeThemeIsBuiltIn && onUpdateTheme && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateTheme(activeThemeId, colors);
                    onOpenChange(false);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Update theme
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply} className="text-xs">
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save as theme dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Save as Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-600">Theme name</label>
              <Input
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="My custom theme..."
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAsTheme();
                }}
              />
            </div>
            {/* Preview */}
            <div className="flex gap-0.5">
              {colors.slice(0, 10).map((color, i) => (
                <div
                  key={i}
                  className="h-5 flex-1 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAsTheme}
              disabled={!themeName.trim()}
              className="text-xs"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
