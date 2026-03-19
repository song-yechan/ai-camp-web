#!/bin/bash
# AB180 AI Camp - 사용량 자동 동기화 설치 스크립트
# 실행: bash scripts/install-sync.sh
# 또는: curl -sL <배포URL>/scripts/install-sync.sh | bash

set -euo pipefail

INSTALL_DIR="$HOME/.claude/scripts"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="com.ab180.aicamp.sync-usage"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======================================"
echo "  AB180 AI Camp 사용량 동기화 설치"
echo "======================================"
echo ""

# 1. 스크립트 디렉토리 생성
mkdir -p "$INSTALL_DIR"
mkdir -p "$PLIST_DIR"

# 2. 동기화 스크립트 복사 (같은 디렉토리의 sync-usage.sh 사용)
SYNC_SCRIPT_SRC="$SCRIPT_DIR/sync-usage.sh"
if [ ! -f "$SYNC_SCRIPT_SRC" ]; then
    echo "Error: sync-usage.sh not found at $SYNC_SCRIPT_SRC"
    echo "install-sync.sh와 sync-usage.sh가 같은 디렉토리에 있어야 합니다."
    exit 1
fi

cp "$SYNC_SCRIPT_SRC" "$INSTALL_DIR/sync-usage.sh"
chmod +x "$INSTALL_DIR/sync-usage.sh"
echo "[1/5] 동기화 스크립트 설치 완료"

# 3. API 토큰 입력 받기
TOKEN_FILE="$INSTALL_DIR/.ai-camp-token"
if [ -f "$TOKEN_FILE" ]; then
    echo ""
    echo "기존 토큰이 발견되었습니다."
    read -r -p "새 토큰으로 교체하시겠습니까? (y/N): " REPLACE_TOKEN
    if [ "$REPLACE_TOKEN" != "y" ] && [ "$REPLACE_TOKEN" != "Y" ]; then
        echo "[2/5] 기존 토큰 유지"
    else
        echo ""
        read -r -p "AI Camp 웹사이트에서 발급받은 API 토큰을 입력하세요: " API_TOKEN
        if [ -z "$API_TOKEN" ]; then
            echo "Error: 토큰이 비어있습니다."
            exit 1
        fi
        echo "$API_TOKEN" > "$TOKEN_FILE"
        chmod 600 "$TOKEN_FILE"
        echo "[2/5] 새 토큰 저장 완료"
    fi
else
    echo ""
    read -r -p "AI Camp 웹사이트에서 발급받은 API 토큰을 입력하세요: " API_TOKEN
    if [ -z "$API_TOKEN" ]; then
        echo "Error: 토큰이 비어있습니다."
        exit 1
    fi
    echo "$API_TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    echo "[2/5] 토큰 저장 완료"
fi

# 4. 기존 LaunchAgent 해제 (있으면)
if launchctl list "$PLIST_NAME" &>/dev/null; then
    launchctl unload "$PLIST_DIR/$PLIST_NAME.plist" 2>/dev/null || true
    echo "[3/5] 기존 LaunchAgent 해제"
else
    echo "[3/5] 기존 LaunchAgent 없음 (신규 설치)"
fi

# 5. LaunchAgent plist 생성
cat > "$PLIST_DIR/$PLIST_NAME.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$INSTALL_DIR/sync-usage.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>0</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/sync-usage.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/sync-usage.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
PLIST
echo "[4/5] LaunchAgent plist 생성 완료"

# 6. LaunchAgent 등록
launchctl load "$PLIST_DIR/$PLIST_NAME.plist"
echo "[5/5] LaunchAgent 등록 완료"

echo ""
echo "======================================"
echo "  설치 완료!"
echo "======================================"
echo ""
echo "  - 매일 자정(00:00) 자동 동기화됩니다."
echo "  - 수동 실행: bash ~/.claude/scripts/sync-usage.sh"
echo "  - 로그 확인: cat ~/.claude/scripts/sync-usage.log"
echo "  - 삭제: bash $(dirname "$0")/uninstall-sync.sh"
echo ""
