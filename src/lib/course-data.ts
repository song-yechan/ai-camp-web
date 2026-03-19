export interface Block {
  id: string;
  title: string;
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
      { id: "d1-setup", title: "Setup" },
      { id: "d1-concepts", title: "핵심 개념" },
      { id: "d1-experience", title: "Experience" },
      { id: "d1-7features", title: "7대 기능 (CLAUDE.md / Skill / MCP / Subagent / Agent Teams / Hook / Plugin)" },
      { id: "d1-cli-git", title: "CLI + git" },
    ],
  },
  {
    day: 2,
    title: "맥락을 연결합니다",
    description: "일하는 도구를 AI와 연결하기",
    href: "/course/day/2",
    blocks: [
      { id: "d2-context", title: "맥락의 중요성" },
      { id: "d2-philosophy", title: "도구별 설계 철학" },
      { id: "d2-mcp-deep", title: "MCP 딥다이브" },
      { id: "d2-mcp-practice", title: "MCP 실습" },
      { id: "d2-context-sync", title: "Context Sync" },
    ],
  },
  {
    day: 3,
    title: "스킬을 만듭니다",
    description: "내 머릿속을 AI가 이해하게",
    href: "/course/day/3",
    blocks: [
      { id: "d3-principle", title: "스킬 설계 원칙" },
      { id: "d3-clarify", title: "Clarify" },
      { id: "d3-skill1", title: "스킬 제작 1" },
      { id: "d3-skill2", title: "스킬 제작 2" },
      { id: "d3-chaining", title: "스킬 체이닝" },
      { id: "d3-agent", title: "에이전트 활용" },
    ],
  },
  {
    day: 4,
    title: "시스템을 만듭니다",
    description: "쓸수록 똑똑해지는 환경",
    href: "/course/day/4",
    blocks: [
      { id: "d4-context-eng", title: "Context Engineering" },
      { id: "d4-compound-eng", title: "Compound Engineering" },
      { id: "d4-github", title: "GitHub 기초" },
      { id: "d4-service", title: "서비스화" },
      { id: "d4-compound-practice", title: "Compound 실습" },
    ],
  },
];

export function getDayData(dayNumber: number): DayData | undefined {
  return DAYS.find((d) => d.day === dayNumber);
}
