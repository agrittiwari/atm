# ATM Project - Orchestration & Division of Labor

This document defines the orchestration logic, sub-agent responsibilities, and delegation framework for the ATM project.

---

## Orchestrator Agent - Core Logic

### Overview

The **Orchestrator Agent** is the central controller that manages project execution. It spins up sub-agents, tracks progress, handles dependencies, and reports to the human prompter.

### Responsibilities

1. **Task Delegation**: Assign work to sub-agents based on spec files
2. **Dependency Management**: Ensure correct order of task execution
3. **Progress Tracking**: Monitor status of each sub-agent
4. **Quality Control**: Route work through evaluator agents
5. **Reporting**: Communicate status to human prompter
6. **Merge Approval**: Request human review when work passes evaluation

### Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Read SPEC.md for project overview                          │
│  2. Identify task list from roadmap                            │
│  3. Check dependencies (topological sort)                     │
│  4. Load required skills for Task N                            │
│  5. Spin up Implementer Agent for Task N                       │
│  6. Wait for completion                                         │
│  7. Spin up Tester Agent to evaluate                            │
│  8. If Fail: Loop to step 4 (with feedback)                   │
│  9. If Pass: Mark complete, Move to next task                  │
│ 10. Repeat until all tasks complete                            │
│ 11. Request Human Review                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Skill Loading Step:**
- Before spinning up any sub-agent, Orchestrator **MUST** load the required skill
- Use: `skill name=<skill-name>`
- See [rule.md](./rule.md) Rule 11 for skill requirements
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Read SPEC.md for project overview                          │
│  2. Identify task list from roadmap                            │
│  3. Check dependencies (topological sort)                     │
│  4. Spin up Implementer Agent for Task N                       │
│  5. Wait for completion                                         │
│  6. Spin up Tester Agent to evaluate                            │
│  7. If Fail: Loop to step 4 (with feedback)                    │
│  8. If Pass: Mark complete, Move to next task                  │
│  9. Repeat until all tasks complete                            │
│ 10. Request Human Review                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sub-Agent Specifications

### Task Type 1: Infrastructure

**Implementer**: Builds D1 schema, R2 configuration, database migrations

**Tester**: Validates schema correctness, migration success, R2 connectivity

**Linked Spec**: [specs/infrastructure.md](./specs/infrastructure.md)

**Progress File**: [progress/01-infrastructure.md](./progress/01-infrastructure.md)

**Required Skills**: `d1-drizzle-schema`, `wrangler`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 2: CLI Framework

**Implementer**: Creates oclif CLI, init command, templates, validation

**Tester**: Validates CLI commands work, templates generate correctly

**Linked Spec**: [specs/cli-framework.md](./specs/cli-framework.md)

**Progress File**: [progress/02-cli-framework.md](./progress/02-cli-framework.md)

**Required Skills**: None (pure Node.js/TypeScript)

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 3: Registry Worker

**Implementer**: Builds Registry Worker, API endpoints, D1/R2 integration

**Tester**: Validates API responses, data persistence, R2 operations

**Linked Spec**: [specs/registry-worker.md](./specs/registry-worker.md)

**Progress File**: [progress/03-registry-worker.md](./progress/03-registry-worker.md)

**Required Skills**: `cloudflare`, `wrangler`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 4: Dynamic Runtime

**Implementer**: Implements V8 sandbox, isolate management, code loading

**Tester**: Validates sandbox execution, isolate lifecycle, memory safety

**Linked Spec**: [specs/dynamic-runtime.md](./specs/dynamic-runtime.md)

**Progress File**: [progress/04-dynamic-runtime.md](./progress/04-dynamic-runtime.md)

**Required Skills**: `workers-best-practices`, `cloudflare`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 5: Security System

**Implementer**: Implements JWT auth, rate limiting, WAF, verified upvotes

**Required Skills**: `cloudflare`, `wrangler`

**Tester**: Validates auth flow, rate limits enforced, security headers

**Linked Spec**: [specs/security.md](./specs/security.md)

**Progress File**: [progress/05-security.md](./progress/05-security.md)

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 6: Development Environment

**Implementer**: Creates Tmux swarm, dev scripts, tunnel configuration

**Required Skills**: `wrangler`

**Tester**: Validates all windows start, tunnel works, logs display

**Linked Spec**: [specs/dev-environment.md](./specs/dev-environment.md)

**Progress File**: [progress/06-dev-environment.md](./progress/06-dev-environment.md)

