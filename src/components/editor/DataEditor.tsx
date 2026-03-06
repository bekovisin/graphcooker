'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { DataRow } from '@/types/data';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Spreadsheet } from './spreadsheet/Spreadsheet';
import { ColumnMapper } from './ColumnMapper';
import { generateUniqueColumnName } from './spreadsheet/utils';

export function DataEditor() {
  const { data, columnOrder, setData, setDataAndColumns, activeTab } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState('');

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

  if (activeTab !== 'data') return null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Spreadsheet area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={addColumn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Column
            </button>
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search data..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {/* Grid */}
        <Spreadsheet onUploadFile={handleUploadClick} />

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
          <span>
            {data.length} rows &middot; {columnOrder.length} columns
          </span>
        </div>
      </div>

      {/* Column Mapper (right side) */}
      <ColumnMapper onUploadClick={handleUploadClick} />
    </div>
  );
}
