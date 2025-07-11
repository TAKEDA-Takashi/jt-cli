import chalk from 'chalk';
import yaml from 'js-yaml';
import { isColorEnabled } from './colorize';

export function formatYaml(data: unknown): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // js-yamlのdump関数を使用してYAML形式に変換
  // 循環参照はYAMLアンカー/エイリアスで処理される
  const yamlStr = yaml.dump(data);

  // 色付けが無効な場合はそのまま返す
  if (!isColorEnabled()) {
    return yamlStr;
  }

  // YAMLの色付け
  return colorizeYaml(yamlStr);
}

function colorizeYaml(yamlStr: string): string {
  const lines = yamlStr.split('\n');

  return lines
    .map((line) => {
      // コメント行
      if (line.trim().startsWith('#')) {
        return chalk.gray(line);
      }

      // キー: 値 形式
      const keyValueMatch = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (keyValueMatch) {
        const [, indent, key, value] = keyValueMatch;
        if (!indent || !key) return line; // 型ガード

        // 値が空の場合（ネストされたオブジェクトまたは配列の開始）
        if (!value || !value.trim()) {
          return `${indent}${chalk.blue(key)}:`;
        }

        // 値がある場合
        let coloredValue = value;

        // 文字列値（クォートあり）
        if (value.match(/^["'].*["']$/)) {
          coloredValue = chalk.green(value);
        }
        // 数値
        else if (value.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/)) {
          coloredValue = chalk.cyan(value);
        }
        // 真偽値
        else if (value === 'true' || value === 'false') {
          coloredValue = chalk.yellow(value);
        }
        // null
        else if (value === 'null' || value === '~') {
          coloredValue = chalk.gray(value);
        }
        // その他の文字列（クォートなし）
        else if (value.trim()) {
          coloredValue = chalk.green(value);
        }

        return `${indent}${chalk.blue(key)}: ${coloredValue}`;
      }

      // 配列要素
      const arrayMatch = line.match(/^(\s*)- (.*)$/);
      if (arrayMatch) {
        const [, indent, value] = arrayMatch;
        if (!indent || !value) return line; // 型ガード
        let coloredValue = value;

        // 値の色付け（上記と同じロジック）
        if (value.match(/^["'].*["']$/)) {
          coloredValue = chalk.green(value);
        } else if (value.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/)) {
          coloredValue = chalk.cyan(value);
        } else if (value === 'true' || value === 'false') {
          coloredValue = chalk.yellow(value);
        } else if (value === 'null' || value === '~') {
          coloredValue = chalk.gray(value);
        } else if (value.trim()) {
          coloredValue = chalk.green(value);
        }

        return `${indent}- ${coloredValue}`;
      }

      // その他の行はそのまま
      return line;
    })
    .join('\n');
}
