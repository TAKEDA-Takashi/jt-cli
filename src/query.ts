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
    // JSONata throws objects with message property, not Error instances
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;

      // JSONata syntax errors usually contain position information or syntax keywords
      if (
        message.includes('position') ||
        message.includes('Unexpected') ||
        message.includes('Expected') ||
        message.includes('syntax') ||
        message.includes('token') ||
        message.includes('Syntax error')
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
    } else if (error instanceof Error) {
      // Standard Error objects
      throw new JtError(
        ErrorCode.EXECUTION_ERROR,
        'Query execution failed',
        error.message,
        'Verify data types and property paths',
      );
    }

    // Fallback for unknown errors
    throw new JtError(
      ErrorCode.EXECUTION_ERROR,
      'Query execution failed',
      'Unknown error occurred',
    );
  }
}
