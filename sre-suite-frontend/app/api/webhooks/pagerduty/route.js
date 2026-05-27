import { NextResponse } from 'next/server';
import postMortemService from '@/services/postMortemService';

export async function POST(req) {
  try {
    const payload = await req.json();
    
    if (!payload || !payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty webhook payload structure' }, { status: 400 });
    }

    const message = payload.messages[0];
    const isResolved = message.event === 'incident.resolve' || message.event_type === 'incident.resolve';

    if (!isResolved) {
      return NextResponse.json({ status: 'ignored', reason: 'Not a resolution event' });
    }

    const data = message.data || {};
    const incidentId = data.id;
    const title = data.title || 'Auto-Detected Incident';
    const createdAt = data.created_at || new Date().toISOString();
    const resolvedAt = data.resolved_at || new Date().toISOString();

    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident ID in message data' }, { status: 400 });
    }

    console.log('[WEBHOOK] Auto-generating post-mortem for:', incidentId);

    const incidentMeta = {
      title,
      severity: 'P1',
      duration: `${Math.round((new Date(resolvedAt) - new Date(createdAt)) / 60000)} minutes`,
      created_at: createdAt,
      resolved_at: resolvedAt
    };

    const markdown = await postMortemService.generatePostMortem([], incidentMeta);
    await postMortemService.savePostMortem(incidentId, markdown, 'pagerduty-webhook');

    return NextResponse.json({
      status: 'draft_created',
      incidentId
    });
  } catch (error) {
    console.error('❌ Webhook handler error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
