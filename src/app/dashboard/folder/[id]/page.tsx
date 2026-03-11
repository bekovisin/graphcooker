'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { VisualizationCard } from '@/components/dashboard/VisualizationCard';
import { FolderCard } from '@/components/dashboard/FolderCard';
import { ListViewRow } from '@/components/dashboard/ListViewRow';
import {
  useDashboardStore,
  useVizCountByFolder,
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
  const createVisualization = useDashboardStore((s) => s.createVisualization);

  // Selection from store
  const isSelectionMode = useDashboardStore((s) => s.isSelectionMode);
  const selectedVizIds = useDashboardStore((s) => s.selectedVizIds);
  const selectedFolderIds = useDashboardStore((s) => s.selectedFolderIds);
  const toggleSelectViz = useDashboardStore((s) => s.toggleSelectViz);
  const toggleSelectFolder = useDashboardStore((s) => s.toggleSelectFolder);

  const sortViz = useSortViz();
  const gridClass = useGridClass();
  const vizCountByFolder = useVizCountByFolder();

  // Computed
  const filteredViz = useMemo(() => {
    let result = visualizations.filter((v) => v.folderId === folderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q));
    }
    return sortViz(result);
  }, [visualizations, folderId, searchQuery, sortViz]);

  const activeSubFolders = useMemo(() => {
    return folders.filter((f) => f.parentId === folderId);
  }, [folders, folderId]);

  const createNew = async () => {
    const id = await createVisualization(folderId);
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
      folders={folders}
    />
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
            <Button onClick={createNew} disabled={creating} size="sm" className="gap-1.5">
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
              vizCount={vizCountByFolder[String(sf.id)] || 0}
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
            />
          ))}
          {filteredViz.map(renderVizCard)}
        </div>
      ) : (
        <div className="space-y-1">{filteredViz.map(renderListRow)}</div>
      )}
    </div>
  );
}
