'use client';

import { useMemo, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, RefreshCw, X } from 'lucide-react';
import { COLUMN_ROLE_COLORS } from './spreadsheet/constants';
import { colIndexToLetter, formatColumnBadge } from './spreadsheet/utils';

interface ColumnMapperProps {
  onUploadClick: () => void;
}

export function ColumnMapper({ onUploadClick }: ColumnMapperProps) {
  const { columnOrder, columnMapping, setColumnMapping, seriesNames } = useEditorStore();
  const getDisplayName = (col: string) => seriesNames[col] || col;
  const [valuesInput, setValuesInput] = useState('');

  const availableColumns = useMemo(() => columnOrder, [columnOrder]);

  const autoSetColumns = () => {
    if (availableColumns.length === 0) return;
    const labels = availableColumns[0];
    const values = availableColumns.slice(1);
    setColumnMapping({ ...columnMapping, labels, values });
  };

  const toggleValue = (col: string) => {
    const current = columnMapping.values || [];
    if (current.includes(col)) {
      setColumnMapping({ ...columnMapping, values: current.filter((c) => c !== col) });
    } else {
      setColumnMapping({ ...columnMapping, values: [...current, col] });
    }
  };

  // Parse values input (e.g., "B-D" or "B,C,D" or "B, C, D")
  const handleValuesInputCommit = useCallback(() => {
    const input = valuesInput.trim();
    if (!input) return;

    // Try range format like "B-D"
    const rangeMatch = input.match(/^([A-Z]+)\s*-\s*([A-Z]+)$/i);
    if (rangeMatch) {
      const startLetter = rangeMatch[1].toUpperCase();
      const endLetter = rangeMatch[2].toUpperCase();
      const startIdx = availableColumns.findIndex((_, i) => colIndexToLetter(i) === startLetter);
      const endIdx = availableColumns.findIndex((_, i) => colIndexToLetter(i) === endLetter);
      if (startIdx >= 0 && endIdx >= 0 && startIdx <= endIdx) {
        const selected = availableColumns.slice(startIdx, endIdx + 1).filter(
          (col) => col !== columnMapping.labels
        );
        setColumnMapping({ ...columnMapping, values: selected });
        setValuesInput('');
        return;
      }
    }

    // Try comma-separated column letters like "B, C, D"
    const letters = input.split(/[,\s]+/).filter(Boolean).map((s) => s.toUpperCase());
    const selected: string[] = [];
    for (const letter of letters) {
      const idx = availableColumns.findIndex((_, i) => colIndexToLetter(i) === letter);
      if (idx >= 0 && availableColumns[idx] !== columnMapping.labels) {
        selected.push(availableColumns[idx]);
      }
    }
    if (selected.length > 0) {
      setColumnMapping({ ...columnMapping, values: selected });
    }
    setValuesInput('');
  }, [valuesInput, availableColumns, columnMapping, setColumnMapping]);

  const chartType = useEditorStore((s) => s.settings.chartType.chartType);

  const labelColors = COLUMN_ROLE_COLORS.label;
  const valueColors = COLUMN_ROLE_COLORS.value;
  const gridColors = COLUMN_ROLE_COLORS.chartsGrid;
  const filterColors = COLUMN_ROLE_COLORS.rowFilter;
  const popupColors = COLUMN_ROLE_COLORS.infoPopup;
  const infoColors = COLUMN_ROLE_COLORS.info;

  const labelsIndex = availableColumns.indexOf(columnMapping.labels);
  const labelBadge = labelsIndex >= 0 ? colIndexToLetter(labelsIndex) : '';
  const valuesBadge = formatColumnBadge(columnMapping.values || [], availableColumns);

  return (
    <div className="w-[280px] max-w-[280px] border-l bg-white flex flex-col shrink-0 overflow-hidden" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b min-w-0">
        <span className="text-sm font-semibold text-gray-800 shrink-0">Data</span>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shrink-0"
        >
          <Upload className="w-3 h-3" />
          Upload data
        </button>
      </div>

      <ScrollArea className="flex-1 [&_[data-radix-scroll-area-viewport]]:!overflow-x-hidden min-w-0">
        <div className="p-4 space-y-5 overflow-hidden max-w-[280px]">
          {/* Section label */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Select columns to visualise
            </span>
            <button
              onClick={autoSetColumns}
              className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Auto set columns
            </button>
          </div>

          {/* Labels / Time (REQUIRED) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-700 shrink-0">Labels/time</span>
              <span
                className="text-[9px] font-bold uppercase px-1 py-0 rounded shrink-0"
                style={{ color: labelColors.text, backgroundColor: labelColors.bg, border: `1px solid ${labelColors.border}` }}
              >
                Required
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Select
                value={columnMapping.labels || ''}
                onValueChange={(val) => setColumnMapping({ ...columnMapping, labels: val })}
              >
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {getDisplayName(col)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {labelBadge && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: labelColors.badge }}
                >
                  {labelBadge}
                </span>
              )}
            </div>
          </div>

          {/* Values */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-700 shrink-0">Values</span>
              {valuesBadge && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0 max-w-[120px] truncate"
                  style={{ backgroundColor: valueColors.badge }}
                >
                  {valuesBadge}
                </span>
              )}
            </div>
            {/* Values input */}
            <div className="relative">
              <input
                type="text"
                value={valuesInput}
                onChange={(e) => setValuesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleValuesInputCommit();
                  }
                }}
                onBlur={handleValuesInputCommit}
                placeholder={valuesBadge || 'e.g. B-D or B,C,D'}
                className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              {availableColumns
                .filter((col) => col !== columnMapping.labels)
                .map((col) => {
                  const isSelected = (columnMapping.values || []).includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleValue(col)}
                      className="flex items-center justify-between w-full max-w-full px-2.5 py-1.5 rounded-md text-xs transition-colors min-w-0 overflow-hidden"
                      style={
                        isSelected
                          ? { backgroundColor: valueColors.bg, color: valueColors.text, border: `1px solid ${valueColors.border}` }
                          : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid transparent' }
                      }
                    >
                      <span className="truncate min-w-0 flex-1">{getDisplayName(col)}</span>
                      {isSelected && <X className="w-3 h-3 shrink-0 ml-1" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Charts grid */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-500 shrink-0">Charts grid</span>
              {columnMapping.chartsGrid && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: gridColors.badge }}
                >
                  {colIndexToLetter(availableColumns.indexOf(columnMapping.chartsGrid))}
                </span>
              )}
            </div>
            <Select
              value={columnMapping.chartsGrid || '__none__'}
              onValueChange={(val) =>
                setColumnMapping({ ...columnMapping, chartsGrid: val === '__none__' ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue placeholder="None (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">None</SelectItem>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col} className="text-xs">{getDisplayName(col)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row filter */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-500 shrink-0">Row filter</span>
              {columnMapping.rowFilter && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: filterColors.badge }}
                >
                  {colIndexToLetter(availableColumns.indexOf(columnMapping.rowFilter))}
                </span>
              )}
            </div>
            <Select
              value={columnMapping.rowFilter || '__none__'}
              onValueChange={(val) =>
                setColumnMapping({ ...columnMapping, rowFilter: val === '__none__' ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs min-w-0">
                <SelectValue placeholder="None (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">None</SelectItem>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col} className="text-xs">{getDisplayName(col)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info column (bar_chart_custom_2 only) */}
          {chartType === 'bar_chart_custom_2' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-gray-500 shrink-0">Info</span>
                {columnMapping.info && (
                  <span
                    className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: infoColors.badge }}
                  >
                    {colIndexToLetter(availableColumns.indexOf(columnMapping.info))}
                  </span>
                )}
              </div>
              <Select
                value={columnMapping.info || '__none__'}
                onValueChange={(val) =>
                  setColumnMapping({ ...columnMapping, info: val === '__none__' ? undefined : val })
                }
              >
                <SelectTrigger className="h-8 text-xs min-w-0">
                  <SelectValue placeholder="None (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs">None</SelectItem>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">{getDisplayName(col)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info for custom popups */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-gray-500 truncate">Info for custom popups</span>
              {(columnMapping.infoPopups?.length ?? 0) > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0 max-w-[80px] truncate"
                  style={{ backgroundColor: popupColors.badge }}
                >
                  {formatColumnBadge(columnMapping.infoPopups || [], availableColumns)}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {availableColumns.map((col) => {
                const isSelected = (columnMapping.infoPopups || []).includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => {
                      const current = columnMapping.infoPopups || [];
                      setColumnMapping({
                        ...columnMapping,
                        infoPopups: isSelected ? current.filter((c) => c !== col) : [...current, col],
                      });
                    }}
                    className="flex items-center w-full max-w-full px-2.5 py-1 rounded text-xs transition-colors min-w-0 overflow-hidden"
                    style={
                      isSelected
                        ? { backgroundColor: popupColors.bg, color: popupColors.text, border: `1px solid ${popupColors.border}` }
                        : { color: '#9ca3af', border: '1px solid transparent' }
                    }
                  >
                    <span className="truncate min-w-0 flex-1">{getDisplayName(col)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
