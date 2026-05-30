'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { AccordionSection } from '@/components/settings/AccordionSection';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { ChevronDown, Search, Save, Check, X, Pencil, Trash2 } from 'lucide-react';
import type { ChartSettings } from '@/types/chart';

interface SavedDesignVersion {
  id: number;
  name: string;
  settings: ChartSettings;
  chartType: string | null;
  isBuiltIn: boolean;
}

export function DesignVersionSection() {
  const settings = useEditorStore((s) => s.settings);
  const chartType = useEditorStore((s) => s.settings.chartType.chartType);
  const setSettings = useEditorStore((s) => s.setSettings);

  const [versions, setVersions] = useState<SavedDesignVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [filterByChartType, setFilterByChartType] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'overwrite';
    version: SavedDesignVersion;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/design-versions');
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error('Failed to fetch design versions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (savingName && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [savingName]);

  const handleSaveCurrentDesign = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/design-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, settings, chartType }),
      });
      if (res.ok) {
        const created = await res.json();
        setActiveVersionId(created.id);
        setNewName('');
        setSavingName(false);
        fetchVersions();
      }
    } catch (err) {
      console.error('Failed to save design version:', err);
    }
  };

  const handleOverwriteCurrent = async (versionId: number) => {
    try {
      const res = await fetch(`/api/design-versions/${versionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, chartType }),
      });
      if (res.ok) {
        fetchVersions();
      }
    } catch (err) {
      console.error('Failed to update design version:', err);
    }
  };

  const handleApplyVersion = (version: SavedDesignVersion) => {
    setSettings(version.settings);
    setActiveVersionId(version.id);
    setPopoverOpen(false);
  };

  const handleDeleteVersion = async (versionId: number) => {
    try {
      const res = await fetch(`/api/design-versions/${versionId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeVersionId === versionId) setActiveVersionId(null);
        fetchVersions();
      }
    } catch (err) {
      console.error('Failed to delete design version:', err);
    }
  };

  const handleRenameVersion = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/design-versions/${renamingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setVersions((prev) =>
          prev.map((v) => (v.id === renamingId ? { ...v, name: renameValue.trim() } : v))
        );
      }
    } catch (err) {
      console.error('Failed to rename design version:', err);
    }
    setRenamingId(null);
  };

  const sortedFilteredVersions = useMemo(() => {
    let result = [...versions].sort((a, b) =>
      a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' })
    );
    if (filterByChartType) {
      result = result.filter((v) => !v.chartType || v.chartType === chartType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(q));
    }
    return result;
  }, [versions, search, filterByChartType, chartType]);

  const activeVersion = useMemo(
    () => (activeVersionId ? versions.find((v) => v.id === activeVersionId) : null),
    [activeVersionId, versions]
  );

  return (
    <AccordionSection id="design-version" title="Design version">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Save the current chart&apos;s complete design settings as a reusable version. Apply a saved
        version to any chart to instantly transfer all design properties — colors, sizes, fonts,
        paddings, and more. Data and chart name stay untouched.
      </p>

      {/* Saved Versions Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Saved versions</Label>
        <Popover
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open);
            if (!open) {
              setSearch('');
              setRenamingId(null);
            }
          }}
        >
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between h-8 w-full rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              {activeVersion ? (
                <span className="truncate">{activeVersion.name}</span>
              ) : (
                <span className="text-muted-foreground">
                  {versions.length === 0 ? 'No saved versions yet' : 'Select a version...'}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            sideOffset={4}
          >
            {/* Search */}
            <div className="flex items-center border-b px-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search versions..."
                className="flex-1 h-8 px-2 text-xs bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>

            {/* Filter toggle */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600">
                <input
                  type="checkbox"
                  checked={filterByChartType}
                  onChange={(e) => setFilterByChartType(e.target.checked)}
                  className="h-3 w-3 cursor-pointer"
                />
                Only this chart type
              </label>
              <span className="text-[10px] text-gray-400">
                {sortedFilteredVersions.length} {sortedFilteredVersions.length === 1 ? 'version' : 'versions'}
              </span>
            </div>

            {/* List */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {loading && (
                <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
              )}
              {!loading && sortedFilteredVersions.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">
                  {search.trim()
                    ? 'No versions found'
                    : filterByChartType
                      ? 'No versions saved for this chart type yet'
                      : 'No versions saved yet'}
                </div>
              )}
              {sortedFilteredVersions.map((version) => {
                const isActive = activeVersionId === version.id;
                const isRenaming = renamingId === version.id;
                return (
                  <div
                    key={version.id}
                    className={`group flex items-center gap-1 px-2 py-1 hover:bg-accent ${
                      isActive ? 'bg-accent' : ''
                    }`}
                  >
                    {isRenaming ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameVersion();
                        }}
                        className="flex items-center gap-1 flex-1 min-w-0"
                      >
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="text-xs border rounded px-2 h-7 flex-1 min-w-0"
                          autoFocus
                          onBlur={handleRenameVersion}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                      </form>
                    ) : (
                      <>
                        <button
                          className={`flex-1 text-left text-xs truncate px-1 py-0.5 ${
                            isActive ? 'font-medium' : ''
                          }`}
                          onClick={() => handleApplyVersion(version)}
                          title={`Apply ${version.name}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{version.name}</span>
                            {version.chartType && version.chartType !== chartType && (
                              <span className="text-[9px] text-amber-600 shrink-0 px-1 rounded bg-amber-50 border border-amber-200">
                                {version.chartType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </button>
                        {!version.isBuiltIn && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ type: 'overwrite', version });
                              }}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Save current design over this version"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(version.id);
                                setRenameValue(version.name);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title="Rename"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ type: 'delete', version });
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Save current design */}
      {savingName ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Name your design</Label>
          <div className="flex items-center gap-1">
            <input
              ref={newNameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveCurrentDesign();
                }
                if (e.key === 'Escape') {
                  setSavingName(false);
                  setNewName('');
                }
              }}
              placeholder="e.g. Brand 2026, Dark style..."
              className="text-xs border rounded px-2 h-8 flex-1 min-w-0 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            <button
              onClick={handleSaveCurrentDesign}
              disabled={!newName.trim()}
              className="h-8 px-2 inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSavingName(false);
                setNewName('');
              }}
              className="h-8 px-2 inline-flex items-center justify-center rounded-md border bg-background text-xs hover:bg-accent"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setSavingName(true);
            setNewName('');
          }}
          className="flex items-center justify-center gap-1.5 w-full h-8 rounded-md border border-input bg-background text-xs hover:bg-accent transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save current design as version
        </button>
      )}

      {/* Overwrite active version */}
      {activeVersion && !activeVersion.isBuiltIn && (
        <button
          onClick={() => setConfirmAction({ type: 'overwrite', version: activeVersion })}
          className="flex items-center justify-center gap-1.5 w-full h-8 rounded-md border border-input bg-background text-xs text-gray-600 hover:bg-accent transition-colors"
          title={`Overwrite "${activeVersion.name}" with current design`}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="truncate">Overwrite &quot;{activeVersion.name}&quot;</span>
        </button>
      )}

      {/* Delete / Overwrite confirmation */}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction?.type === 'delete' ? 'Delete design version' : 'Overwrite design version'}
        description={
          confirmAction?.type === 'delete'
            ? `"${confirmAction?.version.name ?? ''}" will be permanently deleted. This action cannot be undone.`
            : `"${confirmAction?.version.name ?? ''}" will be replaced with the chart's current design. This action cannot be undone.`
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Overwrite'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={async () => {
          if (!confirmAction) return;
          if (confirmAction.type === 'delete') {
            await handleDeleteVersion(confirmAction.version.id);
          } else {
            await handleOverwriteCurrent(confirmAction.version.id);
          }
        }}
      />
    </AccordionSection>
  );
}
