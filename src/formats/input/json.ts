import { JtError, ErrorCode } from '../../errors';

export function parseJson(input: string): unknown {
  if (!input || input.trim() === '') {
    throw new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid JSON input',
      'Empty input provided',
      'Provide valid JSON data',
    );
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Extract position information if available
    const positionMatch = errorMessage.match(/position (\d+)/);
    const position = positionMatch?.[1] ? parseInt(positionMatch[1], 10) : null;
    
    // Provide context around the error position
    let detail = errorMessage;
    if (position !== null && position < input.length) {
      const start = Math.max(0, position - 20);
      const end = Math.min(input.length, position + 20);
      const context = input.substring(start, end);
      const pointer = ' '.repeat(position - start) + '^';
      detail = `${errorMessage}\n${context}\n${pointer}`;
    }
    
    throw new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid JSON input',
      detail,
      'Check for missing quotes, commas, or closing brackets',
    );
  }
}