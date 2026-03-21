"use client";

import Waves from "@/components/reactbits/Waves";

export default function HeroParticlesClient() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden motion-reduce:hidden">
      <Waves
        lineColor="rgba(245, 158, 11, 0.25)"
        backgroundColor="transparent"
        waveSpeedX={0.015}
        waveSpeedY={0.008}
        waveAmpX={40}
        waveAmpY={20}
        xGap={12}
        yGap={36}
        friction={0.92}
        tension={0.008}
        maxCursorMove={120}
      />
    </div>
  );
}
