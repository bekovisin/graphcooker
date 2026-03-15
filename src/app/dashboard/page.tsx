'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  BarChart3,
  Loader2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { VisualizationCard } from '@/components/dashboard/VisualizationCard';
import { FolderCard } from '@/components/dashboard/FolderCard';
import { ListViewRow } from '@/components/dashboard/ListViewRow';
import { ShareVisualizationDialog } from '@/components/dashboard/ShareVisualizationDialog';
import { useAuthStore } from '@/store/authStore';
import {
  useDashboardStore,
  useFolderVizCounts,
  useFolderSubCounts,
  useGridClass,
  useSortViz,
} from '@/store/dashboardStore';

export default function AllVisualizationsPage() {
  const router = useRouter();
  // Individual selectors to prevent full-store subscription
  const visualizations = useDashboardStore((s) => s.visualizations);
  const folders = useDashboardStore((s) => s.folders);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const cardSize = useDashboardStore((s) => s.cardSize);
  const loading = useDashboardStore((s) => s.loading);
  const creating = useDashboardStore((s) => s.creating);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
  const deleteViz = useDashboardStore((s) => s.deleteViz);
  const duplicateViz = useDashboardStore((s) => s.duplicateViz);
  const renameViz = useDashboardStore((s) => s.renameViz);
  const moveVizToFolder = useDashboardStore((s) => s.moveVizToFolder);
  const moveFolderTo = useDashboardStore((s) => s.moveFolderTo);
  const renameFolder = useDashboardStore((s) => s.renameFolder);
  const duplicateFolder = useDashboardStore((s) => s.duplicateFolder);
  const deleteFolder = useDashboardStore((s) => s.deleteFolder);
  const createVisualization = useDashboardStore((s) => s.createVisualization);

  // Selection from store
  const isSelectionMode = useDashboardStore((s) => s.isSelectionMode);
  const selectedVizIds = useDashboardStore((s) => s.selectedVizIds);
  const selectedFolderIds = useDashboardStore((s) => s.selectedFolderIds);
  const toggleSelectViz = useDashboardStore((s) => s.toggleSelectViz);
  const toggleSelectFolder = useDashboardStore((s) => s.toggleSelectFolder);
  const selectFolder = useDashboardStore((s) => s.selectFolder);

  const vizOwnershipFilter = useDashboardStore((s) => s.vizOwnershipFilter);
  const sortViz = useSortViz();
  const gridClass = useGridClass();
  const folderVizCounts = useFolderVizCounts();
  const folderSubCounts = useFolderSubCounts();

  // Share state
  const [showShareViz, setShowShareViz] = useState(false);
  const [shareVizIds, setShareVizIds] = useState<number[]>([]);
  const [shareVizFolderIds, setShareVizFolderIds] = useState<number[]>([]);
  const { user } = useAuthStore();

  const handleShareViz = useCallback((vizId: number) => {
    setShareVizIds([vizId]);
    setShareVizFolderIds([]);
    setShowShareViz(true);
  }, []);

  const handleShareFolder = useCallback((folderId: number) => {
    setShareVizIds([]);
    setShareVizFolderIds([folderId]);
    setShowShareViz(true);
  }, []);

  // Local state (non-selection)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  const toggleFolderExpand = useCallback((folderId: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // Pre-filter by ownership
  const ownershipViz = useMemo(() => {
    if (vizOwnershipFilter === 'mine') return visualizations.filter((v) => !v.sharedByUserId);
    if (vizOwnershipFilter === 'shared') return visualizations.filter((v) => !!v.sharedByUserId);
    return visualizations;
  }, [visualizations, vizOwnershipFilter]);

  const ownershipFolders = useMemo(() => {
    if (vizOwnershipFilter === 'mine') return folders.filter((f) => !f.sharedByUserId);
    if (vizOwnershipFilter === 'shared') return folders.filter((f) => !!f.sharedByUserId);
    return folders;
  }, [folders, vizOwnershipFilter]);

  // Computed: root-level viz filtered by search, sorted
  const filteredViz = useMemo(() => {
    let result = ownershipViz.filter((v) => v.folderId === null);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q));
    }
    return sortViz(result);
  }, [ownershipViz, searchQuery, sortViz]);

  // Computed: folder groups (when not searching)
  const folderGroups = useMemo(() => {
    if (searchQuery.trim()) return null;

    const rootViz = sortViz(ownershipViz.filter((v) => v.folderId === null));
    const rootFolders = ownershipFolders.filter((f) => f.parentId === null);
    const foldersWithViz = rootFolders.map((folder) => ({
      folder,
      vizItems: sortViz(ownershipViz.filter((v) => v.folderId === folder.id)),
    }));

    return { rootViz, foldersWithViz, rootFolders };
  }, [ownershipViz, ownershipFolders, searchQuery, sortViz]);

  // Create new
  const createNew = async () => {
    const id = await createVisualization(null);
    if (id) router.push(`/editor/${id}`);
  };

  // Render helpers
  const renderVizCard = (viz: typeof visualizations[0]) => (
    <VisualizationCard
      key={viz.id}
      viz={viz}
      cardSize={cardSize}
      isSelected={selectedVizIds.has(viz.id)}
      isSelectionMode={isSelectionMode}
      onToggleSelect={toggleSelectViz}
      onDelete={deleteViz}
      onDuplicate={duplicateViz}
      onRename={renameViz}
      onMoveToFolder={moveVizToFolder}
      onShare={handleShareViz}
      folders={folders}
    />
  );

  const renderListRow = (viz: typeof visualizations[0]) => (
    <ListViewRow
      key={viz.id}
      viz={viz}
      isSelected={selectedVizIds.has(viz.id)}
      isSelectionMode={isSelectionMode}
      onToggleSelect={toggleSelectViz}
      onDelete={deleteViz}
      onDuplicate={duplicateViz}
      onRename={renameViz}
      onMoveToFolder={moveVizToFolder}
      onShare={handleShareViz}
      folders={folders}
    />
  );

  const renderFolderGroupHeader = (folder: typeof folders[0], vizCount: number) => {
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
        <span className="text-[10px] text-gray-400 tabular-nums">{vizCount}</span>
        {isSelectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              selectFolder(folder.id);
            }}
            className="ml-auto text-[10px] text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
          >
            Select all
          </button>
        )}
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

  // When searching, show flat filtered results
  if (searchQuery.trim()) {
    if (filteredViz.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
          <p className="text-sm text-gray-500 mb-4">
            No visualizations match &ldquo;{searchQuery}&rdquo;
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
            Clear search
          </Button>
        </div>
      );
    }

    return (
      <div>
        {viewMode === 'grid' ? (
          <div className={gridClass}>{filteredViz.map(renderVizCard)}</div>
        ) : (
          <div className="space-y-1">{filteredViz.map(renderListRow)}</div>
        )}
      </div>
    );
  }

  // "All visualizations" view - show folder groups
  if (!folderGroups) return null;
  const { rootViz, foldersWithViz, rootFolders } = folderGroups;

  // Empty state
  if (rootViz.length === 0 && rootFolders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">No visualizations yet</h3>
        <p className="text-sm text-gray-500 mb-4">Create your first chart to get started</p>
        <Button onClick={createNew} disabled={creating} size="sm" className="gap-1.5">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New visualization
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {viewMode === 'grid' ? (
          <div className={gridClass}>
            {rootFolders.map((folder) => (
              <FolderCard
                key={`folder-${folder.id}`}
                folder={folder}
                cardSize={cardSize}
                vizCount={folderVizCounts[String(folder.id)] || 0}
                subFolderCount={folderSubCounts[String(folder.id)] || 0}
                allFolders={folders}
                isSelected={selectedFolderIds.has(folder.id)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={toggleSelectFolder}
                onClick={() => router.push(`/dashboard/folder/${folder.id}`)}
                onDrop={(vizId) => moveVizToFolder(vizId, folder.id)}
                onDropFolder={(draggedFolderId) => moveFolderTo(draggedFolderId, folder.id)}
                onRename={renameFolder}
                onDuplicate={duplicateFolder}
                onMove={moveFolderTo}
                onDelete={deleteFolder}
                onShare={handleShareFolder}
              />
            ))}
            {rootViz.map(renderVizCard)}
          </div>
        ) : (
          <>
            {/* Folder groups in list view */}
            {foldersWithViz.map(({ folder, vizItems }) => (
              <div key={folder.id}>
                {renderFolderGroupHeader(folder, vizItems.length)}
                {expandedFolderIds.has(folder.id) && (
                  <div className="ml-6 mt-1">
                    <div className="space-y-1">{vizItems.map(renderListRow)}</div>
                  </div>
                )}
              </div>
            ))}
            {rootViz.length > 0 && (
              <div>
                {foldersWithViz.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">
                      Uncategorized
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <div className="space-y-1">{rootViz.map(renderListRow)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ShareVisualizationDialog
        open={showShareViz}
        onOpenChange={setShowShareViz}
        vizIds={shareVizIds}
        folderIds={shareVizFolderIds}
        userRole={user?.role || 'customer'}
        onShared={() => {
          useDashboardStore.getState().fetchAll();
        }}
      />
    </div>
  );
}
