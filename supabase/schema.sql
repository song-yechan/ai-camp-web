-- AB180 AI Camp Web Schema

-- 사용자 (Google OAuth)
create table users (
  id uuid primary key default gen_random_uuid(),
  google_id text unique not null,
  email text unique not null,
  name text not null,
  avatar_url text,
  role text check (role in ('developer', 'non-developer')) default 'non-developer',
  department text,
  cohort integer default 2,
  max_streak integer default 0,
  api_token text unique, -- Stop Hook 인증용 토큰 (aicamp_ + 64-char hex)
  setup_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 일별 사용량 (Stop Hook으로 실시간 수집)
create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  cache_creation_tokens bigint default 0,
  cache_read_tokens bigint default 0,
  total_cost numeric(10, 4) default 0,
  sessions_count integer default 0,
  lines_added integer default 0,
  lines_removed integer default 0,
  commits integer default 0,
  pull_requests integer default 0,
  synced_at timestamptz default now(),
  unique(user_id, date)
);

-- 진행 추적
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  day integer not null check (day between 1 and 4),
  block text not null,
  completed_at timestamptz default now(),
  unique(user_id, day, block)
);

-- 업적 뱃지
create table badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_type)
);

-- RLS 활성화
alter table users enable row level security;
alter table usage_logs enable row level security;
alter table progress enable row level security;
alter table badges enable row level security;

-- 사용자 본인 데이터 읽기
create policy "Users can read own data" on users
  for select using (true);

-- 사용량은 모두 읽기 가능 (리더보드)
create policy "Usage logs readable by all" on usage_logs
  for select using (true);

-- 사용량 삽입은 service role만 (API secret)
create policy "Usage logs insert via service" on usage_logs
  for insert with check (true);

-- 진행 추적은 본인만 읽기/쓰기
create policy "Progress readable by all" on progress
  for select using (true);

create policy "Progress insert by owner" on progress
  for insert with check (true);

-- 뱃지는 모두 읽기 가능
create policy "Badges readable by all" on badges
  for select using (true);

create policy "Badges insert via service" on badges
  for insert with check (true);

-- 인덱스
create index idx_usage_logs_date on usage_logs(date);
create index idx_usage_logs_user_date on usage_logs(user_id, date);
create index idx_progress_user on progress(user_id);
create index idx_badges_user on badges(user_id);
