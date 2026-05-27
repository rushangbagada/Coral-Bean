import { NextResponse } from 'next/server';
import { executeQuery } from '@/services/coral';

export async function GET() {
  try {
    const historicalQuery = `
      SELECT id, title, description, status, service, created_at, resolved_at 
      FROM pagerduty.incidents 
      WHERE status = 'resolved'
    `;
    const historical = await executeQuery(historicalQuery);

    return NextResponse.json({
      success: true,
      count: historical.length,
      incidents: historical
    });
  } catch (error) {
    console.error('❌ GET /api/tracker/incidents/historical failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
