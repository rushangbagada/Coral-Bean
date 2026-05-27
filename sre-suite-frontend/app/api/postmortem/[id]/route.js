import { NextResponse } from 'next/server';
import postMortemService from '@/services/postMortemService';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const incidentId = resolvedParams.id;
    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident ID parameter' }, { status: 400 });
    }

    const pm = await postMortemService.getPostMortem(incidentId);

    if (!pm) {
      return NextResponse.json({
        success: false,
        error: `Post-Mortem for ${incidentId} not found`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post_mortem: pm
    });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`❌ GET /api/postmortem/[id] failed for ${resolvedParams?.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
