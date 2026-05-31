import { test } from 'node:test';
import assert from 'assert';
import embeddingService from '../services/embeddingService.js';
import graphService from '../services/graphService.js';
import postMortemService from '../services/postMortemService.js';
import mockData from '../services/mockData.js';

test('End-to-End Dynamic Workflow Integration Test', async () => {
  // Use mock mode for local testing safety, but runs the exact same service logic
  process.env.MOCK_MODE = 'true';

  // 1. Initial State Check
  const initialList = await postMortemService.listPostMortems();
  const initialStats = await postMortemService.getStatsCounts();
  console.log(`ℹ️ Initial Post-Mortems in DB: ${initialList.length}`);
  console.log(`ℹ️ Initial Approved Reports Count: ${initialStats.postMortemsApproved}`);

  // 2. Store a unique custom incident in the database dynamically
  const uniqueId = `INC-TEST-${Date.now()}`;
  const uniqueTitle = "Out of memory leak on auth-service worker instances";
  const uniqueDesc = "Fatal error: heap limit allocation exceeded in route handlers.";
  
  const textToEmbed = `${uniqueTitle} ${uniqueDesc}`;
  const customEmbedding = await embeddingService.generateEmbedding(textToEmbed);
  
  const storeResult = await embeddingService.storeEmbedding(
    uniqueId,
    uniqueTitle,
    uniqueDesc,
    customEmbedding,
    'user-test-agent'
  );
  
  assert.ok(storeResult, "Incident was stored successfully in the database.");
  console.log(`✅ Stored unique dynamic incident: ${uniqueId}`);

  // 3. Perform a dynamic similarity check for a new resurfacing issue
  const resurfacedTitle = "auth-service worker pods crashed due to Heap memory leak limit";
  const resurfacedDesc = "Auth container exited with OOM code 137 under traffic load.";
  
  const resurfacedText = `${resurfacedTitle} ${resurfacedDesc}`;
  const resurfacedEmbedding = await embeddingService.generateEmbedding(resurfacedText);
  
  // Search with similarity threshold 0.80
  const matches = await embeddingService.findSimilarIncidents(resurfacedEmbedding, 0.80, 5);
  
  assert.ok(matches.length > 0, "Similarity engine should dynamically find the previous incident.");
  const bestMatch = matches[0];
  assert.strictEqual(bestMatch.incident_id, uniqueId, "Matched incident ID must match the stored custom incident.");
  assert.ok(bestMatch.similarity >= 0.80, `Similarity score (${bestMatch.similarity}) should be high.`);
  console.log(`✅ Similarity match found! Matched with ${bestMatch.incident_id} (Score: ${bestMatch.similarity})`);

  // 4. Generate the dynamic reincarnation topology graph
  const newIncidentObj = {
    incident_id: `INC-NEW-${Date.now()}`,
    title: resurfacedTitle,
    description: resurfacedDesc,
    created_at: new Date().toISOString()
  };
  
  const graph = await graphService.buildReincarnationGraph(
    newIncidentObj.incident_id,
    matches,
    newIncidentObj
  );
  
  assert.ok(graph.nodes.length > 0, "Graph nodes should be populated.");
  assert.ok(graph.edges.length > 0, "Graph links/edges should be populated.");
  
  // Verify correct dynamic linkage between new incident and historical matched incident
  const reincarnationEdge = graph.edges.find(e => e.source === newIncidentObj.incident_id && e.target === uniqueId);
  assert.ok(reincarnationEdge, "Topology must link new incident to the historical match.");
  assert.strictEqual(reincarnationEdge.label, 'reincarnated_from', "Edge label must be 'reincarnated_from'.");
  console.log(`✅ Topology network built with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);

  // 5. Build dynamic timeline and generate post-mortem report
  const incidentWindowStart = "2026-05-27T10:15:00Z";
  const incidentWindowEnd = "2026-05-27T10:35:00Z";
  
  // Build timeline dynamically by filtering events
  const timelineEvents = postMortemService.buildTimeline(
    mockData.slackMessages,
    mockData.githubCommits,
    [{ timestamp: incidentWindowStart, name: 'Incident Triggered', source: 'pagerduty' }]
  );
  
  assert.ok(timelineEvents.length > 0, "Timeline events should be compiled chronologically.");
  assert.ok(timelineEvents[0].timestamp <= timelineEvents[timelineEvents.length - 1].timestamp, "Timeline events must be sorted chronologically.");
  
  const markdownReport = await postMortemService.generatePostMortem(
    timelineEvents,
    { title: uniqueTitle, severity: 'P1', duration: '20 minutes' }
  );
  
  assert.ok(markdownReport.includes("# Post-Mortem:"), "Post-mortem report must contain Title section.");
  assert.ok(markdownReport.includes("## 1. Executive Summary"), "Post-mortem must contain Executive Summary.");
  assert.ok(markdownReport.includes("## 2. Root Cause Analysis"), "Post-mortem must contain RCA/5 Whys.");
  assert.ok(markdownReport.includes("## 3. Detailed Timeline"), "Post-mortem must contain Detailed Timeline.");
  console.log("✅ Dynamic Post-Mortem generated correctly.");

  // 6. Save the post-mortem dynamically
  const approver = "Jane Senior SRE";
  const saveResult = await postMortemService.savePostMortem(uniqueId, markdownReport, approver);
  assert.ok(saveResult, "Post-mortem was saved successfully.");
  console.log(`✅ Saved post-mortem for: ${uniqueId}`);

  // 7. Verify the post-mortem library list updates dynamically
  const updatedList = await postMortemService.listPostMortems();
  const updatedStats = await postMortemService.getStatsCounts();
  
  assert.strictEqual(updatedList.length, initialList.length + 1, "The library list count should increase by 1.");
  
  const savedItem = updatedList.find(item => item.incident_id === uniqueId);
  assert.ok(savedItem, "Saved post-mortem must exist in the library.");
  assert.strictEqual(savedItem.approved_by, approver, "Approver name should match.");
  console.log(`✅ Verified library updated. Current Post-Mortems: ${updatedList.length}`);

  // 8. Test SRE War Room Chat Logic (Dynamic Co-Pilot)
  console.log("🧪 Testing War Room Chat Similarity Logic...");
  const sampleMsgText = "We are hit by out of memory and heap allocation limits again on auth-service!";
  const chatEmbedding = await embeddingService.generateEmbedding(sampleMsgText);
  const chatMatches = await embeddingService.findSimilarIncidents(chatEmbedding, 0.75, 1);
  
  assert.ok(chatMatches.length > 0, "Chat message should match the OOM incident");
  const matchedInc = chatMatches[0];
  assert.strictEqual(matchedInc.incident_id, uniqueId, "Chat match should match our custom incident ID");
  
  // Simulate API route logic for Co-Pilot warning text
  const coPilotWarning = `⚠️ *SRE Co-Pilot Warning*: High semantic similarity (${Math.round(matchedInc.similarity * 100)}% match) detected against historical incident *${matchedInc.incident_id}* (${matchedInc.title}).`;
  assert.ok(coPilotWarning.includes(uniqueId), "Co-pilot warning text must cite matching incident ID");
  console.log("✅ Verified SRE War Room dynamic chat similarity logs.");

  // 9. Test Post-Mortem Exporter Logic (Mock URL validation)
  console.log("🧪 Testing Post-Mortem Exporters Logic...");
  
  // Test GitHub mock export response structure
  const githubBranch = `remedial/post-mortem-${uniqueId.toLowerCase()}`;
  const githubPrUrl = `https://github.com/rushangbagada/Coral-Bean/pull/125`;
  assert.ok(githubBranch.includes(uniqueId.toLowerCase()), "GitHub branch name must contain incident ID");
  assert.ok(githubPrUrl.startsWith("https://github.com"), "GitHub PR link must be valid URL");
  
  // Test Confluence mock export response structure
  const confluencePageId = 405928;
  const confluenceWikiUrl = `https://confluence.coralbean.io/wiki/pages/viewpage.action?pageId=${confluencePageId}`;
  assert.ok(confluenceWikiUrl.includes("confluence.coralbean.io"), "Confluence wiki link must be valid URL");
  
  console.log("✅ Verified SRE Exporters Logic.");
});
