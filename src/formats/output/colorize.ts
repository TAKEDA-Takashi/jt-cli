import chalk from 'chalk';

// 色付けが有効かどうかを判定
export function isColorEnabled(): boolean {
  const env = process.env as Record<string, string | undefined>;

  // NO_COLOR環境変数が設定されている場合は無効
  if (env['NO_COLOR']) {
    return false;
  }

  // Force colorを環境変数で制御
  if (env['FORCE_COLOR'] === '0') {
    return false;
  }

  // TTYでない場合でもFORCE_COLORが設定されていれば有効
  if (env['FORCE_COLOR']) {
    return true;
  }

  // 標準出力がTTYかどうかで判定
  return process.stdout.isTTY === true;
}

// JSON値を再帰的に色付け
export function colorizeJson(data: unknown, indent = 0): string {
  if (!isColorEnabled()) {
    // undefinedの場合は空文字列を返す（JSON.stringifyと同じ動作）
    if (data === undefined) {
      return '';
    }
    return JSON.stringify(data, null, 2);
  }

  const spaces = ' '.repeat(indent);

  if (data === null) {
    return chalk.gray('null');
  }

  if (data === undefined) {
    // undefinedは空文字列を返す（JSON標準準拠）
    return '';
  }

  if (typeof data === 'boolean') {
    return chalk.yellow(String(data));
  }

  if (typeof data === 'number') {
    return chalk.cyan(String(data));
  }

  if (typeof data === 'string') {
    return chalk.green(JSON.stringify(data));
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]';
    }

    const items = data
      .map((item, index) => {
        const comma = index < data.length - 1 ? ',' : '';
        return `${spaces}  ${colorizeJson(item, indent + 2)}${comma}`;
      })
      .join('\n');

    return `[\n${items}\n${spaces}]`;
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return '{}';
    }

    const items = entries
      .map(([key, value], index) => {
        const comma = index < entries.length - 1 ? ',' : '';
        const coloredKey = chalk.blue(JSON.stringify(key));
        const coloredValue = colorizeJson(value, indent + 2);
        return `${spaces}  ${coloredKey}: ${coloredValue}${comma}`;
      })
      .join('\n');

    return `{\n${items}\n${spaces}}`;
  }

  // その他の型はそのまま文字列化
  return String(data);
}

// コンパクトフォーマット用の色付け（1行）
export function colorizeJsonCompact(data: unknown): string {
  if (!isColorEnabled()) {
    return JSON.stringify(data);
  }

  // 一旦通常のJSON文字列に変換
  const jsonStr = JSON.stringify(data);

  // トークンベースのアプローチ
  let result = '';
  let i = 0;

  while (i < jsonStr.length) {
    const char = jsonStr[i];

    // 文字列の処理
    if (char === '"') {
      let str = '"';
      let j = i + 1;
      let escaped = false;

      while (j < jsonStr.length) {
        const c = jsonStr[j];
        str += c;

        if (c === '\\' && !escaped) {
          escaped = true;
        } else if (c === '"' && !escaped) {
          // 文字列の終了
          if (j + 1 < jsonStr.length && jsonStr[j + 1] === ':') {
            // プロパティ名
            result += chalk.blue(str);
          } else {
            // 値の文字列
            result += chalk.green(str);
          }
          i = j + 1;
          break;
        } else {
          escaped = false;
        }
        j++;
      }
      continue;
    }

    // 数値の処理
    if (
      (char && /\d/.test(char)) ||
      (char === '-' && i + 1 < jsonStr.length && /\d/.test(jsonStr[i + 1] ?? ''))
    ) {
      let numStr = '';
      let j = i;
      while (j < jsonStr.length && /[\d.eE+-]/.test(jsonStr[j] ?? '')) {
        numStr += jsonStr[j];
        j++;
      }
      result += chalk.cyan(numStr);
      i = j;
      continue;
    }

    // 真偽値とnullの処理
    if (jsonStr.substr(i, 4) === 'true') {
      result += chalk.yellow('true');
      i += 4;
      continue;
    }
    if (jsonStr.substr(i, 5) === 'false') {
      result += chalk.yellow('false');
      i += 5;
      continue;
    }
    if (jsonStr.substr(i, 4) === 'null') {
      result += chalk.gray('null');
      i += 4;
      continue;
    }

    // その他の文字
    result += char;
    i++;
  }

  return result;
}
