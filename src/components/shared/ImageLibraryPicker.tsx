'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Pencil, Trash2, Search, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (dataUrl: string) => void;
}

interface LibraryImage {
  id: number;
  name: string;
  dataUrl: string;
  createdAt: string;
  lastUsedAt: string;
}

type SortMode = 'recently-used' | 'a-z' | 'z-a' | 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recently-used', label: 'Recently used' },
  { value: 'a-z', label: 'A → Z' },
  { value: 'z-a', label: 'Z → A' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side default

export function ImageLibraryPicker({ open, onOpenChange, onSelect }: ImageLibraryPickerProps) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recently-used');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch images and sort preference on open
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setEditingId(null);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [imagesRes, prefRes] = await Promise.all([
          fetch('/api/image-library'),
          fetch('/api/preferences?key=image_library_sort'),
        ]);
        if (imagesRes.ok) {
          const data = await imagesRes.json();
          setImages(data);
        }
        if (prefRes.ok) {
          const pref = await prefRes.json();
          if (pref?.value) {
            setSortMode(pref.value as SortMode);
          }
        }
      } catch (err) {
        console.error('Failed to fetch image library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open]);

  // Persist sort preference
  const handleSortChange = useCallback(async (mode: SortMode) => {
    setSortMode(mode);
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'image_library_sort', value: mode }),
      });
    } catch {
      // Silent fail for preference save
    }
  }, []);

  // Filter and sort
  const filteredImages = useMemo(() => {
    let result = images;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((img) => img.name.toLowerCase().includes(q));
    }
    const sorted = [...result];
    switch (sortMode) {
      case 'a-z':
        sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' }));
        break;
      case 'recently-used':
        sorted.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }
    return sorted;
  }, [images, search, sortMode]);

  // Upload files
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.match(/^image\/(png|jpe?g|svg\+xml|webp)$/)) {
        toast.error(`${file.name}: Unsupported format. Use PNG, JPEG, WebP, or SVG.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File too large (max 10MB).`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    setUploading(true);

    for (const file of validFiles) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Failed to read file'));
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Strip extension from filename
        const name = file.name.replace(/\.[^.]+$/, '');

        const res = await fetch('/api/image-library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, dataUrl }),
        });

        if (res.ok) {
          const created = await res.json();
          setImages((prev) => [created, ...prev]);
        } else {
          const err = await res.json();
          toast.error(`${file.name}: ${err.error || 'Upload failed'}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`${file.name}: Upload failed`);
      }
    }
    setUploading(false);
  }, []);

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) uploadFiles(e.target.files);
      e.target.value = '';
    },
    [uploadFiles]
  );

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  // Select image
  const handleSelect = useCallback(
    async (img: LibraryImage) => {
      onSelect(img.dataUrl);
      // Update lastUsedAt in background
      try {
        await fetch(`/api/image-library/${img.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastUsedAt: new Date().toISOString() }),
        });
      } catch {
        // Silent fail
      }
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  // Rename
  const startRename = useCallback((img: LibraryImage) => {
    setEditingId(img.id);
    setEditingName(img.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const confirmRename = useCallback(
    async (id: number) => {
      const trimmed = editingName.trim();
      if (!trimmed) {
        setEditingId(null);
        return;
      }
      try {
        const res = await fetch(`/api/image-library/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        if (res.ok) {
          setImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, name: trimmed } : img))
          );
        }
      } catch {
        toast.error('Failed to rename image');
      }
      setEditingId(null);
    },
    [editingName]
  );

  // Delete
  const handleDelete = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/image-library/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        toast.error('Failed to delete image');
      }
    } catch {
      toast.error('Failed to delete image');
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <DialogHeader>
          <DialogTitle className="text-sm">Image Library</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images..."
              className="h-8 text-xs pl-7"
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => handleSortChange(e.target.value as SortMode)}
            className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add image
          </button>
        </div>

        {/* Grid / Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 overflow-y-auto rounded-md border-2 transition-colors min-h-[200px] ${
            dragging
              ? 'border-blue-400 bg-blue-50/50'
              : 'border-transparent'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-2">
              <ImageIcon className="w-10 h-10 text-gray-200" />
              {search ? (
                <p className="text-xs text-gray-400">No images match &ldquo;{search}&rdquo;</p>
              ) : (
                <>
                  <p className="text-xs text-gray-400">No images yet</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload your first image
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 p-3">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => {
                    if (editingId !== img.id) handleSelect(img);
                  }}
                  className="group relative flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-square bg-white rounded-md border border-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  {/* Name or rename input */}
                  {editingId === img.id ? (
                    <div className="flex items-center gap-0.5 w-full" onClick={(e) => e.stopPropagation()}>
                      <Input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(img.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => confirmRename(img.id)}
                        className="h-5 text-[10px] px-1 w-full"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500 truncate w-full text-center" title={img.name}>
                      {img.name}
                    </span>
                  )}

                  {/* Hover actions */}
                  {editingId !== img.id && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(img);
                        }}
                        className="p-1 rounded bg-white/90 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(img.id, e)}
                        className="p-1 rounded bg-white/90 border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload indicator */}
        {uploading && (
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Uploading...</span>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image count */}
        {!loading && images.length > 0 && (
          <div className="text-[10px] text-gray-400 px-1">
            {filteredImages.length === images.length
              ? `${images.length} image${images.length !== 1 ? 's' : ''}`
              : `${filteredImages.length} of ${images.length} image${images.length !== 1 ? 's' : ''}`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
