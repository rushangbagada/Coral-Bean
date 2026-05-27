import { NextResponse } from 'next/server';
import postMortemService from '@/services/postMortemService';

export async function POST(req) {
  try {
    const { incidentId, slackMessages, deployments, alerts, incidentMeta } = await req.json();
    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incidentId in request body' }, { status: 400 });
    }

    const consolidatedTimeline = postMortemService.buildTimeline(slackMessages, deployments, alerts);
    const markdown = await postMortemService.generatePostMortem(consolidatedTimeline, incidentMeta || {});

    return NextResponse.json({
      success: true,
      incidentId,
      markdown,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ POST /api/postmortem/generate failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
