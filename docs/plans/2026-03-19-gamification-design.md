# AI Camp 게이미피케이션 + 프로필 + 비교 설계

## 1. 회원가입 시 역할 선택 + 관리자 조정

### 가입 플로우
Slack OAuth 완료 후 → 역할 선택 화면 (첫 로그인만)
- "개발자" / "비개발자" 선택
- 관리자(예찬)가 `/api/admin/users` 로 역할 변경 가능

### API
- `PATCH /api/admin/users/[id]` — role, cohort 변경 (관리자만)

## 2. 캠프 필터 + 배지

### 리더보드 탭
기존: 전체 / 비개발자 / 개발자
변경: **전체 / 1기 / 2기 / 비개발자 / 개발자**

### 배지 디자인
- 1기: 작은 pill 형태 "1기" (골드 보더)
- 2기: "2기" (블루 보더)
- 일반(캠프 미참여): 배지 없음

## 3. 스트릭 시스템 (듀오링고 참고)

### 핵심 메커니즘
- **일일 사용 = 1세션 이상** (usage_logs에 해당 날짜 데이터 존재)
- **연속 일수 카운트**: 오늘부터 역순으로 연속된 날 수
- **스트릭 아이콘**: 🔥 + 숫자 (리더보드 행에 표시)
- **스트릭 프리즈**: 주말(토/일) 자동 면제 (업무용이니까)

### DB
```sql
-- 스트릭은 usage_logs에서 계산 (별도 테이블 불필요)
-- 연속 사용일 = usage_logs에서 오늘부터 역순으로 연속된 date 수
```

### 프로필 표시
- 현재 스트릭: 🔥 12일
- 최장 스트릭: 🏆 23일
- GitHub 잔디 스타일 히트맵 (최근 90일)

## 4. 업적 뱃지

| 뱃지 | 조건 | 아이콘 |
|------|------|--------|
| First Step | 첫 세션 완료 | 👣 |
| Skill Maker | 첫 스킬 제작 (progress day3 block3 완료) | 🛠️ |
| $10 Club | 누적 $10 돌파 | 💰 |
| $100 Club | 누적 $100 돌파 | 💎 |
| Week Warrior | 7일 연속 스트릭 | ⚔️ |
| Month Master | 30일 연속 스트릭 | 👑 |
| Code Pusher | 첫 커밋 | 📦 |
| PR Hero | 첫 PR | 🦸 |
| Century | 100세션 달성 | 💯 |

### DB
```sql
create table badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_type)
);
```

## 5. 사용자 상세 페이지 (`/user/[id]`)

### 레이아웃
- 프로필 헤더: 아바타, 이름, 역할, 기수 배지
- 스탯 카드 4개: 총 비용, 세션, 커밋, 스트릭
- 사용량 차트: 일별 막대 차트 (최근 30일)
- 스트릭 히트맵: GitHub 잔디 (최근 90일)
- 업적 뱃지 그리드

## 6. 사용자 비교 (`/compare?a=id1&b=id2`)

### 레이아웃
- 두 사용자 프로필 나란히
- 스탯 비교 바 (누가 더 높은지 시각적으로)
- 일별 사용량 오버레이 차트
- 뱃지 비교

### 진입 방법
- 리더보드에서 "비교" 체크박스 → 2명 선택 → "비교하기" 버튼
