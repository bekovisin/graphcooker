'use client';

import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SettingRow } from '@/components/shared/SettingRow';
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
import type { TextAlignment, TextStyling, QuestionPosition, QuestionSettings } from '@/types/chart';

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

function StylingPanel({ styling, onChange }: {
  styling: TextStyling;
  onChange: (updates: Partial<TextStyling>) => void;
}) {
  return (
    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
      {/* Font Family (full width) */}
      <Select
        value={styling.fontFamily}
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

      {/* Color */}
      <ColorPicker
        label="Color"
        value={styling.color}
        onChange={(color) => onChange({ color })}
      />

      {/* Font size + Font weight + Line height — 3-column row */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
          <Input
            type="number"
            value={styling.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 14 })}
            className="h-7 text-xs w-full"
            min={1}
            max={200}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
          <Select
            value={styling.fontWeight}
            onValueChange={(v) => onChange({ fontWeight: v as 'normal' | 'bold' })}
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
            value={styling.lineHeight}
            onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) || 1.4 })}
            className="h-7 text-xs w-full"
            min={0.5}
            max={5}
            step={0.1}
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

  const updateTextStyling = (updates: Partial<TextStyling>) => {
    update({ textStyling: { ...settings.textStyling, ...updates } });
  };

  const updateSubtextStyling = (updates: Partial<TextStyling>) => {
    update({ subtextStyling: { ...settings.subtextStyling, ...updates } });
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

      {/* QUESTION TEXT */}
      <SubHeader>Question Text</SubHeader>

      <Textarea
        value={settings.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Enter your question..."
        className="text-xs min-h-[80px] resize-y"
      />

      <SettingRow label="Styling" variant="inline">
        <Switch
          checked={settings.showTextStyling}
          onCheckedChange={(checked) => update({ showTextStyling: checked })}
        />
      </SettingRow>

      {settings.showTextStyling && (
        <StylingPanel styling={settings.textStyling} onChange={updateTextStyling} />
      )}

      {/* Padding */}
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

      <Textarea
        value={settings.subtext}
        onChange={(e) => update({ subtext: e.target.value })}
        placeholder="Enter subtext..."
        className="text-xs min-h-[60px] resize-y"
      />

      <SettingRow label="Styling" variant="inline">
        <Switch
          checked={settings.showSubtextStyling}
          onCheckedChange={(checked) => update({ showSubtextStyling: checked })}
        />
      </SettingRow>

      {settings.showSubtextStyling && (
        <StylingPanel styling={settings.subtextStyling} onChange={updateSubtextStyling} />
      )}

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
