import { create } from 'zustand';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { ColumnTypeConfig } from '@/components/editor/spreadsheet/types';
import { defaultChartSettings, defaultData, defaultColumnMapping } from '@/lib/chart/config';

export type EditorTab = 'preview' | 'data';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile' | 'fullscreen' | 'custom';

interface EditorState {
  // Visualization metadata
  visualizationId: number | null;
  visualizationName: string;
  chartType: string;

  // Tabs & UI
  activeTab: EditorTab;
  previewDevice: PreviewDevice;
  customPreviewWidth: number;
  customPreviewHeight: number;
  canvasBackgroundColor: string;
  settingsSearchQuery: string;

  // Data
  data: DataRow[];
  columnOrder: string[];
  columnMapping: ColumnMapping;
  columnTypes: Record<string, ColumnTypeConfig>;
  seriesNames: Record<string, string>;

  // Settings
  settings: ChartSettings;

  // Dirty tracking
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // Actions
  setVisualizationId: (id: number | null) => void;
  setVisualizationName: (name: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  setCustomPreviewSize: (width: number, height: number) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setSettingsSearchQuery: (query: string) => void;
  setData: (data: DataRow[]) => void;
  setDataAndColumns: (data: DataRow[], columnOrder: string[]) => void;
  setColumnOrder: (order: string[]) => void;
  setColumnMapping: (mapping: ColumnMapping) => void;
  updateCell: (rowIndex: number, colName: string, value: string | number | null) => void;
  updateCellBatch: (updates: Array<{ row: number; col: string; value: string | number | null }>) => void;
  insertRow: (atIndex: number) => void;
  removeRow: (rowIndex: number) => void;
  removeRows: (rowIndices: number[]) => void;
  insertColumn: (atIndex: number, name: string) => void;
  removeColumn: (colIndex: number) => void;
  reorderColumn: (fromIndex: number, toIndex: number) => void;
  reorderRow: (fromIndex: number, toIndex: number) => void;
  sortByColumn: (colName: string, direction: 'asc' | 'desc') => void;
  setColumnType: (colName: string, config: ColumnTypeConfig) => void;
  setSeriesName: (colName: string, displayName: string) => void;
  updateSettings: <K extends keyof ChartSettings>(section: K, updates: Partial<ChartSettings[K]>) => void;
  setSettings: (settings: ChartSettings) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  resetEditor: () => void;
  loadVisualization: (data: {
    id: number;
    name: string;
    chartType: string;
    data: DataRow[];
    settings: ChartSettings;
    columnMapping: ColumnMapping;
  }) => void;
}

// Deep merge saved settings with defaults so new fields are always present (2 levels deep)
function deepMerge(defaults: Record<string, unknown>, saved: Record<string, unknown>): Record<string, unknown> {
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    const savedVal = saved[key];
    const defaultVal = defaults[key];
    if (
      savedVal !== null && savedVal !== undefined &&
      typeof savedVal === 'object' && !Array.isArray(savedVal) &&
      typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)
    ) {
      result[key] = { ...(defaultVal as Record<string, unknown>), ...(savedVal as Record<string, unknown>) };
    } else if (savedVal !== undefined) {
      result[key] = savedVal;
    }
  }
  return result;
}

function mergeSettings(saved: Partial<ChartSettings>): ChartSettings {
  const merged = {} as Record<string, unknown>;
  const defaults = defaultChartSettings as unknown as Record<string, unknown>;
  const savedRec = saved as unknown as Record<string, unknown>;
  for (const key of Object.keys(defaults)) {
    const defaultVal = defaults[key];
    const savedVal = savedRec[key];
    if (savedVal !== undefined && typeof savedVal === 'object' && savedVal !== null && !Array.isArray(savedVal) &&
        typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
      // Section-level merge (e.g. xAxis, labels) — also merges nested objects (e.g. tickMarks, axisLine)
      merged[key] = deepMerge(defaultVal as Record<string, unknown>, savedVal as Record<string, unknown>);
    } else if (savedVal !== undefined) {
      merged[key] = savedVal;
    } else {
      merged[key] = defaultVal;
    }
  }
  return merged as unknown as ChartSettings;
}

