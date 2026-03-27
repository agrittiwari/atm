# ATM (Agent Tool Manager) - Technical Specification

---

## Agenda: Project Orchestration

### Orchestrator Agent (Primary)

The **Orchestrator Agent** is the central coordination unit that manages the entire project lifecycle.

**Responsibilities:**
- Spin up sub-agents for each task area
- Assign work based on spec files in `specs/` directory
- Coordinate parallel execution where possible
- Report progress to human (prompter)
- Request human review upon task completion
- Handle cross-agent dependencies

**Execution Flow:**
```
Human (Prompter) 
    │
    ▼
Orchestrator Agent
    │
    ├──► Sub-Agent 1 (Implementer) ──► Tester Agent 1 (Evaluator)
    │                                      │
    │                                      ▼
    │                               [Pass/Fail] ──► Report to Orchestrator
    │
    ├──► Sub-Agent 2 (Implementer) ──► Tester Agent 2 (Evaluator)
    │                                      │
    │                                      ▼
    │                               [Pass/Fail] ──► Report to Orchestrator
    │
    └──► ... (continues for all sub-agents)
              │
              ▼
         Human Review (Merge Approval)
```

### Sub-Agent Types

| Type | Role | Responsibility |
|------|------|----------------|
| **Implementer** | Builder | Implements the task based on detailed spec |
| **Tester/Evaluator** | Critic | Evaluates work against detailed spec |
| **Orchestrator** | Coordinator | Delegates, tracks, reports, and manages flow |

### Iteration Loop

Each implementer-tester pair operates in a loop:
1. **Implementer** completes work
2. **Tester** evaluates against spec
3. **Pass** → Report to Orchestrator
4. **Fail** → Report issues back to Implementer
5. Repeat steps 1-4 until Pass

### Communication Rules

- **NO cross-communication** between sub-agents
- All communication flows through Orchestrator
- Only report completion when tested and approved
- Human review required for final merge

### Execution Command

To start the orchestrator and begin project execution:

```bash
# From project root
opencode --agent orchestrator --spec SPEC.md

# Or run specific task
opencode --agent orchestrator --task 1 --spec SPEC.md
```

### Orchestrator Entry Point

The orchestrator reads this specification and uses the linked spec files in `specs/` directory to spin up dedicated sub-agents:

| Task | Spec File | Sub-Agent Assignment | Required Skill |
|------|-----------|-----------------------|----------------|
| 1 | [specs/infrastructure.md](./specs/infrastructure.md) | Agent 1: Infrastructure | `d1-drizzle-schema`, `wrangler` |
| 2 | [specs/cli-framework.md](./specs/cli-framework.md) | Agent 2: CLI Framework | - |
| 3 | [specs/registry-worker.md](./specs/registry-worker.md) | Agent 3: Registry Worker | `cloudflare`, `wrangler` |
| 4 | [specs/dynamic-runtime.md](./specs/dynamic-runtime.md) | Agent 4: Dynamic Runtime | `workers-best-practices`, `cloudflare` |
| 5 | [specs/security.md](./specs/security.md) | Agent 5: Security System | `cloudflare`, `wrangler` |
| 6 | [specs/dev-environment.md](./specs/dev-environment.md) | Agent 6: Dev Environment | `wrangler` |

### Skill Enforcement

The Orchestrator **MUST** ensure each sub-agent loads the required skill before starting work:

```bash
# Load skill before task execution
skill name=<skill-name>

# Example for Infrastructure task:
skill name=d1-drizzle-schema
skill name=wrangler
```

**Available Skills Reference:**
| Skill | Purpose |
|-------|---------|
| `cloudflare` | Cloudflare Workers, Pages, KV, R2, D1, AI |
| `wrangler` | Wrangler CLI commands and configurations |
| `workers-best-practices` | Production best practices for Workers |
| `d1-drizzle-schema` | D1 database schema generation with Drizzle ORM |
| `agents-sdk` | Building agents on Cloudflare Workers |
| `find-skills` | Discover and install additional skills |

See [rule.md](./rule.md) for full skill enforcement rules (Rule 11).

### Progress Tracking

Each task has an individual progress file that sub-agents **MUST** update:

| Task | Progress File | Description |
|------|---------------|-------------|
| 1 | [progress/01-infrastructure.md](./progress/01-infrastructure.md) | Task 1 progress |
| 2 | [progress/02-cli-framework.md](./progress/02-cli-framework.md) | Task 2 progress |
| 3 | [progress/03-registry-worker.md](./progress/03-registry-worker.md) | Task 3 progress |
| 4 | [progress/04-dynamic-runtime.md](./progress/04-dynamic-runtime.md) | Task 4 progress |
| 5 | [progress/05-security.md](./progress/05-security.md) | Task 5 progress |
| 6 | [progress/06-dev-environment.md](./progress/06-dev-environment.md) | Task 6 progress |

**Root Progress:** [progress.md](./progress.md) - Orchestrator's view of entire project

### Execution Rules

All sub-agents **MUST** read and follow: [rule.md](./rule.md)

This file contains 10 mandatory rules including:
- No cross-communication between sub-agents
- Read progress before starting
- Update progress immediately
- Test before reporting complete
- Fail fast, report honest

### Reporting Mechanism

1. **Before Work:** Read `rule.md`, check `progress.md`, verify dependencies
2. **During Work:** Update individual progress file after each action
3. **After Work:** Update status to `evaluating`, report to Orchestrator
4. **On Failure:** Update status to `failed`, document reasons, report immediately

