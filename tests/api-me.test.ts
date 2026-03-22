import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers cookies
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
    getAll: () => [],
    set: vi.fn(),
  })),
}));

// Mock session verification
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn((cookie: string) => {
    // "signed-user-123" → "user-123", "invalid" → null
    if (cookie.startsWith("signed-")) return cookie.slice(7);
    return null;
  }),
  signSession: vi.fn((id: string) => `signed-${id}`),
}));

// Mock Supabase
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

const { GET } = await import("@/app/api/me/route");

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
  });

  it("returns 401 when session cookie is not present", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await GET();

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Not authenticated");
  });

  it("returns 401 when session signature is invalid", async () => {
    mockCookieGet.mockReturnValue({ value: "invalid-cookie" });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns user data when session is valid", async () => {
    mockCookieGet.mockReturnValue({ value: "signed-user-123" });

    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      avatar_url: "https://example.com/avatar.png",
      role: "developer",
      department: "Engineering",
      cohort: 1,
      api_token: "aicamp_testtoken",
      setup_completed: true,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockUser, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("user-123");
    expect(json.name).toBe("Test User");
  });
});
