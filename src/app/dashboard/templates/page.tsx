'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  LayoutTemplate,
  Loader2,
  FolderOpen,
  Pencil,
  MoreVertical,
  Share2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderCard } from '@/components/dashboard/FolderCard';
import { EditTemplateDialog } from '@/components/dashboard/EditTemplateDialog';
import { ShareTemplateDialog } from '@/components/dashboard/ShareTemplateDialog';
import { InputDialog } from '@/components/dashboard/InputDialog';
import {
  useDashboardStore,
  useTemplateFolderTemplateCounts,
  useTemplateFolderSubCounts,
  useGridClass,
  useSortTemplate,
  type TemplateItem,
} from '@/store/dashboardStore';

export default function TemplatesPage() {
  const router = useRouter();

  // Individual selectors to prevent full-store subscription
  const templates = useDashboardStore((s) => s.templates);
  const templateFolders = useDashboardStore((s) => s.templateFolders);
  const cardSize = useDashboardStore((s) => s.cardSize);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const loading = useDashboardStore((s) => s.loading);
  const deleteTemplate = useDashboardStore((s) => s.deleteTemplate);
  const applyTemplate = useDashboardStore((s) => s.applyTemplate);
  const applyingTemplateId = useDashboardStore((s) => s.applyingTemplateId);
  const renameTemplateFolder = useDashboardStore((s) => s.renameTemplateFolder);
  const updateTemplateFolderColors = useDashboardStore((s) => s.updateTemplateFolderColors);
  const deleteTemplateFolder = useDashboardStore((s) => s.deleteTemplateFolder);
  const duplicateTemplateFolder = useDashboardStore((s) => s.duplicateTemplateFolder);
  const moveTemplateFolderTo = useDashboardStore((s) => s.moveTemplateFolderTo);
  const moveTemplateToFolder = useDashboardStore((s) => s.moveTemplateToFolder);
  const fetchTemplates = useDashboardStore((s) => s.fetchTemplates);

  // Template selection from store
  const isTemplateSelectionMode = useDashboardStore((s) => s.isTemplateSelectionMode);
  const selectedTemplateIds = useDashboardStore((s) => s.selectedTemplateIds);
  const selectedTemplateFolderIds = useDashboardStore((s) => s.selectedTemplateFolderIds);
  const toggleSelectTemplate = useDashboardStore((s) => s.toggleSelectTemplate);
  const toggleSelectTemplateFolder = useDashboardStore((s) => s.toggleSelectTemplateFolder);
  const exitTemplateSelectionMode = useDashboardStore((s) => s.exitTemplateSelectionMode);

  const viewMode = useDashboardStore((s) => s.viewMode);
  const templateOwnershipFilter = useDashboardStore((s) => s.templateOwnershipFilter);
  const templateCounts = useTemplateFolderTemplateCounts();
  const templateSubCounts = useTemplateFolderSubCounts();
  const gridClass = useGridClass();
  const sortTemplate = useSortTemplate();

  // Local state
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [showShareTemplate, setShowShareTemplate] = useState(false);
  const [shareTemplateIds, setShareTemplateIds] = useState<number[]>([]);
  const [shareFolderIds, setShareFolderIds] = useState<number[]>([]);
  const [renameFolderId, setRenameFolderId] = useState<number | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');

  // Pre-filter by ownership
  const ownershipTemplates = useMemo(() => {
    if (templateOwnershipFilter === 'mine') return templates.filter((t) => !t.sharedByUserId);
    if (templateOwnershipFilter === 'shared') return templates.filter((t) => !!t.sharedByUserId);
    return templates;
  }, [templates, templateOwnershipFilter]);

  const ownershipTemplateFolders = useMemo(() => {
    if (templateOwnershipFilter === 'mine') return templateFolders.filter((f) => !f.sharedByUserId);
    if (templateOwnershipFilter === 'shared') return templateFolders.filter((f) => !!f.sharedByUserId);
    return templateFolders;
  }, [templateFolders, templateOwnershipFilter]);

  // Computed
  const rootTemplateFolders = useMemo(() => {
    return ownershipTemplateFolders.filter((f) => f.parentId === null);
  }, [ownershipTemplateFolders]);

  const rootTemplates = useMemo(() => {
    let result = ownershipTemplates.filter((t) => t.folderId === null);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.templateName.toLowerCase().includes(q));
    }
    return sortTemplate(result);
  }, [ownershipTemplates, searchQuery, sortTemplate]);

  const toggleFolderExpand = useCallback((folderId: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  }, []);

  const templateFoldersWithItems = useMemo(() => {
    return rootTemplateFolders.map((folder) => ({
      folder,
      items: sortTemplate(ownershipTemplates.filter((t) => t.folderId === folder.id)),
    }));
  }, [rootTemplateFolders, ownershipTemplates, sortTemplate]);

  const handleShareTemplate = (templateId: number) => {
    setShareTemplateIds([templateId]);
    setShareFolderIds([]);
    setShowShareTemplate(true);
  };

  const handleShareFolder = (folderId: number) => {
    setShareTemplateIds([]);
    setShareFolderIds([folderId]);
    setShowShareTemplate(true);
  };

  const handleUseTemplate = async (templateId: number) => {
    const id = await applyTemplate(templateId);
    if (id) router.push(`/editor/${id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderTemplateFolderGroupHeader = (folder: typeof templateFolders[0], itemCount: number) => {
    const isExpanded = expandedFolderIds.has(folder.id);
    return (
      <div
        key={`folder-header-${folder.id}`}
        className="flex items-center gap-2 px-1 py-2 cursor-pointer group"
        onClick={() => toggleFolderExpand(folder.id)}
      >
        <span className="w-5 h-5 flex items-center justify-center text-gray-400">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <FolderOpen className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{folder.name}</span>
        <span className="text-[10px] text-gray-400 tabular-nums">{itemCount}</span>
      </div>
    );
  };

  const renderTemplateListRow = (tpl: TemplateItem) => {
    const isTplSelected = selectedTemplateIds.has(tpl.id);
    return (
      <div
        key={tpl.id}
        draggable={!isTemplateSelectionMode}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(tpl.id));
          e.dataTransfer.effectAllowed = 'move';
        }}
        className={`group flex items-center gap-3 px-4 py-2.5 rounded-md cursor-pointer transition-colors ${
          isTplSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => {
          if (isTemplateSelectionMode) toggleSelectTemplate(tpl.id);
          else if (!applyingTemplateId) handleUseTemplate(tpl.id);
        }}
      >
        {/* Selection checkbox */}
        {isTemplateSelectionMode && (
          <div
            onClick={(e) => { e.stopPropagation(); toggleSelectTemplate(tpl.id); }}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
              isTplSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}
          >
            {isTplSelected && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-12 h-8 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative">
          {tpl.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tpl.thumbnail} alt="" className="w-full h-full object-contain" />
          ) : (
            <LayoutTemplate className="w-4 h-4 text-orange-200" />
          )}
          {applyingTemplateId === tpl.id && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate block">{tpl.templateName}</span>
          {tpl.sharedByUserId && (
            <span className="text-[10px] truncate block text-blue-500">
              Shared by {tpl.sharedByName || 'someone'}
            </span>
          )}
        </div>

        {/* Chart type */}
        <span className="text-xs text-gray-400 shrink-0">{tpl.chartType}</span>

        {/* Date */}
        <span className="text-xs text-gray-400 shrink-0">{formatDate(tpl.updatedAt)}</span>

        {/* Actions */}
        {!isTemplateSelectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleUseTemplate(tpl.id)} className="gap-2 text-xs">
                <Plus className="w-3.5 h-3.5" /> Use template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShareTemplate(tpl.id)} className="gap-2 text-xs">
                <Share2 className="w-3.5 h-3.5" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditTemplateId(tpl.id); setShowEditTemplate(true); }} className="gap-2 text-xs">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </DropdownMenuItem>
              {templateFolders.length > 0 && (
                <>
                  {tpl.folderId !== null && (
                    <DropdownMenuItem onClick={() => moveTemplateToFolder(tpl.id, null)} className="gap-2 text-xs">
                      <FolderOpen className="w-3.5 h-3.5" /> Move to root
                    </DropdownMenuItem>
                  )}
                  {templateFolders.filter((f) => f.id !== tpl.folderId).map((f) => (
                    <DropdownMenuItem key={f.id} onClick={() => moveTemplateToFolder(tpl.id, f.id)} className="gap-2 text-xs">
                      <FolderOpen className="w-3.5 h-3.5" /> Move to {f.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuItem onClick={() => deleteTemplate(tpl.id)} className="gap-2 text-xs text-red-600 focus:text-red-600">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const renderTemplateCard = (tpl: TemplateItem) => {
    const isTplSelected = selectedTemplateIds.has(tpl.id);
    return (
      <div
        key={tpl.id}
        draggable={!isTemplateSelectionMode}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(tpl.id));
          e.dataTransfer.effectAllowed = 'move';
        }}
        className={`group relative rounded-lg border bg-white overflow-hidden transition-all cursor-pointer hover:shadow-md hover:border-gray-300 ${
          isTplSelected ? 'ring-2 ring-blue-400 border-blue-300' : ''
        }`}
      >
        {isTemplateSelectionMode && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelectTemplate(tpl.id); }}>
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
        <div
          className="aspect-[16/10] bg-white flex items-center justify-center border-b overflow-hidden relative"
          onClick={() => {
            if (isTemplateSelectionMode) toggleSelectTemplate(tpl.id);
            else if (!applyingTemplateId) handleUseTemplate(tpl.id);
          }}
        >
          {tpl.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tpl.thumbnail} alt={tpl.templateName} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <LayoutTemplate className={cardSize === 'small' ? 'w-5 h-5 text-orange-200' : cardSize === 'medium' ? 'w-6 h-6 text-orange-200' : 'w-8 h-8 text-orange-200'} />
              {cardSize !== 'small' && <span className="text-[10px] text-gray-300">{tpl.chartType}</span>}
            </div>
          )}
          {applyingTemplateId === tpl.id && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          )}
        </div>
        <div className={cardSize === 'small' ? 'px-2 py-1.5' : cardSize === 'medium' ? 'px-2.5 py-2' : 'p-3'}>
          <div className="flex items-center justify-between gap-1">
            <h3
              className={`font-medium text-gray-800 truncate flex-1 ${
                cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
              }`}
              onClick={() => {
                if (isTemplateSelectionMode) toggleSelectTemplate(tpl.id);
                else handleUseTemplate(tpl.id);
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
                  <DropdownMenuItem onClick={() => handleUseTemplate(tpl.id)} className="gap-2 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Use template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareTemplate(tpl.id)} className="gap-2 text-xs">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditTemplateId(tpl.id); setShowEditTemplate(true); }} className="gap-2 text-xs">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </DropdownMenuItem>
                  {templateFolders.length > 0 && (
                    <>
                      {tpl.folderId !== null && (
                        <DropdownMenuItem onClick={() => moveTemplateToFolder(tpl.id, null)} className="gap-2 text-xs">
                          <FolderOpen className="w-3.5 h-3.5" /> Move to root
                        </DropdownMenuItem>
                      )}
                      {templateFolders.filter((f) => f.id !== tpl.folderId).map((f) => (
                        <DropdownMenuItem key={f.id} onClick={() => moveTemplateToFolder(tpl.id, f.id)} className="gap-2 text-xs">
                          <FolderOpen className="w-3.5 h-3.5" /> Move to {f.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  <DropdownMenuItem onClick={() => deleteTemplate(tpl.id)} className="gap-2 text-xs text-red-600 focus:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {tpl.sharedByUserId && (
            <p className={`truncate text-blue-500 ${cardSize === 'small' ? 'text-[8px]' : cardSize === 'medium' ? 'text-[9px]' : 'text-[10px]'}`}>
              Shared by {tpl.sharedByName || 'someone'}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Empty state
  if (templates.length === 0 && templateFolders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LayoutTemplate className="w-8 h-8 text-orange-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">No templates yet</h3>
        <p className="text-sm text-gray-500">Save a visualization as a template from the editor</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {/* Template cards (grid or list) */}
        {viewMode === 'list' ? (
          /* List view — folder groups + uncategorized */
          <>
            {templateFoldersWithItems.map(({ folder, items }) => (
              <div key={folder.id}>
                {renderTemplateFolderGroupHeader(folder, items.length)}
                {expandedFolderIds.has(folder.id) && (
                  <div className="ml-6 mt-1">
                    <div className="space-y-1">{items.map((tpl) => renderTemplateListRow(tpl))}</div>
                  </div>
                )}
              </div>
            ))}
            {rootTemplates.length > 0 && (
              <div>
                {templateFoldersWithItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">
                      Uncategorized
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <div className="space-y-1">{rootTemplates.map((tpl) => renderTemplateListRow(tpl))}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Grid view — folders first, then templates */
          <div className={gridClass}>
            {rootTemplateFolders.map((folder) => (
              <FolderCard
                key={`folder-${folder.id}`}
                folder={folder}
                cardSize={cardSize}
                vizCount={templateCounts[String(folder.id)] || 0}
                subFolderCount={templateSubCounts[String(folder.id)] || 0}
                allFolders={templateFolders}
                isSelected={selectedTemplateFolderIds.has(folder.id)}
                isSelectionMode={isTemplateSelectionMode}
                onToggleSelect={toggleSelectTemplateFolder}
                onClick={() => router.push(`/dashboard/templates/folder/${folder.id}`)}
                onDrop={(templateId) => moveTemplateToFolder(templateId, folder.id)}
                onDropFolder={(draggedFolderId) => moveTemplateFolderTo(draggedFolderId, folder.id)}
                onRename={(id, name) => renameTemplateFolder(id, name)}
                onUpdateColors={updateTemplateFolderColors}
                onDuplicate={(id) => duplicateTemplateFolder(id)}
                onMove={(id, targetParentId) => moveTemplateFolderTo(id, targetParentId)}
                onDelete={(id) => deleteTemplateFolder(id)}
                onShare={(id) => handleShareFolder(id)}
              />
            ))}
            {rootTemplates.map((tpl) => renderTemplateCard(tpl))}
          </div>
        )}
      </div>

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
        folderIds={shareFolderIds}
        onShared={() => {
          fetchTemplates();
          exitTemplateSelectionMode();
        }}
      />

      <InputDialog
        open={renameFolderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameFolderId(null);
            setRenameFolderName('');
          }
        }}
        title="Rename folder"
        placeholder="Folder name..."
        confirmLabel="Rename"
        defaultValue={renameFolderName}
        onConfirm={(name) => {
          if (renameFolderId !== null) {
            renameTemplateFolder(renameFolderId, name);
          }
        }}
      />
    </div>
  );
}
