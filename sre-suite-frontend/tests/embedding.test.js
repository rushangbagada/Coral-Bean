import { test } from 'node:test';
import assert from 'assert';
import embeddingService from '../services/embeddingService.js';

test('generateEmbedding returns 1536-d vector in mock mode', async () => {
  process.env.MOCK_MODE = 'true';
  const emb = await embeddingService.generateEmbedding('Database connection pool exhausted');
  assert.ok(Array.isArray(emb), 'embedding is array');
  assert.strictEqual(emb.length, 1536, 'embedding length 1536');
});

test('processAndStoreHistoricalIncidents stores items', async () => {
  process.env.MOCK_MODE = 'true';
  const mock = [
    { id: 'T-1', title: 'Test incident', description: 'desc' },
    { id: 'T-2', title: 'Another incident', description: 'desc2' }
  ];
  const res = await embeddingService.processAndStoreHistoricalIncidents(mock);
  assert.strictEqual(res.processed, 2, 'processed two incidents');
});
