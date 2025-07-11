import { colorizeJsonCompact, isColorEnabled } from './colorize';

export function formatJsonLines(data: unknown, rawString?: boolean): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // Helper function to stringify items
  const stringifyItem = (item: unknown): string => {
    if (rawString) {
      // In raw string mode, handle primitive types specially
      if (typeof item === 'string') {
        return isColorEnabled() ? colorizeJsonCompact(item, true) : item;
      }
      if (typeof item === 'number' || typeof item === 'boolean' || item === null) {
        return isColorEnabled() ? colorizeJsonCompact(item, true) : String(item);
      }
    }
    // For objects/arrays or non-raw mode, use normal formatting
    return isColorEnabled() ? colorizeJsonCompact(item, rawString) : JSON.stringify(item);
  };

  // 配列の場合は各要素を改行区切りで出力
  if (Array.isArray(data)) {
    const lines: string[] = [];
    for (const item of data) {
      // undefinedはスキップ
      if (item !== undefined) {
        lines.push(stringifyItem(item));
      }
    }
    return lines.join('\n');
  }

  // 非配列の場合は単一行として出力
  return stringifyItem(data);
}
