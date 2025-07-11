# リリースプロセス

このドキュメントは `jt-cli` のリリースプロセスを説明します。

## 前提条件

1. NPMアカウントを持っていること
2. GitHub Secretsに `NPM_TOKEN` が設定されていること
3. mainブランチが最新の状態であること

## リリース前チェックリスト

リリース前に以下の項目を必ず確認してください：

- [ ] すべてのテストがパス（`npm test`）
- [ ] Biomeリントチェックがパス（`npm run lint:check`）  
- [ ] TypeScriptチェックがパス（`npm run typecheck`）
- [ ] ビルドが成功（`npm run build`）
- [ ] CHANGELOG.mdのUnreleasedセクションが更新済み
- [ ] 新機能のドキュメント（README.md）が更新済み
- [ ] 破壊的変更がある場合、移行ガイドを記載

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

### 2. CHANGELOG.mdの更新

リリース前に必ずCHANGELOG.mdを更新します：

```bash
# 最後のリリース以降のコミットを確認
git log v$(node -p "require('./package.json').version")..HEAD --oneline

# CHANGELOG.mdのUnreleasedセクションに変更内容を記載
# 形式: Added/Changed/Fixed/Removed/Security
```

### 3. バージョンの更新

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

### 4. 変更をプッシュ

```bash
# コミットとタグをプッシュ
git push origin main
git push origin --tags
```

### 5. 自動リリースの確認

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

## リリースノート作成ガイドライン

### CHANGELOGのカテゴリ

Keep a Changelogの形式に従い、以下のカテゴリを使用：

- **Added**: 新機能
- **Changed**: 既存機能の変更
- **Deprecated**: 将来削除される機能
- **Removed**: 削除された機能
- **Fixed**: バグ修正
- **Security**: セキュリティ関連の修正

### 良い変更記述の例

```markdown
### Added
- CSV input format support with automatic header detection
- Raw string output option (-r/--raw-string) for unquoted string results

### Fixed
- Enhanced compact JSON colorization to handle escaped strings correctly
```

### リリースノートに含めるべき情報

- 新機能（使用例を含む）
- バグ修正（影響範囲を明記）
- 破壊的変更（移行ガイド必須）
- パフォーマンス改善
- 既知の問題
- 貢献者への謝辞

### コミットメッセージからの自動生成

```bash
# feat: で始まるコミットを抽出（新機能）
git log v1.1.0..HEAD --oneline | grep -E "^[a-f0-9]+ feat"

# fix: で始まるコミットを抽出（バグ修正）
git log v1.1.0..HEAD --oneline | grep -E "^[a-f0-9]+ fix"
```