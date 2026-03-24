import Leaderboard from "@/components/Leaderboard";
import HeroStats from "@/components/HeroStats";
import HeroTitle from "@/components/HeroTitle";
import HeroParticles from "@/components/HeroParticles";
import LiveIndicator from "@/components/LiveIndicator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center pb-20 md:pb-0">
      {/* Hero -- asymmetric layout */}
      <section className="relative min-h-[300px] w-full max-w-5xl px-4 pt-16 pb-12 sm:pt-20 sm:pb-16">
        {/* Background particles */}
        <HeroParticles />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Typography */}
          <div className="flex flex-col gap-4 lg:max-w-xl">
            <LiveIndicator />

            <HeroTitle />

            <p className="max-w-md text-base leading-relaxed text-camp-text-secondary">
              AB180 구성원들의 토큰 사용량을 확인하세요.
              <br className="hidden sm:block" />
              AI와 함께 일하는 시간이 경쟁력이 됩니다.
            </p>
          </div>

          {/* Right: Live stat counters */}
          <HeroStats />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="w-full max-w-5xl px-4 pb-12">
        <Leaderboard />
      </section>
    </div>
  );
}
