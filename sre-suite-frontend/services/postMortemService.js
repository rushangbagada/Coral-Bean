const { OpenAI } = require('openai');
const embeddingService = require('./embeddingService');

const openAiKey = process.env.OPENAI_API_KEY;
const isLiveOpenAi = openAiKey && openAiKey !== 'your_key' && openAiKey.trim() !== '';

let openaiClient = null;
if (isLiveOpenAi) {
  openaiClient = new OpenAI({ apiKey: openAiKey });
  console.log('🤖 [Post-Mortem Service] Active OpenAI client initialized inside Next.js.');
}

const inMemoryPostMortems = [];

let postMortemsGeneratedCount = 0;
let postMortemsApprovedCount = 0;

function buildTimeline(slackMessages = [], deployments = [], alerts = []) {
  const merged = [];

  slackMessages.forEach(msg => {
    merged.push({
      ...msg,
      timestamp: msg.timestamp || msg.created_at,
      source: 'slack'
    });
  });

  deployments.forEach(dep => {
    merged.push({
      ...dep,
      timestamp: dep.timestamp || dep.created_at,
      source: 'github'
    });
  });

  alerts.forEach(alt => {
    merged.push({
      ...alt,
      timestamp: alt.timestamp || alt.created_at,
      source: 'pagerduty'
    });
  });

  merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return merged;
}

async function generatePostMortem(consolidatedTimeline, incidentMeta = {}) {
  postMortemsGeneratedCount++;

  const systemPrompt = `You are an expert Site Reliability Engineer writing an internal post-mortem. Your tone is objective, factual, and blameless. You receive a structured JSON timeline from Slack, deployments, and alerts.

Generate a complete post-mortem in this exact structure:

# Post-Mortem: [Incident Title]

## 1. Executive Summary
2-3 sentences: what broke, duration, business impact.

## 2. Root Cause Analysis (5 Whys)
Numbered chain of Why questions drilling to root cause.

## 3. Detailed Timeline
Markdown table — columns: Timestamp | Event | Source | Owner

## 4. Resolution
What fixed it and who did it.

## 5. Action Items
Markdown table — columns: Action | Owner | Priority | Due Date
Priority values: P0, P1, or P2 only.

Be concise. Do not invent facts not in the timeline. If data is missing, note it explicitly.`;

  const userMessage = `Incident data:\n\n${JSON.stringify(consolidatedTimeline, null, 2)}\n\nMetadata: ${JSON.stringify(incidentMeta)}`;

  if (isLiveOpenAi) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (err) {
      console.warn('⚠️ [Post-Mortem Service] OpenAI API chat completion failed inside Next.js. Falling back to Mock.');
    }
  }

  const title = incidentMeta.title || 'DB connection pool exhaustion';
  const duration = incidentMeta.duration || '90 minutes';
  const severity = incidentMeta.severity || 'P1';

  let timelineTable = `| Timestamp | Event | Source | Owner |\n| --- | --- | --- | --- |\n`;
  if (consolidatedTimeline && consolidatedTimeline.length > 0) {
    consolidatedTimeline.forEach(ev => {
      const time = ev.timestamp || new Date().toISOString();
      const text = ev.text || ev.message || ev.name || 'SRE Event trigger';
      const source = ev.source || 'system';
      const owner = ev.user || ev.author || 'system';
      timelineTable += `| ${time} | ${text} | ${source} | ${owner} |\n`;
    });
  } else {
    timelineTable += `| ${new Date().toISOString()} | Mock event logged | system | system |\n`;
  }

  const mockMarkdown = `# Post-Mortem: ${title}

## 1. Executive Summary
On ${new Date().toLocaleDateString()}, the system experienced a ${severity} outage affecting our primary services due to database connection limits. The incident persisted for ${duration}, causing substantial degradation in API latencies. Normal operations were successfully restored after deploying configuration fixes.

## 2. Root Cause Analysis (5 Whys)
1. Why were API services returning 500 errors? Because the gateway database connection pool timed out waiting for idle connections.
2. Why did the database pool time out? Because active connections reached the maximum hard limit of 100.
3. Why did connection levels peak? Because a thundering herd on backend APIs exhausted database worker allocations.
4. Why was the thundering herd triggered? Because the preceding deployment did not include appropriate query pagination.
5. Why was query pagination missing? Because the feature branch did not run full database load benchmarks before code merge.

## 3. Detailed Timeline
${timelineTable}

## 4. Resolution
The incident was mitigated by Developer Captain rolling back the deployment v2.3.1 to stabilize gateway resource allocations, followed by SRE Pirate scaling Postgres pool connections from 100 to 150.

## 5. Action Items
| Action | Owner | Priority | Due Date |
| --- | --- | --- | --- |
| Conduct database pool load benchmarking in staging | SRE Pirate | P0 | 2026-06-05 |
| Integrate connection pooling alert warning at 80% | SRE Pirate | P1 | 2026-06-08 |
| Re-introduce feature branch with query pagination fixes | Developer Captain | P1 | 2026-06-12 |
`;

  return mockMarkdown;
}

async function savePostMortem(incidentId, markdown, approvedBy = 'system') {
  const rowData = {
    incident_id: incidentId,
    markdown,
    approved_by: approvedBy,
    created_at: new Date().toISOString()
  };

  postMortemsApprovedCount++;

  if (embeddingService.isLiveSupabase) {
    try {
      const { error } = await embeddingService.supabaseClient
        .from('post_mortems')
        .upsert(rowData, { onConflict: 'incident_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('⚠️ [Post-Mortem Service] Supabase save failed. Saving to In-Memory backup.');
    }
  }

  const existingIdx = inMemoryPostMortems.findIndex(item => item.incident_id === incidentId);
  if (existingIdx !== -1) {
    inMemoryPostMortems[existingIdx] = rowData;
  } else {
    inMemoryPostMortems.push(rowData);
  }
  return true;
}

async function listPostMortems() {
  if (embeddingService.isLiveSupabase) {
    try {
      const { data, error } = await embeddingService.supabaseClient
        .from('post_mortems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('⚠️ [Post-Mortem Service] Supabase list failed. Using In-Memory list.');
    }
  }

  return [...inMemoryPostMortems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getPostMortem(incidentId) {
  if (embeddingService.isLiveSupabase) {
    try {
      const { data, error } = await embeddingService.supabaseClient
        .from('post_mortems')
        .select('*')
        .eq('incident_id', incidentId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('⚠️ [Post-Mortem Service] Supabase fetch failed. Using In-Memory query.');
    }
  }

  return inMemoryPostMortems.find(item => item.incident_id === incidentId) || null;
}

async function getStatsCounts() {
  let approved = 0;
  if (embeddingService.isLiveSupabase) {
    try {
      const { count, error } = await embeddingService.supabaseClient
        .from('post_mortems')
        .select('*', { count: 'exact', head: true });
      if (!error) {
        approved = count || 0;
      }
    } catch (err) {
      // ignore
    }
  }

  if (approved === 0) {
    approved = inMemoryPostMortems.length;
  }

  return {
    postMortemsGenerated: postMortemsGeneratedCount,
    postMortemsApproved: approved
  };
}

module.exports = {
  buildTimeline,
  generatePostMortem,
  savePostMortem,
  listPostMortems,
  getPostMortem,
  getStatsCounts
};
