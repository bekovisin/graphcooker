'use client';

import React, { useMemo } from 'react';
import { ChartSettings, ColumnMapping } from '@/types/chart';
import { DataRow } from '@/types/data';
import { GroupedBarChart } from './GroupedBarChart';

interface GridOfChartsProps {
  data: DataRow[];
  columnMapping: ColumnMapping;
  settings: ChartSettings;
  width: number;
  height?: number;
  columnOrder?: string[];
  seriesNames?: Record<string, string>;
  skipAnimation?: boolean;
}

const GRID_GAP = 12;

export const GridOfCharts = React.memo(function GridOfCharts({
  data,
  columnMapping,
  settings,
  width,
  height,
  columnOrder,
  seriesNames,
  skipAnimation,
}: GridOfChartsProps) {
  const gridColumn = columnMapping.chartsGrid;

  // Group data by chartsGrid column values (preserve insertion order)
  const panels = useMemo(() => {
    if (!gridColumn) return [{ title: '', data }];
    const groups = new Map<string, DataRow[]>();
    for (const row of data) {
      const key = String(row[gridColumn] ?? '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    return Array.from(groups.entries()).map(([title, rows]) => ({ title, data: rows }));
  }, [data, gridColumn]);

  // Compute shared min/max across all panels for consistent x-axis scale
  const { sharedMin, sharedMax } = useMemo(() => {
    if (!columnMapping.values || columnMapping.values.length === 0) {
      return { sharedMin: 0, sharedMax: 0 };
    }

    let globalMin = 0;
    let globalMax = 0;

    for (const panel of panels) {
      for (let ci = 0; ci < panel.data.length; ci++) {
        let posSum = 0;
        let negSum = 0;
        for (const colKey of columnMapping.values) {
          const raw = panel.data[ci][colKey];
          const v = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.')) || 0;
          if (v >= 0) posSum += v;
          else negSum += v;
        }
        if (posSum > globalMax) globalMax = posSum;
        if (negSum < globalMin) globalMin = negSum;
      }
    }

    // Apply user overrides from axis settings
    const userMin = settings.xAxis.min ? parseFloat(settings.xAxis.min) : undefined;
    const userMax = settings.xAxis.max ? parseFloat(settings.xAxis.max) : undefined;

    return {
      sharedMin: userMin !== undefined ? userMin : Math.min(0, globalMin),
      sharedMax: userMax !== undefined ? userMax : globalMax,
    };
  }, [panels, columnMapping.values, settings.xAxis.min, settings.xAxis.max]);

  const numPanels = panels.length;
  const totalGap = Math.max(0, (numPanels - 1) * GRID_GAP);
  const panelWidth = Math.max(100, Math.floor((width - totalGap) / numPanels));

  return (
    <div style={{ display: 'flex', gap: GRID_GAP, width: '100%' }}>
      {panels.map((panel, i) => (
        <div key={panel.title || i} style={{ flex: '1 1 0%', minWidth: 0 }}>
          <GroupedBarChart
            data={panel.data}
            columnMapping={columnMapping}
            settings={settings}
            width={panelWidth}
            height={height}
            columnOrder={columnOrder}
            seriesNames={seriesNames}
            skipAnimation={skipAnimation}
            overrideMinVal={sharedMin}
            overrideMaxVal={sharedMax}
            gridTitle={panel.title}
            hideLegend={i > 0}
          />
        </div>
      ))}
    </div>
  );
});
