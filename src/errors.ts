export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_QUERY = 'INVALID_QUERY',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_OUTPUT_FORMAT = 'INVALID_OUTPUT_FORMAT',
}

export class JtError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly detail?: string,
    public readonly suggestion?: string,
  ) {
    super(message);
    this.name = 'JtError';
    Object.setPrototypeOf(this, JtError.prototype);
  }

  format(): string {
    let formatted = `Error: ${this.message}`;

    if (this.detail) {
      formatted += `\nDetail: ${this.detail}`;
    }

    if (this.suggestion) {
      formatted += `\nSuggestion: ${this.suggestion}`;
    }

    return formatted;
  }
}
