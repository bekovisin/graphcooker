'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Download,
  FileImage,
  FileCode,
  FileText,
  FileType,
  Loader2,
  RotateCcw,
} from 'lucide-react';

export type BulkExportFormat = 'png' | 'svg' | 'pdf' | 'html';

export interface BulkExportOptions {
  format: BulkExportFormat;
  width: number;
  height: number;
  transparent: boolean;
  pixelRatio: number;
  usePerChartDimensions: boolean;
}

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedIds: number[];
  onExport: (options: BulkExportOptions) => Promise<void>;
}

const formats: { value: BulkExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'png', label: 'PNG', icon: <FileImage className="w-4 h-4" />, desc: 'Raster image' },
  { value: 'svg', label: 'SVG', icon: <FileCode className="w-4 h-4" />, desc: 'Vector graphics' },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" />, desc: 'Document' },
  { value: 'html', label: 'HTML', icon: <FileType className="w-4 h-4" />, desc: 'Interactive page' },
];

export function BulkExportDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedIds,
  onExport,
}: BulkExportDialogProps) {
  const [format, setFormat] = useState<BulkExportFormat>('png');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const [transparent, setTransparent] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(2);
  const [isExporting, setIsExporting] = useState(false);
  const [usePerChart, setUsePerChart] = useState(false);

  // Saved (default) dimensions fetched from DB
  const [defaultWidth, setDefaultWidth] = useState(800);
  const [defaultHeight, setDefaultHeight] = useState(500);
  const [isLoadingDims, setIsLoadingDims] = useState(false);

  const isMultiple = selectedCount > 1;
  const isCustomWidth = width !== defaultWidth;
  const isCustomHeight = height !== defaultHeight;

  // Fetch saved dimensions when dialog opens
  const fetchDimensions = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsLoadingDims(true);
    try {
      const res = await fetch('/api/visualizations/dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) return;
      const dims: Record<number, { width: number; height: number }> = await res.json();

      // For single chart: use its exact saved dimensions
      // For multiple: use the first chart's dimensions as the default
      const firstId = selectedIds[0];
      const firstDim = dims[firstId];
      if (firstDim) {
        setDefaultWidth(firstDim.width);
        setDefaultHeight(firstDim.height);
        setWidth(firstDim.width);
        setHeight(firstDim.height);
      }
    } catch {
      // Fallback: keep 800x500
    } finally {
      setIsLoadingDims(false);
    }
  }, [selectedIds]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setFormat('png');
      setTransparent(false);
      setPixelRatio(2);
      setIsExporting(false);
      setUsePerChart(false);
      // Reset to fallback first, then fetch overwrites
      setDefaultWidth(800);
      setDefaultHeight(500);
      setWidth(800);
      setHeight(500);
      fetchDimensions();
    }
  }, [open, fetchDimensions]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        width,
        height,
        transparent,
        pixelRatio,
        usePerChartDimensions: usePerChart,
      });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  const supportsTransparency = format === 'png' || format === 'svg';
  const supportsQuality = format === 'png';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export {selectedCount} visualization{selectedCount > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Each chart will be rendered at the specified dimensions and exported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Format selection */}
          <div>
            <Label className="text-sm mb-2 block">Format</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-md border text-xs transition-all ${
                    format === f.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f.icon}
                  <span className="font-medium">{f.label}</span>
                  <span className="text-[10px] opacity-60">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Per-chart dimensions toggle (only for multiple charts) */}
          {isMultiple && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="per-chart-dims" className="text-sm">
                  Use each chart&apos;s saved dimensions
                </Label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Each chart exports at its own saved preview size
                </p>
              </div>
              <Switch
                id="per-chart-dims"
                checked={usePerChart}
                onCheckedChange={setUsePerChart}
              />
            </div>
          )}

          {/* Dimensions */}
          <div className={`flex gap-3 ${usePerChart ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex-1">
              <Label htmlFor="bulk-width" className="text-sm">
                Width (px)
              </Label>
              <div className="flex gap-1 mt-1">
                <Input
                  id="bulk-width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                  min={1}
                  disabled={usePerChart}
                />
                {isCustomWidth && !usePerChart && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-gray-400 hover:text-blue-600"
                    onClick={() => setWidth(defaultWidth)}
                    title={`Reset to saved (${defaultWidth}px)`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="bulk-height" className="text-sm">
                Height (px)
              </Label>
              <div className="flex gap-1 mt-1">
                <Input
                  id="bulk-height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                  min={1}
                  disabled={usePerChart}
                />
                {isCustomHeight && !usePerChart && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-gray-400 hover:text-blue-600"
                    onClick={() => setHeight(defaultHeight)}
                    title={`Reset to saved (${defaultHeight}px)`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Info text when per-chart mode is on */}
          {usePerChart && (
            <p className="text-xs text-blue-500 -mt-2">
              Each chart will use its own saved preview dimensions.
            </p>
          )}

          {/* Loading indicator for dimension fetch */}
          {isLoadingDims && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading saved dimensions...
            </p>
          )}

          {/* Transparent background */}
          {supportsTransparency && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="bulk-transparent" className="text-sm">
                Transparent background
              </Label>
              <Switch
                id="bulk-transparent"
                checked={transparent}
                onCheckedChange={setTransparent}
              />
            </div>
          )}

          {/* PNG Quality */}
          {supportsQuality && (
            <div className="space-y-2">
              <Label className="text-sm">Quality (pixel ratio)</Label>
              <div className="flex rounded-md border border-gray-200 overflow-hidden">
                {[
                  { value: 1, label: 'x1' },
                  { value: 2, label: 'x2' },
                  { value: 3, label: 'x3' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPixelRatio(opt.value)}
                    className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
                      pixelRatio === opt.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    } ${opt.value !== 1 ? 'border-l border-gray-200' : ''}`}
                  >
                    {opt.label}
                    <span className="text-[10px] ml-1 opacity-60">
                      {(usePerChart ? defaultWidth : width) * opt.value}x
                      {(usePerChart ? defaultHeight : height) * opt.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Charts will be fully re-rendered at the specified dimensions for high-quality export.
            {format === 'html' && ' HTML exports include embedded chart code for interactivity.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5">
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting
              ? 'Exporting...'
              : `Export ${selectedCount} file${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
