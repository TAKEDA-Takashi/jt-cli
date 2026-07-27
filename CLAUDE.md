# jt-cli

グローバル規約（日本語・品質ゲート・TDD・YAGNI等）は `~/.claude/CLAUDE.md` にある。ここには本プロジェクト固有の情報だけを書く。

## 概要

JSONata で JSON/YAML/JSONL/CSV をクエリ・変換する CLI。npm パッケージ `@2017takeda/jt-cli`、コマンド名は `jt`。クエリを省略するとフォーマット変換だけを行う。

## 品質チェック

`git commit` 時に PreToolUse hook（`.claude/settings.json`）が `npm run check && npm run typecheck && npm test -- --run` を自動実行する。手動で流す場合も同じ組み合わせを使う。

Biome 系スクリプトは名前から挙動が推測できないので注意:

| スクリプト | 実体 | ファイルを書き換えるか |
|-----------|------|----------------------|
| `npm run check` | `biome check .` | しない（hook が使うのはこれ） |
| `npm run check:fix` | `biome check --write .` | する（一括自動修正） |
| `npm run lint` | `biome lint --write .` | する |
| `npm run format` | `biome format --write .` | する |

カバレッジ閾値は `vitest.config.ts` の `thresholds` が唯一の定義元。ドキュメントに数値を書き足さない。

## 主要モジュールと責務

- `src/cli.ts` — `main()`。`--describe` と `--error-format` は Commander のパース前に argv から先読みする（パース失敗時にも JSON でエラーを返せるようにするため）
- `src/cli/` — `core.ts`（Commander 定義・入力取得・オプション検証）、`options.ts`（オプションの単一定義）、`executeCommand.ts`（実行とエラー出力）、`describe.ts`（`--describe` の JSON 出力）
- `src/adapters/` — ポート&アダプタ。ファイルシステム・環境変数・標準入出力・プロセス終了を `CliContext` に束ねて注入する。本番は `createProductionContext()`、テストは `createMockContext()`。実装コードから `process.*` や `fs` を直接呼ばずアダプタ経由にすることで、標準入力や `exit()` を含む経路をテストできる
- `src/formats/input/`・`src/formats/output/` — フォーマットごとに1ファイル + `index.ts` がディスパッチ
- `src/query.ts`（JSONata 実行）、`src/errors.ts`（`JtError`・`ErrorCode`）、`src/types.ts`（共有型）

## CLI オプションを追加するとき

`src/cli/options.ts` の `CLI_OPTIONS` が唯一の定義元で、Commander への登録（`cli/core.ts`）と `--describe` の JSON 出力（`cli/describe.ts`）が両方ここを読む。片方に直接書き足すと `--describe` の内容と実際のオプションがずれる。`hidden: true` は `--describe` の出力から除外する印。

## エラー

エラーは `JtError`（`src/errors.ts`）に統一する。`code`・`message`・`detail`・`suggestion` の4要素で構成し、`suggestion` にはユーザーが次に取れる行動を書く。`code` は `ErrorCode` enum の既存値（`INVALID_INPUT` / `INVALID_QUERY` / `EXECUTION_ERROR` / `OUTPUT_ERROR` / `FILE_NOT_FOUND` / `INVALID_FORMAT` / `INVALID_OUTPUT_FORMAT` / `UNKNOWN_ERROR`）から選び、安易に増やさない。

JSONata が投げた例外はそのまま表示せず `JtError` にラップして、構文エラーは `INVALID_QUERY`、評価時エラーは `EXECUTION_ERROR` に振り分ける。

## 出力フォーマットを追加する手順

1. `src/types.ts` の `OutputFormat` に値を追加
2. `src/formats/output/<name>.ts` にフォーマッターを実装
3. `src/formats/output/index.ts` の `switch` に分岐を追加し、`default` 節の `suggestion`（`Use one of: ...`）も更新する
4. `tests/formats/` にテストを追加
5. README の Output Formats に使用例を追加

入力フォーマットも `src/formats/input/` で同じ構造。

## リリース

`npm run release`（`scripts/release.sh`）でリリース PR を作り、タグ push で GitHub Actions が npm 公開する。手順の詳細は `RELEASE.md`、PR の要件は `CONTRIBUTING.md`。
