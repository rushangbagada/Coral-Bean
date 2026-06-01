import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="fixed inset-0 z-50 flex bg-[#060809] text-gray-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0A0C0E] flex flex-col justify-between">
        <div>
          {/* Logo / Brand */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
              </div>
              <div>
                <h2 className="text-white font-bold tracking-wide">Mainframe</h2>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Active Session</p>
              </div>
            </div>
          </div>
          
          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#0B2529] text-[#00E5FF] rounded-lg border border-[#00E5FF]/20 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00E5FF] rounded-r-md shadow-[0_0_10px_#00E5FF]"></div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              <span className="font-semibold text-sm">Overview</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span className="font-medium text-sm">Incidents</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
              <span className="font-medium text-sm">Telemetry</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              <span className="font-medium text-sm">Logs</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              <span className="font-medium text-sm">Archive</span>
            </a>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-[#D7F5F5] to-[#B2EBEB] text-[#053B3B] font-bold text-sm rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all transform hover:-translate-y-0.5">
            DEPLOY UPDATE
          </button>
          
          <div className="space-y-2 pt-4 border-t border-white/5">
            <a href="#" className="flex items-center gap-3 px-2 py-2 text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-sm font-medium">Support</span>
            </a>
            <Link href="/" className="flex items-center gap-3 px-2 py-2 text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="text-sm font-medium">Exit Dashboard</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#111A22] via-[#060809] to-[#060809] p-8 md:p-12">
        
        {/* Top Header */}
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">NEURAL_OS</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA] shadow-[0_0_8px_#00FFAA] animate-pulse"></span>
              <span className="text-[#00FFAA] text-xs font-bold tracking-widest uppercase">ALL SYSTEMS NOMINAL</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-sm font-mono text-gray-300">28:03:46 UTC</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/20 overflow-hidden">
               <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600"></div>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Health Card */}
          <div className="rounded-xl border border-white/5 bg-[#0C0F12]/80 backdrop-blur-xl p-6 flex flex-col justify-between h-36 hover:bg-[#11151A] transition-colors">
            <div className="flex justify-between items-start">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Health</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#00E5FF] tracking-tight mb-1">98%</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">SYSTEM HEALTH</div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00E5FF] to-blue-500 w-[98%] shadow-[0_0_10px_#00E5FF]"></div>
              </div>
            </div>
          </div>

          {/* Active Incidents Card */}
          <div className="rounded-xl border border-white/5 bg-[#0C0F12]/80 backdrop-blur-xl p-6 flex flex-col justify-between h-36 hover:bg-[#11151A] transition-colors">
            <div className="flex justify-between items-start">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#FF4D4D] tracking-tight mb-1">12</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">ACTIVE INCIDENTS</div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF4D4D] to-orange-500 w-[40%] shadow-[0_0_10px_#FF4D4D]"></div>
              </div>
            </div>
          </div>

          {/* Reliability Card */}
          <div className="rounded-xl border border-white/5 bg-[#0C0F12]/80 backdrop-blur-xl p-6 flex flex-col justify-between h-36 hover:bg-[#11151A] transition-colors">
            <div className="flex justify-between items-start">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reliability</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#00FFAA] tracking-tight mb-1">99.99%</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">UPTIME</div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00FFAA] to-green-500 w-[100%] shadow-[0_0_10px_#00FFAA]"></div>
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="rounded-xl border border-white/5 bg-[#0C0F12]/80 backdrop-blur-xl p-6 flex flex-col justify-between h-36 hover:bg-[#11151A] transition-colors">
            <div className="flex justify-between items-start">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-1">A+</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">SECURITY SCORE</div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[90%] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents Panel */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-[#0A0D10]/90 backdrop-blur-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Incidents</h2>
              <p className="text-xs text-gray-500 font-medium">Real-time system event log</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111418] border-b border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Row 1 */}
                <tr className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF4D4D] shadow-[0_0_8px_#FF4D4D]"></span>
                      <span className="text-xs font-bold text-[#FF4D4D] tracking-wider uppercase">CRITICAL</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm text-gray-300">INC-88921</td>
                  <td className="px-6 py-5 text-sm text-gray-300 font-medium">Anomaly detected in neural processing cluster 4-B.</td>
                  <td className="px-6 py-5 font-mono text-xs text-gray-500">14:23:01</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#FF4D4D]/30 bg-[#FF4D4D]/10 text-[10px] font-bold text-[#FF4D4D] tracking-widest shadow-[0_0_15px_rgba(255,77,77,0.2)]">
                      IN PROGRESS
                    </span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FFB340] shadow-[0_0_8px_#FFB340]"></span>
                      <span className="text-xs font-bold text-[#FFB340] tracking-wider uppercase">WARNING</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm text-gray-300">INC-88915</td>
                  <td className="px-6 py-5 text-sm text-gray-300 font-medium">High latency detected on cross-region data sync.</td>
                  <td className="px-6 py-5 font-mono text-xs text-gray-500">12:11:45</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00FFAA]/30 bg-[#00FFAA]/5 text-[10px] font-bold text-[#00FFAA] tracking-widest">
                      RESOLVED
                    </span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                      <span className="text-xs font-bold text-white tracking-wider uppercase">INFO</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm text-gray-300">INC-88912</td>
                  <td className="px-6 py-5 text-sm text-gray-300 font-medium">System core update successfully deployed to edge nodes.</td>
                  <td className="px-6 py-5 font-mono text-xs text-gray-500">10:45:00</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00FFAA]/30 bg-[#00FFAA]/5 text-[10px] font-bold text-[#00FFAA] tracking-widest">
                      RESOLVED
                    </span>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF4D4D] shadow-[0_0_8px_#FF4D4D]"></span>
                      <span className="text-xs font-bold text-[#FF4D4D] tracking-wider uppercase">CRITICAL</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm text-gray-300">INC-88908</td>
                  <td className="px-6 py-5 text-sm text-gray-300 font-medium">DDoS attack mitigated on API gateway primary firewall.</td>
                  <td className="px-6 py-5 font-mono text-xs text-gray-500">09:12:33</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00FFAA]/30 bg-[#00FFAA]/5 text-[10px] font-bold text-[#00FFAA] tracking-widest">
                      RESOLVED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
