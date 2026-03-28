#!/bin/bash
# Start local development environment

echo "Starting ATM Local Development..."

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || { echo "wrangler not found"; exit 1; }
command -v tmux >/dev/null 2>&1 || { echo "tmux not found"; exit 1; }
command -v cloudflared >/dev/null 2>&1 || { echo "cloudflared not found"; exit 1; }

# Start the swarm
./scripts/swarm.sh
