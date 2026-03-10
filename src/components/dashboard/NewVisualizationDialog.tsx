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
import { Plus, BookmarkPlus, Loader2, BarChart3, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { EditTemplateDialog } from './EditTemplateDialog';

interface Template {
  id: number;
  templateName: string;
  chartType: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewVisualizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBlank: () => void;
  activeFolderId: number | null;
}

export function NewVisualizationDialog({
  open,
  onOpenChange,
  onCreateBlank,
  activeFolderId,
}: NewVisualizationDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'templates'>('choose');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<number | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setMode('choose');
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    setCreatingFromTemplate(templateId);
    try {
      // Fetch full template data
      const templateRes = await fetch(`/api/templates/${templateId}`);
      if (!templateRes.ok) {
        toast.error('Failed to load template');
        return;
      }
      const template = await templateRes.json();

      // Create visualization from template
      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.templateName} (from template)`,
          folderId: activeFolderId,
          chartType: template.chartType,
          data: template.data,
          settings: template.settings,
          columnMapping: template.columnMapping,
        }),
      });

      if (res.ok) {
        const viz = await res.json();
        toast.success('Visualization created from template');
        onOpenChange(false);
        router.push(`/editor/${viz.id}`);
      } else {
        toast.error('Failed to create visualization');
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
      toast.error('Failed to create visualization');
    } finally {
      setCreatingFromTemplate(null);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast.success('Template deleted');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleStartFromScratch = () => {
    onOpenChange(false);
    onCreateBlank();
  };

  const handleShowTemplates = () => {
    setMode('templates');
    fetchTemplates();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New visualization</DialogTitle>
        </DialogHeader>

        {mode === 'choose' ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Start from scratch */}
            <button
              onClick={handleStartFromScratch}
              className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">Start from scratch</p>
                <p className="text-xs text-gray-500 mt-0.5">Create a blank chart</p>
              </div>
            </button>

            {/* Use template */}
            <button
              onClick={handleShowTemplates}
              className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <BookmarkPlus className="w-6 h-6 text-gray-400 group-hover:text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">Use a template</p>
                <p className="text-xs text-gray-500 mt-0.5">Start from a saved template</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="py-2">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="text-xs">
                Back
              </Button>
              <span className="text-xs text-gray-400">{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
            </div>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No templates saved yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Save a chart as a template from the editor
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[480px] overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={creatingFromTemplate !== null}
                    className="group relative rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm overflow-hidden transition-all text-left disabled:opacity-50"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[16/10] bg-gray-50 flex items-center justify-center border-b">
                      {template.thumbnail ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={template.thumbnail} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <BarChart3 className="w-8 h-8 text-gray-200" />
                      )}
                      {creatingFromTemplate === template.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    {/* Name + info + edit/delete */}
                    <div className="px-2.5 py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{template.templateName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{template.chartType.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplateId(template.id);
                          }}
                          className="p-0.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTemplate(e, template.id)}
                          className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <EditTemplateDialog
        open={editingTemplateId !== null}
        onOpenChange={(o) => { if (!o) setEditingTemplateId(null); }}
        templateId={editingTemplateId}
        onUpdated={fetchTemplates}
      />
    </Dialog>
  );
}
