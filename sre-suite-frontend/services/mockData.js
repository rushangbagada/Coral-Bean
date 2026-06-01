/**
 * High-fidelity Mock Datasets mimicking the Coral SQL database structure
 * for PagerDuty, Sentry, GitHub, and Slack integrations.
 * 
 * This enables robust testing and offline presentation of the AI SRE Suite.
 */

// 1. PagerDuty Incidents
const pagerdutyIncidents = [
  {
    id: "INC-2041",
    title: "Database connection pool exhaustion on prod-api",
    description: "Database connection pool limit (100) reached. API returning HTTP 500.",
    status: "triggered",
    urgency: "high",
    service: "prod-api-gateway",
    created_at: "2026-05-27T10:15:00Z",
    resolved_at: null
  },
  {
    id: "INC-1982",
    title: "High API Error Rate on Checkout Service",
    description: "Sentry reported 250 checkout failures in 5 minutes.",
    status: "resolved",
    urgency: "high",
    service: "checkout-microservice",
    created_at: "2026-05-20T14:22:00Z",
    resolved_at: "2026-05-20T15:10:00Z"
  },
  {
    id: "INC-1854",
    title: "Redis Out of Memory - cache-server-01",
    description: "Redis eviction policy triggered, cache read latency > 2000ms.",
    status: "resolved",
    urgency: "medium",
    service: "cache-layer",
    created_at: "2026-05-12T03:10:00Z",
    resolved_at: "2026-05-12T04:45:00Z"
  },
  {
    id: "INC-1722",
    title: "Database connection pool exhaustion on prod-api (Resurfaced)",
    description: "Connection pool limits hit again after cache server eviction spike.",
    status: "resolved",
    urgency: "high",
    service: "prod-api-gateway",
    created_at: "2026-04-28T18:30:00Z",
    resolved_at: "2026-04-28T20:15:00Z"
  }
];

// 2. Sentry Events
const sentryEvents = [
  {
    id: "evt_db_pool_exhaust",
    project: "prod-api-gateway",
    message: "ConnectionPoolTimeoutException: Timeout waiting for idle connection in pool.",
    culprit: "db/pool.js in getConnection",
    level: "error",
    times_seen: 1420,
    last_seen: "2026-05-27T10:30:00Z"
  },
  {
    id: "evt_checkout_failed",
    project: "checkout-microservice",
    message: "StripeCardException: Card was declined due to insufficient funds.",
    culprit: "payment/stripe.js in processPayment",
    level: "warning",
    times_seen: 250,
    last_seen: "2026-05-20T14:45:00Z"
  },
  {
    id: "evt_redis_oom",
    project: "cache-layer",
    message: "RedisServerException: OOM command not allowed when used memory > 'maxmemory'.",
    culprit: "store/redis.js in setCacheValue",
    level: "fatal",
    times_seen: 89,
    last_seen: "2026-05-12T03:22:00Z"
  }
];

// 3. GitHub Commits
const githubCommits = [
  {
    sha: "a2f9b1c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
    repository: "Coral-Bean",
    message: "fix: increase db connection pool max limit to 150 as hotfix",
    author: "Developer Captain <captain@coralbean.io>",
    created_at: "2026-05-27T10:28:00Z",
    html_url: "https://github.com/rushangbagada/Coral-Bean/commit/a2f9b1c"
  },
  {
    sha: "f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6",
    repository: "Coral-Bean",
    message: "chore: update redis maxmemory-policy to volatile-lru",
    author: "SRE Pirate <sre@coralbean.io>",
    created_at: "2026-05-12T04:12:00Z",
    html_url: "https://github.com/rushangbagada/Coral-Bean/commit/f5e4d3c"
  },
  {
    sha: "e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0",
    repository: "Coral-Bean",
    message: "feat: add stripe integration fallback endpoints",
    author: "Dev Mate <mate@coralbean.io>",
    created_at: "2026-05-20T12:00:00Z",
    html_url: "https://github.com/rushangbagada/Coral-Bean/commit/e9d8c7b"
  },
  {
    sha: "b5d7a6e112d1b8a9c3d4f5b6a7b8c9d0e1f2a3ff",
    repository: "Coral-Bean",
    message: "fix: mitigate pool timeout issues by adding retry mechanism",
    author: "Developer Captain <captain@coralbean.io>",
    created_at: "2026-04-28T19:15:00Z",
    html_url: "https://github.com/rushangbagada/Coral-Bean/commit/b5d7a6e"
  }
];

