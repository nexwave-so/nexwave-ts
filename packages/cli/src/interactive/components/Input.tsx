import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isProcessing: boolean;
  history: string[];
}

export function Input({ value, onChange, onSubmit, isProcessing, history }: InputProps) {
  const [historyIndex, setHistoryIndex] = useState(-1);

  useInput((input, key) => {
    if (isProcessing) return;
    
    if (key.upArrow && history.length > 0) {
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      onChange(history[history.length - 1 - newIndex] || '');
    }
    if (key.downArrow) {
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        onChange('');
      } else {
        onChange(history[history.length - 1 - newIndex] || '');
      }
    }
  });

  const handleSubmit = useCallback((val: string) => {
    setHistoryIndex(-1);
    onSubmit(val);
  }, [onSubmit]);

  return (
    <Box marginTop={1}>
      {isProcessing ? (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text color="gray"> Processing...</Text>
        </Box>
      ) : (
        <Box>
          <Text color="cyan" bold>nexwave{'>'} </Text>
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={handleSubmit}
            placeholder="Type a command or ask naturally..."
          />
        </Box>
      )}
    </Box>
  );
}
