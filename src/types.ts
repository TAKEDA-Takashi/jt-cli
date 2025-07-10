export type InputFormat = 'json' | 'yaml' | 'jsonl';

export type OutputFormat = 'pretty' | 'compact' | 'jsonl' | 'yaml' | 'csv';

export interface CliOptions {
  query?: string;
  inputFormat: InputFormat;
  outputFormat: OutputFormat;
  input: string;
}
