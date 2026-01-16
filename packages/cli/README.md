# @nexwave/cli

Command-line interface for [Nexwave](https://nexwave.so) — deterministic DeFi execution.

## Installation

```bash
npm install -g @nexwave/cli
# or
pnpm add -g @nexwave/cli
# or
bun add -g @nexwave/cli
```

## Quick Start

```bash
# Login
nexwave auth login

# Submit a swap
nexwave swap USDC SOL 1000

# Check status
nexwave intent status <intent-id>

# Create a DCA agent
nexwave agent create -f templates/agent-dca.yaml --start
```

## Commands

### Authentication
```bash
nexwave auth login          # Interactive login
nexwave auth logout         # Clear credentials
nexwave auth status         # Check auth status
```

### Intents
```bash
nexwave intent submit -f intent.yaml    # Submit from file
nexwave intent status <id>              # Check status
nexwave intent status <id> --watch      # Watch updates
nexwave intent list                     # List intents
nexwave intent cancel <id>              # Cancel intent
nexwave swap <from> <to> <amount>       # Quick swap
nexwave limit buy <asset> <amount> --price <price>  # Limit order
```

### Agents
```bash
nexwave agent create -f agent.yaml      # Create agent
nexwave agent list                      # List agents
nexwave agent start <id>                # Start agent
nexwave agent stop <id>                 # Stop agent
nexwave agent logs <id> --follow        # Stream logs
nexwave agent delete <id>               # Delete agent
```

### Market Data
```bash
nexwave market quote USDC SOL 1000      # Get quote
nexwave market state SOL/USDC           # Market state
nexwave market watch SOL/USDC           # Watch price
```

### Execution
```bash
nexwave execution queue                 # View queue
nexwave execution metrics               # Global metrics
nexwave execution pause                 # Pause all
nexwave execution resume                # Resume all
```

### System
```bash
nexwave system health                   # Health check
nexwave system info                     # System info
nexwave system config                   # Runtime config
```

### Configuration
```bash
nexwave config set default.urgency high
nexwave config set output.format json
nexwave config list
nexwave config reset
```

## Shell Completions

```bash
# Bash
nexwave completion bash >> ~/.bashrc
source ~/.bashrc

# Zsh
nexwave completion zsh >> ~/.zshrc
source ~/.zshrc
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXWAVE_ENDPOINT` | API endpoint URL |
| `NEXWAVE_API_KEY` | API key (nxw_...) |
| `OPENROUTER_API_KEY` | OpenRouter API key for natural language parsing (optional) |
| `OPENROUTER_MODEL` | Model to use (default: `anthropic/claude-3.5-sonnet`) |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL (default: `https://openrouter.ai/api/v1`) |

## Output Formats

All commands support multiple output formats:

```bash
nexwave intent list -o table    # Table format (default)
nexwave intent list -o json     # JSON format
nexwave intent list -o yaml     # YAML format
```

## Templates

Example templates are included in the package:

- `templates/intent-swap.yaml` - Market swap intent
- `templates/intent-limit.yaml` - Limit order intent
- `templates/agent-dca.yaml` - DCA agent configuration

## License

MIT © [Nexwave](https://nexwave.so)
