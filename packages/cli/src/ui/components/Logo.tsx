import React from 'react';
import { Text } from 'ink';

/**
 * ASCII Nexwave logo
 */
export function Logo(): React.ReactElement {
  return (
    <Text>
      {`
 _   _                                   
| \\ | | _____  ____      ____ ___   _____ 
|  \\| |/ _ \\ \\/ /\\ \\ /\\ / / _\` \\ \\ / / _ \\
| |\\  |  __/>  <  \\ V  V / (_| |\\ V /  __/
|_| \\_|\\___/_/\\_\\  \\_/\\_/ \\__,_| \\_/ \\___|
                                          
  Deterministic DeFi Execution
      `}
    </Text>
  );
}

/**
 * Render logo as string (for non-React contexts)
 */
export function renderLogo(): string {
  return `
 _   _                                   
| \\ | | _____  ____      ____ ___   _____ 
|  \\| |/ _ \\ \\/ /\\ \\ /\\ / / _\` \\ \\ / / _ \\
| |\\  |  __/>  <  \\ V  V / (_| |\\ V /  __/
|_| \\_|\\___/_/\\_\\  \\_/\\_/ \\__,_| \\_/ \\___|
                                          
  Deterministic DeFi Execution
  `;
}