// 4. Slack Messages (for incident channels)
const slackMessages = [
  {
    timestamp: "2026-05-27T10:16:00Z",
    user_name: "sre-bot",
    text: "🚨 *Alert fired in PagerDuty*: `Database connection pool exhaustion on prod-api` (INC-2041) is currently *triggered*. Channel #incident-db-exhaustion created."
  },
  {
    timestamp: "2026-05-27T10:18:15Z",
    user_name: "SRE Pirate",
    text: "Looking into this. Getting connection pool exhaustion on all API pods. Let me check Grafana dashboards."
  },
  {
    timestamp: "2026-05-27T10:20:40Z",
    user_name: "Developer Captain",
    text: "I see a spike in API latency as well. Sentry is showing a lot of ConnectionPoolTimeoutException errors."
  },
  {
    timestamp: "2026-05-27T10:22:10Z",
    user_name: "SRE Pirate",
    text: "Confirmed. DB metrics show active connections capped at 100. Looks like we have a massive pool wait time."
  },
  {
    timestamp: "2026-05-27T10:24:30Z",
    user_name: "Developer Captain",
    text: "Wait, didn't we hit this identical issue back on April 28? The post-mortem said we needed to scale the Postgres DB connection limits and adjust pool sizes, but the Jira ticket got deprioritized for the checkout feature launch."
  },
  {
    timestamp: "2026-05-27T10:25:55Z",
    user_name: "SRE Pirate",
    text: "Yep. Here is the reincarnation! The technical debt resurfaced. Let's do a quick hotfix: I'll increase the max pool size from 100 to 150 on the API deployment config."
  },
  {
    timestamp: "2026-05-27T10:28:10Z",
    user_name: "Developer Captain",
    text: "Great idea. Preparing hotfix PR with pool limit at 150. Let's merge."
  },
  {
    timestamp: "2026-05-27T10:30:45Z",
    user_name: "sre-bot",
    text: "🚢 *Deployment Successful*: Commit `a2f9b1c7` (fix: increase db connection pool max limit to 150 as hotfix) has been deployed to `production`."
  },
  {
    timestamp: "2026-05-27T10:32:00Z",
    user_name: "SRE Pirate",
    text: "Latencies are returning to normal, database connection pool usage is hovering around 110. Problem solved."
  },
  {
    timestamp: "2026-05-27T10:34:10Z",
    user_name: "sre-bot",
    text: "✅ *Alert resolved in PagerDuty*: `Database connection pool exhaustion on prod-api` (INC-2041) is now *resolved*."
  }
];

// 5. GitHub Pull Requests
const githubPullRequests = [
  {
    id: "pr_101",
    number: 101,
    title: "fix: resolve db connection pool limits",
    html_url: "https://github.com/rushangbagada/Coral-Bean/pull/101",
    state: "closed"
  },
  {
    id: "pr_102",
    number: 102,
    title: "fix: increase cache eviction buffer",
    html_url: "https://github.com/rushangbagada/Coral-Bean/pull/102",
    state: "closed"
  },
  {
    id: "pr_103",
    number: 103,
    title: "fix: patch heap growth in payment controller",
    html_url: "https://github.com/rushangbagada/Coral-Bean/pull/103",
    state: "closed"
  }
];

/**
 * Parses a SQL statement and returns matching mock data.
 * @param {string} sql
 * @returns {Array<object>}
 */
