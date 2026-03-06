'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Download, FileImage, FileCode, FileText, FileType, Loader2 } from 'lucide-react';

type ExportFormat = 'png' | 'svg' | 'pdf' | 'html';

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onExport: (format: ExportFormat, options: BulkExportOptions) => Promise<void>;
}

export interface BulkExportOptions {
  width: number;
  height: number;
  transparent: boolean;
  pixelRatio: number;
}

const formats: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'png', label: 'PNG Image', icon: <FileImage className="w-4 h-4" /> },
  { value: 'svg', label: 'SVG Vector', icon: <FileCode className="w-4 h-4" /> },
  { value: 'pdf', label: 'PDF Document', icon: <FileText className="w-4 h-4" /> },
  { value: 'html', label: 'HTML Page', icon: <FileType className="w-4 h-4" /> },
];

export function BulkExportDialog({
  open,
  onOpenChange,
  selectedCount,
  onExport,
}: BulkExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(675);
  const [transparent, setTransparent] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(2);
  const [isExporting, setIsExporting] = useState(false);

  const supportsTransparency = format === 'png' || format === 'svg';
  const supportsQuality = format === 'png';

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, { width, height, transparent, pixelRatio });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export {selectedCount} visualization{selectedCount > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Format selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export format</Label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    format === f.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bulk-width" className="text-xs text-gray-500">
                Width (px)
              </Label>
              <Input
                id="bulk-width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
                min={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulk-height" className="text-xs text-gray-500">
                Height (px)
              </Label>
              <Input
                id="bulk-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
                min={1}
              />
            </div>
          </div>

          {/* Transparent background */}
          {supportsTransparency && (
            <div className="flex items-center justify-between">
              <Label className="text-sm">Transparent background</Label>
              <Switch checked={transparent} onCheckedChange={setTransparent} />
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
                      {width * opt.value}x{height * opt.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
            {isExporting ? 'Exporting...' : `Export ${selectedCount} file${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
