'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import dynamic from 'next/dynamic';

// Import ForceGraph2D dynamically to bypass Server-Side Render constraints (window/canvas dependencies)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function TrackerGraph() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id;
  
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Map node types to beautiful custom theme colors
  const nodeColors = {
    current: '#EF4444',     // Vibrant Coral Red
    historical: '#3B82F6',  // Cyber Blue
    pr: '#10B981',          // Emerald Green
    ticket: '#8B5CF6'       // Electric Purple
  };

  useEffect(() => {
    // Handle resizing dynamically
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 600
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 600
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Fetch the graph from Express
    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/tracker/graph/${incidentId}`);
        
        // Map edges to links for react-force-graph compatibility
        const mappedData = {
          nodes: res.data.nodes || [],
          links: (res.data.edges || []).map(edge => ({
            source: edge.source,
            target: edge.target,
            label: edge.label,
            similarity: edge.similarity
          }))
        };
        
        setGraphData(mappedData);

        // Auto-select current node to show info initially
        const current = mappedData.nodes.find(n => n.type === 'current');
        if (current) {
          setSelectedNode(current);
        }
      } catch (err) {
        console.error('❌ Failed to fetch graph:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load reincarnation graph.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();

    return () => window.removeEventListener('resize', handleResize);
  }, [incidentId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/tracker"
              className="text-gray-400 hover:text-white transition-colors text-sm font-semibold"
            >
              ← All Incidents
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Reincarnation Topology: <span className="font-mono text-cyan-400">{incidentId}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Visualizing dependency links, recurring failures, fixing PRs, and Linear remediation tickets.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-4">
          <p className="text-rose-400 text-lg font-bold">⚠️ Graph Render Failed</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <Link
            href="/tracker"
            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors text-white"
          >
            Back to Tracker
          </Link>
        </div>
      )}

      {loading && (
        <div className="h-[600px] w-full rounded-2xl border border-gray-800 bg-[#070B13] flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-sm">Compiling network graph nodes...</p>
        </div>
      )}

      {graphData && !error && !loading && (
        <div ref={containerRef} className="relative w-full h-[600px] rounded-2xl border border-gray-800 bg-[#070B13] overflow-hidden shadow-2xl">
          
          {/* Legend indicator */}
          <div className="absolute top-4 left-4 z-10 bg-[#0B0F19]/90 border border-gray-800 p-4 rounded-xl backdrop-blur-md space-y-2 text-xs">
            <p className="font-bold text-gray-300 uppercase tracking-wider mb-2">Legend</p>
            {Object.keys(nodeColors).map(type => (
              <div key={type} className="flex items-center space-x-2.5">
                <span className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: nodeColors[type] }} />
                <span className="text-gray-400 font-medium capitalize">{type === 'pr' ? 'Fix PR' : type}</span>
              </div>
            ))}
          </div>

          {/* Interactive Force Graph */}
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeColor={node => nodeColors[node.type] || '#FFFFFF'}
            nodeVal={node => node.type === 'current' ? 9 : node.type === 'historical' ? 7 : 5}
            nodeLabel={node => `${node.label} (${node.type.toUpperCase()})`}
            linkWidth={1.5}
            linkColor={() => '#2E3B52'}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.006}
            onNodeClick={(node) => setSelectedNode(node)}
            cooldownTicks={100}
          />

          {/* Sliding Side-Drawer panel on node click */}
          {selectedNode && (
            <div className="absolute top-0 right-0 h-full w-80 bg-[#111827]/90 border-l border-gray-800 p-6 shadow-2xl overflow-y-auto backdrop-blur-md flex flex-col justify-between animate-in slide-in-from-right duration-300">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        color: nodeColors[selectedNode.type],
                        borderColor: `${nodeColors[selectedNode.type]}20`,
                        backgroundColor: `${nodeColors[selectedNode.type]}10`
                      }}
                    >
                      {selectedNode.type}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2 leading-snug">
                      {selectedNode.id}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-4 border-t border-gray-800 pt-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Name / Label
                    </label>
                    <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                      {selectedNode.label}
                    </p>
                  </div>

                  {selectedNode.metadata && (
                    <div className="space-y-4">
                      {selectedNode.metadata.description && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Description
                          </label>
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                            {selectedNode.metadata.description}
                          </p>
                        </div>
                      )}

                      {selectedNode.metadata.html_url && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            GitHub URL
                          </label>
                          <a
                            href={selectedNode.metadata.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-cyan-400 hover:underline mt-1 break-all"
                          >
                            🔗 {selectedNode.metadata.html_url}
                          </a>
                        </div>
                      )}

                      {selectedNode.metadata.created_at && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Detected At
                          </label>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(selectedNode.metadata.created_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Node-specific action button */}
              {selectedNode.type === 'historical' && (
                <div className="border-t border-gray-800 pt-4">
                  <Link
                    href={`/postmortem/${selectedNode.id}`}
                    className="w-full inline-flex items-center justify-center text-center text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 rounded-xl border border-cyan-400/20 shadow-md hover:from-cyan-400 hover:to-indigo-500 transition-colors"
                  >
                    View Post-Mortem →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
