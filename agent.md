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
7. **Multi-Agent Orchestration**: Coordinate Builder and Evaluator subagents working in parallel

### Multi-Agent Orchestration

When **clarity is established** for subagents (meaning the task scope, requirements, and acceptance criteria are clearly defined), the Orchestrator spins up two parallel subagents:

#### Builder Agent
- Executes the implementation work for a given task
- Works independently on their assigned subtask
- Reports completion to Orchestrator only
- Updates progress files autonomously

#### Evaluator Agent
- Validates the Builder's output against acceptance criteria
- Works independently, not communicating with Builder
- Reports pass/fail status to Orchestrator
- Provides feedback for failures

#### Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATION                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Read SPEC.md for project overview                          │
│  2. Identify task list from roadmap                            │
│  3. Check dependencies (topological sort)                     │
│  4. For each task with clarity:                                │
│     a. Load required skills                                   │
│     b. Spin up BUILDER Agent (independent work)              │
│     c. Spin up EVALUATOR Agent (parallel evaluation)          │
│     d. Both agents work independently                          │
│     e. Wait for both to report                                 │
│  5. If Evaluator Pass: Mark task complete                      │
│  6. If Evaluator Fail: Feedback to Builder, retry              │
│  7. Continue to next task                                       │
│  8. Request Human Review when all complete                     │
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

**Builder**: Builds D1 schema, R2 configuration, database migrations

**Evaluator**: Validates schema correctness, migration success, R2 connectivity

**Linked Spec**: [specs/infrastructure.md](./specs/infrastructure.md)

**Progress File**: [progress/01-infrastructure.md](./progress/01-infrastructure.md)

**Required Skills**: `d1-drizzle-schema`, `wrangler`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 2: CLI Framework

**Builder**: Creates oclif CLI, init command, templates, validation

**Evaluator**: Validates CLI commands work, templates generate correctly

**Linked Spec**: [specs/cli-framework.md](./specs/cli-framework.md)

**Progress File**: [progress/02-cli-framework.md](./progress/02-cli-framework.md)

**Required Skills**: None (pure Node.js/TypeScript)

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 3: Registry Worker

**Builder**: Builds Registry Worker, API endpoints, D1/R2 integration

**Evaluator**: Validates API responses, data persistence, R2 operations

**Linked Spec**: [specs/registry-worker.md](./specs/registry-worker.md)

**Progress File**: [progress/03-registry-worker.md](./progress/03-registry-worker.md)

**Required Skills**: `cloudflare`, `wrangler`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 4: Dynamic Runtime

**Builder**: Implements V8 sandbox, isolate management, code loading

**Evaluator**: Validates sandbox execution, isolate lifecycle, memory safety

**Linked Spec**: [specs/dynamic-runtime.md](./specs/dynamic-runtime.md)

**Progress File**: [progress/04-dynamic-runtime.md](./progress/04-dynamic-runtime.md)

**Required Skills**: `workers-best-practices`, `cloudflare`

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 5: Security System

**Builder**: Implements JWT auth, rate limiting, WAF, verified upvotes

**Required Skills**: `cloudflare`, `wrangler`

**Evaluator**: Validates auth flow, rate limits enforced, security headers

**Linked Spec**: [specs/security.md](./specs/security.md)

**Progress File**: [progress/05-security.md](./progress/05-security.md)

**Enforced Rules**: [rule.md](./rule.md)

---

### Task Type 6: Development Environment

**Builder**: Creates Tmux swarm, dev scripts, tunnel configuration

**Required Skills**: `wrangler`

**Evaluator**: Validates all windows start, tunnel works, logs display

**Linked Spec**: [specs/dev-environment.md](./specs/dev-environment.md)

**Progress File**: [progress/06-dev-environment.md](./progress/06-dev-environment.md)

**Enforced Rules**: [rule.md](./rule.md)

---

## Multi-Agent Coordination Rules

### When to Spawn Subagents

The Orchestrator spawns Builder and Evaluator subagents when:
1. **Clarity Established**: Task scope, requirements, and acceptance criteria are defined in spec
2. **Dependencies Met**: All prerequisite tasks are complete
3. **Resources Available**: Can handle parallel agent execution

### Independent Operation

- **Builder** works on implementation without waiting for Evaluator
- **Evaluator** can start validation once Builder reports completion
- **No direct communication** between Builder and Evaluator
- Both report to Orchestrator only

### Feedback Loop

```
Builder completes → Evaluator reviews → 
  Pass → Task marked complete
  Fail → Feedback sent to Builder → Builder fixes → Re-evaluate
```

### Parallel Execution

