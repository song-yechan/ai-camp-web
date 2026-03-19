"use client";

import Particles from "@/components/reactbits/Particles";

export default function HeroParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      <Particles
        particleCount={80}
        particleSpread={8}
        speed={0.05}
        particleColors={["#F59E0B", "#EAB308", "#3B82F6"]}
        alphaParticles
        particleBaseSize={60}
        sizeRandomness={0.8}
        cameraDistance={25}
        disableRotation={false}
        moveParticlesOnHover={false}
      />
    </div>
  );
}
