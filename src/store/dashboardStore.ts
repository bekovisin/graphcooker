import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { getDescendantIds } from '@/lib/folder-utils';

// Types
export type SortMode = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';
export type OwnershipFilter = 'all' | 'mine' | 'shared';

export const sortLabels: Record<SortMode, string> = {
  updated_desc: 'Last modified (newest)',
  updated_asc: 'Last modified (oldest)',
  name_asc: 'Name (A-Z)',
  name_desc: 'Name (Z-A)',
  created_desc: 'Created (newest)',
  created_asc: 'Created (oldest)',
};

export interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  sharedByUserId: number | null;
  sharedByName: string | null;
  createdAt: string;
}

export interface VizItem {
  id: number;
  projectId: number;
  name: string;
  folderId: number | null;
  chartType: string;
  thumbnail: string | null;
  sharedByUserId: number | null;
  sharedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: number;
  templateName: string;
  chartType: string;
  thumbnail: string | null;
  folderId: number | null;
  sharedByUserId: number | null;
  sharedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFolderItem {
  id: number;
  name: string;
  parentId: number | null;
  sharedByUserId: number | null;
  sharedByName: string | null;
  createdAt: string;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'danger' | 'warning' | 'default';
  onConfirm: () => void | Promise<void>;
}

interface DashboardState {
  // Data
  visualizations: VizItem[];
  folders: FolderItem[];
  templates: TemplateItem[];
  templateFolders: TemplateFolderItem[];
  trashItems: {
    visualizations: Array<VizItem & { deletedAt: string }>;
    folders: Array<FolderItem & { deletedAt: string }>;
  };
  loading: boolean;

  // Preferences
  sortMode: SortMode;
  viewMode: 'grid' | 'list';
  cardSize: 'small' | 'medium' | 'large';
  searchQuery: string;
  vizOwnershipFilter: OwnershipFilter;
  templateOwnershipFilter: OwnershipFilter;

  // UI state
  confirmDialog: ConfirmDialogState;
  showNewVizDialog: boolean;
  showBulkExport: boolean;
  creating: boolean;

  // Selection state (shared across pages)
  isSelectionMode: boolean;
  selectedVizIds: Set<number>;
  selectedFolderIds: Set<number>;

  // Template selection state (shared across template pages)
  isTemplateSelectionMode: boolean;
  selectedTemplateIds: Set<number>;
  selectedTemplateFolderIds: Set<number>;
  applyingTemplateId: number | null;

  // Actions - Fetch
  fetchAll: () => Promise<void>;
  fetchVisualizations: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchTemplateFolders: () => Promise<void>;
  fetchTrash: () => Promise<void>;
  loadPreferences: () => Promise<void>;

  // Actions - Preferences
  setSortMode: (mode: SortMode) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setCardSize: (size: 'small' | 'medium' | 'large') => void;
  setSearchQuery: (query: string) => void;
  setVizOwnershipFilter: (filter: OwnershipFilter) => void;
  setTemplateOwnershipFilter: (filter: OwnershipFilter) => void;

  // Actions - UI
  showConfirm: (opts: Omit<ConfirmDialogState, 'open'>) => void;
  closeConfirm: () => void;
  setShowNewVizDialog: (show: boolean) => void;
  setShowBulkExport: (show: boolean) => void;

  // Actions - Selection
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelectViz: (id: number) => void;
  toggleSelectFolder: (id: number) => void;
  selectAllViz: (ids: number[]) => void;
  selectAllFolders: (ids: number[]) => void;
  selectFolder: (folderId: number) => void;

  // Actions - Template Selection
  enterTemplateSelectionMode: () => void;
  exitTemplateSelectionMode: () => void;
  toggleSelectTemplate: (id: number) => void;
  toggleSelectTemplateFolder: (id: number) => void;
  selectAllTemplates: (ids: number[]) => void;
  selectAllTemplateFolders: (ids: number[]) => void;

  // Actions - Visualization CRUD
  createVisualization: (folderId: number | null) => Promise<number | null>;
  deleteViz: (id: number) => void;
  duplicateViz: (id: number) => Promise<void>;
  renameViz: (id: number, name: string) => Promise<void>;
  moveVizToFolder: (vizId: number, folderId: number | null) => Promise<void>;
  handleBulkDelete: (selectedIds: Set<number>) => void;
  handleBulkExport: (selectedIds: Set<number>, exportOptions: BulkExportOptions) => Promise<void>;
  handleExportSingle: (id: number) => void;

