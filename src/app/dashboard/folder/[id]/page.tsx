'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  BarChart3,
  Loader2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
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

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = Number(params.id);

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
  const setShowNewVizDialog = useDashboardStore((s) => s.setShowNewVizDialog);

  // Selection from store
  const isSelectionMode = useDashboardStore((s) => s.isSelectionMode);
  const selectedVizIds = useDashboardStore((s) => s.selectedVizIds);
  const selectedFolderIds = useDashboardStore((s) => s.selectedFolderIds);
  const toggleSelectViz = useDashboardStore((s) => s.toggleSelectViz);
  const toggleSelectFolder = useDashboardStore((s) => s.toggleSelectFolder);

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

  const handleShareFolder = useCallback((sfId: number) => {
    setShareVizIds([]);
    setShareVizFolderIds([sfId]);
    setShowShareViz(true);
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

  // Computed
  const filteredViz = useMemo(() => {
    let result = ownershipViz.filter((v) => v.folderId === folderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q));
    }
    return sortViz(result);
  }, [ownershipViz, folderId, searchQuery, sortViz]);

  const activeSubFolders = useMemo(() => {
    return ownershipFolders.filter((f) => f.parentId === folderId);
  }, [ownershipFolders, folderId]);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  const toggleFolderExpand = useCallback((id: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const subFoldersWithViz = useMemo(() => {
    return activeSubFolders.map((folder) => ({
      folder,
      vizItems: sortViz(visualizations.filter((v) => v.folderId === folder.id)),
    }));
  }, [activeSubFolders, visualizations, sortViz]);

  // Render helpers
  const renderSubFolderGroupHeader = (folder: typeof folders[0], vizCount: number) => {
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
      </div>
    );
  };

  const intrinsicHeight = cardSize === 'small' ? '200px' : cardSize === 'medium' ? '240px' : '280px';

  const renderVizCard = (viz: typeof visualizations[0]) => (
    <div key={viz.id} style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${intrinsicHeight}` }}>
      <VisualizationCard
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
    </div>
  );

  const renderListRow = (viz: typeof visualizations[0]) => (
    <div key={viz.id} style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 48px' }}>
      <ListViewRow
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
    </div>
  );

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Empty folder
  if (filteredViz.length === 0 && activeSubFolders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-300" />
        </div>
        {searchQuery ? (
          <>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
            <p className="text-sm text-gray-500 mb-4">
              No visualizations match &ldquo;{searchQuery}&rdquo;
            </p>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-700 mb-1">This folder is empty</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create a new visualization or move one here
            </p>
            <Button onClick={() => setShowNewVizDialog(true)} disabled={creating} size="sm" className="gap-1.5">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New visualization
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {viewMode === 'grid' ? (
        <div className={gridClass}>
          {activeSubFolders.map((sf) => (
            <FolderCard
              key={`folder-${sf.id}`}
              folder={sf}
              cardSize={cardSize}
              vizCount={folderVizCounts[String(sf.id)] || 0}
              subFolderCount={folderSubCounts[String(sf.id)] || 0}
              allFolders={folders}
              isSelected={selectedFolderIds.has(sf.id)}
              isSelectionMode={isSelectionMode}
              onToggleSelect={toggleSelectFolder}
              onClick={() => router.push(`/dashboard/folder/${sf.id}`)}
              onDrop={(vizId) => moveVizToFolder(vizId, sf.id)}
              onDropFolder={(draggedFolderId) => moveFolderTo(draggedFolderId, sf.id)}
              onRename={renameFolder}
              onDuplicate={duplicateFolder}
              onMove={moveFolderTo}
              onDelete={deleteFolder}
              onShare={handleShareFolder}
            />
          ))}
          {filteredViz.map(renderVizCard)}
        </div>
      ) : (
        <div className="space-y-1">
          {subFoldersWithViz.map(({ folder, vizItems }) => (
            <div key={folder.id}>
              {renderSubFolderGroupHeader(folder, vizItems.length)}
              {expandedFolderIds.has(folder.id) && (
                <div className="ml-6 mt-1">
                  <div className="space-y-1">{vizItems.map(renderListRow)}</div>
                </div>
              )}
            </div>
          ))}
          {filteredViz.map(renderListRow)}
        </div>
      )}
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
