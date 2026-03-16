'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderPlus, FolderOpen, Loader2 } from 'lucide-react';

const PRESET_BG_COLORS = [
  '#f9fafb', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#ede9fe', '#fee2e2', '#ffedd5', '#e0e7ff', '#cffafe',
  '#f3e8ff', '#fef9c3',
];

const PRESET_ICON_COLORS = [
  '#9ca3af', '#f59e0b', '#ec4899', '#3b82f6', '#10b981',
  '#8b5cf6', '#ef4444', '#f97316', '#6366f1', '#06b6d4',
  '#a855f7', '#eab308',
];

const PRESET_TEXT_COLORS = [
  '#374151', '#92400e', '#9d174d', '#1e40af', '#065f46',
  '#5b21b6', '#991b1b', '#9a3412', '#3730a3', '#155e75',
  '#6b21a8', '#854d0e',
];

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  defaultValue?: string;
  onConfirm: (name: string, colors?: { bgColor?: string; textColor?: string; iconColor?: string }) => void | Promise<void>;
}

export function FolderDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Create',
  defaultValue = '',
  onConfirm,
}: FolderDialogProps) {
  const [name, setName] = useState(defaultValue);
  const [bgColor, setBgColor] = useState('#f9fafb');
  const [iconColor, setIconColor] = useState('#9ca3af');
  const [textColor, setTextColor] = useState('#374151');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
      setBgColor('#f9fafb');
      setIconColor('#9ca3af');
      setTextColor('#374151');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open, defaultValue]);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      const hasCustomColors = bgColor !== '#f9fafb' || iconColor !== '#9ca3af' || textColor !== '#374151';
      await onConfirm(trimmed, hasCustomColors ? { bgColor, textColor, iconColor } : undefined);
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="flex-row items-start gap-4 space-y-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              <FolderPlus className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900 leading-6">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-gray-500 mt-1.5 leading-5">
                  {description}
                </DialogDescription>
              )}
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
                placeholder="Folder name..."
                className="mt-3 w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              />
            </div>
          </DialogHeader>

          {/* Color presets */}
          <div className="mt-4 space-y-3">
            {/* Preview */}
            <div
              className="rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center"
              style={{ backgroundColor: bgColor }}
            >
              <FolderOpen className="w-8 h-8" style={{ color: iconColor }} />
              <span className="text-xs mt-1 font-medium" style={{ color: textColor }}>
                {name.trim() || 'Preview'}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Background</label>
              <div className="grid grid-cols-12 gap-1">
                {PRESET_BG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                      bgColor === c ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setBgColor(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Icon</label>
              <div className="grid grid-cols-12 gap-1">
                {PRESET_ICON_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                      iconColor === c ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setIconColor(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Text</label>
              <div className="grid grid-cols-12 gap-1">
                {PRESET_TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                      textColor === c ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setTextColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-6 py-3 border-t gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading || !name.trim()}
            className="text-sm gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
