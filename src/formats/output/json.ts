import { OutputFormat } from '../../types';

export function formatJson(data: unknown, format: OutputFormat): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  try {
    switch (format) {
      case 'compact':
        return JSON.stringify(data);
      
      case 'pretty':
      default:
        return JSON.stringify(data, null, 2);
    }
  } catch (error) {
    // Re-throw error for circular references or other JSON errors
    throw error;
  }
}