'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { DataRow } from '@/types/data';
import { Plus } from 'lucide-react';
import { Spreadsheet, SelectionInfo } from './spreadsheet/Spreadsheet';
import { ColumnMapper } from './ColumnMapper';
import { ColumnTypeModal } from './spreadsheet/ColumnTypeModal';
import { ColumnTypeConfig } from './spreadsheet/types';
import { generateUniqueColumnName } from './spreadsheet/utils';

export function DataEditor() {
  const { data, columnOrder, columnTypes, setData, setDataAndColumns, setColumnType, updateSettings, activeTab } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);

  // Column type modal state
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalColIndex, setTypeModalColIndex] = useState(0);

  const addRow = useCallback(() => {
    const newRow: DataRow = {};
    columnOrder.forEach((col) => (newRow[col] = ''));
    setData([...data, newRow]);
  }, [data, columnOrder, setData]);

  const addColumn = useCallback(() => {
    const newColName = generateUniqueColumnName(columnOrder);
    const newOrder = [...columnOrder, newColName];
    const newData = data.map((row) => ({ ...row, [newColName]: '' }));
    setDataAndColumns(newData, newOrder);
  }, [data, columnOrder, setDataAndColumns]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv' || ext === 'tsv') {
        const Papa = (await import('papaparse')).default;
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimiter: ext === 'tsv' ? '\t' : undefined,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setData(results.data as DataRow[]);
            }
          },
        });
      }

      e.target.value = '';
    },
    [setData]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleColumnTypeClick = useCallback((colIndex: number) => {
    setTypeModalColIndex(colIndex);
    setTypeModalOpen(true);
  }, []);

  const handleColumnTypeSave = useCallback(
    (config: ColumnTypeConfig) => {
      const colName = columnOrder[typeModalColIndex];
      if (colName) {
        setColumnType(colName, config);
        // Sync decimal places to chart number formatting
        if (config.type === 'number' && config.decimalPlaces !== undefined) {
          updateSettings('numberFormatting', { decimalPlaces: config.decimalPlaces });
        }
      }
    },
    [columnOrder, typeModalColIndex, setColumnType, updateSettings]
  );

  const typeModalColName = columnOrder[typeModalColIndex] || '';
  const typeModalCurrentConfig: ColumnTypeConfig = columnTypes[typeModalColName] || { type: 'number' };

  if (activeTab !== 'data') return null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Spreadsheet area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={addColumn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Column
            </button>
          </div>
        </div>

        {/* Grid */}
        <Spreadsheet
          onUploadFile={handleUploadClick}
          onSelectionInfoChange={setSelectionInfo}
          onColumnTypeClick={handleColumnTypeClick}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t bg-gray-50 text-xs text-gray-500">
          <button onClick={addRow} className="flex items-center gap-1 hover:text-gray-700">
            <Plus className="w-3 h-3" />
            Add row
          </button>
          <div className="flex items-center gap-4">
            {/* Selection info */}
            {selectionInfo && selectionInfo.count > 1 && (
              <div className="flex items-center gap-3 text-gray-600">
                <span>Count: <strong>{selectionInfo.count}</strong></span>
                {selectionInfo.numericCount > 0 && (
                  <>
                    <span>Sum: <strong>{selectionInfo.sum.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                    <span>Avg: <strong>{selectionInfo.average.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                    <span>Min: <strong>{selectionInfo.min.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                    <span>Max: <strong>{selectionInfo.max.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                  </>
                )}
              </div>
            )}
            <span>
              {data.length} rows &middot; {columnOrder.length} columns
            </span>
          </div>
        </div>
      </div>

      {/* Column Mapper (right side) */}
      <ColumnMapper onUploadClick={handleUploadClick} />

      {/* Column Type Modal */}
      <ColumnTypeModal
        open={typeModalOpen}
        onOpenChange={setTypeModalOpen}
        colIndex={typeModalColIndex}
        colName={typeModalColName}
        currentConfig={typeModalCurrentConfig}
        onSave={handleColumnTypeSave}
      />
    </div>
  );
}