function deriveColumnOrder(data: DataRow[]): string[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]);
}

export const useEditorStore = create<EditorState>((set) => ({
  visualizationId: null,
  visualizationName: 'Untitled visualization',
  chartType: 'bar_stacked_custom',
  activeTab: 'preview',
  previewDevice: 'desktop',
  customPreviewWidth: 800,
  customPreviewHeight: 600,
  canvasBackgroundColor: '#e5e7eb',
  settingsSearchQuery: '',
  data: defaultData,
  columnOrder: deriveColumnOrder(defaultData),
  columnMapping: defaultColumnMapping,
  columnTypes: {},
  seriesNames: {},
  settings: defaultChartSettings,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  setVisualizationId: (id) => set({ visualizationId: id }),
  setVisualizationName: (name) => set({ visualizationName: name, isDirty: true }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPreviewDevice: (device) => set({ previewDevice: device, isDirty: true }),
  setCustomPreviewSize: (width, height) => set({ customPreviewWidth: width, customPreviewHeight: height, isDirty: true }),
  setCanvasBackgroundColor: (color) => set({ canvasBackgroundColor: color, isDirty: true }),
  setSettingsSearchQuery: (query) => set({ settingsSearchQuery: query }),
  setData: (data) => set({ data, columnOrder: deriveColumnOrder(data), isDirty: true }),
  setDataAndColumns: (data, columnOrder) => set({ data, columnOrder, isDirty: true }),
  setColumnOrder: (order) => set({ columnOrder: order, isDirty: true }),
  setColumnMapping: (mapping) => set({ columnMapping: mapping, isDirty: true }),

  updateCell: (rowIndex, colName, value) =>
    set((state) => {
      const newData = [...state.data];
      newData[rowIndex] = { ...newData[rowIndex], [colName]: value };
      return { data: newData, isDirty: true };
    }),

  updateCellBatch: (updates) =>
    set((state) => {
      const newData = state.data.map((row) => ({ ...row }));
      for (const u of updates) {
        if (newData[u.row]) {
          newData[u.row][u.col] = u.value;
        }
      }
      return { data: newData, isDirty: true };
    }),

  insertRow: (atIndex) =>
    set((state) => {
      const newRow: DataRow = {};
      state.columnOrder.forEach((col) => (newRow[col] = ''));
      const newData = [...state.data];
      newData.splice(atIndex, 0, newRow);
      return { data: newData, isDirty: true };
    }),

  removeRow: (rowIndex) =>
    set((state) => {
      const newData = state.data.filter((_, i) => i !== rowIndex);
      return { data: newData.length > 0 ? newData : [Object.fromEntries(state.columnOrder.map((c) => [c, '']))], isDirty: true };
    }),

  removeRows: (rowIndices) =>
    set((state) => {
      const indexSet = new Set(rowIndices);
      const newData = state.data.filter((_, i) => !indexSet.has(i));
      return { data: newData.length > 0 ? newData : [Object.fromEntries(state.columnOrder.map((c) => [c, '']))], isDirty: true };
    }),

  insertColumn: (atIndex, name) =>
    set((state) => {
      const newOrder = [...state.columnOrder];
      newOrder.splice(atIndex, 0, name);
      const newData = state.data.map((row) => {
        const newRow: DataRow = {};
        newOrder.forEach((col) => {
          newRow[col] = col === name ? '' : (row[col] ?? '');
        });
        return newRow;
      });
      return { data: newData, columnOrder: newOrder, isDirty: true };
    }),

  removeColumn: (colIndex) =>
    set((state) => {
      const colName = state.columnOrder[colIndex];
      if (!colName) return {};
      const newOrder = state.columnOrder.filter((_, i) => i !== colIndex);
      if (newOrder.length === 0) return {};
      const newData = state.data.map((row) => {
        const newRow: DataRow = {};
        newOrder.forEach((col) => { newRow[col] = row[col] ?? ''; });
        return newRow;
      });
      // Clean up column mapping references
      const mapping = { ...state.columnMapping };
      if (mapping.labels === colName) mapping.labels = '';
      if (mapping.values) mapping.values = mapping.values.filter((v) => v !== colName);
      if (mapping.chartsGrid === colName) mapping.chartsGrid = undefined;
      if (mapping.rowFilter === colName) mapping.rowFilter = undefined;
      if (mapping.infoPopups) mapping.infoPopups = mapping.infoPopups.filter((v) => v !== colName);
      return { data: newData, columnOrder: newOrder, columnMapping: mapping, isDirty: true };
    }),

  reorderColumn: (fromIndex, toIndex) =>
    set((state) => {
      const newOrder = [...state.columnOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return { columnOrder: newOrder, isDirty: true };
    }),

  reorderRow: (fromIndex, toIndex) =>
    set((state) => {
      const newData = [...state.data];
      const [moved] = newData.splice(fromIndex, 1);
      newData.splice(toIndex, 0, moved);
      return { data: newData, isDirty: true };
    }),

  sortByColumn: (colName, direction) =>
    set((state) => {
      const newData = [...state.data].sort((a, b) => {
        const aVal = a[colName];
        const bVal = b[colName];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aStr = String(aVal);
        const bStr = String(bVal);
        return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
      return { data: newData, isDirty: true };
    }),

  setColumnType: (colName, config) =>
    set((state) => ({
      columnTypes: { ...state.columnTypes, [colName]: config },
      isDirty: true,
    })),

  setSeriesName: (colName, displayName) =>
    set((state) => ({
      seriesNames: { ...state.seriesNames, [colName]: displayName },
      isDirty: true,
    })),

  updateSettings: (section, updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [section]: { ...state.settings[section], ...updates },
      },
      isDirty: true,
    })),

  setSettings: (settings) => set({ settings, isDirty: true }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),

  resetEditor: () =>
    set({
      visualizationId: null,
      visualizationName: 'Untitled visualization',
      chartType: 'bar_stacked_custom',
      activeTab: 'preview',
      previewDevice: 'desktop',
      customPreviewWidth: 800,
      customPreviewHeight: 600,
      canvasBackgroundColor: '#e5e7eb',
      settingsSearchQuery: '',
      data: defaultData,
      columnOrder: deriveColumnOrder(defaultData),
      columnMapping: defaultColumnMapping,
      columnTypes: {},
      seriesNames: {},
      settings: defaultChartSettings,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
    }),

  loadVisualization: (viz) => {
    // Extract persisted preview state from columnMapping (if any)
    const ps = viz.columnMapping?._previewState;

    // Use persisted column order if available, otherwise derive from data.
    // PostgreSQL JSONB does NOT preserve key insertion order, so we must
    // persist columnOrder separately to avoid columns being shuffled.
    const savedOrder = viz.columnMapping?._columnOrder;
    const derivedOrder = deriveColumnOrder(viz.data);
    // Validate: savedOrder must contain exactly the same columns as the data
    const columnOrder =
      Array.isArray(savedOrder) && savedOrder.length > 0 &&
      savedOrder.length === derivedOrder.length &&
      savedOrder.every((col: string) => derivedOrder.includes(col))
        ? savedOrder
        : derivedOrder;

    set({
      visualizationId: viz.id,
      visualizationName: viz.name,
      chartType: viz.chartType,
      data: viz.data,
      columnOrder,
      settings: mergeSettings(viz.settings),
      columnMapping: viz.columnMapping,
      seriesNames: viz.columnMapping?.seriesNames || {},
      columnTypes: {},
      settingsSearchQuery: '',
      previewDevice: (ps?.previewDevice as PreviewDevice) || 'desktop',
      customPreviewWidth: ps?.customPreviewWidth || 800,
      customPreviewHeight: ps?.customPreviewHeight || 600,
      canvasBackgroundColor: ps?.canvasBackgroundColor || '#e5e7eb',
      isDirty: false,
      lastSavedAt: new Date(),
    });
  },
}));
