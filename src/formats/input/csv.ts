import { parse } from 'csv-parse/sync';
import { ErrorCode, JtError } from '../../errors';

export function parseCsv(input: string): unknown {
  if (!input || input.trim() === '') {
    throw new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid CSV input',
      'Empty input provided',
      'Provide valid CSV data with headers',
    );
  }

  try {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Provide helpful error details for common CSV parsing errors
    const detail = errorMessage;
    let suggestion = 'Check for unclosed quotes or invalid CSV format';

    if (errorMessage.includes('Quote Not Closed')) {
      suggestion = 'Ensure all quoted fields are properly closed with matching quotes';
    } else if (errorMessage.includes('Invalid Record Length')) {
      suggestion = 'Ensure all rows have the same number of columns as the header';
    } else if (errorMessage.includes('Invalid Opening Quote')) {
      suggestion = 'Check that quotes are at the beginning of fields';
    }

    throw new JtError(ErrorCode.INVALID_INPUT, 'Invalid CSV input', detail, suggestion);
  }
}
