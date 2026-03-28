# ATM (Agent Tool Manager) - Technical Specification

---

## Project Overview

ATM is a comprehensive ecosystem for managing AI agents across frameworks. It consists of:
- **ATM CLI**: Developer interface for agent creation and publishing
- **ATM Registry**: Cloudflare-native backbone for agent indexing and dynamic execution

---

## Task Definitions

### Task 1: Infrastructure

**Builder**: Build D1 schema, R2 configuration, database migrations

**Evaluator**: Validate schema correctness, migration success, R2 connectivity

**Depends On**: -

**Required Skills**: `d1-drizzle-schema`, `wrangler`

**Linked Spec**: [specs/infrastructure.md](./specs/infrastructure.md)

**Progress File**: [progress/01-infrastructure.md](./progress/01-infrastructure.md)

---

### Task 2: CLI Framework

**Builder**: Create ATM CLI with oclif, init command, templates, validation, README generation

**Evaluator**: Validate CLI commands work, templates generate correctly, README includes architecture/stack/contributing

**Depends On**: Task 1

**Required Skills**: None (pure Node.js/TypeScript)

**Linked Spec**: [specs/cli-framework.md](./specs/cli-framework.md)

**Progress File**: [progress/02-cli-framework.md](./progress/02-cli-framework.md)

---

### Task 3: Registry Worker

**Builder**: Build Registry Worker with API endpoints, D1/R2 integration

**Evaluator**: Validate API responses, data persistence, R2 operations

**Depends On**: Task 1

**Required Skills**: `cloudflare`, `wrangler`

**Linked Spec**: [specs/registry-worker.md](./specs/registry-worker.md)

**Progress File**: [progress/03-registry-worker.md](./progress/03-registry-worker.md)

---

### Task 4: Dynamic Runtime

**Builder**: Implement V8 sandbox, isolate management, code loading from R2

**Evaluator**: Validate sandbox execution, isolate lifecycle, memory safety

**Depends On**: Task 3

**Required Skills**: `workers-best-practices`, `cloudflare`

**Linked Spec**: [specs/dynamic-runtime.md](./specs/dynamic-runtime.md)

**Progress File**: [progress/04-dynamic-runtime.md](./progress/04-dynamic-runtime.md)

---

### Task 5: Security System

**Builder**: Implement JWT auth, rate limiting, WAF, verified upvotes

**Evaluator**: Validate auth flow, rate limits enforced, security headers

**Depends On**: Task 2, Task 3

**Required Skills**: `cloudflare`, `wrangler`

**Linked Spec**: [specs/security.md](./specs/security.md)

**Progress File**: [progress/05-security.md](./progress/05-security.md)

---

### Task 6: Development Environment

**Builder**: Create Tmux swarm, dev scripts, tunnel configuration

**Evaluator**: Validate all windows start, tunnel works, logs display

**Depends On**: All other tasks

**Required Skills**: `wrangler`

**Linked Spec**: [specs/dev-environment.md](./specs/dev-environment.md)

**Progress File**: [progress/06-dev-environment.md](./progress/06-dev-environment.md)

---

## Sub-Agent Prompts

### Task 1: Infrastructure

**Builder Prompt:**
```
You are the Builder Agent for Task 1: Infrastructure.

## Your Mission
Implement the database schema, R2 configuration, and migrations for the ATM Registry.

## Required Files to Create

### 1. D1 Schema (packages/db/schema.ts)
Create a Drizzle ORM schema with:
- `agents` - id, name, username, version, description, framework, endpoint, capabilities (JSON), auth_config (JSON), runtime, upvotes, verified, created_at, updated_at
- `agent_capabilities` - for efficient capability searching
- `upvotes` - with unique constraint on (agent_id, voter_id)

Use D1-correct patterns:
- UUID primary keys using $defaultFn(() => crypto.randomUUID())
- Timestamps as Unix epoch milliseconds (integer)
- Boolean stored as integer (0/1)

### 2. R2 Configuration (wrangler.jsonc)
Configure R2 bucket:
- Binding: AGENT_TARBALLS
- Bucket: agent-tarballs

### 3. Migration Scripts (migrations/)
Create idempotent SQL migrations

## Acceptance Criteria
- [ ] All D1 tables created with proper indexes
- [ ] Schema supports millions of agents
- [ ] Capabilities efficiently queryable
- [ ] Upvotes prevent duplicate voting per user
- [ ] R2 bucket configured for agent tarballs
- [ ] Migration scripts are idempotent

## Rules
1. Read and follow rule.md
2. Update progress/01-infrastructure.md after each action
3. Use timestamp: YYYY-MM-DD HH:MM:SS
4. Do not communicate with other agents
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 1: Infrastructure.

## Your Mission
Validate the Builder's implementation against acceptance criteria.

## Validation Steps
1. Read packages/db/schema.ts
2. Verify D1-correct patterns (no native BOOLEAN/DATETIME)
3. Check wrangler.jsonc R2 configuration
4. Verify migration scripts are idempotent

## Acceptance Criteria
- [ ] All D1 tables created with proper indexes
- [ ] Schema supports millions of agents
- [ ] Capabilities efficiently queryable
- [ ] Upvotes prevent duplicate voting per user
- [ ] R2 bucket configured for agent tarballs
- [ ] Migration scripts are idempotent

## Rules
1. Read and follow rule.md
2. Update progress/01-infrastructure.md with result
```

