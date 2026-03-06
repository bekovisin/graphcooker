'use client';

import { useMemo } from 'react';
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
  const { columnOrder, columnMapping, setColumnMapping } = useEditorStore();

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

  const labelColors = COLUMN_ROLE_COLORS.label;
  const valueColors = COLUMN_ROLE_COLORS.value;
  const gridColors = COLUMN_ROLE_COLORS.chartsGrid;
  const filterColors = COLUMN_ROLE_COLORS.rowFilter;
  const popupColors = COLUMN_ROLE_COLORS.infoPopup;

  const labelsIndex = availableColumns.indexOf(columnMapping.labels);
  const labelBadge = labelsIndex >= 0 ? colIndexToLetter(labelsIndex) : '';
  const valuesBadge = formatColumnBadge(columnMapping.values || [], availableColumns);

  return (
    <div className="w-[280px] border-l bg-white flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-semibold text-gray-800">Data</span>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Upload className="w-3 h-3" />
          Upload data
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Labels/time</span>
              <span
                className="text-[9px] font-bold uppercase px-1 py-0 rounded"
                style={{ color: labelColors.text, backgroundColor: labelColors.bg, border: `1px solid ${labelColors.border}` }}
              >
                Required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={columnMapping.labels || ''}
                onValueChange={(val) => setColumnMapping({ ...columnMapping, labels: val })}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {col}
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Values</span>
              {valuesBadge && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: valueColors.badge }}
                >
                  {valuesBadge}
                </span>
              )}
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
                      className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors"
                      style={
                        isSelected
                          ? { backgroundColor: valueColors.bg, color: valueColors.text, border: `1px solid ${valueColors.border}` }
                          : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid transparent' }
                      }
                    >
                      <span>{col}</span>
                      {isSelected && <X className="w-3 h-3" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Charts grid */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Charts grid</span>
              {columnMapping.chartsGrid && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
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
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="None (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">None</SelectItem>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row filter */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Row filter</span>
              {columnMapping.rowFilter && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
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
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="None (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">None</SelectItem>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info for custom popups */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Info for custom popups</span>
              {(columnMapping.infoPopups?.length ?? 0) > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
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
                    className="flex items-center w-full px-2.5 py-1 rounded text-xs transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: popupColors.bg, color: popupColors.text, border: `1px solid ${popupColors.border}` }
                        : { color: '#9ca3af', border: '1px solid transparent' }
                    }
                  >
                    <span>{col}</span>
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
