'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, CheckSquare, Square, Users } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ShareTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateIds: number[];
  onShared?: () => void;
}

export function ShareTemplateDialog({
  open,
  onOpenChange,
  templateIds,
  onShared,
}: ShareTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelectedUserIds(new Set());
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUsers(data);
          } else if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
        })
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedUserIds.size === 0 || templateIds.length === 0) return;
    setSharing(true);
    try {
      let totalCopied = 0;
      for (const templateId of templateIds) {
        const res = await fetch(`/api/templates/${templateId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
        });
        if (res.ok) {
          const data = await res.json();
          totalCopied += data.copied || 0;
        }
      }
      toast.success(`Shared ${templateIds.length} template${templateIds.length > 1 ? 's' : ''} with ${selectedUserIds.size} user${selectedUserIds.size > 1 ? 's' : ''} (${totalCopied} copies created)`);
      onShared?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to share templates');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share {templateIds.length > 1 ? `${templateIds.length} templates` : 'template'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">Select users to share with (copies will be created for each user):</p>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                    selectedUserIds.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {selectedUserIds.has(user.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{user.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                  </div>
                  {user.role === 'admin' && (
                    <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                      Admin
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleShare}
                disabled={sharing || selectedUserIds.size === 0}
              >
                {sharing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                Share
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
