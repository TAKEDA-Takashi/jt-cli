import { stringify } from 'csv-stringify/sync';
import { ErrorCode, JtError } from '../../errors';

export function formatCsv(data: unknown): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // CSV形式は配列のみサポート
  if (!Array.isArray(data)) {
    throw new JtError(
      ErrorCode.INVALID_OUTPUT_FORMAT,
      'CSV output requires an array',
      `Input type: ${typeof data}`,
      'Use a JSONata query that returns an array of objects',
    );
  }

  // 空配列の場合は空文字列を返す
  if (data.length === 0) {
    return '';
  }

  // すべての要素がオブジェクトであることを確認
  const nonObjects = data.filter((item) => typeof item !== 'object' || item === null || Array.isArray(item));
  if (nonObjects.length > 0) {
    throw new JtError(
      ErrorCode.INVALID_OUTPUT_FORMAT,
      'CSV output requires an array of objects',
      'Array contains non-object elements',
      'Ensure all array elements are objects',
    );
  }

  // CSVに変換
  try {
    const csvString = stringify(data, {
      header: true,
      columns: getAllKeys(data),
      cast: {
        date: (value: Date) => value.toISOString(),
        object: (value: unknown) => JSON.stringify(value),
        boolean: (value: boolean) => value.toString(),
      },
      quoted_match: /[\s"]/,  // スペース、タブ、改行、ダブルクォートを含む場合はクォート
    });
    
    // 最後の改行を削除
    return csvString.trimEnd();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new JtError(
      ErrorCode.INVALID_OUTPUT_FORMAT,
      'Failed to format as CSV',
      errorMessage,
      'Check that the data structure is compatible with CSV format',
    );
  }
}

/**
 * 配列内のすべてのオブジェクトから一意のキーを取得
 */
function getAllKeys(data: unknown[]): string[] {
  const keySet = new Set<string>();
  
  for (const item of data) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach((key) => keySet.add(key));
    }
  }
  
  return Array.from(keySet);
}