import { html } from 'hono/jsx-runtime';
import { AgentCard } from './AgentCard';
import type { Agent } from '../lib/api';

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return html`
      <div class="no-results">
        No agents found matching your search.
      </div>
    `;
  }

  return html`
    <div class="agent-grid">
      ${agents.map(agent => html`<${AgentCard} agent="${agent}" />`)}
    </div>
  `;
}
