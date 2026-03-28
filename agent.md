# Orchestration Agent - Specification Driven Multi-Agent Framework

This document defines the generic orchestration logic for running spec-driven multi-agent workflows. It is project-agnostic and defines how the Orchestrator spins up sub-agents based on specifications.

---

## Orchestrator Agent - Core Logic

### Overview

The **Orchestrator Agent** reads a project's specification (SPEC.md), identifies tasks, checks dependencies, spins up sub-agents for implementation and evaluation, and reports progress to the human.

### Responsibilities

1. **Spec-Driven Task Discovery**: Parse SPEC.md to find all tasks with defined scope, requirements, and acceptance criteria
2. **Dependency Management**: Topological sort of tasks based on dependencies
3. **Progress Tracking**: Monitor and update progress files
4. **Quality Control**: Route work through Builder/Evaluator sub-agent pairs
5. **Reporting**: Communicate status to human prompter
6. **Human Review**: Request human review when all tasks pass evaluation

---

## How to Spin Up Sub-Agents

### Startup Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR STARTUP                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Read SPEC.md - Find project overview and task definitions  │
│  2. Read progress.md - Check existing progress                 │
│  3. Parse task list from SPEC.md                               │
│  4. Topological sort by dependencies                           │
│  5. Identify next tasks (status=pending, deps complete)       │
│  6. Spin up sub-agents for each task                          │
└─────────────────────────────────────────────────────────────────┘
```

### Sub-Agent Types

#### Builder Agent (Implementer)

- **Purpose**: Execute implementation work for a given task
- **Spawn Command**: Use `task` tool with `subagent_type: "general"`
- **Input**: Task spec from SPEC.md, progress file location
- **Output**: Implementation complete, updates progress file
- **Rules**:
  - Read rule.md before starting
  - Update progress file after each action
  - Report completion only to Orchestrator
  - Never communicate directly with Evaluator

#### Evaluator Agent (Tester)

- **Purpose**: Validate Builder's output against acceptance criteria
- **Spawn Command**: Use `task` tool with `subagent_type: "general"`
- **Input**: Task spec from SPEC.md, Builder's output files
- **Output**: Pass/Fail report with details
- **Rules**:
  - Read rule.md before starting
  - Validate against spec acceptance criteria only
  - Report pass/fail only to Orchestrator
  - Never communicate directly with Builder

### Sub-Agent Spawning Template

```typescript
// Spawn Builder Agent
await task({
  description: `Builder Agent - Task ${taskNumber}`,
  prompt: `
You are the Builder Agent for Task ${taskNumber}: ${taskName}.

## Your Mission
${taskDescription}

## Required Files to Create
${requiredFiles}

## Acceptance Criteria
${acceptanceCriteria}

## Rules
1. Read and follow rule.md (mandatory)
2. Update progress/${String(taskNumber).padStart(2, '0')}-${taskName.toLowerCase().replace(/\s+/g, '-')}.md after each action
3. Use exact timestamp: YYYY-MM-DD HH:MM:SS
4. Do not communicate with other agents

Start now.
`,
  subagent_type: "general"
});
```

### Parallel Execution

The Orchestrator can run multiple Builder/Evaluator pairs in parallel when:
- Tasks have no interdependencies
- Each task has clarity (spec, requirements, acceptance criteria defined)

---

## Spec-Driven Sub-Agent Specification

### Writing Specs to SPEC.md

When the Orchestrator runs, it MUST write sub-agent specifications to SPEC.md in this format:

```markdown
## Task Definitions

### Task N: <Task Name>

**Builder**: <What the builder does>

**Evaluator**: <What the evaluator validates>

**Depends On**: <Task numbers>

**Required Skills**: <skill-name>, <skill-name>

**Linked Spec**: specs/<task-name>.md

**Progress File**: progress/<NN>-<task-name>.md

---

### Sub-Agent Prompt Template

For each task, write a detailed prompt in SPEC.md:

#### Task <N>: <Task Name>

**Builder Prompt:**
```
You are the Builder Agent for Task <N>: <Task Name>.

<Full task description>

<Required files to create>

<Acceptance criteria as checklist>

<Implementation notes>

## Rules
1. Read and follow rule.md
2. Update progress file after each action
3. Do not communicate with other agents
```

**Evaluator Prompt:**
```
You are the Evaluator Agent for Task <N>: <Task Name>.

## Your Mission
Validate the Builder's implementation against:
<Link to specs/<task-name>.md>

## Acceptance Criteria
< checklist from spec >

## Validation Steps
1. Read created files
2. Verify each criterion
3. Check for spec compliance

## Rules
1. Read and follow rule.md
2. Update progress file with result
3. Do not communicate with Builder
```
```

---

## Progress Tracking

### Files

| File | Purpose |
|------|---------|
| `SPEC.md` | Task definitions and sub-agent prompts |
| `progress.md` | Root progress tracker |
| `progress/NN-task-name.md` | Individual task progress |

### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Task not started |
| `in_progress` | Builder working |
| `evaluating` | Evaluator reviewing |
| `passed` | Evaluator approved |
| `failed` | Issues found |
| `complete` | Human approved |

### Progress Update Protocol

1. **Before Work**: Read SPEC.md, progress.md, rule.md
2. **During Work**: Update progress file after each action
3. **After Work**: Update status, report to Orchestrator
4. **On Failure**: Document issues, report immediately

---

## Evaluation Loop

```
Builder completes → Evaluator reviews →
  Pass → Mark complete → Next task
  Fail → Feedback to Builder → Fix → Re-evaluate
```

---

## Running the Orchestrator

```bash
# Start orchestration - reads SPEC.md for task definitions
opencode --agent orchestrator --spec SPEC.md
```

---

## Required Skills Loading

Before spawning any sub-agent, the Orchestrator MUST load required skills:

```bash
skill name=<skill-name>
```

See rule.md Rule 11 for skill requirements per task type.

---

## Files Structure (Generated)

```
project/
├── SPEC.md                    # Task definitions + sub-agent prompts
├── agent.md                   # This orchestration logic
├── rule.md                    # Execution rules
├── progress.md                # Root progress tracker
├── specs/                     # Detailed specs (referenced by SPEC.md)
│   └── *.md                   # Task-specific implementation details
├── progress/                  # Individual task progress
│   └── NN-task-name.md        # Per-task progress files
└── ... (project files)
```

---

## Quick Reference

| Item | File | Purpose |
|------|------|---------|
| Orchestration | `agent.md` | How to spin up sub-agents |
| Task Specs | `SPEC.md` | What sub-agents should do |
| Rules | `rule.md` | Mandatory constraints |
| Progress | `progress.md` | Status tracking |
