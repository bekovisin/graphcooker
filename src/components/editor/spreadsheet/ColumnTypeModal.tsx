'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { colIndexToLetter } from './utils';
import { ColumnTypeConfig } from './types';

interface ColumnTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colIndex: number;
  colName: string;
  currentConfig: ColumnTypeConfig;
  onSave: (config: ColumnTypeConfig) => void;
}

const INPUT_FORMATS = [
  { label: '12,235.56', value: 'comma_dot' },
  { label: '12.235,56', value: 'dot_comma' },
  { label: '12 235.56', value: 'space_dot' },
  { label: '12 235,56', value: 'space_comma' },
];

export function ColumnTypeModal({
  open,
  onOpenChange,
  colIndex,
  colName,
  currentConfig,
  onSave,
}: ColumnTypeModalProps) {
  const [type, setType] = useState<'number' | 'text'>(currentConfig.type);
  const [inputFormat, setInputFormat] = useState(currentConfig.inputFormat || 'comma_dot');
  const [decimalPlaces, setDecimalPlaces] = useState(currentConfig.decimalPlaces ?? 2);
  const [outputFormat, setOutputFormat] = useState(currentConfig.outputFormat || 'match_input');

  useEffect(() => {
    setType(currentConfig.type);
    setInputFormat(currentConfig.inputFormat || 'comma_dot');
    setDecimalPlaces(currentConfig.decimalPlaces ?? 2);
    setOutputFormat(currentConfig.outputFormat || 'match_input');
  }, [currentConfig, open]);

  const handleSave = () => {
    onSave({
      type,
      inputFormat: type === 'number' ? inputFormat : undefined,
      decimalPlaces: type === 'number' ? decimalPlaces : undefined,
      outputFormat: type === 'number' ? outputFormat : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            Editing column {colIndexToLetter(colIndex)}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {colName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Data Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Data type</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  type === 'text'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setType('text')}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-bold opacity-70">ABC</span>
                  Text
                </span>
              </button>
              <button
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  type === 'number'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setType('number')}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-bold opacity-70">123</span>
                  Number
                </span>
              </button>
            </div>
          </div>

          {/* Number options */}
          {type === 'number' && (
            <>
              {/* Input Format */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Input format</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INPUT_FORMATS.map((fmt) => (
                    <button
                      key={fmt.value}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                        inputFormat === fmt.value
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setInputFormat(fmt.value)}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decimal Places */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Digits after decimal point
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={decimalPlaces}
                    onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-mono text-gray-700 w-6 text-center">
                    {decimalPlaces}
                  </span>
                </div>
              </div>

              {/* Preferred Output Format */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Preferred output format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md bg-white"
                >
                  <option value="match_input">Match input</option>
                  <option value="comma_dot">12,235.56</option>
                  <option value="dot_comma">12.235,56</option>
                  <option value="space_dot">12 235.56</option>
                  <option value="space_comma">12 235,56</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
