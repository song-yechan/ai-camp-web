"use client";

import { useEffect, useState } from "react";
import Orb from "@/components/reactbits/Orb";

export default function AuroraBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-15"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 70% 20%, #F59E0B 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, #3B82F6 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #8B5CF6 0%, transparent 50%)",
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 opacity-60"
      aria-hidden="true"
    >
      <Orb
        hue={30}
        hoverIntensity={0.2}
        rotateOnHover
        backgroundColor="#000000"
      />
    </div>
  );
}
