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
import { FolderPlus, Loader2 } from 'lucide-react';

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void | Promise<void>;
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = 'Enter name...',
  confirmLabel = 'Create',
  defaultValue = '',
  onConfirm,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open, defaultValue]);

  const handleConfirm = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="flex-row items-start gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5 text-blue-500" />
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
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
                placeholder={placeholder}
                className="mt-3 w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              />
            </div>
          </DialogHeader>
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
            disabled={isLoading || !value.trim()}
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
