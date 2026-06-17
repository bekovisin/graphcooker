'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderInput, CopyPlus, FolderOpen, Home, Plus, Check, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'move' | 'copy';
  count: number;
  /** Folders being moved/copied — excluded as targets (along with their descendants). */
  excludeFolderIds?: number[];
  onConfirm: (targetFolderId: number | null) => void | Promise<void>;
}

export function MoveToFolderDialog({ open, onOpenChange, mode, count, excludeFolderIds = [], onConfirm }: MoveToFolderDialogProps) {
  const folders = useDashboardStore((s) => s.folders);
  const createFolder = useDashboardStore((s) => s.createFolder);

  const [target, setTarget] = useState<number | null>(null);
  const [picked, setPicked] = useState(false); // distinguishes "no choice yet" from "root chosen"
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMove = mode === 'move';

  useEffect(() => {
    if (open) {
      setTarget(null);
      setPicked(false);
      setCreating(false);
      setNewName('');
      setBusy(false);
    }
  }, [open]);

  // Exclude the items being moved + their descendants from the target list.
  const excluded = useMemo(() => {
    const set = new Set<number>();
    const add = (id: number) => {
      if (set.has(id)) return;
      set.add(id);
      folders.forEach((f) => { if (f.parentId === id) add(f.id); });
    };
    excludeFolderIds.forEach(add);
    return set;
  }, [folders, excludeFolderIds]);

  const targetName = target !== null ? folders.find((f) => f.id === target)?.name : undefined;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const folder = await createFolder(name, picked ? target : null);
    setBusy(false);
    if (folder) {
      setTarget(folder.id);
      setPicked(true);
      setCreating(false);
      setNewName('');
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm(target);
    setBusy(false);
  };

  const renderNodes = (parentId: number | null, depth: number): React.ReactNode[] =>
    folders
      .filter((f) => (f.parentId ?? null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((f) => {
        if (excluded.has(f.id)) return [];
        const selected = picked && target === f.id;
        return [
          <button
            key={f.id}
            type="button"
            onClick={() => { setTarget(f.id); setPicked(true); }}
            className={`w-full flex items-center gap-2 text-sm py-1.5 rounded-md text-left transition-colors ${selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
            style={{ paddingLeft: 8 + depth * 16, paddingRight: 8 }}
          >
            <FolderOpen className="w-4 h-4 shrink-0" style={{ color: f.iconColor || '#9ca3af' }} />
            <span className="truncate flex-1">{f.name}</span>
            {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>,
          ...renderNodes(f.id, depth + 1),
        ];
      });

  const rootSelected = picked && target === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader className="flex-row items-start gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50">
              {isMove ? <FolderInput className="w-5 h-5 text-blue-600" /> : <CopyPlus className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>{isMove ? 'Move to folder' : 'Copy to folder'}</DialogTitle>
              <DialogDescription>
                {isMove ? 'Move' : 'Copy'} {count} selected item{count > 1 ? 's' : ''} into a folder.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-gray-200 p-1 space-y-0.5">
              {/* Root target */}
              <button
                type="button"
                onClick={() => { setTarget(null); setPicked(true); }}
                className={`w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-left transition-colors ${rootSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <Home className="w-4 h-4 shrink-0 text-gray-400" />
                <span className="truncate flex-1">Visualizations (root)</span>
                {rootSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
              {renderNodes(null, 0)}
              {folders.length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-3 text-center">No folders yet — create one below.</p>
              )}
            </div>

            {/* Create a new folder inline */}
            {creating ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                  }}
                  placeholder={targetName ? `New folder in "${targetName}"…` : 'New folder name…'}
                  autoFocus
                  className="flex-1 min-w-0 text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                />
                <Button size="sm" className="shrink-0" onClick={handleCreate} disabled={!newName.trim() || busy}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                </Button>
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { setCreating(false); setNewName(''); }}>Cancel</Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
              >
                <Plus className="w-3.5 h-3.5" /> New folder{targetName ? ` in "${targetName}"` : ''}
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-3 border-t gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!picked || busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isMove ? 'Move here' : 'Copy here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
