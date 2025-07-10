# CLAUDE.md - jt プロジェクト開発ガイドライン

このドキュメントは、`jt` プロジェクトに特化した開発ガイドラインです。すべての開発者とAIアシスタントはこのガイドラインに従ってください。

## プロジェクト概要

`jt` は JSONata を使用してJSONデータをクエリ・変換するCLIツールです。TypeScriptで実装され、高品質なコードとユーザー体験を提供することを目指しています。

## 開発原則

### 1. テストファースト開発（TDD）の徹底

#### 実装フロー
```
1. test: ❌ 失敗するテストを書く
2. feat: ✅ テストが通る最小限の実装
3. refactor: ♻️ コードを改善（テストは通ったまま）
```

#### テスト作成のルール
- **ファイル名**: `src/query.ts` → `tests/query.test.ts`
- **カバレッジ目標**: 90%以上（ビジネスロジックは100%）
- **エッジケース**: 必ず境界値とエラーケースをテスト

#### 例：新機能実装時のテストファースト
```typescript
// 1. まずテストを書く (tests/formats/csv.test.ts)
describe('CSV output format', () => {
  it('should convert array of objects to CSV', () => {
    const input = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];
    expect(toCSV(input)).toBe('name,age\nAlice,30\nBob,25');
  });
});

// 2. 最小限の実装 (src/formats/csv.ts)
export function toCSV(data: unknown): string {
  // 実装
}

// 3. リファクタリング（パフォーマンス改善など）
```

### 2. エラーハンドリングの設計

#### ユーザーフレンドリーなエラーメッセージ
```typescript
// ❌ 悪い例
throw new Error('Invalid input');

// ✅ 良い例
throw new JtError({
  code: 'INVALID_JSON',
  message: 'Invalid JSON input',
  detail: `Unexpected token '${token}' at position ${position}`,
  suggestion: 'Check for missing quotes or commas in your JSON'
});
```

#### エラーカテゴリ
- `INVALID_INPUT`: 入力データの形式エラー
- `INVALID_QUERY`: JSONata式の構文エラー
- `EXECUTION_ERROR`: クエリ実行時のエラー
- `OUTPUT_ERROR`: 出力フォーマット変換エラー

### 3. コード品質基準

#### Biome設定の遵守
```bash
# 必ず実行
npm run lint        # Biomeでのリント
npm run format      # Biomeでのフォーマット
npm run typecheck   # TypeScriptの型チェック
```

#### 型安全性
- `any` 型の使用禁止（`unknown` を使用）
- 厳格な `null` チェック
- ユニオン型での網羅性チェック

### 4. モジュール設計

#### ディレクトリ構造と責務
```
src/
├── index.ts        # エントリーポイントのみ
├── cli.ts          # CLI定義（Commander.js）
├── query.ts        # JSONataクエリ実行
├── formats/        # 入出力フォーマット
│   ├── input.ts    # パーサー（JSON/YAML/JSONL）
│   └── output.ts   # フォーマッター（JSON/YAML/CSV等）
└── errors.ts       # エラー定義とハンドリング
```

#### 単一責任の原則
- 各モジュールは1つの責務のみ
- 依存関係は単方向（循環参照禁止）
- インターフェースで抽象化

### 5. パフォーマンス考慮事項

#### ストリーミング処理
- 大きなファイルに対応するため、可能な限りストリーミング処理
- メモリ効率を意識した実装

```typescript
// JSON Linesの処理例
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export async function* readJsonLines(path: string) {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    yield JSON.parse(line);
  }
}
```

### 6. CLI設計ガイドライン

#### コマンド構造
```bash
jt [options] <expression> [file]
```

#### オプション設計
- 短縮形と長い形式の両方を提供
- デフォルト値は最も一般的な使用ケース
- ヘルプメッセージは具体例を含める

```typescript
program
  .option('-i, --input <format>', 'input format', 'json')
  .option('-o, --output <format>', 'output format', 'pretty')
  .example('jt "$.users[age > 20]" data.json')
  .example('cat data.yaml | jt -i yaml "$.config"');
```

### 7. テストパターン

#### ユニットテスト
```typescript
// フォーマット変換のテスト
describe('YAML parser', () => {
  it('should parse valid YAML', () => {
    const yaml = 'name: Alice\nage: 30';
    expect(parseYAML(yaml)).toEqual({ name: 'Alice', age: 30 });
  });
  
  it('should throw on invalid YAML', () => {
    expect(() => parseYAML('invalid: [yaml')).toThrow(JtError);
  });
});
```

#### 統合テスト
```typescript
// CLIの統合テスト
describe('CLI integration', () => {
  it('should process file input', async () => {
    const result = await runCLI(['$.name', 'test.json']);
    expect(result.stdout).toBe('"Alice"');
    expect(result.exitCode).toBe(0);
  });
});
```

### 8. リリースプロセス

#### バージョニング（セマンティックバージョニング）
- `MAJOR`: 破壊的変更
- `MINOR`: 新機能追加
- `PATCH`: バグ修正

#### リリース前チェックリスト
- [ ] すべてのテストがパス
- [ ] カバレッジ90%以上
- [ ] Biomeエラーなし
- [ ] TypeScriptエラーなし
- [ ] CHANGELOG.md更新
- [ ] package.jsonのバージョン更新

### 9. コントリビューション受け入れ基準

#### PR要件
1. テストを含む（TDD実践の証跡）
2. 既存テストがすべてパス
3. Biomeチェックをパス
4. 適切なコミットメッセージ

#### コミットメッセージ形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

### 10. デバッグとトラブルシューティング

#### デバッグ出力
```typescript
// DEBUG環境変数で制御
if (process.env.DEBUG) {
  console.error(`[DEBUG] Query: ${expression}`);
  console.error(`[DEBUG] Input type: ${typeof data}`);
}
```

#### よくある問題と対処
- **大きなJSON**: ストリーミング処理で対応
- **複雑なクエリ**: タイムアウト設定の実装
- **メモリ不足**: Node.jsのヒープサイズ調整案内

## プロジェクト固有の規約

### JSONata使用時の注意
- エラーメッセージはJSONataのものをラップして分かりやすく
- よく使うパターンはドキュメント化
- パフォーマンスが重要な場合は事前評価

### 出力フォーマットの拡張
新しい出力フォーマットを追加する場合：
1. `OutputFormat` 型に追加
2. フォーマッター関数を実装
3. テストケースを網羅的に作成
4. READMEに使用例を追加

## 継続的改善

このドキュメントは生きたドキュメントです。プロジェクトの成長に合わせて更新してください。

### 更新が必要なタイミング
- 新しい開発パターンの確立時
- 頻出する問題の解決策発見時
- 外部ライブラリの重要な更新時