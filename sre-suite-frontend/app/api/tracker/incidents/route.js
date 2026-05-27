import { NextResponse } from 'next/server';
import { executeQuery } from '@/services/coral';

function calculateJaccardSimilarity(str1, str2) {
  const s1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
  const s2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export async function GET() {
  try {
    const activeIncidentsQuery = `
      SELECT id, title, description, status, service, created_at 
      FROM pagerduty.incidents 
      WHERE status = 'triggered'
    `;
    const activeIncidents = await executeQuery(activeIncidentsQuery);

    const sentryErrorsQuery = `
      SELECT id, project, message, culprit, level, times_seen, last_seen 
      FROM sentry.events
    `;
    const sentryErrors = await executeQuery(sentryErrorsQuery);

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

    return NextResponse.json({
      success: true,
      count: correlated.length,
      incidents: correlated
    });
  } catch (error) {
    console.error('❌ GET /api/tracker/incidents failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