**Enforced Rules**: [rule.md](./rule.md)

---

## Execution Order (Dependency Graph)

```
                    ┌──────────────┐
                    │  START       │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Infrastructure│ ◄── Task 1 (specs/infrastructure.md)
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │  CLI Framework  │       │ Registry Worker │
    │  (Task 2)       │       │  (Task 3)       │
    └────────┬────────┘       └────────┬────────┘
              │                         │
              │                         └────────┐
              │                                   │
              │                                   ▼
              │                        ┌─────────────────┐
              │                        │ Dynamic Runtime │
              │                        │  (Task 4)       │
              │                        └────────┬────────┘
              │                                   │
              └─────────────┬─────────────────────┘
                            │
                            ▼
                 ┌────────────────────┐
                 │    Security        │ ◄── Task 5 (specs/security.md)
                 └──────────┬─────────┘
                            │
                            ▼
                 ┌────────────────────┐
                 │  Dev Environment   │ ◄── Task 6 (specs/dev-environment.md)
                 └──────────┬─────────┘
                            │
                            ▼
                 ┌────────────────────┐
                 │   HUMAN REVIEW      │
                 └────────────────────┘
```

### Dependency Rules

| Task | Depends On | Can Run Parallel |
|------|------------|-------------------|
| Infrastructure | - | - |
| CLI Framework | Infrastructure | Registry Worker |
| Registry Worker | Infrastructure | CLI Framework |
| Dynamic Runtime | Registry Worker | - |
| Security | CLI Framework, Registry Worker | - |
| Dev Environment | All other tasks | - |

---

## Progress Tracking System

### Overview

Each sub-agent must maintain progress in two locations:
1. **Individual Progress File** (`progress/XX-task-name.md`) - Task-specific updates
2. **Root Progress File** (`progress.md`) - Orchestrator's view of entire project

### Progress Files

| Task | Individual Progress File | Root Entry |
|------|-------------------------|------------|
| 1 | [progress/01-infrastructure.md](./progress/01-infrastructure.md) | Task 1: Infrastructure |
| 2 | [progress/02-cli-framework.md](./progress/02-cli-framework.md) | Task 2: CLI Framework |
| 3 | [progress/03-registry-worker.md](./progress/03-registry-worker.md) | Task 3: Registry Worker |
| 4 | [progress/04-dynamic-runtime.md](./progress/04-dynamic-runtime.md) | Task 4: Dynamic Runtime |
| 5 | [progress/05-security.md](./progress/05-security.md) | Task 5: Security System |
| 6 | [progress/06-dev-environment.md](./progress/06-dev-environment.md) | Task 6: Dev Environment |

### Progress Status Values

| Status | Meaning | Valid Transitions |
|--------|---------|-------------------|
| `pending` | Task not yet started | → in_progress |
| `in_progress` | Currently working | → evaluating, failed |
| `evaluating` | Tester reviewing | → passed, failed |
| `passed` | Tester approved | → complete |
| `failed` | Issues found | → in_progress |
| `complete` | Human approved | - (terminal) |

---

## Reporting Mechanism

### Sub-Agent Reporting Rules

Every sub-agent **MUST** follow this reporting protocol:

1. **Before Starting Work:**
   - Read `rule.md` (mandatory)
   - Read individual progress file
   - Read root `progress.md`
   - Check dependencies are met

2. **During Work:**
   - Update individual progress file after each significant action
   - Use exact timestamp format: `YYYY-MM-DD HH:MM:SS`
   - Include clear action descriptions
   - Never skip progress updates

3. **After Completing Work:**
   - Run validation against spec acceptance criteria
   - Update status to `evaluating` (tester will take over)
   - Add summary to progress file
   - Report completion to Orchestrator

4. **On Failure:**
   - Update status to `failed`
   - Document failure reasons clearly
   - Specify what needs fixing
   - Report immediately to Orchestrator

### Progress Update Template

```markdown
## Progress Log

| Timestamp | Action | Status | Details |
|-----------|--------|--------|---------|
| 2026-03-27 10:30:00 | Started work | in_progress | Implementing D1 schema |
| 2026-03-27 10:45:00 | Completed agents table | in_progress | Created with all indexes |
| 2026-03-27 11:00:00 | Ready for testing | evaluating | All tables created |
```

### Root Progress Update

After any status change, sub-agent must also summarize in root `progress.md`:
- Update task status in table
- Add entry to Execution Log
- Note next action or blocker

---

