import React from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { ActionCard } from './ActionCard';
import type { ParsedAction } from '../parser/types';

interface ConfirmationProps {
  action: ParsedAction;
  onConfirm: (confirmed: boolean) => void;
  isProcessing: boolean;
}

export function Confirmation({ action, onConfirm, isProcessing }: ConfirmationProps) {
  useInput((input) => {
    if (isProcessing) return;
    
    if (input.toLowerCase() === 'y') {
      onConfirm(true);
    } else if (input.toLowerCase() === 'n' || input === '\x1b') { // n or Escape
      onConfirm(false);
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <ActionCard action={action} />
      
      <Box marginTop={1}>
        {isProcessing ? (
          <Box>
            <Text color="cyan">
              <Spinner type="dots" />
            </Text>
            <Text color="gray"> Executing...</Text>
          </Box>
        ) : (
          <Text>
            <Text color="yellow">Execute? </Text>
            <Text color="gray">(</Text>
            <Text color="green">y</Text>
            <Text color="gray">/</Text>
            <Text color="red">n</Text>
            <Text color="gray">): </Text>
          </Text>
        )}
      </Box>
    </Box>
  );
}