  // Actions - Folder CRUD
  createFolder: (name: string, parentId?: number | null) => Promise<void>;
  renameFolder: (id: number, name: string) => Promise<void>;
  deleteFolder: (id: number) => void;
  duplicateFolder: (id: number) => Promise<void>;
  moveFolderTo: (folderId: number, targetParentId: number | null) => Promise<void>;

  // Actions - Template CRUD
  deleteTemplate: (id: number) => void;
  applyTemplate: (templateId: number) => Promise<number | null>;
  createTemplateFolder: (name: string, parentId?: number | null) => Promise<void>;
  renameTemplateFolder: (id: number, name: string) => Promise<void>;
  deleteTemplateFolder: (id: number) => void;
  moveTemplateToFolder: (templateId: number, folderId: number | null) => Promise<void>;
  moveTemplateFolderTo: (folderId: number, targetParentId: number | null) => Promise<void>;
  duplicateTemplateFolder: (id: number) => Promise<void>;
  bulkDeleteTemplates: (selectedIds: Set<number>, exitCb?: () => void) => void;

  // Actions - Trash
  restoreTrashItem: (id: number, type: 'visualization' | 'folder') => Promise<void>;
  permanentDeleteTrashItem: (id: number, type: 'visualization' | 'folder') => void;
  emptyTrash: () => void;
}

export interface BulkExportOptions {
  format: string;
  width: number;
  height: number;
  transparent: boolean;
  pixelRatio: number;
  usePerChartDimensions: boolean;
}

const persistPref = (key: string, value: string) => {
  fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(() => {});
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial data
  visualizations: [],
  folders: [],
  templates: [],
  templateFolders: [],
  trashItems: { visualizations: [], folders: [] },
  loading: true,

  // Initial preferences
  sortMode: 'updated_desc',
  viewMode: 'grid',
  cardSize: 'large',
  searchQuery: '',
  vizOwnershipFilter: 'all',
  templateOwnershipFilter: 'all',

  // Initial UI
  confirmDialog: {
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm: () => {},
  },
  showNewVizDialog: false,
  showBulkExport: false,
  creating: false,

  // Selection
  isSelectionMode: false,
  selectedVizIds: new Set<number>(),
  selectedFolderIds: new Set<number>(),

  // Template selection
  isTemplateSelectionMode: false,
  selectedTemplateIds: new Set<number>(),
  selectedTemplateFolderIds: new Set<number>(),
  applyingTemplateId: null,

  // Fetch actions
  fetchVisualizations: async () => {
    try {
      const res = await fetch('/api/visualizations');
      if (res.ok) {
        const data = await res.json();
        set({ visualizations: data });
      }
    } catch (error) {
      console.error('Failed to fetch visualizations:', error);
    }
  },

  fetchFolders: async () => {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        set({ folders: data });
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  },

  fetchTemplates: async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        set({ templates: data });
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  },

  fetchTemplateFolders: async () => {
    try {
      const res = await fetch('/api/template-folders');
      if (res.ok) {
        const data = await res.json();
        set({ templateFolders: data });
      }
    } catch (error) {
      console.error('Failed to fetch template folders:', error);
    }
  },

