"use client";

import ShinyText from "@/components/reactbits/ShinyText";

export default function LiveIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-camp-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-camp-accent" />
      </span>
      <ShinyText
        text="Live Leaderboard"
        className="text-xs font-medium uppercase tracking-[0.2em]"
        color="#F59E0B"
        shineColor="#FDE68A"
        speed={3}
      />
    </div>
  );
}
