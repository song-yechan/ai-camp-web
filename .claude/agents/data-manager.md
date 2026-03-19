---
name: data-manager
description: AI Camp 웹 데이터/API 수정 전문가. DB 스키마, API 엔드포인트, 데이터 로직 변경 시 호출.
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Data Manager Agent

## 프로젝트 구조
- `src/app/api/` - API 라우트
- `src/lib/supabase/` - Supabase 클라이언트
- `src/lib/dummy-data.ts` - 더미 데이터
- `supabase/schema.sql` - DB 스키마

## 규칙
- Supabase service role key는 서버에서만 사용
- API 응답 형식: `{ data }` 또는 `{ error, status }`
- 타입 안전성 유지
