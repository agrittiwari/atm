# Task 3: Registry Worker - Detailed Specification

## Overview

Build the Cloudflare Registry Worker with API endpoints for agent registration, search, and R2 tarball management.

## Required Skills

**MUST load before starting:**
```bash
skill name=cloudflare
skill name=wrangler
```

| Skill | Purpose |
|-------|---------|
| `cloudflare` | Build Cloudflare Workers with D1, R2, KV |
| `wrangler` | Configure Workers, bindings, and deployments |

---

## Deliverables

### 1. Worker Structure

Create `packages/registry/` with:
```
src/
├── index.ts          # Worker entry point
├── router.ts         # Request routing
├── handlers/
│   ├── register.ts   # POST /agents
│   ├── get.ts        # GET /agents/:name
│   ├── search.ts     # GET /agents?capability=...
│   ├── publish.ts    # POST /agents/:name/publish (R2 upload)
│   └── upvote.ts     # POST /agents/:name/upvote
└── db/
    ├── agents.ts     # Agent CRUD operations
    └── upvotes.ts    # Upvote operations
```

### 2. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents` | Register new agent |
| GET | `/agents/:name` | Get agent by name |
| GET | `/agents` | Search agents (query params: capability, limit, offset) |
| POST | `/agents/:name/publish` | Upload tarball to R2 |
| POST | `/agents/:name/upvote` | Upvote an agent |
| DELETE | `/agents/:name` | Unregister agent |

### 3. D1 Integration

Implement database operations in `src/db/agents.ts`:

```typescript
// Create agent
async function createAgent(manifest: AgentManifest): Promise<Agent>

// Get agent by name
async function getAgent(name: string): Promise<Agent | null>

// Search by capability
async function searchByCapability(capability: string, limit: number, offset: number): Promise<Agent[]>

// Get top agents
async function getTopAgents(limit: number): Promise<Agent[]>

// Update agent
async function updateAgent(name: string, updates: Partial<AgentManifest>): Promise<Agent>

// Delete agent
async function deleteAgent(name: string): Promise<void>
```

### 4. R2 Integration

Implement tarball management in `src/handlers/publish.ts`:

```typescript
// Upload tarball
async function uploadTarball(
  agentName: string,
  version: string,
  body: ReadableStream
): Promise<string> // Returns R2 object key

// Get tarball URL
async function getTarballUrl(agentName: string, version: string): Promise<string | null>

// Delete tarball
async function deleteTarball(agentName: string, version: string): Promise<void>
```

### 5. Upvote System

Implement in `src/handlers/upvote.ts`:

```typescript
// Upvote an agent
async function upvote(agentName: string, voterId: string): Promise<{ success: boolean }>

// Check if user upvoted
async function hasUpvoted(agentName: string, voterId: string): Promise<boolean>
```

**Rules:**
- Only verified agents can upvote (check `verified` flag)
- One upvote per user per agent
- Increment agent upvote count

---

## Acceptance Criteria

- [ ] All 6 API endpoints respond correctly
- [ ] D1 queries work with proper indexes
- [ ] R2 upload/download works for tarballs
- [ ] Upvote system prevents duplicate votes
- [ ] Verified agent check enforced on upvote
- [ ] Error responses are proper JSON with status codes

---

## Implementation Notes

- Use Hono for routing in Workers
- Validate JWT on protected routes
- Use transactions for upvote + count update
- R2 object key format: `tarballs/{agent-name}/{version}.tar.gz`
