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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  function handleToggleExpand(e: React.MouseEvent, blockId: string) {
    e.stopPropagation();
    setExpanded({ ...expanded, [blockId]: !expanded[blockId] });
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, index) => {
        const isDone = completed[block.id];
        const isOpen = expanded[block.id];
        return (
          <div
            key={block.id}
            className="animate-fade-rise"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <button
              type="button"
              onClick={() => handleToggle(block.id)}
              className="glass glass-hover group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-200"
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
                className={`flex-1 text-sm transition-colors ${
                  isDone
                    ? "text-camp-text-muted line-through"
                    : "text-camp-text-secondary"
                }`}
              >
                {block.title}
              </span>

              {/* Expand toggle */}
              {block.summary && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleToggleExpand(e, block.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      setExpanded({ ...expanded, [block.id]: !expanded[block.id] });
                    }
                  }}
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-camp-text-muted transition-colors hover:bg-white/[0.06] hover:text-camp-text-secondary"
                  aria-label={isOpen ? "접기" : "펼치기"}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              )}
            </button>

            {/* Summary content */}
            {block.summary && isOpen && (
              <div className="ml-12 mr-4 mt-1 mb-1 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-camp-text-secondary">
                {block.summary}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