## Orchestrator Progress Check

### Startup Sequence

When Orchestrator Agent starts:

1. **Read Root Progress:** Parse `progress.md` to get overall project status
2. **Check Dependencies:** Verify dependent tasks are complete
3. **Spawn Sub-Agent:** Only if:
   - Task status is `pending`
   - All dependencies show `complete` in root progress
   - No blockers reported

### Context Restoration

Orchestrator reads progress to restore context:
- Which tasks completed
- Which tasks failed and why
- What blockers exist
- What next task can be started

### Validation Before Spawn

Orchestrator will **reject** spawning if:
- Task already `in_progress` or `complete`
- Dependencies not met (not `complete`)
- Blocker exists in progress file

---

## Rules Enforcement

### Mandatory Rule File

All sub-agents **MUST** read and follow: [rule.md](./rule.md)

### Rule Summary

| Rule | Description | Violation Result |
|------|-------------|------------------|
| 1 | No cross-communication | Immediate failure |
| 2 | Read progress before starting | Work rejected |
| 3 | Update progress immediately | Progress reset |
| 4 | Test before complete | Returned for testing |
| 5 | Fail fast, report honest | Escalation |
| 6 | Stay within scope | Work rejected |
| 7 | No code without validation | Returned for validation |
| 8 | Respect dependencies | Not spawned |
| 9 | Clean context on exit | Incomplete marking |
| 10 | Human review is final | Not merged |

---

## Reporting Protocol

### Status Messages to Human

| Status | Meaning |
|--------|---------|
| `Task <N> Started` | Implementer has begun work |
| `Task <N> Evaluating` | Tester is reviewing |
| `Task <N> Passed` | Tester approved the work |
| `Task <N> Failed - Retrying` | Tester found issues, implementer fixing |
| `Task <N> Complete` | Passed and ready for merge |
| `All Tasks Complete` | Project ready for human review |

### Report Format

```
## Orchestrator Report - <Timestamp>

### Completed Tasks
- [x] Task 1: Infrastructure (Passed)

### Current Tasks
- [>] Task 2: CLI Framework (Evaluating...)

### Pending Tasks
- [ ] Task 3: Registry Worker
- [ ] Task 4: Dynamic Runtime
- [ ] Task 5: Security System
- [ ] Task 6: Dev Environment

### Next Action
Waiting for Tester 2 evaluation report...
```

---

## Communication Constraints

1. **DO NOT** cross-communicate between sub-agents
2. **DO NOT** work on other sub-agent's tasks
3. **DO** report completion only when tested and approved
4. **DO** escalate blockers to orchestrator immediately

---

## Running the Orchestrator

```bash
# Start orchestration from project root
opencode --agent orchestrator --spec SPEC.md

# Or run specific task only
opencode --agent orchestrator --task 1 --spec SPEC.md
```

---

## Files Structure

```
atm/
├── SPEC.md                    # Main technical specification
├── agent.md                   # Orchestration logic (this file)
├── rule.md                    # Execution rules (mandatory for all agents)
├── progress.md                # Root progress tracker (Orchestrator view)
├── specs/
│   ├── infrastructure.md      # Task 1 detailed spec
│   ├── cli-framework.md      # Task 2 detailed spec
│   ├── registry-worker.md     # Task 3 detailed spec
│   ├── dynamic-runtime.md     # Task 4 detailed spec
│   ├── security.md            # Task 5 detailed spec
│   └── dev-environment.md    # Task 6 detailed spec
├── progress/
│   ├── 01-infrastructure.md  # Task 1 progress (Agent 1)
│   ├── 02-cli-framework.md   # Task 2 progress (Agent 2)
│   ├── 03-registry-worker.md # Task 3 progress (Agent 3)
│   ├── 04-dynamic-runtime.md # Task 4 progress (Agent 4)
│   ├── 05-security.md         # Task 5 progress (Agent 5)
│   └── 06-dev-environment.md # Task 6 progress (Agent 6)
└── ... (project files)
```

---

## Quick Reference

| Item | File | Purpose |
|------|------|---------|
| Main Spec | `SPEC.md` | Project overview and requirements |
| Orchestration | `agent.md` | Delegation and flow logic |
| Rules | `rule.md` | **MANDATORY** - All agents must read |
| Root Progress | `progress.md` | Orchestrator tracks all tasks |
| Task Specs | `specs/*.md` | Detailed implementation spec |
| Task Progress | `progress/*.md` | Individual agent progress |
