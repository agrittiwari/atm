import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from 'hono/html';
import { createApiClient } from './lib/api';
import type { Agent } from './lib/api';

export interface Env {
  REGISTRY_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/', async (c) => {
  const api = createApiClient(c.env);
  let agents: Agent[] = [];
  try {
    agents = await api.getAgents();
  } catch (e) {
    console.error('Failed to fetch agents:', e);
  }
  return html(renderHomePage(agents));
});

app.get('/agents/:name', async (c) => {
  const name = c.req.param('name');
  const api = createApiClient(c.env);
  let agent: Agent | null = null;
  try {
    agent = await api.getAgent(name);
  } catch (e) {
    console.error('Failed to fetch agent:', e);
  }
  if (!agent) {
    return c.html(renderErrorPage('Agent not found'), 404);
  }
  return html(renderAgentPage(agent));
});

function renderHomePage(agents: Agent[]): string {
  const agentsJson = JSON.stringify(agents);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATM Registry</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>ATM Registry</h1>
      <p class="tagline">Discover and deploy AI agents</p>
    </header>
    <div class="search-section">
      <input type="text" id="search-input" class="search-input" placeholder="Search agents by name, capability, or framework...">
    </div>
    <div id="agent-grid" class="agent-grid"></div>
    <div id="no-results" class="no-results" style="display: none;">
      No agents found matching your search.
    </div>
  </div>
  <script>
    const agents = ${agentsJson};
    const searchInput = document.getElementById('search-input');
    const agentGrid = document.getElementById('agent-grid');
    const noResults = document.getElementById('no-results');

    function renderAgents(agentList) {
      if (agentList.length === 0) {
        agentGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
      }
      noResults.style.display = 'none';
      agentGrid.innerHTML = agentList.map(agent => \`
        <a href="/agents/\${agent.username}/\${agent.name}" class="agent-card">
          <div class="agent-card-header">
            <span class="agent-name">@\${agent.username}/\${agent.name}</span>
            \${agent.verified ? '<span class="verified-badge">✓</span>' : ''}
          </div>
          <div class="agent-card-divider"></div>
          <p class="agent-description">\${agent.description || 'No description'}</p>
          <div class="agent-meta">
            <span>Framework: \${agent.framework}</span>
            <span>Runtime: \${agent.runtime}</span>
          </div>
          <div class="agent-card-footer">
            <span class="upvotes">▲ \${agent.upvotes || 0} upvotes</span>
          </div>
        </a>
      \`).join('');
    }

    function filterAgents(query) {
      const q = query.toLowerCase();
      if (!q) return agents;
      return agents.filter(agent => {
        return agent.name.toLowerCase().includes(q) ||
               agent.username.toLowerCase().includes(q) ||
               agent.description?.toLowerCase().includes(q) ||
               agent.framework.toLowerCase().includes(q) ||
               agent.capabilities?.some(c => c.toLowerCase().includes(q));
      });
    }

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderAgents(filterAgents(e.target.value));
      }, 300);
    });

    renderAgents(agents);
  </script>
</body>
</html>`;
}

function renderAgentPage(agent: Agent): string {
  const createdDate = new Date(agent.createdAt).toLocaleDateString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@${agent.username}/${agent.name} - ATM Registry</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Registry</a>
    <div class="agent-detail">
      <div class="agent-detail-header">
        <h1>@${agent.username}/${agent.name}</h1>
        ${agent.verified ? '<span class="verified-badge">Verified</span>' : ''}
      </div>
      <p class="agent-detail-description">${agent.description || 'No description available.'}</p>
      
      <div class="agent-detail-meta">
        <div class="meta-item">
          <span class="meta-label">Framework</span>
          <span class="meta-value">${agent.framework}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Runtime</span>
          <span class="meta-value">${agent.runtime}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Version</span>
          <span class="meta-value">${agent.version}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Published</span>
          <span class="meta-value">${createdDate}</span>
        </div>
      </div>

      ${agent.capabilities && agent.capabilities.length > 0 ? `
      <div class="capabilities-section">
        <h2>Capabilities</h2>
        <div class="capabilities-list">
          ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      <div class="agent-detail-actions">
        <div class="upvote-section">
          <button class="upvote-button" disabled title="Login to upvote">
            ▲ ${agent.upvotes || 0} Upvotes
          </button>
          <p class="upvote-hint">Login to upvote this agent</p>
        </div>
        <a href="${agent.endpoint}" class="endpoint-link" target="_blank">
          View Agent →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - ATM Registry</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Registry</a>
    <div class="error-page">
      <h1>${message}</h1>
      <p>The agent you're looking for doesn't exist or has been removed.</p>
    </div>
  </div>
</body>
</html>`;
}

export const router = app;
