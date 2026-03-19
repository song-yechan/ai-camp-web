"use client";

import dynamic from "next/dynamic";

const HeroParticlesInner = dynamic(
  () => import("@/components/HeroParticlesClient"),
  { ssr: false }
);

export default function HeroParticles() {
  return <HeroParticlesInner />;
}
