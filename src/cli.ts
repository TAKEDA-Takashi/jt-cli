import { readFileSync } from 'node:fs';
import { isatty } from 'node:tty';
import { Command } from 'commander';
import { ErrorCode, JtError } from './errors';
import { parseInput } from './formats/input';
import { formatOutput } from './formats/output';
import { executeQuery } from './query';
import type { CliOptions, InputFormat, OutputFormat } from './types';

// package.jsonから情報を読み込む
const packageInfo = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string; description: string };

/**
 * JSONataクエリを実行してフォーマットした結果を返す
 */
export async function processQuery(options: CliOptions): Promise<string> {
  // 入力データをパース
  const data = parseInput(options.input, options.inputFormat);

  // JSONataクエリを実行
  const result = await executeQuery(options.query, data);

  // 結果をフォーマット
  return formatOutput(result, options.outputFormat);
}

/**
 * 標準入力からデータを読み込む
 */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

/**
 * ファイルまたは標準入力から入力を取得
 */
export async function getInput(filePath?: string): Promise<string> {
  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new JtError(
          ErrorCode.FILE_NOT_FOUND,
          `File not found: ${filePath}`,
          undefined,
          'Check the file path and try again',
        );
      }
      throw error;
    }
  }

  // 標準入力がパイプされているかチェック
  if (!isatty(0)) {
    return readStdin();
  }

  throw new JtError(
    ErrorCode.INVALID_INPUT,
    'No input provided',
    'Use a file path or pipe data to stdin',
    'Example: cat data.json | jt "$.name"',
  );
}

/**
 * 入力形式を推測する
 */
export function detectInputFormat(input: string, filePath?: string): InputFormat {
  // ファイル拡張子から判定
  if (filePath) {
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.jsonl') || filePath.endsWith('.ndjson')) return 'jsonl';
  }

  // 内容から判定
  const trimmed = input.trim();

  // JSON Lines: 複数行でそれぞれがJSONっぽい
  if (trimmed.includes('\n')) {
    const lines = trimmed.split('\n').filter((line) => line.trim());
    if (
      lines.length > 1 &&
      lines.every((line) => {
        const first = line.trim()[0];
        return (
          first === '{' ||
          first === '[' ||
          first === '"' ||
          /^(true|false|null|\d)/.test(line.trim())
        );
      })
    ) {
      return 'jsonl';
    }
  }

  // JSON: 中括弧または角括弧で始まる
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  // デフォルトはYAML（最も柔軟）
  return 'yaml';
}

/**
 * CLIメイン関数
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('jt')
    .description(packageInfo.description)
    .version(packageInfo.version)
    .argument('<query>', 'JSONata query expression')
    .argument('[file]', 'Input file (JSON, YAML, or JSON Lines)')
    .option(
      '-i, --input-format <format>',
      'Input format: json, yaml, jsonl (auto-detected if not specified)',
    )
    .option('-o, --output-format <format>', 'Output format', 'pretty')
    .addHelpText(
      'after',
      `
Examples:
  $ jt '$.name' data.json
  $ cat data.yaml | jt '$.items[*].price'
  $ jt '$[age > 25].name' users.jsonl -o jsonl
  $ jt '\${department: $sum(salary)}' employees.json -o yaml
  
Output formats:
  pretty   Pretty-printed JSON (default)
  compact  Compact JSON
  jsonl    JSON Lines (one JSON per line)
  yaml     YAML format
  csv      CSV format (requires array of objects)
`,
    )
    .action(async (query: string, file?: string) => {
      try {
        const opts = program.opts<{ inputFormat?: string; outputFormat?: string }>();

        // 入力を取得
        const input = await getInput(file);

        // 入力形式を決定（指定されていない場合は自動検出）
        const inputFormat = (opts.inputFormat as InputFormat) || detectInputFormat(input, file);

        // 出力形式を検証
        const outputFormat = (opts.outputFormat as OutputFormat) || 'pretty';
        if (!['pretty', 'compact', 'jsonl', 'yaml', 'csv'].includes(outputFormat)) {
          throw new JtError(
            ErrorCode.INVALID_FORMAT,
            `Invalid output format: ${outputFormat}`,
            undefined,
            'Use one of: pretty, compact, jsonl, yaml, csv',
          );
        }

        // クエリを実行
        const options: CliOptions = {
          query,
          inputFormat,
          outputFormat,
          input,
        };

        const result = await processQuery(options);

        // 結果を出力
        console.log(result);
      } catch (error) {
        // エラーハンドリング
        if (error instanceof JtError) {
          console.error(error.format());
          process.exit(1);
        } else if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        } else {
          console.error('An unknown error occurred');
          process.exit(1);
        }
      }
    });

  program.parse(argv);
}

// CLIとして実行された場合
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

const currentFile = fileURLToPath(import.meta.url);
const runningScript = process.argv[1];

if (runningScript && realpathSync(runningScript) === currentFile) {
  main().catch(console.error);
}
