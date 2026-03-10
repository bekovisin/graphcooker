'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ShareTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number | null;
  templateName: string;
  currentUserId: number;
}

export function ShareTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  currentUserId,
}: ShareTemplateDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setLoading(true);
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => setUsers(data.filter((u: User) => u.id !== currentUserId)))
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoading(false));
    }
  }, [open, currentUserId]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (!templateId || selectedIds.size === 0) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to share template');
        return;
      }
      const { copied } = await res.json();
      toast.success(`Template copied to ${copied} user(s)`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to share template');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-500" />
            Share template
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Copy &quot;{templateName}&quot; to selected user accounts. Each user gets an independent copy.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No other users found</p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto py-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedIds.has(user.id) ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  selectedIds.has(user.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                }`}>
                  {selectedIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sharing || selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Share to {selectedIds.size > 0 ? `${selectedIds.size} user(s)` : 'users'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
