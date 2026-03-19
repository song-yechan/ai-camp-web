"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words";
  from?: Record<string, number>;
  to?: Record<string, number>;
  threshold?: number;
  textAlign?: "left" | "center" | "right";
  onLetterAnimationComplete?: () => void;
}

export default function SplitText({
  text,
  className = "",
  delay = 50,
  duration = 0.6,
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    once: true,
    amount: threshold,
  });
  const [hasTriggered, setHasTriggered] = useState(false);
  const completedRef = useRef(0);

  useEffect(() => {
    if (isInView && !hasTriggered) {
      setHasTriggered(true);
    }
  }, [isInView, hasTriggered]);

  const getElements = useCallback(() => {
    if (splitType === "words") {
      return text.split(/(\s+)/).filter((s) => s.length > 0);
    }
    return text.split("");
  }, [text, splitType]);

  const elements = getElements();
  const animatableCount = elements.filter(
    (el) => !(splitType === "words" && /^\s+$/.test(el))
  ).length;

  let animatableIndex = 0;

  return (
    <div
      ref={containerRef}
      className={`inline-block overflow-hidden whitespace-normal ${className}`}
      style={{ textAlign, wordWrap: "break-word" }}
    >
      {elements.map((element, index) => {
        const isSpace =
          element === " " || (splitType === "words" && /^\s+$/.test(element));

        if (isSpace) {
          return (
            <span key={index} className="inline-block">
              &nbsp;
            </span>
          );
        }

        const currentAnimIndex = animatableIndex;
        animatableIndex++;

        return (
          <motion.span
            key={index}
            className="inline-block will-change-transform"
            initial={from}
            animate={hasTriggered ? to : from}
            transition={{
              duration,
              delay: currentAnimIndex * (delay / 1000),
              ease: [0.215, 0.61, 0.355, 1],
            }}
            onAnimationComplete={() => {
              completedRef.current += 1;
              if (
                completedRef.current >= animatableCount &&
                onLetterAnimationComplete
              ) {
                onLetterAnimationComplete();
              }
            }}
          >
            {element}
          </motion.span>
        );
      })}
    </div>
  );
}
