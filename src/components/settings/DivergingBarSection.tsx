'use client';

import { useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { NumberInput } from '@/components/shared/NumberInput';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import type { DivergingBarSettings, DivergingScaleMode } from '@/types/chart';

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{children}</h4>
    </div>
  );
}

function TabMenu<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border border-gray-300 overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
            value === opt.value
              ? 'bg-blue-500 text-white font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          } ${i > 0 ? 'border-l border-gray-300' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function DivergingBarSection() {
  const settings = useEditorStore((s) => s.settings.divergingBar);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const columnMapping = useEditorStore((s) => s.columnMapping);
  const seriesNames = useEditorStore((s) => s.seriesNames);

  const update = (updates: Partial<DivergingBarSettings>) => updateSettings('divergingBar', updates);

  const columns = useMemo(() => {
    const nameMap = { ...(columnMapping.seriesNames || {}), ...(seriesNames || {}) };
    return (columnMapping.values || []).filter(Boolean).map((c) => ({ key: c, label: nameMap[c] ?? c }));
  }, [columnMapping.values, columnMapping.seriesNames, seriesNames]);

  const sideOf = (key: string, index: number): 'left' | 'right' =>
    settings.seriesSides[key] ?? (index === 0 ? 'left' : 'right');

  const setSide = (key: string, side: 'left' | 'right') => {
    update({ seriesSides: { ...settings.seriesSides, [key]: side } });
  };

  return (
    <AccordionSection id="diverging-bar" title="Diverging bar">
      {/* ── Sides: assign each series to left or right of the center baseline ── */}
      <SubHeader>Series sides</SubHeader>
      {columns.length === 0 ? (
        <p className="text-[11px] text-gray-400 px-1 py-1">Map at least two value columns in the Data tab.</p>
      ) : (
        <div className="space-y-1.5">
          {columns.map((col, i) => (
            <div key={col.key} className="grid grid-cols-[1fr_120px] gap-2 items-center">
              <span className="text-xs text-gray-600 truncate" title={col.label}>{col.label}</span>
              <TabMenu
                value={sideOf(col.key, i)}
                onChange={(v) => setSide(col.key, v)}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400 px-1">Series on each side stack outward from the center. Default: first series left, the rest right.</p>
      <p className="text-[10px] text-gray-400 px-1">Tip: in-bar label placement lives in <b>Labels → Position</b>; legend centering in <b>Legend → Center over plot</b>.</p>

      {/* ── Axis scale ── */}
      <SubHeader>Axis scale</SubHeader>
      <SettingRow label="Scale mode">
        <TabMenu
          value={settings.scaleMode}
          onChange={(v) => update({ scaleMode: v as DivergingScaleMode })}
          options={[
            { value: 'independent', label: 'Independent' },
            { value: 'symmetric', label: 'Symmetric' },
          ]}
        />
      </SettingRow>
      <p className="text-[10px] text-gray-400 px-1 -mt-1">Independent = each side scaled to its own max. Symmetric = both sides share one scale.</p>

      {/* ── Center ── */}
      <SubHeader>Center</SubHeader>
      <NumberInput label="Center gap" value={settings.centerGap} onChange={(v) => update({ centerGap: v })} min={0} max={200} step={1} suffix="px" />

      <SettingRow label="Absolute values" variant="inline">
        <Switch checked={settings.absoluteValues} onCheckedChange={(c) => update({ absoluteValues: c })} />
      </SettingRow>
      <p className="text-[10px] text-gray-400 px-1 -mt-1">Show bar labels as positive numbers even when the data is negative-signed.</p>
    </AccordionSection>
  );
}
