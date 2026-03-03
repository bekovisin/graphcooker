'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { SettingRow } from '@/components/shared/SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { AnimationType } from '@/types/chart';

const animationTypeOptions: { value: AnimationType; label: string }[] = [
  { value: 'gradual', label: 'Gradual' },
  { value: 'grow', label: 'Grow' },
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
];

export function AnimationsSection() {
  const settings = useEditorStore((s) => s.settings.animations);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('animations', updates);
  };

  return (
    <AccordionSection id="animations" title="Animations">
      {/* Enable Animations */}
      <SettingRow label="Enable animations" variant="inline">
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </SettingRow>

      {settings.enabled && (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Duration (ms)</label>
            <Input
              type="number"
              value={settings.duration}
              onChange={(e) => update({ duration: parseInt(e.target.value) || 800 })}
              className="h-7 text-xs w-full"
              min={100}
              max={5000}
              step={50}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">Type</label>
            <Select
              value={settings.type}
              onValueChange={(v) => update({ type: v as AnimationType })}
            >
              <SelectTrigger className="h-7 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {animationTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </AccordionSection>
  );
}
