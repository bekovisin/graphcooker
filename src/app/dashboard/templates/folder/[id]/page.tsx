'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  LayoutTemplate,
  Loader2,
  Square,
  Download,
  X,
  Trash2,
  FolderOpen,
  Pencil,
  MoreVertical,
  ChevronRight,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditTemplateDialog } from '@/components/dashboard/EditTemplateDialog';
import { ShareTemplateDialog } from '@/components/dashboard/ShareTemplateDialog';
import {
  useDashboardStore,
  useGridClass,
} from '@/store/dashboardStore';

export default function TemplateFolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = Number(params.id);

  // Individual selectors to prevent full-store subscription
  const templates = useDashboardStore((s) => s.templates);
  const templateFolders = useDashboardStore((s) => s.templateFolders);
  const cardSize = useDashboardStore((s) => s.cardSize);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const loading = useDashboardStore((s) => s.loading);
  const deleteTemplate = useDashboardStore((s) => s.deleteTemplate);
  const applyTemplate = useDashboardStore((s) => s.applyTemplate);
  const moveTemplateToFolder = useDashboardStore((s) => s.moveTemplateToFolder);
  const bulkDeleteTemplates = useDashboardStore((s) => s.bulkDeleteTemplates);
  const fetchTemplates = useDashboardStore((s) => s.fetchTemplates);
  const setShowBulkExport = useDashboardStore((s) => s.setShowBulkExport);

  const gridClass = useGridClass();

  // Local state
  const [isTemplateSelectionMode, setIsTemplateSelectionMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<number>>(new Set());
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [showShareTemplate, setShowShareTemplate] = useState(false);
  const [shareTemplateIds, setShareTemplateIds] = useState<number[]>([]);

  // Computed
  const folderTemplates = useMemo(() => {
    let result = templates.filter((t) => t.folderId === folderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.templateName.toLowerCase().includes(q));
    }
    return result;
  }, [templates, folderId, searchQuery]);

  // Selection helpers
  const toggleTemplateSelect = useCallback((id: number) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitTemplateSelectionMode = useCallback(() => {
    setIsTemplateSelectionMode(false);
    setSelectedTemplateIds(new Set());
  }, []);

  const selectAllTemplates = () => {
    setSelectedTemplateIds(new Set(folderTemplates.map((t) => t.id)));
  };

  const handleShareTemplate = (templateId: number) => {
    setShareTemplateIds([templateId]);
    setShowShareTemplate(true);
  };

  const handleBulkShareTemplates = () => {
    if (selectedTemplateIds.size === 0) return;
    setShareTemplateIds(Array.from(selectedTemplateIds));
    setShowShareTemplate(true);
  };

  const handleUseTemplate = async (templateId: number) => {
    const id = await applyTemplate(templateId);
    if (id) router.push(`/editor/${id}`);
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/templates')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        Back to all templates
      </button>

      {/* Selection toolbar */}
      {isTemplateSelectionMode && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">{selectedTemplateIds.size} selected</span>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={selectAllTemplates}>
            <Square className="w-3 h-3" />
            All
          </Button>
          {selectedTemplateIds.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={handleBulkShareTemplates}
              >
                <Share2 className="w-3 h-3" />
                Share
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => setShowBulkExport(true)}
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => bulkDeleteTemplates(selectedTemplateIds, exitTemplateSelectionMode)}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={exitTemplateSelectionMode}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Empty state */}
      {folderTemplates.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate className="w-8 h-8 text-orange-300" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
              <p className="text-sm text-gray-500">
                No templates match &ldquo;{searchQuery}&rdquo;
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-700 mb-1">This folder is empty</h3>
              <p className="text-sm text-gray-500">Move templates here from the templates root</p>
            </>
          )}
        </div>
      ) : (
        /* Template cards grid */
        <div className={gridClass}>
          {folderTemplates.map((tpl) => {
            const isTplSelected = selectedTemplateIds.has(tpl.id);
            return (
              <div
                key={tpl.id}
                className={`group relative rounded-lg border bg-white overflow-hidden transition-all cursor-pointer hover:shadow-md hover:border-gray-300 ${
                  isTplSelected ? 'ring-2 ring-blue-400 border-blue-300' : ''
                }`}
              >
                {/* Selection checkbox */}
                {isTemplateSelectionMode && (
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemplateSelect(tpl.id);
                    }}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isTplSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/90 border-gray-300'
                    }`}>
                      {isTplSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Thumbnail */}
                <div
                  className="aspect-[16/10] bg-white flex items-center justify-center border-b overflow-hidden"
                  onClick={() => {
                    if (isTemplateSelectionMode) {
                      toggleTemplateSelect(tpl.id);
                    } else {
                      handleUseTemplate(tpl.id);
                    }
                  }}
                >
                  {tpl.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={tpl.thumbnail} alt={tpl.templateName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <LayoutTemplate className={cardSize === 'small' ? 'w-5 h-5 text-orange-200' : cardSize === 'medium' ? 'w-6 h-6 text-orange-200' : 'w-8 h-8 text-orange-200'} />
                      {cardSize !== 'small' && (
                        <span className="text-[10px] text-gray-300">{tpl.chartType}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className={cardSize === 'small' ? 'px-2 py-1.5' : cardSize === 'medium' ? 'px-2.5 py-2' : 'p-3'}>
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`font-medium text-gray-800 truncate flex-1 ${
                        cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
                      }`}
                      onClick={() => {
                        if (isTemplateSelectionMode) {
                          toggleTemplateSelect(tpl.id);
                        } else {
                          handleUseTemplate(tpl.id);
                        }
                      }}
                    >
                      {tpl.templateName}
                    </h3>
                    {!isTemplateSelectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${
                              cardSize === 'small' ? 'p-0.5' : 'p-1.5'
                            }`}
                          >
                            <MoreVertical className={cardSize === 'small' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => handleUseTemplate(tpl.id)}
                            className="gap-2 text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Use template
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleShareTemplate(tpl.id)}
                            className="gap-2 text-xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditTemplateId(tpl.id);
                              setShowEditTemplate(true);
                            }}
                            className="gap-2 text-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => moveTemplateToFolder(tpl.id, null)}
                            className="gap-2 text-xs"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Move to root
                          </DropdownMenuItem>
                          {templateFolders.filter((f) => f.id !== tpl.folderId).map((f) => (
                            <DropdownMenuItem
                              key={f.id}
                              onClick={() => moveTemplateToFolder(tpl.id, f.id)}
                              className="gap-2 text-xs"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              Move to {f.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => deleteTemplate(tpl.id)}
                            className="gap-2 text-xs text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditTemplateDialog
        open={showEditTemplate}
        onOpenChange={setShowEditTemplate}
        templateId={editTemplateId}
        onUpdated={fetchTemplates}
      />

      <ShareTemplateDialog
        open={showShareTemplate}
        onOpenChange={setShowShareTemplate}
        templateIds={shareTemplateIds}
        onShared={() => {
          fetchTemplates();
          exitTemplateSelectionMode();
        }}
      />
    </div>
  );
}
