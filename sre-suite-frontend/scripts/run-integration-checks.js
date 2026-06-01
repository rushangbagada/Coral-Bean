/*
  Quick integration sanity checks that run in MOCK_MODE.
  These do not require a running Next.js server and validate core services work.
*/

process.env.MOCK_MODE = 'true';

const embeddingService = require('../services/embeddingService');
const postMortemService = require('../services/postMortemService');
const graphService = require('../services/graphService');
const mockData = require('../services/mockData');

async function run() {
  console.log('Starting integration checks (MOCK_MODE=true)');

  // 1. Index historical incidents
  const incidents = mockData.pagerdutyIncidents;
  const idxRes = await embeddingService.processAndStoreHistoricalIncidents(incidents);
  console.log('Indexed incidents count:', idxRes.processed);
  if (!idxRes.processed || idxRes.processed === 0) throw new Error('Indexing failed');

  // 2. Generate embedding for a new incident and find similar
  const sampleText = `${incidents[0].title} ${incidents[0].description}`;
  const emb = await embeddingService.generateEmbedding(sampleText);
  if (!emb || !Array.isArray(emb)) throw new Error('Embedding generation failed');

  const matches = await embeddingService.findSimilarIncidents(emb, 0.5, 3);
  console.log('Similarity matches found:', matches.length);
  if (!matches) throw new Error('Similarity search failed');

  // 3. Build graph for a sample incident
  const graph = await graphService.buildReincarnationGraph(incidents[0].id, matches, incidents[0]);
  console.log('Graph nodes:', graph.nodes.length, 'edges:', graph.edges.length);
  if (!graph || !graph.nodes) throw new Error('Graph generation failed');

  // 4. Generate a post-mortem from mock timeline
  const timeline = postMortemService.buildTimeline(mockData.slackMessages, mockData.githubCommits, [
    { timestamp: incidents[0].created_at, name: 'Incident Triggered', source: 'pagerduty' }
  ]);
  const md = await postMortemService.generatePostMortem(timeline, { title: incidents[0].title, severity: 'P1', duration: '90 minutes' });
  console.log('Generated Post-Mortem length:', md.length);
  if (!md || md.length < 20) throw new Error('Post-mortem generation failed');

  console.log('\nAll integration checks passed.');
}

run().catch(err => {
  console.error('Integration check failed:', err);
  process.exit(1);
});
