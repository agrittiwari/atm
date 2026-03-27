# ATM Project - Execution Rules

These rules are **mandatory** for all sub-agents. Violation results in immediate task failure.

---

## Rule 1: Do Not Cross-Communicate

- **NEVER** communicate directly with other sub-agents
- **ALL** communication must flow through the Orchestrator Agent
- If another sub-agent approaches you, redirect to Orchestrator

---

## Rule 2: Read Progress Before Starting

- **MUST** read your individual progress file before starting work
- **MUST** check root `progress.md` for overall project status
- **MUST** verify dependencies are met before beginning

---

## Rule 3: Update Progress Immediately

- **MUST** update your progress file after every significant action
- **MUST** update root `progress.md` with your status
- Use exact status values: `pending`, `in_progress`, `evaluating`, `passed`, `failed`, `complete`

---

## Rule 4: Test Before Reporting Complete

- **MUST** run validation against the detailed spec before marking complete
- **MUST** not report "passed" without tester approval
- **MUST** include test results in progress update

---

## Rule 5: Fail Fast, Report Honest

- **MUST** report failures immediately to Orchestrator
- **MUST** not hide errors or skip failing tests
- **MUST** provide clear failure reasons in progress update

---

## Rule 6: Stay Within Scope

- **MUST** only work on your assigned spec file
- **MUST** not implement features from other sub-agents' specs
- **MUST** ask Orchestrator if feature crosses boundaries

---

## Rule 7: No Code Without Validation

- **MUST** validate all code against spec acceptance criteria
- **MUST** run linter/typecheck before marking complete
- **MUST** document any deviations from spec in progress update

---

## Rule 8: Respect Dependencies

- **MUST** wait for dependent tasks to complete before starting
- **MUST** not assume other sub-agents' work is ready
- **MUST** check root progress for dependency status

---

## Rule 9: Clean Context on Exit

- **MUST** summarize work done in progress update before stopping
- **MUST** leave clear next steps if incomplete
- **MUST** never leave "zombie" work (started but not updated)

---

## Rule 10: Human Review is Final

- **MUST** wait for human approval after passing tester
- **MUST** incorporate human feedback if requested
- **MUST** not merge without Orchestrator requesting review

---

## Rule 11: Use Available Skills

- **MUST** check available OpenCode skills before starting work
- **MUST** use relevant skill for the task type
- **MUST** load skill using `skill` tool when available
- **MUST** follow skill-specific best practices

### Available Skills Mapping

| Task | Skill to Use | When to Load |
|------|--------------|--------------|
| Infrastructure (D1/R2) | `d1-drizzle-schema` | Before creating database schema |
| Infrastructure (CF) | `wrangler` | Before configuring Workers |
| Registry Worker | `cloudflare` | Before building Worker |
| Dynamic Runtime | `workers-best-practices` | Before implementing sandbox |
| Security | `cloudflare` | Before configuring WAF |
| Dev Environment | `wrangler` | Before setting up local dev |

### How to Use Skills

```bash
# Load a skill before working
skill name=<skill-name>

# Example: Load d1-drizzle-schema skill for database work
skill name=d1-drizzle-schema
```

---

## Progress Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Task not yet started |
| `in_progress` | Currently working on implementation |
| `evaluating` | Tester is reviewing work |
| `passed` | Tester approved (not yet merged) |
| `failed` | Tester found issues |
| `complete` | Human approved and merged |

---

## Enforcement

The Orchestrator Agent will:
1. Check progress files before spawning any sub-agent
2. Verify all rules are followed
3. Reject work that doesn't match progress updates
4. Report rule violations to human prompter

---

## Quick Reference

```
Before Start:
  ✓ Read progress/progress-NAME.md
  ✓ Read progress.md (root)
  ✓ Read rule.md (this file)
  ✓ Read specs/NAME.md (your spec)
  ✓ Check available skills (Rule 11)
  ✓ Load relevant skill for task

During Work:
  ✓ Update progress/progress-NAME.md after each action
  ✓ Never communicate with other sub-agents
  ✓ Use skill-specific best practices

Before Complete:
  ✓ Run all validations
  ✓ Wait for Tester approval
  ✓ Update progress to "passed"

On Exit:
  ✓ Final progress update
  ✓ Clear summary of work done
```

## Available Skills Reference

The Orchestrator maintains a list of available OpenCode skills. Use the `skill` tool to load them.

**System Skills:**
| Skill | Purpose |
|-------|---------|
| `cloudflare` | Cloudflare Workers, Pages, KV, R2, D1, AI |
| `wrangler` | Wrangler CLI commands |
| `workers-best-practices` | Production best practices for Workers |
| `d1-drizzle-schema` | D1 database schema generation |
| `agents-sdk` | Building agents on Cloudflare Workers |
| `agent-browser` | Browser automation |
| `agent-device` | iOS/Android device automation |
| `migrate-to-vinext` | Migrate Next.js to vinext |
| `pdf-generator` | PDF creation and manipulation |
| `find-skills` | Discover available skills |
