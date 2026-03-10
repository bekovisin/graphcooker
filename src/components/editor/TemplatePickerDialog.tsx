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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart3, BookmarkPlus, Loader2, MoreHorizontal, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { captureThumbnail } from '@/lib/capture-thumbnail';
import { useAuthStore } from '@/store/authStore';
import { ShareTemplateDialog } from './ShareTemplateDialog';

interface Template {
  id: number;
  templateName: string;
  chartType: string;
  thumbnail: string | null;
  updatedAt: string;
}

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, shows a "replace current chart" warning instead of "unsaved changes" */
  replaceMode?: boolean;
  /** When true, selecting a template updates it with the current editor state */
  updateMode?: boolean;
}

export function TemplatePickerDialog({ open, onOpenChange, replaceMode, updateMode }: TemplatePickerDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(null);
  const [shareTemplate, setShareTemplate] = useState<{ id: number; name: string } | null>(null);

  const { isDirty, loadVisualization, setEditingTemplateId, setIsDirty, settings, data, columnMapping, chartType } = useEditorStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

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
    if (updateMode) {
      setPendingTemplateId(templateId);
      setShowWarning(true);
      return;
    }
    if (replaceMode || isDirty) {
      setPendingTemplateId(templateId);
      setShowWarning(true);
      return;
    }
    loadTemplate(templateId);
  };

  const updateTemplate = async (templateId: number) => {
    setLoadingId(templateId);
    try {
      const thumbnail = await captureThumbnail();
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartType, settings, data, columnMapping, thumbnail }),
      });
      if (!res.ok) {
        toast.error('Failed to update template');
        return;
      }
      const updated = await res.json();
      toast.success(`Updated template "${updated.templateName}"`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to update template');
    } finally {
      setLoadingId(null);
    }
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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{updateMode ? 'Update a template' : replaceMode ? 'Replace with template' : 'Edit existing template'}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {updateMode
                ? 'Select a template to overwrite with the current chart settings and data.'
                : replaceMode
                ? 'Choose a template to replace the current chart. All current settings and data will be overwritten.'
                : 'Select a template to load into the editor for editing.'}
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <BookmarkPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No templates saved yet</p>
              <p className="text-xs text-gray-400 mt-1">Save a chart as a template from the editor</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-[480px] overflow-y-auto py-2" style={{ gridAutoRows: 'min-content' }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadingId === null && handleSelectTemplate(template.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && loadingId === null) handleSelectTemplate(template.id); }}
                  className={`group relative rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm overflow-hidden transition-all text-left cursor-pointer ${loadingId !== null ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="aspect-[16/10] bg-gray-50 flex items-center justify-center border-b relative">
                    {template.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={template.thumbnail} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <BarChart3 className="w-8 h-8 text-gray-200" />
                    )}
                    {loadingId === template.id && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-md bg-white/90 hover:bg-white shadow-sm border border-gray-200"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareTemplate({ id: template.id, name: template.templateName });
                            }}
                            className="gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share to user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{template.templateName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {template.chartType.replace(/_/g, ' ')} · {formatDate(template.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {updateMode ? 'Update this template?' : replaceMode ? 'Replace current chart?' : 'Unsaved changes'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {updateMode
                ? 'This will overwrite the selected template with the current chart type, settings, data, and column mappings.'
                : replaceMode
                ? 'This will replace all current settings, data, and column mappings with the selected template. This action cannot be undone.'
                : 'You have unsaved changes. Loading a template will replace the current content. Continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTemplateId) {
                  if (updateMode) {
                    updateTemplate(pendingTemplateId);
                  } else {
                    loadTemplate(pendingTemplateId);
                  }
                }
                setShowWarning(false);
                setPendingTemplateId(null);
              }}
              className={updateMode ? 'bg-orange-500 hover:bg-orange-600' : replaceMode ? 'bg-orange-500 hover:bg-orange-600' : undefined}
            >
              {updateMode ? 'Update' : replaceMode ? 'Replace' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {shareTemplate && (
        <ShareTemplateDialog
          open={!!shareTemplate}
          onOpenChange={(open) => { if (!open) setShareTemplate(null); }}
          templateId={shareTemplate.id}
          templateName={shareTemplate.name}
          currentUserId={user?.id ?? 0}
        />
      )}
    </>
  );
}
