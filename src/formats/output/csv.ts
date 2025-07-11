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
 * CSV文字列を色付けする（列ごとに色分け）
 */
function colorizeCsv(csvStr: string): string {
  const lines = csvStr.split('\n');

  // 列ごとの色パレット（見やすい色の組み合わせ）
  const columnColors = [
    chalk.cyan, // 1列目: シアン
    chalk.green, // 2列目: 緑
    chalk.yellow, // 3列目: 黄
    chalk.magenta, // 4列目: マゼンタ
    chalk.blue, // 5列目: 青
    chalk.red, // 6列目: 赤
    chalk.cyanBright, // 7列目: 明るいシアン
    chalk.greenBright, // 8列目: 明るい緑
    chalk.yellowBright, // 9列目: 明るい黄
    chalk.magentaBright, // 10列目: 明るいマゼンタ
  ];

  return lines
    .map((line, lineIndex) => {
      // CSVフィールドを正しく分割（クォート内のカンマを考慮）
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
      if (currentField || line.endsWith(',')) {
        fields.push(currentField);
      }

      // 各フィールドを列番号に応じて色付け
      const coloredFields = fields.map((field, columnIndex) => {
        // 列番号に応じた色を選択（パレットを循環）
        const colorFn = columnColors[columnIndex % columnColors.length] || chalk.white;

        // ヘッダー行（最初の行）は太字にする
        if (lineIndex === 0) {
          // クォートを除去してから色付け
          const unquoted = field.replace(/^"(.*)"$/, '$1');
          return colorFn.bold(unquoted);
        }

        // データ行
        // クォートされたフィールドの場合、クォート内のみ色付け
        if (field.startsWith('"') && field.endsWith('"')) {
          const value = field.slice(1, -1);
          return `"${colorFn(value)}"`;
        }

        // クォートされていないフィールドはそのまま色付け
        return colorFn(field);
      });

      return coloredFields.join(',');
    })
    .join('\n');
}
