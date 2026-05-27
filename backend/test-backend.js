/**
 * High-Fidelity Integration Test Harness
 * Starts the Express server, executes API calls to all major SRE endpoints,
 * asserts the responses contain the expected structures, and cleans up.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3001;
let serverProcess = null;

// Helper to make HTTP GET requests
function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data
          });
        }
      });
    }).on('error', reject);
  });
}

// Helper to make HTTP POST requests
function httpPost(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting AI SRE Suite Integration Tests...');
  
  // 1. Start Express Server
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: PORT, MOCK_MODE: 'true' }
  });

  serverProcess.stdout.on('data', (data) => {
    // Print server logs with indent
    // console.log(`   [Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`🔴 [Server Error] ${data.toString().trim()}`);
  });

  // Wait for server to bind
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  let failures = 0;

  try {
    // Test 1: Health Check
    console.log('\n--- Test 1: Health Check ---');
    const health = await httpGet('/api/health');
    console.log(`Status: ${health.statusCode}`);
    if (health.statusCode === 200 && health.body.status === 'healthy') {
      console.log('✅ Health Check Passed');
    } else {
      console.log('❌ Health Check Failed', health.body);
      failures++;
    }

    // Test 2: Active Incidents (Tracker)
    console.log('\n--- Test 2: Active Incidents (Tracker) ---');
    const incidents = await httpGet('/api/tracker/incidents');
    console.log(`Status: ${incidents.statusCode}`);
    if (incidents.statusCode === 200 && incidents.body.success && Array.isArray(incidents.body.incidents)) {
      console.log(`✅ Active Incidents Passed (Found: ${incidents.body.count})`);
      if (incidents.body.count > 0) {
        const first = incidents.body.incidents[0];
        console.log(`   Incident: ${first.id} - ${first.title}`);
        console.log(`   Sentry Correlated: ${first.sentry_correlation ? 'Yes (' + first.sentry_correlation.id + ')' : 'No'}`);
      }
    } else {
      console.log('❌ Active Incidents Failed', incidents.body);
      failures++;
    }

    // Test 3: Historical Incidents (Tracker)
    console.log('\n--- Test 3: Historical Incidents (Tracker) ---');
    const historical = await httpGet('/api/tracker/incidents/historical');
    console.log(`Status: ${historical.statusCode}`);
    if (historical.statusCode === 200 && historical.body.success && Array.isArray(historical.body.incidents)) {
      console.log(`✅ Historical Incidents Passed (Found: ${historical.body.count})`);
    } else {
      console.log('❌ Historical Incidents Failed', historical.body);
      failures++;
    }

    // Test 4: Incident Reincarnation/Similarity Matcher (Tracker)
    console.log('\n--- Test 4: Incident Reincarnation Matcher (Tracker) ---');
    const similarityPayload = {
      title: "Database connection pool exhaustion on prod-api",
      description: "Connection limit of 100 reached."
    };
    const similarity = await httpPost('/api/tracker/similarity', similarityPayload);
    console.log(`Status: ${similarity.statusCode}`);
    if (similarity.statusCode === 200 && similarity.body.success && similarity.body.analysis) {
      const analysis = similarity.body.analysis;
      console.log(`✅ Similarity Matcher Passed`);
      console.log(`   Is Reincarnated: ${analysis.is_reincarnated}`);
      console.log(`   Confidence Score: ${analysis.confidence_score}`);
      console.log(`   Matches Count: ${analysis.matches_count}`);
      if (analysis.primary_match) {
        console.log(`   Best Historical Match: ${analysis.primary_match.historical_incident.id} - ${analysis.primary_match.historical_incident.title}`);
        console.log(`   Linked GitHub Fixes: ${analysis.primary_match.linked_fixes.length} commit(s)`);
      }
    } else {
      console.log('❌ Similarity Matcher Failed', similarity.body);
      failures++;
    }

    // Test 5: Incident Timeline Aggregator (Post-Mortem)
    console.log('\n--- Test 5: Incident Timeline Aggregator (Post-Mortem) ---');
    const timeline = await httpGet('/api/postmortem/incident/INC-2041/timeline');
    console.log(`Status: ${timeline.statusCode}`);
    if (timeline.statusCode === 200 && timeline.body.success && Array.isArray(timeline.body.timeline)) {
      console.log(`✅ Timeline Aggregator Passed (Events: ${timeline.body.timeline.length})`);
      console.log(`   Incident Details: ${timeline.body.incident.id} - ${timeline.body.incident.title}`);
      
      const counts = {};
      timeline.body.timeline.forEach(e => {
        counts[e.source] = (counts[e.source] || 0) + 1;
      });
      console.log(`   Event counts: PagerDuty(${counts.pagerduty || 0}), Slack(${counts.slack || 0}), GitHub(${counts.github || 0})`);
    } else {
      console.log('❌ Timeline Aggregator Failed', timeline.body);
      failures++;
    }

  } catch (err) {
    console.error('❌ Exception during integration tests:', err);
    failures++;
  } finally {
    // 5. Cleanup Server
    console.log('\n🧹 Cleaning up test environment...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      console.log('   Server shutdown complete.');
    }

    if (failures === 0) {
      console.log('\n🚀 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Ready for Day 3.');
      process.exit(0);
    } else {
      console.log(`\n❌ Tests finished with ${failures} failure(s).`);
      process.exit(1);
    }
  }
}

runTests();
