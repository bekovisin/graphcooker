'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  BarChart3,
  Loader2,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  Download,
  X,
  Grid3X3,
  List,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardSidebar, FolderItem } from '@/components/dashboard/DashboardSidebar';
import { VisualizationCard, VizItem } from '@/components/dashboard/VisualizationCard';
import { BulkExportDialog } from '@/components/dashboard/BulkExportDialog';

type SortMode = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';

const sortLabels: Record<SortMode, string> = {
  updated_desc: 'Last modified (newest)',
  updated_asc: 'Last modified (oldest)',
  name_asc: 'Name (A-Z)',
  name_desc: 'Name (Z-A)',
  created_desc: 'Created (newest)',
  created_asc: 'Created (oldest)',
};

export default function DashboardPage() {
  const router = useRouter();
  const [visualizations, setVisualizations] = useState<VizItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Dashboard state
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('updated_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch data
  useEffect(() => {
    Promise.all([fetchVisualizations(), fetchFolders()]).finally(() => setLoading(false));
  }, []);

  const fetchVisualizations = async () => {
    try {
      const res = await fetch('/api/visualizations');
      if (res.ok) {
        const data = await res.json();
        setVisualizations(data);
      }
    } catch (error) {
      console.error('Failed to fetch visualizations:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  // Create new visualization
  const createNew = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled visualization',
          folderId: activeFolderId,
        }),
      });
      if (res.ok) {
        const viz = await res.json();
        router.push(`/editor/${viz.id}`);
      }
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setCreating(false);
    }
  };

  // Folder operations
  const handleCreateFolder = async (name: string) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleRenameFolder = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Delete this folder? Visualizations inside will be moved to the root.')) return;
    try {
      // Move all visualizations in this folder to root
      const vizInFolder = visualizations.filter((v) => v.folderId === id);
      await Promise.all(
        vizInFolder.map((v) =>
          fetch(`/api/visualizations/${v.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId: null }),
          })
        )
      );

      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setVisualizations((prev) =>
          prev.map((v) => (v.folderId === id ? { ...v, folderId: null } : v))
        );
        if (activeFolderId === id) setActiveFolderId(null);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  // Visualization operations
  const handleDeleteViz = async (id: number) => {
    if (!confirm('Are you sure you want to delete this visualization?')) return;
    try {
      await fetch(`/api/visualizations/${id}`, { method: 'DELETE' });
      setVisualizations((prev) => prev.filter((v) => v.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleDuplicateViz = async (id: number) => {
    const original = visualizations.find((v) => v.id === id);
    if (!original) return;
    try {
      // Fetch full data
      const fullRes = await fetch(`/api/visualizations/${id}`);
      if (!fullRes.ok) return;
      const fullViz = await fullRes.json();

      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${original.name} (copy)`,
          folderId: original.folderId,
          chartType: original.chartType,
          data: fullViz.data,
          settings: fullViz.settings,
          columnMapping: fullViz.columnMapping,
        }),
      });
      if (res.ok) {
        const newViz = await res.json();
        setVisualizations((prev) => [newViz, ...prev]);
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
    }
  };

  const handleRenameViz = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/visualizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setVisualizations((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
      }
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  };

  const handleMoveToFolder = async (vizId: number, folderId: number | null) => {
    try {
      const res = await fetch(`/api/visualizations/${vizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        setVisualizations((prev) =>
          prev.map((v) => (v.id === vizId ? { ...v, folderId } : v))
        );
      }
    } catch (error) {
      console.error('Failed to move:', error);
    }
  };

  // Selection
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    setSelectedIds(new Set(filteredViz.map((v) => v.id)));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Viz count per folder
  const vizCountByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    visualizations.forEach((v) => {
      if (v.folderId !== null) {
        const key = String(v.folderId);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [visualizations]);

  // Filtered and sorted visualizations
  const filteredViz = useMemo(() => {
    let result = [...visualizations];

    // Filter by folder
    if (activeFolderId !== null) {
      result = result.filter((v) => v.folderId === activeFolderId);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortMode) {
        case 'updated_desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated_asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [visualizations, activeFolderId, searchQuery, sortMode]);

  // Bulk export handler
  const handleBulkExport = async (format: string, options: { width: number; height: number; transparent: boolean; pixelRatio: number }) => {
    // For now, show a message. In production, this would generate exports for each selected viz.
    alert(`Exporting ${selectedIds.size} visualization(s) as ${format.toUpperCase()} at ${options.width}x${options.height}`);
    exitSelectionMode();
  };

  const activeFolderName = activeFolderId !== null
    ? folders.find((f) => f.id === activeFolderId)?.name || 'Unknown folder'
    : 'All visualizations';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shrink-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Flourish</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={createNew} disabled={creating} size="sm" className="gap-1.5">
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              New visualization
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onFolderSelect={setActiveFolderId}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          vizCountByFolder={vizCountByFolder}
          totalVizCount={visualizations.length}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3 shrink-0">
            {/* Title */}
            <h2 className="text-sm font-semibold text-gray-800 mr-2">{activeFolderName}</h2>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
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

            <div className="flex-1" />

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort
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

            {/* Selection mode */}
            {!isSelectionMode ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setIsSelectionMode(true)}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Select
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={selectAll}
                >
                  <Square className="w-3 h-3" />
                  All
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1 text-xs h-7"
                    onClick={() => setShowBulkExport(true)}
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={exitSelectionMode}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredViz.length === 0 ? (
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
                ) : activeFolderId !== null ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">This folder is empty</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Create a new visualization or move one here
                    </p>
                    <Button onClick={createNew} disabled={creating} size="sm" className="gap-1.5">
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      New visualization
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No visualizations yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Create your first chart to get started
                    </p>
                    <Button onClick={createNew} disabled={creating} size="sm" className="gap-1.5">
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      New visualization
                    </Button>
                  </>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredViz.map((viz) => (
                  <VisualizationCard
                    key={viz.id}
                    viz={viz}
                    isSelected={selectedIds.has(viz.id)}
                    isSelectionMode={isSelectionMode}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDeleteViz}
                    onDuplicate={handleDuplicateViz}
                    onRename={handleRenameViz}
                    onMoveToFolder={handleMoveToFolder}
                    folders={folders}
                  />
                ))}
              </div>
            ) : (
              /* List view */
              <div className="space-y-1">
                {filteredViz.map((viz) => (
                  <ListViewRow
                    key={viz.id}
                    viz={viz}
                    isSelected={selectedIds.has(viz.id)}
                    isSelectionMode={isSelectionMode}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDeleteViz}
                    onDuplicate={handleDuplicateViz}
                    onRename={handleRenameViz}
                    onMoveToFolder={handleMoveToFolder}
                    folders={folders}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        selectedCount={selectedIds.size}
        onExport={handleBulkExport}
      />
    </div>
  );
}

/* ── List View Row ── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ListViewRow({ viz, isSelected, isSelectionMode, onToggleSelect, onDelete, onDuplicate, onRename, onMoveToFolder, folders }: {
  viz: VizItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onMoveToFolder: (id: number, folderId: number | null) => void;
  folders: FolderItem[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(viz.name);

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

  const handleRename = () => {
    const name = editValue.trim();
    if (name && name !== viz.name) onRename(viz.id, name);
    else setEditValue(viz.name);
    setIsEditing(false);
  };

  const thumbnailImg = viz.thumbnail
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={viz.thumbnail} alt="" className="w-full h-full object-cover" />
    : <BarChart3 className="w-4 h-4 text-gray-200" />;

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-md cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => {
        if (isSelectionMode) onToggleSelect(viz.id);
        else router.push(`/editor/${viz.id}`);
      }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(viz.id);
          }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-8 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
        {thumbnailImg}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditValue(viz.name);
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="text-sm font-medium bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none w-64"
          />
        ) : (
          <span className="text-sm font-medium text-gray-800 truncate block">{viz.name}</span>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-gray-400 shrink-0">{formatDate(viz.updatedAt)}</span>

      {/* Actions */}
      {!isSelectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(viz.name);
                setIsEditing(true);
              }}
              className="text-xs"
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(viz.id);
              }}
              className="text-xs"
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveToFolder(viz.id, null);
              }}
              className="text-xs"
            >
              Move to root
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(viz.id);
              }}
              className="text-xs text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
