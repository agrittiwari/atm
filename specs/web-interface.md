# Web Interface - Task 7 Specification

## Overview

The Web Interface package (`packages/web`) provides a human-readable UI for the ATM Registry, allowing users to browse and search registered agents.

## Package Structure

```
packages/web/
├── package.json
├── tsconfig.json
├── wrangler.jsonc
├── src/
│   ├── index.ts          # Worker entry
│   ├── router.ts        # Hono router
│   ├── pages/
│   │   ├── home.tsx     # Home page with agent index
│   │   └── agent.tsx    # Agent detail page
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── AgentCard.tsx
│   │   └── AgentGrid.tsx
│   └── lib/
│       └── api.ts       # Registry API client
└── static/
    └── styles.css
```

## UI Requirements

### Home Screen Layout

- **Container Width**: 80% of viewport, centered
- **Header**: "ATM Registry" title, tagline
- **Search Bar**: Full-width search input with placeholder "Search agents by name, capability, or framework..."
- **Agent Grid**: Responsive grid showing agent cards
  - Desktop: 4 columns
  - Tablet: 3 columns
  - Mobile: 1 column

### Agent Card Component

```
┌─────────────────────────────┐
│ @username/agent-name       │
│ ─────────────────────────  │
│ Agent description goes      │
│ here with multiple lines   │
│                             │
│ Framework: Cloudflare      │
│ Runtime: static             │
│ ▲ 42 upvotes               │
└─────────────────────────────┘
```

### Search Functionality

- Client-side filtering of displayed agents
- Search by: agent name, username, description, framework, capabilities
- Real-time results as user types (debounced 300ms)
- "No results found" message when empty

### Agent Detail View

- Full agent metadata display
- Capabilities list with tags
- Upvote button (read-only for unauthenticated)
- Link to agent endpoint

## API Integration

The Web Interface fetches from Registry Worker:

```typescript
// GET /agents - List all agents
interface Agent {
  id: string;
  name: string;
  username: string;
  version: string;
  description: string;
  framework: string;
  endpoint: string;
  capabilities: string[];
  runtime: string;
  upvotes: number;
  verified: boolean;
  created_at: number;
}

// GET /agents/:name - Get single agent
```

## Worker Configuration

### wrangler.jsonc

```jsonc
{
  "name": "atm-web",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "routes": [
    { "pattern": "web.atm.dev", "zone_name": "atm.dev" }
  ],
  "vars": {
    "REGISTRY_URL": "https://registry.atm.dev"
  }
}
```

## Acceptance Criteria

- [ ] Home page renders at /
- [ ] Agent index loads from Registry API
- [ ] Search filters agents in real-time
- [ ] 80% viewport container centered
- [ ] Responsive grid (4/3/1 columns)
- [ ] Agent cards display all key info
- [ ] Agent detail page at /agents/:name
- [ ] Worker deploys via wrangler
- [ ] CSS includes responsive breakpoints

## Dependencies

- hono (HTTP framework)
- @hono/node-server (dev only)
- jsx-runtime for Hono
