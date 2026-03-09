'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCallback } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  arrowStep?: number;
  suffix?: string;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, arrowStep, suffix }: NumberInputProps) {
  const clamp = useCallback((num: number) => {
    return Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
  }, [min, max]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!arrowStep) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? arrowStep : -arrowStep;
      const rounded = Math.round((value + delta) * 1000) / 1000;
      onChange(clamp(rounded));
    }
  }, [arrowStep, value, onChange, clamp]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) {
              onChange(clamp(num));
            }
          }}
          onKeyDown={arrowStep ? handleKeyDown : undefined}
          min={min}
          max={max}
          step={arrowStep ? arrowStep : step}
          className="h-8 text-xs w-full"
        />
        {suffix && <span className="text-xs text-gray-400 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}
