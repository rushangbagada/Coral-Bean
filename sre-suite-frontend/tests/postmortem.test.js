import { test } from 'node:test';
import assert from 'assert';
import postMortemService from '../services/postMortemService.js';

test('buildTimeline sorts events chronologically', () => {
  const slack = [{ timestamp: '2026-05-27T10:20:00Z', text: 'a' }];
  const commits = [{ timestamp: '2026-05-27T10:18:00Z', message: 'commit' }];
  const alerts = [{ timestamp: '2026-05-27T10:15:00Z', name: 'alert' }];
  const timeline = postMortemService.buildTimeline(slack, commits, alerts);
  assert.strictEqual(timeline[0].source, 'pagerduty');
});

test('generatePostMortem returns markdown string', async () => {
  process.env.MOCK_MODE = 'true';
  const timeline = [
    { timestamp: '2026-05-27T10:15:00Z', source: 'pagerduty', name: 'Incident Triggered' }
  ];
  const md = await postMortemService.generatePostMortem(timeline, { title: 'Test', duration: '10m', severity: 'P1' });
  assert.ok(typeof md === 'string' && md.length > 0, 'markdown generated');
});
