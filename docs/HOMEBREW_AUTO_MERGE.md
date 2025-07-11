# Homebrew Tap自動承認設定ガイド

homebrew-tapリポジトリでjt-cliの更新PRを自動承認・マージする設定方法です。

## 方法1: GitHub Auto-merge機能を使用

### 設定手順
1. homebrew-tapリポジトリの Settings > General
2. "Pull Requests" セクションで以下を有効化:
   - Allow auto-merge
   - Automatically delete head branches

### ワークフロー側の対応
`.github/workflows/update-homebrew.yml`に以下を追加:

```yaml
- name: Enable auto-merge
  if: steps.create-pr.outputs.pull-request-number
  run: |
    gh pr merge ${{ steps.create-pr.outputs.pull-request-number }} \
      --auto --merge \
      --repo TAKEDA-Takashi/homebrew-tap
  env:
    GH_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

## 方法2: 専用のGitHub Actionsワークフローを作成

homebrew-tapリポジトリに以下のワークフローを追加:

```yaml
# .github/workflows/auto-merge-jt-cli.yml
name: Auto-merge jt-cli updates

on:
  pull_request:
    types: [opened, reopened]
    paths:
      - 'Formula/jt-cli.rb'

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: |
      github.event.pull_request.user.login == 'github-actions[bot]' &&
      startsWith(github.event.pull_request.title, 'Update jt-cli to version')
    steps:
      - name: Approve PR
        uses: hmarr/auto-approve-action@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Auto-merge PR
        run: |
          gh pr merge ${{ github.event.pull_request.number }} \
            --auto --merge \
            --delete-branch
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 方法3: Mergifyを使用

homebrew-tapリポジトリのルートに`.mergify.yml`を作成:

```yaml
pull_request_rules:
  - name: Auto-merge jt-cli updates
    conditions:
      - author=github-actions[bot]
      - title~=^Update jt-cli to version
      - files=Formula/jt-cli.rb
      - "#files=1"
    actions:
      merge:
        method: merge
        delete_head_branch: true
```

## 推奨: 方法1 + ワークフローの更新

最もシンプルで確実な方法は、GitHub Auto-merge機能を有効化し、PRを作成する側のワークフローで自動マージを有効にすることです。

### jt-cli側のワークフロー更新

`.github/workflows/update-homebrew.yml`を以下のように修正:

```yaml
- name: Create Pull Request
  id: create-pr
  uses: peter-evans/create-pull-request@v5
  with:
    token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
    path: homebrew-tap
    commit-message: "chore: update jt-cli to version ${{ steps.release-info.outputs.VERSION }}"
    title: "Update jt-cli to version ${{ steps.release-info.outputs.VERSION }}"
    body: |
      Automated update of jt-cli formula to version ${{ steps.release-info.outputs.VERSION }}.
      
      - Updated tarball URL
      - Updated SHA256 checksum
      
      This PR was automatically created by the jt-cli release workflow.
    branch: update-jt-cli-${{ steps.release-info.outputs.VERSION }}
    delete-branch: true

- name: Enable auto-merge
  if: steps.create-pr.outputs.pull-request-number
  run: |
    cd homebrew-tap
    gh pr merge ${{ steps.create-pr.outputs.pull-request-number }} \
      --auto --merge \
      --repo TAKEDA-Takashi/homebrew-tap
  env:
    GH_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

この設定により、すべてのチェックが通れば自動的にマージされます。