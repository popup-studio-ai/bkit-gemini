#!/usr/bin/env bash
# bkit Trust Bootstrap — v0.39.1+ headless trust 등록 자동화 (idempotent)
#
# 목적:
#   Gemini CLI v0.39.1+ (PR #25814)이 untrusted 워크스페이스에서
#   `gemini -p`/`gemini -e` 헤드리스 모드 실행을 차단. 본 스크립트는
#   현재 워크스페이스 절대 경로를 ~/.gemini/trustedFolders.json에
#   idempotent 등록한다.
#
# 사용:
#   bash scripts/bootstrap-trust.sh
#
# 무조건 권장하지만, bkit MCP는 GEMINI_CLI_TRUST_WORKSPACE='true' env로
# 이중화되어 있어 본 스크립트 미실행도 정상 동작.
#
# 참고:
#   - PR #25814: https://github.com/google-gemini/gemini-cli/pull/25814
#   - bkit-server.js: env.GEMINI_CLI_TRUST_WORKSPACE = 'true' (이미 적용)

set -euo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$HOME/.gemini/trustedFolders.json"

mkdir -p "$(dirname "$FILE")"
[ -f "$FILE" ] || echo '{}' > "$FILE"

# node로 idempotent JSON 갱신 (jq 의존성 회피)
WORKSPACE="$WORKSPACE" FILE="$FILE" node -e "
const fs = require('fs');
const file = process.env.FILE;
const ws = process.env.WORKSPACE;
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (data[ws] === 'TRUST_FOLDER') {
  console.log('[bkit] Already trusted: ' + ws);
  process.exit(0);
}
data[ws] = 'TRUST_FOLDER';
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('[bkit] Workspace registered: ' + ws);
"
