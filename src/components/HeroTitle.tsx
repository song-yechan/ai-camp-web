"use client";

import SplitText from "@/components/reactbits/SplitText";

export default function HeroTitle() {
  return (
    <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-camp-text sm:text-4xl lg:text-5xl">
      <SplitText
        text="더 많이 쓰는 사람이"
        className="text-camp-text"
        delay={40}
        duration={0.5}
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        textAlign="left"
      />
      <br />
      <span className="bg-gradient-to-r from-camp-accent to-camp-accent-hover bg-clip-text text-transparent">
        <SplitText
          text="더 빠르게 성장합니다"
          delay={40}
          duration={0.5}
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          textAlign="left"
        />
      </span>
    </h1>
  );
}
