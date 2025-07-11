# Homebrew自動更新の設定手順

このドキュメントでは、jt-cliのリリース時にHomebrew formulaを自動更新するための設定手順を説明します。

## 概要

jt-cliの新バージョンがnpmに公開されると、GitHub Actionsが自動的に独自tapリポジトリ（homebrew-tap）のFormulaを更新するPull Requestを作成します。

## 必要な設定

### 1. GitHub Personal Access Token の作成

homebrew-tapリポジトリへのアクセス権限を持つトークンが必要です。

1. GitHubの[Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)にアクセス
2. "Generate new token (classic)" をクリック
3. 以下の権限を付与:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. トークンを生成し、安全な場所にコピー

### 2. GitHub Secretsの設定

jt-cliリポジトリに以下のSecretを追加します。

1. リポジトリの Settings > Secrets and variables > Actions にアクセス
2. "New repository secret" をクリック
3. 以下のSecretを追加:
   - **Name**: `HOMEBREW_TAP_TOKEN`
   - **Value**: 上記で作成したPersonal Access Token

## ワークフローの動作

1. `v*` タグがプッシュされ、Releaseワークフローが実行される
2. npmへの公開が成功すると、update-homebrewワークフローがトリガーされる
3. 最新バージョンの情報を取得:
   - npm registryからtarballのURLを取得
   - tarballをダウンロードしてSHA256を計算
4. homebrew-tapリポジトリをチェックアウト
5. Formula/jt-cli.rbファイルを更新
6. 変更をコミットし、Pull Requestを作成

## 手動での更新が必要な場合

自動更新が失敗した場合や、手動で更新したい場合は以下の手順を実行します。

```bash
# 1. homebrew-tapリポジトリをクローン
git clone https://github.com/TAKEDA-Takashi/homebrew-tap.git
cd homebrew-tap

# 2. 新しいブランチを作成
git checkout -b update-jt-cli-VERSION

# 3. tarballのURLとSHA256を取得
VERSION="1.2.0"  # 更新するバージョン
TARBALL_URL="https://registry.npmjs.org/@2017takeda/jt-cli/-/jt-cli-${VERSION}.tgz"
curl -sL "$TARBALL_URL" -o package.tgz
SHA256=$(sha256sum package.tgz | cut -d' ' -f1)

# 4. Formula/jt-cli.rbを編集
# - url を新しいTARBALL_URLに更新
# - sha256 を新しいSHA256に更新

# 5. 変更をコミット
git add Formula/jt-cli.rb
git commit -m "chore: update jt-cli to version ${VERSION}"

# 6. プッシュしてPull Requestを作成
git push origin update-jt-cli-VERSION
```

## トラブルシューティング

### ワークフローが実行されない

- Releaseワークフローが成功しているか確認
- GitHub Actionsの実行ログを確認

### Pull Requestの作成に失敗

- `HOMEBREW_TAP_TOKEN` が正しく設定されているか確認
- トークンに必要な権限があるか確認
- homebrew-tapリポジトリへのアクセス権限があるか確認

### SHA256が一致しない

- npmに公開されたパッケージが正しいか確認
- ダウンロードしたtarballが破損していないか確認

## 関連ファイル

- `.github/workflows/update-homebrew.yml`: 自動更新ワークフロー
- `.github/workflows/release.yml`: リリースワークフロー
- `homebrew-formula.rb`: ローカル開発用のFormula（参考用）