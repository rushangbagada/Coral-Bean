const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const openAiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const isLiveOpenAi = openAiKey && openAiKey !== 'your_key' && openAiKey.trim() !== '';
const isLiveSupabase = supabaseUrl && supabaseUrl !== 'your_supabase_project_url' && supabaseKey && supabaseKey !== 'your_anon_key';

let openaiClient = null;
let supabaseClient = null;

if (isLiveOpenAi) {
  openaiClient = new OpenAI({ apiKey: openAiKey });
  console.log('🤖 [Embedding Service] Active OpenAI client initialized inside Next.js.');
} else {
  console.log('💡 [Embedding Service] Using Offline Mock Embedding Generator inside Next.js.');
}

if (isLiveSupabase) {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log('📦 [Embedding Service] Active Supabase client initialized inside Next.js.');
} else {
  console.log('💡 [Embedding Service] Using Offline In-Memory Vector Store inside Next.js.');
}

// In-Memory Store Simulator (for Offline Mock Mode)
const inMemoryIncidentStore = [];

function generateMockVector(text) {
  const normalized = text.toLowerCase();
  const vector = new Array(1536).fill(0);
  
  let sum = 0;
  for (let i = 0; i < Math.min(text.length, 100); i++) {
    sum += text.charCodeAt(i);
  }
  
  for (let i = 0; i < 1536; i++) {
    vector[i] = Math.sin(sum + i) * 0.01;
  }

  const categories = {
    database: ['db', 'database', 'postgres', 'pool', 'connection', 'timeout', 'exhausted'],
    cache: ['redis', 'cache', 'miss', 'eviction', 'storm', 'herd'],
    memory: ['memory', 'leak', 'heap', 'oom', 'unbounded', 'bloat']
  };

  let matched = false;
  if (categories.database.some(kw => normalized.includes(kw))) {
    vector[10] = 0.7;
    vector[20] = 0.5;
    matched = true;
  }
  if (categories.cache.some(kw => normalized.includes(kw))) {
    vector[30] = 0.7;
    vector[40] = 0.5;
    matched = true;
  }
  if (categories.memory.some(kw => normalized.includes(kw))) {
    vector[50] = 0.7;
    vector[60] = 0.5;
    matched = true;
  }

  if (!matched) {
    vector[100] = 0.8;
  }

  let magnitude = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
  return vector.map(val => val / magnitude);
}

function dotProduct(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
}

async function generateEmbedding(text) {
  if (!text || text.trim() === '') {
    return new Array(1536).fill(0);
  }

  if (isLiveOpenAi) {
    try {
      const response = await openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ')
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn('⚠️ [Embedding Service] OpenAI embedding API failed. Falling back to Mock Vector.');
      return generateMockVector(text);
    }
  } else {
    return generateMockVector(text);
  }
}

async function storeEmbedding(incidentId, title, description, embedding, source = 'pagerduty') {
  const rowData = {
    incident_id: incidentId,
    title,
    description,
    embedding,
    source,
    created_at: new Date().toISOString()
  };

  if (isLiveSupabase) {
    try {
      const { error } = await supabaseClient
        .from('incident_embeddings')
        .upsert(rowData, { onConflict: 'incident_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('⚠️ [Embedding Service] Supabase store failed. Saving to In-Memory backup.');
    }
  }

  const existingIdx = inMemoryIncidentStore.findIndex(item => item.incident_id === incidentId);
  if (existingIdx !== -1) {
    inMemoryIncidentStore[existingIdx] = rowData;
  } else {
    inMemoryIncidentStore.push(rowData);
  }
  return true;
}

async function findSimilarIncidents(newEmbedding, threshold = 0.85, limit = 5) {
  if (isLiveSupabase) {
    try {
      const { data, error } = await supabaseClient
        .from('incident_embeddings')
        .select('id, incident_id, title, description, embedding, source, created_at');

      if (error) throw error;

      if (data && data.length > 0) {
        const matches = data.map(row => {
          const emb = typeof row.embedding === 'string' 
            ? JSON.parse(row.embedding)
            : row.embedding;

          const similarity = dotProduct(newEmbedding, emb);
          return {
            ...row,
            similarity
          };
        })
        .filter(row => row.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

        return matches;
      }
    } catch (err) {
      console.warn('⚠️ [Embedding Service] Supabase similarity query failed. Using In-Memory fallback search.');
    }
  }

  return inMemoryIncidentStore.map(row => {
    const similarity = dotProduct(newEmbedding, row.embedding);
    return {
      ...row,
      similarity
    };
  })
  .filter(row => row.similarity >= threshold)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);
}

async function processAndStoreHistoricalIncidents(incidentsArray) {
  console.log(`📥 [Embedding Service] Processing ${incidentsArray.length} historical incidents inside Next.js...`);
  let successCount = 0;

  for (const inc of incidentsArray) {
    try {
      const textToEmbed = `${inc.title || ''} ${inc.description || ''}`;
      const embedding = await generateEmbedding(textToEmbed);
      await storeEmbedding(inc.id, inc.title, inc.description, embedding, inc.source || 'pagerduty');
      successCount++;
    } catch (err) {
      console.error(`❌ [Embedding Service] Failed to index incident ${inc.id}:`, err.message);
    }
  }
  return { success: true, processed: successCount };
}

async function getStats() {
  let count = 0;
  if (isLiveSupabase) {
    try {
      const { count: sbCount, error } = await supabaseClient
        .from('incident_embeddings')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        count = sbCount || 0;
      }
    } catch (err) {
      // ignore
    }
  }

  if (count === 0) {
    count = inMemoryIncidentStore.length;
  }

  return {
    totalIndexed: count
  };
}

module.exports = {
  generateEmbedding,
  storeEmbedding,
  findSimilarIncidents,
  processAndStoreHistoricalIncidents,
  getStats,
  inMemoryIncidentStore,
  supabaseClient,
  isLiveSupabase
};
