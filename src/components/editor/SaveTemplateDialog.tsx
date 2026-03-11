'use client';

import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { captureThumbnail } from '@/lib/capture-thumbnail';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveTemplateDialog({ open, onOpenChange }: SaveTemplateDialogProps) {
  const { settings, data, columnMapping, chartType, seriesNames, columnOrder, columnTypes } = useEditorStore();
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = templateName.trim();
    if (!name) return;

    setSaving(true);
    try {
      // Embed seriesNames, columnOrder, and columnTypes into columnMapping
      // so they survive the round-trip through the database (same as auto-save)
      const mappingWithExtras = {
        ...columnMapping,
        seriesNames: Object.keys(seriesNames).length > 0 ? seriesNames : undefined,
        _columnOrder: columnOrder,
        _columnTypes: Object.keys(columnTypes).length > 0 ? columnTypes : undefined,
      };
      const thumbnail = await captureThumbnail();
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: name,
          chartType,
          settings,
          data,
          columnMapping: mappingWithExtras,
          thumbnail,
        }),
      });

      if (res.ok) {
        toast.success(`Template "${name}" saved`);
        setTemplateName('');
        onOpenChange(false);
      } else {
        toast.error('Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-orange-500" />
            Save as Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Save the current chart type, all settings, data configuration, and column mapping as a reusable template.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Template name
            </label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Monthly report chart"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && templateName.trim()) handleSave();
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim() || saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
