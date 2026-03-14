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
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileImage,
  FileCode,
  FileText,
  FileType,
  FolderOpen,
  Loader2,
  Save,
  SaveAll,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { TemplatePickerDialog } from './TemplatePickerDialog';
import { ShareVisualizationDialog } from './ShareVisualizationDialog';
import { useAuthStore } from '@/store/authStore';

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface EditorTopBarProps {
  onExport: (format: 'png' | 'svg' | 'html' | 'pdf') => void;
  breadcrumbs?: BreadcrumbItem[];
  visualizationId?: number | null;
}

export function EditorTopBar({ onExport, breadcrumbs = [], visualizationId }: EditorTopBarProps) {
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
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showUpdatePicker, setShowUpdatePicker] = useState(false);
  const [showShareViz, setShowShareViz] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

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
    <div className="flex items-center h-14 px-4 border-b bg-white shrink-0">
      {/* Left: Logo + Breadcrumbs + Name */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 px-1.5 h-8 rounded-md hover:bg-gray-100 transition-colors shrink-0"
          title="GraphCooker — Back to dashboard"
        >
          <Image src="/icon-sm.svg" alt="GC" width={20} height={20} />
        </Link>
        {breadcrumbs.map((bc) => (
          <span key={bc.id} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link
              href={`/dashboard/folder/${bc.id}`}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[100px]"
              title={bc.name}
            >
              {bc.name}
            </Link>
          </span>
        ))}
        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />

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
            className="h-8 w-[400px] text-sm font-medium"
          />
        ) : (
          <button
            onClick={() => {
              setEditValue(visualizationName);
              setIsEditing(true);
            }}
            className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate max-w-[400px] text-left"
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <BookmarkPlus className="w-4 h-4" />
              <span className="hidden xl:inline">Templates</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowSaveTemplate(true)} className="gap-2">
              <BookmarkPlus className="w-4 h-4" />
              Save as new template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowUpdatePicker(true)} className="gap-2">
              <SaveAll className="w-4 h-4" />
              Save to existing template...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowTemplatePicker(true)} className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Load from template...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowShareViz(true)} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SaveTemplateDialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate} />
      <TemplatePickerDialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker} />
      <TemplatePickerDialog open={showUpdatePicker} onOpenChange={setShowUpdatePicker} updateMode />
      <ShareVisualizationDialog
        open={showShareViz}
        onOpenChange={setShowShareViz}
        visualizationId={visualizationId ?? null}
        visualizationName={visualizationName}
        currentUserId={user?.id}
        userRole={user?.role || 'customer'}
      />
    </div>
  );
}
