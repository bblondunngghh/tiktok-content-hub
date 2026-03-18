/**
 * Logger that writes exclusively to stderr.
 * stdout is reserved for MCP JSON-RPC protocol messages.
 */
export const logger = {
  info: (...args: unknown[]) => {
    console.error('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.error('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG]', ...args);
    }
  },
};
