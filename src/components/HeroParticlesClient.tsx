"use client";

import PixelBlast from "@/components/reactbits/PixelBlast";

export default function HeroParticlesClient() {
  return (
    <div className="absolute inset-0 z-0 min-h-[300px] min-w-[300px] overflow-hidden motion-reduce:hidden">
      <PixelBlast
        className="h-full w-full"
        color="#D97706"
        variant="square"
        pixelSize={3}
        patternScale={2}
        patternDensity={0.8}
        enableRipples
        rippleSpeed={0.3}
        rippleThickness={0.1}
        rippleIntensityScale={1}
        liquid
        liquidStrength={0.1}
        liquidRadius={1}
        edgeFade={0.4}
        speed={0.5}
      />
    </div>
  );
}
