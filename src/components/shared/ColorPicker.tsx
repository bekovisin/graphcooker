'use client';

import { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

const presetColors = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0099ff', '#6633cc',
  '#ff3366', '#ff9900', '#ffff00', '#66ff66', '#00ccff', '#9966ff',
  '#cc0000', '#cc6600', '#cccc00', '#009900', '#0066cc', '#6600cc',
];

export function ColorPicker({ label, value, onChange, allowTransparent }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const isTransparent = value === 'transparent';

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val === 'transparent' && allowTransparent) {
      onChange('transparent');
    } else if (/^#[0-9a-fA-F]{6}$/.test(val) || /^#[0-9a-fA-F]{3}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className={label ? "flex items-center gap-2" : ""}>
      {label && <Label className="text-xs text-gray-500 shrink-0">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="w-7 h-7 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow shrink-0 cursor-pointer"
            style={{
              backgroundColor: isTransparent ? 'transparent' : value,
              backgroundImage: isTransparent
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : undefined,
              backgroundSize: isTransparent ? '8px 8px' : undefined,
              backgroundPosition: isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          {allowTransparent && (
            <button
              onClick={() => {
                onChange('transparent');
                setInputValue('transparent');
              }}
              className={`w-full mb-2 px-2 py-1.5 text-xs rounded-md border transition-colors ${
                isTransparent
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Transparent
            </button>
          )}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setInputValue(color);
                }}
                className={`w-7 h-7 rounded-md border transition-all hover:scale-110 ${
                  value === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md border border-gray-200 shrink-0 cursor-pointer"
              style={{ backgroundColor: value }}
              onClick={() => colorInputRef.current?.click()}
            />
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="#000000"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setInputValue(e.target.value);
              }}
              className="sr-only"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
