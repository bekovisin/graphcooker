'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCallback, useState, useEffect } from 'react';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  arrowStep?: number;
  suffix?: string;
  className?: string;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, arrowStep, suffix, className }: NumberInputProps) {
  // Keep a local draft string so the user can type freely (e.g. "200") without the
  // value snapping to `min` the moment a below-min digit ("2") is entered. The min
  // is only enforced on blur; max is still applied live to avoid overshoot.
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const clampBoth = useCallback((n: number) => Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)), [min, max]);
  const clampMax = useCallback((n: number) => (max != null ? Math.min(max, n) : n), [max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange(clampMax(num));
  };

  const commit = () => {
    setFocused(false);
    const num = parseFloat(draft);
    if (isNaN(num)) { setDraft(String(value)); return; }
    const c = clampBoth(num);
    setDraft(String(c));
    if (c !== value) onChange(c);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!arrowStep) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? arrowStep : -arrowStep;
      const base = parseFloat(draft);
      const cur = isNaN(base) ? value : base;
      const rounded = Math.round((cur + delta) * 1000) / 1000;
      const c = clampBoth(rounded);
      setDraft(String(c));
      onChange(c);
    }
  }, [arrowStep, draft, value, onChange, clampBoth]);

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs text-gray-500">{label}</Label>}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={draft}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onKeyDown={arrowStep ? handleKeyDown : undefined}
          min={min}
          max={max}
          step={arrowStep ? arrowStep : step}
          className={className || "h-8 text-xs w-full"}
        />
        {suffix && <span className="text-xs text-gray-400 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}
