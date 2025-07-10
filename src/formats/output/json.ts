import type { OutputFormat } from '../../types';

export function formatJson(data: unknown, format: OutputFormat): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }
  switch (format) {
    case 'compact':
      return JSON.stringify(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}
