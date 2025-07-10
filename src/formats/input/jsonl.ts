import { JtError, ErrorCode } from '../../errors';
import { Readable } from 'stream';
import { createInterface } from 'readline';

export function parseJsonLines(input: string): unknown[] {
  if (!input) {
    return [];
  }

  const lines = input.split(/\r?\n/);
  const results: unknown[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    try {
      results.push(JSON.parse(line));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new JtError(
        ErrorCode.INVALID_INPUT,
        'Invalid JSON on line',
        `Error on line ${i + 1}: ${errorMessage}\nContent: ${line}`,
        'Each line must be valid JSON',
      );
    }
  }

  return results;
}

export async function* parseJsonLinesStream(
  stream: Readable,
  continueOnError = false,
): AsyncGenerator<unknown | JtError> {
  const rl = createInterface({
    input: stream,
    crlfDelay: Infinity, // Handle Windows line endings
  });

  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    try {
      yield JSON.parse(trimmedLine);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const jtError = new JtError(
        ErrorCode.INVALID_INPUT,
        'Invalid JSON on line',
        `Error on line ${lineNumber}: ${errorMessage}\nContent: ${trimmedLine}`,
        'Each line must be valid JSON',
      );

      if (continueOnError) {
        yield jtError;
      } else {
        throw jtError;
      }
    }
  }
}