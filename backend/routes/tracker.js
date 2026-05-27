const express = require('express');
const router = express.Router();
const { executeQuery } = require('../services/coral');

/**
 * Helper to calculate simple string similarity (Jaccard similarity on tokens)
 * to act as a placeholder until LLM embeddings are integrated in Day 3.
 */
function calculateJaccardSimilarity(str1, str2) {
  const s1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
  const s2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * GET /api/tracker/incidents
 * Retrieves current active/triggered incidents joined conceptually with Sentry errors.
 */
router.get('/incidents', async (req, res, next) => {
  try {
    // 1. Fetch active incidents from PagerDuty via Coral
    const activeIncidentsQuery = `
      SELECT id, title, description, status, service, created_at 
      FROM pagerduty.incidents 
      WHERE status = 'triggered'
    `;
    const activeIncidents = await executeQuery(activeIncidentsQuery);

    // 2. Fetch recent Sentry errors via Coral to join
    const sentryErrorsQuery = `
      SELECT id, project, message, culprit, level, times_seen, last_seen 
      FROM sentry.events
    `;
    const sentryErrors = await executeQuery(sentryErrorsQuery);

    // 3. Perform a loose join in application logic mapping PagerDuty service to Sentry project name
    const correlated = activeIncidents.map(inc => {
      const relatedError = sentryErrors.find(err => 
        err.project.toLowerCase().includes(inc.service.toLowerCase()) ||
        inc.service.toLowerCase().includes(err.project.toLowerCase()) ||
        calculateJaccardSimilarity(inc.title, err.message) > 0.2
      );

      return {
        ...inc,
        sentry_correlation: relatedError || null
      };
    });

    res.json({
      success: true,
      count: correlated.length,
      incidents: correlated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tracker/incidents/historical
 * Retrieves resolved historical incidents to serve as similarity targets.
 */
router.get('/incidents/historical', async (req, res, next) => {
  try {
    const historicalQuery = `
      SELECT id, title, description, status, service, created_at, resolved_at 
      FROM pagerduty.incidents 
      WHERE status = 'resolved'
    `;
    const historical = await executeQuery(historicalQuery);

    res.json({
      success: true,
      count: historical.length,
      incidents: historical
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tracker/similarity
 * Accepts a new incident payload and calculates similarity against historical incidents.
 * Also retrieves previous commits that attempted to address those matching past incidents.
 */
router.post('/similarity', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing incident title in request body' });
    }

    const fullText = `${title} ${description || ''}`;

    // 1. Fetch resolved historical incidents
    const historicalQuery = `
      SELECT id, title, description, service, created_at, resolved_at 
      FROM pagerduty.incidents 
      WHERE status = 'resolved'
    `;
    const historicalIncidents = await executeQuery(historicalQuery);

    // 2. Fetch GitHub commits
    const commitsQuery = `
      SELECT sha, message, author, created_at, html_url 
      FROM github.commits
    `;
    const commits = await executeQuery(commitsQuery);

    // 3. Find matches and associate them
    const matches = historicalIncidents.map(hist => {
      const histText = `${hist.title} ${hist.description || ''}`;
      const score = calculateJaccardSimilarity(fullText, histText);

      // Try to find commits related to this historical incident
      // e.g. commit messages containing the service name or words from incident title
      const linkedCommits = commits.filter(commit => {
        const messageLower = commit.message.toLowerCase();
        const serviceLower = hist.service.toLowerCase();
        
        // Match on service name or incident ID (e.g. INC-1722)
        return messageLower.includes(serviceLower) || 
               messageLower.includes(hist.id.toLowerCase()) ||
               (messageLower.includes('fix') && calculateJaccardSimilarity(commit.message, hist.title) > 0.25);
      });

      return {
        historical_incident: hist,
        similarity_score: parseFloat(score.toFixed(4)),
        linked_fixes: linkedCommits
      };
    })
    .filter(match => match.similarity_score > 0.15) // Keep matches with non-trivial similarity
    .sort((a, b) => b.similarity_score - a.similarity_score);

    // Determine if it's a resurfaced/reincarnated incident
    const isReincarnated = matches.length > 0 && matches[0].similarity_score > 0.4;

    res.json({
      success: true,
      analysis: {
        is_reincarnated: isReincarnated,
        confidence_score: matches.length > 0 ? matches[0].similarity_score : 0,
        matches_count: matches.length,
        primary_match: matches.length > 0 ? matches[0] : null,
        all_potential_matches: matches
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
