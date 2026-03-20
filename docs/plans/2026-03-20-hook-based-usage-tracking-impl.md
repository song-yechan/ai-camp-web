# Hook 기반 사용량 추적 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Analytics API (Cron) 방식을 Stop Hook (실시간) 방식으로 교체하여 Teams 플랜에서도 사용량 추적이 가능하게 한다.

**Architecture:** 참가자가 curl setup 1회 실행 → Stop Hook이 매 세션 종료 시 로컬 JSONL 파싱 → POST /api/usage/submit → Supabase usage_logs upsert. ainativecamp 구현을 참조하되 우리 스택(Next.js + Supabase + Google OAuth)에 맞게 적용.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres), Node.js (Hook 스크립트), Google OAuth

---

### Task 1: DB 스키마 — users 테이블에 api_token 컬럼 추가

**Files:**
- Modify: `supabase/schema.sql`

**Step 1: api_token 컬럼 추가**

`supabase/schema.sql`의 users 테이블에 추가:

```sql
-- users 테이블 끝부분에 추가
-- api_token은 Hook 인증용 (aicamp_ prefix + 64자 hex)
```

users 테이블 정의에 `api_token text unique` 컬럼 추가.

**Step 2: 커밋**

```bash
git add supabase/schema.sql
git commit -m "feat: add api_token column to users table"
```

---

### Task 2: OAuth callback — 가입 시 api_token 자동 발급

**Files:**
- Modify: `src/app/api/auth/google/callback/route.ts`

**Step 1: crypto import + 토큰 생성 함수 추가**

파일 상단에:
```typescript
import crypto from "crypto";

function generateApiToken(): string {
  return `aicamp_${crypto.randomBytes(32).toString("hex")}`;
}
```

**Step 2: upsert 시 신규 유저에게만 토큰 발급**

기존 upsert 로직에서:
- 신규 유저(`isNewUser === true`)인 경우 `api_token: generateApiToken()` 포함
- 기존 유저는 api_token 건드리지 않음 (upsert에서 제외)

구체적으로: `isNewUser` 분기에서 upsert payload에 `api_token` 조건부 추가.
기존 유저가 토큰이 없는 경우를 위해 `existingUser` 조회 시 `api_token` 필드도 select.
토큰이 null이면 새로 발급하여 update.

**Step 3: 커밋**

```bash
git add src/app/api/auth/google/callback/route.ts
git commit -m "feat: auto-generate api_token on user signup"
```

---

### Task 3: GET /api/setup — Setup bash 스크립트 엔드포인트

**Files:**
- Create: `src/app/api/setup/route.ts`

**Step 1: 구현**

ainativecamp의 `/api/setup` 참조. 우리 버전:
- 토큰 검증: `aicamp_` prefix
- `~/.config/ai-camp/token`에 저장 (chmod 600)
- `~/.config/ai-camp/api_url`에 서버 URL 저장
- `/api/hook-script`에서 report-usage.js 다운로드
- `~/.claude/settings.json`에 Stop hook 등록 (node 실행, matcher: `.*`)
- 기존 ai-camp hook이 있으면 교체, 다른 hook은 보존
- `/api/usage/onboard`에 POST (리더보드 초기 등록)
- Content-Type: `text/plain`으로 bash 스크립트 반환

핵심 로직 (bash):
```bash
#!/bin/bash
set -e
TOKEN="${1:?"사용법: curl -sL .../api/setup | bash -s -- <your-token>"}"
API_URL="__APP_URL__"  # 서버에서 동적 치환

# 1. 토큰 검증
[[ "$TOKEN" =~ ^aicamp_ ]] || { echo "❌ 유효하지 않은 토큰"; exit 1; }

# 2. 토큰 + API URL 저장
mkdir -p ~/.config/ai-camp
echo "$TOKEN" > ~/.config/ai-camp/token && chmod 600 ~/.config/ai-camp/token
echo "$API_URL" > ~/.config/ai-camp/api_url

# 3. Hook 스크립트 다운로드
curl -sf "$API_URL/api/hook-script" -o ~/.config/ai-camp/report-usage.js

# 4. settings.json에 Stop hook 등록 (node 스크립트)
# 기존 ai-camp hook 있으면 교체, 나머지 보존

# 5. onboard API 호출
curl -sf -X POST "$API_URL/api/usage/onboard" \
  -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1

echo "설정 완료! Claude Code를 쓰면 사용량이 자동으로 리더보드에 반영됩니다."
```

Route에서는 `NEXT_PUBLIC_APP_URL`을 스크립트 내 `__APP_URL__`에 치환하여 반환.

**Step 2: 커밋**

```bash
git add src/app/api/setup/route.ts
git commit -m "feat: add GET /api/setup endpoint for hook installation"
```

---

### Task 4: GET /api/hook-script — Hook JS 반환 엔드포인트

**Files:**
- Create: `src/app/api/hook-script/route.ts`

**Step 1: 구현**

ainativecamp의 `report-usage.js`를 우리 버전으로 적용:
- 5초 hard timeout
- stdin에서 `{ transcript_path, session_id }` 파싱
- JSONL에서 `assistant` 메시지의 `message.usage` 추출
- 모델별 가격 계산 (opus-4-6, sonnet-4-6, haiku-4-5)
- session-cache.json으로 delta 계산 (resumed 세션 이중 집계 방지)
- queue.jsonl 로컬 큐 (서버 다운 시 재시도)
- 하루 1회 self-update
- `~/.config/ai-camp/token`과 `~/.config/ai-camp/api_url` 읽기
- POST `/api/usage/submit`으로 전송

Content-Type: `application/javascript`로 JS 파일 반환.

