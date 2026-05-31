/*
  Seed historical incidents into the embedding store (uses services directly).
  This runs in MOCK_MODE by default unless you set SUPABASE vars and GEMINI/OPENAI keys.
*/

// Load environment variables from .env.local manually if it exists to enable live seeding in local Node.js environment
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const match = trimmedLine.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

process.env.MOCK_MODE = process.env.MOCK_MODE || 'true';
const embeddingService = require('../services/embeddingService');
const mockData = require('../services/mockData');

async function seed() {
  const incidents = mockData.pagerdutyIncidents;
  console.log('Seeding', incidents.length, 'incidents...');
  const res = await embeddingService.processAndStoreHistoricalIncidents(incidents);
  console.log('Seeded:', res.processed);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
