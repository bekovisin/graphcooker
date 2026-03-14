'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Share2, CheckSquare, Square, Users, X, Mail, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ShareVisualizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visualizationId: number | null;
  visualizationName?: string;
  currentUserId?: number;
  userRole: string;
}

export function ShareVisualizationDialog({
  open,
  onOpenChange,
  visualizationId,
  visualizationName,
  userRole,
}: ShareVisualizationDialogProps) {
  // Admin mode state
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  // Customer mode state
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (open) {
      setSelectedUserIds(new Set());
      setEmailInput('');
      setEmailList([]);

      if (isAdmin) {
        setLoading(true);
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
    }
  }, [open, isAdmin]);

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (emailList.includes(email)) {
      toast.error('Email already added');
      return;
    }
    setEmailList((prev) => [...prev, email]);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setEmailList((prev) => prev.filter((e) => e !== email));
  };

  const handleShare = async () => {
    if (!visualizationId) return;
    const hasSelection = isAdmin ? selectedUserIds.size > 0 : emailList.length > 0;
    if (!hasSelection) return;

    setSharing(true);
    try {
      const payload = isAdmin
        ? { userIds: Array.from(selectedUserIds) }
        : { emails: emailList };

      await fetch(`/api/visualizations/${visualizationId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const recipientCount = isAdmin ? selectedUserIds.size : emailList.length;
      toast.success(
        `Shared "${visualizationName || 'visualization'}" with ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}`
      );
      onOpenChange(false);
    } catch {
      toast.error('Failed to share');
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
            Share visualization
          </DialogTitle>
        </DialogHeader>

        {isAdmin ? (
          loading ? (
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
              <p className="text-xs text-gray-500">
                Select users to share with (a copy will be created for each user):
              </p>
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
          )
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">
              Enter the email address of the person you want to share with:
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addEmail} className="shrink-0 gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>

            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {emailList.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md"
                  >
                    <Mail className="w-3 h-3" />
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-0.5 hover:text-blue-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                {emailList.length} recipient{emailList.length !== 1 ? 's' : ''}
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleShare}
                disabled={sharing || emailList.length === 0}
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
