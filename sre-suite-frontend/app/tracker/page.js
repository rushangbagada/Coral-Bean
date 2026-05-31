'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function Tracker() {
  const [form, setForm] = useState({ id: '', title: '', description: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState('basic');
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem('sre_plan') || 'basic';
    setPlan(p);

    const fetchActiveIncidents = async () => {
      setLoadingIncidents(true);
      try {
        const res = await axios.get('/api/tracker/incidents');
        if (res.data && res.data.incidents) {
          setActiveIncidents(res.data.incidents);
        }
      } catch (err) {
        console.warn('⚠️ Failed to load active PagerDuty incidents:', err);
      } finally {
        setLoadingIncidents(false);
      }
    };
    fetchActiveIncidents();
  }, []);

  const handleSelectIncident = async (inc) => {
    setForm({
      id: inc.id,
      title: inc.title,
      description: inc.description || ''
    });
    setResults(null);
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/tracker/check-reincarnation', {
        id: inc.id,
        title: inc.title,
        description: inc.description
      });

      if (res.data && res.data.success) {
        setResults(res.data.matches || []);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('❌ Autocheck reincarnation failed:', err);
      setError(err.response?.data?.error || err.message || 'Server connection timed out.');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Incident title is required to compute similarity.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // POST requests forward to Express on 3001 via Next.js proxy rewrite
      const res = await axios.post('/api/tracker/check-reincarnation', {
        id: form.id || undefined,
        title: form.title,
        description: form.description
      });

      if (res.data && res.data.success) {
        setResults(res.data.matches || []);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('❌ Check reincarnation failed:', err);
      setError(err.response?.data?.error || err.message || 'Server connection timed out.');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityBadge = (score) => {
    const percentage = Math.round(score * 100);
    let classes = '';

    if (percentage >= 90) {
      classes = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (percentage >= 70) {
      classes = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else {
      classes = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {percentage}% Match
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Headline */}
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
          <span>🕵️‍♂️</span>
          <span>Incident Reincarnation Tracker</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Detect when &quot;resolved&quot; incidents resurface by matching vector embeddings across PagerDuty and Sentry signatures.
        </p>
      </div>

      {/* Main Grid: Form + Instructions */}
      {plan !== 'premium' && (
        <div className="rounded-2xl border border-amber-500/20 bg-[#2b2410]/30 p-4 text-sm text-amber-300">
          🚀 Upgrade to Premium to enable Supabase persistence and live Coral queries. Go to <a href="/billing" className="text-cyan-400 underline">Billing</a> to upgrade.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left / Center 2 columns: Form */}
        <div className="md:col-span-2 rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-gray-200">Submit New Telemetry</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Incident ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. INC-2041"
                  className="w-full bg-[#0D1321] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Database connection pool limit reached"
                  className="w-full bg-[#0D1321] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Incident Description / Stack Trace
              </label>
              <textarea
                rows={5}
                placeholder="Paste alert metadata, Sentry events, or stack traces here..."
                className="w-full bg-[#0D1321] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Calculating Semantic Similarity...</span>
                </div>
              ) : (
                'Check for Reincarnation'
              )}
            </button>
          </form>
        </div>

        {/* Right 1 column: Active Feed + Instructions */}
        <div className="md:col-span-1 space-y-6">
          {/* Active Incidents Feed */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-md font-bold text-gray-200 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Active PagerDuty Feed</span>
            </h2>
            <p className="text-xs text-gray-400">
              Unresolved alerts compiled via Coral. Click an alert to auto-triage similarity and build the topology graph.
            </p>
            
            {loadingIncidents ? (
              <div className="flex items-center space-x-2 text-xs text-gray-500 py-4">
                <svg className="animate-spin h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Fetching active alerts...</span>
              </div>
            ) : activeIncidents.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No active triggered incidents found.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {activeIncidents.map(inc => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => handleSelectIncident(inc)}
                    className="w-full text-left p-3 rounded-xl border border-gray-800 bg-[#0D1321]/40 hover:border-cyan-500/50 hover:bg-[#0D1321]/80 transition-all duration-200 space-y-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-rose-450 group-hover:text-cyan-400 transition-colors">
                        {inc.id}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {inc.title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      Service: {inc.service}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/10 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-md font-bold text-gray-200">How it works</h2>
            <ul className="space-y-3 text-xs text-gray-400 list-disc list-inside">
              <li>Our AI service embeds the input text into a high-dimensional vector.</li>
              <li>It executes a vector search comparing the incident to historical occurrences.</li>
              <li>A high similarity score indicates a **reincarnation** of an issue that was previously marked resolved.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 animate-shake">
            ⚠️ <strong>Error checking database:</strong> {error}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-200">Reincarnation Analysis Results</h2>
            
            {results.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-[#111827]/10 p-8 text-center space-y-2">
                <p className="text-gray-400 font-bold text-lg">No reincarnations found</p>
                <p className="text-gray-500 text-sm">
                  The similarity confidence did not exceed our threshold of 85%. This appears to be a unique incident.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {results.map((match, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-[#111827]/30 p-6 backdrop-blur-md shadow-xl hover:border-gray-700 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-cyan-400 text-lg">
                          {match.incident_id}
                        </span>
                        {getSimilarityBadge(match.similarity)}
                      </div>
                      <h3 className="text-white font-bold text-lg">{match.title}</h3>
                      <p className="text-gray-400 text-sm max-w-2xl line-clamp-2">
                        {match.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="w-full md:w-auto">
                      <Link
                        href={`/tracker/${match.incident_id}`}
                        className="w-full inline-flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 rounded-xl border border-indigo-400/20 shadow-md hover:from-indigo-400 hover:to-purple-500 transition-all duration-200"
                      >
                        View Graph →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
