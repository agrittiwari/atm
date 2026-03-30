import { html } from 'hono/jsx-runtime';
import type { Agent } from '../lib/api';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const link = `/agents/${agent.username}/${agent.name}`;
  
  return html`
    <a href="${link}" class="agent-card">
      <div class="agent-card-header">
        <span class="agent-name">@${agent.username}/${agent.name}</span>
        ${agent.verified ? html`<span class="verified-badge">✓</span>` : ''}
      </div>
      <div class="agent-card-divider"></div>
      <p class="agent-description">${agent.description || 'No description'}</p>
      <div class="agent-meta">
        <span>Framework: ${agent.framework}</span>
        <span>Runtime: ${agent.runtime}</span>
      </div>
      <div class="agent-card-footer">
        <span class="upvotes">▲ ${agent.upvotes || 0} upvotes</span>
      </div>
    </a>
  `;
}
