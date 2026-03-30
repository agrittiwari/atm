import { html } from 'hono/jsx-runtime';
import { SearchBar } from '../components/SearchBar';
import { AgentGrid } from '../components/AgentGrid';
import type { Agent } from '../lib/api';

interface HomePageProps {
  agents: Agent[];
}

export function HomePage({ agents }: HomePageProps) {
  return html`
    <div class="container">
      <header class="header">
        <h1>ATM Registry</h1>
        <p class="tagline">Discover and deploy AI agents</p>
      </header>
      <${SearchBar} onSearch="${(query: string) => {}}" />
      <${AgentGrid} agents="${agents}" />
    </div>
  `;
}
