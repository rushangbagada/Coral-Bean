import { NextResponse } from 'next/server';
import postMortemService from '@/services/postMortemService';

export async function GET() {
  try {
    const list = await postMortemService.listPostMortems();
    return NextResponse.json({
      success: true,
      count: list.length,
      post_mortems: list
    });
  } catch (error) {
    console.error('❌ GET /api/postmortem/list failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
