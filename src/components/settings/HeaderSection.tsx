'use client';

import { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { SettingRow } from '@/components/shared/SettingRow';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

const borderOptions: { value: BorderStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'both', label: 'Both' },
];

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

interface TextBlockProps {
  subHeader: string;
  text: string;
  onTextChange: (text: string) => void;
  styling: TextStyling;
  onStylingChange: (updates: Partial<TextStyling>) => void;
}

function TextBlock({ subHeader, text, onTextChange, styling, onStylingChange }: TextBlockProps) {
  const [showStyling, setShowStyling] = useState(false);

  return (
    <div className="space-y-3">
      {/* Sub-header */}
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
        {subHeader}
      </div>

      {/* Text Input */}
      <SettingRow label={`${subHeader.charAt(0)}${subHeader.slice(1).toLowerCase()} text`}>
        <Input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="h-8 text-xs w-full"
          placeholder={`Enter ${subHeader.toLowerCase()}...`}
        />
      </SettingRow>

      {/* Show Styling Toggle */}
      <SettingRow label="Show styling" variant="inline">
        <Switch
          checked={showStyling}
          onCheckedChange={setShowStyling}
        />
      </SettingRow>

      {showStyling && (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          {/* Font Family (full width) */}
          <Select
            value={styling.fontFamily}
            onValueChange={(v) => onStylingChange({ fontFamily: v })}
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
            onChange={(color) => onStylingChange({ color })}
          />

          {/* Font size + Font weight + Line height — 3-column row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Size</label>
              <Input
                type="number"
                value={styling.fontSize}
                onChange={(e) => onStylingChange({ fontSize: parseInt(e.target.value) || 14 })}
                className="h-7 text-xs w-full"
                min={1}
                max={200}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Weight</label>
              <Select
                value={styling.fontWeight}
                onValueChange={(v) => onStylingChange({ fontWeight: v as 'normal' | 'bold' })}
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
                onChange={(e) => onStylingChange({ lineHeight: parseFloat(e.target.value) || 1.4 })}
                className="h-7 text-xs w-full"
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeaderSection() {
  const settings = useEditorStore((s) => s.settings.header);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const update = (updates: Partial<typeof settings>) => {
    updateSettings('header', updates);
  };

  const updateTitleStyling = (updates: Partial<TextStyling>) => {
    updateSettings('header', {
      titleStyling: { ...settings.titleStyling, ...updates },
    });
  };

  const updateSubtitleStyling = (updates: Partial<TextStyling>) => {
    updateSettings('header', {
      subtitleStyling: { ...settings.subtitleStyling, ...updates },
    });
  };

  const updateTextStyling = (updates: Partial<TextStyling>) => {
    updateSettings('header', {
      textStyling: { ...settings.textStyling, ...updates },
    });
  };

  return (
    <AccordionSection id="header" title="Header">
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

      {/* TITLE */}
      <TextBlock
        subHeader="TITLE"
        text={settings.title}
        onTextChange={(text) => update({ title: text })}
        styling={settings.titleStyling}
        onStylingChange={updateTitleStyling}
      />

      {/* SUBTITLE */}
      <TextBlock
        subHeader="SUBTITLE"
        text={settings.subtitle}
        onTextChange={(text) => update({ subtitle: text })}
        styling={settings.subtitleStyling}
        onStylingChange={updateSubtitleStyling}
      />

      {/* TEXT */}
      <TextBlock
        subHeader="TEXT"
        text={settings.text}
        onTextChange={(text) => update({ text })}
        styling={settings.textStyling}
        onStylingChange={updateTextStyling}
      />

      {/* BORDER */}
      <div className="space-y-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
          Border
        </div>
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
      </div>
    </AccordionSection>
  );
}
