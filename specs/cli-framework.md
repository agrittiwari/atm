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

### 5. README Generation

Each template MUST generate a `README.md` with:

#### Required Sections:
1. **Architecture** - High-level overview of how the agent works
2. **Stack** - Technologies used (framework, runtime, dependencies)
3. **Contributing** - How to contribute to this agent project

#### Template-Specific Content:

**cloudflare template:**
```markdown
# {{agent-name}}

{{description}}

## Architecture

This agent runs as a Cloudflare Worker and can be called via A2A protocol.

## Stack

- Cloudflare Workers
- TypeScript

## Contributing

1. Edit \`src/index.ts\` to modify agent behavior
2. Test locally: \`wrangler dev\`
3. Deploy: \`wrangler deploy\`
```

**mastra template:**
```markdown
# {{agent-name}}

{{description}}

## Architecture

This agent uses Mastra for AI workflow orchestration.

## Stack

- Mastra
- Cloudflare Workers
- TypeScript

## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Run locally: \`npm run dev\`
3. Deploy: \`wrangler deploy\`
```

**langchain template:**
```markdown
# {{agent-name}}

{{description}}

## Architecture

This agent uses LangChain for LLM-powered capabilities.

## Stack

- LangChain
- Cloudflare Workers
- TypeScript

## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Run locally: \`npm run dev\`
3. Deploy: \`wrangler deploy\`
```

**openai template:**
```markdown
# {{agent-name}}

{{description}}

## Architecture

This agent wraps an OpenAI Assistant for A2A communication.

## Stack

- OpenAI Assistants API
- Cloudflare Workers
- TypeScript

## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Add your OpenAI API key to \`.env\`
3. Run locally: \`npm run dev\`
4. Deploy: \`wrangler deploy\`
```

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
- [ ] README.md generated with Architecture section
- [ ] README.md generated with Stack section
- [ ] README.md generated with Contributing guide

---

## Implementation Notes

- Use oclif v2 for TypeScript support
- Use template literals for file generation
- Validate name format before creating files
- Handle existing directory gracefully
