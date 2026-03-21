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

  it("returns 401 when user is not found in database", async () => {
    mockCookieGet.mockReturnValue({ value: "nonexistent-user-id" });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: "Not found" } }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET();

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("User not found");
  });

  it("returns user data when session is valid", async () => {
    mockCookieGet.mockReturnValue({ value: "user-123" });

    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      avatar_url: "https://example.com/avatar.png",
      role: "developer",
      department: "Engineering",
      cohort: 1,
      api_token: "aicamp_testtoken",
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
    expect(json.email).toBe("test@example.com");
    expect(json.role).toBe("developer");
    expect(json.api_token).toBe("aicamp_testtoken");
  });
});