---

## Project Overview

ATM is a comprehensive ecosystem for managing AI agents across frameworks. It consists of:
- **ATM CLI**: Developer interface for agent creation and publishing
- **ATM Registry**: Cloudflare-native backbone for agent indexing and dynamic execution

---

## 1. ATM CLI Specification

### 1.1 Core Command: `atm init`

Scaffolds a new agent project and generates the mandatory A2A Agent Card.

**Flags:**
| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `--name` | string | Unique identifier (e.g., `@user/weather-agent`) | Required |
| `--template` | string | Base framework | `cloudflare` |
| `--dynamic` | boolean | Enable "spin up on-the-fly" mode | `false` |
| `--dir` | string | Target directory | Current directory |

**Template Options:**
- `cloudflare`: Standard CF Worker-based agent (default)
- `mastra`: Optimized for Mastra workflows
- `langchain`: Pre-configured for LangChain JS/TS
- `openai`: Minimal wrapper for OpenAI Assistants

### 1.2 The agent.json Manifest

The core contract between CLI and Registry.

```json
{
  "name": "@username/agent-name",
  "version": "1.0.0",
  "description": "Analyzes data via A2A",
  "framework": "mastra",
  "endpoint": "https://agent-url.workers.dev",
  "capabilities": ["data-analysis", "report-generation"],
  "auth": { "type": "bearer" },
  "runtime": "dynamic"
}
```

**Schema Properties:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Globally unique agent identifier with `@username/` prefix |
| `version` | string | Yes | Semantic versioning |
| `description` | string | Yes | Human-readable description |
| `framework` | string | Yes | `cloudflare`, `mastra`, `langchain`, or `openai` |
| `endpoint` | string | Yes | HTTPS endpoint for A2A communication |
| `capabilities` | string[] | Yes | Array of capability tags for discovery |
| `auth` | object | Yes | Authentication configuration |
| `runtime` | string | Yes | `static` or `dynamic` |

---

## 2. ATM Registry App (Cloudflare)

### 2.1 Architecture Overview

The Registry is a Managed Infrastructure Provider deployed on Cloudflare Workers.

### 2.2 Storage & Indexing

**D1 SQL Database:**
- Stores the "Yellow Pages" - agent registry
- Indexes millions of agents by: name, capability, upvote count
- Schema supports high-volume reads and writes

**R2 Object Storage:**
- Stores the "Agent Tarballs" - bundled JS code
- Version-controlled storage for agent releases
- Used by dynamic runtime for on-demand code loading

### 2.3 Dynamic Execution Handler

For agents marked with `runtime: "dynamic"`:

**Flow:**
1. **Request**: A2A message hits `registry.apo.dev/call/@user/agent`
2. **Loader**: Registry Worker pulls agent code from R2
3. **Sandbox**: Executes in isolated V8 sandbox
4. **Response**: Returns result and shuts down isolate (cost-optimized)

---

## 3. Execution & Security Specification

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Mandatory JWT via `atm login`. No token = No publish. |
| **DDoS Protection** | Cloudflare WAF + Rate Limiting per `agent_id` (not just IP) |
| **Upvotes** | Recorded in D1. Only "Verified Agents" can upvote to prevent botting. |
| **P2P A2A** | Hosted agents: Registry acts as DNS. Dynamic agents: Registry acts as Host. |

---

## 4. Local Development (Swarm Setup)

### 4.1 Tmux Configuration

The "Local Cloud" development environment:

| Window | Purpose | Command |
|--------|---------|---------|
| Window 1 | Registry | `wrangler dev` (D1/R2 mock) |
| Window 2 | CLI Dev | Test `atm init` and `atm publish` |
| Window 3 | Tunnel | `cloudflared tunnel` for external A2A agents |
| Window 4 | Multi-Agent Logs | Split-pane view of 3-4 agents interacting |

### 4.2 Development Workflow

1. Start local Registry with mock D1/R2
2. Develop CLI commands against local Registry
3. Use tunnel to test external agent communication
4. Monitor multi-agent interactions in real-time

---

## 5. Project Roadmap

### Phase 1: Infrastructure Foundation
- [ ] Design and implement D1 Schema for millions of agents
- [ ] Implement R2 Upload logic for agent tarballs
- [ ] Set up Registry Worker skeleton

### Phase 2: CLI Development
- [ ] Create CLI with oclif framework
- [ ] Implement `atm init` command with templates
- [ ] Build `agent.json` validation and generation

### Phase 3: Dynamic Runtime
- [ ] Implement Dynamic Worker Loading
- [ ] Build V8 sandbox execution environment
- [ ] Create cost-optimized isolate management

---

## 6. Acceptance Criteria

### CLI
- [ ] `atm init --name @user/agent --template cloudflare` creates valid project
- [ ] `agent.json` is generated with all required fields
- [ ] Templates produce framework-appropriate scaffold

### Registry
- [ ] D1 stores and indexes agents by name, capability, upvotes
- [ ] R2 stores versioned agent tarballs
- [ ] Dynamic agents load and execute from R2

### Security
- [ ] JWT authentication enforced on publish
- [ ] Rate limiting prevents DDoS per agent_id
- [ ] Only verified agents can upvote

### Development
- [ ] Local Registry runs via `wrangler dev`
- [ ] All 4 Tmux windows functional
- [ ] External agents can communicate via tunnel
