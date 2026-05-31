const axios = require('axios');
const { executeQuery, isCoralCliAvailable } = require('./coral');
const { githubPullRequests } = require('./mockData');

const linearKey = process.env.LINEAR_API_KEY;
const jiraApiToken = process.env.JIRA_API_TOKEN;
const confluenceToken = process.env.CONFLUENCE_TOKEN;
const datadogApiKey = process.env.DATADOG_API_KEY;
const datadogAppKey = process.env.DATADOG_APP_KEY;

async function fetchLinearIssues(keyword) {
  // Try Coral first
  try {
    if (isCoralCliAvailable()) {
      const q = `SELECT id, title, status, url FROM linear.issues WHERE title LIKE '%${keyword}%' LIMIT 5`;
      const res = await executeQuery(q);
      if (res && res.length) return res.map(r => ({ id: r.id, title: r.title, status: r.status, url: r.url }));
    }
  } catch (e) {
    // ignore and fallthrough to direct API / mock
  }

  // Direct API fallback (if key present)
  if (linearKey) {
    try {
      const r = await axios.get('https://api.linear.app/graphql', {
        headers: { Authorization: `Bearer ${linearKey}`, 'Content-Type': 'application/json' }
      });
      // For demo purposes we won't parse GraphQL; return empty
      return [];
    } catch (e) {
      // fallback
    }
  }

  return [];
}

async function fetchJiraIssues(keyword) {
  try {
    if (isCoralCliAvailable()) {
      const q = `SELECT id, key, summary as title, status, url FROM jira.issues WHERE summary LIKE '%${keyword}%' LIMIT 5`;
      const res = await executeQuery(q);
      if (res && res.length) return res.map(r => ({ id: r.id || r.key, title: r.title || r.summary, status: r.status, url: r.url }));
    }
  } catch (e) {}

  if (jiraApiToken) {
    try {
      // example basic usage - user must set JIRA_BASE_URL
      const base = process.env.JIRA_BASE_URL;
      if (base) {
        const resp = await axios.get(`${base}/rest/api/2/search?jql=summary~\"${encodeURIComponent(keyword)}\"&maxResults=5`, {
          headers: { Authorization: `Basic ${jiraApiToken}`, Accept: 'application/json' }
        });
        const issues = resp.data.issues || [];
        return issues.map(i => ({ id: i.id, title: i.fields.summary, status: i.fields.status.name, url: `${base}/browse/${i.key}` }));
      }
    } catch (e) {}
  }

  return [];
}

async function fetchConfluenceDocs(keyword) {
  try {
    if (isCoralCliAvailable()) {
      const q = `SELECT id, title, url FROM confluence.pages WHERE title LIKE '%${keyword}%' LIMIT 3`;
      const res = await executeQuery(q);
      if (res && res.length) return res.map(r => ({ id: r.id, title: r.title, url: r.url }));
    }
  } catch (e) {}

  if (confluenceToken && process.env.CONFLUENCE_BASE_URL) {
    try {
      const base = process.env.CONFLUENCE_BASE_URL;
      const resp = await axios.get(`${base}/wiki/rest/api/content/search?cql=title~\"${encodeURIComponent(keyword)}\"&limit=3`, {
        headers: { Authorization: `Bearer ${confluenceToken}`, Accept: 'application/json' }
      });
      const results = resp.data.results || [];
      return results.map(r => ({ id: r.id, title: r.title, url: `${base}/wiki${r._links.webui}` }));
    } catch (e) {}
  }

  return [];
}

async function fetchDatadogMetric(metricName, fromSeconds = 3600) {
  try {
    if (isCoralCliAvailable()) {
      const q = `SELECT timestamp, value FROM datadog.metrics WHERE metric = '${metricName}' AND timestamp >= now() - interval '1 hour'`;
      const res = await executeQuery(q);
      if (res && res.length) return res;
    }
  } catch (e) {}

  if (datadogApiKey && datadogAppKey && process.env.DATADOG_BASE_URL) {
    try {
      const base = process.env.DATADOG_BASE_URL.replace(/\/$/, '');
      const to = Math.floor(Date.now() / 1000);
      const from = to - fromSeconds;
      const url = `${base}/api/v1/query?from=${from}&to=${to}&query=${encodeURIComponent(metricName)}`;
      const resp = await axios.get(url, { headers: { 'DD-API-KEY': datadogApiKey, 'DD-APPLICATION-KEY': datadogAppKey } });
      return resp.data;
    } catch (e) {}
  }

  // Fallback: return empty or sample metric
  return [{ timestamp: Date.now(), value: Math.random() * 100 }];
}

async function fetchTickets(keyword) {
  const linear = await fetchLinearIssues(keyword);
  const jira = await fetchJiraIssues(keyword);
  return [...linear, ...jira];
}

module.exports = {
  fetchLinearIssues,
  fetchJiraIssues,
  fetchConfluenceDocs,
  fetchDatadogMetric,
  fetchTickets
};
