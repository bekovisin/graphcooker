'use client';

import { useState, useEffect } from 'react';
import { useEditorStore, PreviewDevice } from '@/store/editorStore';
import { Monitor, Tablet, Smartphone, Maximize2, Settings2, Paintbrush, Undo2, Redo2 } from 'lucide-react';
import { undo, redo } from '@/lib/history';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker, HexColorInput } from 'react-colorful';

const devices: { id: PreviewDevice; icon: React.ReactNode; label: string }[] = [
  { id: 'fullscreen', icon: <Maximize2 className="w-4 h-4" />, label: 'Fullscreen' },
  { id: 'desktop', icon: <Monitor className="w-4 h-4" />, label: 'Desktop' },
  { id: 'tablet', icon: <Tablet className="w-4 h-4" />, label: 'Tablet' },
  { id: 'mobile', icon: <Smartphone className="w-4 h-4" />, label: 'Mobile' },
  { id: 'custom', icon: <Settings2 className="w-4 h-4" />, label: 'Custom size' },
];

function WidthInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
      onBlur={() => {
        const num = parseInt(localValue);
        if (!isNaN(num) && num >= 100 && num <= 3000) {
          onChange(num);
        } else {
          setLocalValue(String(value));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const num = parseInt(localValue);
          if (!isNaN(num) && num >= 100 && num <= 3000) {
            onChange(num);
          } else {
            setLocalValue(String(value));
          }
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-16 h-7 rounded-md border border-gray-200 px-2 text-xs text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function HeightInput({
  value,
  isAuto,
  onChange,
  onSetAuto,
}: {
  value: number;
  isAuto: boolean;
  onChange: (v: number) => void;
  onSetAuto: () => void;
}) {
  const [localValue, setLocalValue] = useState(isAuto ? 'auto' : String(value));

  useEffect(() => {
    setLocalValue(isAuto ? 'auto' : String(value));
  }, [value, isAuto]);

  const commit = () => {
    const trimmed = localValue.trim().toLowerCase();
    if (trimmed === 'auto' || trimmed === '') {
      onSetAuto();
      setLocalValue('auto');
      return;
    }
    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 100 && num <= 5000) {
      onChange(num);
    } else {
      setLocalValue(isAuto ? 'auto' : String(value));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-16 h-7 rounded-md border border-gray-200 px-2 text-xs text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="auto"
      />
      {!isAuto && (
        <button
          onClick={onSetAuto}
          className="h-7 px-2 rounded-md border border-gray-200 text-[10px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          Auto
        </button>
      )}
    </div>
  );
}

export function ResponsiveToolbar() {
  const {
    previewDevice,
    setPreviewDevice,
    customPreviewWidth,
    customPreviewHeight,
    setCustomPreviewSize,
    canvasBackgroundColor,
    setCanvasBackgroundColor,
    settings,
    updateSettings,
    _undoLen,
    _redoLen,
  } = useEditorStore();

  const isAutoHeight = settings.chartType.heightMode === 'auto';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {devices.map((device) => (
            <Tooltip key={device.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPreviewDevice(device.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                    previewDevice === device.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {device.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {device.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {previewDevice === 'custom' && (
          <div className="flex items-center gap-1.5 ml-1">
            <WidthInput
              value={customPreviewWidth}
              onChange={(w) => setCustomPreviewSize(w, customPreviewHeight)}
            />
            <span className="text-xs text-gray-400">&times;</span>
            <HeightInput
              value={customPreviewHeight}
              isAuto={isAutoHeight}
              onChange={(h) => {
                // Switch to standard height mode with fixed height
                updateSettings('chartType', { heightMode: 'standard', standardHeight: h });
                setCustomPreviewSize(customPreviewWidth, h);
              }}
              onSetAuto={() => {
                updateSettings('chartType', { heightMode: 'auto' });
              }}
            />
            <span className="text-xs text-gray-400">px</span>
          </div>
        )}

        {/* Canvas background color */}
        <div className="ml-2 border-l border-gray-200 pl-2">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 h-8 px-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                    <div
                      className="w-4 h-4 rounded-sm border border-gray-300"
                      style={{ backgroundColor: canvasBackgroundColor }}
                    />
                    <Paintbrush className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Canvas background
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-3" align="end" side="bottom">
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-600">Canvas Background</p>
                <p className="text-[10px] text-gray-400 -mt-2">Cosmetic only — does not affect exports</p>
                <HexColorPicker
                  color={canvasBackgroundColor}
                  onChange={setCanvasBackgroundColor}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#</span>
                  <HexColorInput
                    color={canvasBackgroundColor}
                    onChange={setCanvasBackgroundColor}
                    className="flex h-8 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    prefixed={false}
                  />
                </div>
                <button
                  onClick={() => setCanvasBackgroundColor('#d1d5db')}
                  className="text-[10px] text-blue-600 hover:text-blue-700"
                >
                  Reset to default
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Undo / Redo */}
        <div className="ml-2 border-l border-gray-200 pl-2 flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => undo(useEditorStore)}
                disabled={_undoLen === 0}
                className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Undo (⌘Z)
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => redo(useEditorStore)}
                disabled={_redoLen === 0}
                className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Redo (⌘⇧Z)
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
