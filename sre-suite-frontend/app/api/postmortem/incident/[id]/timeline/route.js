import { NextResponse } from 'next/server';
import { executeQuery } from '@/services/coral';
import postMortemService from '@/services/postMortemService';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const incidentId = resolvedParams.id;
    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident ID parameter' }, { status: 400 });
    }

    const incidentQuery = `
      SELECT id, title, description, service, created_at, resolved_at, status
      FROM pagerduty.incidents
      WHERE id = '${incidentId}'
    `;
    const incidentResults = await executeQuery(incidentQuery);

    if (incidentResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Incident with ID ${incidentId} not found`
      }, { status: 404 });
    }

    const incident = incidentResults[0];
    const startTime = new Date(incident.created_at);
    const endTime = incident.resolved_at ? new Date(incident.resolved_at) : new Date();

    const bufferStart = new Date(startTime.getTime() - 5 * 60000).toISOString();
    const bufferEnd = new Date(endTime.getTime() + 5 * 60000).toISOString();

    const slackQuery = `
      SELECT timestamp, user_name, text
      FROM slack.messages
      WHERE timestamp BETWEEN '${bufferStart}' AND '${bufferEnd}'
    `;
    const messages = await executeQuery(slackQuery);

    const precedingLimit = new Date(startTime.getTime() - 24 * 60 * 60000).toISOString();
    const commitsQuery = `
      SELECT sha, message, author, created_at, html_url
      FROM github.commits
      WHERE created_at BETWEEN '${precedingLimit}' AND '${bufferEnd}'
      ORDER BY created_at DESC
    `;
    const commits = await executeQuery(commitsQuery);

    const timelineEvents = postMortemService.buildTimeline(messages, commits, [
      {
        timestamp: incident.created_at,
        name: 'Incident Triggered',
        description: incident.description,
        source: 'pagerduty',
        user: 'system'
      },
      ...(incident.resolved_at ? [{
        timestamp: incident.resolved_at,
        name: 'Incident Resolved',
        source: 'pagerduty',
        user: 'system'
      }] : [])
    ]);

    return NextResponse.json({
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
    const resolvedParams = await params;
    console.error(`❌ GET /api/postmortem/incident/[id]/timeline failed for ${resolvedParams?.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
