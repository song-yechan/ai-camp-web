#!/bin/bash
# AB180 AI Camp - 사용량 자동 동기화 삭제 스크립트
# 실행: bash scripts/uninstall-sync.sh

set -euo pipefail

INSTALL_DIR="$HOME/.claude/scripts"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="com.ab180.aicamp.sync-usage"

echo "======================================"
echo "  AB180 AI Camp 사용량 동기화 삭제"
echo "======================================"
echo ""

# 1. LaunchAgent 해제
if launchctl list "$PLIST_NAME" &>/dev/null; then
    launchctl unload "$PLIST_DIR/$PLIST_NAME.plist" 2>/dev/null || true
    echo "[1/4] LaunchAgent 해제 완료"
else
    echo "[1/4] LaunchAgent가 등록되어 있지 않음 (건너뜀)"
fi

# 2. plist 파일 삭제
if [ -f "$PLIST_DIR/$PLIST_NAME.plist" ]; then
    rm -f "$PLIST_DIR/$PLIST_NAME.plist"
    echo "[2/4] plist 파일 삭제 완료"
else
    echo "[2/4] plist 파일 없음 (건너뜀)"
fi

# 3. 동기화 스크립트 및 관련 파일 삭제
REMOVED=0
for FILE in "$INSTALL_DIR/sync-usage.sh" "$INSTALL_DIR/.ai-camp-token" "$INSTALL_DIR/sync-usage.log"; do
    if [ -f "$FILE" ]; then
        rm -f "$FILE"
        REMOVED=$((REMOVED + 1))
    fi
done
echo "[3/4] 관련 파일 ${REMOVED}개 삭제 완료"

# 4. 스크립트 디렉토리 정리 (비어있으면 삭제)
if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
    rmdir "$INSTALL_DIR"
    echo "[4/4] 빈 스크립트 디렉토리 삭제 완료"
else
    echo "[4/4] 스크립트 디렉토리에 다른 파일이 있어 유지"
fi

echo ""
echo "======================================"
echo "  삭제 완료!"
echo "======================================"
echo ""
