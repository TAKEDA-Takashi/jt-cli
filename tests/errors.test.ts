import { describe, expect, it } from 'vitest';
import { ErrorCode, JtError } from '../src/errors';

describe('JtError', () => {
  it('should create an error with code and message', () => {
    const error = new JtError(ErrorCode.INVALID_INPUT, 'Invalid JSON input');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(JtError);
    expect(error.code).toBe(ErrorCode.INVALID_INPUT);
    expect(error.message).toBe('Invalid JSON input');
  });

  it('should include detail when provided', () => {
    const error = new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid JSON input',
      'Unexpected token at position 5',
    );

    expect(error.detail).toBe('Unexpected token at position 5');
  });

  it('should include suggestion when provided', () => {
    const error = new JtError(
      ErrorCode.INVALID_QUERY,
      'Invalid JSONata expression',
      'Unexpected token "{"',
      'Check for missing quotes or operators',
    );

    expect(error.suggestion).toBe('Check for missing quotes or operators');
  });

  it('should format error message properly', () => {
    const error = new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid JSON input',
      'Unexpected token at position 5',
      'Check for missing commas or quotes',
    );

    const formatted = error.format();
    expect(formatted).toContain('Error: Invalid JSON input');
    expect(formatted).toContain('Detail: Unexpected token at position 5');
    expect(formatted).toContain('Suggestion: Check for missing commas or quotes');
  });

  it('should format error message without optional fields', () => {
    const error = new JtError(ErrorCode.EXECUTION_ERROR, 'Query execution failed');

    const formatted = error.format();
    expect(formatted).toBe('Error: Query execution failed');
    expect(formatted).not.toContain('Detail:');
    expect(formatted).not.toContain('Suggestion:');
  });
});

describe('JtError.toJSON', () => {
  it('should serialize to structured JSON with all fields', () => {
    const error = new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid JSON input',
      'Unexpected token at position 5',
      'Check for missing commas',
    );

    expect(error.toJSON()).toEqual({
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid JSON input',
        detail: 'Unexpected token at position 5',
        suggestion: 'Check for missing commas',
      },
    });
  });

  it('should omit undefined optional fields', () => {
    const error = new JtError(ErrorCode.EXECUTION_ERROR, 'Query failed');

    const json = error.toJSON();
    expect(json).toEqual({
      error: {
        code: 'EXECUTION_ERROR',
        message: 'Query failed',
      },
    });
    expect('detail' in json.error).toBe(false);
    expect('suggestion' in json.error).toBe(false);
  });

  it('should produce valid JSON string via JSON.stringify', () => {
    const error = new JtError(ErrorCode.INVALID_QUERY, 'Bad query', 'detail');

    const str = JSON.stringify(error.toJSON());
    const parsed = JSON.parse(str);
    expect(parsed.error.code).toBe('INVALID_QUERY');
  });
});

describe('ErrorCode', () => {
  it('should have all required error codes', () => {
    expect(ErrorCode.INVALID_INPUT).toBeDefined();
    expect(ErrorCode.INVALID_QUERY).toBeDefined();
    expect(ErrorCode.EXECUTION_ERROR).toBeDefined();
    expect(ErrorCode.OUTPUT_ERROR).toBeDefined();
    expect(ErrorCode.FILE_NOT_FOUND).toBeDefined();
    expect(ErrorCode.INVALID_FORMAT).toBeDefined();
  });
});
