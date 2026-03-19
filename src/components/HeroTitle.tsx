"use client";

import SplitText from "@/components/reactbits/SplitText";

export default function HeroTitle() {
  return (
    <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
      <SplitText
        text="더 많이 쓰는 사람이"
        className="text-white"
        delay={40}
        duration={0.5}
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        textAlign="left"
      />
      <br />
      <SplitText
        text="더 빠르게 성장합니다"
        className="text-camp-accent"
        delay={40}
        duration={0.5}
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        textAlign="left"
      />
    </h1>
  );
}
