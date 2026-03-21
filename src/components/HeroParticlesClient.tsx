"use client";

import { useEffect, useState } from "react";
import Waves from "@/components/reactbits/Waves";

export default function HeroParticlesClient() {
  const [lineColor, setLineColor] = useState("rgba(245, 158, 11, 0.25)");

  useEffect(() => {
    const updateColor = () => {
      const isLight = document.documentElement.classList.contains("light");
      setLineColor(
        isLight
          ? "rgba(245, 158, 11, 0.08)"
          : "rgba(245, 158, 11, 0.25)"
      );
    };
    updateColor();

    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden motion-reduce:hidden">
      <Waves
        lineColor={lineColor}
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