---

### Task 2: CLI Framework

**Builder Prompt:**
```
You are the Builder Agent for Task 2: CLI Framework.

## Your Mission
Create the ATM CLI using oclif framework with atm init command and framework templates.

## Required Files

### 1. CLI Project Setup
- packages/cli/ with oclif, TypeScript, ESLint

### 2. atm init Command (packages/cli/src/commands/init.ts)
Flags:
- --name (required): @username/agent-name format
- --template: cloudflare, mastra, langchain, openai (default: cloudflare)
- --dynamic: boolean (default: false)
- --dir: target directory

Behavior:
1. Validate name format
2. Create target directory
3. Generate agent.json
4. Copy template files
5. If --dynamic, set runtime: "dynamic"
6. Run npm install

### 3. README Generation
Each template must generate README.md with:
- Architecture section
- Stack section
- Contributing guide

## Acceptance Criteria
- [ ] atm init creates valid project
- [ ] agent.json passes validation
- [ ] All 4 templates work
- [ ] --dynamic flag sets runtime
- [ ] Dependencies install
- [ ] README.md has Architecture/Stack/Contributing

## Rules
1. Read and follow rule.md
2. Update progress/02-cli-framework.md
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 2: CLI Framework.

## Your Mission
Validate CLI implementation against acceptance criteria.

## Validation
1. Check init command handles all flags
2. Verify all 4 templates exist and are valid
3. Verify README generation has Architecture/Stack/Contributing
4. Test npm install execution

## Acceptance Criteria
- [ ] atm init creates valid project
- [ ] agent.json passes validation
- [ ] All 4 templates work
- [ ] --dynamic flag sets runtime
- [ ] Dependencies install
- [ ] README.md has Architecture/Stack/Contributing

## Rules
1. Read and follow rule.md
2. Update progress/02-cli-framework.md with result
```

---

### Task 3: Registry Worker

**Builder Prompt:**
```
You are the Builder Agent for Task 3: Registry Worker.

## Your Mission
Build the Cloudflare Registry Worker with API endpoints, D1/R2 integration.

## Required Skills
Load: cloudflare, wrangler

## Files to Create

### packages/registry/src/
- index.ts - Worker entry
- router.ts - Hono router
- handlers/register.ts - POST /agents
- handlers/get.ts - GET /agents/:name
- handlers/search.ts - GET /agents?capability=...
- handlers/publish.ts - POST /agents/:name/publish (R2)
- handlers/upvote.ts - POST /agents/:name/upvote
- db/agents.ts - Agent CRUD
- db/upvotes.ts - Upvote operations

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /agents | Register agent |
| GET | /agents/:name | Get agent |
| GET | /agents | Search |
| POST | /agents/:name/publish | Upload tarball |
| POST | /agents/:name/upvote | Upvote |
| DELETE | /agents/:name | Unregister |

## Acceptance Criteria
- [ ] All 6 API endpoints work
- [ ] D1 queries with indexes
- [ ] R2 upload/download works
- [ ] Upvote prevents duplicates
- [ ] Verified check on upvote
- [ ] Proper JSON errors

## Rules
1. Read rule.md
2. Update progress/03-registry-worker.md
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 3: Registry Worker.

## Validation
1. Verify all 6 endpoints exist
2. Check D1 indexes
3. Verify R2 format: tarballs/{agent}/{version}.tar.gz
4. Check duplicate vote prevention
5. Verify verified check on upvote

## Acceptance Criteria
- [ ] All 6 API endpoints work
- [ ] D1 queries with indexes
- [ ] R2 upload/download works
- [ ] Upvote prevents duplicates
- [ ] Verified check on upvote
- [ ] Proper JSON errors

## Rules
1. Read rule.md
2. Update progress/03-registry-worker.md
```

---

### Task 4: Dynamic Runtime

**Builder Prompt:**
```
You are the Builder Agent for Task 4: Dynamic Runtime.

## Mission
Implement V8 sandbox, isolate management, code loading from R2.

## Required Skills
Load: workers-best-practices, cloudflare

## Files to Create

### packages/registry/src/runtime/
- loader.ts - Load code from R2 tarball
- sandbox.ts - V8 execution with limits
- isolate-manager.ts - Pool management
- lifecycle.ts - Warmup/shutdown

### packages/registry/src/handlers/call.ts
Handle A2A calls to dynamic agents

## Default Limits
- 128MB memory
- 1000ms CPU
- 5000ms timeout

## Acceptance Criteria
- [ ] Code loads from R2
- [ ] V8 sandbox isolates
- [ ] Memory/CPU limits enforced
- [ ] Timeout kills long runs
- [ ] Isolate pool efficient
- [ ] Hot path reuse

## Rules
1. Read rule.md
2. Update progress/04-dynamic-runtime.md
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 4: Dynamic Runtime.

## Validation
1. Verify R2 loader works
2. Check V8 isolation (Worker class, not new Function)
3. Verify memory/CPU enforcement
4. Check timeout
5. Verify pool management

## Acceptance Criteria
- [ ] Code loads from R2
- [ ] V8 sandbox isolates
- [ ] Memory/CPU limits enforced
- [ ] Timeout kills long runs
- [ ] Isolate pool efficient
- [ ] Hot path reuse

## Rules
1. Read rule.md
2. Update progress/04-dynamic-runtime.md
```

