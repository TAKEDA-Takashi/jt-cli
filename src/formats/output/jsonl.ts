import { colorizeJsonCompact, isColorEnabled } from './colorize';

export function formatJsonLines(data: unknown): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // 色付けが有効かどうかで処理を分岐
  const stringifyItem = isColorEnabled() ? colorizeJsonCompact : JSON.stringify;

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
