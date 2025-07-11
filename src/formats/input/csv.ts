import { parse } from 'csv-parse/sync';
import { ErrorCode, JtError } from '../../errors';

export function parseCsv(input: string, noHeader?: boolean): unknown {
  if (!input || input.trim() === '') {
    throw new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid CSV input',
      'Empty input provided',
      'Provide valid CSV data',
    );
  }

  try {
    if (noHeader) {
      // ヘッダーなしとして解析し、col1, col2...という列名を生成
      const records = parse(input, {
        columns: false, // 列名を自動生成しない
        skip_empty_lines: true,
        relax_quotes: false,
        bom: true,
        cast: false,
        trim: false,
      });

      // 最初の行から列数を取得
      if (!Array.isArray(records) || records.length === 0) {
        return [];
      }

      const firstRow = records[0] as string[];
      const columnCount = firstRow.length;

      // col1, col2, ... という列名を生成
      const headers = Array.from({ length: columnCount }, (_, i) => `col${i + 1}`);

      // 各行をオブジェクトに変換
      return records.map((row: string[]) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    } else {
      // Parse CSV with headers
      const records = parse(input, {
        columns: true, // First row as column names
        skip_empty_lines: true,
        relax_quotes: false,
        bom: true, // Handle BOM if present
        cast: false, // Keep all values as strings
        trim: false, // Preserve spaces (as per standard CSV behavior)
      });

      return records;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Provide helpful error details for common CSV parsing errors
    const detail = errorMessage;
    let suggestion = 'Check for unclosed quotes or invalid CSV format';

    if (errorMessage.includes('Quote Not Closed')) {
      suggestion = 'Ensure all quoted fields are properly closed with matching quotes';
    } else if (errorMessage.includes('Invalid Record Length')) {
      suggestion = 'Ensure all rows have the same number of columns';
    } else if (errorMessage.includes('Invalid Opening Quote')) {
      suggestion = 'Check that quotes are at the beginning of fields';
    }

    throw new JtError(ErrorCode.INVALID_INPUT, 'Invalid CSV input', detail, suggestion);
  }
}
