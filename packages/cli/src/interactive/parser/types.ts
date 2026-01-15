import type { NexwaveClient } from '@nexwave/sdk';

export interface ParserContext {
  client: NexwaveClient;
  history: string[];
  context: {
    lastAction?: ParsedAction;
  };
}

export type ActionType =
  | 'SWAP'
  | 'LIMIT_ORDER'
  | 'CREATE_AGENT'
  | 'START_AGENT'
  | 'STOP_AGENT'
  | 'DELETE_AGENT'
  | 'LIST_AGENTS'
  | 'LIST_INTENTS'
  | 'INTENT_STATUS'
  | 'MARKET_QUOTE'
  | 'MARKET_STATE'
  | 'SYSTEM_HEALTH'
  | 'INFO'
  | 'ERROR';

export interface ParsedAction {
  action: ActionType;
  requiresConfirmation?: boolean;
  data?: Record<string, any>;
  summary?: string;
  message?: string;
  error?: string;
  suggestions?: string[];
}

export interface ExecutionResult {
  success: boolean;
  type?: string;
  data?: any;
  message?: string;
  error?: string;
}
