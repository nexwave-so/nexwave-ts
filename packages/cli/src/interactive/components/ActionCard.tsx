import React from 'react';
import { Box, Text } from 'ink';
import type { ParsedAction } from '../parser/types';

interface ActionCardProps {
  action: ParsedAction;
}

function formatAmount(amount?: string, decimals?: number): string {
  if (!amount || decimals === undefined) return '?';
  const value = parseInt(amount) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatSchedule(schedule?: any): string {
  if (!schedule) return 'manual';
  if (schedule.cron) return schedule.cron;
  if (schedule.intervalMs) {
    const hours = schedule.intervalMs / 3600000;
    return hours === 1 ? 'hourly' : `every ${hours}h`;
  }
  return 'unknown';
}

export function ActionCard({ action }: ActionCardProps) {
  const { data, summary } = action;

  const renderSwapCard = () => (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">SWAP</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text color="gray">Input:     </Text>
          <Text color="white">{formatAmount(data?.fromAmount, data?.fromDecimals)} {data?.fromAsset}</Text>
        </Text>
        <Text>
          <Text color="gray">Output:    </Text>
          <Text color="green">~{data?.expectedOutput || '?'} {data?.toAsset}</Text>
        </Text>
        <Text>
          <Text color="gray">Slippage:  </Text>
          <Text color="yellow">{(data?.maxSlippageBps || 50) / 100}% max</Text>
        </Text>
        {data?.route && (
          <Text>
            <Text color="gray">Route:     </Text>
            <Text color="gray">{data.route}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );

  const renderAgentCard = () => (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
      <Text bold color="magenta">AGENT: {data?.name}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text color="gray">Action:    </Text>
          <Text>Buy {data?.toAsset} with {data?.fromAsset}</Text>
        </Text>
        <Text>
          <Text color="gray">Amount:    </Text>
          <Text>{formatAmount(data?.fromAmount, data?.fromDecimals)} per execution</Text>
        </Text>
        <Text>
          <Text color="gray">Schedule:  </Text>
          <Text>{formatSchedule(data?.schedule)}</Text>
        </Text>
        <Text>
          <Text color="gray">Slippage:  </Text>
          <Text>{(data?.maxSlippageBps || 100) / 100}% max</Text>
        </Text>
      </Box>
    </Box>
  );

  const renderDefaultCard = () => (
    <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
      <Text>{summary || action.action}</Text>
    </Box>
  );

  switch (action.action) {
    case 'SWAP':
    case 'LIMIT_ORDER':
      return renderSwapCard();
    case 'CREATE_AGENT':
      return renderAgentCard();
    default:
      return renderDefaultCard();
  }
}
