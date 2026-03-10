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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/graphcooker-icon.svg" alt="GraphCooker" width={28} height={28} />
          <h1 className="text-lg font-bold text-gray-900">Waitlist</h1>
        </div>

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
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{entries.length}</span>
            <span>people on the waitlist</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-3" />
            <p className="text-sm">No waitlist submissions yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.email}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[250px]">
                      {entry.message ? (
                        <span className="truncate block" title={entry.message}>
                          {entry.message}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                      <span className="ml-1 text-gray-300">{formatTime(entry.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
