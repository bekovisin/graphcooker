'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Input } from '@/components/ui/input';

export function LayoutSection() {
  const settings = useEditorStore((s) => s.settings.layout);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('layout', updates);
  };

  return (
    <AccordionSection id="layout" title="Layout">
      {/* Padding — 4 inputs side by side, (px) in header */}
      <div className="space-y-1.5">
        <span className="text-xs text-gray-500 font-medium">Padding (px)</span>
        <div className="grid grid-cols-4 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Top</label>
            <Input
              type="number"
              value={settings.paddingTop}
              onChange={(e) => update({ paddingTop: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={-50}
              max={200}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Right</label>
            <Input
              type="number"
              value={settings.paddingRight}
              onChange={(e) => update({ paddingRight: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={-50}
              max={200}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Bottom</label>
            <Input
              type="number"
              value={settings.paddingBottom}
              onChange={(e) => update({ paddingBottom: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={-50}
              max={200}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Left</label>
            <Input
              type="number"
              value={settings.paddingLeft}
              onChange={(e) => update({ paddingLeft: parseInt(e.target.value) || 0 })}
              className="h-7 text-xs w-full"
              min={-50}
              max={200}
            />
          </div>
        </div>
      </div>

      {/* Background color + Opacity (%) + Max width (px) — single row */}
      <div className="flex items-end gap-1.5">
        <div className="shrink-0">
          <ColorPicker
            label="Background"
            value={settings.backgroundColor}
            onChange={(color) => update({ backgroundColor: color })}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 mb-0.5 block">Opacity (%)</label>
          <Input
            type="number"
            value={settings.backgroundOpacity ?? 100}
            onChange={(e) => update({ backgroundOpacity: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs w-full"
            min={0}
            max={100}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 mb-0.5 block">Max W (px)</label>
          <Input
            type="number"
            value={settings.maxWidth}
            onChange={(e) => update({ maxWidth: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs w-full"
            min={0}
          />
        </div>
      </div>
    </AccordionSection>
  );
}
