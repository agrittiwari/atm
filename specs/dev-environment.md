# Task 6: Development Environment - Detailed Specification

## Overview

Create the local development "Swarm" setup with Tmux, wrangler dev, cloudflared tunnel, and multi-agent logging.

## Required Skills

**MUST load before starting:**
```bash
skill name=wrangler
```

| Skill | Purpose |
|-------|---------|
| `wrangler` | Local development with `wrangler dev`, tunnel setup |

---

## Deliverables

### 1. Tmux Swarm Script

Create `scripts/swarm.sh`:

```bash
#!/bin/bash
# ATM Local Development Swarm
# Starts all 4 development windows

SESSION="atm-dev"

# Create session
tmux new-session -d -s "$SESSION"

# Window 1: Registry (wrangler dev)
tmux rename-window -t "$SESSION:1" "registry"
tmux send-keys -t "$SESSION:1" "wrangler dev --port 8787" C-m

# Window 2: CLI Dev
tmux rename-window -t "$SESSION:2" "cli-dev"
tmux send-keys -t "$SESSION:2" "cd packages/cli && npm link" C-m
tmux send-keys -t "$SESSION:2" "npm run watch" C-m

# Window 3: Tunnel (cloudflared)
tmux rename-window -t "$SESSION:3" "tunnel"
tmux send-keys -t "$SESSION:3" "cloudflared tunnel --url http://localhost:8787" C-m

# Window 4: Multi-Agent Logs
tmux rename-window -t "$SESSION:4" "logs"
tmux split-window -h
tmux split-window -v
tmux send-keys -t "$SESSION:4.0" "tail -f /tmp/agent1.log" C-m
tmux send-keys -t "$SESSION:4.1" "tail -f /tmp/agent2.log" C-m
tmux send-keys -t "$SESSION:4.2" "tail -f /tmp/agent3.log" C-m

# Attach to session
tmux attach-session -t "$SESSION"
```

### 2. Dev Runner Script

Create `scripts/dev.sh`:

```bash
#!/bin/bash
# Start local development environment

echo "Starting ATM Local Development..."

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || { echo "wrangler not found"; exit 1; }
command -v tmux >/dev/null 2>&1 || { echo "tmux not found"; exit 1; }
command -v cloudflared >/dev/null 2>&1 || { echo "cloudflared not found"; exit 1; }

# Start the swarm
./scripts/swarm.sh
```

### 3. Local Registry Configuration

Create `.dev.vars` for local development:

```bash
# .dev.vars
JWT_SECRET=dev-secret-key-not-for-production
REGISTRY_URL=http://localhost:8787
R2_BUCKET_NAME=agent-tarballs
```

### 4. Docker Compose (Optional)

Create `docker-compose.yaml` for dependencies:

```yaml
version: '3.8'
services:
  local-stack:
    image: cloudflare/workers-local
    ports:
      - "8787:8787"
    volumes:
      - ./packages/registry:/app
    env_file:
      - .dev.vars
```

### 5. Development Documentation

Create `docs/local-development.md`:

```markdown
# Local Development Setup

## Prerequisites

- Node.js 18+
- Wrangler CLI (`npm i -g wrangler`)
- Tmux
- Cloudflared tunnel

## Quick Start

```bash
# Install dependencies
npm install

# Link CLI locally
cd packages/cli && npm link

# Start development environment
./scripts/dev.sh
```

## Troubleshooting

- If port 8787 is busy, edit `wrangler.toml` to change port
- For R2 issues, ensure localstack is running
- Check logs in Window 4 for agent communication
```

---

## Window Breakdown

| Window | Name | Command | Purpose |
|--------|------|---------|---------|
| 1 | registry | `wrangler dev` | Run Registry Worker locally |
| 2 | cli-dev | `npm run watch` | Watch CLI changes |
| 3 | tunnel | `cloudflared tunnel` | Expose localhost to internet |
| 4 | logs | `tail -f` | Monitor agent interactions |

---

## Acceptance Criteria

- [ ] `scripts/swarm.sh` starts all 4 windows correctly
- [ ] Registry responds at localhost:8787
- [ ] Tunnel URL is accessible from external agents
- [ ] Logs window shows all agent outputs
- [ ] CLI changes trigger rebuild
- [ ] All scripts are executable

---

## Implementation Notes

- Use `tmuxinator` for complex configurations (optional)
- Ensure `.dev.vars` is in `.gitignore`
- Provide alternative for non-tmux users (manual setup guide)
- Include cleanup script to kill all processes
