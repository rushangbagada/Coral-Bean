const express = require('express');
const router = Router = express.Router();
const { executeQuery } = require('../services/coral');

/**
 * GET /api/postmortem/incident/:id/timeline
 * Compiles a cross-source timeline for an incident by joining:
 * 1. PagerDuty alert status & timing.
 * 2. Slack messages from the incident window.
 * 3. Preceding and during-incident GitHub commits (deployments).
 */
router.get('/incident/:id/timeline', async (req, res, next) => {
  try {
    const incidentId = req.params.id;

    // 1. Query PagerDuty incident details
    const incidentQuery = `
      SELECT id, title, description, service, created_at, resolved_at, status
      FROM pagerduty.incidents
      WHERE id = '${incidentId}'
    `;
    const incidentResults = await executeQuery(incidentQuery);

    if (incidentResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Incident with ID ${incidentId} not found`
      });
    }

    const incident = incidentResults[0];
    const startTime = new Date(incident.created_at);
    // If not resolved, use current time
    const endTime = incident.resolved_at ? new Date(incident.resolved_at) : new Date();

    // 2. Fetch Slack discussion thread
    // Conceptually query slack.messages for the incident channel in the time window
    // (with buffers of 5 mins before and after)
    const bufferStart = new Date(startTime.getTime() - 5 * 60000).toISOString();
    const bufferEnd = new Date(endTime.getTime() + 5 * 60000).toISOString();

    const slackQuery = `
      SELECT timestamp, user_name, text
      FROM slack.messages
      WHERE timestamp BETWEEN '${bufferStart}' AND '${bufferEnd}'
    `;
    const messages = await executeQuery(slackQuery);

    // 3. Fetch recent deployments/commits
    // We look at commits within 24 hours preceding the incident start, and during the incident
    const precedingLimit = new Date(startTime.getTime() - 24 * 60 * 60000).toISOString();
    const commitsQuery = `
      SELECT sha, message, author, created_at, html_url
      FROM github.commits
      WHERE created_at BETWEEN '${precedingLimit}' AND '${bufferEnd}'
      ORDER BY created_at DESC
    `;
    const commits = await executeQuery(commitsQuery);

    // 4. Synthesize chronological timeline events
    const timelineEvents = [];

    // Trigger Event
    timelineEvents.push({
      timestamp: incident.created_at,
      source: 'pagerduty',
      type: 'ALERT_TRIGGERED',
      title: 'Incident Triggered',
      description: incident.title,
      details: incident.description,
      meta: { service: incident.service }
    });

    // Resolution Event
    if (incident.resolved_at) {
      timelineEvents.push({
        timestamp: incident.resolved_at,
        source: 'pagerduty',
        type: 'ALERT_RESOLVED',
        title: 'Incident Resolved',
        description: `Marked as resolved. Duration: ${Math.round((endTime - startTime) / 60000)} minutes.`,
        details: null,
        meta: {}
      });
    }

    // Deployments before & during incident
    commits.forEach(commit => {
      const commitTime = new Date(commit.created_at);
      const isBefore = commitTime < startTime;

      timelineEvents.push({
        timestamp: commit.created_at,
        source: 'github',
        type: isBefore ? 'TRIGGER_CANDIDATE' : 'MITIGATION_DEPLOY',
        title: isBefore ? 'Preceding Code Deployment' : 'Mitigation / Fix Deployed',
        description: commit.message,
        details: `Authored by ${commit.author}`,
        meta: { sha: commit.sha.substring(0, 7), url: commit.html_url }
      });
    });

    // Slack communication events
    messages.forEach(msg => {
      timelineEvents.push({
        timestamp: msg.timestamp,
        source: 'slack',
        type: 'DISCUSSION',
        title: msg.user_name,
        description: msg.text,
        details: null,
        meta: {}
      });
    });

    // 5. Sort timeline chronologically
    timelineEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      incident: {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        service: incident.service,
        created_at: incident.created_at,
        resolved_at: incident.resolved_at
      },
      timeframe: {
        start: bufferStart,
        end: bufferEnd
      },
      timeline: timelineEvents
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
