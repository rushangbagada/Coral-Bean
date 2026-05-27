const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiKey = process.env.GEMINI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isMockMode = process.env.MOCK_MODE === 'true';
const isLiveGemini = !isMockMode && geminiKey && geminiKey !== 'your_gemini_key' && geminiKey.trim() !== '';
const isLiveSupabase = !isMockMode && supabaseUrl && supabaseUrl !== 'your_supabase_project_url' && supabaseKey && supabaseKey !== 'your_anon_key';

let geminiClient = null;
let supabaseClient = null;

if (isLiveGemini) {
  geminiClient = new GoogleGenerativeAI(geminiKey);
  console.log('🤖 [Embedding Service] Active Gemini AI client initialized inside Next.js.');
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

  if (isLiveGemini) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-embedding-001' });
      const response = await model.embedContent(text.replace(/\n/g, ' '));
      let embedding = response.embedding.values;
      
      // Pad or truncate to 1536 dimensions for 100% pgvector database compatibility
      if (embedding.length < 1536) {
        const padded = new Array(1536).fill(0);
        for (let i = 0; i < embedding.length; i++) {
          padded[i] = embedding[i];
        }
        embedding = padded;
      } else if (embedding.length > 1536) {
        embedding = embedding.slice(0, 1536);
        // We must re-normalize the vector after slicing so cosine similarity works correctly
        let magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
          embedding = embedding.map(val => val / magnitude);
        }
      }
      return embedding;
    } catch (err) {
      console.warn('⚠️ [Embedding Service] Gemini embedding API failed. Falling back to Mock Vector:', err.message);
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
      console.warn('⚠️ [Embedding Service] Supabase store failed. Saving to In-Memory backup. Error details:', err.message || err);
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
      console.warn('⚠️ [Embedding Service] Supabase similarity query failed. Using In-Memory fallback search. Error details:', err.message || err);
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
