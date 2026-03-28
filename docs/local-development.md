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
