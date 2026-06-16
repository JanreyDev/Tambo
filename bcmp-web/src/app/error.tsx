'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="text-center max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-orange-500">
          Something went wrong
        </p>
        <h1 className="text-3xl font-bold mb-3 text-white">
          Unexpected Error
        </h1>
        <p className="text-sm mb-8 leading-relaxed text-gray-400">
          An unexpected error occurred. This has been logged and our team will
          look into it. You can try refreshing the page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
