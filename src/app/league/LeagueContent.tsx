"use client";

import { useEffect, useState } from "react";

type Category = "all" | "non-dev" | "dev";

interface UsageEntry {
  rank: number;
  name: string;
  avatar: string;
  tokenCost: number;
  sessions: number;
}

const TABS: { key: Category; label: string; emoji: string }[] = [
  { key: "all", label: "전체", emoji: "\uD83C\uDFC6" },
  { key: "non-dev", label: "비개발자", emoji: "\u2728" },
  { key: "dev", label: "개발자", emoji: "\uD83D\uDCBB" },
];

export default function LeagueContent() {
  const [category, setCategory] = useState<Category>("all");
  const [data, setData] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage?period=all&category=${category}`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setCategory(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              category === tab.key
                ? "bg-white text-black"
                : "border border-[#2a2a2a] bg-[#1a1a1a] text-neutral-400 hover:text-white"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#111]">
              <th className="px-4 py-3 font-medium text-neutral-400">#</th>
              <th className="px-4 py-3 font-medium text-neutral-400">이름</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-400">
                토큰 비용
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-400">
                세션 수
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  불러오는 중...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  아직 데이터가 없습니다
                </td>
              </tr>
            ) : (
              data.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-b border-[#2a2a2a] last:border-b-0"
                >
                  <td className="px-4 py-3 text-neutral-300">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-xs">
                        {entry.avatar}
                      </span>
                      <span className="text-white">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-300">
                    ${entry.tokenCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-300">
                    {entry.sessions}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
