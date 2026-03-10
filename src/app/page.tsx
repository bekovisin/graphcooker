'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardSidebar, FolderItem } from '@/components/dashboard/DashboardSidebar';
import { VisualizationCard, VizItem } from '@/components/dashboard/VisualizationCard';
import { FolderCard } from '@/components/dashboard/FolderCard';
import { BulkExportDialog, BulkExportOptions } from '@/components/dashboard/BulkExportDialog';
import { NewVisualizationDialog } from '@/components/dashboard/NewVisualizationDialog';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toast } from 'sonner';
import { getDescendantIds } from '@/lib/folder-utils';

type SortMode = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';

const sortLabels: Record<SortMode, string> = {
  updated_desc: 'Last modified (newest)',
  updated_asc: 'Last modified (oldest)',
  name_asc: 'Name (A-Z)',
  name_desc: 'Name (Z-A)',
  created_desc: 'Created (newest)',
  created_asc: 'Created (oldest)',
};

export default function DashboardPageWrapper() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const router = useRouter();
  const [visualizations, setVisualizations] = useState<VizItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Dashboard state
  const searchParams = useSearchParams();
  const [activeFolderId, setActiveFolderId] = useState<number | null>(() => {
    const folderParam = searchParams.get('folder');
    return folderParam ? parseInt(folderParam) || null : null;
  });
  const [sortMode, setSortModeLocal] = useState<SortMode>('updated_desc');

  // Load saved sort preference on mount
  useEffect(() => {
    fetch('/api/preferences?key=dashboard_sort')
      .then(res => res.json())
      .then(data => {
        if (data && data.value && sortLabels[data.value as SortMode]) {
          setSortModeLocal(data.value as SortMode);
        }
      })
      .catch(() => {});
  }, []);

  // Wrapper that persists sort mode to database
  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeLocal(mode);
    fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'dashboard_sort', value: mode }),
    }).catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  const [showNewVizDialog, setShowNewVizDialog] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'default';
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Trash state
  const [isTrashView, setIsTrashView] = useState(false);
  const [trashItems, setTrashItems] = useState<{
    visualizations: Array<VizItem & { deletedAt: string }>;
    folders: Array<FolderItem & { deletedAt: string }>;
  }>({ visualizations: [], folders: [] });

  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        setTrashItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error);
    }
  }, []);

  // Fetch trash when entering trash view
  useEffect(() => {
    if (isTrashView) {
      fetchTrash();
    }
  }, [isTrashView, fetchTrash]);

  // Also fetch trash count on initial load
  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Trash action handlers
  const handleRestoreItem = async (id: number, type: 'visualization' | 'folder') => {
    try {
      const res = await fetch(`/api/trash/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        toast.success(`${type === 'folder' ? 'Folder' : 'Visualization'} restored`);
        fetchTrash();
        fetchVisualizations();
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to restore:', error);
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = async (id: number, type: 'visualization' | 'folder') => {
    setConfirmDialog({
      open: true,
      title: 'Permanently delete?',
      description: 'This item will be permanently deleted. This action cannot be undone.',
      confirmLabel: 'Delete permanently',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/trash/${id}?type=${type}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Permanently deleted');
            fetchTrash();
          }
        } catch (error) {
          console.error('Failed to permanently delete:', error);
          toast.error('Failed to delete');
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    const totalItems = trashItems.visualizations.length + trashItems.folders.length;
    if (totalItems === 0) return;

    setConfirmDialog({
      open: true,
      title: 'Empty trash?',
      description: `All ${totalItems} item${totalItems > 1 ? 's' : ''} in the trash will be permanently deleted. This action cannot be undone.`,
      confirmLabel: 'Empty trash',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/trash', { method: 'DELETE' });
          if (res.ok) {
            toast.success('Trash emptied');
            fetchTrash();
            fetchVisualizations();
            fetchFolders();
          }
        } catch (error) {
          console.error('Failed to empty trash:', error);
          toast.error('Failed to empty trash');
        }
      },
    });
  };

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
          folderId: activeFolderId,
        }),
      });
      if (res.ok) {
        const viz = await res.json();
        toast.success('Visualization created');
        router.push(`/editor/${viz.id}`);
      }
    } catch (error) {
      console.error('Failed to create:', error);
      toast.error('Failed to create visualization');
    } finally {
      setCreating(false);
    }
  };

  // Folder operations
  const handleCreateFolder = async (name: string, parentId?: number | null) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: parentId || null }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        toast.success(`Folder "${name}" created`);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
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
        toast.success('Folder renamed');
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    const folder = folders.find((f) => f.id === id);
    const vizInFolder = visualizations.filter((v) => v.folderId === id);

    setConfirmDialog({
      open: true,
      title: `Move "${folder?.name || 'folder'}" to trash?`,
      description: vizInFolder.length > 0
        ? `This folder and its ${vizInFolder.length} visualization${vizInFolder.length > 1 ? 's' : ''} will be moved to trash.`
        : 'This folder will be moved to trash. You can restore it later.',
      confirmLabel: 'Move to trash',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
          if (res.ok) {
            if (activeFolderId === id) setActiveFolderId(null);
            fetchVisualizations();
            fetchFolders();
            fetchTrash();
            toast.success(`Folder "${folder?.name}" moved to trash`);
          }
        } catch (error) {
          console.error('Failed to delete folder:', error);
          toast.error('Failed to move folder to trash');
        }
      },
    });
  };

  const handleDuplicateFolder = async (id: number) => {
    const original = folders.find((f) => f.id === id);
    if (!original) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${original.name} (copy)`, parentId: original.parentId || null }),
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders((prev) => [...prev, newFolder]);
        toast.success(`Folder duplicated as "${newFolder.name}"`);
      }
    } catch (error) {
      console.error('Failed to duplicate folder:', error);
      toast.error('Failed to duplicate folder');
    }
  };

  const handleMoveFolderTo = async (folderId: number, targetParentId: number | null) => {
    // Prevent no-op
    if (folderId === targetParentId) return;
    // Prevent circular reference
    if (targetParentId !== null) {
      const descendants = getDescendantIds(folderId, folders);
      if (descendants.has(targetParentId)) {
        toast.error('Cannot move a folder into its own subfolder');
        return;
      }
    }
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: targetParentId }),
      });
      if (res.ok) {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f))
        );
        const targetName = targetParentId
          ? folders.find((f) => f.id === targetParentId)?.name || 'folder'
          : 'root';
        toast.success(`Folder moved to ${targetName}`);
      }
    } catch (error) {
      console.error('Failed to move folder:', error);
      toast.error('Failed to move folder');
    }
  };

  // Visualization operations
  const handleDeleteViz = async (id: number) => {
    const viz = visualizations.find((v) => v.id === id);
    setConfirmDialog({
      open: true,
      title: 'Move to trash?',
      description: `"${viz?.name || 'Untitled'}" will be moved to the trash. You can restore it later.`,
      confirmLabel: 'Move to trash',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await fetch(`/api/visualizations/${id}`, { method: 'DELETE' });
          setVisualizations((prev) => prev.filter((v) => v.id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          fetchTrash();
          toast.success('Moved to trash');
        } catch (error) {
          console.error('Failed to delete:', error);
          toast.error('Failed to move to trash');
        }
      },
    });
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
        toast.success('Visualization duplicated');
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
      toast.error('Failed to duplicate visualization');
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
        toast.success('Visualization renamed');
      }
    } catch (error) {
      console.error('Failed to rename:', error);
      toast.error('Failed to rename visualization');
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
        const folderName = folderId ? folders.find((f) => f.id === folderId)?.name : 'root';
        toast.success(`Moved to ${folderName}`);
      }
    } catch (error) {
      console.error('Failed to move:', error);
      toast.error('Failed to move visualization');
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

  // Select all visualizations in a folder (for folder-level selection)
  const selectFolder = useCallback((folderId: number) => {
    const vizInFolder = visualizations.filter((v) => v.folderId === folderId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      vizInFolder.forEach((v) => next.add(v.id));
      return next;
    });
    if (!isSelectionMode) setIsSelectionMode(true);
  }, [visualizations, isSelectionMode]);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Toggle folder expand in "All visualizations" view
  const toggleFolderExpand = useCallback((folderId: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

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

  // Sort function
  const sortViz = useCallback((arr: VizItem[]) => {
    return [...arr].sort((a, b) => {
      switch (sortMode) {
        case 'updated_desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated_asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [sortMode]);

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

    return sortViz(result);
  }, [visualizations, activeFolderId, searchQuery, sortViz]);

  // For "All visualizations" view - group by folder
  const folderGroups = useMemo(() => {
    if (activeFolderId !== null || searchQuery.trim()) return null;

    const rootViz = sortViz(visualizations.filter((v) => v.folderId === null));
    const rootFolders = folders.filter((f) => f.parentId === null);
    const foldersWithViz = rootFolders
      .map((folder) => ({
        folder,
        vizItems: sortViz(visualizations.filter((v) => v.folderId === folder.id)),
      }));

    return { rootViz, foldersWithViz, rootFolders };
  }, [visualizations, folders, activeFolderId, searchQuery, sortViz]);

  // Sub-folders for current active folder view
  const activeSubFolders = useMemo(() => {
    if (activeFolderId === null) return [];
    return folders.filter((f) => f.parentId === activeFolderId);
  }, [folders, activeFolderId]);

  // Bulk export handler — renders charts offscreen, captures as blobs, bundles into a ZIP
  const handleBulkExport = async (exportOptions: BulkExportOptions) => {
    const toExport = visualizations.filter((v) => selectedIds.has(v.id));
    if (toExport.length === 0) return;

    const { format, width, height, transparent, pixelRatio, usePerChartDimensions } = exportOptions;

    const extMap: Record<string, string> = { png: '.png', svg: '.svg', pdf: '.pdf', html: '.html' };
    const ext = extMap[format] || `.${format}`;

    toast.promise(
      (async () => {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        let exported = 0;
        let failed = 0;

        for (const viz of toExport) {
          try {
            // Fetch full visualization data (settings, data, columnMapping)
            const res = await fetch(`/api/visualizations/${viz.id}`);
            if (!res.ok) {
              failed++;
              continue;
            }
            const fullViz = await res.json();

            const { defaultChartSettings, defaultData, defaultColumnMapping } = await import(
              '@/lib/chart/config'
            );

            const vizData = Array.isArray(fullViz.data) && fullViz.data.length > 0
              ? fullViz.data
              : defaultData;
            const vizSettings =
              fullViz.settings && Object.keys(fullViz.settings).length > 0
                ? { ...defaultChartSettings, ...fullViz.settings }
                : defaultChartSettings;
            const vizMapping =
              fullViz.columnMapping && Object.keys(fullViz.columnMapping).length > 0
                ? fullViz.columnMapping
                : defaultColumnMapping;
            const vizName = (viz.name || 'chart').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();

            // Extract columnOrder and seriesNames persisted inside columnMapping
            const vizColumnOrder: string[] = vizMapping?._columnOrder ||
              (Array.isArray(vizData) && vizData.length > 0 ? Object.keys(vizData[0]) : []);
            const vizSeriesNames: Record<string, string> = vizMapping?.seriesNames || {};

            // Determine export dimensions (per-chart or uniform)
            let chartWidth = width;
            let chartHeight = height;
            if (usePerChartDimensions) {
              const { deriveExportDimensions } = await import(
                '@/lib/export/deriveExportDimensions'
              );
              const dims = deriveExportDimensions(fullViz.settings, fullViz.columnMapping);
              chartWidth = dims.width;
              chartHeight = dims.height;
            }

            // Build a safe filename (deduplicate if needed)
            const fileName = `${vizName}${ext}`;

            if (format === 'html') {
              // HTML export doesn't need offscreen rendering — build HTML blob directly
              const { captureAsHtmlBlob } = await import('@/lib/export/captureChart');
              const blob = await captureAsHtmlBlob(vizSettings, vizData, vizMapping, {
                width: chartWidth,
                height: chartHeight,
                transparent,
              });
              zip.file(fileName, blob);
            } else {
              // Render chart offscreen at the requested dimensions
              const { renderChartOffscreen } = await import(
                '@/lib/export/renderChartOffscreen'
              );
              const { container, cleanup } = await renderChartOffscreen(
                vizSettings,
                vizData,
                vizMapping,
                { width: chartWidth, height: chartHeight, transparent },
                vizColumnOrder,
                vizSeriesNames,
              );

              try {
                const { captureAsPngBlob, captureAsSvgBlob, captureAsPdfBlob } = await import(
                  '@/lib/export/captureChart'
                );

                let blob: Blob;
                switch (format) {
                  case 'png':
                    blob = await captureAsPngBlob(container, { transparent, pixelRatio });
                    break;
                  case 'svg':
                    blob = await captureAsSvgBlob(container, { transparent });
                    break;
                  case 'pdf':
                    blob = await captureAsPdfBlob(container, { transparent });
                    break;
                  default:
                    blob = await captureAsPngBlob(container, { transparent, pixelRatio });
                }
                zip.file(fileName, blob);
              } finally {
                cleanup();
              }
            }

            exported++;
          } catch (e) {
            console.error(`Failed to export ${viz.name}:`, e);
            failed++;
          }
        }

        if (exported === 0) {
          throw new Error('No visualizations could be exported');
        }

        // Generate and download the ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualizations-${format}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (failed > 0) {
          toast.info(`${failed} visualization(s) could not be exported.`);
        }
      })(),
      {
        loading: `Exporting ${toExport.length} visualization${toExport.length > 1 ? 's' : ''} as ${format.toUpperCase()}...`,
        success: `Exported ${toExport.length} file${toExport.length > 1 ? 's' : ''} as ${format.toUpperCase()} (ZIP)`,
        error: 'Export failed',
      }
    );

    exitSelectionMode();
  };

  // Bulk delete handler (move to trash)
  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    setConfirmDialog({
      open: true,
      title: `Move ${count} visualization${count > 1 ? 's' : ''} to trash?`,
      description: `${count} selected visualization${count > 1 ? 's' : ''} will be moved to trash. You can restore them later.`,
      confirmLabel: `Move to trash`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const idsToDelete = Array.from(selectedIds);
          await Promise.all(
            idsToDelete.map((id) =>
              fetch(`/api/visualizations/${id}`, { method: 'DELETE' })
            )
          );
          setVisualizations((prev) => prev.filter((v) => !selectedIds.has(v.id)));
          fetchTrash();
          toast.success(`Moved ${count} visualization${count > 1 ? 's' : ''} to trash`);
          exitSelectionMode();
        } catch (error) {
          console.error('Failed to bulk delete:', error);
          toast.error('Failed to move some visualizations to trash');
        }
      },
    });
  };

  // Single export handler (for sidebar export button)
  const handleExportSingle = (id: number) => {
    setSelectedIds(new Set([id]));
    setIsSelectionMode(true);
    setShowBulkExport(true);
  };

  const activeFolderName = isTrashView
    ? 'Trash'
    : activeFolderId !== null
    ? folders.find((f) => f.id === activeFolderId)?.name || 'Unknown folder'
    : 'All visualizations';

  const renderVizCard = (viz: VizItem) => (
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
  );

  const renderListRow = (viz: VizItem) => (
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
  );

  // Render folder group header
  const renderFolderGroupHeader = (folder: FolderItem, vizCount: number) => {
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

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }

    // Trash view
    if (isTrashView) {
      const totalTrash = trashItems.visualizations.length + trashItems.folders.length;
      if (totalTrash === 0) {
        return (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Trash is empty</h3>
            <p className="text-sm text-gray-500">Deleted items will appear here</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{totalTrash} item{totalTrash > 1 ? 's' : ''} in trash</p>
            <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={handleEmptyTrash}>
              <Trash2 className="w-3.5 h-3.5" />
              Empty trash
            </Button>
          </div>

          {/* Trashed folders */}
          {trashItems.folders.map((folder) => (
            <div
              key={`trash-folder-${folder.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              <FolderOpen className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">{folder.name}</span>
                <span className="text-[10px] text-gray-400">
                  Folder · Deleted {new Date(folder.deletedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleRestoreItem(folder.id, 'folder')}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handlePermanentDelete(folder.id, 'folder')}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {/* Trashed visualizations */}
          {trashItems.visualizations.map((viz) => (
            <div
              key={`trash-viz-${viz.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-7 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                {viz.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viz.thumbnail} alt="" className="w-full h-full object-contain" />
                ) : (
                  <BarChart3 className="w-4 h-4 text-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">{viz.name}</span>
                <span className="text-[10px] text-gray-400">
                  {viz.chartType} · Deleted {new Date(viz.deletedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleRestoreItem(viz.id, 'visualization')}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handlePermanentDelete(viz.id, 'visualization')}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // If in a specific folder or searching, show flat list
    if (activeFolderId !== null || searchQuery.trim()) {
      if (filteredViz.length === 0) {
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

      return viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeSubFolders.map((sf) => (
            <FolderCard
              key={`folder-${sf.id}`}
              folder={sf}
              vizCount={vizCountByFolder[String(sf.id)] || 0}
              allFolders={folders}
              onClick={() => setActiveFolderId(sf.id)}
              onDrop={(vizId) => handleMoveToFolder(vizId, sf.id)}
              onDropFolder={(draggedFolderId) => handleMoveFolderTo(draggedFolderId, sf.id)}
              onRename={handleRenameFolder}
              onDuplicate={handleDuplicateFolder}
              onMove={handleMoveFolderTo}
              onDelete={handleDeleteFolder}
            />
          ))}
          {filteredViz.map(renderVizCard)}
        </div>
      ) : (
        <div className="space-y-1">{filteredViz.map(renderListRow)}</div>
      );
    }

    // "All visualizations" view - show folder groups
    if (!folderGroups) return null;
    const { rootViz, foldersWithViz, rootFolders } = folderGroups;

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
      <div className="space-y-4">
        {/* Folder cards + root viz in one grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {rootFolders.map((folder) => (
              <FolderCard
                key={`folder-${folder.id}`}
                folder={folder}
                vizCount={vizCountByFolder[String(folder.id)] || 0}
                allFolders={folders}
                onClick={() => setActiveFolderId(folder.id)}
                onDrop={(vizId) => handleMoveToFolder(vizId, folder.id)}
                onDropFolder={(draggedFolderId) => handleMoveFolderTo(draggedFolderId, folder.id)}
                onRename={handleRenameFolder}
                onDuplicate={handleDuplicateFolder}
                onMove={handleMoveFolderTo}
                onDelete={handleDeleteFolder}
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
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b shrink-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gray-900">Graph</span>
              <span className="text-orange-500">Cooker</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowNewVizDialog(true)} disabled={creating} size="sm" className="gap-1.5">
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
          visualizations={visualizations}
          activeFolderId={isTrashView ? null : activeFolderId}
          onFolderSelect={(folderId) => {
            setActiveFolderId(folderId);
            setIsTrashView(false);
          }}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveToFolder={handleMoveToFolder}
          onMoveFolderToFolder={handleMoveFolderTo}
          vizCountByFolder={vizCountByFolder}
          totalVizCount={visualizations.length}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onExportSingle={handleExportSingle}
          onTrashSelect={() => {
            setIsTrashView(true);
            setActiveFolderId(null);
            exitSelectionMode();
          }}
          isTrashActive={isTrashView}
          trashCount={trashItems.visualizations.length + trashItems.folders.length}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3 shrink-0">
            {/* Title */}
            <h2 className="text-sm font-semibold text-gray-800 mr-2">
              {isTrashView && <Trash2 className="w-4 h-4 inline-block mr-1.5 text-red-500 -mt-0.5" />}
              {activeFolderName}
            </h2>

            {!isTrashView && (
              <>
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
              </>
            )}

            <div className="flex-1" />

            {!isTrashView && (
              <>
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
              </>
            )}

            {/* Selection mode */}
            {!isTrashView && (
              !isSelectionMode ? (
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
                    <>
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
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </>
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
              )
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        onExport={handleBulkExport}
      />

      {/* New Visualization Dialog */}
      <NewVisualizationDialog
        open={showNewVizDialog}
        onOpenChange={setShowNewVizDialog}
        onCreateBlank={createNew}
        activeFolderId={activeFolderId}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}

/* ── List View Row ── */
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
    ? <img src={viz.thumbnail} alt="" className="w-full h-full object-contain" />
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
      draggable={!isSelectionMode && !isEditing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(viz.id));
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '0.5';
        }
      }}
      onDragEnd={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '1';
        }
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
            {folders.length > 0 && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToFolder(viz.id, null);
                }}
                className="text-xs"
              >
                Move to root
              </DropdownMenuItem>
            )}
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
