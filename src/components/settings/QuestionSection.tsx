'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { TextAlignment, QuestionPosition, QuestionSettings, QuestionTextDefaults, QuestionAccentLine } from '@/types/chart';

// ── Reusable TabMenu ──
function TabMenu<T extends string>({ value, onChange, options }: {
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
            value === opt.value ? 'bg-blue-500 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'
          } ${i > 0 ? 'border-l border-gray-300' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
      {children}
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

function DefaultsPanel({ defaults, onChange }: {
  defaults: QuestionTextDefaults;
  onChange: (updates: Partial<QuestionTextDefaults>) => void;
}) {
  return (
    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
      {/* Font Family (full width) */}
      <Select
        value={defaults.fontFamily}
        onValueChange={(v) => onChange({ fontFamily: v })}
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

      {/* Font size + Line height + Default color — 3-column row */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
          <Input
            type="number"
            value={defaults.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 14 })}
            className="h-7 text-xs w-full"
            min={1}
            max={200}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Line H</label>
          <Input
            type="number"
            value={defaults.lineHeight}
            onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) || 1.4 })}
            className="h-7 text-xs w-full"
            min={0.5}
            max={5}
            step={0.1}
          />
        </div>
        <div>
          <ColorPicker
            label="Color"
            value={defaults.color}
            onChange={(color) => onChange({ color })}
          />
        </div>
      </div>
    </div>
  );
}

function PaddingControls({ top, right, bottom, left, onChange }: {
  top: number;
  right: number;
  bottom: number;
  left: number;
  onChange: (updates: { top?: number; right?: number; bottom?: number; left?: number }) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <div>
        <label className="text-[10px] text-gray-400 mb-0.5 block">Top</label>
        <Input
          type="number"
          value={top}
          onChange={(e) => onChange({ top: parseInt(e.target.value) || 0 })}
          className="h-7 text-xs w-full"
          min={-50}
          max={200}
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-0.5 block">Right</label>
        <Input
          type="number"
          value={right}
          onChange={(e) => onChange({ right: parseInt(e.target.value) || 0 })}
          className="h-7 text-xs w-full"
          min={-50}
          max={200}
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-0.5 block">Bottom</label>
        <Input
          type="number"
          value={bottom}
          onChange={(e) => onChange({ bottom: parseInt(e.target.value) || 0 })}
          className="h-7 text-xs w-full"
          min={-50}
          max={200}
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-400 mb-0.5 block">Left</label>
        <Input
          type="number"
          value={left}
          onChange={(e) => onChange({ left: parseInt(e.target.value) || 0 })}
          className="h-7 text-xs w-full"
          min={-50}
          max={200}
        />
      </div>
    </div>
  );
}

