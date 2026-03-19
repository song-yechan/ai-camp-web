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
      setCompleted({ ...completed, [blockId]: !next });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, index) => {
        const isDone = completed[block.id];
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => handleToggle(block.id)}
            className="animate-fade-rise glass glass-hover group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-200"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Left accent bar */}
            <span
              className={`absolute top-0 bottom-0 left-0 w-0.5 transition-colors duration-300 ${
                isDone
                  ? "bg-camp-accent"
                  : "bg-transparent group-hover:bg-camp-accent/30"
              }`}
            />

            {/* Custom checkbox */}
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all duration-200 ${
                isDone
                  ? "border-camp-accent bg-camp-accent text-black"
                  : "border-white/10 text-transparent"
              }`}
            >
              {isDone ? "\u2713" : ""}
            </span>

            <span
              className={`text-sm transition-colors ${
                isDone
                  ? "text-camp-text-muted line-through"
                  : "text-camp-text-secondary"
              }`}
            >
              {block.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
