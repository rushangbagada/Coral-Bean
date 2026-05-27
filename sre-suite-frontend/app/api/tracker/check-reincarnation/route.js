import { NextResponse } from 'next/server';
import embeddingService from '@/services/embeddingService';

// Maintain in-memory stats inside Route Handler memory scope
let reincarnationsCount = 0;

export async function POST(req) {
  try {
    const { id, title, description } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Missing incident title' }, { status: 400 });
    }

    const textToEmbed = `${title} ${description || ''}`;
    const newEmbedding = await embeddingService.generateEmbedding(textToEmbed);
    const matches = await embeddingService.findSimilarIncidents(newEmbedding, 0.85, 5);

    const isReincarnated = matches.length > 0;
    if (isReincarnated) {
      reincarnationsCount++;
    }

    // Save the newly submitted incident to the database so it can be used for future comparisons
    const assignedId = id || `INC-${Date.now()}`;
    await embeddingService.storeEmbedding(assignedId, title, description, newEmbedding, 'tracker-form');

    return NextResponse.json({
      success: true,
      incident_id: assignedId,
      is_reincarnated: isReincarnated,
      matches: matches.map(m => ({
        incident_id: m.incident_id,
        title: m.title,
        description: m.description,
        similarity: parseFloat(m.similarity.toFixed(4)),
        source: m.source
      }))
    });
  } catch (error) {
    console.error('❌ POST /api/tracker/check-reincarnation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

// Export stats utility helper for `/api/stats` to read dynamically
export function getReincarnationsCount() {
  return reincarnationsCount;
}
