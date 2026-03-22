"use client";

import DecryptedText from "@/components/reactbits/DecryptedText";

export default function HeroTitle() {
  return (
    <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-camp-text sm:text-4xl lg:text-5xl">
      <DecryptedText
        text="더 많이 쓰는 사람이"
        speed={80}
        animateOn="view"
        sequential
        revealDirection="start"
        className="text-camp-text"
      />
      <br />
      <DecryptedText
        text="더 빠르게 성장합니다"
        speed={80}
        animateOn="view"
        sequential
        revealDirection="start"
        className="text-camp-accent"
      />
    </h1>
  );
}
