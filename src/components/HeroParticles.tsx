"use client";

import Particles from "@/components/reactbits/Particles";

export default function HeroParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      <Particles
        particleCount={100}
        particleSpread={10}
        speed={0.05}
        particleColors={["#F59E0B", "#FBBF24", "#FFFFFF"]}
        alphaParticles
        particleBaseSize={80}
        sizeRandomness={0.6}
        cameraDistance={20}
        disableRotation={false}
        moveParticlesOnHover={false}
      />
    </div>
  );
}
