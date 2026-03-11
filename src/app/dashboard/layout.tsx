'use client';

import { useEffect, useMemo } from 'react';
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
import {
  useDashboardStore,
  sortLabels,
  type SortMode,
  type BulkExportOptions,
} from '@/store/dashboardStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const store = useDashboardStore();

  // Fetch data on mount
  useEffect(() => {
    store.fetchAll();
    store.loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive page title from pathname
  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard/trash') return 'Trash';
    if (pathname.startsWith('/dashboard/templates')) return 'Templates';
    const folderMatch = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
    if (folderMatch) {
      const folderId = parseInt(folderMatch[1]);
      const folder = store.folders.find((f) => f.id === folderId);
      return folder?.name || 'Unknown folder';
    }
    return 'All visualizations';
  }, [pathname, store.folders]);

  const isTrashView = pathname === '/dashboard/trash';
  const isTemplatesView = pathname.startsWith('/dashboard/templates');
  const isNotRoot = pathname !== '/dashboard';

  // Derive activeFolderId for "New visualization" dialog
  const folderMatch = pathname.match(/^\/dashboard\/folder\/(\d+)$/);
  const activeFolderId = folderMatch ? parseInt(folderMatch[1]) : null;

  // Create new visualization handler
  const handleCreateBlank = async () => {
    const id = await store.createVisualization(activeFolderId);
    if (id) {
      router.push(`/editor/${id}`);
    }
  };

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
            <Button
              onClick={() => store.setShowNewVizDialog(true)}
              disabled={store.creating}
              size="sm"
              className="gap-1.5"
            >
              {store.creating ? (
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

            {/* Search (hidden on trash view) */}
            {!isTrashView && (
              <div className="relative flex-1 max-w-xs min-w-[120px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={store.searchQuery}
                  onChange={(e) => store.setSearchQuery(e.target.value)}
                  placeholder="Search visualizations..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                />
                {store.searchQuery && (
                  <button
                    onClick={() => store.setSearchQuery('')}
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
                    onClick={() => {
                      const name = prompt('New template folder name:');
                      if (name?.trim()) store.createTemplateFolder(name.trim());
                    }}
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
                        onClick={() => store.setSortMode(mode)}
                        className={`text-xs ${store.sortMode === mode ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                        {sortLabels[mode]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Card size toggle — only visible when grid mode and on sm+ screens */}
                {store.viewMode === 'grid' && (
                  <div className="hidden sm:flex border rounded-md overflow-hidden">
                    {(['small', 'medium', 'large'] as const).map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => store.setCardSize(size)}
                        title={size === 'small' ? 'Small cards' : size === 'medium' ? 'Medium cards' : 'Large cards'}
                        className={`p-1.5 transition-colors ${idx > 0 ? 'border-l' : ''} ${
                          store.cardSize === size ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
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
                    onClick={() => store.setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      store.viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => store.setViewMode('list')}
                    className={`p-1.5 transition-colors border-l ${
                      store.viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
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
        open={store.confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) store.closeConfirm();
        }}
        title={store.confirmDialog.title}
        description={store.confirmDialog.description}
        confirmLabel={store.confirmDialog.confirmLabel}
        variant={store.confirmDialog.variant}
        onConfirm={store.confirmDialog.onConfirm}
      />

      <BulkExportDialog
        open={store.showBulkExport}
        onOpenChange={store.setShowBulkExport}
        selectedCount={0}
        selectedIds={[]}
        onExport={async () => {}}
      />

      <NewVisualizationDialog
        open={store.showNewVizDialog}
        onOpenChange={store.setShowNewVizDialog}
        onCreateBlank={handleCreateBlank}
        activeFolderId={activeFolderId}
      />
    </div>
  );
}
