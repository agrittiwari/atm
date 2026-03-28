# ATM CLI

Agent Template Manager CLI

## Usage

```bash
# Initialize a new agent
atm init --name @username/agent-name

# With custom template
atm init --name @username/agent-name --template mastra

# Enable dynamic runtime
atm init --name @username/agent-name --dynamic

# Specify target directory
atm init --name @username/agent-name --dir ./my-agent
```

## Commands

- `atm init` - Initialize a new ATM agent project

## Development

```bash
npm install
npm run build
npm link
```
