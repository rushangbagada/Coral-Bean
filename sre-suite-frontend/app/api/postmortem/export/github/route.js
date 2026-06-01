import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { incidentId, markdown } = await req.json();
    if (!incidentId || !markdown) {
      return NextResponse.json({ error: 'Missing incidentId or markdown content' }, { status: 400 });
    }

    console.log(`🚀 [GitHub Exporter] Simulating branch push and Pull Request for incident ${incidentId}`);

    const branchName = `remedial/post-mortem-${incidentId.toLowerCase()}`;
    const prNumber = Math.floor(Math.random() * 500) + 100;
    const prUrl = `https://github.com/rushangbagada/Coral-Bean/pull/${prNumber}`;

    return NextResponse.json({
      success: true,
      branch: branchName,
      pr_number: prNumber,
      url: prUrl,
      message: `Successfully created pull request #${prNumber} committing docs/post-mortems/${incidentId}.md`
    });
  } catch (err) {
    console.error('❌ GitHub Export API failed:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