  fetchTrash: async () => {
    try {
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        set({ trashItems: data });
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error);
    }
  },

  fetchAll: async () => {
    const { fetchVisualizations, fetchFolders, fetchTemplates, fetchTemplateFolders, fetchTrash } = get();
    await Promise.all([
      fetchVisualizations(),
      fetchFolders(),
      fetchTemplates(),
      fetchTemplateFolders(),
      fetchTrash(),
    ]);
    set({ loading: false });
  },

  loadPreferences: async () => {
    const loadPref = (key: string) =>
      fetch(`/api/preferences?key=${key}`).then(r => r.json()).catch(() => null);

    const [sortData, viewData, sizeData] = await Promise.all([
      loadPref('dashboard_sort'),
      loadPref('dashboard_view_mode'),
      loadPref('dashboard_card_size'),
    ]);

    const updates: Partial<DashboardState> = {};
    if (sortData?.value && sortLabels[sortData.value as SortMode]) {
      updates.sortMode = sortData.value as SortMode;
    }
    if (viewData?.value && ['grid', 'list'].includes(viewData.value)) {
      updates.viewMode = viewData.value as 'grid' | 'list';
    }
    if (sizeData?.value && ['small', 'medium', 'large'].includes(sizeData.value)) {
      updates.cardSize = sizeData.value as 'small' | 'medium' | 'large';
    }
    if (Object.keys(updates).length > 0) set(updates);
  },

  // Preference setters
  setSortMode: (mode) => {
    set({ sortMode: mode });
    persistPref('dashboard_sort', mode);
  },
  setViewMode: (mode) => {
    set({ viewMode: mode });
    persistPref('dashboard_view_mode', mode);
  },
  setCardSize: (size) => {
    set({ cardSize: size });
    persistPref('dashboard_card_size', size);
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setVizOwnershipFilter: (filter) => set({ vizOwnershipFilter: filter }),
  setTemplateOwnershipFilter: (filter) => set({ templateOwnershipFilter: filter }),

  // UI actions
  showConfirm: (opts) => set({ confirmDialog: { ...opts, open: true } }),
  closeConfirm: () => set((s) => ({ confirmDialog: { ...s.confirmDialog, open: false } })),
  setShowNewVizDialog: (show) => set({ showNewVizDialog: show }),
  setShowBulkExport: (show) => set({ showBulkExport: show }),

  // Selection actions
  enterSelectionMode: () => set({ isSelectionMode: true }),
  exitSelectionMode: () => set({ isSelectionMode: false, selectedVizIds: new Set(), selectedFolderIds: new Set() }),
  toggleSelectViz: (id) => set((s) => {
    const next = new Set(s.selectedVizIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedVizIds: next };
  }),
  toggleSelectFolder: (id) => set((s) => {
    const next = new Set(s.selectedFolderIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedFolderIds: next };
  }),
  selectAllViz: (ids) => set({ selectedVizIds: new Set(ids) }),
  selectAllFolders: (ids) => set({ selectedFolderIds: new Set(ids) }),
  selectFolder: (folderId) => {
    const vizInFolder = get().visualizations.filter((v) => v.folderId === folderId);
    set((s) => {
      const next = new Set(s.selectedVizIds);
      vizInFolder.forEach((v) => next.add(v.id));
      const nextFolders = new Set(s.selectedFolderIds);
      nextFolders.add(folderId);
      return { selectedVizIds: next, selectedFolderIds: nextFolders, isSelectionMode: true };
    });
  },

  // Template selection actions
  enterTemplateSelectionMode: () => set({ isTemplateSelectionMode: true }),
  exitTemplateSelectionMode: () => set({ isTemplateSelectionMode: false, selectedTemplateIds: new Set(), selectedTemplateFolderIds: new Set() }),
  toggleSelectTemplate: (id) => set((s) => {
    const next = new Set(s.selectedTemplateIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedTemplateIds: next };
  }),
  toggleSelectTemplateFolder: (id) => set((s) => {
    const next = new Set(s.selectedTemplateFolderIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedTemplateFolderIds: next };
  }),
  selectAllTemplates: (ids) => set({ selectedTemplateIds: new Set(ids) }),
  selectAllTemplateFolders: (ids) => set({ selectedTemplateFolderIds: new Set(ids) }),

  // Visualization CRUD
  createVisualization: async (folderId) => {
    set({ creating: true });
    try {
      const res = await fetch('/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        const viz = await res.json();
        toast.success('Visualization created');
        return viz.id as number;
      }
    } catch (error) {
      console.error('Failed to create:', error);
      toast.error('Failed to create visualization');
    } finally {
      set({ creating: false });
    }
    return null;
  },

  deleteViz: (id) => {
    const viz = get().visualizations.find((v) => v.id === id);
    set({
      confirmDialog: {
        open: true,
        title: 'Move to trash?',
        description: `"${viz?.name || 'Untitled'}" will be moved to the trash. You can restore it later.`,
        confirmLabel: 'Move to trash',
        variant: 'warning',
        onConfirm: async () => {
          try {
            await fetch(`/api/visualizations/${id}`, { method: 'DELETE' });
            set((s) => ({ visualizations: s.visualizations.filter((v) => v.id !== id) }));
            get().fetchTrash();
            toast.success('Moved to trash');
          } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to move to trash');
          }
        },
      },
    });
  },

  duplicateViz: async (id) => {
    const original = get().visualizations.find((v) => v.id === id);
    if (!original) return;
    try {
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
        set((s) => ({ visualizations: [newViz, ...s.visualizations] }));
        toast.success('Visualization duplicated');
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
      toast.error('Failed to duplicate visualization');
    }
  },

  renameViz: async (id, name) => {
    try {
      const res = await fetch(`/api/visualizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        set((s) => ({ visualizations: s.visualizations.map((v) => (v.id === id ? { ...v, name } : v)) }));
        toast.success('Visualization renamed');
      }
    } catch (error) {
      console.error('Failed to rename:', error);
      toast.error('Failed to rename visualization');
    }
  },

  moveVizToFolder: async (vizId, folderId) => {
    try {
      const res = await fetch(`/api/visualizations/${vizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        set((s) => ({
          visualizations: s.visualizations.map((v) => (v.id === vizId ? { ...v, folderId } : v)),
        }));
        const folderName = folderId ? get().folders.find((f) => f.id === folderId)?.name : 'root';
        toast.success(`Moved to ${folderName}`);
      }
    } catch (error) {
      console.error('Failed to move:', error);
      toast.error('Failed to move visualization');
    }
  },

  handleBulkDelete: (selectedIds) => {
    const count = selectedIds.size;
    if (count === 0) return;
    set({
      confirmDialog: {
        open: true,
        title: `Move ${count} visualization${count > 1 ? 's' : ''} to trash?`,
        description: `${count} selected visualization${count > 1 ? 's' : ''} will be moved to trash. You can restore them later.`,
        confirmLabel: 'Move to trash',
        variant: 'warning',
        onConfirm: async () => {
          try {
            await Promise.all(
              Array.from(selectedIds).map((id) =>
                fetch(`/api/visualizations/${id}`, { method: 'DELETE' })
              )
            );
            set((s) => ({ visualizations: s.visualizations.filter((v) => !selectedIds.has(v.id)) }));
            get().fetchTrash();
            toast.success(`Moved ${count} visualization${count > 1 ? 's' : ''} to trash`);
          } catch (error) {
            console.error('Failed to bulk delete:', error);
            toast.error('Failed to move some visualizations to trash');
          }
        },
      },
    });
  },

  handleBulkExport: async (selectedIds, exportOptions) => {
    const { visualizations } = get();
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
            const res = await fetch(`/api/visualizations/${viz.id}`);
            if (!res.ok) { failed++; continue; }
            const fullViz = await res.json();
            const { defaultChartSettings, defaultData, defaultColumnMapping } = await import('@/lib/chart/config');

            const vizData = Array.isArray(fullViz.data) && fullViz.data.length > 0 ? fullViz.data : defaultData;
            const vizSettings = fullViz.settings && Object.keys(fullViz.settings).length > 0 ? { ...defaultChartSettings, ...fullViz.settings } : defaultChartSettings;
            const vizMapping = fullViz.columnMapping && Object.keys(fullViz.columnMapping).length > 0 ? fullViz.columnMapping : defaultColumnMapping;
            const vizName = (viz.name || 'chart').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
            const vizColumnOrder: string[] = vizMapping?._columnOrder || (Array.isArray(vizData) && vizData.length > 0 ? Object.keys(vizData[0]) : []);
            const vizSeriesNames: Record<string, string> = vizMapping?.seriesNames || {};

            let chartWidth = width;
            let chartHeight = height;
            if (usePerChartDimensions) {
              const { deriveExportDimensions } = await import('@/lib/export/deriveExportDimensions');
              const dims = deriveExportDimensions(fullViz.settings, fullViz.columnMapping);
              chartWidth = dims.width;
              chartHeight = dims.height;
            }

            const fileName = `${vizName}${ext}`;

            if (format === 'html') {
              const { captureAsHtmlBlob } = await import('@/lib/export/captureChart');
              const blob = await captureAsHtmlBlob(vizSettings, vizData, vizMapping, { width: chartWidth, height: chartHeight, transparent });
              zip.file(fileName, blob);
            } else {
              const { renderChartOffscreen } = await import('@/lib/export/renderChartOffscreen');
              const { container, cleanup } = await renderChartOffscreen(vizSettings, vizData, vizMapping, { width: chartWidth, height: chartHeight, transparent }, vizColumnOrder, vizSeriesNames);
              try {
                const { captureAsPngBlob, captureAsSvgBlob, captureAsPdfBlob } = await import('@/lib/export/captureChart');
                let blob: Blob;
                switch (format) {
                  case 'png': blob = await captureAsPngBlob(container, { transparent, pixelRatio }); break;
                  case 'svg': blob = await captureAsSvgBlob(container, { transparent }); break;
                  case 'pdf': blob = await captureAsPdfBlob(container, { transparent }); break;
                  default: blob = await captureAsPngBlob(container, { transparent, pixelRatio });
                }
                zip.file(fileName, blob);
              } finally { cleanup(); }
            }
            exported++;
          } catch (e) {
            console.error(`Failed to export ${viz.name}:`, e);
            failed++;
          }
        }

        if (exported === 0) throw new Error('No visualizations could be exported');

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualizations-${format}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (failed > 0) toast.info(`${failed} visualization(s) could not be exported.`);
      })(),
      {
        loading: `Exporting ${toExport.length} visualization${toExport.length > 1 ? 's' : ''} as ${format.toUpperCase()}...`,
        success: `Exported ${toExport.length} file${toExport.length > 1 ? 's' : ''} as ${format.toUpperCase()} (ZIP)`,
        error: 'Export failed',
      }
    );
  },

  handleExportSingle: (id) => {
    set({ selectedVizIds: new Set([id]), selectedFolderIds: new Set(), isSelectionMode: true, showBulkExport: true });
  },

  // Folder CRUD
  createFolder: async (name, parentId) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: parentId || null }),
      });
      if (res.ok) {
        const folder = await res.json();
        set((s) => ({ folders: [...s.folders, folder] }));
        toast.success(`Folder "${name}" created`);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
    }
  },

  renameFolder: async (id, name) => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) }));
        toast.success('Folder renamed');
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
      toast.error('Failed to rename folder');
    }
  },

  deleteFolder: (id) => {
    const { folders, visualizations, fetchVisualizations, fetchFolders, fetchTrash } = get();
    const folder = folders.find((f) => f.id === id);
    const vizInFolder = visualizations.filter((v) => v.folderId === id);

    set({
      confirmDialog: {
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
      },
    });
  },

  duplicateFolder: async (id) => {
    try {
      const res = await fetch(`/api/folders/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const { folders: newFolders, visualizations: newVizs } = await res.json();
        set((s) => ({
          folders: [...s.folders, ...newFolders],
          visualizations: [...newVizs, ...s.visualizations],
        }));
        toast.success('Folder duplicated with all contents');
      }
    } catch (error) {
      console.error('Failed to duplicate folder:', error);
      toast.error('Failed to duplicate folder');
    }
  },

  moveFolderTo: async (folderId, targetParentId) => {
    if (folderId === targetParentId) return;
    const { folders } = get();
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
        set((s) => ({
          folders: s.folders.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f)),
        }));
        const targetName = targetParentId ? folders.find((f) => f.id === targetParentId)?.name || 'folder' : 'root';
        toast.success(`Folder moved to ${targetName}`);
      }
    } catch (error) {
      console.error('Failed to move folder:', error);
      toast.error('Failed to move folder');
    }
  },

  // Template CRUD
  deleteTemplate: (id) => {
    const tpl = get().templates.find((t) => t.id === id);
    set({
      confirmDialog: {
        open: true,
        title: `Delete template "${tpl?.templateName || 'Untitled'}"?`,
        description: 'This template will be permanently deleted. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'danger',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
              set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
              toast.success('Template deleted');
            }
          } catch {
            toast.error('Failed to delete template');
          }
        },
      },
    });
  },

  applyTemplate: async (templateId) => {
    set({ applyingTemplateId: templateId });
    try {
      const res = await fetch(`/api/templates/${templateId}/apply`, {
        method: 'POST',
      });
      if (res.ok) {
        const viz = await res.json();
        return viz.id as number;
      }
    } catch {
      toast.error('Failed to create from template');
    } finally {
      set({ applyingTemplateId: null });
    }
    return null;
  },

  createTemplateFolder: async (name, parentId) => {
    try {
      const res = await fetch('/api/template-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: parentId || null }),
      });
      if (res.ok) {
        const folder = await res.json();
        set((s) => ({ templateFolders: [...s.templateFolders, folder] }));
        toast.success(`Folder "${name}" created`);
      }
    } catch {
      toast.error('Failed to create folder');
    }
  },

  renameTemplateFolder: async (id, name) => {
    try {
      const res = await fetch(`/api/template-folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        set((s) => ({ templateFolders: s.templateFolders.map((f) => (f.id === id ? { ...f, name } : f)) }));
        toast.success('Folder renamed');
      }
    } catch {
      toast.error('Failed to rename folder');
    }
  },

  deleteTemplateFolder: (id) => {
    const { templateFolders, templates, fetchTemplates } = get();
    const folder = templateFolders.find((f) => f.id === id);
    set({
      confirmDialog: {
        open: true,
        title: `Delete folder "${folder?.name || 'folder'}"?`,
        description: 'This folder will be deleted. Templates inside will be moved to root.',
        confirmLabel: 'Delete',
        variant: 'danger',
        onConfirm: async () => {
          try {
            const tplsInFolder = templates.filter((t) => t.folderId === id);
            for (const tpl of tplsInFolder) {
              await fetch(`/api/templates/${tpl.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId: null }),
              });
            }
            const res = await fetch(`/api/template-folders/${id}`, { method: 'DELETE' });
            if (res.ok) {
              set((s) => ({ templateFolders: s.templateFolders.filter((f) => f.id !== id) }));
              fetchTemplates();
              toast.success(`Folder "${folder?.name}" deleted`);
            }
          } catch {
            toast.error('Failed to delete folder');
          }
        },
      },
    });
  },

  moveTemplateToFolder: async (templateId, folderId) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        set((s) => ({
          templates: s.templates.map((t) => (t.id === templateId ? { ...t, folderId } : t)),
        }));
        const folderName = folderId ? get().templateFolders.find((f) => f.id === folderId)?.name : 'root';
        toast.success(`Moved to ${folderName}`);
      }
    } catch {
      toast.error('Failed to move template');
    }
  },

  moveTemplateFolderTo: async (folderId, targetParentId) => {
    if (folderId === targetParentId) return;
    const { templateFolders } = get();
    if (targetParentId !== null) {
      const descendants = getDescendantIds(folderId, templateFolders);
      if (descendants.has(targetParentId)) {
        toast.error('Cannot move a folder into its own subfolder');
        return;
      }
    }
    try {
      const res = await fetch(`/api/template-folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: targetParentId }),
      });
      if (res.ok) {
        set((s) => ({
          templateFolders: s.templateFolders.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f)),
        }));
        const targetName = targetParentId ? templateFolders.find((f) => f.id === targetParentId)?.name || 'folder' : 'root';
        toast.success(`Folder moved to ${targetName}`);
      }
    } catch {
      toast.error('Failed to move folder');
    }
  },

  duplicateTemplateFolder: async (id) => {
    try {
      const res = await fetch(`/api/template-folders/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const { folders: newFolders, templates: newTpls } = await res.json();
        set((s) => ({
          templateFolders: [...s.templateFolders, ...newFolders],
          templates: [...newTpls, ...s.templates],
        }));
        toast.success('Folder duplicated with all contents');
      }
    } catch {
      toast.error('Failed to duplicate folder');
    }
  },

  bulkDeleteTemplates: (selectedIds, exitCb) => {
    const count = selectedIds.size;
    if (count === 0) return;
    set({
      confirmDialog: {
        open: true,
        title: `Delete ${count} template${count > 1 ? 's' : ''}?`,
        description: `${count} selected template${count > 1 ? 's' : ''} will be permanently deleted.`,
        confirmLabel: 'Delete',
        variant: 'danger',
        onConfirm: async () => {
          try {
            await Promise.all(
              Array.from(selectedIds).map((id) => fetch(`/api/templates/${id}`, { method: 'DELETE' }))
            );
            set((s) => ({ templates: s.templates.filter((t) => !selectedIds.has(t.id)) }));
            toast.success(`Deleted ${count} template${count > 1 ? 's' : ''}`);
            get().exitTemplateSelectionMode();
            exitCb?.();
          } catch {
            toast.error('Failed to delete some templates');
          }
        },
      },
    });
  },

  // Trash actions
  restoreTrashItem: async (id, type) => {
    try {
      const res = await fetch(`/api/trash/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        toast.success(`${type === 'folder' ? 'Folder' : 'Visualization'} restored`);
        const { fetchTrash, fetchVisualizations, fetchFolders } = get();
        fetchTrash();
        fetchVisualizations();
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to restore:', error);
      toast.error('Failed to restore item');
    }
  },

  permanentDeleteTrashItem: (id, type) => {
    set({
      confirmDialog: {
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
              get().fetchTrash();
            }
          } catch (error) {
            console.error('Failed to permanently delete:', error);
            toast.error('Failed to delete');
          }
        },
      },
    });
  },

  emptyTrash: () => {
    const { trashItems } = get();
    const totalItems = trashItems.visualizations.length + trashItems.folders.length;
    if (totalItems === 0) return;
    set({
      confirmDialog: {
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
              const { fetchTrash, fetchVisualizations, fetchFolders } = get();
              fetchTrash();
              fetchVisualizations();
              fetchFolders();
            }
          } catch (error) {
            console.error('Failed to empty trash:', error);
            toast.error('Failed to empty trash');
          }
        },
      },
    });
  },
}));

