'use client';

import { Monitor } from 'lucide-react';
import Link from 'next/link';

export function MobileWarning() {
  return (
    <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col items-center justify-center p-6 text-center">
      <Monitor className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Desktop recommended
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        The editor works best on desktop or tablet screens.
        Please switch to a larger screen for the full editing experience.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        Back to Dashboard
      </Link>
      <p className="text-xs text-gray-400 mt-4">
        You can also use the navigation bar above to return to your dashboard.
      </p>
    </div>
  );
}
