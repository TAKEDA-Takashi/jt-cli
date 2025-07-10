# リリースプロセス

このドキュメントは `jt-cli` のリリースプロセスを説明します。

## 前提条件

1. NPMアカウントを持っていること
2. GitHub Secretsに `NPM_TOKEN` が設定されていること
3. mainブランチが最新の状態であること

## リリース手順

### 1. 変更内容の確認

```bash
# mainブランチを最新に
git checkout main
git pull origin main

# テストがすべてパスすることを確認
npm test
npm run lint:check
npm run typecheck
```

### 2. バージョンの更新

```bash
# パッチリリース (0.1.0 → 0.1.1)
npm version patch

# マイナーリリース (0.1.0 → 0.2.0)
npm version minor

# メジャーリリース (0.1.0 → 1.0.0)
npm version major
```

このコマンドは以下を自動的に行います：
- package.json のバージョンを更新
- Git コミットを作成
- バージョンタグを作成（例: v0.1.1）

### 3. 変更をプッシュ

```bash
# コミットとタグをプッシュ
git push origin main
git push origin --tags
```

### 4. 自動リリースの確認

タグのプッシュにより、GitHub Actionsが自動的に：
1. すべてのテストを実行
2. ビルドを実行
3. NPMにパッケージを公開
4. GitHub Releaseを作成

進行状況は [Actions タブ](https://github.com/TAKEDA-Takashi/jt-cli/actions) で確認できます。

## トラブルシューティング

### NPM_TOKEN エラー

エラー: `npm ERR! code E401`

解決方法：
1. NPMトークンが有効であることを確認
2. GitHub Secrets の `NPM_TOKEN` を更新

### バージョン不一致エラー

エラー: `Tag version does not match package.json version`

解決方法：
1. package.json のバージョンを手動で修正
2. `git add package.json && git commit -m "fix: version"`
3. 正しいバージョンでタグを作り直す

## 初回公開時の注意

初回公開前に以下を確認：

1. パッケージ名が利用可能か確認
   ```bash
   npm view @2017takeda/jt-cli
   ```

2. ローカルでの公開テスト（dry-run）
   ```bash
   npm publish --dry-run
   ```

3. package.json の設定確認
   - `name`: @2017takeda/jt-cli
   - `publishConfig.access`: "public"
   - `files`: 公開するファイルが正しく指定されているか

## セマンティックバージョニング

バージョン番号の付け方：

- **PATCH (x.x.1)**: バグ修正、後方互換性のある修正
- **MINOR (x.1.0)**: 新機能追加、後方互換性あり
- **MAJOR (1.0.0)**: 破壊的変更、後方互換性なし

## リリースノート

各リリースでは、以下の情報を含めることを推奨：

- 新機能
- バグ修正
- 破壊的変更（ある場合）
- 既知の問題
- 貢献者への謝辞