// Selectors / utilities
export const useFolderVizCounts = () => useDashboardStore(useShallow((s) => {
  const counts: Record<string, number> = {};
  s.folders.forEach((folder) => {
    const descendants = getDescendantIds(folder.id, s.folders);
    const allFolderIds = new Set(Array.from(descendants));
    allFolderIds.add(folder.id);
    let vizCount = 0;
    s.visualizations.forEach((v) => {
      if (v.folderId !== null && allFolderIds.has(v.folderId)) vizCount++;
    });
    counts[String(folder.id)] = vizCount;
  });
  return counts;
}));

export const useFolderSubCounts = () => useDashboardStore(useShallow((s) => {
  const counts: Record<string, number> = {};
  s.folders.forEach((folder) => {
    const descendants = getDescendantIds(folder.id, s.folders);
    counts[String(folder.id)] = descendants.size;
  });
  return counts;
}));

export const useTemplateFolderTemplateCounts = () => useDashboardStore(useShallow((s) => {
  const counts: Record<string, number> = {};
  s.templateFolders.forEach((folder) => {
    const descendants = getDescendantIds(folder.id, s.templateFolders);
    const allFolderIds = new Set(Array.from(descendants));
    allFolderIds.add(folder.id);
    let templateCount = 0;
    s.templates.forEach((t) => {
      if (t.folderId !== null && allFolderIds.has(t.folderId)) templateCount++;
    });
    counts[String(folder.id)] = templateCount;
  });
  return counts;
}));

