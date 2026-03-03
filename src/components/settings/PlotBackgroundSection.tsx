'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export function PlotBackgroundSection() {
  const settings = useEditorStore((s) => s.settings.plotBackground);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('plotBackground', updates);
  };

  return (
    <AccordionSection id="plot-background" title="Plot background">
      {/* Background color + Border toggle — single row */}
      <div className="flex items-center justify-between">
        <ColorPicker
          label="Background color"
          value={settings.backgroundColor}
          onChange={(v) => update({ backgroundColor: v })}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Border</label>
          <Switch
            checked={settings.border}
            onCheckedChange={(v) => update({ border: v })}
          />
        </div>
      </div>

      {/* Border color + Border width — single row */}
      {settings.border && (
        <div className="flex items-center gap-2">
          <ColorPicker
            label="Border color"
            value={settings.borderColor}
            onChange={(v) => update({ borderColor: v })}
          />
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
            <Input
              type="number"
              value={settings.borderWidth}
              onChange={(e) => update({ borderWidth: parseFloat(e.target.value) || 1 })}
              className="h-7 text-xs w-full"
              min={1}
              max={5}
              step={0.5}
            />
          </div>
        </div>
      )}
    </AccordionSection>
  );
}
