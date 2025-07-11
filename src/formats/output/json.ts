import type { OutputFormat } from '../../types';
import { colorizeJson, colorizeJsonCompact } from './colorize';

export function formatJson(data: unknown, format: OutputFormat): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }
  switch (format) {
    case 'compact':
      return colorizeJsonCompact(data);
    default:
      return colorizeJson(data);
  }
}
