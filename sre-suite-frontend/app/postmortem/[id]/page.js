'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import dynamic from 'next/dynamic';

// Import MDEditor dynamically with SSR disabled to prevent server compilation crash
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';

export default function PostMortemEditor() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id;

  const [markdown, setMarkdown] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  const [exportingGitHub, setExportingGitHub] = useState(false);
  const [exportingConfluence, setExportingConfluence] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportUrl, setExportUrl] = useState('');

  const handleExportGitHub = async () => {
    setExportingGitHub(true);
    setExportMessage('');
    setExportUrl('');
    try {
      const res = await axios.post('/api/postmortem/export/github', { incidentId, markdown });
      if (res.data && res.data.success) {
        setExportMessage(res.data.message);
        setExportUrl(res.data.url);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'GitHub export failed');
    } finally {
      setExportingGitHub(false);
    }
  };

  const handleExportConfluence = async () => {
    setExportingConfluence(true);
    setExportMessage('');
    setExportUrl('');
    try {
      const res = await axios.post('/api/postmortem/export/confluence', { incidentId, markdown });
      if (res.data && res.data.success) {
        setExportMessage(res.data.message);
        setExportUrl(res.data.url);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Confluence export failed');
    } finally {
      setExportingConfluence(false);
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `POSTMORTEM-${incidentId}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportMessage('Downloaded markdown report file successfully.');
    } catch (err) {
      setError('Failed to download markdown: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchPostMortem = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/postmortem/${incidentId}`);
        if (res.data && res.data.post_mortem) {
          setMarkdown(res.data.post_mortem.markdown);
          setApprovedBy(res.data.post_mortem.approved_by || '');
        } else {
          throw new Error('Post-mortem not found');
        }
      } catch (err) {
        // Zero-Touch Auto-Drafting on Workspace Load:
        console.log(`💡 Post-mortem not found for ${incidentId}. Triggering auto-drafting pipeline in the background...`);
        try {
          const timelineRes = await axios.get(`/api/postmortem/incident/${incidentId}/timeline`);
          const timeline = timelineRes.data.timeline || [];
          const incident = timelineRes.data.incident || {};

          const slackMessages = timeline.filter(t => t.source === 'slack').map(t => ({
            timestamp: t.timestamp,
            user: t.title,
            text: t.description
          }));

          const deployments = timeline.filter(t => t.source === 'github').map(t => ({
            timestamp: t.timestamp,
            commit_hash: t.meta?.sha || 'system',
            message: t.description
          }));

          const alerts = timeline.filter(t => t.source === 'pagerduty').map(t => ({
            timestamp: t.timestamp,
            name: t.title,
            severity: t.details || 'critical'
          }));

          const genRes = await axios.post('/api/postmortem/generate', {
            incidentId,
            slackMessages,
            deployments,
            alerts,
            incidentMeta: {
              title: incident.title || 'Auto-Generated Incident',
              severity: 'P1',
              duration: incident.resolved_at 
                ? `${Math.round((new Date(incident.resolved_at) - new Date(incident.created_at)) / 60000)} minutes`
                : '90 minutes'
            }
          });

          if (genRes.data && genRes.data.markdown) {
            setMarkdown(genRes.data.markdown);
            console.log('✅ Auto-draft compiled successfully.');
          } else {
            throw new Error('Failed to generate automatic report');
          }
        } catch (genErr) {
          console.error('❌ Zero-touch auto-draft failed:', genErr);
          setError('Incident report could not be found, and automatic drafting failed: ' + (genErr.response?.data?.message || genErr.message));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPostMortem();
  }, [incidentId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!approvedBy.trim()) {
      setError('Please provide an SRE Approver Name to save.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await axios.post('/api/postmortem/save', {
        incidentId,
        markdown,
        approvedBy
      });

      if (res.data && res.data.success) {
        setSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Unified Parallel Auto-Publish on Approval:
        setExportMessage('Approved! Automatically publishing post-mortem artifact to GitHub and Confluence in the background...');
        
        Promise.allSettled([
          axios.post('/api/postmortem/export/github', { incidentId, markdown }),
          axios.post('/api/postmortem/export/confluence', { incidentId, markdown })
        ]).then(results => {
          const ghResult = results[0];
          const confResult = results[1];

          let successMsg = '✅ Post-mortem saved & approved. ';
          let ghUrl = '';

          if (ghResult.status === 'fulfilled' && ghResult.value.data.success) {
            successMsg += '🐙 GitHub PR created. ';
            ghUrl = ghResult.value.data.url;
          }
          if (confResult.status === 'fulfilled' && confResult.value.data.success) {
            successMsg += '🏢 Published to Confluence space.';
          }

          setExportMessage(successMsg);
          if (ghUrl) setExportUrl(ghUrl);
        });
      } else {
        throw new Error('Save response indicated failure');
      }
    } catch (err) {
      console.error('❌ Failed to save post-mortem:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save post-mortem draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    setSaved(false);

    try {
      console.log('🔄 Fetching cross-source SRE timelines to regenerate...');
      // 1. Fetch live consolidated timeline from Express
      const timelineRes = await axios.get(`/api/postmortem/incident/${incidentId}/timeline`);
      
      const timeline = timelineRes.data.timeline || [];
      const incident = timelineRes.data.incident || {};

      // 2. Separate consolidated timeline back into respective arrays for the generator
      const slackMessages = timeline.filter(t => t.source === 'slack').map(t => ({
        timestamp: t.timestamp,
        user: t.title,
        text: t.description
      }));

      const deployments = timeline.filter(t => t.source === 'github').map(t => ({
        timestamp: t.timestamp,
        commit_hash: t.meta?.sha || 'system',
        message: t.description
      }));

      const alerts = timeline.filter(t => t.source === 'pagerduty').map(t => ({
        timestamp: t.timestamp,
        name: t.title,
        severity: t.details || 'critical'
      }));

      // 3. Post to AI generate endpoint
      console.log('🤖 Invoking GPT blameless drafting engine...');
      const genRes = await axios.post('/api/postmortem/generate', {
        incidentId,
        slackMessages,
        deployments,
        alerts,
        incidentMeta: {
          title: incident.title || 'Auto-Regenerated Incident',
          severity: 'P1',
          duration: incident.resolved_at 
            ? `${Math.round((new Date(incident.resolved_at) - new Date(incident.created_at)) / 60000)} minutes`
            : '90 minutes'
        }
      });

      if (genRes.data && genRes.data.markdown) {
        setMarkdown(genRes.data.markdown);
        console.log('✅ Post-mortem successfully regenerated.');
      } else {
        throw new Error('Regeneration response missing markdown');
      }
    } catch (err) {
      console.error('❌ Failed to regenerate post-mortem:', err);
      setError(err.response?.data?.error || err.message || 'Failed to compile timeline and generate draft.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header links */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <Link
            href="/postmortem"
            className="text-gray-400 hover:text-white transition-colors text-sm font-semibold"
          >
            ← All Post-Mortems
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
            Incident Workspace: <span className="font-mono text-cyan-400">{incidentId}</span>
          </h1>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            className="inline-flex items-center justify-center rounded-xl bg-gray-850 hover:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white border border-gray-700 shadow-md transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Drafting AI Report...</span>
              </div>
            ) : (
              '🔄 Regenerate Draft'
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          ⚠️ <strong>Error:</strong> {error}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          ✅ <strong>Success!</strong> Post-Mortem incident report saved and approved successfully.
        </div>
      )}

      {loading ? (
        <div className="h-96 w-full flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading markdown editor workspace...</p>
        </div>
      ) : error && markdown === '' ? (
        <div className="rounded-2xl border border-gray-800 bg-[#111827]/10 p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-gray-300">Incident Report Not Found</h2>
          <p className="text-gray-500 text-sm">
            We could not find an indexed post-mortem report for <span className="font-mono text-cyan-400 font-bold">{incidentId}</span>.
          </p>
          <Link
            href="/postmortem"
            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors text-white"
          >
            Back to Post-Mortems
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Markdown Split Editor */}
          <div className="rounded-2xl border border-gray-800 bg-[#0D1321] overflow-hidden shadow-2xl p-2" data-color-mode="dark">
            <MDEditor
              value={markdown}
              onChange={setMarkdown}
              height={500}
              preview="live"
              className="bg-[#0B0F19]"
            />
          </div>

          {/* Export Pipeline Section */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/20 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-md font-bold text-gray-200 flex items-center space-x-2">
              <span>🚀</span>
              <span>Incident Artifact Export Pipeline</span>
            </h3>
            <p className="text-xs text-gray-400">
              Publish this blameless report to corporate knowledge-bases or link it directly in your version control workflows.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleDownloadMarkdown}
                disabled={!markdown}
                className="inline-flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2.5 text-xs font-semibold text-white shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                📥 Download Markdown
              </button>

              <button
                onClick={handleExportGitHub}
                disabled={exportingGitHub || !markdown}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {exportingGitHub ? 'Pushing Branch...' : '🐙 Create GitHub PR'}
              </button>

              <button
                onClick={handleExportConfluence}
                disabled={exportingConfluence || !markdown}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {exportingConfluence ? 'Uploading Wiki...' : '🏢 Publish to Confluence'}
              </button>
            </div>

            {exportMessage && (
              <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4 mt-3 text-xs text-cyan-400 animate-in fade-in duration-300">
                <p className="font-semibold">{exportMessage}</p>
                {exportUrl && (
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center underline mt-1.5 font-mono text-cyan-300 hover:text-cyan-200"
                  >
                    🔗 Link to Created Resource
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Approver Submission Footer */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div className="w-full md:w-96">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                SRE Approver Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alice Lead SRE"
                className="w-full bg-[#0D1321] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
              />
            </div>

            <div className="w-full md:w-auto">
              <button
                onClick={handleSave}
                disabled={saving || !markdown}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-400 hover:to-green-500 transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Committing to Database...</span>
                  </div>
                ) : (
                  '✅ Approve & Save Post-Mortem'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
