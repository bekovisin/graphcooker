'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BarChart3, BookmarkPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: number;
  templateName: string;
  chartType: string;
  thumbnail: string | null;
}

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePickerDialog({ open, onOpenChange }: TemplatePickerDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(null);

  const { isDirty, loadVisualization, setEditingTemplateId, setIsDirty } = useEditorStore();

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/templates')
        .then((res) => res.json())
        .then((data) => setTemplates(data))
        .catch(() => toast.error('Failed to load templates'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSelectTemplate = (templateId: number) => {
    if (isDirty) {
      setPendingTemplateId(templateId);
      setShowUnsavedWarning(true);
      return;
    }
    loadTemplate(templateId);
  };

  const loadTemplate = async (templateId: number) => {
    setLoadingId(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) {
        toast.error('Failed to load template');
        return;
      }
      const template = await res.json();
      const state = useEditorStore.getState();

      loadVisualization({
        id: state.visualizationId!,
        name: state.visualizationName,
        chartType: template.chartType,
        data: template.data || [],
        settings: template.settings || {},
        columnMapping: template.columnMapping || {},
      });

      setEditingTemplateId(templateId);
      setIsDirty(true);

      toast.success(`Loaded template "${template.templateName}"`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to load template');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit existing template</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No templates saved yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto py-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={loadingId !== null}
                  className="group relative rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm overflow-hidden transition-all text-left disabled:opacity-50"
                >
                  <div className="aspect-[16/10] bg-gray-50 flex items-center justify-center border-b">
                    {template.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={template.thumbnail} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <BarChart3 className="w-6 h-6 text-gray-200" />
                    )}
                    {loadingId === template.id && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{template.templateName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Loading a template will replace the current content. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTemplateId) loadTemplate(pendingTemplateId);
                setShowUnsavedWarning(false);
                setPendingTemplateId(null);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
