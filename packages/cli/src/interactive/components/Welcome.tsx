import React from 'react';
import { Box, Text } from 'ink';

const LOGO = `
 ███╗   ██╗███████╗██╗  ██╗██╗    ██╗ █████╗ ██╗   ██╗███████╗
 ████╗  ██║██╔════╝╚██╗██╔╝██║    ██║██╔══██╗██║   ██║██╔════╝
 ██╔██╗ ██║█████╗   ╚███╔╝ ██║ █╗ ██║███████║██║   ██║█████╗  
 ██║╚██╗██║██╔══╝   ██╔██╗ ██║███╗██║██╔══██║╚██╗ ██╔╝██╔══╝  
 ██║ ╚████║███████╗██╔╝ ██╗╚███╔███╔╝██║  ██║ ╚████╔╝ ███████╗
 ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝
`;

export function Welcome() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">{LOGO}</Text>
      <Text color="gray"> Deterministic DeFi Execution</Text>
      <Text> </Text>
      <Text color="gray"> Type naturally. I'll handle the rest.</Text>
      <Text color="gray"> /help for commands • Ctrl+C to exit</Text>
    </Box>
  );
}
