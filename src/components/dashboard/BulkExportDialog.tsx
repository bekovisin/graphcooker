'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileImage, Loader2 } from 'lucide-react';

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onExport: () => Promise<void>;
}

export function BulkExportDialog({
  open,
  onOpenChange,
  selectedCount,
  onExport,
}: BulkExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export {selectedCount} visualization{selectedCount > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Download chart previews as PNG images from stored thumbnails.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50">
            <FileImage className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">PNG Image</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {selectedCount} file{selectedCount > 1 ? 's' : ''} will be downloaded
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 px-1">
            Exports use stored chart thumbnails. Open each visualization at least once to generate thumbnails.
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
            {isExporting ? 'Exporting...' : `Export ${selectedCount} file${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
