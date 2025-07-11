import { colorizeJson, colorizeJsonCompact } from './colorize';

export function formatJson(data: unknown, compact?: boolean, rawString?: boolean): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // raw string mode for string values
  if (rawString && typeof data === 'string') {
    // Return raw string without quotes and with unescaped characters
    return data;
  }

  // raw string mode for other primitive types
  if (rawString && (typeof data === 'number' || typeof data === 'boolean' || data === null)) {
    return String(data);
  }

  if (compact) {
    return colorizeJsonCompact(data, rawString);
  }
  return colorizeJson(data, 0, rawString);
}
