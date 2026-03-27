# Task 2: CLI Framework - Detailed Specification

## Overview

Create the ATM CLI using oclif framework with the `atm init` command and framework templates.

---

## Deliverables

### 1. CLI Project Setup

Create `packages/cli/` with:
- Initialize oclif project
- TypeScript configuration
- ESLint + Prettier config

### 2. atm init Command

Implement `packages/cli/src/commands/init.ts`:

**Flags:**
| Flag | Type | Required | Default |
|------|------|----------|---------|
| `--name` | string | Yes | - |
| `--template` | string | No | `cloudflare` |
| `--dynamic` | boolean | No | `false` |
| `--dir` | string | No | Current dir |

**Behavior:**
1. Validate `--name` format (must be `@username/agent-name`)
2. Create target directory
3. Generate `agent.json` with all required fields
4. Copy template files based on `--template`
5. If `--dynamic`, set `runtime: "dynamic"` in agent.json
6. Install dependencies

### 3. agent.json Validation

Create `packages/cli/src/utils/validator.ts`:

```typescript
interface AgentManifest {
  name: string;
  version: string;
  description: string;
  framework: 'cloudflare' | 'mastra' | 'langchain' | 'openai';
  endpoint: string;
  capabilities: string[];
  auth: { type: 'bearer' | 'api-key' };
  runtime: 'static' | 'dynamic';
}
```

Validation rules:
- `name`: Must match `@^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$`
- `version`: Must be valid semver
- `framework`: Must be one of the allowed values
- `capabilities`: Must be non-empty array

### 4. Templates

Create `packages/cli/templates/`:

#### cloudflare/ (default)
- `src/index.ts` - Basic CF Worker handler
- `wrangler.toml` - CF Worker config
- `package.json` - Dependencies

#### mastra/
- `src/agent.ts` - Mastra agent setup
- `mastra.config.ts` - Mastra configuration

#### langchain/
- `src/agent.ts` - LangChain agent
- `langchain.config.ts` - LangChain setup

#### openai/
- `src/agent.ts` - OpenAI Assistant wrapper
- `.env.example` - API key template

### 5. Additional Commands (optional for future)

- `atm publish` - Upload to Registry
- `atm login` - Authenticate with Registry
- `atm search` - Find agents by capability

---

## Acceptance Criteria

- [ ] `atm init --name @user/test --template cloudflare` creates valid project
- [ ] Generated `agent.json` passes validation
- [ ] All 4 templates produce framework-appropriate scaffold
- [ ] `--dynamic` flag sets runtime correctly
- [ ] CLI installs dependencies successfully
- [ ] Error messages are clear and helpful

---

## Implementation Notes

- Use oclif v2 for TypeScript support
- Use template literals for file generation
- Validate name format before creating files
- Handle existing directory gracefully
