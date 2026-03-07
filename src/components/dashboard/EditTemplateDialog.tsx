'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: number;
  templateName: string;
  chartType: string;
  settings: Record<string, unknown>;
  data: unknown[];
  columnMapping: Record<string, unknown>;
  thumbnail: string | null;
}

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number | null;
  onUpdated: () => void;
}

export function EditTemplateDialog({
  open,
  onOpenChange,
  templateId,
  onUpdated,
}: EditTemplateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && templateId) {
      setLoading(true);
      fetch(`/api/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          setTemplate(data);
          setName(data.templateName);
        })
        .catch(() => toast.error('Failed to load template'))
        .finally(() => setLoading(false));
    }
  }, [open, templateId]);

  const handleSave = async () => {
    if (!template || !name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName: name.trim() }),
      });
      if (res.ok) {
        toast.success('Template updated');
        onUpdated();
        onOpenChange(false);
      } else {
        toast.error('Failed to update template');
      }
    } catch {
      toast.error('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handleEditInEditor = async () => {
    if (!template) return;
    setSaving(true);
    try {
      // Create a new visualization from this template for editing
      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.templateName} (editing template)`,
          chartType: template.chartType,
          data: template.data,
          settings: template.settings,
          columnMapping: template.columnMapping,
        }),
      });
      if (res.ok) {
        const viz = await res.json();
        onOpenChange(false);
        // Navigate to editor with template context
        router.push(`/editor/${viz.id}?fromTemplate=${template.id}`);
      }
    } catch {
      toast.error('Failed to open in editor');
    } finally {
      setSaving(false);
    }
  };

  const settingsSummary = template?.settings
    ? Object.keys(template.settings as Record<string, unknown>).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit template</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : template ? (
          <div className="space-y-4 py-2">
            {/* Thumbnail preview */}
            {template.thumbnail && (
              <div className="rounded-lg border overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.thumbnail}
                  alt=""
                  className="w-full h-40 object-contain"
                />
              </div>
            )}

            {/* Template name */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Template name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">Chart type</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{template.chartType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">Settings</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{settingsSummary} sections</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 flex-1"
                onClick={handleEditInEditor}
                disabled={saving}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in editor
              </Button>
              <Button
                size="sm"
                className="gap-1.5 flex-1"
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save changes
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
