/**
 * Next.js API Route Handler Integration Test Harness
 * Starts the Next.js server on port 3000, executes API Route Handler calls,
 * asserts the responses contain the expected structures, and cleans up.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3000;
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

async function main() {
  console.log('🏁 Launching SRE Suite Next.js API Test Harness...');

  // Start Next.js Development Server on port 3000
  // Cwd is sre-suite-frontend folder
  serverProcess = spawn('npx', ['next', 'dev', '-p', PORT], {
    cwd: __dirname,
    env: { ...process.env, PORT: PORT, MOCK_MODE: 'true' },
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    // Print server logs with indent
    // console.log(`[Next.js] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`🔴 [Next.js Error] ${data.toString().trim()}`);
  });

  // Wait for Next.js to start and compile pages
  console.log('⌛ Waiting for Next.js API server to bind (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('\n📝 RUNNING ALL SRE BACKEND ENDPOINTS IN NEXT.JS ROUTE HANDLERS...');

    // 1. Index 5 Historical Incidents
    console.log('\n--- 1. Indexing Historical Incidents ---');
    const indexPayload = {
      incidents: [
        { id: "INC001", title: "DB connection pool exhausted", description: "All database connections timed out under load" },
        { id: "INC002", title: "Redis cache miss storm", description: "Cache eviction caused thundering herd on origin" },
        { id: "INC003", title: "Memory leak in payment service", description: "Heap grew unbounded during high transaction volume" },
        { id: "INC004", title: "Checkout API service degradation", description: "Payment processing delay exceeded 15 seconds" },
        { id: "INC005", title: "Gateway gateway timeout HTTP 504", description: "Ingress controller timed out waiting for microservice worker" }
      ]
    };
    const indexRes = await httpPost('/api/tracker/index-historical', indexPayload);
    console.log(`Status: ${indexRes.statusCode}`, JSON.stringify(indexRes.body));
    if (indexRes.statusCode !== 200 || !indexRes.body.success) {
      throw new Error('Index historical incidents failed.');
    }
    console.log('✅ Indexing successfully completed');

    // 2. Check Reincarnation (Similarity >= 0.85)
    console.log('\n--- 2. Checking Reincarnation Cosine Similarity ---');
    const checkPayload = {
      id: "INC999",
      title: "Database pool timeout again",
      description: "Database connections exhausted causing service degradation"
    };
    const checkRes = await httpPost('/api/tracker/check-reincarnation', checkPayload);
    console.log(`Status: ${checkRes.statusCode}`, JSON.stringify(checkRes.body, null, 2));
    if (checkRes.statusCode !== 200 || !checkRes.body.success) {
      throw new Error('Check reincarnation failed');
    }

    const bestMatch = checkRes.body.matches[0];
    if (!bestMatch || bestMatch.similarity < 0.85 || bestMatch.incident_id !== 'INC001') {
      throw new Error(`Best similarity match did not satisfy constraints: ${JSON.stringify(bestMatch)}`);
    }
    console.log(`✅ Verified similarity match is correct: INC001 matching ${bestMatch.similarity}`);

    // 3. Reincarnation Network Graph
    console.log('\n--- 3. Retrieving Reincarnation network graph ---');
    const graphRes = await httpGet('/api/tracker/graph/INC999');
    console.log(`Status: ${graphRes.statusCode}`);
    if (graphRes.statusCode !== 200 || !Array.isArray(graphRes.body.nodes) || !Array.isArray(graphRes.body.edges)) {
      throw new Error('Graph compilation failed');
    }
    console.log(`✅ Checked and verified nodes (${graphRes.body.nodes.length}) and edges (${graphRes.body.edges.length}) exist in graph`);

    // 4. Post-Mortem Timeline & LLM drafting
    console.log('\n--- 4. Auto-Drafting Blameless Post-Mortem Report ---');
    const generatePayload = {
      incidentId: "INC999",
      incidentMeta: { title: "DB pool timeout", severity: "P1", duration: "90 minutes" },
      slackMessages: [
        { timestamp: "2024-01-15T10:00:00Z", user: "alice", text: "seeing db connection errors in prod" },
        { timestamp: "2024-01-15T11:30:00Z", user: "alice", text: "incident resolved" }
      ],
      deployments: [
        { timestamp: "2024-01-15T09:45:00Z", commit_hash: "a1b2c3d", message: "feat: increase default pool size" }
      ],
      alerts: [
        { timestamp: "2024-01-15T10:02:00Z", name: "DB Connection Pool > 95%", severity: "critical" }
      ]
    };
    const generateRes = await httpPost('/api/postmortem/generate', generatePayload);
    console.log(`Status: ${generateRes.statusCode}`);
    if (generateRes.statusCode !== 200 || !generateRes.body.success) {
      throw new Error('Markdown report generation failed');
    }

    const markdown = generateRes.body.markdown;
    const requiredHeaders = ["Executive Summary", "Root Cause Analysis", "Detailed Timeline", "Resolution", "Action Items"];
    requiredHeaders.forEach(hdr => {
      if (!markdown.includes(hdr)) throw new Error(`Generated markdown missing header: "${hdr}"`);
    });
    console.log('✅ Verified markdown matches SRE structures and contains all 5 required headers');

    // 5. Save Post-Mortem draft
    console.log('\n--- 5. Saving post-mortem draft to database ---');
    const savePayload = { incidentId: "INC999", markdown: markdown, approvedBy: "Lead Captain" };
    const saveRes = await httpPost('/api/postmortem/save', savePayload);
    console.log(`Status: ${saveRes.statusCode}`, JSON.stringify(saveRes.body));
    if (saveRes.statusCode !== 200 || !saveRes.body.success) {
      throw new Error('Saving post-mortem failed');
    }
    console.log('✅ Post-mortem saved successfully');

    // 6. Pull Post-Mortem by ID
    console.log('\n--- 6. Retrieving saved post-mortem by ID ---');
    const fetchRes = await httpGet('/api/postmortem/INC999');
    console.log(`Status: ${fetchRes.statusCode}`);
    if (fetchRes.statusCode !== 200 || fetchRes.body.post_mortem.markdown !== markdown) {
      throw new Error('Retrieved post-mortem markdown mismatch');
    }
    console.log('✅ Retreived post-mortem matches saved content perfectly');

    // 7. Verify Webhook Resolver
    console.log('\n--- 7. Dispatching PagerDuty Webhook Resolve Trigger ---');
    const webhookPayload = {
      messages: [{
        event: "incident.resolve",
        data: { id: "PWBTEST1", title: "Webhook test incident", created_at: "2024-01-15T10:00:00Z", resolved_at: "2024-01-15T11:30:00Z" }
      }]
    };
    const webhookRes = await httpPost('/api/webhooks/pagerduty', webhookPayload);
    console.log(`Status: ${webhookRes.statusCode}`, JSON.stringify(webhookRes.body));
    if (webhookRes.statusCode !== 200 || webhookRes.body.status !== 'draft_created') {
      throw new Error('Webhook processing failed');
    }
    console.log('✅ Webhook successfully drafted and committed to DB');

    // 8. Stats Verification
    console.log('\n--- 8. Checking unified global API stats ---');
    const statsRes = await httpGet('/api/stats');
    console.log('Global Stats:', JSON.stringify(statsRes.body, null, 2));
    if (statsRes.body.totalIndexed !== 5 || statsRes.body.reincarnationsDetected !== 1) {
      throw new Error(`Metric counts mismatch: ${JSON.stringify(statsRes.body)}`);
    }
    console.log('✅ All global counters verify perfectly');

    console.log('\n🚀 ALL NEXT.JS API ROUTE HANDLERS PASSED END-TO-END ENDPOINT TESTS!');

  } catch (err) {
    console.error('💥 Test execution crash:', err.message);
    cleanup(1);
  } finally {
    cleanup(0);
  }
}

function cleanup(exitCode) {
  console.log('\n🧹 Cleaning up test environment...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    console.log('   Next.js server shutdown complete.');
  }
  process.exit(exitCode);
}

main();
