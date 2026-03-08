'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({ open, onConfirm, onCancel }: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="flex-row items-start gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900 leading-6">
                Unsaved changes
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1.5 leading-5">
                You have unsaved changes that will be lost if you leave this page. Do you want to continue?
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>
        <DialogFooter className="bg-gray-50 px-6 py-3 border-t gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-sm"
          >
            Stay on page
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onConfirm}
            className="text-sm bg-amber-500 hover:bg-amber-600 text-white"
          >
            Leave page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
