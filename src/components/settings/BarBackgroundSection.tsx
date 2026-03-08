'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { BarBackgroundSettings } from '@/types/chart';

export function BarBackgroundSection() {
  const settings = useEditorStore((s) => s.settings.barBackground);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<BarBackgroundSettings>) => {
    updateSettings('barBackground', updates);
  };

  return (
    <AccordionSection id="bar-background" title="Bar background">
      <SettingRow label="Show bar background" variant="inline">
        <Switch
          checked={settings.show}
          onCheckedChange={(checked) => update({ show: checked })}
        />
      </SettingRow>

      {settings.show && (
        <>
          <SettingRow label="Background color">
            <ColorPicker
              value={settings.color}
              onChange={(color) => update({ color })}
            />
          </SettingRow>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs text-gray-600 shrink-0">Opacity</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={settings.opacity}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) {
                      update({ opacity: Math.max(0, Math.min(1, num)) });
                    }
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  className="h-7 text-xs w-20"
                />
              </div>
            </div>
            <Slider
              value={[settings.opacity]}
              onValueChange={([v]) => update({ opacity: v })}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </>
      )}
    </AccordionSection>
  );
}