---

### Task 5: Security System

**Builder Prompt:**
```
You are the Builder Agent for Task 5: Security System.

## Mission
Implement JWT auth, rate limiting, WAF, verified upvotes.

## Required Skills
Load: cloudflare, wrangler

## Files

### packages/registry/src/middleware/
- auth.ts - JWT verify/generate, authMiddleware
- rate-limit.ts - Rate limit by agent_id
- verified-upvote.ts - Verified voter check

### packages/cli/src/commands/login.ts
atm login - stores JWT in ~/.atm/credentials

### wrangler.jsonc
Add WAF_ENABLED, KV for rate limiting

## Rate Limits
- read: 1000 req/min
- write: 10 req/min
- upvote: 10 votes/hour

## Acceptance Criteria
- [ ] JWT required for writes
- [ ] Invalid JWT returns 401
- [ ] Rate limit per agent_id
- [ ] Rate headers in response
- [ ] Only verified upvote
- [ ] Non-verified 403
- [ ] atm login works
- [ ] CLI uses JWT

## Rules
1. Read rule.md
2. Update progress/05-security.md
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 5: Security System.

## Validation
1. Check JWT on POST /agents
2. Verify rate limit uses agent_id not IP
3. Verify verified check
4. Test login command

## Acceptance Criteria
- [ ] JWT required for writes
- [ ] Invalid JWT returns 401
- [ ] Rate limit per agent_id
- [ ] Rate headers in response
- [ ] Only verified upvote
- [ ] Non-verified 403
- [ ] atm login works
- [ ] CLI uses JWT

## Rules
1. Read rule.md
2. Update progress/05-security.md
```

---

### Task 6: Development Environment

**Builder Prompt:**
```
You are the Builder Agent for Task 6: Dev Environment.

## Mission
Create Tmux swarm, dev scripts, tunnel config.

## Files

### scripts/swarm.sh
4 windows:
1. registry: wrangler dev --port 8787
2. cli-dev: npm link && npm run watch
3. tunnel: cloudflared tunnel --url http://localhost:8787
4. logs: tail -f /tmp/agent{1,2,3}.log

### scripts/dev.sh
Check prerequisites, run swarm

### .dev.vars
JWT_SECRET, REGISTRY_URL, R2_BUCKET_NAME

### docker-compose.yaml
cloudflare/workers-local on 8787

### docs/local-development.md
Setup guide, troubleshooting

### .gitignore
Add .dev.vars

## Acceptance Criteria
- [ ] swarm.sh works
- [ ] Registry at localhost:8787
- [ ] Tunnel accessible
- [ ] Logs window works
- [ ] CLI rebuilds
- [ ] Scripts executable

## Rules
1. Read rule.md
2. Update progress/06-dev-environment.md
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task 6: Dev Environment.

## Validation
1. Check scripts have shebang, are executable
2. Verify 4 windows configured
3. Check .dev.vars in .gitignore

## Acceptance Criteria
- [ ] swarm.sh works
- [ ] Registry at localhost:8787
- [ ] Tunnel accessible
- [ ] Logs window works
- [ ] CLI rebuilds
- [ ] Scripts executable

## Rules
1. Read rule.md
2. Update progress/06-dev-environment.md
```

---

## Execution Order

```
Task 1 (Infrastructure)
    │
    ├─ Task 2 (CLI Framework) ──┐
    └─ Task 3 (Registry Worker) ─┼─► Task 4 (Dynamic Runtime)
                                  │
                                  └─► Task 5 (Security)
                                       │
                                       └─► Task 6 (Dev Env)
                                            │
                                            └─► Human Review
```

---

## Skills Reference

| Task | Skills |
|------|--------|
| 1 | d1-drizzle-schema, wrangler |
| 2 | - |
| 3 | cloudflare, wrangler |
| 4 | workers-best-practices, cloudflare |
| 5 | cloudflare, wrangler |
| 6 | wrangler |

---

## Acceptance Criteria Summary

### CLI
- atm init --name @user/agent creates project
- agent.json with all fields
- 4 templates work
- README has Architecture/Stack/Contributing

### Registry
- D1 stores/indexes agents
- R2 stores tarballs
- Dynamic agents load from R2

### Security
- JWT on publish
- Rate limiting per agent_id
- Verified upvote only

### Dev
- wrangler dev works
- 4 Tmux windows
- Tunnel for external agents
