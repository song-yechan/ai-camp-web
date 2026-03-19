#!/bin/bash
# AB180 AI Camp - Claude Code 사용량 동기화 스크립트
# macOS LaunchAgent가 매일 자정 실행하거나, 수동으로 실행 가능
# 사용법: bash ~/.claude/scripts/sync-usage.sh

set -euo pipefail

API_URL="https://ai-camp-web.vercel.app/api/usage"
TOKEN_FILE="$HOME/.claude/scripts/.ai-camp-token"
SESSIONS_DIR="$HOME/.claude/projects"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# 토큰 읽기
API_TOKEN=$(cat "$TOKEN_FILE" 2>/dev/null || true)
if [ -z "$API_TOKEN" ]; then
    echo "$LOG_PREFIX Error: API token not found at $TOKEN_FILE"
    exit 1
fi

# 세션 디렉토리 존재 확인
if [ ! -d "$SESSIONS_DIR" ]; then
    echo "$LOG_PREFIX Error: Sessions directory not found at $SESSIONS_DIR"
    exit 1
fi

echo "$LOG_PREFIX Starting usage sync..."

# Python3으로 JSONL 세션 파일 파싱 및 사용량 집계
USAGE_DATA=$(python3 << 'PYEOF'
import json
import os
import glob
import sys
from datetime import datetime, date

sessions_dir = os.path.expanduser("~/.claude/projects")
today = date.today().isoformat()

total = {
    "input_tokens": 0,
    "output_tokens": 0,
    "cache_creation_tokens": 0,
    "cache_read_tokens": 0,
    "sessions_count": 0
}

# 모든 프로젝트의 세션 파일 순회
for project_dir in glob.glob(os.path.join(sessions_dir, "*")):
    if not os.path.isdir(project_dir):
        continue

    for session_file in glob.glob(os.path.join(project_dir, "*.jsonl")):
        # 파일 수정 시간이 오늘인지 확인
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(session_file)).date().isoformat()
        except OSError:
            continue

        if mtime != today:
            continue

        session_counted = False
        try:
            with open(session_file, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("type") == "assistant" and "message" in data:
                            usage = data["message"].get("usage", {})
                            total["input_tokens"] += usage.get("input_tokens", 0)
                            total["output_tokens"] += usage.get("output_tokens", 0)
                            total["cache_creation_tokens"] += usage.get("cache_creation_input_tokens", 0)
                            total["cache_read_tokens"] += usage.get("cache_read_input_tokens", 0)
                            if not session_counted:
                                total["sessions_count"] += 1
                                session_counted = True
                    except json.JSONDecodeError:
                        continue
        except (PermissionError, OSError):
            continue

# 비용 계산 (Claude 모델 기준 대략적 추정)
# Opus: input $15/MTok, output $75/MTok, cache_read $1.5/MTok, cache_creation $18.75/MTok
cost = (
    total["input_tokens"] * 15 / 1_000_000
    + total["output_tokens"] * 75 / 1_000_000
    + total["cache_read_tokens"] * 1.5 / 1_000_000
    + total["cache_creation_tokens"] * 18.75 / 1_000_000
)

total["total_cost"] = round(cost, 4)
total["date"] = today

print(json.dumps(total))
PYEOF
)

# 파싱 실패 체크
if [ -z "$USAGE_DATA" ]; then
    echo "$LOG_PREFIX Error: Failed to parse session data"
    exit 1
fi

echo "$LOG_PREFIX Collected usage: $USAGE_DATA"

# 서버에 전송
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$USAGE_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "$LOG_PREFIX Sync successful (HTTP $HTTP_CODE): $BODY"
else
    echo "$LOG_PREFIX Sync failed (HTTP $HTTP_CODE): $BODY"
    exit 1
fi
