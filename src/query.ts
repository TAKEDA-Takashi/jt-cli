import jsonata from 'jsonata';
import { ErrorCode, JtError } from './errors';

export async function executeQuery(query: string, data: unknown): Promise<unknown> {
  try {
    const expression = jsonata(query);
    let result = await expression.evaluate(data);

    // JSONata adds 'sequence' property to arrays, which we need to remove
    // for proper equality checks
    if (Array.isArray(result) && 'sequence' in result) {
      result = [...result];
    }

    return result;
  } catch (error) {
    // Check if it's a syntax error or runtime error
    if (error instanceof Error) {
      const message = error.message;

      // JSONata syntax errors usually contain position information or syntax keywords
      if (
        message.includes('position') ||
        message.includes('Unexpected') ||
        message.includes('Expected') ||
        message.includes('syntax') ||
        message.includes('token')
      ) {
        throw new JtError(
          ErrorCode.INVALID_QUERY,
          'Invalid JSONata expression',
          message,
          'Check syntax at jsonata.org',
        );
      } else {
        // Runtime errors (type errors, null references, etc.)
        throw new JtError(
          ErrorCode.EXECUTION_ERROR,
          'Query execution failed',
          message,
          'Verify data types and property paths',
        );
      }
    }

    // Fallback for unknown errors
    throw new JtError(
      ErrorCode.EXECUTION_ERROR,
      'Query execution failed',
      'Unknown error occurred',
    );
  }
}
