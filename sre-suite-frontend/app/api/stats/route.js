import { NextResponse } from 'next/server';
import embeddingService from '@/services/embeddingService';
import postMortemService from '@/services/postMortemService';

// We can import the stats counts tracker from tracker route directly or simulate it
// To make it simple and robust, we can look up tracker route's global count
import { getReincarnationsCount } from '../tracker/check-reincarnation/route';

export async function GET() {
  try {
    const embedStats = await embeddingService.getStats();
    const pmStats = await postMortemService.getStatsCounts();
    const reincarnationsDetected = getReincarnationsCount();

    return NextResponse.json({
      totalIndexed: embedStats.totalIndexed,
      reincarnationsDetected: reincarnationsDetected,
      postMortemsGenerated: pmStats.postMortemsGenerated,
      postMortemsApproved: pmStats.postMortemsApproved
    });
  } catch (error) {
    console.error('❌ GET /api/stats failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
