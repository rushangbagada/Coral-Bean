'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log exception telemetry
    console.error('💥 Frontend Global Boundary Intercepted Error:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto text-center px-4 animate-in fade-in duration-300">
      <div className="relative h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-xl">
        <div className="absolute -inset-1 rounded-2xl bg-rose-500/25 blur-sm opacity-50 animate-pulse" />
        <span>⚠️</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          System Outage Detected (Crashed)
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
          The SRE Suite frontend hit a database or API timeout error while rendering the current page.
        </p>
      </div>

      {error && (
        <div className="w-full bg-[#111827]/40 border border-gray-800 rounded-xl p-4 font-mono text-xs text-rose-400 text-left overflow-x-auto max-h-40 leading-relaxed shadow-inner">
          {error.message || String(error)}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 transition-colors"
        >
          🔄 Try Again (Reset Boundary)
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
        >
          🏠 Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
