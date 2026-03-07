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
  BookmarkPlus,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FileCode,
  FileText,
  FileType,
  Loader2,
  RefreshCw,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface EditorTopBarProps {
  onExport: (format: 'png' | 'svg' | 'html' | 'pdf') => void;
  fromTemplateId?: number | null;
}

export function EditorTopBar({ onExport, fromTemplateId }: EditorTopBarProps) {
  const {
    visualizationName,
    setVisualizationName,
    activeTab,
    setActiveTab,
    isDirty,
    isSaving,
    lastSavedAt,
    settings,
    data,
    columnMapping,
    chartType,
  } = useEditorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(visualizationName);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
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

  const handleUpdateTemplate = async () => {
    if (!fromTemplateId) return;
    setUpdatingTemplate(true);
    try {
      const res = await fetch(`/api/templates/${fromTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartType,
          settings,
          data,
          columnMapping,
        }),
      });
      if (res.ok) {
        toast.success('Template updated');
      } else {
        toast.error('Failed to update template');
      }
    } catch {
      toast.error('Failed to update template');
    } finally {
      setUpdatingTemplate(false);
    }
  };

  return (
    <div className="flex items-center h-14 px-4 border-b bg-white shrink-0">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors shrink-0"
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
            className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate max-w-[200px] text-left"
          >
            {visualizationName}
          </button>
        )}
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center justify-center shrink-0">
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
      <div className="flex items-center gap-2 justify-end flex-1">
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

        {fromTemplateId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleUpdateTemplate}
            disabled={updatingTemplate}
            title="Update the source template with current settings"
          >
            {updatingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden xl:inline">Update template</span>
            <span className="xl:hidden">Update</span>
          </Button>
        )}

        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowSaveTemplate(true)} title="Save as template">
          <BookmarkPlus className="w-4 h-4" />
          <span className="hidden xl:inline">Save as template</span>
          <span className="xl:hidden">Template</span>
        </Button>

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

      <SaveTemplateDialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate} />
    </div>
  );
}
