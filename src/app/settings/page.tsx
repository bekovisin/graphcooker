'use client';

import { useState } from 'react';
import { useSettingsPresetStore, SettingsPreset } from '@/store/settingsPresetStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const allSections = [
  { id: 'chart-type', title: 'Chart type' },
  { id: 'controls-filters', title: 'Controls & filters' },
  { id: 'colors', title: 'Colors' },
  { id: 'bars', title: 'Bars' },
  { id: 'labels', title: 'Labels' },
  { id: 'x-axis', title: 'X axis' },
  { id: 'y-axis', title: 'Y axis' },
  { id: 'plot-background', title: 'Plot background' },
  { id: 'number-formatting', title: 'Number formatting' },
  { id: 'legend', title: 'Legend' },
  { id: 'popups-panels', title: 'Popups & panels' },
  { id: 'annotations', title: 'Annotations' },
  { id: 'animations', title: 'Animations' },
  { id: 'layout', title: 'Layout' },
  { id: 'question', title: 'Question' },
  { id: 'header', title: 'Header' },
  { id: 'footer', title: 'Footer' },
  { id: 'accessibility', title: 'Accessibility' },
];

export default function SettingsPage() {
  const { presets, activePresetId, addPreset, removePreset, setActivePreset } =
    useSettingsPresetStore();

  const [presetName, setPresetName] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(allSections.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      toast.error('Enter a preset name');
      return;
    }
    if (selectedSections.size === 0) {
      toast.error('Select at least one section');
      return;
    }
    addPreset({ name, visibleSections: Array.from(selectedSections) });
    setPresetName('');
    toast.success('Preset saved');
  };

  const handleLoadPreset = (preset: SettingsPreset) => {
    setSelectedSections(new Set(preset.visibleSections));
    setActivePreset(preset.id);
    toast.success(`Loaded "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    removePreset(id);
    toast.success('Preset deleted');
  };

  const selectAll = () => setSelectedSections(new Set(allSections.map((s) => s.id)));
  const selectNone = () => setSelectedSections(new Set());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center h-14 px-4 border-b bg-white">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="ml-3 text-sm font-semibold text-gray-900">General Settings</h1>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Section checkboxes */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Settings sections</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={selectNone}>
                Deselect all
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allSections.map((section) => (
              <label
                key={section.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(section.id)}
                  onChange={() => toggleSection(section.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{section.title}</span>
              </label>
            ))}
          </div>

          {/* Save as preset */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              className="h-9 text-sm flex-1"
            />
            <Button size="sm" onClick={handleSavePreset} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Save preset
            </Button>
          </div>
        </div>

        {/* Saved presets */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Saved presets</h2>

          {presets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No presets saved yet. Select sections and save a preset above.
            </p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    activePresetId === preset.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{preset.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {preset.visibleSections.length} of {allSections.length} sections
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {activePresetId === preset.id && <Check className="w-3 h-3 text-blue-500" />}
                      {activePresetId === preset.id ? 'Active' : 'Load'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
