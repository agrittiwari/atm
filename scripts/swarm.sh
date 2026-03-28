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
