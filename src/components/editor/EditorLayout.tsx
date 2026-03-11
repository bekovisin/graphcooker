'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { defaultChartSettings, defaultData, defaultColumnMapping } from '@/lib/chart/config';
import { EditorTopBar } from './EditorTopBar';
import { MobileWarning } from './MobileWarning';
import { ChartPreview } from './ChartPreview';
import { DataEditor } from './DataEditor';
import { SettingsPanel } from './SettingsPanel';
import { ExportDialog, ExportOptions } from './ExportDialog';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { captureThumbnail } from '@/lib/capture-thumbnail';

interface EditorLayoutProps {
  visualizationId: number;
}

export function EditorLayout({ visualizationId }: EditorLayoutProps) {
  const {
    activeTab,
    settings,
    data,
    columnMapping,
    columnOrder,
    seriesNames,
    visualizationName,
    isDirty,
    loadVisualization,
    setIsSaving,
    setIsDirty,
    setLastSavedAt,
  } = useEditorStore();

  const { showDialog: showUnsavedDialog, onConfirmLeave, onCancelLeave } = useUnsavedChangesGuard(isDirty);

  const searchParams = useSearchParams();
  const fromTemplateId = searchParams.get('fromTemplate') ? parseInt(searchParams.get('fromTemplate')!) : null;

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailCapturedRef = useRef(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'html' | 'pdf'>('png');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load visualization on mount
  useEffect(() => {
    // Cancel any pending auto-save from the previous visualization immediately
    // to prevent saving stale data to the new visualization ID
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setIsDirty(false);
    setIsLoading(true);
    thumbnailCapturedRef.current = false;

    // Ignore flag prevents React strict mode's double-invoke from overwriting
    // state that was already measured by ChartPreview's ResizeObserver.
    let ignore = false;

    const fetchVisualization = async () => {
      try {
        const res = await fetch(`/api/visualizations/${visualizationId}`);
        if (ignore) return;
        if (res.ok) {
          const viz = await res.json();
          if (ignore) return;
          const hasData = Array.isArray(viz.data) && viz.data.length > 0;
          const hasSettings = viz.settings && Object.keys(viz.settings).length > 0;
          const hasMapping = viz.columnMapping && Object.keys(viz.columnMapping).length > 0;

          loadVisualization({
            id: viz.id,
            name: viz.name,
            chartType: viz.chartType || 'bar_stacked_custom',
            data: hasData ? viz.data : defaultData,
            settings: hasSettings ? { ...defaultChartSettings, ...viz.settings } : defaultChartSettings,
            columnMapping: hasMapping ? viz.columnMapping : defaultColumnMapping,
          });

          // Sync URL-based template ID into store so "Update template" button works
          if (fromTemplateId) {
            useEditorStore.getState().setEditingTemplateId(fromTemplateId);
          }

          // Fetch folder breadcrumbs if visualization is in a folder
          if (viz.folderId) {
            try {
              const bcRes = await fetch(`/api/folders/breadcrumb?folderId=${viz.folderId}`);
              if (!ignore && bcRes.ok) {
                const path = await bcRes.json();
                setBreadcrumbs(path);
              }
            } catch {
              // Non-critical — breadcrumbs just won't show
            }
          }
        }
      } catch (error) {
        console.error('Failed to load visualization:', error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchVisualization();

    return () => {
      ignore = true;
    };
  }, [visualizationId, loadVisualization]);

  // Capture thumbnail from chart container (shared utility)

  // Auto-save — reads latest state from store to capture preview state too
  const saveVisualization = useCallback(async () => {
    // Read all current state at save-time to avoid stale closures
    const state = useEditorStore.getState();
    if (state.visualizationId !== visualizationId) return;

    setIsSaving(true);
    try {
      // Persist seriesNames, preview state, and column order inside columnMapping.
      // Column order must be saved explicitly because PostgreSQL JSONB does not
      // preserve object key insertion order, which would shuffle columns on reload.
      const mappingWithExtras = {
        ...state.columnMapping,
        seriesNames: Object.keys(state.seriesNames).length > 0 ? state.seriesNames : undefined,
        _previewState: {
          previewDevice: state.previewDevice,
          customPreviewWidth: state.customPreviewWidth,
          customPreviewHeight: state.customPreviewHeight,
          autoComputedHeight: state.autoComputedHeight,
          canvasBackgroundColor: state.canvasBackgroundColor,
        },
        _columnOrder: state.columnOrder,
        _columnTypes: Object.keys(state.columnTypes).length > 0 ? state.columnTypes : undefined,
      };
      const body: Record<string, unknown> = {
        name: state.visualizationName,
        data: state.data,
        settings: state.settings,
        columnMapping: mappingWithExtras,
      };

      const res = await fetch(`/api/visualizations/${visualizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setIsDirty(false);
        setLastSavedAt(new Date());
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }

    // Capture and save thumbnail in background (non-blocking)
    captureThumbnail().then((thumbnail) => {
      if (thumbnail) {
        fetch(`/api/visualizations/${visualizationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumbnail }),
        }).catch(() => {});
      }
    });
  }, [visualizationId, setIsSaving, setIsDirty, setLastSavedAt, captureThumbnail]);

  // Debounced auto-save — blocked while loading to prevent saving stale data
  useEffect(() => {
    if (!isDirty || isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveVisualization();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, isLoading, saveVisualization]);

  // One-time thumbnail capture on initial load
  // This ensures thumbnails exist for dashboard cards even if user doesn't edit anything
  useEffect(() => {
    if (thumbnailCapturedRef.current) return;
    // Wait for the chart to render, then capture
    const timer = setTimeout(async () => {
      const container = document.getElementById('chart-container');
      if (!container) return;
      // Check if SVG content exists
      const hasSvg = container.querySelector('svg');
      if (!hasSvg) return;

      thumbnailCapturedRef.current = true;
      const thumbnail = await captureThumbnail();
      if (thumbnail) {
        // Save thumbnail silently (don't trigger isDirty)
        try {
          await fetch(`/api/visualizations/${visualizationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thumbnail }),
          });
        } catch {
          // Silently fail - not critical
        }
      }
    }, 2000); // Wait 2 seconds for chart to fully render

    return () => clearTimeout(timer);
  }, [visualizationId, captureThumbnail, activeTab]);

  // Open export dialog instead of exporting directly
  const handleExportRequest = (format: 'png' | 'svg' | 'html' | 'pdf') => {
    setExportFormat(format);
    setExportDialogOpen(true);
  };

  // Actual export with options — uses offscreen rendering so the chart is
  // rendered at exactly the requested dimensions without touching the live preview.
  const handleExport = async (format: 'png' | 'svg' | 'html' | 'pdf', options: ExportOptions) => {
    // HTML export doesn't need DOM manipulation — it builds standalone HTML
    if (format === 'html') {
      const { exportHtml } = await import('@/lib/export/exportHtml');
      exportHtml(settings, data, columnMapping, visualizationName, options);
      return;
    }

    const { exportPng } = await import('@/lib/export/exportPng');
    const { exportSvg } = await import('@/lib/export/exportSvg');
    const { exportPdf } = await import('@/lib/export/exportPdf');
    const { renderChartOffscreen } = await import('@/lib/export/renderChartOffscreen');

    const liveContainer = document.getElementById('chart-container');
    const currentW = liveContainer?.offsetWidth || 800;
    // Use clientHeight (excludes the 1px CSS border) so the height matches
    // the border-free value saved to the DB for dashboard export.
    const currentH = liveContainer?.clientHeight || 600;

    const exportWidth = options.width || currentW;
    const exportHeight = options.height || currentH;

    // Render a fresh chart at the exact target dimensions in an offscreen container.
    // Pass canvasWidth so question/header/footer keep their canvas layout — extra
    // width/height only changes the chart, not the surrounding blocks.
    const { container, cleanup } = await renderChartOffscreen(
      settings,
      data,
      columnMapping,
      { width: exportWidth, height: exportHeight, transparent: options.transparent, canvasWidth: currentW },
      columnOrder,
      seriesNames,
    );

    try {
      const captureOpts = {
        transparent: options.transparent,
        pixelRatio: options.pixelRatio,
      };

      switch (format) {
        case 'png':
          await exportPng(container, visualizationName, captureOpts);
          break;
        case 'svg':
          await exportSvg(container, visualizationName, captureOpts);
          break;
        case 'pdf':
          await exportPdf(container, visualizationName, captureOpts);
          break;
      }
    } finally {
      cleanup();
    }
  };

  // Get current chart container dimensions for export dialog defaults.
  // Height uses clientHeight (excludes 1px CSS border) to match the border-free
  // value saved to the DB; width uses offsetWidth (border-box matches CSS width).
  const getContainerDimensions = () => {
    if (typeof document === 'undefined') return { width: 800, height: 600 };
    const container = document.getElementById('chart-container');
    if (container) {
      return { width: container.offsetWidth, height: container.clientHeight };
    }
    return { width: 800, height: 600 };
  };

  const dims = getContainerDimensions();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <EditorTopBar onExport={handleExportRequest} breadcrumbs={breadcrumbs} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <EditorTopBar onExport={handleExportRequest} breadcrumbs={breadcrumbs} />
      <MobileWarning />
      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <ChartPreview />
        <DataEditor />

        {/* Settings panel (only shown in preview tab) */}
        {activeTab === 'preview' && <SettingsPanel />}
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        format={exportFormat}
        onExport={handleExport}
        defaultWidth={dims.width}
        defaultHeight={dims.height}
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={onConfirmLeave}
        onCancel={onCancelLeave}
      />
    </div>
  );
}
