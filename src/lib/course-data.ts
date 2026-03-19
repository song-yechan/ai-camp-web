export interface Block {
  id: string;
  title: string;
  summary: string;
}

export interface DayData {
  day: number;
  title: string;
  description: string;
  href: string;
  blocks: Block[];
}

export const DAYS: DayData[] = [
  {
    day: 1,
    title: "같이 시작합니다",
    description: "설치하고 첫 대화 나누기",
    href: "/course/day/1",
    blocks: [
      {
        id: "d1-setup",
        title: "Setup",
        summary:
          "Claude Code 설치 확인. `claude --version` 실행. 구독 확인 (Pro/Max/Teams/Enterprise)",
      },
      {
        id: "d1-concepts",
        title: "핵심 개념",
        summary:
          "지식노동자의 변화: How to do → What to delegate. AI 시대 3가지 핵심 역량: 맥락 정의, 판단 기준 설정, 결과 검증",
      },
      {
        id: "d1-experience",
        title: "Experience",
        summary:
          "Claude Code 첫 체험. 파일 생성/수정, 날짜 물어보기, 폴더 탐색",
      },
      {
        id: "d1-7features",
        title: "7대 기능 (CLAUDE.md / Skill / MCP / Subagent / Agent Teams / Hook / Plugin)",
        summary:
          "CLAUDE.md(영구 기억), Skill(레시피), MCP(USB-C), Subagent(위임), Agent Teams(협업), Hook(자동화), Plugin(패키지)",
      },
      {
        id: "d1-cli-git",
        title: "CLI + git",
        summary:
          "핵심 명령어 5개: cd, ls, pwd, cat, open. git 기초, GitHub 개념",
      },
    ],
  },
  {
    day: 2,
    title: "맥락을 연결합니다",
    description: "일하는 도구를 AI와 연결하기",
    href: "/course/day/2",
    blocks: [
      {
        id: "d2-context",
        title: "맥락의 중요성",
        summary:
          "같은 AI + 다른 맥락 = 다른 결과. Before/After 체험",
      },
      {
        id: "d2-philosophy",
        title: "도구별 설계 철학",
        summary:
          "Slack(대화 맥락), Gmail(커뮤니케이션), Notion(구조화), Drive(파일), Linear(작업 추적), Calendar(시간)",
      },
      {
        id: "d2-mcp-deep",
        title: "MCP 딥다이브",
        summary:
          "MCP 작동 원리. 연결 3가지: claude.ai 웹 설정, 명령어(--transport http), .mcp.json",
      },
      {
        id: "d2-mcp-practice",
        title: "MCP 실습",
        summary:
          "Slack + Notion MCP 직접 연결. 메시지 읽기, 페이지 검색 테스트",
      },
      {
        id: "d2-context-sync",
        title: "Context Sync",
        summary:
          "여러 도구에서 정보를 자동 수집하는 Context Sync 스킬 SKILL.md 작성",
      },
    ],
  },
  {
    day: 3,
    title: "스킬을 만듭니다",
    description: "내 머릿속을 AI가 이해하게",
    href: "/course/day/3",
    blocks: [
      {
        id: "d3-principle",
        title: "스킬 설계 원칙",
        summary:
          "좋은 스킬의 3조건: 명확한 목적, 정의된 입출력, 구체적 단계",
      },
      {
        id: "d3-clarify",
        title: "Clarify",
        summary:
          "Clarify 3유형: Vague(모호한 것), Unknown(모르는 것), Meta(관점 전환)",
      },
      {
        id: "d3-skill1",
        title: "스킬 제작 1",
        summary:
          '암묵지 발굴 질문 3개 → 문제를 "입력→처리→출력"으로 번역',
      },
      {
        id: "d3-skill2",
        title: "스킬 제작 2",
        summary:
          "SKILL.md 직접 작성 → 실행 → 재현성 테스트 → 디버깅",
      },
      {
        id: "d3-chaining",
        title: "스킬 체이닝",
        summary:
          "스킬 체이닝: 스킬A 출력 → 스킬B 입력. 공장 생산라인 비유",
      },
      {
        id: "d3-agent",
        title: "에이전트 활용",
        summary:
          "에이전트 활용: Subagent(독립 위임) vs Agent Teams(소통 협업). 병렬 작업 실습",
      },
    ],
  },
  {
    day: 4,
    title: "시스템을 만듭니다",
    description: "쓸수록 똑똑해지는 환경",
    href: "/course/day/4",
    blocks: [
      {
        id: "d4-context-eng",
        title: "Context Engineering",
        summary:
          "Context Engineering = CLAUDE.md + MCP + Skill의 통합. Harness 다이어그램",
      },
      {
        id: "d4-compound-eng",
        title: "Compound Engineering",
        summary:
          "Compound Engineering 풀 사이클: Build → Use → Notice → Debug → Fix → Document",
      },
      {
        id: "d4-github",
        title: "GitHub 기초",
        summary:
          "GitHub 기초: Repository, Commit, Branch, PR. git 상태 확인 실습",
      },
      {
        id: "d4-service",
        title: "서비스화",
        summary:
          "서비스화: GitHub + Vercel(자동 배포) + Supabase(데이터)",
      },
      {
        id: "d4-compound-practice",
        title: "Compound 실습",
        summary:
          "1회전: CLAUDE.md 개선 사이클 + 2회전: 스킬 개선 사이클. 디버깅 체크리스트",
      },
    ],
  },
];

export function getDayData(dayNumber: number): DayData | undefined {
  return DAYS.find((d) => d.day === dayNumber);
}
