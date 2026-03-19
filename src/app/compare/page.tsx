import { Suspense } from "react";
import CompareClient from "./CompareClient";

function CompareLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-camp-accent" />
        <span className="text-sm text-camp-text-secondary">불러오는 중...</span>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 pb-20 md:pb-12">
      <Suspense fallback={<CompareLoading />}>
        <CompareClient />
      </Suspense>
    </div>
  );
}
