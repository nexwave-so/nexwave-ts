import { createServer } from './server';

const port = parseInt(process.env.PORT ?? '8080');
const server = createServer();

console.log(`
╭─────────────────────────────────────────────────────────────────╮
│                  NEXWAVE MOCK SERVER                            │
│                                                                 │
│  This is a development mock. Do not use in production.         │
╰─────────────────────────────────────────────────────────────────╯

Listening on http://localhost:${port}

Endpoints:
  POST   /api/v1/intents              Submit intent
  POST   /api/v1/intents/simulate     Simulate intent
  POST   /api/v1/intents/validate     Validate intent
  GET    /api/v1/intents/:id          Get intent status
  POST   /api/v1/intents/:id/cancel   Cancel intent
  GET    /api/v1/intents              List intents
  GET    /api/v1/intents/:id/watch    Watch intent (SSE)

  POST   /api/v1/agents               Create agent
  GET    /api/v1/agents/:id           Get agent
  POST   /api/v1/agents/:id/start     Start agent
  POST   /api/v1/agents/:id/stop      Stop agent
  GET    /api/v1/agents               List agents

  POST   /api/v1/exec/kill            Kill switch
  POST   /api/v1/exec/pause           Pause execution
  POST   /api/v1/exec/resume          Resume execution
  GET    /api/v1/exec/status          Queue status

  GET    /api/v1/markets/:base/:quote Market state
  POST   /api/v1/quotes               Get quote
  GET    /api/v1/venues               List venues

  GET    /api/v1/health               Health check
  GET    /api/v1/info                 Runtime info

Mock Controls (not in production API):
  POST   /_mock/reset                 Reset all state
  POST   /_mock/fail-next             Make next request fail
  POST   /_mock/set-latency           Set artificial latency
`);

export default {
  port,
  fetch: server.fetch,
};
