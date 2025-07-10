export function formatJsonLines(data: unknown): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // 配列の場合は各要素を改行区切りで出力
  if (Array.isArray(data)) {
    const lines: string[] = [];
    for (const item of data) {
      // undefinedはスキップ
      if (item !== undefined) {
        lines.push(JSON.stringify(item));
      }
    }
    return lines.join('\n');
  }

  // 非配列の場合は単一行として出力
  return JSON.stringify(data);
}
