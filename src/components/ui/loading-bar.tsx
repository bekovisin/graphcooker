'use client';

export function LoadingBar() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-blue-500 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}
