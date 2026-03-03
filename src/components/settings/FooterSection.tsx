'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { SettingRow } from '@/components/shared/SettingRow';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { TextAlignment, TextStyling, BorderStyle } from '@/types/chart';

// ── Reusable TabMenu ──
function TabMenu<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border border-gray-200 overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
            value === opt.value ? 'bg-blue-500 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'
          } ${i > 0 ? 'border-l border-gray-200' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const fontFamilyOptions = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Montserrat, sans-serif',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'system-ui',
];

const borderOptions: { value: BorderStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'both', label: 'Both' },
];

export function FooterSection() {
  const settings = useEditorStore((s) => s.settings.footer);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('footer', updates);
  };

  const updateTextStyling = (updates: Partial<TextStyling>) => {
    update({
      textStyling: { ...settings.textStyling, ...updates },
    });
  };

  return (
    <AccordionSection id="footer" title="Footer">
      {/* Alignment — 3-button tab menu */}
      <SettingRow label="Alignment">
        <TabMenu
          value={settings.alignment}
          onChange={(v) => update({ alignment: v as TextAlignment })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
        />
      </SettingRow>

      {/* STYLES section (like Header) */}
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
        Styles
      </div>

      <SettingRow label="Show styling" variant="inline">
        <Switch
          checked={settings.showTextStyling}
          onCheckedChange={(v) => update({ showTextStyling: v })}
        />
      </SettingRow>

      {settings.showTextStyling && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          {/* Font Family (full width) */}
          <Select
            value={settings.textStyling.fontFamily}
            onValueChange={(v) => updateTextStyling({ fontFamily: v })}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilyOptions.map((font) => (
                <SelectItem key={font} value={font} className="text-xs">
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Color */}
          <ColorPicker
            label="Color"
            value={settings.textStyling.color}
            onChange={(color) => updateTextStyling({ color })}
          />

          {/* Font size + Font weight + Line height — 3-column row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
              <Input
                type="number"
                value={settings.textStyling.fontSize}
                onChange={(e) => updateTextStyling({ fontSize: parseInt(e.target.value) || 11 })}
                className="h-7 text-xs w-full"
                min={1}
                max={200}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
              <Select
                value={settings.textStyling.fontWeight}
                onValueChange={(v) => updateTextStyling({ fontWeight: v as 'normal' | 'bold' })}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Line H</label>
              <Input
                type="number"
                value={settings.textStyling.lineHeight}
                onChange={(e) => updateTextStyling({ lineHeight: parseFloat(e.target.value) || 1.4 })}
                className="h-7 text-xs w-full"
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>
          </div>
        </div>
      )}

      {/* Source Name */}
      <SettingRow label="Source name">
        <Input
          value={settings.sourceName}
          onChange={(e) => update({ sourceName: e.target.value })}
          className="h-8 text-xs w-full"
          placeholder="Enter source name..."
        />
      </SettingRow>

      {/* Source URL */}
      <SettingRow label="Source URL">
        <Input
          value={settings.sourceUrl}
          onChange={(e) => update({ sourceUrl: e.target.value })}
          className="h-8 text-xs w-full"
          placeholder="https://..."
        />
      </SettingRow>

      {/* Multiple Sources */}
      <SettingRow label="Multiple sources" variant="inline">
        <Switch
          checked={settings.multipleSources}
          onCheckedChange={(checked) => update({ multipleSources: checked })}
        />
      </SettingRow>

      {/* Source Label */}
      <SettingRow label="Source label">
        <Input
          value={settings.sourceLabel}
          onChange={(e) => update({ sourceLabel: e.target.value })}
          className="h-8 text-xs w-full"
          placeholder="Source"
        />
      </SettingRow>

      {/* Note (Primary) */}
      <div className="space-y-1.5">
        <span className="text-xs text-gray-600">Note (primary)</span>
        <Textarea
          value={settings.notePrimary}
          onChange={(e) => update({ notePrimary: e.target.value })}
          className="text-xs min-h-[60px] resize-y"
          placeholder="Add a primary note..."
        />
      </div>

      {/* Note (Secondary) */}
      <div className="space-y-1.5">
        <span className="text-xs text-gray-600">Note (secondary)</span>
        <Textarea
          value={settings.noteSecondary}
          onChange={(e) => update({ noteSecondary: e.target.value })}
          className="text-xs min-h-[60px] resize-y"
          placeholder="Add a secondary note..."
        />
      </div>

      {/* Logo URL */}
      <SettingRow label="Logo URL">
        <Input
          value={settings.logoUrl}
          onChange={(e) => update({ logoUrl: e.target.value })}
          className="h-8 text-xs w-full"
          placeholder="https://..."
        />
      </SettingRow>

      {/* Border */}
      <SettingRow label="Border">
        <Select
          value={settings.border}
          onValueChange={(v) => update({ border: v as BorderStyle })}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {borderOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </AccordionSection>
  );
}
