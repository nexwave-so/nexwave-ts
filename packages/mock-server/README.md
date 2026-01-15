# @nexwave/mock-server

A development mock server for testing the Nexwave SDK without a live runtime.

## Installation

```bash
bun add -D @nexwave/mock-server
```

## Usage

```bash
# Start the mock server
bunx @nexwave/mock-server

# Or with custom port
PORT=3000 bunx @nexwave/mock-server
```

The mock server runs at `http://localhost:8080` by default.

## Features

- ✅ Full Runtime API implementation
- ✅ Realistic execution simulation with timing
- ✅ SSE streaming for `watchStatus`
- ✅ 5% random failure rate for testing error paths
- ✅ Mock controls for testing edge cases

## Mock Controls

```bash
# Reset all state
curl -X POST http://localhost:8080/api/v1/_mock/reset

# Force next request to fail
curl -X POST http://localhost:8080/api/v1/_mock/fail-next \
  -H "Content-Type: application/json" \
  -d '{"code": "RATE_LIMITED", "status": 429}'

# Add artificial latency
curl -X POST http://localhost:8080/api/v1/_mock/set-latency \
  -H "Content-Type: application/json" \
  -d '{"ms": 500}'
```

## License

MIT
