#!/usr/bin/env bash
set -euo pipefail

# リリース準備スクリプト
# Usage: ./scripts/release.sh <patch|minor|major> [--yes]
#
# 1. リリース前チェック（test, check, typecheck, build）
# 2. バージョン更新（package.json）
# 3. CHANGELOG.md の [Unreleased] セクションにバージョンとリリース日を設定
# 4. リリースブランチ作成 + コミット
# 5. GitHub PR作成

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# --- 引数チェック ---
usage() {
  echo "Usage: $0 <patch|minor|major> [--yes]"
  echo ""
  echo "Options:"
  echo "  -y, --yes  確認プロンプトをスキップする（非対話環境では必須）"
  echo ""
  echo "Examples:"
  echo "  $0 patch   # 1.2.4 -> 1.2.5"
  echo "  $0 minor   # 1.2.4 -> 1.3.0"
  echo "  $0 major   # 1.2.4 -> 2.0.0"
}

BUMP_TYPE=""
ASSUME_YES=false
for arg in "$@"; do
  case "$arg" in
    patch|minor|major) BUMP_TYPE="$arg" ;;
    -y|--yes) ASSUME_YES=true ;;
    *)
      echo "Error: 不明な引数です: $arg"
      echo ""
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$BUMP_TYPE" ]]; then
  usage
  exit 1
fi

# --- 前提条件チェック ---
# mainブランチにいることを確認
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: mainブランチから実行してください（現在: ${CURRENT_BRANCH}）"
  exit 1
fi

# ワーキングツリーがクリーンであることを確認
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: コミットされていない変更があります。先にコミットまたはstashしてください。"
  exit 1
fi

# mainが最新であることを確認
git fetch origin main --quiet
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)
if [[ "$LOCAL_HASH" != "$REMOTE_HASH" ]]; then
  echo "Error: ローカルのmainがリモートと一致しません。git pullしてください。"
  exit 1
fi

# --- バージョン計算 ---
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
RELEASE_DATE=$(date +%Y-%m-%d)
BRANCH_NAME="release/v${NEW_VERSION}"

echo "=== Release Preparation ==="
echo "  Current version: ${CURRENT_VERSION}"
echo "  New version:     ${NEW_VERSION} (${BUMP_TYPE})"
echo "  Release date:    ${RELEASE_DATE}"
echo "  Branch:          ${BRANCH_NAME}"
echo ""

# --- 確認 ---
if [[ "$ASSUME_YES" == true ]]; then
  echo "--yes が指定されたため確認をスキップします。"
elif [[ ! -t 0 ]]; then
  echo "Error: 標準入力が端末ではないため確認プロンプトを表示できません。"
  echo "       非対話環境で実行する場合は --yes を付けてください: $0 $BUMP_TYPE --yes"
  exit 1
else
  read -r -p "続行しますか？ (y/N): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "キャンセルしました。"
    exit 0
  fi
fi

# --- リリース前チェック ---
echo ""
echo "--- Running pre-release checks ---"

echo "[1/4] npm run check..."
npm run check

echo "[2/4] npm run typecheck..."
npm run typecheck

echo "[3/4] npm test..."
npm test -- --run

echo "[4/4] npm run build..."
npm run build

echo "--- All checks passed ---"
echo ""

# --- リリースブランチ作成 ---
echo "Creating branch: ${BRANCH_NAME}"
git switch -c "$BRANCH_NAME"

# --- package.json のバージョン更新 ---
echo "Updating package.json version to ${NEW_VERSION}"
# node で直接書き換え（JSONフォーマットを維持）
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# --- CHANGELOG.md の更新 ---
echo "Updating CHANGELOG.md"
node -e "
const fs = require('fs');
let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// [Unreleased] の下に新バージョンセクションを追加
changelog = changelog.replace(
  '## [Unreleased]',
  '## [Unreleased]\n\n## [${NEW_VERSION}] - ${RELEASE_DATE}'
);

// フッターのリンクを更新
changelog = changelog.replace(
  '[Unreleased]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v${CURRENT_VERSION}...HEAD',
  '[Unreleased]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v${NEW_VERSION}...HEAD\n[${NEW_VERSION}]: https://github.com/TAKEDA-Takashi/jt-cli/compare/v${CURRENT_VERSION}...v${NEW_VERSION}'
);

fs.writeFileSync('CHANGELOG.md', changelog);
"

# --- package-lock.json の更新 ---
echo "Updating package-lock.json"
npm install --package-lock-only

# --- コミット ---
echo "Creating release commit"
git add package.json CHANGELOG.md package-lock.json
git commit -m "chore: release v${NEW_VERSION}"

# --- プッシュ & PR作成 ---
echo "Pushing branch and creating PR"
git push -u origin "$BRANCH_NAME"

PR_URL=$(gh pr create \
  --title "chore: release v${NEW_VERSION}" \
  --body "$(cat <<PREOF
## Release v${NEW_VERSION}

### Checklist
- [x] All tests pass (\`npm test\`)
- [x] Biome check passes (\`npm run check\`)
- [x] TypeScript check passes (\`npm run typecheck\`)
- [x] Build succeeds (\`npm run build\`)
- [ ] CHANGELOG.md \`[Unreleased]\` section has release notes
- [ ] README.md is up to date

### After Merge
PR マージ後、以下を実行してリリースをトリガーしてください:

\`\`\`bash
git switch main && git pull
git tag v${NEW_VERSION}
git push origin v${NEW_VERSION}
\`\`\`
PREOF
)")

echo ""
echo "=== Release PR created ==="
echo "  PR: ${PR_URL}"
echo ""
echo "次のステップ:"
echo "  1. CHANGELOG.md の [Unreleased] セクションにリリースノートを記載"
echo "  2. README.md に新機能のドキュメントを追加（必要に応じて）"
echo "  3. PR をレビュー・マージ"
echo "  4. マージ後にタグを打ってpush:"
echo "     git switch main && git pull"
echo "     git tag v${NEW_VERSION}"
echo "     git push origin v${NEW_VERSION}"
