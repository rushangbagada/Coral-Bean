import { NextResponse } from 'next/server';
import embeddingService from '@/services/embeddingService';

export async function POST(req) {
  try {
    const { incidents } = await req.json();
    if (!incidents || !Array.isArray(incidents)) {
      return NextResponse.json({ error: 'Missing incidents array in request body' }, { status: 400 });
    }

    const result = await embeddingService.processAndStoreHistoricalIncidents(incidents);
    return NextResponse.json({
      success: true,
      processed: result.processed,
      message: `Successfully processed and indexed ${result.processed} incidents.`
    });
  } catch (error) {
    console.error('❌ POST /api/tracker/index-historical failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