ainativecamp 코드를 기반으로 하되, 경로를 `~/.config/ai-camp/`으로 변경.

**Step 2: 커밋**

```bash
git add src/app/api/hook-script/route.ts
git commit -m "feat: add GET /api/hook-script endpoint"
```

---

### Task 5: POST /api/usage/submit — Hook 데이터 수신 엔드포인트

**Files:**
- Create: `src/app/api/usage/submit/route.ts`

**Step 1: 구현**

```typescript
// 인증: Authorization: Bearer aicamp_xxx → users.api_token 매칭
// Body:
// {
//   session_id: string,
//   date: string (YYYY-MM-DD),
//   input_tokens: number,
//   output_tokens: number,
//   cache_creation_tokens: number,
//   cache_read_tokens: number,
//   total_tokens: number,
//   total_cost: number,
//   models_used: string[]
// }

// 처리:
// 1. Bearer 토큰으로 users 테이블에서 user_id 조회
// 2. 기존 usage_logs에서 해당 user_id + date 조회
// 3. 있으면: 기존값에 ADD (토큰, 비용, 세션수 누적)
// 4. 없으면: INSERT
// 5. sessions_count += 1
```

Supabase service role로 usage_logs upsert.
중복 세션 방지: session_id가 같으면 무시 (선택적 — 간단히 구현하려면 항상 ADD).

**Step 2: 커밋**

```bash
git add src/app/api/usage/submit/route.ts
git commit -m "feat: add POST /api/usage/submit endpoint for hook data"
```

---

### Task 6: POST /api/usage/onboard — 리더보드 초기 등록

**Files:**
- Create: `src/app/api/usage/onboard/route.ts`

**Step 1: 구현**

```typescript
// 인증: Authorization: Bearer aicamp_xxx
// 동작: 해당 유저의 오늘 날짜 usage_logs가 없으면 빈 레코드 생성
// 이미 있으면 아무것도 안 함
// 목적: setup 직후 리더보드에 이름이 보이도록
```

**Step 2: 커밋**

```bash
git add src/app/api/usage/onboard/route.ts
git commit -m "feat: add POST /api/usage/onboard endpoint"
```

---

### Task 7: 프론트엔드 — Setup 안내 컴포넌트

**Files:**
- Create: `src/components/SetupGuide.tsx`
- Modify: `src/app/page.tsx` 또는 대시보드 레이아웃

**Step 1: SetupGuide 컴포넌트 구현**

로그인한 유저에게 표시:
- 유저의 api_token을 포함한 curl 명령어
- 복사 버튼
- "이게 뭘 하는 건가요?" 접이식 설명

```
가입 완료!
Claude Code 사용량이 자동으로 리더보드에 반영됩니다.

터미널에 아래 한 줄만 붙여넣기하세요:
┌──────────────────────────────────────────────────┐
│ curl -sL "{APP_URL}/api/setup" | bash -s -- {TOKEN} │  [복사]
└──────────────────────────────────────────────────┘

이게 뭘 하는 건가요?
▸ 내 계정 인증 토큰을 ~/.config/ai-camp/에 저장
▸ Claude Code에 Stop 훅을 설치 — 세션 종료 시 사용량 자동 전송
```

**Step 2: 유저 토큰 조회 API**

현재 세션 쿠키로 인증된 유저의 api_token을 반환하는 엔드포인트 필요.
`GET /api/me` 또는 기존 유저 API 확장.

**Step 3: 커밋**

```bash
git add src/components/SetupGuide.tsx src/app/api/me/route.ts
git commit -m "feat: add SetupGuide component with curl command"
```

---

### Task 8: Cron + Analytics API 제거

**Files:**
- Delete: `src/app/api/cron/sync-usage/route.ts`
- Modify: `vercel.json` — cron 설정 제거
- Modify: `.env.local.example` — `CLAUDE_ADMIN_API_KEY`, `CRON_SECRET` 제거

**Step 1: 파일 삭제 + 수정**

```bash
rm src/app/api/cron/sync-usage/route.ts
rmdir src/app/api/cron/sync-usage
rmdir src/app/api/cron
```

vercel.json에서 `crons` 배열 제거.
.env.local.example에서 `CLAUDE_ADMIN_API_KEY`와 `CRON_SECRET` 라인 제거.

**Step 2: 커밋**

```bash
git add -A
git commit -m "refactor: remove Analytics API cron, replaced by Stop Hook"
```

---

### Task 9: 버그 수정 — user/[id]와 compare의 .eq 컬럼명

**Files:**
- Modify: `src/app/api/user/[id]/route.ts`
- Modify: `src/app/api/compare/route.ts`

**Step 1: 수정**

두 파일 모두에서 `.eq("user_id", id)` → `.eq("id", id)` 수정.
users 테이블의 PK 컬럼명이 `id`이므로.

**Step 2: 커밋**

```bash
git add src/app/api/user/*/route.ts src/app/api/compare/route.ts
git commit -m "fix: correct .eq column name from user_id to id"
```

---

### Task 10: 통합 테스트 + 최종 검증

**Step 1: 로컬에서 전체 흐름 검증**

```bash
npm run dev
```

1. Google OAuth 로그인 → api_token 발급 확인
2. 대시보드에서 curl 명령어 표시 확인
3. curl setup 실행 → `~/.config/ai-camp/` 파일 생성 확인
4. `~/.claude/settings.json`에 Stop hook 등록 확인
5. `/api/usage/submit`에 테스트 POST → usage_logs 기록 확인
6. 리더보드에 반영 확인

**Step 2: 최종 커밋**

```bash
git add -A
git commit -m "feat: complete hook-based usage tracking system"
```
