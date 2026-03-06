'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FileCode,
  FileText,
  FileType,
  Loader2,
  Save,
} from 'lucide-react';
import Link from 'next/link';

interface EditorTopBarProps {
  onExport: (format: 'png' | 'svg' | 'html' | 'pdf') => void;
}

export function EditorTopBar({ onExport }: EditorTopBarProps) {
  const {
    visualizationName,
    setVisualizationName,
    activeTab,
    setActiveTab,
    isDirty,
    isSaving,
    lastSavedAt,
  } = useEditorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(visualizationName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    if (editValue.trim()) {
      setVisualizationName(editValue.trim());
    } else {
      setEditValue(visualizationName);
    }
    setIsEditing(false);
  };

  return (
    <div className="relative flex items-center h-14 px-4 border-b bg-white shrink-0">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>

        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') {
                setEditValue(visualizationName);
                setIsEditing(false);
              }
            }}
            className="h-8 w-64 text-sm font-medium"
          />
        ) : (
          <button
            onClick={() => {
              setEditValue(visualizationName);
              setIsEditing(true);
            }}
            className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate max-w-[300px] text-left"
          >
            {visualizationName}
          </button>
        )}
      </div>

      {/* Center: Tabs — absolutely centered on screen */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'data'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Data
          </button>
        </div>
      </div>

      {/* Right: Save status + Export */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Save status badge */}
        <div className="flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1 whitespace-nowrap">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              <span className="text-gray-500">Saving...</span>
            </>
          ) : isDirty ? (
            <span className="text-amber-500">Unsaved changes</span>
          ) : lastSavedAt ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-gray-500">Saved</span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              Export & publish
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onExport('png')} className="gap-2">
              <FileImage className="w-4 h-4" />
              Download PNG image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('svg')} className="gap-2">
              <FileCode className="w-4 h-4" />
              Download SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2">
              <FileText className="w-4 h-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('html')} className="gap-2">
              <FileType className="w-4 h-4" />
              Download HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Save className="w-4 h-4" />
              Save for report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
