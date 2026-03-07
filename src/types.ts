export type InputFormat = 'json' | 'yaml' | 'jsonl' | 'csv';

export type OutputFormat = 'json' | 'jsonl' | 'yaml' | 'csv';

export type ErrorFormat = 'text' | 'json';

export interface CliOptions {
  query?: string;
  inputFormat: InputFormat;
  outputFormat: OutputFormat;
  input: string;
  color?: boolean;
  compact?: boolean;
  rawString?: boolean;
  noHeader?: boolean;
  errorFormat?: ErrorFormat;
}
