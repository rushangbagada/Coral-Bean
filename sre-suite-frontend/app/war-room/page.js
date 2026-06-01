'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function WarRoom() {
  const router = useRouter();
  const messagesEndRef = useRef(null);

  // Initial active incident context (simulating an active PagerDuty alert INC-2041 database crisis)
  const initialMessages = [
    {
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      user_name: "sre-bot",
      text: "🚨 *Alert fired in PagerDuty*: `Database connection pool exhaustion on prod-api` (INC-2041) is currently *triggered*. Slack war room initialized."
    },
    {
      timestamp: new Date(Date.now() - 13 * 60000).toISOString(),
      user_name: "SRE Pirate",
      text: "Looking into this. API pod logs show connection pool limits reached (100/100 connections in use). Latencies are spiking."
    },
    {
      timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
      user_name: "Developer Captain",
      text: "Getting reports that checkouts are failing as well. Sentry is logging database pool timeout exceptions. Let me check recent commits."
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  // Real-time telemetry metrics
  const [metrics, setMetrics] = useState({
    cpu: 92,
    dbPool: 100,
    latency: 1850,
    apiErrors: 12.4
  });

  // Checklist tasks
  const [tasks, setTasks] = useState([
    { id: 1, label: 'PagerDuty Alert Fired', completed: true },
    { id: 2, label: 'Identify recurring bottleneck (similarity matching)', completed: false },
    { id: 3, label: 'Execute pool scale config PR', completed: false },
    { id: 4, label: 'Resolve incident alert & compile timeline', completed: false }
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate dynamic telemetry updates to make the page feel completely alive
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const jitter = (Math.random() - 0.5) * 2;
        const resolved = tasks[3].completed;
        
        return {
          cpu: Math.max(10, Math.min(100, Math.round(resolved ? 28 + jitter : 90 + jitter))),
          dbPool: Math.max(0, Math.min(150, Math.round(resolved ? 35 + jitter : 100))),
          latency: Math.max(20, Math.min(3000, Math.round(resolved ? 80 + jitter * 5 : 1800 + jitter * 30))),
          apiErrors: Math.max(0, Math.min(100, parseFloat((resolved ? 0.1 : 12.0 + jitter * 0.2).toFixed(1))))
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [tasks]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      timestamp: new Date().toISOString(),
      user_name: "You (Lead SRE)",
      text: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    try {
      const response = await axios.post('/api/war-room/chat', {
        messages: [...messages, userMsg],
        userMessage: userMsg
      });

      if (response.data && response.data.replies) {
        // Append bots replies
        setMessages(prev => [...prev, ...response.data.replies]);

        // Check if co-pilot warned about similarity
        const hasWarning = response.data.replies.some(r => r.text.includes('SRE Co-Pilot Warning'));
        const hasPR = response.data.replies.some(r => r.text.includes('config update') || r.text.includes('PR'));
        
        if (hasWarning || hasPR) {
          setTasks(prev => prev.map(t => {
            if (t.id === 2 && hasWarning) return { ...t, completed: true };
            if (t.id === 3 && hasPR) return { ...t, completed: true };
            return t;
          }));
        }
      }
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleResolveIncident = async () => {
    setResolving(true);
    try {
      // Simulate PR fix in timeline
      const resolveTime = new Date().toISOString();
      const resolutionMsg = {
        timestamp: resolveTime,
        user_name: "sre-bot",
        text: "✅ *Alert resolved in PagerDuty*: `Database connection pool exhaustion on prod-api` (INC-2041) is now *resolved*."
      };
      
      const updatedMsgs = [...messages, resolutionMsg];
      setMessages(updatedMsgs);

      // Check tasks
      setTasks(prev => prev.map(t => (t.id === 4 ? { ...t, completed: true } : t)));

      // Trigger standard PagerDuty webhook endpoint to auto-draft post-mortem in Supabase/Store
      const webhookPayload = {
        messages: [
          {
            event: "incident.resolve",
            event_type: "incident.resolve",
            data: {
              id: "INC-2041",
              title: "Database connection pool exhaustion on prod-api",
              created_at: initialMessages[0].timestamp,
              resolved_at: resolveTime
            }
          }
        ]
      };

      console.log('Sending resolution webhook to Next.js API...');
      await axios.post('/api/webhooks/pagerduty', webhookPayload);

      // Give visual feedback and redirect SRE to editor page
      setTimeout(() => {
        router.push('/postmortem/INC-2041');
      }, 1500);

    } catch (err) {
      console.error('❌ Failed to resolve incident:', err);
      setResolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-gray-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span className="animate-pulse inline-block h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <span>SRE War Room: INC-2041</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Active real-time telemetry correlation, automated embedding checks, and blameless collaboration.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResolveIncident}
            disabled={resolving}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-400 hover:to-green-500 transition-all duration-200 disabled:opacity-50"
          >
            {resolving ? 'Compiling Report...' : '✅ Resolve Incident & Write Post-Mortem'}
          </button>
        </div>
      </div>

      {/* Grid: Chat Room + Sidebar monitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Window (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-[#0D1321]/50 backdrop-blur-md shadow-2xl flex flex-col h-[600px] overflow-hidden">
          
          {/* Header of Chat */}
          <div className="border-b border-gray-800 bg-[#111827]/40 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-200">#incident-triage-gateway</span>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-400">4 active members</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              CRITICAL OUTAGE
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.user_name.startsWith('You');
              const isBot = msg.user_name === 'sre-bot';
              
              let bubbleBg = 'bg-gray-800/20 text-gray-300';
              let nameColor = 'text-cyan-400';
              
              if (isUser) {
                bubbleBg = 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-200';
                nameColor = 'text-cyan-300';
              } else if (isBot) {
                if (msg.text.includes('Warning')) {
                  bubbleBg = 'bg-[#2b2410]/30 border border-amber-500/20 text-amber-300';
                  nameColor = 'text-amber-400';
                } else if (msg.text.includes('resolved')) {
                  bubbleBg = 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300';
                  nameColor = 'text-emerald-400 border';
                } else {
                  bubbleBg = 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200';
                  nameColor = 'text-indigo-400';
                }
              }

              return (
                <div key={index} className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`font-bold ${nameColor}`}>{msg.user_name}</span>
                    <span className="text-gray-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${bubbleBg}`}>
                    <p dangerouslySetInnerHTML={{ 
                      __html: msg.text
                        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code class="bg-[#090D16] px-1 py-0.5 rounded text-rose-400 font-mono text-xs">$1</code>')
                    }} />
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="border-t border-gray-800 bg-[#0B0F19]/50 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type messages... Try asking 'Did we hit a database pool limit before?' or mention 'OOM heap leaks'..."
                className="flex-1 bg-[#090D16] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                disabled={sending || resolving}
              />
              <button
                type="submit"
                disabled={sending || resolving || !inputValue.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Diagnostics & Telemetry (1/3 width) */}
        <div className="space-y-6">
          
          {/* Telemetry Monitors */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-md font-bold text-gray-200 uppercase tracking-wider">Live Telemetry Monitors</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* CPU Load */}
              <div className="border border-gray-800 bg-[#0D1321]/50 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">CPU Utilization</span>
                <span className={`text-2xl font-black mt-2 ${metrics.cpu > 85 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {metrics.cpu}%
                </span>
              </div>

              {/* DB Pool Exhaustion */}
              <div className="border border-gray-800 bg-[#0D1321]/50 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">DB Active Pools</span>
                <span className={`text-2xl font-black mt-2 ${metrics.dbPool >= 100 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {metrics.dbPool}/150
                </span>
              </div>

              {/* API Response Latency */}
              <div className="border border-gray-800 bg-[#0D1321]/50 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">p99 Latency</span>
                <span className={`text-2xl font-black mt-2 ${metrics.latency > 1000 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {metrics.latency}ms
                </span>
              </div>

              {/* API Errors */}
              <div className="border border-gray-800 bg-[#0D1321]/50 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Error Rate</span>
                <span className={`text-2xl font-black mt-2 ${metrics.apiErrors > 5.0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {metrics.apiErrors}%
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Action Checklist */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827]/40 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-md font-bold text-gray-200 uppercase tracking-wider">Triage checklist</h2>
            
            <ul className="space-y-3">
              {tasks.map(t => (
                <li key={t.id} className="flex items-center space-x-3 text-sm">
                  <span className={`h-4.5 w-4.5 rounded border flex items-center justify-center text-[10px] ${
                    t.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'border-gray-700 bg-gray-900/30'
                  }`}>
                    {t.completed && '✓'}
                  </span>
                  <span className={t.completed ? 'text-gray-400 line-through' : 'text-gray-200'}>
                    {t.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* SRE Co-Pilot recommendation prompt */}
          <div className="rounded-2xl border border-amber-500/10 bg-[#2b2410]/10 p-5 space-y-2">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
              <span>💡</span>
              <span>Diagnostic Co-Pilot Suggestion</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              If similarity warnings occur, it means your code database contains a past mitigation report for this failure. 
              Ask the chat about the incident root cause to remind the team what configurations resolved it in the past!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
