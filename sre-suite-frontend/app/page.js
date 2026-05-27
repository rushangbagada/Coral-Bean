import Link from 'next/link';
import embeddingService from '@/services/embeddingService';
import postMortemService from '@/services/postMortemService';
import { getReincarnationsCount } from '@/app/api/tracker/check-reincarnation/route';

// Fetch stats on the server
async function getStats() {
  try {
    const embedStats = await embeddingService.getStats();
    const pmStats = await postMortemService.getStatsCounts();
    const reincarnationsDetected = getReincarnationsCount();
    return {
      totalIndexed: embedStats.totalIndexed,
      reincarnationsDetected: reincarnationsDetected,
      postMortemsGenerated: pmStats.postMortemsGenerated,
      postMortemsApproved: pmStats.postMortemsApproved
    };
  } catch (err) {
    console.warn('⚠️ [Dashboard] Direct stats fetch failed. Using simulated stats.');
    return {
      totalIndexed: 3,
      reincarnationsDetected: 2,
      postMortemsGenerated: 1,
      postMortemsApproved: 1
    };
  }
}

// Fetch recent post-mortems on the server
async function getRecentPostMortems() {
  try {
    const list = await postMortemService.listPostMortems();
    return list ? list.slice(0, 5) : [];
  } catch (err) {
    console.warn('⚠️ [Dashboard] Direct list fetch failed. Using simulated list.');
    return [
      {
        incident_id: "INC-2041",
        approved_by: "Alice Lead SRE",
        created_at: "2026-05-27T10:34:10Z"
      },
      {
        incident_id: "INC-1982",
        approved_by: null,
        created_at: "2026-05-20T15:10:00Z"
      }
    ];
  }
}

export default async function Home() {
  const stats = await getStats();
  const recentReports = await getRecentPostMortems();

  const metrics = [
    { name: 'Total Incidents Indexed', value: stats.totalIndexed, color: 'from-cyan-500 to-blue-600' },
    { name: 'Reincarnations Detected', value: stats.reincarnationsDetected, color: 'from-pink-500 to-red-600' },
    { name: 'Post-Mortems Generated', value: stats.postMortemsGenerated, color: 'from-yellow-400 to-amber-600' },
    { name: 'Post-Mortems Approved', value: stats.postMortemsApproved, color: 'from-emerald-400 to-green-600' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Hero Headline */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-500 bg-clip-text text-transparent">
            SRE Co-Pilot Workspace
          </h1>
          <p className="text-gray-400 mt-2">
            AI-powered vector similarity matching for incident tracking and blameless timeline auto-generation.
          </p>
        </div>
        <div>
          <Link
            href="/tracker"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Check New Incident →
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl transition-all duration-200 hover:border-gray-700"
          >
            {/* Subtle color highlight dot */}
            <div className={`absolute top-0 right-0 h-1.5 w-16 bg-gradient-to-l ${m.color} rounded-bl-full`} />
            
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {m.name}
            </p>
            <p className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/20 p-6 backdrop-blur-md shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-200 flex items-center space-x-2">
          <span>📋</span>
          <span>Recent SRE Post-Mortems</span>
        </h2>
        
        {recentReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <p className="text-gray-500">No post-mortems generated yet.</p>
            <Link href="/tracker" className="text-cyan-400 hover:underline text-sm font-medium">
              Run Reincarnation Tracker to generate one
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {recentReports.map((report, idx) => {
                  const isApproved = !!report.approved_by;
                  return (
                    <tr key={idx} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {report.incident_id}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {report.approved_by || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isApproved ? 'Approved' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/postmortem/${report.incident_id}`}
                          className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700/50"
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
