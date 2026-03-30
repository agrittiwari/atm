import { html } from 'hono/jsx-runtime';
import type { Agent } from '../lib/api';

interface AgentPageProps {
  agent: Agent;
}

export function AgentPage({ agent }: AgentPageProps) {
  const createdDate = new Date(agent.createdAt).toLocaleDateString();

  return html`
    <div class="container">
      <a href="/" class="back-link">← Back to Registry</a>
      <div class="agent-detail">
        <div class="agent-detail-header">
          <h1>@${agent.username}/${agent.name}</h1>
          ${agent.verified ? html`<span class="verified-badge">Verified</span>` : ''}
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

        ${agent.capabilities && agent.capabilities.length > 0 ? html`
        <div class="capabilities-section">
          <h2>Capabilities</h2>
          <div class="capabilities-list">
            ${agent.capabilities.map(cap => html`<span class="capability-tag">${cap}</span>`)}
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
  `;
}
