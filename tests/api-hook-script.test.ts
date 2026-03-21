import { describe, it, expect } from "vitest";

describe("GET /api/hook-script", () => {
  it("returns valid JavaScript", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("javascript");

    const script = await response.text();
    expect(script.length).toBeGreaterThan(100);
  });

  it("contains pricing table for all models", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("claude-opus-4-6");
    expect(script).toContain("claude-sonnet-4-6");
    expect(script).toContain("claude-haiku-4-5");
  });

  it("contains 5-second hard timeout", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("5000");
    expect(script).toContain("HARD_TIMEOUT");
  });

  it("uses ai-camp config directory", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("ai-camp");
    expect(script).not.toContain('"ainc"');
  });

  it("contains session cache for delta calculation", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("session-cache.json");
    expect(script).toContain("loadSessionCache");
    expect(script).toContain("saveSessionCache");
  });

  it("contains local queue for offline resilience", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("queue.jsonl");
    expect(script).toContain("enqueue");
    expect(script).toContain("drainQueue");
  });

  it("contains self-update mechanism", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("selfUpdate");
    expect(script).toContain("/api/hook-script");
  });

  it("posts to /api/usage/submit", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("/api/usage/submit");
  });

  it("uses Asia/Seoul timezone", async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("Asia/Seoul");
  });
});
