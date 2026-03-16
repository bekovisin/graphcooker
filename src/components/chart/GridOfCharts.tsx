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

interface Panel {
  title: string;
  data: DataRow[];
  columnMapping: ColumnMapping;
}

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
  const valueColumns = columnMapping.values || [];

  // Determine split mode:
  // 1. If chartsGrid column is set → split rows by that column's values
  // 2. If no chartsGrid but multiple value columns → each column becomes a panel
  const splitByColumns = !gridColumn && valueColumns.length > 1;

  const panels: Panel[] = useMemo(() => {
    if (splitByColumns) {
      // Each value column becomes its own panel
      return valueColumns.map((colKey) => ({
        title: (seriesNames && seriesNames[colKey]) || colKey,
        data,
        columnMapping: { ...columnMapping, values: [colKey] },
      }));
    }

    if (gridColumn) {
      // Split rows by chartsGrid column values
      const groups = new Map<string, DataRow[]>();
      for (const row of data) {
        const key = String(row[gridColumn] ?? '');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      return Array.from(groups.entries()).map(([title, rows]) => ({
        title,
        data: rows,
        columnMapping,
      }));
    }

    // Fallback: single panel
    return [{ title: '', data, columnMapping }];
  }, [data, gridColumn, splitByColumns, valueColumns, columnMapping, seriesNames]);

  // Compute shared min/max across all panels for consistent x-axis scale
  const { sharedMin, sharedMax } = useMemo(() => {
    let globalMin = 0;
    let globalMax = 0;

    for (const panel of panels) {
      const panelValues = panel.columnMapping.values || [];
      if (panelValues.length === 0) continue;

      for (let ci = 0; ci < panel.data.length; ci++) {
        let posSum = 0;
        let negSum = 0;
        for (const colKey of panelValues) {
          const raw = panel.data[ci][colKey];
          const v = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.')) || 0;
          if (v >= 0) posSum += v;
          else negSum += v;
        }
        if (posSum > globalMax) globalMax = posSum;
        if (negSum < globalMin) globalMin = negSum;
      }
    }

    const userMin = settings.xAxis.min ? parseFloat(settings.xAxis.min) : undefined;
    const userMax = settings.xAxis.max ? parseFloat(settings.xAxis.max) : undefined;

    return {
      sharedMin: userMin !== undefined ? userMin : Math.min(0, globalMin),
      sharedMax: userMax !== undefined ? userMax : globalMax,
    };
  }, [panels, settings.xAxis.min, settings.xAxis.max]);

  const numPanels = panels.length;
  const totalGap = Math.max(0, (numPanels - 1) * GRID_GAP);
  const panelWidth = Math.max(100, Math.floor((width - totalGap) / numPanels));

  return (
    <div style={{ display: 'flex', gap: GRID_GAP, width: '100%' }}>
      {panels.map((panel, i) => (
        <div key={panel.title || i} style={{ flex: '1 1 0%', minWidth: 0 }}>
          <GroupedBarChart
            data={panel.data}
            columnMapping={panel.columnMapping}
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
