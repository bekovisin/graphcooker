'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Loader2,
  Search,
  ArrowUpDown,
  Grid3X3,
  LayoutGrid,
  List,
  ChevronRight,
  Trash2,
  LayoutTemplate,
  FolderPlus,
  X,
  CheckSquare,
  Square,
  Download,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileSidebar } from '@/components/dashboard/MobileSidebar';
import { BulkExportDialog } from '@/components/dashboard/BulkExportDialog';
import { NewVisualizationDialog } from '@/components/dashboard/NewVisualizationDialog';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { ShareTemplateDialog } from '@/components/dashboard/ShareTemplateDialog';
import { ShareVisualizationDialog } from '@/components/dashboard/ShareVisualizationDialog';
import { InputDialog } from '@/components/dashboard/InputDialog';
import { useAuthStore } from '@/store/authStore';
import {
  useDashboardStore,
  useEffectiveSelectedVizIds,
  sortLabels,
  type SortMode,
  type OwnershipFilter,
} from '@/store/dashboardStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Use individual selectors to prevent full-store subscription
  const folders = useDashboardStore((s) => s.folders);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const sortMode = useDashboardStore((s) => s.sortMode);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const cardSize = useDashboardStore((s) => s.cardSize);
  const creating = useDashboardStore((s) => s.creating);
  const confirmDialog = useDashboardStore((s) => s.confirmDialog);
  const showBulkExport = useDashboardStore((s) => s.showBulkExport);
  const showNewVizDialog = useDashboardStore((s) => s.showNewVizDialog);

  // Selection state (viz)
  const isSelectionMode = useDashboardStore((s) => s.isSelectionMode);
  const enterSelectionMode = useDashboardStore((s) => s.enterSelectionMode);
  const exitSelectionMode = useDashboardStore((s) => s.exitSelectionMode);
  const selectAllViz = useDashboardStore((s) => s.selectAllViz);
  const selectAllFolders = useDashboardStore((s) => s.selectAllFolders);
  const selectedFolderIds = useDashboardStore((s) => s.selectedFolderIds);
  const handleBulkDelete = useDashboardStore((s) => s.handleBulkDelete);
  const handleBulkExport = useDashboardStore((s) => s.handleBulkExport);
  const visualizations = useDashboardStore((s) => s.visualizations);
  const effectiveVizIds = useEffectiveSelectedVizIds();
  const totalSelectedCount = effectiveVizIds.size;

  // Template selection state
  const isTemplateSelectionMode = useDashboardStore((s) => s.isTemplateSelectionMode);
  const selectedTemplateIds = useDashboardStore((s) => s.selectedTemplateIds);
  const selectedTemplateFolderIds = useDashboardStore((s) => s.selectedTemplateFolderIds);
  const enterTemplateSelectionMode = useDashboardStore((s) => s.enterTemplateSelectionMode);
  const exitTemplateSelectionMode = useDashboardStore((s) => s.exitTemplateSelectionMode);
  const selectAllTemplates = useDashboardStore((s) => s.selectAllTemplates);
  const selectAllTemplateFolders = useDashboardStore((s) => s.selectAllTemplateFolders);
  const templates = useDashboardStore((s) => s.templates);
  const templateFolders = useDashboardStore((s) => s.templateFolders);
  const bulkDeleteTemplates = useDashboardStore((s) => s.bulkDeleteTemplates);

  // Actions (stable references from zustand)
  const fetchAll = useDashboardStore((s) => s.fetchAll);
  const loadPreferences = useDashboardStore((s) => s.loadPreferences);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
  const setSortMode = useDashboardStore((s) => s.setSortMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const setCardSize = useDashboardStore((s) => s.setCardSize);
  const setShowNewVizDialog = useDashboardStore((s) => s.setShowNewVizDialog);
  const setShowBulkExport = useDashboardStore((s) => s.setShowBulkExport);
  const closeConfirm = useDashboardStore((s) => s.closeConfirm);
  const createVisualization = useDashboardStore((s) => s.createVisualization);
  const createTemplateFolder = useDashboardStore((s) => s.createTemplateFolder);
  const createFolder = useDashboardStore((s) => s.createFolder);
  const fetchTemplatesAction = useDashboardStore((s) => s.fetchTemplates);

  // Ownership filter
  const vizOwnershipFilter = useDashboardStore((s) => s.vizOwnershipFilter);
  const templateOwnershipFilter = useDashboardStore((s) => s.templateOwnershipFilter);
  const setVizOwnershipFilter = useDashboardStore((s) => s.setVizOwnershipFilter);
  const setTemplateOwnershipFilter = useDashboardStore((s) => s.setTemplateOwnershipFilter);

  // Folder dialogs (local)
  const [showNewTemplateFolderDialog, setShowNewTemplateFolderDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // Share template dialog (local)
  const [showShareTemplate, setShowShareTemplate] = useState(false);
  const [shareTemplateIds, setShareTemplateIds] = useState<number[]>([]);
  const [shareFolderIds, setShareFolderIds] = useState<number[]>([]);

  // Share visualization dialog (local)
  const [showShareViz, setShowShareViz] = useState(false);
  const [shareVizIds, setShareVizIds] = useState<number[]>([]);
  const [shareVizFolderIds, setShareVizFolderIds] = useState<number[]>([]);
  const { user } = useAuthStore();

  // Fetch data on mount
  useEffect(() => {
    fetchAll();
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit selection mode when navigating between pages
  useEffect(() => {
    if (isSelectionMode) exitSelectionMode();
    if (isTemplateSelectionMode) exitTemplateSelectionMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Derive page title from pathname
  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard/trash') return 'Trash';
    if (pathname.startsWith('/dashboard/templates')) return 'Templates';
    const match = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
    if (match) {
      const folderId = parseInt(match[1]);
      const folder = folders.find((f) => f.id === folderId);
      return folder?.name || 'Unknown folder';
    }
    return 'Visualizations';
  }, [pathname, folders]);

  const isTrashView = pathname === '/dashboard/trash';
  const isTemplatesView = pathname.startsWith('/dashboard/templates');
  const isNotRoot = pathname !== '/dashboard';

  // Compute visible viz IDs for "Select All" based on current route
  const visibleVizIds = useMemo(() => {
    if (isTemplatesView || isTrashView) return [];
    const folderMatch2 = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
    if (folderMatch2) {
      const fId = parseInt(folderMatch2[1]);
      return visualizations.filter((v) => v.folderId === fId).map((v) => v.id);
    }
    // Root — all viz
    return visualizations.map((v) => v.id);
  }, [pathname, visualizations, isTemplatesView, isTrashView]);

  // Compute visible folder IDs for "Select All" based on current route
  const visibleFolderIds = useMemo(() => {
    if (isTemplatesView || isTrashView) return [];
    const folderMatch2 = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
    if (folderMatch2) {
      // Inside a folder view — no sub-folder cards typically, return empty
      return [];
    }
    // Root — all root-level folders
    return folders.filter((f) => f.parentId === null).map((f) => f.id);
  }, [pathname, folders, isTemplatesView, isTrashView]);

  // Compute visible template IDs for "Select All" based on current route
  const visibleTemplateIds = useMemo(() => {
    if (!isTemplatesView) return [];
    const tplFolderMatch = pathname.match(/^\/dashboard\/templates\/folder\/(\d+)$/);
    if (tplFolderMatch) {
      const fId = parseInt(tplFolderMatch[1]);
      return templates.filter((t) => t.folderId === fId).map((t) => t.id);
    }
    // Templates root — only root-level templates
    return templates.filter((t) => t.folderId === null).map((t) => t.id);
  }, [pathname, templates, isTemplatesView]);

  // Compute visible template folder IDs for "Select All"
  const visibleTemplateFolderIds = useMemo(() => {
    if (!isTemplatesView) return [];
    const tplFolderMatch = pathname.match(/^\/dashboard\/templates\/folder\/(\d+)$/);
    if (tplFolderMatch) {
      const fId = parseInt(tplFolderMatch[1]);
      return templateFolders.filter((f) => f.parentId === fId).map((f) => f.id);
    }
    // Templates root — only root-level template folders
    return templateFolders.filter((f) => f.parentId === null).map((f) => f.id);
  }, [pathname, templateFolders, isTemplatesView]);

  // Check if all visible items are selected (for "All" button active state)
  const allVizSelected = visibleVizIds.length > 0 && visibleVizIds.every((id) => effectiveVizIds.has(id));
  const allFoldersSelected = visibleFolderIds.length === 0 || visibleFolderIds.every((id) => selectedFolderIds.has(id));
  const isAllSelected = isSelectionMode && allVizSelected && allFoldersSelected && (visibleVizIds.length > 0 || visibleFolderIds.length > 0);

  // Check if all visible templates + template folders are selected
  const allTemplatesSelected = visibleTemplateIds.length > 0 && visibleTemplateIds.every((id) => selectedTemplateIds.has(id));
  const allTemplateFoldersSelected = visibleTemplateFolderIds.length === 0 || visibleTemplateFolderIds.every((id) => selectedTemplateFolderIds.has(id));
  const isAllTemplatesSelected = isTemplateSelectionMode && allTemplatesSelected && allTemplateFoldersSelected && (visibleTemplateIds.length > 0 || visibleTemplateFolderIds.length > 0);

  const totalTemplateSelectedCount = selectedTemplateIds.size + selectedTemplateFolderIds.size;

  // Derive activeFolderId for "New visualization" dialog
  const folderMatch = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
  const activeFolderId = folderMatch ? parseInt(folderMatch[1]) : null;

  // Stable callback for create blank
  const handleCreateBlank = useCallback(async () => {
    const id = await createVisualization(activeFolderId);
    if (id) {
      router.push(`/editor/${id}`);
    }
  }, [createVisualization, activeFolderId, router]);

  // Export callback
  const handleExportSelected = useCallback(async (options: import('@/store/dashboardStore').BulkExportOptions) => {
    await handleBulkExport(effectiveVizIds, options);
  }, [handleBulkExport, effectiveVizIds]);

  // Stable callback for confirm dialog close
  const handleConfirmOpenChange = useCallback((open: boolean) => {
    if (!open) closeConfirm();
  }, [closeConfirm]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b shrink-0 z-20">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <MobileSidebar />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Image src="/logo.svg" alt="GraphCooker" width={140} height={32} className="hidden sm:block" />
              <Image src="/icon-sm.svg" alt="GC" width={24} height={24} className="sm:hidden" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isTemplatesView && !isTrashView && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setShowNewFolderDialog(true)}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New folder</span>
              </Button>
            )}
            <Button
              onClick={() => setShowNewVizDialog(true)}
              disabled={creating}
              size="sm"
              className="gap-1.5"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">New visualization</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - desktop only */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-3 sm:px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Breadcrumb: GC icon + chevron + title (only when NOT on root) */}
            {isNotRoot && (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-1 px-1.5 h-8 rounded-md hover:bg-gray-100 transition-colors shrink-0"
                  title="GraphCooker — All visualizations"
                >
                  <Image src="/icon-sm.svg" alt="GC" width={20} height={20} />
                </button>
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              </>
            )}

            <h2 className="text-sm font-semibold text-gray-800 mr-2">
              {isTrashView && <Trash2 className="w-4 h-4 inline-block mr-1.5 text-red-500 -mt-0.5" />}
              {isTemplatesView && <LayoutTemplate className="w-4 h-4 inline-block mr-1.5 text-orange-500 -mt-0.5" />}
              {pageTitle}
            </h2>

            {/* Ownership filter tabs */}
            {!isTrashView && !isTemplatesView && (
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                {([
                  { value: 'all' as OwnershipFilter, label: 'All Visualizations' },
                  { value: 'mine' as OwnershipFilter, label: 'My Visualizations' },
                  { value: 'shared' as OwnershipFilter, label: 'Shared with me' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setVizOwnershipFilter(value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      vizOwnershipFilter === value
                        ? 'bg-white text-gray-800 font-medium shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {isTemplatesView && (
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                {([
                  { value: 'all' as OwnershipFilter, label: 'All Templates' },
                  { value: 'mine' as OwnershipFilter, label: 'My Templates' },
                  { value: 'shared' as OwnershipFilter, label: 'Shared with me' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTemplateOwnershipFilter(value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      templateOwnershipFilter === value
                        ? 'bg-white text-gray-800 font-medium shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Search (hidden on trash view) */}
            {!isTrashView && (
              <div className="relative flex-1 max-w-xs min-w-[120px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search visualizations..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1" />

            {!isTrashView && (
              <>
                {/* Template "New folder" button — only on templates routes */}
                {isTemplatesView && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => setShowNewTemplateFolderDialog(true)}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New folder</span>
                  </Button>
                )}

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
                      <DropdownMenuItem
                        key={mode}
                        onClick={() => setSortMode(mode)}
                        className={`text-xs ${sortMode === mode ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                        {sortLabels[mode]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Card size toggle — only visible when grid mode and on sm+ screens */}
                {viewMode === 'grid' && (
                  <div className="hidden sm:flex border rounded-md overflow-hidden">
                    {(['small', 'medium', 'large'] as const).map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => setCardSize(size)}
                        title={size === 'small' ? 'Small cards' : size === 'medium' ? 'Medium cards' : 'Large cards'}
                        className={`p-1.5 transition-colors ${idx > 0 ? 'border-l' : ''} ${
                          cardSize === size ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <LayoutGrid className={
                          size === 'small' ? 'w-2.5 h-2.5' : size === 'medium' ? 'w-3 h-3' : 'w-3.5 h-3.5'
                        } />
                      </button>
                    ))}
                  </div>
                )}

                {/* View mode */}
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors border-l ${
                      viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200" />

                {/* Select / Selection controls — VIZ pages */}
                {!isTemplatesView && (
                  <>
                    {isSelectionMode ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 tabular-nums">{totalSelectedCount} selected</span>
                        <Button
                          variant={isAllSelected ? 'default' : 'outline'}
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => {
                            if (isAllSelected) {
                              // Deselect all
                              selectAllViz([]);
                              selectAllFolders([]);
                            } else {
                              selectAllViz(visibleVizIds);
                              selectAllFolders(visibleFolderIds);
                            }
                          }}
                        >
                          {isAllSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                          All
                        </Button>
                        {totalSelectedCount > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => {
                                setShareVizIds(Array.from(effectiveVizIds));
                                setShareVizFolderIds(Array.from(selectedFolderIds));
                                setShowShareViz(true);
                              }}
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
                              onClick={() => handleBulkDelete(effectiveVizIds)}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={exitSelectionMode}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={enterSelectionMode}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Select</span>
                      </Button>
                    )}
                  </>
                )}

                {/* Select / Selection controls — TEMPLATE pages */}
                {isTemplatesView && (
                  <>
                    {isTemplateSelectionMode ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 tabular-nums">{totalTemplateSelectedCount} selected</span>
                        <Button
                          variant={isAllTemplatesSelected ? 'default' : 'outline'}
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => {
                            if (isAllTemplatesSelected) {
                              selectAllTemplates([]);
                              selectAllTemplateFolders([]);
                            } else {
                              selectAllTemplates(visibleTemplateIds);
                              selectAllTemplateFolders(visibleTemplateFolderIds);
                            }
                          }}
                        >
                          {isAllTemplatesSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                          All
                        </Button>
                        {totalTemplateSelectedCount > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => {
                                setShareTemplateIds(Array.from(selectedTemplateIds));
                                setShareFolderIds(Array.from(selectedTemplateFolderIds));
                                setShowShareTemplate(true);
                              }}
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
                              onClick={() => bulkDeleteTemplates(selectedTemplateIds)}
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
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={enterTemplateSelectionMode}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Select</span>
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Shared Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={handleConfirmOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />

      <BulkExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        selectedCount={totalSelectedCount}
        selectedIds={Array.from(effectiveVizIds)}
        onExport={handleExportSelected}
      />

      <ShareTemplateDialog
        open={showShareTemplate}
        onOpenChange={setShowShareTemplate}
        templateIds={shareTemplateIds}
        folderIds={shareFolderIds}
        onShared={() => {
          fetchTemplatesAction();
          exitTemplateSelectionMode();
        }}
      />

      <ShareVisualizationDialog
        open={showShareViz}
        onOpenChange={setShowShareViz}
        vizIds={shareVizIds}
        folderIds={shareVizFolderIds}
        userRole={user?.role || 'customer'}
        onShared={() => {
          fetchAll();
          exitSelectionMode();
        }}
      />

      <NewVisualizationDialog
        open={showNewVizDialog}
        onOpenChange={setShowNewVizDialog}
        onCreateBlank={handleCreateBlank}
        activeFolderId={activeFolderId}
      />

      <InputDialog
        open={showNewTemplateFolderDialog}
        onOpenChange={setShowNewTemplateFolderDialog}
        title="New template folder"
        description="Create a folder to organize your templates."
        placeholder="Folder name..."
        confirmLabel="Create"
        onConfirm={(name) => createTemplateFolder(name)}
      />

      <InputDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        title="New folder"
        description="Create a folder to organize your visualizations."
        placeholder="Folder name..."
        confirmLabel="Create"
        onConfirm={(name) => createFolder(name, activeFolderId)}
      />
    </div>
  );
}
