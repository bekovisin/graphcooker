import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsPreset {
  id: string;
  name: string;
  visibleSections: string[];
  /** Granular sub-setting visibility: "sectionId.settingKey" */
  visibleSettings: string[];
  createdAt: string;
}

interface SettingsPresetState {
  presets: SettingsPreset[];
  activePresetId: string | null;
  addPreset: (preset: Omit<SettingsPreset, 'id' | 'createdAt'>) => void;
  removePreset: (id: string) => void;
  updatePreset: (id: string, updates: Partial<Pick<SettingsPreset, 'name' | 'visibleSections' | 'visibleSettings'>>) => void;
  setActivePreset: (id: string | null) => void;
}

export const useSettingsPresetStore = create<SettingsPresetState>()(
  persist(
    (set) => ({
      presets: [],
      activePresetId: null,

      addPreset: (preset) =>
        set((state) => ({
          presets: [
            ...state.presets,
            {
              ...preset,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          activePresetId: state.activePresetId === id ? null : state.activePresetId,
        })),

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      setActivePreset: (id) => set({ activePresetId: id }),
    }),
    {
      name: 'settings-presets',
    }
  )
);
