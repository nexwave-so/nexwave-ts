import React from 'react';
import { Box, Text } from 'ink';
import { formatTable, formatStatus, formatId, formatRelativeTime, formatAmountFromSmallest, success, error, info } from '../../lib/output';
import type { ExecutionResult } from '../parser/types';

interface OutputProps {
  result: ExecutionResult;
}

export function Output({ result }: OutputProps) {
  if (!result) return null;

  if (result.type === 'help') {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Natural language examples:</Text>
        <Text>  "swap 100 USDC to SOL"</Text>
        <Text>  "buy SOL with 500 USDC, max 1% slippage"</Text>
        <Text>  "create a DCA agent for SOL, $100 weekly"</Text>
        <Text>  "show my agents"</Text>
        <Text>  "stop agent agt_xxx"</Text>
        <Text>  "what's SOL trading at?"</Text>
        <Text> </Text>
        <Text bold color="cyan">Slash commands:</Text>
        <Text>  /help        Show this help</Text>
        <Text>  /history     Show command history</Text>
        <Text>  /clear       Clear screen</Text>
        <Text>  /config      Show current config</Text>
        <Text>  /status      System health check</Text>
        <Text>  /exit        Exit (or Ctrl+C)</Text>
      </Box>
    );
  }

  if (result.type === 'history') {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Recent commands:</Text>
        {(result.data as string[] || []).map((cmd, i) => (
          <Text key={i}>  {i + 1}. {cmd}</Text>
        ))}
      </Box>
    );
  }

  if (result.type === 'config') {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Current Configuration:</Text>
        <Text>{JSON.stringify(result.data, null, 2)}</Text>
      </Box>
    );
  }

  if (result.type === 'status') {
    const health = result.data as any;
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>
          <Text color="gray">Status: </Text>
          <Text color={health.status === 'healthy' ? 'green' : 'red'}>
            {health.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </Text>
        {health.message && (
          <Text color="gray">  {health.message}</Text>
        )}
      </Box>
    );
  }

  if (result.success) {
    // Handle agent list
    if (result.type === 'agents' && Array.isArray(result.data)) {
      const agents = result.data as any[];
      if (agents.length === 0) {
        return (
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">No agents found</Text>
          </Box>
        );
      }
      
      const tableData = agents.map((agent) => ({
        ID: formatId(agent.id),
        Name: agent.name.length > 20 ? agent.name.substring(0, 17) + '...' : agent.name,
        Status: formatStatus(agent.status),
        Schedule: agent.config?.schedule?.cron || 'manual',
        Executions: agent.state?.executionCount?.toString() || '0',
        'Last Run': agent.state?.lastExecutionAt
          ? formatRelativeTime(agent.state.lastExecutionAt)
          : '-',
      }));

      return (
        <Box flexDirection="column" marginTop={1}>
          <Text>{success(result.message || `Found ${agents.length} agent(s)`)}</Text>
          <Box marginTop={1}>
            <Text>{formatTable(tableData)}</Text>
          </Box>
        </Box>
      );
    }

    // Handle intent list
    if (result.type === 'intents' && Array.isArray(result.data)) {
      const intents = result.data as any[];
      if (intents.length === 0) {
        return (
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">No intents found</Text>
          </Box>
        );
      }

      const tableData = intents.map((intent) => ({
        ID: formatId(intent.id),
        Action: intent.action || '-',
        Status: formatStatus(intent.state),
        Input: intent.input
          ? `${formatAmountFromSmallest(intent.input.amount, intent.input.asset.decimals)} ${intent.input.asset.symbol}`
          : '-',
        Created: formatRelativeTime(intent.createdAt),
      }));

      return (
        <Box flexDirection="column" marginTop={1}>
          <Text>{success(result.message || `Found ${intents.length} intent(s)`)}</Text>
          <Box marginTop={1}>
            <Text>{formatTable(tableData)}</Text>
          </Box>
        </Box>
      );
    }

    // Handle quote
    if (result.type === 'quote' && result.data) {
      const quote = result.data as any;
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text>{success(result.message || 'Quote received')}</Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text color="gray">Price: </Text>
              <Text color="yellow">{quote.price}</Text>
            </Text>
            {quote.outputAmount && (
              <Text>
                <Text color="gray">Output: </Text>
                <Text color="green">{quote.outputAmount} {quote.base}</Text>
              </Text>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>{success(result.message || 'Success')}</Text>
        {result.data && typeof result.data === 'object' && (
          <Box marginTop={1} flexDirection="column">
            {result.data.intentId && (
              <Text>
                <Text color="gray">Intent ID: </Text>
                <Text color="cyan">{result.data.intentId}</Text>
              </Text>
            )}
            {result.data.agentId && (
              <Text>
                <Text color="gray">Agent ID: </Text>
                <Text color="cyan">{result.data.agentId}</Text>
              </Text>
            )}
            {result.data.status && (
              <Text>
                <Text color="gray">Status: </Text>
                <Text>{formatStatus(result.data.status)}</Text>
              </Text>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>{error(result.error || 'Failed')}</Text>
      {result.data && typeof result.data === 'object' && result.data.suggestions && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray">Suggestions:</Text>
          {(result.data.suggestions as string[]).map((s, i) => (
            <Text key={i} color="gray">  • {s}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
