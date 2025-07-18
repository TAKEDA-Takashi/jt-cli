export type InputFormat = 'json' | 'yaml' | 'jsonl' | 'csv';

export type OutputFormat = 'json' | 'jsonl' | 'yaml' | 'csv';

export interface CliOptions {
  query?: string;
  inputFormat: InputFormat;
  outputFormat: OutputFormat;
  input: string;
  color?: boolean;
  compact?: boolean;
  rawString?: boolean;
  noHeader?: boolean;
}
