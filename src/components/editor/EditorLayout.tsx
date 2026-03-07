'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { defaultChartSettings, defaultData, defaultColumnMapping } from '@/lib/chart/config';
import { EditorTopBar } from './EditorTopBar';
import { ChartPreview } from './ChartPreview';
import { DataEditor } from './DataEditor';
import { SettingsPanel } from './SettingsPanel';
import { ExportDialog, ExportOptions } from './ExportDialog';

interface EditorLayoutProps {
  visualizationId: number;
}

export function EditorLayout({ visualizationId }: EditorLayoutProps) {
  const {
    activeTab,
    settings,
    data,
    columnMapping,
    visualizationName,
    isDirty,
    loadVisualization,
    setIsSaving,
    setIsDirty,
    setLastSavedAt,
  } = useEditorStore();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailCapturedRef = useRef(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'html' | 'pdf'>('png');

  // Load visualization on mount
  useEffect(() => {
    const fetchVisualization = async () => {
      try {
        const res = await fetch(`/api/visualizations/${visualizationId}`);
        if (res.ok) {
          const viz = await res.json();
          const hasData = Array.isArray(viz.data) && viz.data.length > 0;
          const hasSettings = viz.settings && Object.keys(viz.settings).length > 0;
          const hasMapping = viz.columnMapping && Object.keys(viz.columnMapping).length > 0;

          loadVisualization({
            id: viz.id,
            name: viz.name,
            chartType: viz.chartType || 'bar_stacked',
            data: hasData ? viz.data : defaultData,
            settings: hasSettings ? { ...defaultChartSettings, ...viz.settings } : defaultChartSettings,
            columnMapping: hasMapping ? viz.columnMapping : defaultColumnMapping,
          });
        }
      } catch (error) {
        console.error('Failed to load visualization:', error);
      }
    };

    fetchVisualization();
  }, [visualizationId, loadVisualization]);

  // Capture thumbnail from chart container
  const captureThumbnail = useCallback(async (): Promise<string | null> => {
    try {
      const container = document.getElementById('chart-container');
      if (!container) return null;
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        // Use SVG-to-canvas approach for custom charts
        const cloned = svgEl.cloneNode(true) as SVGSVGElement;
        cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const w = parseFloat(cloned.getAttribute('width') || '400');
        const h = parseFloat(cloned.getAttribute('height') || '300');
        if (!cloned.getAttribute('viewBox')) {
          cloned.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
        const thumbW = 400;
        const thumbH = Math.round((h / w) * thumbW);
        cloned.setAttribute('width', String(thumbW));
        cloned.setAttribute('height', String(thumbH));
        const svgStr = new XMLSerializer().serializeToString(cloned);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        return new Promise<string | null>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = thumbW;
            canvas.height = thumbH;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(null); return; }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, thumbW, thumbH);
            ctx.drawImage(img, 0, 0, thumbW, thumbH);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png', 0.7));
          };
          img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
          img.src = url;
        });
      }
      // Fallback: use html-to-image for ApexCharts
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(container, {
        quality: 0.7,
        pixelRatio: 1,
        width: 400,
        height: 250,
        style: { width: '400px', height: '250px' },
      });
      return dataUrl;
    } catch {
      return null;
    }
  }, []);

  // Auto-save — saves data immediately, captures thumbnail in background
  const saveVisualization = useCallback(async () => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: visualizationName,
        data,
        settings,
        columnMapping,
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
  }, [visualizationId, visualizationName, data, settings, columnMapping, setIsSaving, setIsDirty, setLastSavedAt, captureThumbnail]);

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;

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
  }, [isDirty, saveVisualization]);

  // One-time thumbnail capture on initial load
  // This ensures thumbnails exist for dashboard cards even if user doesn't edit anything
  useEffect(() => {
    if (thumbnailCapturedRef.current) return;
    // Wait for the chart to render, then capture
    const timer = setTimeout(async () => {
      const container = document.getElementById('chart-container');
      if (!container) return;
      // Check if SVG or ApexCharts content exists
      const hasSvg = container.querySelector('svg');
      const hasCanvas = container.querySelector('canvas');
      if (!hasSvg && !hasCanvas) return;

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

  // Actual export with options — resizes chart container to export dimensions first
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

    const container = document.getElementById('chart-container');
    if (!container) return;

    // Save original inline styles so we can restore after export
    const origWidth = container.style.width;
    const origMaxWidth = container.style.maxWidth;
    const origHeight = container.style.height;
    const origTransition = container.style.transition;

    const needsResize =
      (options.width && options.width !== container.offsetWidth) ||
      (options.height && options.height !== container.offsetHeight);

    try {
      if (needsResize) {
        // Disable transition so resize is instant
        container.style.transition = 'none';
        if (options.width) {
          container.style.width = `${options.width}px`;
          container.style.maxWidth = `${options.width}px`;
        }
        if (options.height) {
          container.style.height = `${options.height}px`;
        }

        // Force ApexCharts + ResizeObserver to pick up the new dimensions
        window.dispatchEvent(new Event('resize'));

        // Wait for re-layout and chart re-render
        await new Promise((r) => setTimeout(r, 700));
      }

      // Capture at the container's current (resized) dimensions — do NOT pass width/height
      // to the export functions, since the container IS already the target size
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
      // Restore original dimensions
      if (needsResize) {
        container.style.width = origWidth;
        container.style.maxWidth = origMaxWidth;
        container.style.height = origHeight;

        // Re-enable transitions after a tick
        requestAnimationFrame(() => {
          container.style.transition = origTransition;
          window.dispatchEvent(new Event('resize'));
        });
      }
    }
  };

  // Get current chart container dimensions for export dialog defaults
  const getContainerDimensions = () => {
    const container = document.getElementById('chart-container');
    if (container) {
      return { width: container.offsetWidth, height: container.offsetHeight };
    }
    return { width: 800, height: 600 };
  };

  const dims = getContainerDimensions();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <EditorTopBar onExport={handleExportRequest} />
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
    </div>
  );
}