function mockQuery(sql) {
  const normalizedSql = sql.toLowerCase().replace(/\s+/g, ' ');

  // 1. Slack Messages
  if (normalizedSql.includes('slack.messages')) {
    return slackMessages;
  }

  // 2. Sentry Events
  if (normalizedSql.includes('sentry.events')) {
    if (normalizedSql.includes('evt_db_pool_exhaust') || normalizedSql.includes('prod-api-gateway')) {
      return [sentryEvents[0]];
    }
    return sentryEvents;
  }

  // 3. GitHub Commits
  if (normalizedSql.includes('github.commits')) {
    if (normalizedSql.includes('limit')) {
      const limitMatch = normalizedSql.match(/limit\s+(\d+)/);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;
      return githubCommits.slice(0, limit);
    }
    return githubCommits;
  }

  // 3b. GitHub Pull Requests
  if (normalizedSql.includes('github.pull_requests')) {
    if (normalizedSql.includes('pool') || normalizedSql.includes('db')) {
      return [githubPullRequests[0]];
    }
    if (normalizedSql.includes('cache') || normalizedSql.includes('eviction') || normalizedSql.includes('storm')) {
      return [githubPullRequests[1]];
    }
    if (normalizedSql.includes('memory') || normalizedSql.includes('heap') || normalizedSql.includes('leak')) {
      return [githubPullRequests[2]];
    }
    return githubPullRequests;
  }

  // Linear issues mock tables
  const linearIssues = [
    {
      id: "LIN-101",
      title: "Scale database connection limits and pool configurations",
      status: "backlog",
      url: "https://linear.app/coral-team/issue/LIN-101"
    },
    {
      id: "LIN-102",
      title: "Implement Redis eviction policy and alerting limits",
      status: "completed",
      url: "https://linear.app/coral-team/issue/LIN-102"
    },
    {
      id: "LIN-103",
      title: "Fix heap leak in checkout session loop handlers",
      status: "started",
      url: "https://linear.app/coral-team/issue/LIN-103"
    }
  ];

  // Jira issues mock tables
  const jiraIssues = [
    {
      id: "SRE-204",
      key: "SRE-204",
      summary: "Audit connection pooling parameters under high volume",
      status: "In Backlog",
      url: "https://jira.coralbean.io/browse/SRE-204"
    }
  ];

  if (normalizedSql.includes('linear.issues')) {
    if (normalizedSql.includes('pool') || normalizedSql.includes('db') || normalizedSql.includes('database')) {
      return [linearIssues[0]];
    }
    if (normalizedSql.includes('cache') || normalizedSql.includes('redis') || normalizedSql.includes('eviction')) {
      return [linearIssues[1]];
    }
    if (normalizedSql.includes('memory') || normalizedSql.includes('leak') || normalizedSql.includes('heap')) {
      return [linearIssues[2]];
    }
    return linearIssues;
  }

  if (normalizedSql.includes('jira.issues')) {
    return jiraIssues;
  }

  // 4. PagerDuty Incidents
  if (normalizedSql.includes('pagerduty.incidents')) {
    if (normalizedSql.includes("status = 'triggered'") || normalizedSql.includes("status='triggered'")) {
      return pagerdutyIncidents.filter(inc => inc.status === 'triggered');
    }
    if (normalizedSql.includes("status = 'resolved'") || normalizedSql.includes("status='resolved'")) {
      return pagerdutyIncidents.filter(inc => inc.status === 'resolved');
    }
    if (normalizedSql.includes("id = '") || normalizedSql.includes("id='")) {
      const idMatch = sql.match(/id\s*=\s*['"]([^'"]+)['"]/i);
      if (idMatch) {
        const found = pagerdutyIncidents.find(inc => inc.id === idMatch[1]);
        return found ? [found] : [];
      }
    }
    return pagerdutyIncidents;
  }

  // Default Fallback table listing tables
  if (normalizedSql.includes('coral.tables')) {
    return [
      { schema_name: "pagerduty", table_name: "incidents" },
      { schema_name: "sentry", table_name: "events" },
      { schema_name: "github", table_name: "commits" },
      { schema_name: "slack", table_name: "messages" }
    ];
  }

  return [];
}

module.exports = {
  pagerdutyIncidents,
  sentryEvents,
  githubCommits,
  githubPullRequests,
  slackMessages,
  mockQuery
};