For tasks with no dependencies, multiple Builder/Evaluator pairs can run in parallel:
- Task 2 (CLI Framework) and Task 3 (Registry Worker) can execute simultaneously
- Each pair operates independently
- Orchestrator tracks all parallel executions

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

### Multi-Agent Progress Tracking

For each task, the Orchestrator tracks **two parallel progress streams**:

| Subagent | Status Tracks | Updates When |
|----------|---------------|--------------|
| Builder | Implementation progress | Completes code, creates files |
| Builder | Build completion | Finishes all implementation |
| Evaluator | Evaluation progress | Running validations |
| Evaluator | Evaluation result | Pass or Fail decision |

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
| `in_progress` | Builder working | → building, evaluating |
| `building` | Builder completing work | → evaluating, failed |
| `evaluating` | Evaluator reviewing | → passed, failed |
| `passed` | Evaluator approved | → complete |
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

2. **Builder Agent - During Work:**
   - Update individual progress file after each significant action
   - Use exact timestamp format: `YYYY-MM-DD HH:MM:SS`
   - Include clear action descriptions
   - Never skip progress updates

3. **Builder Agent - After Completing Work:**
   - Run self-validation against spec acceptance criteria
   - Update status to `evaluating` (Evaluator will take over)
   - Add summary to progress file
   - Report completion to Orchestrator

4. **Evaluator Agent - During Evaluation:**
   - Read spec acceptance criteria
   - Run validation tests
   - Update status with evaluation results

5. **Evaluator Agent - After Evaluation:**
   - If Pass: Update status to `passed`, report to Orchestrator
   - If Fail: Update status to `failed`, document issues, report to Orchestrator

6. **On Failure:**
   - Update status to `failed`
   - Document failure reasons clearly
   - Specify what needs fixing
   - Report immediately to Orchestrator

### Progress Update Template

```markdown
## Builder Progress Log

| Timestamp | Action | Status | Details |
|-----------|--------|--------|---------|
| 2026-03-27 10:30:00 | Started work | in_progress | Implementing D1 schema |
| 2026-03-27 10:45:00 | Completed agents table | in_progress | Created with all indexes |
| 2026-03-27 11:00:00 | Ready for evaluation | evaluating | All tables created |
```

```markdown
## Evaluator Progress Log

| Timestamp | Action | Status | Details |
|-----------|--------|--------|---------|
| 2026-03-27 11:05:00 | Started evaluation | evaluating | Checking schema validity |
| 2026-03-27 11:15:00 | Validated migrations | evaluating | All migrations successful |
| 2026-03-27 11:20:00 | Evaluation complete | passed | All criteria met |
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
| `Task <N> Started` | Builder has begun work |
| `Task <N> Building` | Builder is implementing |
| `Task <N> Evaluating` | Evaluator is reviewing |
| `Task <N> Passed` | Evaluator approved the work |
| `Task <N> Failed - Retrying` | Evaluator found issues, Builder fixing |
| `Task <N> Complete` | Passed and ready for merge |
| `All Tasks Complete` | Project ready for human review |

### Multi-Agent Status Messages

| Status | Meaning |
|--------|---------|
| `Task <N> Builder: Started` | Builder agent spawned |
| `Task <N> Builder: Complete` | Builder finished implementation |
| `Task <N> Evaluator: Started` | Evaluator agent spawned |
| `Task <N> Evaluator: Passed` | Evaluator approved |
| `Task <N> Evaluator: Failed` | Evaluator found issues |
| `Task <N> Retry: <N> attempts` | Retry count for failed task |

### Report Format

```
## Orchestrator Report - <Timestamp>

### Completed Tasks
- [x] Task 1: Infrastructure (Passed)

### Current Tasks
- [>] Task 2: CLI Framework 
    ├── Builder: Complete
    └── Evaluator: Evaluating...

### Pending Tasks
- [ ] Task 3: Registry Worker
- [ ] Task 4: Dynamic Runtime
- [ ] Task 5: Security System
- [ ] Task 6: Dev Environment

### Next Action
Waiting for Evaluator 2 evaluation report...
```

---

## Communication Constraints

1. **DO NOT** cross-communicate between sub-agents
2. **DO NOT** work on other sub-agent's tasks
3. **DO** report completion only when evaluated and approved
4. **DO** escalate blockers to orchestrator immediately

### Multi-Agent Communication Rules

- **Builder → Evaluator**: No direct communication
- **Evaluator → Builder**: No direct communication  
- **Builder → Orchestrator**: Report completion, request evaluation
- **Evaluator → Orchestrator**: Report pass/fail, provide feedback
- **Orchestrator → Builder**: Send feedback on failure
- **Orchestrator → Evaluator**: Trigger evaluation after Builder completes

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
