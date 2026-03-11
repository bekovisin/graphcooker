'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  createdAt: string;
}

export default function AdminWaitlistPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/waitlist');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Image src="/icon-sm.svg" alt="GraphCooker" width={20} height={20} />
          <h1 className="text-sm font-semibold text-gray-900">User Management</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Nav tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-md">
            <ClipboardList className="w-4 h-4" />
            Waitlist
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">{entries.length} people on the waitlist</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No waitlist submissions yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Message</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{entry.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[250px]">
                      {entry.message ? (
                        <span className="truncate block" title={entry.message}>
                          {entry.message}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                      <span className="ml-1 text-gray-300">{formatTime(entry.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
