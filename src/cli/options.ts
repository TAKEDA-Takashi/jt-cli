export interface CliOptionDefinition {
  flag: string;
  description: string;
  defaultValue?: string;
  /** trueの場合、--describeの出力に含めない */
  hidden?: boolean;
}

/**
 * CLIオプションの共有定義
 * core.tsのCommanderオプション登録とdescribe.tsのJSON出力で共有する
 */
export const CLI_OPTIONS: readonly CliOptionDefinition[] = [
  {
    flag: '-i, --input-format <format>',
    description: 'Input format: json, yaml, jsonl, csv (auto-detected if not specified)',
  },
  {
    flag: '-o, --output-format <format>',
    description: 'Output format',
    defaultValue: 'json',
  },
  {
    flag: '-c, --compact',
    description: 'Compact JSON output (only works with -o json)',
  },
  {
    flag: '-r, --raw-string',
    description: 'Output raw strings without quotes (for JSON output)',
  },
  {
    flag: '--no-header',
    description: 'Treat CSV input as having no headers (only works with -i csv)',
  },
  {
    flag: '--error-format <format>',
    description: 'Error output format: text (default), json',
  },
  {
    flag: '--describe',
    description: 'Output tool description as JSON (for AI agent integration)',
    hidden: true,
  },
  {
    flag: '--color',
    description: 'Force color output even when piped',
  },
  {
    flag: '--no-color',
    description: 'Disable color output',
  },
] as const;
