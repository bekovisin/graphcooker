/**
 * Derives export-ready width/height from a visualization's saved settings
 * and columnMapping (preview state).
 *
 * Used by:
 *  - /api/visualizations/dimensions  (batch lookup)
 *  - handleBulkExport in page.tsx     (per-chart dimensions)
 */
export function deriveExportDimensions(
  settings: Record<string, unknown> | null,
  columnMapping: Record<string, unknown> | null
): { width: number; height: number } {
  const preview = (columnMapping as Record<string, Record<string, unknown>> | null)?._previewState;
  const chartSettings = (settings as Record<string, Record<string, unknown>> | null)?.chartType;

  // --- Width ---
  let width = 800; // fallback
  if (preview) {
    const device = preview.previewDevice as string | undefined;
    if (device === 'custom' && typeof preview.customPreviewWidth === 'number') {
      width = preview.customPreviewWidth;
    } else if (device === 'tablet') {
      width = 768;
    } else if (device === 'mobile') {
      width = 375;
    } else if (typeof preview.customPreviewWidth === 'number') {
      // desktop / fullscreen — use saved custom width if available
      width = preview.customPreviewWidth;
    }
  }

  // --- Height ---
  let height = 500; // fallback
  if (
    chartSettings &&
    (chartSettings as Record<string, unknown>).heightMode === 'standard' &&
    typeof (chartSettings as Record<string, unknown>).standardHeight === 'number'
  ) {
    height = (chartSettings as Record<string, unknown>).standardHeight as number;
  } else if (preview && typeof preview.customPreviewHeight === 'number') {
    height = preview.customPreviewHeight;
  }

  return { width, height };
}
