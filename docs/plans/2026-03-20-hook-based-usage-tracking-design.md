# Hook 기반 사용량 추적 설계

## 배경

기존 설계는 Anthropic Analytics API (Admin API key)로 Cron 기반 사용량 수집이었으나,
Teams 플랜에서는 Admin API가 작동하지 않음이 확인됨.
ainativecamp의 Stop Hook 방식을 참조하여 로컬 JSONL 파싱 + 서버 POST 방식으로 교체.

## 전체 흐름

```
1. Google OAuth 로그인 (@ab180.co) → users 테이블에 api_token 자동 발급
2. 대시보드에서 curl setup 명령어 복사
3. 터미널에 붙여넣기 (1회):
   → ~/.config/ai-camp/token 저장
   → ~/.config/ai-camp/report-usage.js 다운로드
   → ~/.claude/settings.json에 Stop hook 등록
4. 매 세션 종료 시 자동:
   → JSONL 파싱 → POST /api/usage/submit → usage_logs upsert
5. 리더보드 실시간 반영
```

## DB 변경

```sql
ALTER TABLE users ADD COLUMN api_token text UNIQUE;
```

토큰 형식: `aicamp_` + crypto.randomBytes(32).toString('hex')

## API 변경

### 신규

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/setup` | GET | setup bash 스크립트 반환 |
| `/api/hook-script` | GET | report-usage.js 반환 |
| `/api/usage/submit` | POST | Hook에서 사용량 데이터 수신 |
| `/api/usage/onboard` | POST | 리더보드 초기 등록 (빈 레코드 생성) |

### 삭제

| Endpoint | 이유 |
|----------|------|
| `/api/cron/sync-usage` | Analytics API 의존 제거 |

### 변경 없음

- `/api/usage` (GET, 리더보드) — 데이터 shape 동일
- `/api/auth/*` — OAuth 후 api_token 자동 발급 로직만 추가
- `/api/user/[id]`, `/api/compare` — 버그 수정 (.eq 컬럼명)

## Hook 스크립트 설계

ainativecamp에서 검증된 패턴 차용:

- **5초 hard timeout** — 세션 종료 지연 방지
- **세션 JSONL 파싱** — `assistant` 메시지의 `message.usage` 필드에서 토큰 추출
- **모델별 가격** — opus/sonnet/haiku 각각 input/output/cache 단가
- **Delta 계산** — session-cache.json으로 resumed 세션 이중 집계 방지
- **로컬 큐** — 서버 다운 시 queue.jsonl에 저장, 다음 세션에서 재시도 (최대 10건)
- **Self-update** — 하루 1회 /api/hook-script에서 최신 버전 다운로드
- **Dedup** — session_id + _r{n} 형태로 서버 중복 제출 방지

## Setup 스크립트 설계

```bash
curl -sL "https://{APP_URL}/api/setup" | bash -s -- {api_token}
```

동작:
1. 토큰 검증 (`aicamp_` prefix)
2. `~/.config/ai-camp/token`에 저장 (chmod 600)
3. `~/.config/ai-camp/api_url`에 서버 URL 저장
4. `/api/hook-script`에서 report-usage.js 다운로드
5. `~/.claude/settings.json`에 Stop hook 등록 (기존 hook 보존)
6. `/api/usage/onboard`에 POST (리더보드 초기 등록)

## /api/usage/submit 데이터 형식

```json
{
  "session_id": "abc123",
  "date": "2026-03-20",
  "input_tokens": 15000,
  "output_tokens": 3000,
  "cache_creation_tokens": 500,
  "cache_read_tokens": 12000,
  "total_tokens": 30500,
  "total_cost": 0.45,
  "models_used": ["claude-sonnet-4-6"]
}
```

서버 처리:
1. Bearer 토큰으로 users.api_token 매칭 → user_id 확인
2. usage_logs에 upsert (ON CONFLICT user_id, date → 기존값에 ADD)
3. sessions_count += 1

## 프론트엔드 변경

- 가입 완료 / 대시보드에 **Setup 안내 섹션** 추가
  - 토큰 + curl 명령어 표시
  - 복사 버튼
  - "설정 완료 여부" 표시 (onboard API 호출 여부로 판단)

## 환경변수 변경

- 삭제: `CLAUDE_ADMIN_API_KEY`
- 삭제: `CRON_SECRET` (Cron 제거)
- 유지: 나머지 전부

## 버그 수정 (함께 처리)

- `src/app/api/user/[id]/route.ts`: `.eq("user_id", id)` → `.eq("id", id)`
- `src/app/api/compare/route.ts`: 동일 수정
