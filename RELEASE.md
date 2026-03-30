# リリースプロセス

このドキュメントは `jt-cli` のリリースプロセスを説明します。

## 前提条件

1. NPMアカウントを持っていること（OIDC Trusted Publishing設定済み）
2. GitHub CLIがインストール・認証済みであること（`gh auth status`）
3. mainブランチが最新の状態であること

## リリース手順

### 1. リリーススクリプトの実行

mainブランチから以下を実行します:

```bash
npm run release <patch|minor|major>
```

スクリプトが自動的に以下を行います:
1. 前提条件チェック（mainブランチ、クリーンな状態、リモートと同期）
2. リリース前チェック（test, check, typecheck, build）
3. バージョン更新（package.json, package-lock.json）
4. CHANGELOG.mdの`[Unreleased]`セクションにバージョンと日付を設定
5. リリースブランチ作成（`release/vX.Y.Z`）+ コミット + プッシュ
6. GitHub PR作成

### 2. リリースPRの編集

PRが作成されたら、以下を行います:

- **CHANGELOG.md**: `[Unreleased]`セクションにリリースノートを記載
  - Added / Changed / Fixed / Removed / Security などのカテゴリを使用
- **README.md**: 新機能のドキュメントを追加（必要に応じて）
- **破壊的変更がある場合**: 移行ガイドを記載

### 3. PRのレビューとマージ

PRをレビューし、mainにマージします。

### 4. タグの作成とプッシュ

マージ後、以下を実行してリリースをトリガーします:

```bash
git switch main && git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

タグのプッシュにより、GitHub Actionsが自動的に:
1. すべてのテストを実行
2. ビルドを実行
3. NPMにパッケージを公開（OIDC認証）
4. GitHub Releaseを作成

進行状況は [Actions タブ](https://github.com/TAKEDA-Takashi/jt-cli/actions) で確認できます。

## セマンティックバージョニング

- **PATCH (x.x.1)**: バグ修正、後方互換性のある修正
- **MINOR (x.1.0)**: 新機能追加、後方互換性あり
- **MAJOR (1.0.0)**: 破壊的変更、後方互換性なし

## CHANGELOGのカテゴリ

[Keep a Changelog](https://keepachangelog.com/) の形式に従います:

- **Added**: 新機能
- **Changed**: 既存機能の変更
- **Deprecated**: 将来削除される機能
- **Removed**: 削除された機能
- **Fixed**: バグ修正
- **Security**: セキュリティ関連の修正
- **Updated**: 依存関係の更新

## トラブルシューティング

### NPM公開エラー

エラー: `npm ERR! code E401`

解決方法:
1. npm OIDC (Trusted Publishing) の設定を確認
2. GitHub Actionsの`id-token: write`パーミッションを確認

### バージョン不一致エラー

エラー: `Tag version does not match package.json version`

解決方法:
1. package.jsonのバージョンとタグが一致していることを確認
2. 不一致の場合、タグを削除して正しいバージョンで再作成

### ローカルでの公開テスト（dry-run）

```bash
npm publish --dry-run
```
