import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { incidentId, markdown } = await req.json();
    if (!incidentId || !markdown) {
      return NextResponse.json({ error: 'Missing incidentId or markdown content' }, { status: 400 });
    }

    console.log(`🏢 [Confluence Exporter] Simulating document upload to wiki space for incident ${incidentId}`);

    const pageId = Math.floor(Math.random() * 900000) + 100000;
    const wikiUrl = `https://confluence.coralbean.io/wiki/pages/viewpage.action?pageId=${pageId}`;

    return NextResponse.json({
      success: true,
      page_id: pageId,
      url: wikiUrl,
      message: `Successfully uploaded blameless post-mortem for ${incidentId} to Confluence space SRE-WIKI.`
    });
  } catch (err) {
    console.error('❌ Confluence Export API failed:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
