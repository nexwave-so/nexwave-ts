/**
 * Brand theme colors and styles
 */
export const theme = {
  colors: {
    primary: '#00CBF9',      // Cyan - primary actions
    secondary: '#3DF4CE',    // Mint - success/positive
    accent: '#5347EF',       // Purple - highlights
    background: '#1D155A',   // Deep navy - backgrounds
    text: '#F2F2F2',         // Light gray - text
    muted: '#8888AA',        // Muted text
    error: '#FF6B6B',        // Error red
    warning: '#FFE66D',      // Warning yellow
    success: '#3DF4CE',      // Success mint
  },
  status: {
    PENDING: '#FFE66D',
    PLANNING: '#00CBF9',
    SIMULATING: '#00CBF9',
    EXECUTING: '#5347EF',
    CONFIRMED: '#3DF4CE',
    FAILED: '#FF6B6B',
    CANCELLED: '#8888AA',
  },
} as const;
