export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Glow pulsing ring */}
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 blur opacity-40 animate-pulse" />
        <svg className="relative animate-spin h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase animate-pulse">
        Aggregating SRE telemetry...
      </p>
    </div>
  );
}
