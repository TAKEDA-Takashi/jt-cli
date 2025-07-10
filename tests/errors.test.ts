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
