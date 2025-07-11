import { colorizeJson, colorizeJsonCompact } from './colorize';

export function formatJson(data: unknown, compact?: boolean): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  if (compact) {
    return colorizeJsonCompact(data);
  }
  return colorizeJson(data);
}
