"use client";

import ReactBitsCountUp from "@/components/reactbits/CountUp";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({
  end,
  duration = 0.5,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const toValue = Number(
    decimals > 0 ? end.toFixed(decimals) : Math.round(end)
  );

  return (
    <span className="tabular-nums">
      {prefix}
      <ReactBitsCountUp
        to={toValue}
        from={0}
        duration={Math.max(duration / 1000, 0.8)}
        separator=","
      />
      {suffix}
    </span>
  );
}
