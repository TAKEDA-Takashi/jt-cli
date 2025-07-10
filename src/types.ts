export type InputFormat = 'json' | 'yaml' | 'jsonl';

export type OutputFormat = 'pretty' | 'compact' | 'jsonl' | 'yaml' | 'csv';

export interface CliOptions {
  input: InputFormat;
  output: OutputFormat;
  csvHeader?: boolean;
  continueOnError?: boolean;
}