export const useTemplateFolderSubCounts = () => useDashboardStore(useShallow((s) => {
  const counts: Record<string, number> = {};
  s.templateFolders.forEach((folder) => {
    const descendants = getDescendantIds(folder.id, s.templateFolders);
    counts[String(folder.id)] = descendants.size;
  });
  return counts;
}));

export const useGridClass = () => useDashboardStore((s) => {
  return s.cardSize === 'small'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3'
    : s.cardSize === 'medium'
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
});

// Returns all viz IDs that should be exported (direct selections + viz inside selected folders)
export const useEffectiveSelectedVizIds = () => useDashboardStore(useShallow((s) => {
  const ids = new Set(s.selectedVizIds);
  s.selectedFolderIds.forEach((folderId) => {
    s.visualizations.forEach((v) => {
      if (v.folderId === folderId) ids.add(v.id);
    });
  });
  return ids;
}));

export const useSortViz = () => {
  const sortMode = useDashboardStore((s) => s.sortMode);
  return (arr: VizItem[]) => {
    return [...arr].sort((a, b) => {
      switch (sortMode) {
        case 'updated_desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated_asc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name_asc': return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc': return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });
  };
};

export const useSortTemplate = () => {
  const sortMode = useDashboardStore((s) => s.sortMode);
  return (arr: TemplateItem[]) => {
    return [...arr].sort((a, b) => {
      switch (sortMode) {
        case 'updated_desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated_asc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name_asc': return a.templateName.localeCompare(b.templateName, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc': return b.templateName.localeCompare(a.templateName, undefined, { numeric: true, sensitivity: 'base' });
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });
  };
};
