import { stringify } from 'csv-stringify/sync';
import chalk from 'chalk';
import { ErrorCode, JtError } from '../../errors';
import { isColorEnabled } from './colorize';

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
  const nonObjects = data.filter(
    (item) => typeof item !== 'object' || item === null || Array.isArray(item),
  );
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
      quoted_match: /[\s"]/, // スペース、タブ、改行、ダブルクォートを含む場合はクォート
    });

    // 最後の改行を削除
    const trimmedCsv = csvString.trimEnd();
    
    // 色付けが無効な場合はそのまま返す
    if (!isColorEnabled()) {
      return trimmedCsv;
    }
    
    // CSVの色付け
    return colorizeCsv(trimmedCsv);
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

/**
 * CSV文字列を色付けする
 */
function colorizeCsv(csvStr: string): string {
  const lines = csvStr.split('\n');

  return lines
    .map((line, index) => {
      // ヘッダー行（最初の行）
      if (index === 0) {
        // CSVのフィールドを正しく分割（クォートを考慮）
        return line
          .split(',')
          .map((field) => {
            // クォートを除去してからヘッダーを色付け
            const unquoted = field.replace(/^"(.*)"$/, '$1');
            return chalk.blue.bold(unquoted);
          })
          .join(',');
      }

      // データ行
      // 簡易的な実装：カンマで分割（クォート内のカンマは考慮しない）
      // より正確な実装が必要な場合は、CSVパーサーを使用
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
          currentField += char;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }

      // 最後のフィールドを追加
      if (currentField) {
        fields.push(currentField);
      }

      // 各フィールドを色付け
      const coloredFields = fields.map((field) => {
        // クォートされたフィールドはそのまま
        if (field.startsWith('"') && field.endsWith('"')) {
          // クォート内の値を取得
          const value = field.slice(1, -1);

          // 数値判定（クォート内でも数値として扱う）
          if (value.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/)) {
            return `"${chalk.cyan(value)}"`;
          }

          // 文字列
          return `"${chalk.green(value)}"`;
        }

        // クォートされていないフィールド
        // 数値
        if (field.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/)) {
          return chalk.cyan(field);
        }
        // 真偽値
        else if (field === 'true' || field === 'false') {
          return chalk.yellow(field);
        }
        // 空フィールド
        else if (field === '') {
          return field;
        }
        // その他（文字列）
        else {
          return chalk.green(field);
        }
      });

      return coloredFields.join(',');
    })
    .join('\n');
}