export function QuestionSection() {
  const settings = useEditorStore((s) => s.settings.question);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<QuestionSettings>) => {
    updateSettings('question', updates);
  };

  const updateTextDefaults = (updates: Partial<QuestionTextDefaults>) => {
    update({ textDefaults: { ...settings.textDefaults, ...updates } });
  };

  const updateSubtextDefaults = (updates: Partial<QuestionTextDefaults>) => {
    update({ subtextDefaults: { ...settings.subtextDefaults, ...updates } });
  };

  const updateAccentLine = (updates: Partial<QuestionAccentLine>) => {
    update({ accentLine: { ...settings.accentLine, ...updates } });
  };

  return (
    <AccordionSection id="question" title="Question">
      {/* Position — 4-button tab menu */}
      <SettingRow label="Position">
        <TabMenu
          value={settings.position}
          onChange={(v) => update({ position: v as QuestionPosition })}
          options={[
            { value: 'above', label: 'Above' },
            { value: 'below', label: 'Below' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
        />
      </SettingRow>

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

      {/* ACCENT LINE */}
      <SubHeader>Accent Line</SubHeader>
      <SettingRow label="Show accent line" variant="inline">
        <Switch
          checked={settings.accentLine?.show ?? false}
          onCheckedChange={(checked) => updateAccentLine({ show: checked })}
        />
      </SettingRow>

      {settings.accentLine?.show && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          <ColorPicker
            label="Color"
            value={settings.accentLine.color}
            onChange={(color) => updateAccentLine({ color })}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Width</label>
              <Input
                type="number"
                value={settings.accentLine.width}
                onChange={(e) => updateAccentLine({ width: parseInt(e.target.value) || 4 })}
                className="h-7 text-xs w-full"
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Radius</label>
              <Input
                type="number"
                value={settings.accentLine.borderRadius}
                onChange={(e) => updateAccentLine({ borderRadius: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs w-full"
                min={0}
                max={20}
              />
            </div>
          </div>
          <SubHeader>Accent Padding</SubHeader>
          <PaddingControls
            top={settings.accentLine.paddingTop}
            right={settings.accentLine.paddingRight}
            bottom={settings.accentLine.paddingBottom}
            left={settings.accentLine.paddingLeft}
            onChange={(updates) => {
              const u: Partial<QuestionAccentLine> = {};
              if (updates.top !== undefined) u.paddingTop = updates.top;
              if (updates.right !== undefined) u.paddingRight = updates.right;
              if (updates.bottom !== undefined) u.paddingBottom = updates.bottom;
              if (updates.left !== undefined) u.paddingLeft = updates.left;
              updateAccentLine(u);
            }}
          />
        </div>
      )}

      {/* QUESTION TEXT */}
      <SubHeader>Question Text</SubHeader>

      <RichTextEditor
        value={settings.text}
        onChange={(html) => update({ text: html })}
        placeholder="Enter your question..."
        minHeight="60px"
        defaultColor={settings.textDefaults?.color || '#333333'}
      />

      <SettingRow label="Text Defaults" variant="inline">
        <Switch
          checked={true}
          onCheckedChange={() => {}}
        />
      </SettingRow>
      <DefaultsPanel defaults={settings.textDefaults} onChange={updateTextDefaults} />

      {/* Question Padding */}
      <SubHeader>Question Padding</SubHeader>
      <PaddingControls
        top={settings.paddingTop}
        right={settings.paddingRight}
        bottom={settings.paddingBottom}
        left={settings.paddingLeft}
        onChange={(updates) => {
          const u: Partial<QuestionSettings> = {};
          if (updates.top !== undefined) u.paddingTop = updates.top;
          if (updates.right !== undefined) u.paddingRight = updates.right;
          if (updates.bottom !== undefined) u.paddingBottom = updates.bottom;
          if (updates.left !== undefined) u.paddingLeft = updates.left;
          update(u);
        }}
      />

      {/* SUBTEXT */}
      <SubHeader>Subtext</SubHeader>

      <RichTextEditor
        value={settings.subtext}
        onChange={(html) => update({ subtext: html })}
        placeholder="Enter subtext..."
        minHeight="50px"
        defaultColor={settings.subtextDefaults?.color || '#666666'}
      />

      <SettingRow label="Text Defaults" variant="inline">
        <Switch
          checked={true}
          onCheckedChange={() => {}}
        />
      </SettingRow>
      <DefaultsPanel defaults={settings.subtextDefaults} onChange={updateSubtextDefaults} />

      {/* Subtext Padding */}
      <SubHeader>Subtext Padding</SubHeader>
      <PaddingControls
        top={settings.subtextPaddingTop}
        right={settings.subtextPaddingRight}
        bottom={settings.subtextPaddingBottom}
        left={settings.subtextPaddingLeft}
        onChange={(updates) => {
          const u: Partial<QuestionSettings> = {};
          if (updates.top !== undefined) u.subtextPaddingTop = updates.top;
          if (updates.right !== undefined) u.subtextPaddingRight = updates.right;
          if (updates.bottom !== undefined) u.subtextPaddingBottom = updates.bottom;
          if (updates.left !== undefined) u.subtextPaddingLeft = updates.left;
          update(u);
        }}
      />
    </AccordionSection>
  );
}
