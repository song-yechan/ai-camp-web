"use client";

import { useState } from "react";
import type { Block } from "@/lib/course-data";

interface BlockChecklistProps {
  dayNumber: number;
  blocks: Block[];
}

export default function BlockChecklist({
  dayNumber,
  blocks,
}: BlockChecklistProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  async function handleToggle(blockId: string) {
    const next = !completed[blockId];
    setCompleted({ ...completed, [blockId]: next });

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: dayNumber,
          blockId,
          completed: next,
        }),
      });
    } catch {
      // 실패 시 롤백
      setCompleted({ ...completed, [blockId]: !next });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block) => (
        <button
          key={block.id}
          type="button"
          onClick={() => handleToggle(block.id)}
          className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-left transition-colors hover:border-neutral-600"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
              completed[block.id]
                ? "border-white bg-white text-black"
                : "border-neutral-600 text-transparent"
            }`}
          >
            {completed[block.id] ? "\u2713" : ""}
          </span>
          <span
            className={`text-sm ${
              completed[block.id] ? "text-neutral-500 line-through" : "text-neutral-200"
            }`}
          >
            {block.title}
          </span>
        </button>
      ))}
    </div>
  );
}
