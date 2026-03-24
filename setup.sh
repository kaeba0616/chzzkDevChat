#!/usr/bin/env bash
set -euo pipefail

# chzzkDevChat 설치 스크립트
# 여러 번 실행해도 안전 (idempotent)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_JSON="$HOME/.mcp.json"
SERVER_PATH="$SCRIPT_DIR/server.ts"

# ── 1단계: Bun 설치 확인 ──

BUN_CMD=""
if command -v bun &>/dev/null; then
  BUN_CMD="$(command -v bun)"
elif [ -x "$HOME/.bun/bin/bun" ]; then
  BUN_CMD="$HOME/.bun/bin/bun"
fi

if [ -z "$BUN_CMD" ]; then
  echo "Bun이 설치되어 있지 않습니다. 설치를 시작합니다..."
  curl -fsSL https://bun.sh/install | bash
  BUN_CMD="$HOME/.bun/bin/bun"
  if [ ! -x "$BUN_CMD" ]; then
    echo "오류: Bun 설치에 실패했습니다."
    exit 1
  fi
  echo "Bun 설치 완료: $BUN_CMD"
else
  echo "Bun 확인: $BUN_CMD ($($BUN_CMD --version))"
fi

# ── 2단계: 의존성 설치 ──

echo "의존성 설치 중..."
cd "$SCRIPT_DIR"
"$BUN_CMD" install

# ── 3단계: ~/.mcp.json 등록 ──

# jq 없이 JSON 처리하기 위해 bun 인라인 스크립트 사용
MCP_JSON="$MCP_JSON" BUN_CMD="$BUN_CMD" SERVER_PATH="$SERVER_PATH" \
"$BUN_CMD" -e "
const fs = require('fs');
const mcpPath = process.env.MCP_JSON;
const bunCmd = process.env.BUN_CMD;
const serverPath = process.env.SERVER_PATH;

let config = { mcpServers: {} };

if (fs.existsSync(mcpPath)) {
  try {
    config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    if (!config.mcpServers) config.mcpServers = {};
  } catch (e) {
    console.error('경고: 기존 ~/.mcp.json 파싱 실패. 백업 후 새로 생성합니다.');
    fs.copyFileSync(mcpPath, mcpPath + '.bak');
    config = { mcpServers: {} };
  }
}

config.mcpServers['chzzk-ideas'] = {
  command: bunCmd,
  args: [serverPath]
};

fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n');
console.log('~/.mcp.json 등록 완료');
"

# ── 4단계: 완료 메시지 ──

cat <<'EOF'

✓ chzzkDevChat 설치 완료!

사용법:
  1. 작업할 프로젝트 폴더에서:
     claude --dangerously-load-development-channels server:chzzk-ideas

  2. 브라우저에서 http://localhost:8789 접속

  3. "설정" 버튼 클릭 → 치지직 채널 ID 입력

EOF
