import { NextResponse } from 'next/server';
import postMortemService from '@/services/postMortemService';

export async function POST(req) {
  try {
    const { incidentId, markdown, approvedBy } = await req.json();
    if (!incidentId || !markdown) {
      return NextResponse.json({ error: 'Missing incidentId or markdown' }, { status: 400 });
    }

    await postMortemService.savePostMortem(incidentId, markdown, approvedBy || 'system');
    return NextResponse.json({
      success: true,
      message: `Post-Mortem for ${incidentId} saved successfully.`
    });
  } catch (error) {
    console.error('❌ POST /api/postmortem/save failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
