'use client';

import { useState } from 'react';
import { useSettingsPresetStore, SettingsPreset } from '@/store/settingsPresetStore';
import { settingsMap, getAllSettingKeys, getTotalSettingsCount } from '@/lib/settingsMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { presets, activePresetId, addPreset, removePreset, setActivePreset } =
    useSettingsPresetStore();

  const [presetName, setPresetName] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(settingsMap.map((s) => s.id))
  );
  const [selectedSettings, setSelectedSettings] = useState<Set<string>>(
    new Set(getAllSettingKeys())
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleExpand = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    const section = settingsMap.find((s) => s.id === sectionId);
    if (!section) return;

    setSelectedSections((prev) => {
      const next = new Set(prev);
      const sectionKeys = section.settings.map((s) => `${sectionId}.${s.key}`);
      if (next.has(sectionId)) {
        next.delete(sectionId);
        // Uncheck all sub-settings
        setSelectedSettings((ps) => {
          const ns = new Set(ps);
          sectionKeys.forEach((k) => ns.delete(k));
          return ns;
        });
      } else {
        next.add(sectionId);
        // Check all sub-settings
        setSelectedSettings((ps) => {
          const ns = new Set(ps);
          sectionKeys.forEach((k) => ns.add(k));
          return ns;
        });
      }
      return next;
    });
  };

  const toggleSetting = (sectionId: string, settingKey: string) => {
    const fullKey = `${sectionId}.${settingKey}`;
    const section = settingsMap.find((s) => s.id === sectionId);
    if (!section) return;

    setSelectedSettings((prev) => {
      const next = new Set(prev);
      if (next.has(fullKey)) {
        next.delete(fullKey);
      } else {
        next.add(fullKey);
      }
      // Update section checkbox: checked if ANY sub-setting is checked
      const sectionKeys = section.settings.map((s) => `${sectionId}.${s.key}`);
      const anyChecked = sectionKeys.some((k) => next.has(k));
      setSelectedSections((ps) => {
        const ns = new Set(ps);
        if (anyChecked) ns.add(sectionId);
        else ns.delete(sectionId);
        return ns;
      });
      return next;
    });
  };

  const getSubSettingCount = (sectionId: string) => {
    const section = settingsMap.find((s) => s.id === sectionId);
    if (!section) return { checked: 0, total: 0 };
    const total = section.settings.length;
    const checked = section.settings.filter((s) =>
      selectedSettings.has(`${sectionId}.${s.key}`)
    ).length;
    return { checked, total };
  };

  const isSectionPartial = (sectionId: string) => {
    const { checked, total } = getSubSettingCount(sectionId);
    return checked > 0 && checked < total;
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
    addPreset({
      name,
      visibleSections: Array.from(selectedSections),
      visibleSettings: Array.from(selectedSettings),
    });
    setPresetName('');
    toast.success('Preset saved');
  };

  const handleLoadPreset = (preset: SettingsPreset) => {
    setSelectedSections(new Set(preset.visibleSections));
    setSelectedSettings(new Set(preset.visibleSettings || getAllSettingKeys()));
    setActivePreset(preset.id);
    toast.success(`Loaded "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    removePreset(id);
    toast.success('Preset deleted');
  };

  const selectAll = () => {
    setSelectedSections(new Set(settingsMap.map((s) => s.id)));
    setSelectedSettings(new Set(getAllSettingKeys()));
  };
  const selectNone = () => {
    setSelectedSections(new Set());
    setSelectedSettings(new Set());
  };

  const totalSettings = getTotalSettingsCount();
  const checkedSettings = selectedSettings.size;

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
        {/* Section checkboxes with sub-settings */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Settings sections</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {checkedSettings} of {totalSettings} settings selected
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={selectNone}>
                Deselect all
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {settingsMap.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              const { checked, total } = getSubSettingCount(section.id);
              const isPartial = isSectionPartial(section.id);

              return (
                <div key={section.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 select-none">
                    <button
                      onClick={() => toggleExpand(section.id)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSections.has(section.id)}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartial;
                        }}
                        onChange={() => toggleSection(section.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-800">{section.title}</span>
                    </label>
                    <span className="text-xs text-gray-400">
                      {checked}/{total}
                    </span>
                  </div>

                  {/* Sub-settings */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2">
                      <div className="grid grid-cols-2 gap-1">
                        {section.settings.map((sub) => (
                          <label
                            key={sub.key}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSettings.has(`${section.id}.${sub.key}`)}
                              onChange={() => toggleSetting(section.id, sub.key)}
                              className="w-3.5 h-3.5 rounded border-gray-300 accent-orange-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600">{sub.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                      {preset.visibleSections.length} sections, {preset.visibleSettings?.length || 0} settings
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
