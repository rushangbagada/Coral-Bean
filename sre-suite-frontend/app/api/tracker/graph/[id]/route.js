import { NextResponse } from 'next/server';
import embeddingService from '@/services/embeddingService';
import graphService from '@/services/graphService';

export async function GET(req, { params }) {
  try {
    // Unwrap params Promise for Next.js 15+ compatibility
    const resolvedParams = await params;
    const incidentId = resolvedParams.id;
    
    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident ID parameter' }, { status: 400 });
    }

    let currentIncident = null;
    
    // Find current incident details in local store
    const localMatch = embeddingService.inMemoryIncidentStore.find(item => item.incident_id === incidentId);
    if (localMatch) {
      currentIncident = localMatch;
    } else {
      currentIncident = {
        incident_id: incidentId,
        title: 'Database connection pool exhaustion on prod-api',
        description: 'All database connections timed out under load'
      };
    }

    const textToEmbed = `${currentIncident.title} ${currentIncident.description || ''}`;
    const currentEmbedding = await embeddingService.generateEmbedding(textToEmbed);
    const similarIncidents = await embeddingService.findSimilarIncidents(currentEmbedding, 0.80, 5);

    const filteredSimilar = similarIncidents.filter(m => m.incident_id !== incidentId);

    const graph = await graphService.buildReincarnationGraph(incidentId, filteredSimilar, currentIncident);
    return NextResponse.json(graph);
  } catch (error) {
    console.error(`❌ GET /api/tracker/graph/[id] failed:`, error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
