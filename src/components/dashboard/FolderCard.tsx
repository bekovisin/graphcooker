'use client';

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

interface FolderCardProps {
  folder: { id: number; name: string };
  vizCount: number;
  onClick: () => void;
  onDrop: (vizId: number) => void;
}

export function FolderCard({ folder, vizCount, onClick, onDrop }: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`group relative rounded-lg border bg-white transition-all cursor-pointer hover:shadow-md ${
        isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const vizId = parseInt(e.dataTransfer.getData('text/plain'));
        if (!isNaN(vizId)) onDrop(vizId);
      }}
    >
      {/* Folder visual */}
      <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gray-50 rounded-t-lg border-b border-gray-100">
        <FolderOpen className={`w-12 h-12 ${isDragOver ? 'text-blue-400' : 'text-gray-300'} transition-colors`} />
        <span className="text-xs text-gray-400 mt-1">
          {vizCount} {vizCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Name */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
      </div>
    </div>
  );
}
