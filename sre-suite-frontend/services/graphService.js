const { executeQuery } = require('./coral');

function extractKeyword(title) {
  if (!title) return 'fix';
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'again', 'under', 'exhausted', 'timeout'].includes(w));
  return words[0] || 'fix';
}

async function buildReincarnationGraph(incidentId, similarIncidents, currentIncident) {
  console.log(`🕸️ [Graph Service] Building reincarnation network graph for ${incidentId} inside Next.js...`);

  const nodes = [];
  const edges = [];

  nodes.push({
    id: incidentId,
    label: currentIncident ? currentIncident.title : `Active Incident: ${incidentId}`,
    type: 'current',
    metadata: {
      description: currentIncident ? currentIncident.description : '',
      created_at: currentIncident ? currentIncident.created_at : new Date().toISOString()
    }
  });

  const visitedNodeIds = new Set([incidentId]);

    for (const hist of similarIncidents) {
    const histId = hist.incident_id;

    if (!visitedNodeIds.has(histId)) {
      nodes.push({
        id: histId,
        label: hist.title || `Historical Incident: ${histId}`,
        type: 'historical',
        metadata: {
          description: hist.description || '',
          created_at: hist.created_at,
          resolved_at: hist.resolved_at,
          source: hist.source
        }
      });
      visitedNodeIds.add(histId);
    }

    edges.push({
      source: incidentId,
      target: histId,
      label: 'reincarnated_from',
      similarity: hist.similarity
    });

    try {
      const keyword = extractKeyword(hist.title);
      const prQuery = `
        SELECT id, number, title, html_url, state
        FROM github.pull_requests
        WHERE title LIKE '%${keyword}%'
        LIMIT 3
      `;
      
      const prs = await executeQuery(prQuery);

      prs.forEach(pr => {
        const prNodeId = `pr_${pr.number || pr.id}`;

        if (!visitedNodeIds.has(prNodeId)) {
          nodes.push({
            id: prNodeId,
            label: `PR #${pr.number}: ${pr.title}`,
            type: 'pr',
            metadata: {
              html_url: pr.html_url || `https://github.com/rushangbagada/Coral-Bean/pull/${pr.number}`,
              state: pr.state || 'closed'
            }
          });
          visitedNodeIds.add(prNodeId);
        }

        edges.push({
          source: histId,
          target: prNodeId,
          label: 'attempted_fix_pr',
          similarity: 1.0
        });
      });
    } catch (prErr) {
      console.warn(`⚠️ [Graph Service] Failed to fetch PRs for historical incident ${histId}:`, prErr.message);
    }

    try {
      // Attempt to fetch related tickets from Linear/Jira via integrations service
      const integrations = require('./integrations');
      const keyword = extractKeyword(hist.title);
      const tickets = await integrations.fetchTickets(keyword);

      if (tickets && tickets.length > 0) {
        for (const t of tickets) {
          const ticketNodeId = `ticket_${t.id || t.key || Math.random().toString(36).slice(2,9)}`;
          if (!visitedNodeIds.has(ticketNodeId)) {
            nodes.push({
              id: ticketNodeId,
              label: `Ticket: ${t.title || t.summary || ticketNodeId}`,
              type: 'ticket',
              metadata: {
                url: t.url || t.link || null,
                status: t.status || 'unknown',
                source: t.source || 'external'
              }
            });
            visitedNodeIds.add(ticketNodeId);
          }

          edges.push({
            source: histId,
            target: ticketNodeId,
            label: 'tracked_remedial_task',
            similarity: 1.0
          });
        }
      } else {
        const ticketNodeId = `ticket_${histId}`;
        if (!visitedNodeIds.has(ticketNodeId)) {
          nodes.push({
            id: ticketNodeId,
            label: `Ticket: ${histId}-fix-task`,
            type: 'ticket',
            metadata: {
              status: 'backlog',
              priority: 'medium'
            }
          });
          visitedNodeIds.add(ticketNodeId);

          edges.push({
            source: histId,
            target: ticketNodeId,
            label: 'tracked_remedial_task',
            similarity: 1.0
          });
        }
      }
    } catch (tErr) {
      console.warn(`⚠️ [Graph Service] Ticket lookup failed for ${histId}:`, tErr.message);
      const ticketNodeId = `ticket_${histId}`;
      if (!visitedNodeIds.has(ticketNodeId)) {
        nodes.push({
          id: ticketNodeId,
          label: `Ticket: ${histId}-fix-task`,
          type: 'ticket',
          metadata: {
            status: 'backlog',
            priority: 'medium'
          }
        });
        visitedNodeIds.add(ticketNodeId);

        edges.push({
          source: histId,
          target: ticketNodeId,
          label: 'tracked_remedial_task',
          similarity: 1.0
        });
      }
    }
  }

  return {
    nodes,
    edges
  };
}

module.exports = {
  buildReincarnationGraph
};
