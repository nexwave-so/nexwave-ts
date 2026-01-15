import React, { useState, useCallback, useReducer } from 'react';
import { Box, useApp, useInput } from 'ink';
import type { NexwaveClient } from '@nexwave/sdk';
import { Welcome } from './components/Welcome';
import { Input } from './components/Input';
import { Output } from './components/Output';
import { Confirmation } from './components/Confirmation';
import { parseUserInput } from './parser';
import { executeAction } from './actions';
import { AppContext, appReducer, initialState } from './context';
import type { ParsedAction, ExecutionResult } from './parser/types';

interface AppProps {
  client: NexwaveClient;
}

export function App({ client }: AppProps) {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<ParsedAction | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  // Handle Ctrl+C
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add to history
    dispatch({ type: 'ADD_HISTORY', payload: trimmed });
    setInputValue('');
    setLastResult(null);

    // Handle slash commands directly
    if (trimmed.startsWith('/')) {
      await handleSlashCommand(trimmed);
      return;
    }

    setIsProcessing(true);

    try {
      // Parse natural language to action
      const action = await parseUserInput(trimmed, {
        client,
        history: state.history,
        context: state.context,
      });

      if (action.action === 'ERROR') {
        setLastResult({ success: false, error: action.error, data: { suggestions: action.suggestions } });
        setIsProcessing(false);
        return;
      }

      if (action.action === 'INFO') {
        // Informational response, no confirmation needed
        setLastResult({ success: true, message: action.message });
        setIsProcessing(false);
        return;
      }

      // Actions that modify state need confirmation
      if (action.requiresConfirmation) {
        setPendingAction(action);
        setIsProcessing(false);
        return;
      }

      // Execute directly (queries, etc.)
      const result = await executeAction(action, client);
      setLastResult(result);
      
      // Update context with successful action
      if (result.success) {
        dispatch({ type: 'SET_CONTEXT', payload: { lastAction: action } });
      }

    } catch (error) {
      setLastResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [client, state.history, state.context, exit]);

  const handleConfirm = useCallback(async (confirmed: boolean) => {
    if (!pendingAction) return;

    if (!confirmed) {
      setLastResult({ success: false, message: 'Cancelled' });
      setPendingAction(null);
      return;
    }

    setIsProcessing(true);
    setPendingAction(null);

    try {
      const result = await executeAction(pendingAction, client);
      setLastResult(result);
      
      if (result.success) {
        dispatch({ type: 'SET_CONTEXT', payload: { lastAction: pendingAction } });
      }
    } catch (error) {
      setLastResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Execution failed' 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [pendingAction, client]);

  const handleSlashCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/help':
        setLastResult({ success: true, type: 'help' });
        break;
      case '/history':
        setLastResult({ success: true, type: 'history', data: state.history });
        break;
      case '/clear':
        // Clear screen by clearing result
        setLastResult(null);
        break;
      case '/config': {
        const { getConfigManager } = await import('../lib/config');
        const config = getConfigManager().getAll();
        setLastResult({ success: true, type: 'config', data: config });
        break;
      }
      case '/status':
        try {
          const health = await client.system.health();
          setLastResult({ success: true, type: 'status', data: health });
        } catch (e) {
          setLastResult({ success: false, error: 'Cannot reach server' });
        }
        break;
      case '/exit':
        exit();
        break;
      default:
        setLastResult({ success: false, error: `Unknown command: ${command}` });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, client }}>
      <Box flexDirection="column" padding={1}>
        <Welcome />
        
        {lastResult && <Output result={lastResult} />}
        
        {pendingAction && (
          <Confirmation 
            action={pendingAction} 
            onConfirm={handleConfirm}
            isProcessing={isProcessing}
          />
        )}
        
        {!pendingAction && (
          <Input
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            history={state.history}
          />
        )}
      </Box>
    </AppContext.Provider>
  );
}
