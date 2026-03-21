import { describe, it, expect } from "vitest";

// GET /api/setup의 bash 스크립트를 직접 import할 수 없으므로
// route handler를 직접 호출하여 반환된 스크립트를 검증

describe("GET /api/setup", () => {
  it("returns valid bash script", async () => {
    const { GET } = await import("@/app/api/setup/route");
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("text/plain");

    const script = await response.text();
    expect(script).toContain("#!/bin/bash");
    expect(script).toContain("set -e");
  });

  it("contains token validation", async () => {
    const { GET } = await import("@/app/api/setup/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("aicamp_");
    expect(script).toContain("Invalid token");
  });

  it("contains all 5 setup steps", async () => {
    const { GET } = await import("@/app/api/setup/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("[1/5]");
    expect(script).toContain("[2/5]");
    expect(script).toContain("[3/5]");
    expect(script).toContain("[4/5]");
    expect(script).toContain("[5/5]");
  });

  it("saves config to ~/.config/ai-camp/", async () => {
    const { GET } = await import("@/app/api/setup/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain(".config/ai-camp");
    expect(script).toContain("chmod 600");
  });

  it("registers Stop hook in settings.json", async () => {
    const { GET } = await import("@/app/api/setup/route");
    const response = await GET();
    const script = await response.text();

    expect(script).toContain("settings.json");
    expect(script).toContain("hooks.Stop");
    expect(script).toContain("report-usage");
  });

  it("injects APP_URL from environment", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://test.example.com";
    // Re-import to pick up env change
    const mod = await import("@/app/api/setup/route");
    const response = await mod.GET();
    const script = await response.text();

    expect(script).toContain("https://test.example.com");
    expect(script).not.toContain("__APP_URL__");

    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
